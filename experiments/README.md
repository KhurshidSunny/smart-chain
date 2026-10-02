# Smart-Chain analytics experiments

Python utilities for reproducible forecast and anomaly evaluation on Smart-Chain demand data. These scripts sit beside the Node.js Analytics service (`microservices/analytics`) and are used for offline comparison and documentation — they do not replace the live API.

## Setup (Windows PowerShell)

From the repository root:

```powershell
cd experiments
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

On macOS / Linux:

```bash
cd experiments
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```


## Layout

```
experiments/
  requirements.txt
  README.md
  load_demand_history.py
  classical_forecast.py
  data/
    README.md
    demo_daily_demand.json
    demo_daily_demand.csv
```

## Demand history format

Offline experiments expect daily rows with:

| Field | Type | Example |
|---|---|---|
| `productId` | string | `sku-rice-1kg` |
| `date` | `YYYY-MM-DD` | `2025-01-03` |
| `quantity` | number ≥ 0 | `11` |

JSON may be a list of objects, or `{ "rows": [ ... ] }`. CSV uses the same column names (aliases such as `qty` / `sku` are accepted by the loader).

## Running the demand loader

With the virtual environment activated, from `experiments/`:

```powershell
python load_demand_history.py
python load_demand_history.py --input data/demo_daily_demand.csv
python load_demand_history.py --input data/demo_daily_demand.json --product-id sku-rice-1kg
```

The script prints per-product day counts, date range, total quantity, and mean daily demand.

## Classical forecast baselines

`classical_forecast.py` reimplements the Analytics service methods in Python:

- moving average
- exponential smoothing
- one-step holdout MAE / MAPE

Defaults match `microservices/analytics/services/forecastService.js` (horizon 7/14/30, alpha 0.3, short holdout).

```powershell
python classical_forecast.py
python classical_forecast.py --product-id sku-rice-1kg --horizon-days 7
```

Importable helpers: `moving_average_forecast`, `exponential_smoothing_forecast`, `evaluate_forecast_holdout`, `mean_absolute_error`, `mean_absolute_percentage_error`.

## Relation to the Node analytics service

| Concern | Node Analytics (`:3006`) | This folder |
|---|---|---|
| Live inventory / order UI | Yes | No |
| MA / ES forecast in production path | Yes | Reimplemented for comparison |
| Holdout MAE / MAPE | Yes (API) | Offline tables / plots |
| sklearn baselines | No | Yes (planned scripts) |

Use the same demo demand history shape where possible so Node and Python results can be compared honestly.
