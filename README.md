# Snip — URL Shortener

One backend, two clients. A Bun HTTP server exposes a tiny REST API; an Angular
web UI and a zero-dependency Node CLI both talk to it.

## Architecture

```
  Browser (Angular)  ──────────┐
  snip CLI (Node)    ──────────┤  HTTP
                               ▼
                  ┌────────────────────────┐
                  │  Bun backend           │
                  │  server.js             │
                  │  in-memory Map         │
                  └────────────────────────┘
```

## API Contract

| Method | Path | Body | Success | Error |
|--------|------|------|---------|-------|
| `POST` | `/api/links` | `{ "url": "https://…" }` | 201 `{ code, url, shortUrl, hits, createdAt }` | 400 — invalid JSON or non-http(s) URL |
| `GET` | `/api/links` | — | 200 — array of link objects (same shape) | — |
| `GET` | `/:code` | — | 302 → original URL (hits incremented) | 404 — unknown code |

CORS is open (`*`) on all endpoints; OPTIONS preflight returns 204.

## Branch-per-layer layout

| Branch | Contents |
|--------|----------|
| `backend` | `server.js` — Bun HTTP server, zero npm deps |
| `frontend` | Angular 19 SPA; builds to `dist/snip-frontend/browser/` |
| `cli` | `cli.js` — Node.js CLI, zero npm deps |
| `main` | **This file** + submodules pointing to the three branches above |

The `main` branch (this superproject) mounts each layer as a **Git submodule**
tracking its own branch of this same repository:

```
main/
├── .gitmodules
├── README.md
├── backend/    ← submodule → branch: backend
├── frontend/   ← submodule → branch: frontend
└── cli/        ← submodule → branch: cli
```

## Cloning

> Plain `git clone` leaves the `backend/`, `frontend/`, and `cli/` folders
> **empty**. Always pass `--recurse-submodules`.

```sh
git clone --recurse-submodules https://github.com/wilsonpek/ai-sdlc-snip-demo.git
```

Already cloned without the flag? Initialise and populate now:

```sh
git submodule update --init --recursive
```

## Running all three pieces

### 1 · Backend (requires [Bun](https://bun.sh))

```sh
cd backend
bun run server.js
# Listening on http://localhost:3000
```

| Env var | Default | Notes |
|---------|---------|-------|
| `PORT` | `3000` | Listening port |
| `BASE_URL` | `http://localhost:PORT` | Origin embedded in `shortUrl` values |
| `RAILWAY_PUBLIC_DOMAIN` | — | Auto-set by Railway; used as `BASE_URL` fallback |
| `PUBLIC_DIR` | — | Serve static files from this directory (Angular build output, for example) |

### 2 · Frontend (requires Node 18+)

```sh
cd frontend
npm install
npx ng serve          # → http://localhost:4200
```

The Angular app calls `http://localhost:3000`. Start the backend first.

To build for production:
```sh
npx ng build          # → dist/snip-frontend/browser/
```

Point the backend's `PUBLIC_DIR` at that folder to serve the SPA from the same origin.

### 3 · CLI (requires Node 18+, no install needed)

```sh
cd cli
node cli.js help
```

Or install globally to get the `snip` command in your PATH:

```sh
cd cli
npm install -g .

snip add https://example.com/very-long-url   # prints the short URL
snip ls                                       # aligned code / hits / URL table
snip open <code>                              # opens the link in your browser
```

Set `SNIP_API=https://your-deployed-backend.com` to point at a remote server.

## Update workflow

All development happens inside a submodule's own branch. After pushing there,
bump the superproject's recorded commit pointer:

```sh
# 1. Work inside a submodule on its own branch
cd backend
# ... edit server.js ...
git add .
git commit -m "fix: some backend change"
git push                        # pushes to the 'backend' branch

# 2. Back in the superproject root, advance the stored SHA
cd ..
git submodule update --remote backend   # fetches latest & moves HEAD
git add backend
git commit -m "chore: bump backend submodule to latest"
git push
```

Repeat for `frontend` or `cli` as needed. Running
`git submodule update --remote` without a path updates all three at once.

## bundle branch — generated deployment package

The `bundle` branch is machine-generated output assembled by
`scripts/build-bundle.mjs`. It contains everything needed to deploy or
Docker-ise the app in one place:

| File / Dir | Source |
|------------|--------|
| `server.js` | copied from `backend` branch |
| `cli.js` | copied from `cli` branch |
| `public/` | Angular build output from `frontend` branch |
| `.env` | generated — `PUBLIC_DIR=./public` (Bun auto-loads) |
| `package.json` | generated — `start: "bun server.js"`, no `type` field |
| `Dockerfile` | generated — `FROM oven/bun:1-alpine` |
| `railway.json` | generated — DOCKERFILE builder |

```
main/
└── bundle/   ← submodule → branch: bundle  (generated)
```

### Regenerating

```sh
# dry run — commits locally, does not push
node scripts/build-bundle.mjs

# publish — commits + pushes bundle and main
node scripts/build-bundle.mjs --push
```

The script is a **safe no-op** when nothing has changed upstream.
