from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class TrainingResult:
    model: Any
    accuracy: float
    feature_names: tuple[str, ...]


def train_random_forest(
    csv_path: str | Path,
    target_column: str = "flood_label",
) -> TrainingResult:
    """Train only from labelled local history; requires pandas and scikit-learn."""
    try:
        import pandas as pd
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score
    except ImportError as error:
        raise RuntimeError(
            "ML training requires pandas and scikit-learn; install backend/python/requirements-ml.txt"
        ) from error

    frame = pd.read_csv(csv_path)
    feature_names = tuple(
        name
        for name in ("rainfall_score", "history_score", "environment_score")
        if name in frame.columns
    )
    if len(feature_names) < 2:
        raise ValueError("Training data needs at least two scored feature columns")
    if target_column not in frame.columns:
        raise ValueError(f"Missing target column: {target_column}")
    clean = frame.dropna(subset=[*feature_names, target_column])
    if len(clean) < 10:
        raise ValueError("At least 10 labelled rows are required")
    features = clean.loc[:, feature_names]
    target = clean[target_column]
    train_x, test_x, train_y, test_y = train_test_split(
        features, target, test_size=0.2, random_state=42, stratify=target
    )
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
    model.fit(train_x, train_y)
    accuracy = float(accuracy_score(test_y, model.predict(test_x)))
    return TrainingResult(model=model, accuracy=accuracy, feature_names=feature_names)
