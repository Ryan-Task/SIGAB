from __future__ import annotations

from .models import AreaInput, Prediction


class RuleBasedRiskModel:
    """Explainable PRD baseline; absent components are excluded, never zeroed."""

    method_version = "rule-based-v4"
    weights = {"rainfall": 0.45, "history": 0.35, "environment": 0.05, "drainage": 0.15}

    @staticmethod
    def _validate_score(name: str, value: float | None) -> float | None:
        if value is None:
            return None
        if not 0 <= value <= 100:
            raise ValueError(f"{name} must be between 0 and 100")
        return float(value)

    def predict(self, area: AreaInput) -> Prediction:
        drainage_quality = self._validate_score("drainage_score", area.drainage_score)
        if drainage_quality == 0:
            drainage_quality = None
        components = {
            "rainfall": self._validate_score("rainfall_score", area.rainfall_score),
            "history": self._validate_score("history_score", area.history_score),
            "environment": self._validate_score("environment_score", area.environment_score),
            "drainage": None if drainage_quality is None else 100.0 - drainage_quality,
        }
        available = {
            name: value for name, value in components.items() if value is not None
        }
        metadata = area.component_metadata or {}
        quality_scores = [
            float(metadata.get(name, {}).get("quality_score", 1.0))
            for name in available
        ]
        coverage_scores = [
            float(metadata.get(name, {}).get("coverage_score", 1.0))
            for name in available
        ]
        age_scores = [
            float(metadata.get(name, {}).get("age_score", 1.0))
            for name in available
        ]
        data_quality = min(quality_scores, default=0.0)
        coverage = min(coverage_scores, default=0.0)
        freshness = min(age_scores, default=0.0)
        confidence_score = min(data_quality, coverage, freshness)
        confidence = (
            "high" if len(available) == 4 and confidence_score >= 0.9
            else "medium" if len(available) >= 2 and confidence_score >= 0.7
            else "limited"
        )
        confidence_reasons = []
        if len(available) < 3:
            confidence_reasons.append("komponen belum lengkap")
        if data_quality < 0.9:
            confidence_reasons.append("kualitas sumber tidak maksimal")
        if coverage < 0.9:
            confidence_reasons.append("cakupan wilayah tidak lengkap")
        if freshness < 0.9:
            confidence_reasons.append("data tidak cukup baru")
        if not available:
            return Prediction(
                area_code=area.area_code,
                score=None,
                risk_level="insufficient",
                status="insufficient_data",
                rainfall_score=components["rainfall"],
                history_score=components["history"],
                environment_score=components["environment"],
                drainage_score=drainage_quality,
                method_version=self.method_version,
                data_as_of=area.data_as_of,
                explanation={
                    "message": "Belum ada komponen data yang tersedia untuk menghitung skor.",
                    "available_components": list(available),
                    "confidence": "limited",
                    "confidence_reasons": ["belum ada komponen data"],
                },
            )

        total_weight = sum(self.weights[name] for name in available)
        score = round(
            sum(self.weights[name] * value for name, value in available.items())
            / total_weight
        )
        risk_level = "low" if score <= 33 else "medium" if score <= 66 else "high"
        return Prediction(
            area_code=area.area_code,
            score=max(0, min(100, score)),
            risk_level=risk_level,
            status="valid",
            rainfall_score=components["rainfall"],
            history_score=components["history"],
            environment_score=components["environment"],
            drainage_score=drainage_quality,
            method_version=self.method_version,
            data_as_of=area.data_as_of,
            explanation={
                "formula": "weighted average of risk components; drainage risk is 100 minus the drainage quality score, while unavailable zero scores are excluded",
                "available_components": list(available),
                "weights_used": {name: self.weights[name] for name in available},
                "confidence": confidence,
                "confidence_score": round(confidence_score, 2),
                "quality_score": round(data_quality, 2),
                "coverage_score": round(coverage, 2),
                "freshness_score": round(freshness, 2),
                "confidence_reasons": confidence_reasons,
            },
        )


def rainfall_score(
    rainfall_mm: float | None,
    warning_threshold_mm: float = 50.0,
) -> float | None:
    if rainfall_mm is None:
        return None
    if rainfall_mm < 0:
        raise ValueError("rainfall_mm cannot be negative")
    if warning_threshold_mm <= 0:
        raise ValueError("warning_threshold_mm must be positive")
    return min(100.0, rainfall_mm / warning_threshold_mm * 100.0)
