# frontend-1

Active web UI for Smart-Chain. React 19, Vite 6, Tailwind, React Router, and Zustand.

```bash
cd frontend-1
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. The API URLs in `.env` point at IAM through Analytics on ports 3001–3006.

`npm run lint` and `npm run build` are the checks used in pull requests. Session state lives in Zustand. The access token stays in memory. The refresh token is an HttpOnly cookie. See [docs/authentication/authentication.md](../docs/authentication/authentication.md).

The previous UI is `frontend/`. Do not start that folder.
