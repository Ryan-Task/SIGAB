from __future__ import annotations

import json
import os
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException

from .api import PredictionRequest, predict
from .regions import discover_area_codes

_area_codes_cache: list[str] | None = None


def _import_to_laravel(payload: dict) -> None:
    url = os.getenv("SIGAB_LARAVEL_IMPORT_URL", "http://127.0.0.1:8000/api/v1/predictions/import")
    timeout = float(os.getenv("SIGAB_LARAVEL_IMPORT_TIMEOUT_SECONDS", "120"))
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    pipeline_key = os.getenv("SIGAB_PIPELINE_KEY")
    if pipeline_key:
        headers["X-Pipeline-Key"] = pipeline_key
    request = Request(url, data=json.dumps(payload).encode(), headers=headers, method="POST")
    try:
        with urlopen(request, timeout=timeout) as response:
            response.read()
    except (HTTPError, URLError, TimeoutError, OSError) as error:
        raise RuntimeError(f"Laravel import failed: {error}") from error


def sync_once() -> None:
    global _area_codes_cache
    if _area_codes_cache is None:
        print("Memuat daftar wilayah dari katalog wilayah.id...", flush=True)
        _area_codes_cache = discover_area_codes()
        print(f"Daftar wilayah siap: {len(_area_codes_cache)} kode adm4.", flush=True)
    else:
        print(
            f"Memakai daftar wilayah tersimpan: {len(_area_codes_cache)} kode adm4.",
            flush=True,
        )
    area_codes = _area_codes_cache
    batch_size = int(os.getenv("SIGAB_SYNC_BATCH_SIZE", "25"))
    if batch_size < 1 or batch_size > 100:
        raise SystemExit("SIGAB_SYNC_BATCH_SIZE must be between 1 and 100")

    total = len(area_codes)
    print(
        f"Memulai sinkronisasi BMKG: {total} wilayah, batch {batch_size}.",
        flush=True,
    )
    imported = 0
    for offset in range(0, total, batch_size):
        batch = area_codes[offset : offset + batch_size]
        try:
            result = predict(PredictionRequest(adm4=batch))
        except HTTPException as error:
            detail = error.detail
            if isinstance(detail, dict) and isinstance(detail.get("errors"), list):
                detail = f"{len(detail['errors'])} request BMKG gagal pada batch ini"
            print(
                f"Batch {min(offset + batch_size, total)}/{total} gagal: "
                f"{detail}",
                flush=True,
            )
            continue
        try:
            _import_to_laravel(result.model_dump())
        except RuntimeError as error:
            print(
                f"Batch {min(offset + batch_size, total)}/{total} gagal diimpor ke Laravel: "
                f"{error}. Batch ini akan dicoba pada interval berikutnya.",
                flush=True,
            )
            continue
        imported += len(result.predictions)
        errors = result.metadata.get("errors", [])
        print(
            f"Batch {min(offset + batch_size, total)}/{total} selesai: "
            f"{len(result.predictions)} prediksi berhasil, "
            f"{len(errors)} wilayah gagal.",
            flush=True,
        )
    print(
        f"Sinkronisasi selesai: {imported}/{total} prediksi, "
        f"menunggu interval berikutnya.",
        flush=True,
    )


def main() -> None:
    interval = int(os.getenv("SIGAB_SYNC_INTERVAL_SECONDS", "10800"))
    if interval < 60:
        raise SystemExit("SIGAB_SYNC_INTERVAL_SECONDS must be at least 60")
    print(
        f"Worker aktif. Sinkronisasi akan dijalankan setiap {interval} detik. "
        "Tekan Ctrl+C untuk berhenti.",
        flush=True,
    )
    try:
        while True:
            sync_once()
            time.sleep(interval)
    except KeyboardInterrupt:
        print("Worker dihentikan.", flush=True)


if __name__ == "__main__":
    main()
