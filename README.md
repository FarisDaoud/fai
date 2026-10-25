# Fai (created by Faris Daoud)

Zero-dependency Node server + the Fai web app.

## Run locally
    ANTHROPIC_API_KEY=sk-ant-... node server.js
    # open http://localhost:3000

## Deploy (Render, free tier)
1. Put this folder in a GitHub repo.
2. Render.com -> New -> Web Service -> pick the repo.
3. Build command: (empty)   Start command: `node server.js`
4. Environment -> add `ANTHROPIC_API_KEY` (from console.anthropic.com).
5. Settings -> Custom Domains -> add your domain (e.g. fai-faris.com) and follow the DNS steps.

Never put the API key in index.html. It lives only in the server environment.
Optional env vars: FAI_MODEL, FAI_DEEP_MODEL. Rate limit: 20 requests/min per visitor (edit server.js).
