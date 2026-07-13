# Snip CLI

Zero-dependency Node.js CLI for the [Snip](https://github.com/wilsonpek/ai-sdlc-snip-demo) URL shortener.

## Requirements

Node.js 18+ (uses the built-in global `fetch`)

## Quick start

```sh
# Run directly
node cli.js help

# Or install globally from this directory
npm install -g .
snip help
```

On Unix, make the wrapper executable first:
```sh
chmod +x snip
./snip help
```

## Commands

```
snip add <url>      Shorten a URL and print the short link
snip ls             List all short links
snip open <code>    Open a short link in the default browser
snip help           Show this help
```

## Environment

| Variable   | Default                 | Description         |
|------------|-------------------------|---------------------|
| `SNIP_API` | `http://localhost:3000` | Backend base URL    |

## Examples

```sh
$ snip add https://example.com/very/long/path
http://localhost:3000/aB3xZ9

$ snip ls
CODE    HITS  URL
------  ----  ------------------------------------
aB3xZ9     3  https://example.com/very/long/path

$ snip open aB3xZ9
Opening: https://example.com/very/long/path
```

## Wrappers

| File       | Platform        |
|------------|-----------------|
| `snip`     | Unix / macOS    |
| `snip.cmd` | Windows CMD     |
| `snip.ps1` | Windows PowerShell |
