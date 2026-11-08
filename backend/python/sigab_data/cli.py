from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from .bmkg import BMKGClient, BMKGError
from .models import AreaInput
from .risk import RuleBasedRiskModel, rainfall_score


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fetch BMKG data and calculate SIGAB risk")
    parser.add_argument("--adm4", action="append", help="BMKG administrative code; repeatable")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--history-score", type=float)
    parser.add_argument("--environment-score", type=float)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    area_codes = args.adm4 or [
        code.strip()
        for code in os.getenv("SIGAB_BMKG_ADM4", "").split(",")
        if code.strip()
    ]
    if not area_codes:
        raise SystemExit("Provide --adm4 or SIGAB_BMKG_ADM4")

    client = BMKGClient()
    model = RuleBasedRiskModel()
    records = []
    areas = []
    predictions = []
    errors = []
    for area_code in area_codes:
        try:
            area_records, area = client.fetch_forecast_with_area(area_code)
            areas.append(area)
            records.extend(record.to_dict() for record in area_records)
            values = [record.rainfall_mm for record in area_records if record.rainfall_mm is not None]
            latest_rainfall = values[0] if values else None
            prediction = model.predict(
                AreaInput(
                    area_code=area_code,
                    rainfall_score=rainfall_score(latest_rainfall),
                    history_score=args.history_score,
                    environment_score=args.environment_score,
                    data_as_of=datetime.now(timezone.utc),
                )
            )
            predictions.append(prediction.to_dict())
        except BMKGError as error:
            errors.append({"area_code": area_code, "error": str(error)})

    output = {
        "metadata": {
            "source": "BMKG",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "errors": errors,
        },
        "areas": areas,
        "rainfall_records": records,
        "predictions": predictions,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2), encoding="utf-8")
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
