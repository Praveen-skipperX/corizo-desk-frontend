# Corizo Desk frontend release candidate

15 October 2026. Release with the backend's `security-performance-upgrade` branch. No production deployment was performed.

## Implemented

- Lazy-loaded route pages, with loading/error boundaries that retain the navigation shell.
- Shared single-flight token refresh across API clients, bounded requests, in-memory access tokens and private-cache reset on logout/account changes. Report downloads use the same client.
- Server-paged and debounced dashboard follow-up search; server-paged follow-up tabs. Filters retain existing lead fields and workflows.
- Dashboard/lead/follow-up retry feedback, background-refresh indicators, mobile sidebar overlay/collapse, accessible labels, keyboard table sorting and row activation, visible focus and reduced-motion support.
- Existing Corizo purple styling retained. Font connections are preconnected. Vercel receives CSP, clickjacking, MIME, referrer and HTTPS headers while hashed assets keep immutable caching.
- GitHub CI gates lint, client tests, production build and production dependency audit on Node 22.

## Measurements and tests

Original Vite entry bundle: 1,407.87 kB, 388.54 kB gzip. Final measured entry bundle: 315.54 kB, 100.51 kB gzip. Route chunks download separately; this is not an LCP/INP measurement. Dashboard charts remain a relatively large deferred chunk.

Five client regression tests passed: memory-only tokens, single-flight refresh, logout during refresh, login retry exclusion and authenticated one-time retry. The production build and lint pass; existing compiler-adoption/HMR diagnostics remain warnings. Some rules were reclassified as warnings because this application does not enable React Compiler; the report does not count those warnings as fixed.

Login was visually checked at desktop and 375-pixel mobile width. Authenticated visual workflows, live Sheets behavior, production logs and field web-vital measurements still need an isolated preview. Backend API tests cover real isolated MongoDB CRUD, scope, metrics, follow-ups, import failures/replay and exports. See the backend engineering report for details.

## Release checklist

1. `npm ci`, `npm run lint`, `npm test`, `npm run build` using Node 22.
2. Point `VITE_API_URL` at the isolated preview API. Never put credentials or service-account keys in `VITE_*` variables.
3. Configure the backend preview's exact frontend origin and isolated data services; confirm `PREVIEW_DATA_ISOLATED=true` only after isolation is verified.
4. Verify login/MFA/refresh/logout, every role, large lead lists and filters, follow-up pagination/actions, imports, reports, settings, users and courses. Check desktop/tablet/mobile dialogs and navigation with keyboard and screen reader.
5. Measure authenticated LCP/INP/CLS and navigation. Confirm CSP allows only intended integration traffic and personalized responses are never publicly cached.
6. Review the remaining development-only Tailwind dependency advisories separately; resolving them through a Tailwind major upgrade was deliberately avoided in this release. Production dependency audit was zero after compatible updates.
7. Promote both repositories only after preview validation. Preserve a rollback deployment and verify the existing production domain/integration settings before promotion.

`CHANGED_FILES.txt` lists changed paths. Credentials, generated audit files, caches and build output are excluded from the commit.
