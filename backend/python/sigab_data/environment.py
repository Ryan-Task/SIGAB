from __future__ import annotations

import json
import math
import os
import time
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class EnvironmentDataError(RuntimeError):
    """Raised when the environment provider returns unusable data."""


def _distance_to_segment_meters(
    latitude: float,
    longitude: float,
    start: list[float],
    end: list[float],
) -> float:
    scale = 111_320.0
    px, py = longitude * scale * math.cos(math.radians(latitude)), latitude * scale
    ax, ay = start[1] * scale * math.cos(math.radians(latitude)), start[0] * scale
    bx, by = end[1] * scale * math.cos(math.radians(latitude)), end[0] * scale
    dx, dy = bx - ax, by - ay
    denominator = dx * dx + dy * dy
    factor = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / denominator)) if denominator else 0.0
    return math.hypot(px - (ax + factor * dx), py - (ay + factor * dy))


def fetch_river_distances(
    areas: list[dict],
    base_url: str = "https://overpass-api.de/api/interpreter",
) -> dict[str, dict]:
    positioned = [
        area for area in areas
        if area.get("code") and area.get("latitude") is not None and area.get("longitude") is not None
    ]
    if not positioned:
        return {}
    margin = float(os.getenv("SIGAB_RIVER_QUERY_MARGIN_DEGREES", "0.05"))
    south = min(float(area["latitude"]) for area in positioned) - margin
    north = max(float(area["latitude"]) for area in positioned) + margin
    west = min(float(area["longitude"]) for area in positioned) - margin
    east = max(float(area["longitude"]) for area in positioned) + margin
    query = (
        f"[out:json][timeout:60];way[waterway~\"river|stream|canal\"]"
        f"({south},{west},{north},{east});out geom;"
    )
    request = Request(
        base_url,
        data=query.encode("utf-8"),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "SIGAB/1.0 environmental-risk-research",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=90) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (OSError, ValueError) as error:
        raise EnvironmentDataError(f"OpenStreetMap river request failed: {error}") from error

    ways = payload.get("elements", []) if isinstance(payload, dict) else []
    fetched_at = datetime.now(timezone.utc).isoformat()
    result: dict[str, dict] = {}
    for area in positioned:
        latitude, longitude = float(area["latitude"]), float(area["longitude"])
        nearest = math.inf
        for way in ways:
            geometry = way.get("geometry", [])
            for start, end in zip(geometry, geometry[1:]):
                nearest = min(
                    nearest,
                    _distance_to_segment_meters(
                        latitude,
                        longitude,
                        [float(start["lat"]), float(start["lon"])],
                        [float(end["lat"]), float(end["lon"])],
                    ),
                )
        result[str(area["code"])] = {
            "status": "available" if math.isfinite(nearest) else "unavailable",
            "river_distance_m": round(nearest, 2) if math.isfinite(nearest) else None,
            "provider": "OpenStreetMap Overpass",
            "url": base_url,
            "fetched_at": fetched_at,
            "method": "nearest_waterway_geometry",
            "query_bbox": [south, west, north, east],
        }
    return result


def fetch_elevation_scores(
    areas: list[dict],
    base_url: str = "https://api.open-meteo.com/v1/forecast",
) -> dict[str, dict]:
    positioned = [
        area for area in areas
        if area.get("code") and area.get("latitude") is not None and area.get("longitude") is not None
    ]
    if not positioned:
        return {}

    query = urlencode({
        "latitude": ",".join(str(area["latitude"]) for area in positioned),
        "longitude": ",".join(str(area["longitude"]) for area in positioned),
        "current": "temperature_2m",
        "timezone": "UTC",
    })
    request = Request(f"{base_url}?{query}", headers={"Accept": "application/json"})
    try:
        with urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (OSError, ValueError) as error:
        raise EnvironmentDataError(f"Open-Meteo environment request failed: {error}") from error

    results = payload if isinstance(payload, list) else [payload]
    if len(results) != len(positioned):
        raise EnvironmentDataError("Open-Meteo returned an unexpected number of locations")

    fetched_at = datetime.now(timezone.utc).isoformat()
    scores: dict[str, dict] = {}
    for area, result in zip(positioned, results):
        elevation = result.get("elevation")
        response_latitude = result.get("latitude")
        response_longitude = result.get("longitude")
        coordinates_match = (
            isinstance(response_latitude, (int, float))
            and isinstance(response_longitude, (int, float))
            and abs(float(response_latitude) - float(area["latitude"])) <= 0.2
            and abs(float(response_longitude) - float(area["longitude"])) <= 0.2
        )
        base_metadata = {
            "latitude": float(area["latitude"]),
            "longitude": float(area["longitude"]),
            "provider": "Open-Meteo",
            "url": "https://open-meteo.com/",
            "fetched_at": fetched_at,
            "method": "elevation_proxy",
            "response_latitude": response_latitude,
            "response_longitude": response_longitude,
            "coordinates_match": coordinates_match,
        }
        if not coordinates_match or not isinstance(elevation, (int, float)):
            scores[str(area["code"])] = {
                **base_metadata,
                "status": "unavailable",
                "score": None,
            }
            continue
        # Lower elevation is a transparent, coarse flood susceptibility proxy.
        score = round(max(0.0, min(100.0, (200.0 - float(elevation)) / 200.0 * 100.0)), 2)
        scores[str(area["code"])] = {
            **base_metadata,
            "status": "available",
            "score": score,
            "elevation_m": round(float(elevation), 2),
        }
    return scores

