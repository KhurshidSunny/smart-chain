# Forecast method comparison

Offline comparison of classical and supervised demand baselines used with
Smart-Chain analytics experiments. All methods use the same daily demand
history and the same short one-step holdout protocol (recent days held out,
refit on earlier history, score MAE / MAPE).

## Setup

- Input: `experiments/data/demo_daily_demand.json`
- Horizon: **7** days
- Sklearn lags: **7** (+ rolling mean feature)
- Classical methods (MA, ES, Croston) match
  `microservices/analytics/services/forecastService.js`
- Croston is preferred on the live path when a series is intermittent
  (at least 40% zero days and at least 2 demand events)

## Product `sku-oil-1l`

| Method | History days | Avg daily (fit) | MAE | MAPE (%) | Notes |
|---|---:|---:|---:|---:|---|
| Moving average | 14 | 6.4286 | 1.1905 | 16.04 | window=7; holdoutDays=3, points=3 |
| Exponential smoothing | 14 | 6.7161 | 1.0538 | 14.15 | alpha=0.3; holdoutDays=3, points=3 |
| Croston | 14 | 6.7161 | 1.0538 | 14.15 | events=14, zeroRatio=0.0, intermittent=False; holdoutDays=3, points=3 |
| Sklearn lag (Ridge) | 14 | 8.2290 | 1.6170 | 22.46 | nLags=7, trainRows=7; holdoutDays=3, points=3 |

## Product `sku-rice-1kg`

| Method | History days | Avg daily (fit) | MAE | MAPE (%) | Notes |
|---|---:|---:|---:|---:|---|
| Moving average | 14 | 16.7143 | 3.2381 | 16.27 | window=7; holdoutDays=3, points=3 |
| Exponential smoothing | 14 | 17.3512 | 3.4816 | 17.98 | alpha=0.3; holdoutDays=3, points=3 |
| Croston | 14 | 17.3512 | 3.4816 | 17.98 | events=14, zeroRatio=0.0, intermittent=False; holdoutDays=3, points=3 |
| Sklearn lag (Ridge) | 14 | 20.5960 | 5.6385 | 30.54 | nLags=7, trainRows=7; holdoutDays=3, points=3 |

## Product `sku-spare-filter`

| Method | History days | Avg daily (fit) | MAE | MAPE (%) | Notes |
|---|---:|---:|---:|---:|---|
| Moving average | 14 | 1.4286 | 2.0000 | 78.57 | window=7; holdoutDays=3, points=3 |
| Exponential smoothing | 14 | 1.7775 | 2.0124 | 79.38 | alpha=0.3; holdoutDays=3, points=3 |
| Croston | 14 | 1.6822 | 2.0318 | 47.61 | events=4, zeroRatio=0.7143, intermittent=True; holdoutDays=3, points=3 |
| Sklearn lag (Ridge) | 14 | 2.2526 | 1.3166 | 98.03 | nLags=7, trainRows=7; holdoutDays=3, points=3 |

## Interpretation

- `sku-oil-1l`: lowest holdout MAE on this demo file was **Exponential smoothing** (MAE=1.0538). Rankings can change with longer or noisier series.
- `sku-rice-1kg`: lowest holdout MAE on this demo file was **Moving average** (MAE=3.2381). Rankings can change with longer or noisier series.
- `sku-spare-filter`: lowest holdout MAE on this demo file was **Sklearn lag (Ridge)** (MAE=1.3166). Rankings can change with longer or noisier series.

## Limits

- Demo data only (synthetic daily demand in `experiments/data/`).
- Holdout windows are short by design (aligned with the live Analytics service).
- Sklearn needs enough history to build lag rows; very short SKUs are skipped.
- This is decision-support evaluation, not a claim of production deep learning.

## How to regenerate

```powershell
cd experiments
python compare_forecast_methods.py
python compare_forecast_methods.py --product-id sku-rice-1kg --write-md
```
