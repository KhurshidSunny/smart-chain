"""Generate committed analytics reports, or check them for drift.

Write mode updates the files under docs/. Check mode writes the same
artifacts to a temporary folder and fails if they differ. Check never
overwrites committed reports.
"""

from __future__ import annotations

import argparse
import os
import tempfile
from pathlib import Path

# Keep BLAS/OpenMP single-threaded so Isolation Forest and Ridge stay stable.
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")

from compare_forecast_methods import DEFAULT_INPUT as DEMAND_INPUT
from compare_forecast_methods import DEFAULT_OUTPUT as FORECAST_OUTPUT
from compare_forecast_methods import build_forecast_report
from compare_isolation_forest_anomalies import DEFAULT_INPUT as ANOMALY_INPUT
from compare_isolation_forest_anomalies import DEFAULT_OUTPUT as ANOMALY_OUTPUT
from compare_isolation_forest_anomalies import build_anomaly_report
from export_forecast_evaluation_csv import DEFAULT_OUTPUT as CSV_OUTPUT
from export_forecast_evaluation_csv import evaluation_rows, render_csv
from report_reproducibility import (
    REPO_ROOT,
    compare_outputs,
    format_json_manifest,
    repo_relative,
    require_pinned_environment,
    run_manifest,
    write_text,
)
from simulate_demand_shock import DEFAULT_OUTPUT as SHOCK_OUTPUT
from simulate_demand_shock import build_shock_report

MANIFEST_OUTPUT = REPO_ROOT / "docs" / "samples" / "experiment-run-manifest.json"


def _artifact_contents() -> dict[Path, str]:
    forecast_md, _ = build_forecast_report()
    anomaly_md, _, _ = build_anomaly_report()
    shock_md, _, _ = build_shock_report()
    csv_text = render_csv(
        evaluation_rows(
            input_path=DEMAND_INPUT,
            product_id=None,
            horizon_days=7,
            n_lags=7,
        )
    )
    manifest = run_manifest(datasets=[DEMAND_INPUT, ANOMALY_INPUT])
    return {
        FORECAST_OUTPUT: forecast_md,
        ANOMALY_OUTPUT: anomaly_md,
        SHOCK_OUTPUT: shock_md,
        CSV_OUTPUT: csv_text,
        MANIFEST_OUTPUT: format_json_manifest(manifest),
    }


def write_reports(output_root: Path | None = None) -> list[Path]:
    written: list[Path] = []
    for committed_path, text in _artifact_contents().items():
        target = committed_path
        if output_root is not None:
            relative = committed_path.resolve().relative_to(REPO_ROOT)
            target = output_root / relative
        write_text(target, text)
        written.append(target)
    return written


def check_reports() -> int:
    artifacts = _artifact_contents()
    with tempfile.TemporaryDirectory(prefix="smart-chain-report-check-") as tmp:
        tmp_root = Path(tmp)
        pairs: list[tuple[Path, Path]] = []
        for committed_path, text in artifacts.items():
            relative = committed_path.resolve().relative_to(REPO_ROOT)
            generated = tmp_root / relative
            write_text(generated, text)
            pairs.append((committed_path, generated))
        drifts = compare_outputs(pairs)

    if drifts:
        print("Report check failed. Committed files were not changed.")
        for message in drifts:
            print(f"  {message}")
        return 1

    print("Report check passed.")
    for committed_path, _ in pairs:
        print(f"  {repo_relative(committed_path)}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Write analytics evaluation reports, or regenerate them in a "
            "temporary folder and fail if they drifted."
        )
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Compare regenerated reports to committed files without overwriting them.",
    )
    args = parser.parse_args()
    require_pinned_environment()

    if args.check:
        return check_reports()

    for path in write_reports():
        print(f"Wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
