from __future__ import annotations

import csv
import os
from datetime import datetime
from pathlib import Path
from typing import Any


class DrainageDataError(RuntimeError):
    """Raised when the optional manual drainage dataset is invalid."""


def _default_path() -> Path:
    return Path(__file__).resolve().parents[2] / "storage" / "app" / "private" / "drainage-scores.csv"


def load_drainage_scores(path: str | None = None) -> dict[str, dict[str, Any]]:
    configured_path = path or os.getenv("SIGAB_DRAINAGE_DATA_PATH")
    file_path = Path(configured_path) if configured_path else _default_path()
    if not file_path.exists():
        return {}
    if not file_path.is_file():
        raise DrainageDataError(f"Drainage data path is not a file: {file_path}")

    required = {"area_code", "source", "observed_at"}
    component_weights = {
        "physical_condition_score": 0.30,
        "capacity_score": 0.25,
        "coverage_score": 0.15,
        "maintenance_score": 0.15,
        "obstruction_score": 0.15,
    }
    result: dict[str, dict[str, Any]] = {}
    try:
        with file_path.open(newline="", encoding="utf-8-sig") as file:
            reader = csv.DictReader(file)
            if not reader.fieldnames or not required.issubset(reader.fieldnames):
                raise DrainageDataError(
                    "Drainage CSV must contain: area_code, source, observed_at, "
                    "and drainage_score or all five drainage component columns"
                )
            for row_number, row in enumerate(reader, start=2):
                code = (row.get("area_code") or "").strip()
                source = (row.get("source") or "").strip()
                observed_at = (row.get("observed_at") or "").strip()
                if not code or not source or not observed_at:
                    raise DrainageDataError(f"Drainage CSV row {row_number} has empty required values")
                component_values: dict[str, float] = {}
                try:
                    if row.get("drainage_score"):
                        score = float(row["drainage_score"])
                        components = None
                    elif all(row.get(name) for name in component_weights):
                        components = {
                            name: float(row[name]) for name in component_weights
                        }
                        score = sum(
                            components[name] * weight
                            for name, weight in component_weights.items()
                        )
                        component_values = components
                    else:
                        raise ValueError("missing drainage score or component scores")
                    datetime.fromisoformat(observed_at.replace("Z", "+00:00"))
                except (TypeError, ValueError) as error:
                    raise DrainageDataError(
                        f"Invalid drainage score or observed_at on row {row_number}"
                    ) from error
                if not 0 <= score <= 100 or any(
                    not 0 <= value <= 100 for value in component_values.values()
                ):
                    raise DrainageDataError(f"Drainage score on row {row_number} must be between 0 and 100")
                result[code] = {
                    "score": round(score, 2),
                    "components": component_values or None,
                    "component_weights": component_weights if component_values else None,
                    "source": source,
                    "observed_at": observed_at,
                    "provider": "Manual survey / local authority",
                    "url": "",
                    "status": "available",
                    "method": "manual_components_weighted" if component_values else "manual_numeric_score",
                }
    except OSError as error:
        raise DrainageDataError(f"Cannot read drainage CSV: {error}") from error
    return result
