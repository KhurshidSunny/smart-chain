"""The retail write-up is rendered from the summary, not typed beside it."""

from __future__ import annotations

import unittest

from evaluate_rolling_forecast import METHODS, load_config
from render_retail_forecast_report import render_retail_report


def _score(mae: float, mape: float | None = None) -> dict:
    if mape is None:
        mape = mae + 1
    return {
        "micro_mae": mae,
        "macro_mae": mae,
        "micro_wape": mae,
        "macro_wape": mae,
        "micro_smape": mae,
        "macro_smape": mae,
        "micro_mape": mape,
        "macro_mape": mape,
        "series_mae_std": 0.5,
        "fold_micro_mae": [mae, mae + 0.5, mae, mae + 0.25],
        "fold_micro_mae_std": 0.2,
        "points": 28,
        "series_count": 1,
        "zero_actual_points": 0,
        "mape_series": 1,
    }


def _summary() -> dict:
    config = load_config()
    groups = {}
    for name, base in (("all", 2.0), ("dense", 1.25), ("intermittent", 3.0)):
        groups[name] = {
            "series_count": 2 if name == "all" else 1,
            "test": {
                method: _score(base, mape=9.0)
                if method == "seasonal_naive"
                else _score(base + 1, mape=base + 1)
                for method in METHODS
            },
            "validation": {
                method: _score(base if method == "seasonal_naive" else base + 1)
                for method in METHODS
            },
        }
    groups["validation_selected_method_counts"] = {
        "all": {method: 2 if method == "moving_average" else 0 for method in METHODS},
        "dense": {method: 1 if method == "moving_average" else 0 for method in METHODS},
        "intermittent": {method: 1 if method == "croston" else 0 for method in METHODS},
    }
    return {
        "config": config,
        "protocol": {
            "alignment": "The latest origins are kept.",
            "history": "Each origin uses only earlier demand.",
            "seasonal_naive": "Seasonal naive repeats the previous season.",
            "ridge": "Ridge steps forward with its own predictions.",
            "scaling": "Ridge features are not scaled.",
            "model_selection": "Validation MAE selects the method.",
            "demand_class": "Class uses the pre-validation zero ratio.",
            "folds": "Fold 1 is the earliest kept origin.",
            "macro": "Unweighted mean of per-series scores.",
            "micro": "Pooled points.",
            "mape_caveat": "MAPE skips zero actuals.",
            "series_mae_std": "Sample standard deviation of per-series MAE.",
        },
        "inclusion": {
            "series_seen": 4,
            "included": 2,
            "excluded_too_short": 2,
            "excluded_non_daily": 0,
            "excluded_too_few_positive_days": 0,
            "excluded_low_total_quantity": 0,
        },
        "summary": groups,
        "runtime_seconds": 1.5,
        "input_name": "daily_demand.csv",
        "input_sha256": "abc",
        "preparation": None,
    }


class RenderRetailForecastTest(unittest.TestCase):
    def test_numbers_come_from_the_summary(self) -> None:
        summary = _summary()
        first = render_retail_report(summary)
        second = render_retail_report(summary)
        self.assertEqual(first, second)
        self.assertIn("1.2500", first)
        self.assertIn("Seasonal naive", first)
        self.assertIn("lowest test micro MAE was **Seasonal naive**", first)
        self.assertIn("validation MAE selected **Moving average**", first)
        self.assertIn("was not the lowest test micro MAE", first)
        self.assertIn("MAPE skips zero actuals, so this ranking is not the MAE ranking.", first)
        self.assertNotIn("abc", first.split("## Reproduce")[0])


if __name__ == "__main__":
    unittest.main()
