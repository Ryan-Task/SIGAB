from __future__ import annotations

import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import lru_cache
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

DEFAULT_REGION_BASE_URL = "https://wilayah.id/api"
FOCUS_REGENCY_CODES = ("35.15", "35.78")


class RegionDiscoveryError(RuntimeError):
    """Raised when the administrative region catalog cannot be loaded."""


def _get_json(path: str) -> dict[str, Any]:
    base_url = os.getenv("SIGAB_REGION_BASE_URL", DEFAULT_REGION_BASE_URL).rstrip("/")
    request = Request(
        f"{base_url}/{quote(path, safe='/.:')}",
        headers={"Accept": "application/json", "User-Agent": "SIGAB/1.0"},
    )
    try:
        with urlopen(request, timeout=30) as response:
            payload = json.load(response)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, OSError) as error:
        raise RegionDiscoveryError(f"Region catalog request failed: {error}") from error
    if not isinstance(payload, dict) or not isinstance(payload.get("data"), list):
        raise RegionDiscoveryError("Region catalog response has an invalid shape")
    return payload


def _items(path: str) -> list[dict[str, str]]:
    return [
        {"code": str(item["code"]), "name": str(item["name"])}
        for item in _get_json(path)["data"]
        if isinstance(item, dict) and "code" in item and "name" in item
    ]


def _items_many(paths: list[str], label: str) -> list[dict[str, str]]:
    if not paths:
        return []
    workers = int(os.getenv("SIGAB_REGION_WORKERS", "8"))
    if workers < 1 or workers > 32:
        raise ValueError("SIGAB_REGION_WORKERS must be between 1 and 32")

    items: list[dict[str, str]] = []
    failures: list[str] = []
    completed = 0
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(_items, path): path for path in paths}
        for future in as_completed(futures):
            path = futures[future]
            completed += 1
            try:
                items.extend(future.result())
            except RegionDiscoveryError:
                failures.append(path)
            if completed == len(paths) or completed % 25 == 0:
                print(
                    f"Katalog {label}: {completed}/{len(paths)} endpoint selesai.",
                    flush=True,
                )
    if failures:
        sample = ", ".join(failures[:3])
        raise RegionDiscoveryError(
            f"Gagal memuat {len(failures)} endpoint katalog {label}; contoh: {sample}"
        )
    return items


@lru_cache(maxsize=8)
def discover_area_codes(scope: str | None = None) -> list[str]:
    """Discover village/kelurahan codes without manually listing every area.

    Supported scopes: ``sidoarjo-surabaya``, ``indonesia``, ``province:35``,
    and ``regency:35.15``.
    """
    selected_scope = scope or os.getenv("SIGAB_AREA_SCOPE", "sidoarjo-surabaya")
    if selected_scope == "indonesia":
        provinces = _items("provinces.json")
        regency_paths = [f"regencies/{province['code']}.json" for province in provinces]
        regencies = _items_many(regency_paths, "kabupaten/kota")
    elif selected_scope.startswith("province:"):
        province_code = selected_scope.removeprefix("province:")
        regencies = _items(f"regencies/{province_code}.json")
    elif selected_scope.startswith("regency:"):
        regencies = [{"code": selected_scope.removeprefix("regency:"), "name": ""}]
    elif selected_scope == "sidoarjo-surabaya":
        focus_codes = set(FOCUS_REGENCY_CODES)
        regencies = [
            regency
            for regency in _items("regencies/35.json")
            if regency["code"] in focus_codes
        ]
    else:
        raise ValueError("SIGAB_AREA_SCOPE must be indonesia, province:<code>, or regency:<code>")

    district_paths = [f"districts/{regency['code']}.json" for regency in regencies]
    districts = _items_many(district_paths, "kecamatan")
    village_paths = [f"villages/{district['code']}.json" for district in districts]
    villages = _items_many(village_paths, "desa/kelurahan")
    sample_per_district = int(os.getenv("SIGAB_AREA_SAMPLE_PER_DISTRICT", "0"))
    if sample_per_district < 0:
        raise ValueError("SIGAB_AREA_SAMPLE_PER_DISTRICT must be 0 or greater")
    if sample_per_district == 0:
        return [village["code"] for village in villages]
    if sample_per_district == 1:
        by_district: dict[str, list[dict[str, str]]] = {}
        for village in villages:
            district_code = village["code"][:8]
            by_district.setdefault(district_code, []).append(village)
        return [
            village["code"]
            for district_villages in by_district.values()
            for village in district_villages[:sample_per_district]
        ]
    return [village["code"] for village in villages]
