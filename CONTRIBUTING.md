# Contributing

Use `frontend-1` for UI changes. Leave `frontend/` as the previous UI.

Match the service you are editing. Keep changes small. Do not commit `.env` files or print their values.

Before a pull request, from a clean checkout:

```bash
cd microservices/analytics && npm ci && npm test
cd ../../frontend-1 && npm ci && npm run lint && npm run build
cd ../experiments && pip install -r requirements.txt && python generate_reports.py --check
cd ../microservices/iam && npm ci && npm test && node --check app.js
cd ../sales && npm ci && npm test && node --check app.js
cd ../inventory && npm ci && node --check app.js
cd ../warehouse && npm ci && node --check app.js
cd ../logistics && npm ci && node --check app.js
cd ../smoke && npm ci && npm test && node --check smoke-order.js
```

Node 20 and Python 3.13 are the versions in `.nvmrc` and `.python-version`. The full order smoke test needs the six services and a MongoDB replica set: `cd microservices/smoke && npm run smoke`.

A license file is not in this repository. Add one only after the team and the institute agree on the terms.
