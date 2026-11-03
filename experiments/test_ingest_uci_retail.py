"""Fixture checks for the UCI Online Retail II ingestion rules."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import pandas as pd

from ingest_uci_retail import (
    FIXTURE_PATH,
    ingest,
    sha256_file,
    verify_workbook,
)

FIXTURE_DIR = Path(__file__).resolve().parent / "data" / "fixtures" / "uci_processed_sample"


def _lf(path: Path) -> bytes:
    return path.read_bytes().replace(b"\r\n", b"\n")


class IngestUciRetailTest(unittest.TestCase):
    def test_fixture_matches_committed_output(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            report = ingest(FIXTURE_PATH, Path(tmp), check_checksum=False)
            demand = _lf(Path(tmp) / "daily_demand.csv")
            written = json.loads((Path(tmp) / "quality_report.json").read_text(encoding="utf-8"))

        self.assertEqual(demand, _lf(FIXTURE_DIR / "daily_demand.csv"))
        committed = json.loads((FIXTURE_DIR / "quality_report.json").read_text(encoding="utf-8"))
        self.assertEqual(written, committed)
        self.assertEqual(report["series"]["selected_series"], ["12345"])
        self.assertEqual(report["row_counts"]["duplicate_rows_removed"], 1)
        self.assertEqual(report["row_counts"]["cancellations"], 1)
        self.assertEqual(report["row_counts"]["returns"], 1)
        self.assertEqual(report["row_counts"]["missing_stock_code"], 1)
        self.assertEqual(report["row_counts"]["invalid_price"], 1)
        self.assertEqual(report["row_counts"]["missing_or_invalid_invoice_date"], 1)
        self.assertEqual(report["row_counts"]["missing_customer_id_kept"], 1)
        self.assertEqual(report["series"]["zero_demand_days_inserted"], 52)

    def test_two_runs_match(self) -> None:
        with tempfile.TemporaryDirectory() as first, tempfile.TemporaryDirectory() as second:
            ingest(FIXTURE_PATH, Path(first), check_checksum=False)
            ingest(FIXTURE_PATH, Path(second), check_checksum=False)
            self.assertEqual(_lf(Path(first) / "daily_demand.csv"), _lf(Path(second) / "daily_demand.csv"))
            self.assertEqual(
                _lf(Path(first) / "quality_report.json"),
                _lf(Path(second) / "quality_report.json"),
            )

    def test_known_days(self) -> None:
        frame = pd.read_csv(FIXTURE_DIR / "daily_demand.csv")
        by_day = dict(zip(frame["date"], frame["quantity"]))
        self.assertEqual(by_day["2010-01-01"], 2)
        self.assertEqual(by_day["2010-01-02"], 1)
        self.assertEqual(by_day["2010-01-04"], 0)
        self.assertEqual(by_day["2010-03-01"], 7)
        self.assertNotIn("POST", set(frame["productId"]))
        self.assertNotIn("99999", set(frame["productId"]))

    def test_missing_column_raises(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.csv"
            path.write_text("Invoice,StockCode\n1,12345\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                ingest(path, Path(tmp) / "out", check_checksum=False)

    def test_checksum_rejects_a_different_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "online_retail_II.xlsx"
            path.write_bytes(b"not the workbook")
            with self.assertRaises(ValueError):
                verify_workbook(path)
        self.assertEqual(len(sha256_file(FIXTURE_PATH)), 64)


if __name__ == "__main__":
    unittest.main()
