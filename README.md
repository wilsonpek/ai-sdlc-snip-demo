# Snip — URL Shortener Backend

Tiny URL shortener API built with [Bun](https://bun.sh). Zero dependencies.

## Quick start

```sh
bun run server.js   # or: bun start
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port to listen on |
| `BASE_URL` | `http://localhost:PORT` | Origin used in `shortUrl` values |
| `RAILWAY_PUBLIC_DOMAIN` | — | Set automatically by Railway; used as BASE_URL fallback |
| `PUBLIC_DIR` | — | Absolute path to a folder of static files to serve |

When `PUBLIC_DIR` is set, `GET /` returns `index.html` and any matching file
is served before a short-code lookup is attempted.

## API

### `POST /api/links`

Create a short link.

**Request body**
```json
{ "url": "https://example.com" }
```

**Response 201**
```json
{
  "code": "aB3xZ9",
  "url": "https://example.com",
  "shortUrl": "https://your-domain/aB3xZ9",
  "hits": 0,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Response 400** — invalid JSON or non-http(s) URL.

---

### `GET /api/links`

Returns all links as a JSON array (same shape as above).

---

### `GET /:code`

Redirects (302) to the original URL and increments the hit counter.
Returns 404 JSON if the code is unknown.

---

CORS is open (`*`) on all endpoints; OPTIONS preflight returns 204.
