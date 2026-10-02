# Demo demand files for offline experiments

| File | Format | Contents |
|---|---|---|
| `demo_daily_demand.json` | JSON | Two SKUs, 14 days each |
| `demo_daily_demand.csv` | CSV | Same schema, shorter sample |

## Required fields

| Field | Type | Meaning |
|---|---|---|
| `productId` | string | Product / SKU id |
| `date` | `YYYY-MM-DD` | Calendar day |
| `quantity` | number ≥ 0 | Demand units that day |

These files are synthetic demo data for reproducible scripts. They are not live MongoDB exports and contain no credentials.
