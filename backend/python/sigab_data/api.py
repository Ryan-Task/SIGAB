from __future__ import annotations

from datetime import datetime, timezone
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .bmkg import BMKGClient, BMKGError
from .drainage import DrainageDataError, load_drainage_scores
from .environment import (
    EnvironmentDataError,
    fetch_drainage_proxies,
    fetch_elevation_scores,
    fetch_river_distances,
)
from .models import AreaInput
from .risk import RuleBasedRiskModel, rainfall_risk
from .regions import RegionDiscoveryError, discover_area_codes

app = FastAPI(
    title="SIGAB Prediction API",
    version="1.0.0",
    description="BMKG ingestion and explainable flood-risk predictions.",
)


class PredictionRequest(BaseModel):
    adm4: list[str] | None = Field(default=None, max_length=100)
    history_score: float | None = Field(default=None, ge=0, le=100)
    environment_score: float | None = Field(default=None, ge=0, le=100)
    drainage_score: float | None = Field(default=None, ge=0, le=100)


class PredictionResponse(BaseModel):
    metadata: dict
    areas: list[dict]
    rainfall_records: list[dict]
    predictions: list[dict]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "sigab-prediction-api"}


@app.post("/v1/predictions", response_model=PredictionResponse)
def predict(request: PredictionRequest) -> PredictionResponse:
    area_codes = request.adm4 or [
        code.strip()
        for code in os.getenv("SIGAB_BMKG_ADM4", "").split(",")
        if code.strip()
    ]
    if not area_codes:
        try:
            area_codes = discover_area_codes()
        except (RegionDiscoveryError, ValueError) as error:
            raise HTTPException(status_code=502, detail=str(error)) from error
    client = BMKGClient()
    model = RuleBasedRiskModel()
    records: list[dict] = []
    areas: list[dict] = []
    predictions: list[dict] = []
    errors: list[dict[str, str]] = []
    records_by_code: dict[str, list] = {}

    for area_code in area_codes:
        try:
            area_records, area = client.fetch_forecast_with_area(area_code)
            areas.append(area)
            records_by_code[area_code] = area_records
        except BMKGError as error:
            errors.append({"area_code": area_code, "error": str(error)})

    environment_scores: dict[str, dict] = {}
    drainage_scores: dict[str, dict] = {}
    try:
        drainage_scores = load_drainage_scores()
    except DrainageDataError as error:
        errors.append({"source": "Manual drainage dataset", "error": str(error)})
    if os.getenv("SIGAB_ENVIRONMENT_DRAINAGE_ENABLED", "1").lower() not in {"0", "false", "no"}:
        try:
            mapped_drainage = fetch_drainage_proxies(areas)
            for code, proxy in mapped_drainage.items():
                drainage_scores.setdefault(code, proxy)
        except EnvironmentDataError as error:
            errors.append({"source": "OpenStreetMap Overpass drainage", "error": str(error)})
    try:
        environment_scores = fetch_elevation_scores(areas)
        if os.getenv("SIGAB_ENVIRONMENT_RIVER_ENABLED", "1").lower() not in {"0", "false", "no"}:
            try:
                river_scores = fetch_river_distances(areas)
                for code, river in river_scores.items():
                    environment_scores.setdefault(code, {}).update(river)
                    elevation = environment_scores[code].get("score")
                    distance = river.get("river_distance_m")
                    river_score = (
                        max(0.0, min(70.0, (1000.0 - float(distance)) / 1000.0 * 70.0))
                        if distance is not None else None
                    )
                    components = [value for value in (elevation, river_score) if value is not None]
                    if components:
                        environment_scores[code]["score"] = round(sum(components) / len(components), 2)
                        environment_scores[code]["environment_components"] = {
                            "elevation_score": elevation,
                            "river_proximity_score": river_score,
                        }
                        environment_scores[code]["method"] = "elevation_and_river_proximity_proxy"
            except EnvironmentDataError as error:
                errors.append({"source": "OpenStreetMap Overpass", "error": str(error)})
    except EnvironmentDataError as error:
        errors.append({"source": "Open-Meteo", "error": str(error)})

    for area in areas:
        area_code = str(area["code"])
        try:
            area_records = records_by_code[area_code]
            records.extend(record.to_dict() for record in area_records)
            latest = next(
                (record.rainfall_mm for record in area_records if record.rainfall_mm is not None),
                None,
            )
            rainfall_component = rainfall_risk(area_records)
            wet_records = [
                record for record in area_records
                if record.rainfall_mm is not None and float(record.rainfall_mm) > 0
            ]
            rain_start = min((record.observed_at for record in wet_records), default=None)
            rain_end = max((record.observed_at for record in wet_records), default=None)
            rain_end_record = next(
                (record for record in wet_records if record.observed_at == rain_end),
                None,
            )
            rain_duration_hours = (
                round(
                    (rain_end - rain_start).total_seconds() / 3600
                    + (rain_end_record.period_hours or 0),
                    1,
                )
                if rain_start is not None and rain_end is not None and rain_end_record is not None
                else 0
            )
            environment = environment_scores.get(area_code)
            environment_score = (
                request.environment_score
                if request.environment_score is not None
                else environment["score"]
                if environment and environment.get("status") == "available"
                else None
            )
            drainage = drainage_scores.get(area_code)
            drainage_score = (
                request.drainage_score
                if request.drainage_score is not None
                else drainage["score"]
                if drainage
                else None
            )
            if drainage_score == 0:
                drainage_score = None
            component_metadata = {
                "rainfall": {
                    "quality_score": 0.8 if rainfall_component is not None else 0.0,
                    "coverage_score": 1.0,
                    "age_score": 0.8 if latest is not None else 0.0,
                },
                "history": {
                    "quality_score": 0.9 if request.history_score is not None else 0.0,
                    "coverage_score": 1.0 if request.history_score is not None else 0.0,
                    "age_score": 0.9 if request.history_score is not None else 0.0,
                },
                "environment": {
                    "quality_score": 0.7 if environment_score is not None else 0.0,
                    "coverage_score": 1.0 if environment_score is not None else 0.0,
                    "age_score": 1.0 if environment_score is not None else 0.0,
                },
                "drainage": {
                    "quality_score": 0.9 if drainage_score is not None else 0.0,
                    "coverage_score": 1.0 if drainage_score is not None else 0.0,
                    "age_score": 1.0 if drainage_score is not None else 0.0,
                },
            }
            prediction = model.predict(
                AreaInput(
                    area_code=area_code,
                    rainfall_score=rainfall_component,
                    history_score=request.history_score,
                    environment_score=environment_score,
                    drainage_score=drainage_score,
                    data_as_of=datetime.now(timezone.utc),
                    component_metadata=component_metadata,
                )
            ).to_dict()
            components = prediction["explanation"]
            components["sources"] = {
                "rainfall": {
                    "provider": "BMKG",
                    "url": "https://api.bmkg.go.id/publik/prakiraan-cuaca",
                    "status": "available" if latest is not None else "unavailable",
                    "peak_mm": max(
                        (float(record.rainfall_mm) for record in area_records if record.rainfall_mm is not None),
                        default=None,
                    ),
                    "accumulated_mm": round(
                        sum(float(record.rainfall_mm) for record in area_records if record.rainfall_mm is not None), 2
                    ),
                    "wet_slots": sum(
                        1 for record in area_records
                        if record.rainfall_mm is not None and float(record.rainfall_mm) > 0
                    ),
                    "rain_start_at": rain_start.isoformat() if rain_start else None,
                    "rain_end_at": rain_end.isoformat() if rain_end else None,
                    "rain_duration_hours": rain_duration_hours,
                    "fetched_at": datetime.now(timezone.utc).isoformat(),
                },
                "history": {
                    "provider": "DIBI BNPB",
                    "url": "https://dibi.bnpb.go.id/superset/dashboard/2/",
                    "status": "not_imported",
                },
                "environment": {
                    "provider": environment["provider"] if environment else (
                        "Pipeline input" if request.environment_score is not None else "Open-Meteo"
                    ),
                    "url": environment["url"] if environment else (
                        "https://open-meteo.com/" if request.environment_score is None else ""
                    ),
                    "status": environment.get("status", "unavailable") if environment else "unavailable",
                    "method": environment["method"] if environment else (
                        "provided_score" if request.environment_score is not None else "elevation_proxy"
                    ),
                    "elevation_m": environment["elevation_m"] if environment else None,
                    "river_distance_m": environment.get("river_distance_m") if environment else None,
                    "river_provider": environment.get("provider") if environment and environment.get("river_distance_m") is not None else None,
                    "river_fetched_at": environment.get("fetched_at") if environment and environment.get("river_distance_m") is not None else None,
                    "environment_components": environment.get("environment_components") if environment else None,
                    "latitude": environment["latitude"] if environment else area.get("latitude"),
                    "longitude": environment["longitude"] if environment else area.get("longitude"),
                    "fetched_at": environment["fetched_at"] if environment else None,
                },
                "drainage": drainage or {
                    "provider": "Manual survey / local authority or OpenStreetMap Overpass",
                    "url": "",
                    "status": "provided_score" if request.drainage_score is not None else "not_imported",
                    "method": "provided_score" if request.drainage_score is not None else "manual_numeric_score",
                },
            }
            if drainage and drainage.get("score") == 0:
                components["sources"]["drainage"]["status"] = "unavailable"
                components["sources"]["drainage"]["method"] = "nearest_mapped_drainage_quality_proxy"
                components["sources"]["drainage"]["caveat"] = (
                    "Tidak ada jaringan drainase yang terpetakan dekat. "
                    "Nilai 0 tidak dimasukkan ke perhitungan risiko."
                )
            if drainage and drainage.get("components"):
                components["sources"]["drainage"]["drainage_components"] = drainage["components"]
                components["sources"]["drainage"]["drainage_component_weights"] = drainage["component_weights"]
            components["completeness"] = (
                "complete" if len(components["available_components"]) == 4
                else "partial" if len(components["available_components"]) >= 2
                else "limited"
            )
            missing = set({"rainfall", "history", "environment", "drainage"}) - set(components["available_components"])
            components["caveat"] = (
                f"Data belum lengkap ({', '.join(sorted(missing))}). "
                "Skor memakai komponen yang tersedia sehingga dapat berubah saat data tambahan masuk."
                if missing
                else "Perhitungan menggunakan seluruh komponen data yang tersedia."
            )
            predictions.append(prediction)
        except BMKGError as error:
            errors.append({"area_code": area_code, "error": str(error)})

    if not predictions and errors:
        raise HTTPException(status_code=502, detail={"errors": errors})

    return PredictionResponse(
        metadata={
            "source": "BMKG",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "errors": errors,
            "method_version": model.method_version,
        },
        areas=areas,
        rainfall_records=records,
        predictions=predictions,
    )
