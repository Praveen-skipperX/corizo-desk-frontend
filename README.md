# Corizo Desk — Frontend

React + Vite SPA for Corizo Desk lead management.

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

By default Vite proxies `/api` to `http://localhost:5000`.

## Deploy on Vercel (GitHub)

1. Import **`corizo-desk-frontend`** in Vercel.
2. Framework preset: **Vite** (auto-detected).
3. Root directory: repository root (this project).
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variable:
   - **`VITE_API_URL`** = `https://YOUR_BACKEND_HOST/api`  
     Example: `https://corizo-desk-api.onrender.com/api`
7. Deploy.

Also set your backend **`FRONTEND_URL`** to the Vercel site URL  
(e.g. `https://corizo-desk.vercel.app`) so CORS and auth cookies work.

`vercel.json` is included for client-side routing (`/leads/:id`, etc.).
