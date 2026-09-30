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
  data/          # demo demand exports (added with the loader scripts)
  *.py           # experiment scripts (added over time)
```

## Running scripts

With the virtual environment activated:

```powershell
python path\to\script.py
```

Each script should print a short summary (metrics or row counts) and exit with a clear error if the input series is too short.

## Relation to the Node analytics service

| Concern | Node Analytics (`:3006`) | This folder |
|---|---|---|
| Live inventory / order UI | Yes | No |
| MA / ES forecast in production path | Yes | Reimplemented for comparison |
| Holdout MAE / MAPE | Yes (API) | Offline tables / plots |
| sklearn baselines | No | Yes (planned scripts) |

Use the same demo demand history shape where possible so Node and Python results can be compared honestly.
