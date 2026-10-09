# Demand shock simulation

Offline stress check for Smart-Chain analytics: inject a sudden jump into
the end of a demo daily-demand series, then compare classical forecast
outputs and a simple last-day z-score before and after the spike.

## Setup

- Input: `experiments/data/demo_daily_demand.json`
- Product: `sku-rice-1kg`
- Horizon: **7** days
- Spike: multiply the last **1** day(s) by **3×**
- Forecast methods match `microservices/analytics/services/forecastService.js`

## Series snapshot

| Scenario | History days | Last date | Last quantity |
|---|---:|---|---:|
| Baseline | 14 | 2025-01-14 | 21.0000 |
| After spike | 14 | 2025-01-14 | 63.0000 |

## Forecast before vs after

| Method | Scenario | Avg daily (fit) | Predicted demand | Holdout MAE | Holdout MAPE (%) |
|---|---|---:|---:|---:|---:|
| Moving average | Baseline | 16.7143 | 117.0000 | 3.2381 | 16.27 |
| Moving average | After spike | 22.7143 | 159.0000 | 17.2381 | 33.21 |
| Exponential smoothing | Baseline | 17.3512 | 121.4582 | 3.4816 | 17.98 |
| Exponential smoothing | After spike | 29.9512 | 209.6582 | 17.4816 | 34.69 |

## Last-day z-score (series analogue of order-size anomaly)

Uses prior days in the same product series as the peer set (needs 3+ prior days).
The live service applies z-score to order-line quantities, not daily aggregates;
this table only shows how a sudden jump stands out on the demo series.

| Scenario | Date | Quantity | Peer mean | Peer std | Z-score |
|---|---|---:|---:|---:|---:|
| Baseline | 2025-01-14 | 21.0000 | 14.6923 | 3.1473 | 2.0042 |
| After spike | 2025-01-14 | 63.0000 | 14.6923 | 3.1473 | 15.3491 |

## Interpretation

- After the spike, both MA and ES raise average daily demand and predicted demand;
  ES reacts more when the jump is on the most recent day (higher weight on the latest observation).
- Holdout MAE/MAPE often worsen when the holdout window includes the spiked day,
  because earlier history no longer matches the jump.
- The last-day z-score rises sharply after the spike, which matches the idea behind
  the live order-quantity anomaly badge (unusual size vs same-product history).

## Limits

- Synthetic demo series only; one product and one spike factor.
- Spike is applied in memory; the input JSON file is not modified.
- Not a production stress test or claim about retail-scale demand shocks.

## How to regenerate

```powershell
cd experiments
python simulate_demand_shock.py --write-md
python simulate_demand_shock.py --product-id sku-oil-1l --spike-factor 4 --write-md
```
