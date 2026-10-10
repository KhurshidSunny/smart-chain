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
  sklearn_lag_forecast.py
  compare_forecast_methods.py
  evaluate_zscore_anomalies.py
  compare_isolation_forest_anomalies.py
  simulate_demand_shock.py
  export_forecast_evaluation_csv.py
  data/
    README.md
    demo_daily_demand.json
    demo_daily_demand.csv
    anomaly_labels.json
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

## Sklearn lag-feature baseline

`sklearn_lag_forecast.py` builds lag-1..lag-N features (optional rolling mean) and fits Ridge or RandomForest. Holdout uses the same short one-step protocol as the classical script. If the series is too short for lagging, the script prints a clear skip reason instead of failing hard.

```powershell
python sklearn_lag_forecast.py
python sklearn_lag_forecast.py --product-id sku-rice-1kg --model ridge --n-lags 7
python sklearn_lag_forecast.py --model random_forest --horizon-days 7
```

Importable helpers: `build_lag_feature_matrix`, `sklearn_lag_forecast`, `evaluate_sklearn_lag_holdout`.

## Method comparison report

`compare_forecast_methods.py` runs MA, exponential smoothing, and sklearn lag (Ridge) on the same holdout protocol and can write `docs/forecast-comparison-results.md`.

```powershell
python compare_forecast_methods.py
python compare_forecast_methods.py --write-md
python compare_forecast_methods.py --product-id sku-rice-1kg --write-md
```

Demo sklearn holdout numbers used by the Analytics compare API live in  
`../microservices/analytics/data/sklearn_holdout_cache.json`.

## Z-score anomaly evaluation

`evaluate_zscore_anomalies.py` scores the labeled demo set in
`data/anomaly_labels.json` with leave-one-out history per product and sweeps
z-score thresholds (default 2.0, 2.5, 3.0). It prints precision / recall / F1 and
can write `docs/anomaly-evaluation-results.md`.

```powershell
python evaluate_zscore_anomalies.py
python evaluate_zscore_anomalies.py --write-md
python evaluate_zscore_anomalies.py --thresholds 2.0,2.5,3.0 --write-md
```

Labels in `anomaly_labels.json` are injected demo ground truth for method checks,
not production fraud labels.

## Isolation Forest comparison

`compare_isolation_forest_anomalies.py` runs Isolation Forest on the same labeled
set and leave-one-out protocol, then writes a combined comparison into
`docs/anomaly-evaluation-results.md` (z-score vs Isolation Forest).

```powershell
python compare_isolation_forest_anomalies.py
python compare_isolation_forest_anomalies.py --write-md
python compare_isolation_forest_anomalies.py --contaminations 0.1,0.15,0.2 --write-md
```

## Demand shock simulation

`simulate_demand_shock.py` multiplies the last day(s) of a demo product series by a
spike factor (default 3×), then compares moving-average and exponential-smoothing
fit / holdout metrics and a last-day z-score before and after. It can write
`docs/demand-shock-simulation.md`. The input demand file is not modified.

```powershell
python simulate_demand_shock.py
python simulate_demand_shock.py --write-md
python simulate_demand_shock.py --product-id sku-oil-1l --spike-factor 4 --write-md
```

## Forecast evaluation CSV export

`export_forecast_evaluation_csv.py` runs the same MA / exponential smoothing /
sklearn Ridge holdout comparison and writes a flat CSV
(`productId`, `method`, `mae`, `mape`). Default output:
`../docs/samples/evaluation_rows.csv`.

```powershell
python export_forecast_evaluation_csv.py
python export_forecast_evaluation_csv.py --product-id sku-rice-1kg --output ../docs/samples/evaluation_rows.csv
```

Empty `mae` / `mape` cells mean that method could not be scored on that series
(for example, too short for sklearn lag features).

## Relation to the Node analytics service

| Concern | Node Analytics (`:3006`) | This folder |
|---|---|---|
| Live inventory / order UI | Yes | No |
| MA / ES forecast in production path | Yes | Reimplemented for comparison |
| Holdout MAE / MAPE | Yes (API) | Offline tables / plots |
| sklearn lag baseline | No | `sklearn_lag_forecast.py` |

Use the same demo demand history shape where possible so Node and Python results can be compared honestly.
