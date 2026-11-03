"""Build daily SKU demand from the UCI Online Retail II workbook.

The raw workbook stays in experiments/data/uci_raw.
A small CSV fixture under data/fixtures/ exercises the same rules.

Citation: Chen, Daqing. (2015). Online Retail II. UCI Machine Learning
Repository. https://doi.org/10.24432/C5CG6D  License: CC BY 4.0.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import urllib.request
import zipfile
from pathlib import Path

import pandas as pd

EXPERIMENTS_DIR = Path(__file__).resolve().parent
PROVENANCE_PATH = EXPERIMENTS_DIR / "retail_provenance.json"
FIXTURE_PATH = EXPERIMENTS_DIR / "data" / "fixtures" / "uci_online_retail_ii_sample.csv"
RAW_DIR = EXPERIMENTS_DIR / "data" / "uci_raw"
PROCESSED_DIR = EXPERIMENTS_DIR / "data" / "uci_processed"
WORKBOOK_NAME = "online_retail_II.xlsx"

REQUIRED_COLUMNS = (
    "Invoice",
    "StockCode",
    "Description",
    "Quantity",
    "InvoiceDate",
    "Price",
    "Customer ID",
    "Country",
)

# Product codes in this dataset are five digits plus an optional letter.
# Postage, fees, and adjustment codes fall outside that pattern.
PRODUCT_CODE = r"^\d{5}[A-Z]?$"
MIN_POSITIVE_DAYS = 8
MIN_SPAN_DAYS = 60
MIN_TOTAL_QUANTITY = 20

COLUMN_ALIASES = {
    "invoice": "Invoice",
    "invoiceno": "Invoice",
    "stockcode": "StockCode",
    "description": "Description",
    "quantity": "Quantity",
    "invoicedate": "InvoiceDate",
    "price": "Price",
    "unitprice": "Price",
    "customerid": "Customer ID",
    "country": "Country",
}


def load_provenance() -> dict:
    return json.loads(PROVENANCE_PATH.read_text(encoding="utf-8"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_workbook(path: Path) -> str:
    """Return the workbook sha256. Fail if it does not match provenance."""
    provenance = load_provenance()
    expected = str(provenance.get("sha256") or "").strip().lower()
    actual = sha256_file(path)
    if len(expected) != 64:
        raise ValueError(
            f"retail_provenance.json has no sha256. Computed {actual} for {path.name}."
        )
    if actual != expected:
        raise ValueError(
            f"{path.name} sha256 {actual} does not match provenance {expected}."
        )
    return actual


def download_workbook(dest_dir: Path = RAW_DIR) -> Path:
    """Download the UCI zip, extract the workbook, and check its sha256."""
    provenance = load_provenance()
    dest_dir.mkdir(parents=True, exist_ok=True)
    zip_path = dest_dir / "online_retail_ii.zip"
    workbook_path = dest_dir / WORKBOOK_NAME

    request = urllib.request.Request(
        provenance["download_url"],
        headers={"User-Agent": "smart-chain-experiments"},
    )
    with urllib.request.urlopen(request, timeout=120) as response:
        zip_path.write_bytes(response.read())

    with zipfile.ZipFile(zip_path) as archive:
        member = next(
            (
                name
                for name in archive.namelist()
                if Path(name).name.lower() == WORKBOOK_NAME.lower()
            ),
            None,
        )
        if member is None:
            raise ValueError(f"{zip_path.name} does not contain {WORKBOOK_NAME}.")
        workbook_path.write_bytes(archive.read(member))

    verify_workbook(workbook_path)
    return workbook_path


def _canonical_columns(frame: pd.DataFrame) -> pd.DataFrame:
    rename = {}
    for column in frame.columns:
        key = str(column).strip().lower().replace(" ", "").replace("_", "")
        if key in COLUMN_ALIASES:
            rename[column] = COLUMN_ALIASES[key]
    renamed = frame.rename(columns=rename)
    missing = [name for name in REQUIRED_COLUMNS if name not in renamed.columns]
    if missing:
        raise ValueError(
            f"Missing required columns {missing}. Expected {list(REQUIRED_COLUMNS)}."
        )
    return renamed.loc[:, list(REQUIRED_COLUMNS)].copy()


def read_transactions(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        frame = pd.read_csv(path)
    elif suffix in {".xlsx", ".xls"}:
        sheets = pd.read_excel(path, sheet_name=None, engine="openpyxl")
        frame = pd.concat(sheets.values(), ignore_index=True)
    else:
        raise ValueError(f"Unsupported transaction file: {path}")
    return _canonical_columns(frame)


def _parse_invoice_dates(series: pd.Series) -> pd.Series:
    if pd.api.types.is_datetime64_any_dtype(series):
        parsed = pd.to_datetime(series, errors="coerce")
        if getattr(parsed.dt, "tz", None) is not None:
            parsed = parsed.dt.tz_localize(None)
        return parsed

    text = series.astype("string").str.strip()
    parsed = pd.to_datetime(text, errors="coerce", format="%Y-%m-%d %H:%M:%S")
    pending = parsed.isna() & text.notna() & ~text.isin({"", "<NA>", "nan", "NaT"})
    for date_format in ("%Y-%m-%d %H:%M", "%d/%m/%Y %H:%M", "%Y-%m-%d"):
        if not pending.any():
            break
        alt = pd.to_datetime(text[pending], errors="coerce", format=date_format)
        parsed.loc[pending] = alt
        pending = parsed.isna() & text.notna() & ~text.isin({"", "<NA>", "nan", "NaT"})
    return parsed


def prepare_transactions(frame: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Drop unusable rows. Each rejected row is counted in one bucket."""
    working = frame.copy()
    rows_read = int(len(working))
    duplicate_rows = int(working.duplicated(keep="first").sum())
    working = working.drop_duplicates(keep="first")

    invoice = working["Invoice"].astype("string").str.strip()
    stock = working["StockCode"].astype("string").str.strip().str.upper()
    stock = stock.mask(stock.isin({"", "<NA>", "NAN", "NONE"}))
    invoice_date = _parse_invoice_dates(working["InvoiceDate"])
    quantity = pd.to_numeric(working["Quantity"], errors="coerce")
    price = pd.to_numeric(working["Price"], errors="coerce")
    customer = working["Customer ID"]
    customer_missing = customer.isna() | customer.astype("string").str.strip().isin(
        {"", "<NA>", "nan", "NaN"}
    )
    cancellation = invoice.str.upper().str.startswith("C", na=False)

    missing_stock = stock.isna()
    missing_date = ~missing_stock & invoice_date.isna()
    is_cancellation = ~missing_stock & ~missing_date & cancellation
    is_return = ~missing_stock & ~missing_date & ~is_cancellation & quantity.lt(0)
    invalid_price = (
        ~missing_stock
        & ~missing_date
        & ~is_cancellation
        & ~is_return
        & (price.isna() | price.le(0))
    )
    zero_quantity = (
        ~missing_stock
        & ~missing_date
        & ~is_cancellation
        & ~is_return
        & ~invalid_price
        & (quantity.isna() | quantity.le(0))
    )
    keep = (
        ~missing_stock
        & ~missing_date
        & ~is_cancellation
        & ~is_return
        & ~invalid_price
        & ~zero_quantity
    )

    kept = pd.DataFrame(
        {
            "stock_code": stock[keep].astype(str),
            "date": invoice_date[keep].dt.strftime("%Y-%m-%d"),
            "quantity": quantity[keep].astype(float),
            "customer_missing": customer_missing[keep].to_numpy(),
        }
    )

    counts = {
        "rows_read": rows_read,
        "duplicate_rows_removed": duplicate_rows,
        "missing_stock_code": int(missing_stock.sum()),
        "missing_or_invalid_invoice_date": int(missing_date.sum()),
        "cancellations": int(is_cancellation.sum()),
        "returns": int(is_return.sum()),
        "invalid_price": int(invalid_price.sum()),
        "zero_or_invalid_quantity": int(zero_quantity.sum()),
        "rows_kept_for_demand": int(keep.sum()),
        "missing_customer_id_kept": int(customer_missing[keep].sum()),
    }
    return kept, counts


def aggregate_daily(kept: pd.DataFrame) -> pd.DataFrame:
    if kept.empty:
        return pd.DataFrame(columns=["productId", "date", "quantity"])
    grouped = (
        kept.groupby(["stock_code", "date"], sort=True)["quantity"]
        .sum()
        .reset_index()
    )
    grouped = grouped.rename(columns={"stock_code": "productId"})
    grouped["quantity"] = grouped["quantity"].astype(float)
    return grouped.sort_values(["productId", "date"]).reset_index(drop=True)


def series_stats(daily: pd.DataFrame) -> pd.DataFrame:
    if daily.empty:
        return pd.DataFrame(
            columns=["productId", "positive_days", "span_days", "total_quantity"]
        )
    frame = daily.copy()
    frame["day"] = pd.to_datetime(frame["date"], format="%Y-%m-%d")
    stats = (
        frame.groupby("productId", sort=True)
        .agg(
            positive_days=("date", "nunique"),
            first_day=("day", "min"),
            last_day=("day", "max"),
            total_quantity=("quantity", "sum"),
        )
        .reset_index()
    )
    stats["span_days"] = (stats["last_day"] - stats["first_day"]).dt.days + 1
    return stats.loc[:, ["productId", "positive_days", "span_days", "total_quantity"]]


def select_product_ids(daily: pd.DataFrame) -> list[str]:
    stats = series_stats(daily)
    if stats.empty:
        return []
    product = stats["productId"].astype(str)
    chosen = stats.loc[
        product.str.match(PRODUCT_CODE)
        & stats["positive_days"].ge(MIN_POSITIVE_DAYS)
        & stats["span_days"].ge(MIN_SPAN_DAYS)
        & stats["total_quantity"].ge(MIN_TOTAL_QUANTITY)
    ]
    return chosen["productId"].astype(str).tolist()


def fill_calendar(daily: pd.DataFrame, product_ids: list[str]) -> pd.DataFrame:
    """Insert zero-demand days from each series' first sale through its last."""
    columns = ["productId", "date", "quantity"]
    if not product_ids:
        return pd.DataFrame(columns=columns)

    pieces = []
    for product_id in product_ids:
        series = daily.loc[daily["productId"] == product_id].copy()
        start = pd.to_datetime(series["date"].min(), format="%Y-%m-%d")
        end = pd.to_datetime(series["date"].max(), format="%Y-%m-%d")
        calendar = pd.date_range(start, end, freq="D")
        indexed = series.set_index(pd.to_datetime(series["date"], format="%Y-%m-%d"))
        filled = indexed["quantity"].reindex(calendar, fill_value=0.0)
        pieces.append(
            pd.DataFrame(
                {
                    "productId": product_id,
                    "date": filled.index.strftime("%Y-%m-%d"),
                    "quantity": filled.to_numpy(dtype=float),
                }
            )
        )
    return pd.concat(pieces, ignore_index=True)


def selection_rules() -> dict:
    return {
        "product_code": PRODUCT_CODE,
        "min_positive_days": MIN_POSITIVE_DAYS,
        "min_span_days": MIN_SPAN_DAYS,
        "min_total_quantity": MIN_TOTAL_QUANTITY,
        "calendar": "Zero quantity is inserted for every calendar day from the first positive day through the last positive day of each selected series. The day is the invoice timestamp's calendar date, with no timezone conversion.",
        "kept_despite_missing_customer_id": True,
        "excluded": [
            "exact duplicate rows",
            "blank stock codes",
            "unparseable invoice dates",
            "invoices whose code starts with C (cancellations)",
            "negative quantities that are not cancellations (returns)",
            "price missing or less than or equal to zero",
            "quantity missing or less than or equal to zero",
        ],
    }


def build_report(
    counts: dict,
    daily_sparse: pd.DataFrame,
    daily_filled: pd.DataFrame,
    selected: list[str],
    source_name: str,
    workbook_sha256: str | None,
) -> dict:
    provenance = load_provenance()
    positive_rows = int((daily_sparse["productId"].isin(selected)).sum()) if len(daily_sparse) else 0
    filled_rows = int(len(daily_filled))
    return {
        "source": {
            "dataset": provenance["dataset"],
            "citation": provenance["citation"],
            "related_paper": provenance["related_paper"],
            "doi": provenance["doi"],
            "license": provenance["license"],
            "page": provenance["page"],
            "input_name": source_name,
            "workbook_sha256": workbook_sha256,
        },
        "row_counts": counts,
        "selection_rules": selection_rules(),
        "series": {
            "stock_codes_with_positive_demand": int(daily_sparse["productId"].nunique())
            if len(daily_sparse)
            else 0,
            "selected_series": selected,
            "positive_demand_rows_selected": positive_rows,
            "calendar_rows_written": filled_rows,
            "zero_demand_days_inserted": filled_rows - positive_rows,
        },
    }


def _quantity_for_csv(frame: pd.DataFrame) -> pd.DataFrame:
    output = frame.copy()
    whole = output["quantity"].map(lambda value: float(value).is_integer())
    if bool(whole.all()):
        output["quantity"] = output["quantity"].astype(int)
    return output


def write_outputs(daily: pd.DataFrame, report: dict, output_dir: Path) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    demand_path = output_dir / "daily_demand.csv"
    report_path = output_dir / "quality_report.json"
    _quantity_for_csv(daily).to_csv(demand_path, index=False, lineterminator="\n")
    report_path.write_text(
        json.dumps(report, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return demand_path, report_path


def ingest(path: Path, output_dir: Path, *, check_checksum: bool) -> dict:
    workbook_sha256 = verify_workbook(path) if check_checksum else None
    kept, counts = prepare_transactions(read_transactions(path))
    daily = aggregate_daily(kept)
    selected = select_product_ids(daily)
    filled = fill_calendar(daily, selected)
    report = build_report(
        counts,
        daily,
        filled,
        selected,
        path.name,
        workbook_sha256,
    )
    write_outputs(filled, report, output_dir)
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--download",
        action="store_true",
        help="Download the UCI zip into data/uci_raw and check the workbook sha256.",
    )
    parser.add_argument(
        "--input",
        type=Path,
        help="Workbook (.xlsx) or fixture (.csv). Defaults to the cached workbook.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=PROCESSED_DIR,
        help="Directory for daily_demand.csv and quality_report.json.",
    )
    parser.add_argument(
        "--fixture",
        action="store_true",
        help="Process the committed sample CSV. Skips the workbook checksum.",
    )
    args = parser.parse_args()

    if args.download:
        workbook = download_workbook()
        print(f"Cached {workbook}")
        if args.input is None and not args.fixture:
            args.input = workbook

    if args.fixture:
        source = FIXTURE_PATH
        check_checksum = False
    else:
        source = args.input or (RAW_DIR / WORKBOOK_NAME)
        check_checksum = source.suffix.lower() in {".xlsx", ".xls"}

    if not source.is_file():
        raise SystemExit(
            f"Transaction file not found: {source}. Run with --download or pass --input."
        )

    report = ingest(source, args.output_dir, check_checksum=check_checksum)
    selected = report["series"]["selected_series"]
    print(
        f"Wrote {args.output_dir / 'daily_demand.csv'} "
        f"({report['series']['calendar_rows_written']} rows, "
        f"{len(selected)} selected series)"
    )
    print(f"Wrote {args.output_dir / 'quality_report.json'}")


if __name__ == "__main__":
    main()
