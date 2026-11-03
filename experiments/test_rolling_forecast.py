"""Chronological splits, leakage checks, and stable fixture results."""

from __future__ import annotations

import unittest
from datetime import date, timedelta

import pandas as pd

from evaluate_rolling_forecast import (
    FIXTURE_PATH,
    METHODS,
    dump_report,
    evaluate_frame,
    evaluate_path,
    forecast_at_origin,
    list_origins,
    load_config,
    minimum_length,
    validate_config,
)


def _frame_from_fixture() -> pd.DataFrame:
    frame = pd.read_csv(FIXTURE_PATH)
    frame["productId"] = frame["productId"].astype(str)
    frame["date"] = frame["date"].astype(str)
    frame["quantity"] = frame["quantity"].astype(float)
    return frame


class RollingForecastTest(unittest.TestCase):
    def setUp(self) -> None:
        self.config = load_config()

    def test_origins_are_chronological_and_disjoint(self) -> None:
        self.assertEqual(minimum_length(self.config), 112)
        origins = list_origins(112, self.config)
        self.assertEqual(origins["validation"], [56, 63, 70, 77])
        self.assertEqual(origins["test"], [84, 91, 98, 105])
        horizon = int(self.config["horizon_days"])
        validation_days = [
            day
            for origin in origins["validation"]
            for day in range(origin, origin + horizon)
        ]
        test_days = [
            day for origin in origins["test"] for day in range(origin, origin + horizon)
        ]
        self.assertTrue(set(validation_days).isdisjoint(test_days))
        self.assertLess(max(validation_days), min(test_days))
        for origin in origins["validation"] + origins["test"]:
            self.assertGreaterEqual(origin, int(self.config["min_train_days"]))
            self.assertLessEqual(origin + horizon, 112)

    def test_overlapping_windows_are_rejected(self) -> None:
        config = dict(self.config)
        config["origin_step_days"] = 1
        with self.assertRaises(ValueError):
            validate_config(config)

    def test_seasonal_naive_repeats_previous_season(self) -> None:
        quantities = [float(10 + (day % 7)) for day in range(112)]
        path = forecast_at_origin(quantities, 84, "seasonal_naive", self.config)
        self.assertEqual(path, quantities[84:91])
        self.assertIn("seasonal_naive", METHODS)

    def test_future_values_do_not_change_an_origin(self) -> None:
        quantities = [float(10 + (day % 7)) for day in range(112)]
        mutated = quantities[:]
        mutated[84:] = [999.0] * (112 - 84)
        for method in METHODS:
            self.assertEqual(
                forecast_at_origin(quantities, 84, method, self.config),
                forecast_at_origin(mutated, 84, method, self.config),
                method,
            )

    def test_model_selection_ignores_the_test_block(self) -> None:
        frame = _frame_from_fixture()
        original = evaluate_path(FIXTURE_PATH, self.config)
        dense = next(row for row in original["series"] if row["productId"] == "sku-dense-weekly")
        cutoff = dense["test_origin_dates"][0]
        mutated = frame.copy()
        mask = (mutated["productId"] == "sku-dense-weekly") & (mutated["date"] >= cutoff)
        mutated.loc[mask, "quantity"] = 999.0
        changed = evaluate_frame(mutated, self.config)
        changed_dense = next(
            row for row in changed["series"] if row["productId"] == "sku-dense-weekly"
        )
        self.assertEqual(
            dense["validation_selected_method"],
            changed_dense["validation_selected_method"],
        )
        self.assertEqual(dense["validation"], changed_dense["validation"])
        self.assertNotEqual(dense["test"], changed_dense["test"])
        self.assertIn(dense["validation_selected_method"], METHODS)

    def test_fixture_classes_and_stable_results(self) -> None:
        first = evaluate_path(FIXTURE_PATH, self.config)
        second = evaluate_path(FIXTURE_PATH, self.config)
        self.assertEqual(dump_report(first), dump_report(second))

        by_id = {row["productId"]: row for row in first["series"]}
        self.assertEqual(set(by_id), {"sku-dense-weekly", "sku-sparse-10"})
        self.assertEqual(by_id["sku-dense-weekly"]["demand_class"], "dense")
        self.assertEqual(by_id["sku-sparse-10"]["demand_class"], "intermittent")
        self.assertEqual(by_id["sku-dense-weekly"]["test"]["seasonal_naive"]["mae"], 0.0)
        dense_naive = first["summary"]["dense"]["test"]["seasonal_naive"]
        self.assertEqual(dense_naive["macro_mae"], 0.0)
        self.assertEqual(dense_naive["micro_mae"], 0.0)
        self.assertEqual(first["summary"]["dense"]["series_count"], 1)
        self.assertEqual(first["summary"]["intermittent"]["series_count"], 1)
        self.assertEqual(first["summary"]["all"]["series_count"], 2)
        self.assertEqual(first["inclusion"]["excluded_too_short"], 1)
        self.assertEqual(first["inclusion"]["excluded_non_daily"], 1)
        self.assertIn("MAPE skips zero actuals", first["protocol"]["mape_caveat"])
        self.assertEqual(first["protocol"]["methods"], list(METHODS))

        start = date(2010, 1, 1)
        self.assertEqual(
            by_id["sku-dense-weekly"]["validation_origin_dates"],
            [(start + timedelta(days=day)).isoformat() for day in (56, 63, 70, 77)],
        )
        self.assertEqual(
            by_id["sku-dense-weekly"]["test_origin_dates"],
            [(start + timedelta(days=day)).isoformat() for day in (84, 91, 98, 105)],
        )


if __name__ == "__main__":
    unittest.main()
