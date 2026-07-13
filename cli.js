#!/usr/bin/env node
'use strict';

const BASE = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/+$/, '');

const USAGE = `Usage:
  snip add <url>      Shorten a URL and print the short link
  snip ls             List all short links
  snip open <code>    Open a short link in the default browser
  snip help           Show this help

Environment:
  SNIP_API            Backend base URL (default: http://localhost:3000)`;

function die(msg) {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

async function apiFetch(path, options) {
  try {
    return await fetch(BASE + path, options);
  } catch (err) {
    die(`Error: cannot reach ${BASE} — ${err.message}`);
  }
}

/* ── snip add <url> ─────────────────────────────────────────── */
async function cmdAdd(url) {
  if (!url) die('Usage: snip add <url>');
  if (!/^https?:\/\/\S+/.test(url)) die('Error: URL must start with http:// or https://');

  const res = await apiFetch('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  let data;
  try { data = await res.json(); } catch { die('Error: invalid JSON from server'); }
  if (!res.ok) die(`Error: ${data.error || res.statusText}`);
  console.log(data.shortUrl);
}

/* ── snip ls ────────────────────────────────────────────────── */
async function cmdLs() {
  const res = await apiFetch('/api/links');
  let links;
  try { links = await res.json(); } catch { die('Error: invalid JSON from server'); }
  if (!res.ok) die(`Error: ${links.error || res.statusText}`);

  if (links.length === 0) {
    console.log('No links yet.');
    return;
  }

  const codeW = Math.max(4, ...links.map(l => l.code.length));
  const hitsW = Math.max(4, ...links.map(l => String(l.hits).length));
  const row = (code, hits, url) =>
    `${String(code).padEnd(codeW)}  ${String(hits).padStart(hitsW)}  ${url}`;

  console.log(row('CODE', 'HITS', 'URL'));
  console.log(`${'-'.repeat(codeW)}  ${'-'.repeat(hitsW)}  ${'-'.repeat(36)}`);
  for (const link of links) {
    console.log(row(link.code, link.hits, link.url));
  }
}

/* ── snip open <code> ───────────────────────────────────────── */
async function cmdOpen(code) {
  if (!code) die('Usage: snip open <code>');

  const res = await apiFetch(`/${code}`, { redirect: 'manual' });

  if (res.status === 404) die(`Error: unknown code "${code}"`);
  if (res.status < 300 || res.status >= 400) {
    die(`Error: unexpected status ${res.status} from server`);
  }

  const location = res.headers.get('location');
  if (!location) die('Error: redirect received but no Location header present');

  const { spawn } = require('child_process');
  const [cmd, args] =
    process.platform === 'win32'  ? ['cmd',      ['/c', 'start', '', location]] :
    process.platform === 'darwin' ? ['open',     [location]] :
                                    ['xdg-open', [location]];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
  console.log(`Opening: ${location}`);
}

/* ── main ───────────────────────────────────────────────────── */
async function main() {
  const [, , cmd, arg] = process.argv;

  if (cmd === 'add')                      return cmdAdd(arg);
  if (cmd === 'ls')                       return cmdLs();
  if (cmd === 'open')                     return cmdOpen(arg);
  if (!cmd || cmd === 'help'
           || cmd === '--help'
           || cmd === '-h')             { console.log(USAGE); return; }

  die(`Unknown command: "${cmd}"\n\n${USAGE}`);
}

main().catch(err => die(`Fatal: ${err.message}`));
