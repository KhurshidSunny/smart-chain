# Security

Report a vulnerability through the issue tracker of the repository that hosts this copy. Do not include live tokens, passwords, or `.env` contents in the report.

What the current tree does:

- Access tokens expire after 1 hour and stay in memory in `frontend-1`.
- Refresh tokens are HttpOnly cookies. Refresh and logout require a matching `X-CSRF-Token`.
- Browser calls are limited to `CORS_ORIGINS`. The default is `http://localhost:5173` and `http://127.0.0.1:5173`.
- JSON bodies default to 100kb. IAM login, registration, and refresh are rate limited.
- Logs redact passwords, tokens, cookies, and contact fields.
- Order totals are calculated from catalog prices. The client price is ignored.
- `.env` files are not committed. `JWT_SECRET` must be the same on every service.

Set `COOKIE_SECURE=true` when IAM is served over HTTPS. The container RabbitMQ user `smartchain` is for the local compose network only.
