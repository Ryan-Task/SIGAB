from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from .models import RainfallRecord

DEFAULT_BASE_URL = "https://api.bmkg.go.id/publik"


class BMKGError(RuntimeError):
    """Raised when BMKG data cannot be fetched or validated."""


def _area_metadata(payload: dict[str, Any], area_code: str) -> dict[str, Any]:
    location = payload.get("lokasi")
    if not isinstance(location, dict) and isinstance(payload.get("data"), list):
        first = payload["data"][0] if payload["data"] else {}
        location = first.get("lokasi") if isinstance(first, dict) else {}
    location = location if isinstance(location, dict) else {}
    province_code, regency_code, *_ = area_code.split(".") + [None, None]
    return {
        "code": str(location.get("adm4") or area_code),
        "name": str(location.get("desa") or area_code),
        "level": "village",
        "district": location.get("kecamatan"),
        "regency": location.get("kotkab"),
        "province": location.get("provinsi"),
        "regency_code": ".".join([province_code, regency_code]) if regency_code else None,
        "province_code": province_code,
        "latitude": location.get("lat"),
        "longitude": location.get("lon"),
    }


def _parse_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed


def _as_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise BMKGError(f"Invalid rainfall value: {value!r}") from error
    if number < 0:
        raise BMKGError(f"Rainfall cannot be negative: {number}")
    return number


def _forecast_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for group in payload.get("cuaca", []):
        if not isinstance(group, list):
            continue
        items.extend(item for item in group if isinstance(item, dict))
    if not items and isinstance(payload.get("data"), list):
        for area_data in payload["data"]:
            if not isinstance(area_data, dict):
                continue
            for group in area_data.get("cuaca", []):
                if isinstance(group, list):
                    items.extend(item for item in group if isinstance(item, dict))
    return items


def parse_forecast_payload(
    payload: dict[str, Any], area_code: str, source: str = "BMKG"
) -> list[RainfallRecord]:
    records: list[RainfallRecord] = []
    for item in _forecast_items(payload):
        timestamp = item.get("datetime") or item.get("local_datetime")
        if not isinstance(timestamp, str):
            continue
        rainfall = next(
            (item.get(key) for key in ("tp", "rainfall", "precipitation") if key in item),
            None,
        )
        records.append(
            RainfallRecord(
                area_code=area_code,
                observed_at=_parse_datetime(timestamp),
                period_hours=3,
                rainfall_mm=_as_float(rainfall),
                quality_status="forecast",
                data_source=source,
                raw_metadata=item,
            )
        )
    return records


class BMKGClient:
    def __init__(
        self,
        base_url: str | None = None,
        timeout_seconds: int = 20,
    ) -> None:
        self.base_url = (base_url or os.getenv("SIGAB_BMKG_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.request_delay_seconds = float(os.getenv("SIGAB_BMKG_REQUEST_DELAY_SECONDS", "1"))
        self.max_retries = int(os.getenv("SIGAB_BMKG_MAX_RETRIES", "4"))

    def fetch_forecast(self, area_code: str) -> list[RainfallRecord]:
        records, _ = self.fetch_forecast_with_area(area_code)
        return records

    def fetch_forecast_with_area(
        self, area_code: str
    ) -> tuple[list[RainfallRecord], dict[str, Any]]:
        url = f"{self.base_url}/prakiraan-cuaca?adm4={quote(area_code, safe='')}"
        request = Request(url, headers={"Accept": "application/json", "User-Agent": "SIGAB/1.0"})
        if self.request_delay_seconds > 0:
            time.sleep(self.request_delay_seconds)
        for attempt in range(self.max_retries + 1):
            try:
                with urlopen(request, timeout=self.timeout_seconds) as response:
                    payload = json.load(response)
                break
            except HTTPError as error:
                if error.code != 429 or attempt >= self.max_retries:
                    raise BMKGError(f"BMKG request failed for {area_code}: {error}") from error
                retry_after = error.headers.get("Retry-After")
                try:
                    wait_seconds = float(retry_after) if retry_after else 0
                except ValueError:
                    wait_seconds = 0
                wait_seconds = max(wait_seconds, min(60, 5 * (2**attempt)))
                print(
                    f"BMKG rate limit untuk {area_code}; percobaan ulang "
                    f"{attempt + 1}/{self.max_retries} dalam {wait_seconds:g} detik.",
                    flush=True,
                )
                time.sleep(wait_seconds)
            except (URLError, TimeoutError, json.JSONDecodeError, OSError) as error:
                raise BMKGError(f"BMKG request failed for {area_code}: {error}") from error
        if not isinstance(payload, dict):
            raise BMKGError("BMKG response must be a JSON object")
        return parse_forecast_payload(payload, area_code), _area_metadata(payload, area_code)
