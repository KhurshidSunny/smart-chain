# Authentication

The active app is `frontend-1`. IAM issues tokens. The other services check the access token.

## Session

- The access token lasts 1 hour. `frontend-1` keeps it in memory.
- The refresh token lasts 7 days (`REFRESH_TOKEN_EXPIRY`). It is an HttpOnly cookie named `smartchain_refresh`.
- A second cookie, `smartchain_csrf`, is readable by the page. Refresh and logout must send the same value in `X-CSRF-Token`.
- Logout revokes the refresh token. A reused refresh token clears the session.
- Login and registration no longer leave the refresh token in `localStorage`. On startup, `frontend-1` deletes any older `token`, `refreshToken`, and `user` entries.

`frontend/` is the previous UI. It still expects a refresh token in JSON and `localStorage`. Do not use it.

## Login and registration

`POST /auth/login` and `POST /auth/register` on IAM (port 3001) return `token`, `csrfToken`, and `user`. They do not return the refresh token in the body. Public registration creates a `customer`.

Login, registration, and refresh are limited to `AUTH_RATE_MAX` requests per IP per window (default 30 requests in 15 minutes).

## Authorization

Roles are created by `microservices/iam/scripts/initRoles.js`. Route checks use the `role` claim on the access token. Examples:

- Analytics forecast, demand, and reorder: `admin` or `inventory_manager`.
- Analytics anomalies: those roles, plus `sales_manager` and `warehouse_manager`. A `customer` sees only that customer's orders.
- Warehouse package create: `warehouse_staff` or `admin`.
- Shipment dispatch: `logistics_manager` or `admin`.

Passwords are hashed with bcrypt before they are stored. Set `COOKIE_SECURE=true` when IAM is served over HTTPS.
