# Public retail forecast evaluation

Offline rolling-origin scores on daily demand built from UCI Online Retail II.
This file is separate from the synthetic demo holdouts in
`forecast-comparison-results.md`. It is not the live Analytics forecast.

## Preparation

- Dataset: Chen, Daqing. (2015). Online Retail II [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C5CG6D
- License: CC BY 4.0. DOI: https://doi.org/10.24432/C5CG6D
- Related paper: Chen, D., Sain, S. L., and Guo, K. (2012). Data mining for the online retail industry: A case study of RFM model-based customer segmentation using data mining. Journal of Database Marketing and Customer Strategy Management, 19(3), 197-208.
- Transactions are cleaned by `experiments/ingest_uci_retail.py` (duplicates, blank stock codes, bad dates, cancellations, returns, invalid prices, and invalid quantities). Missing customer ids are counted and kept.
- A scored series is a continuous daily calendar that passes the thresholds in the config below.
- Transactions read: **1067371**.
- Duplicate rows removed: **34335**.
- Cancellations removed: **19104**.
- Returns removed: **3393**.
- Invalid prices removed: **2626**.
- Rows kept for demand: **1007913**.
- Kept rows with a missing customer id: **228488**.
- Series in the demand file: **3982**.
- Series scored: **3765**.
- Excluded as too short: **217**.
- Excluded as non-daily: **0**.
- Excluded for too few positive days: **0**.
- Excluded for low total quantity: **0**.

## Split and metrics

- Season length: **7** days.
- Horizon: **7** days. Origin step: **7** days.
- Minimum training length: **56** days.
- Validation origins: **4**. Test origins: **4**.
- Moving-average window: **7**. Smoothing alpha: **0.3**. Ridge alpha: **1.0**. Lags: **7**.
- Intermittent when the pre-validation zero-day ratio is at least **0.4**.
- The latest origins are kept. The validation block is immediately before the test block.
- Each origin uses only demand strictly before the origin date.
- The forecast repeats the previous season, walking forward with its own predictions when the horizon is longer than one season.
- Ridge is fit on lag rows inside the history. Later horizon days use predicted values. Ridge features are not scaled.
- The selected method is the lowest validation MAE. Ties keep the earlier method in the method list. Test rows are not used.
- Dense or intermittent is decided from the zero-day ratio before the first validation origin.
- Fold 1 is the earliest origin in the kept block and the last fold is the latest. A fold score pools every series at that protocol position. Calendar dates are not aligned across series.
- Macro: Unweighted mean of per-series scores. Micro: One score on the pooled points of every series in the group.
- MAPE skips zero actuals. It is not comparable to MAE, WAPE, or sMAPE when many days have zero demand.
- Sample standard deviation of per-series MAE inside the group.

The tables below use the **test** block. Validation is used only to count which method each series would have selected.

## Test results

Micro MAE matches macro MAE here because every scored series has the same number of test points.

### All scored series

Series: **3765**.

| Method | Micro MAE | Macro MAE | Micro WAPE | Micro sMAPE | Micro MAPE | Series MAE SD |
|---|---:|---:|---:|---:|---:|---:|
| Seasonal naive | 8.2431 | 8.2431 | 117.4916 | 66.0839 | 219.5261 | 18.3423 |
| Moving average | 7.7652 | 7.7652 | 110.6799 | 110.7705 | 167.8393 | 17.9324 |
| Exponential smoothing | 8.1055 | 8.1055 | 115.5297 | 142.6787 | 187.5644 | 18.0563 |
| Croston | 8.3364 | 8.3364 | 118.8218 | 163.2756 | 180.0094 | 18.8487 |
| Ridge lag | 7.8182 | 7.8182 | 111.4349 | 161.3698 | 164.8779 | 16.5638 |

### Dense series

Series: **272**.

| Method | Micro MAE | Macro MAE | Micro WAPE | Micro sMAPE | Micro MAPE | Series MAE SD |
|---|---:|---:|---:|---:|---:|---:|
| Seasonal naive | 29.2424 | 29.2424 | 100.6140 | 85.8876 | 276.9184 | 40.5566 |
| Moving average | 28.0323 | 28.0323 | 96.4503 | 105.4446 | 240.0958 | 40.6000 |
| Exponential smoothing | 29.4940 | 29.4940 | 101.4797 | 109.1988 | 273.2109 | 42.0625 |
| Croston | 29.1613 | 29.1613 | 100.3351 | 108.6057 | 266.2501 | 41.3607 |
| Ridge lag | 26.6981 | 26.6981 | 91.8599 | 108.1793 | 252.1028 | 36.0360 |

### Intermittent series

Series: **3493**.

| Method | Micro MAE | Macro MAE | Micro WAPE | Micro sMAPE | Micro MAPE | Series MAE SD |
|---|---:|---:|---:|---:|---:|---:|
| Seasonal naive | 6.6079 | 6.6079 | 124.7001 | 64.5418 | 208.7254 | 14.0703 |
| Moving average | 6.1870 | 6.1870 | 116.7574 | 111.1852 | 154.2412 | 13.5724 |
| Exponential smoothing | 6.4399 | 6.4399 | 121.5304 | 145.2857 | 171.4464 | 13.2557 |
| Croston | 6.7148 | 6.7148 | 126.7174 | 167.5327 | 163.7796 | 14.6211 |
| Ridge lag | 6.3480 | 6.3480 | 119.7954 | 165.5118 | 148.4628 | 12.8461 |

## Variability across test folds

Each column is test micro MAE at that protocol fold. Fold 1 is the earliest test origin in the kept block.

### All scored series

| Fold | Seasonal naive | Moving average | Exponential smoothing | Croston | Ridge lag |
|---|---|---|---|---|---|
| 1 (earliest) | 8.3145 | 7.9426 | 8.3091 | 8.5425 | 7.9039 |
| 2 | 8.1316 | 7.3977 | 7.5493 | 7.7522 | 7.3085 |
| 3 | 7.1958 | 6.6751 | 7.0634 | 7.3357 | 6.8730 |
| 4 (latest) | 9.3306 | 9.0455 | 9.5000 | 9.7153 | 9.1872 |
| Sample SD | 0.8750 | 0.9990 | 1.0617 | 1.0467 | 1.0058 |

### Dense series

| Fold | Seasonal naive | Moving average | Exponential smoothing | Croston | Ridge lag |
|---|---|---|---|---|---|
| 1 (earliest) | 30.8314 | 30.8443 | 32.3813 | 31.8330 | 27.9582 |
| 2 | 30.1203 | 26.9093 | 27.4653 | 27.5740 | 25.7232 |
| 3 | 27.5452 | 26.3673 | 27.6781 | 27.4910 | 25.8914 |
| 4 (latest) | 28.4727 | 28.0081 | 30.4512 | 29.7473 | 27.2195 |
| Sample SD | 1.5021 | 1.9951 | 2.3569 | 2.0649 | 1.0741 |

### Intermittent series

| Fold | Seasonal naive | Moving average | Exponential smoothing | Croston | Ridge lag |
|---|---|---|---|---|---|
| 1 (earliest) | 6.5611 | 6.1592 | 6.4346 | 6.7289 | 6.3423 |
| 2 | 6.4193 | 5.8783 | 5.9984 | 6.2086 | 5.8746 |
| 3 | 5.6112 | 5.1416 | 5.4581 | 5.7662 | 5.3920 |
| 4 (latest) | 7.8400 | 7.5689 | 7.8685 | 8.1555 | 7.7830 |
| Sample SD | 0.9218 | 1.0163 | 1.0328 | 1.0379 | 1.0324 |

## Where the methods land

- A micro WAPE above 100 means the summed absolute error is larger than the summed demand.
- All scored series: lowest test micro MAE was **Moving average** (7.7652). Highest test micro MAE was **Croston** (8.3364).
- All scored series: lowest test micro sMAPE was **Seasonal naive** (66.0839), not the MAE leader.
- All scored series: lowest test micro MAPE was **Ridge lag** (164.8779). MAPE skips zero actuals, so this ranking is not the MAE ranking.
- All scored series: validation MAE selected **Seasonal naive** for 1055 of 3765 series.
- All scored series: the method chosen most often on validation was not the lowest test micro MAE.
- All scored series: test-fold micro MAE for **Moving average** ran from 6.6751 to 9.0455 (sample SD 0.9990).
- Dense series: lowest test micro MAE was **Ridge lag** (26.6981). Highest test micro MAE was **Exponential smoothing** (29.4940).
- Dense series: lowest test micro sMAPE was **Seasonal naive** (85.8876), not the MAE leader.
- Dense series: lowest test micro MAPE was **Moving average** (240.0958). MAPE skips zero actuals, so this ranking is not the MAE ranking.
- Dense series: validation MAE selected **Ridge lag** for 87 of 272 dense series.
- Dense series: test-fold micro MAE for **Ridge lag** ran from 25.7232 to 27.9582 (sample SD 1.0741).
- Intermittent series: lowest test micro MAE was **Moving average** (6.1870). Highest test micro MAE was **Croston** (6.7148).
- Intermittent series: lowest test micro sMAPE was **Seasonal naive** (64.5418), not the MAE leader.
- Intermittent series: lowest test micro MAPE was **Ridge lag** (148.4628). MAPE skips zero actuals, so this ranking is not the MAE ranking.
- Intermittent series: validation MAE selected **Seasonal naive** for 984 of 3493 intermittent series.
- Intermittent series: the method chosen most often on validation was not the lowest test micro MAE.
- Intermittent series: test-fold micro MAE for **Moving average** ran from 5.1416 to 7.5689 (sample SD 1.0163).

## Limits

- Hyperparameters are fixed in `experiments/rolling_forecast_config.json`. They are not tuned on the test block.
- The weekly season is an assumption. A series with a different cycle is not given a different season length.
- Dense and intermittent labels use only the history before the first validation origin.
- MAPE skips zero actuals, so it answers a different question from MAE, WAPE, and sMAPE on intermittent series.
- The live Analytics service still uses its own short holdout and method switch. This document does not replace that path.
- Synthetic demo rankings stay in `forecast-comparison-results.md` and are not mixed into these tables.
- Runtime of the scoring run that wrote this summary: **160.306** seconds on that machine. `python generate_reports.py --check` rebuilds this markdown from the summary and does not re-score the workbook.

## Reproduce

```powershell
cd experiments
python ingest_uci_retail.py --download
python evaluate_rolling_forecast.py --input data/uci_processed/daily_demand.csv --summary-output ../docs/samples/retail_rolling_forecast_summary.json
python generate_reports.py
python generate_reports.py --check
```

- Demand file: `daily_demand.csv` SHA-256 `0edbfa977962b2a0f7add1e3ac9f484f00edcf9078299322de75c9b94b0a06f9`
- Workbook SHA-256 recorded by ingestion: `bcbe73b35f5b7babf197fb0cb983a11f5d9ff929078d4aa53d171b1f2df2e980`
- Summary JSON: `docs/samples/retail_rolling_forecast_summary.json` SHA-256 `88af5cad34145eebb26c27b6ed2c2028f00ff374c23109436caf086fa443c058`
