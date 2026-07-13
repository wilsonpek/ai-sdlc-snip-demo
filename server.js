// Snip — tiny URL shortener (Bun, zero dependencies)

const PORT = parseInt(process.env.PORT || "3000", 10);
const BASE_URL =
  process.env.BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`);
const PUBLIC_DIR = process.env.PUBLIC_DIR ?? null;

// ---------- store ----------
/** @type {Map<string, {code:string, url:string, shortUrl:string, hits:number, createdAt:string}>} */
const links = new Map();

// ---------- helpers ----------
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function randomCode(len = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let s = "";
  for (const b of bytes) s += BASE62[b % 62];
  return s;
}

function uniqueCode() {
  let code;
  do { code = randomCode(); } while (links.has(code));
  return code;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** Serve a static file from PUBLIC_DIR; returns null when not found. */
async function serveStatic(pathname) {
  if (!PUBLIC_DIR) return null;
  const rel = pathname === "/" ? "/index.html" : pathname;
  const file = Bun.file(PUBLIC_DIR + rel);
  return (await file.exists()) ? new Response(file, { headers: CORS }) : null;
}

// ---------- server ----------
Bun.serve({
  port: PORT,

  async fetch(req) {
    const { pathname } = new URL(req.url);
    const method = req.method;

    // CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // POST /api/links — create a short link
    if (method === "POST" && pathname === "/api/links") {
      let body;
      try { body = await req.json(); }
      catch { return jsonRes({ error: "Invalid JSON" }, 400); }

      const { url } = body ?? {};
      if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
        return jsonRes({ error: "url must be a valid http(s) URL" }, 400);
      }

      const code = uniqueCode();
      const link = {
        code,
        url,
        shortUrl: `${BASE_URL}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return jsonRes(link, 201);
    }

    // GET /api/links — list all links
    if (method === "GET" && pathname === "/api/links") {
      return jsonRes([...links.values()]);
    }

    // GET — static files win over short codes
    if (method === "GET") {
      const staticRes = await serveStatic(pathname);
      if (staticRes) return staticRes;

      // GET /:code — redirect
      if (pathname.length > 1) {
        const code = pathname.slice(1);
        const link = links.get(code);
        if (!link) return jsonRes({ error: "Not found" }, 404);
        link.hits++;
        return new Response(null, {
          status: 302,
          headers: { ...CORS, Location: link.url },
        });
      }
    }

    return jsonRes({ error: "Not found" }, 404);
  },
});

console.log(`Snip listening on port ${PORT}  BASE_URL: ${BASE_URL}`);
