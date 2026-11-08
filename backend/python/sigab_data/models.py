from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class RainfallRecord:
    area_code: str
    observed_at: datetime
    period_hours: int | None
    rainfall_mm: float | None
    quality_status: str
    data_source: str
    raw_metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        value = asdict(self)
        value["observed_at"] = self.observed_at.isoformat()
        return value


@dataclass(frozen=True)
class AreaInput:
    area_code: str
    rainfall_score: float | None
    history_score: float | None = None
    environment_score: float | None = None
    data_as_of: datetime | None = None
    source: str = "BMKG"
    component_metadata: dict[str, dict[str, Any]] | None = None


@dataclass(frozen=True)
class Prediction:
    area_code: str
    score: int | None
    risk_level: str
    status: str
    rainfall_score: float | None
    history_score: float | None
    environment_score: float | None
    method_version: str
    data_as_of: datetime | None
    explanation: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        value = asdict(self)
        if self.data_as_of is not None:
            value["data_as_of"] = self.data_as_of.isoformat()
        return value
