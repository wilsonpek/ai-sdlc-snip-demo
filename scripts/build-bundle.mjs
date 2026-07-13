#!/usr/bin/env node
// scripts/build-bundle.mjs — zero deps, Node 18+, cross-platform (Windows/macOS/Linux/CI)
// Usage:  node scripts/build-bundle.mjs [--push]

import { execSync }                               from 'child_process';
import { cpSync, existsSync, rmSync, writeFileSync } from 'fs';
import { resolve, join, dirname }                 from 'path';
import { fileURLToPath }                          from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

/** Absolute path to the superproject root (scripts/../) */
const ROOT   = resolve(__dirname, '..');
const BUNDLE = join(ROOT, 'bundle');
const PUSH   = process.argv.includes('--push');

// ─── helpers ──────────────────────────────────────────────────────────────────

function run(cmd, cwd = ROOT) {
  const rel = cwd === ROOT ? '' : `  [${cwd.slice(ROOT.length + 1).replace(/\\/g, '/')}]`;
  console.log(`  $ ${cmd}${rel}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

/** Returns true when the index has staged changes relative to HEAD. */
function hasStagedChanges(cwd) {
  try {
    execSync('git diff --cached --quiet', { cwd, stdio: 'ignore' });
    return false;   // exit 0 → clean
  } catch {
    return true;    // exit 1 → staged diffs present
  }
}

/** Set local git identity inside a repo if it is not already configured. */
function ensureGitIdentity(cwd) {
  try {
    execSync('git config user.email', { cwd, stdio: 'ignore' });
  } catch {
    run('git config user.email wilson@snip.dev', cwd);
    run('git config user.name Wilson', cwd);
  }
}

// ─── 1. update submodules to their remote branch tips ─────────────────────────

console.log('\n── 1 · update submodules ────────────────────────────────────────');
run('git submodule update --init --remote backend frontend cli');

// ─── 2. build frontend ────────────────────────────────────────────────────────

const FRONTEND = join(ROOT, 'frontend');
const DIST_DIR = join(FRONTEND, 'dist', 'snip-frontend', 'browser');
const DIST_IDX = join(DIST_DIR, 'index.html');

console.log('\n── 2 · build frontend ───────────────────────────────────────────');
run('npm install', FRONTEND);
run('npx ng build', FRONTEND);

if (!existsSync(DIST_IDX)) {
  console.error(`\nERROR: ${DIST_IDX} not found — ng build may have failed.`);
  process.exit(1);
}
console.log('  ✓ dist/snip-frontend/browser/index.html present');

// ─── 3. assemble bundle/ ─────────────────────────────────────────────────────

console.log('\n── 3 · assemble bundle/ ─────────────────────────────────────────');

// server.js — Bun backend, unchanged
cpSync(join(ROOT, 'backend', 'server.js'), join(BUNDLE, 'server.js'));
console.log('  server.js     ← backend/server.js');

// cli.js — Node CLI, unchanged
cpSync(join(ROOT, 'cli', 'cli.js'), join(BUNDLE, 'cli.js'));
console.log('  cli.js        ← cli/cli.js');

// public/ — Angular SPA build output; delete first so removed files don't linger
const DST_PUBLIC = join(BUNDLE, 'public');
if (existsSync(DST_PUBLIC)) rmSync(DST_PUBLIC, { recursive: true, force: true });
cpSync(DIST_DIR, DST_PUBLIC, { recursive: true });
console.log('  public/       ← frontend/dist/snip-frontend/browser/');

// .env — Bun auto-loads this; PUBLIC_DIR switches backend into also-serve-SPA mode
writeFileSync(join(BUNDLE, '.env'), 'PUBLIC_DIR=./public\n');
console.log('  .env          (PUBLIC_DIR=./public)');

// package.json — NO "type" field so cli.js still runs under plain node
writeFileSync(
  join(BUNDLE, 'package.json'),
  JSON.stringify({
    name: 'snip-bundle',
    version: '1.0.0',
    description: 'Generated: Bun backend + Angular SPA + Node CLI',
    scripts: { start: 'bun server.js' },
    engines: { bun: '>=1', node: '>=18' },
  }, null, 2) + '\n',
);
console.log('  package.json');

// Dockerfile
writeFileSync(join(BUNDLE, 'Dockerfile'), [
  'FROM oven/bun:1-alpine',
  'WORKDIR /app',
  'COPY . .',
  'ENV PORT=3000',
  'EXPOSE 3000',
  'CMD bun server.js',
  '',
].join('\n'));
console.log('  Dockerfile');

// .dockerignore
writeFileSync(join(BUNDLE, '.dockerignore'), [
  '.git',
  'node_modules',
  '*.md',
  '',
].join('\n'));
console.log('  .dockerignore');

// railway.json — use Dockerfile builder on Railway
writeFileSync(
  join(BUNDLE, 'railway.json'),
  JSON.stringify({
    $schema: 'https://railway.app/railway.schema.json',
    build: { builder: 'DOCKERFILE' },
  }, null, 2) + '\n',
);
console.log('  railway.json');

// ─── 4. commit inside bundle/ ────────────────────────────────────────────────

console.log('\n── 4 · commit bundle/ ───────────────────────────────────────────');
ensureGitIdentity(BUNDLE);
run('git add -A', BUNDLE);

if (hasStagedChanges(BUNDLE)) {
  run('git commit -m "build: update bundle output"', BUNDLE);
  console.log('  committed bundle/');
} else {
  console.log('  bundle/ — nothing to commit (no changes detected)');
}

// Push when --push (unconditional so prior-run commits are published too)
if (PUSH) {
  // submodule checkout is detached HEAD; push current commit to the bundle branch
  run('git push origin HEAD:bundle', BUNDLE);
  console.log('  pushed → origin/bundle');
}

// ─── 5. bump superproject submodule pointers ─────────────────────────────────

console.log('\n── 5 · bump superproject pointers ──────────────────────────────');
run('git add bundle backend frontend cli');

if (hasStagedChanges(ROOT)) {
  run('git commit -m "chore: bump submodule pointers"');
  console.log('  committed superproject');
} else {
  console.log('  superproject — nothing to commit');
}

if (PUSH) {
  run('git push');
  console.log('  pushed → origin/main');
}

console.log('\n── done ─────────────────────────────────────────────────────────');
