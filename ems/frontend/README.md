# Northstar EMS frontend

Responsive React + TypeScript client for the Northstar EMS FastAPI backend. The application uses real API services through a central Axios instance; query data is never mocked.

## Install and run

```bash
cd ems/frontend
npm install
cp .env.example .env
npm run dev
```

The frontend runs at `http://localhost:5173`. By default, Axios calls `/api/v1`; Vite proxies `/api` and `/health` to the backend at `http://127.0.0.1:8000`. Start FastAPI separately, configured with a matching CORS origin if the API is called directly. Change the development proxy target with `EMS_API_PROXY` rather than embedding localhost in browser-facing code.

## Environment

```env
VITE_API_URL=/api/v1
EMS_API_PROXY=http://127.0.0.1:8000
```

For deployments where the frontend and API do not share an origin, set `VITE_API_URL` to the API's public HTTPS base (for example, `https://api.example.com/api/v1`) and configure the backend's exact `CORS_ORIGINS` accordingly. Never place signing keys, database credentials, or admin passwords in Vite variables.

## Build and checks

```bash
npm run typecheck
npm run build
npm run preview
```

## Client architecture

- `src/services/api.ts` configures Axios, in-memory access tokens, session-scoped refresh storage, automatic bearer headers, one-time refresh rotation, and API error parsing.
- `src/services/*Api.ts` contains typed auth, admin, manager, employee, task, and permission methods.
- `src/context/AuthContext.tsx` restores sessions, exposes the current account, and evaluates page/action grants.
- `src/routes/RouteGuards.tsx` protects authenticated, role-restricted, and permission-restricted routes.
- `src/layouts` provides separate responsive Admin, Manager, and Employee navigation shells.
- TanStack Query manages server state and cache invalidation; Sonner displays operation results and API validation errors.

The access token remains in memory. The rotating refresh token is the only token stored in `sessionStorage`; logging out revokes it through FastAPI. Frontend hiding is only a usability layer—the backend remains authoritative for all access decisions.
