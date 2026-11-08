import unittest
from datetime import datetime, timezone

from sigab_data.bmkg import _area_metadata, parse_forecast_payload
from sigab_data.environment import _distance_to_segment_meters
from sigab_data.models import AreaInput
from sigab_data.risk import RuleBasedRiskModel, rainfall_score


class PipelineTest(unittest.TestCase):
    def test_bmkg_forecast_is_normalized_without_inventing_missing_rainfall(self):
        records = parse_forecast_payload(
            {
                "data": [{
                    "lokasi": {"adm4": "35.15.01.2001"},
                    "cuaca": [[
                        {"datetime": "2026-11-01T00:00:00Z", "local_datetime": "2026-11-01 07:00:00", "tp": None},
                        {"datetime": "2026-11-01T03:00:00Z", "local_datetime": "2026-11-01 10:00:00", "tp": 12.5},
                    ]],
                }]
            },
            "35.15.01.2001",
        )
        self.assertEqual(len(records), 2)
        self.assertIsNone(records[0].rainfall_mm)
        self.assertEqual(records[1].rainfall_mm, 12.5)
        self.assertEqual(records[1].quality_status, "forecast")
        self.assertEqual(records[0].observed_at.tzinfo, timezone.utc)

    def test_risk_normalizes_available_weights(self):
        prediction = RuleBasedRiskModel().predict(
            AreaInput(area_code="x", rainfall_score=80, history_score=40)
        )
        self.assertEqual(prediction.score, 62)
        self.assertEqual(prediction.risk_level, "medium")
        self.assertEqual(prediction.status, "valid")

    def test_weather_only_score_is_explicitly_limited(self):
        prediction = RuleBasedRiskModel().predict(
            AreaInput(area_code="x", rainfall_score=80)
        )
        self.assertEqual(prediction.score, 80)
        self.assertEqual(prediction.risk_level, "high")
        self.assertEqual(prediction.status, "valid")
        self.assertEqual(prediction.explanation["confidence"], "limited")

    def test_confidence_accounts_for_quality_not_only_component_count(self):
        prediction = RuleBasedRiskModel().predict(
            AreaInput(
                area_code="x",
                rainfall_score=80,
                history_score=40,
                component_metadata={
                    "rainfall": {"quality_score": 0.6, "coverage_score": 1, "age_score": 1},
                    "history": {"quality_score": 1, "coverage_score": 1, "age_score": 1},
                },
            )
        )
        self.assertEqual(prediction.explanation["confidence"], "limited")
        self.assertIn("kualitas sumber tidak maksimal", prediction.explanation["confidence_reasons"])

    def test_rainfall_score_is_clamped(self):
        self.assertEqual(rainfall_score(75, 50), 100)

    def test_bmkg_area_metadata_is_available_for_auto_registration(self):
        area = _area_metadata(
            {
                "lokasi": {
                    "adm4": "35.15.01.2001",
                    "desa": "Mliriprowo",
                    "kecamatan": "Tarik",
                    "kotkab": "Sidoarjo",
                    "provinsi": "Jawa Timur",
                    "lat": -7.4,
                    "lon": 112.4,
                }
            },
            "fallback",
        )
        self.assertEqual(area["code"], "35.15.01.2001")
        self.assertEqual(area["name"], "Mliriprowo")

    def test_river_distance_uses_nearest_line_segment(self):
        distance = _distance_to_segment_meters(
            -7.4,
            112.4,
            [-7.4, 112.401],
            [-7.4, 112.402],
        )
        self.assertGreater(distance, 0)
        self.assertLess(distance, 150)


if __name__ == "__main__":
    unittest.main()
