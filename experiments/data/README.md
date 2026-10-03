# Demo demand files for offline experiments

| File | Format | Contents |
|---|---|---|
| `demo_daily_demand.json` | JSON | Two SKUs, 14 days each |
| `demo_daily_demand.csv` | CSV | Same schema, shorter sample |
| `anomaly_labels.json` | JSON | Labeled order-line quantities for anomaly evaluation |

## Required fields (daily demand)

| Field | Type | Meaning |
|---|---|---|
| `productId` | string | Product / SKU id |
| `date` | `YYYY-MM-DD` | Calendar day |
| `quantity` | number ≥ 0 | Demand units that day |

## Anomaly label file (`anomaly_labels.json`)

| Field | Type | Meaning |
|---|---|---|
| `orderLineId` | string | Demo order-line id |
| `productId` | string | Product / SKU id (`sku-rice-1kg`, `sku-oil-1l`) |
| `quantity` | number ≥ 0 | Units on that order line |
| `label` | `0` or `1` | `0` = normal, `1` = anomaly |
| `note` | string | Short reason for the label |

Labels are **injected demo ground truth** for precision/recall experiments. Normal rows use typical order sizes for each SKU; anomaly rows were hand-added with extreme high or near-zero quantities. They are **not** production fraud or ops labels.

Counts in the current file: 34 normal rows, 8 anomaly rows (4 per SKU).

These files are synthetic demo data for reproducible scripts. They are not live MongoDB exports and contain no credentials.
