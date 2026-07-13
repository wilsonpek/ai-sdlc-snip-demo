# Snip Design System

Inspired by lovable.dev's visual language: dark minimal pages with a warm
coral/pink/purple gradient glow behind the hero, generous whitespace, a
pill-rounded chat-style input as the centrepiece, and generously rounded cards
below. One bold centred headline, one muted subline, then breathing room.

---

## Color tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#09090b` | Page background (near-black) |
| `--surface` | `#111113` | Input / form background |
| `--card` | `#18181b` | Table / card background |
| `--border` | `rgba(255,255,255,0.08)` | Card borders, table row dividers |
| `--border-input` | `rgba(255,255,255,0.14)` | Input pill border (at rest) |
| `--text` | `#f4f4f5` | Primary text |
| `--muted` | `#71717a` | Sublines, labels, secondary text |
| `--accent-from` | `#f97316` | Gradient start (orange) |
| `--accent-mid` | `#ec4899` | Gradient midpoint (pink) |
| `--accent-to` | `#a855f7` | Gradient end (purple) |

## Accent gradient

```css
background: linear-gradient(135deg, #f97316, #ec4899, #a855f7);
```

Applied to: button background, the word "Snip" in the hero headline.

## Hero glow

```css
background: radial-gradient(
  ellipse 70% 50% at 50% -10%,
  rgba(249, 115, 22, 0.22),
  rgba(236, 72, 153, 0.14),
  transparent 70%
);
```

A warm coral-to-pink radial burst above the hero, fading to the page background.
Placed on a non-interactive `.glow` sibling with `pointer-events: none`.

---

## Typography

| Role | Value |
|---|---|
| **Font stack** | `system-ui, -apple-system, sans-serif` |
| Hero title | `clamp(2rem, 5vw, 3.5rem)` · weight 700 · `letter-spacing: -0.04em` |
| Subline | `1rem` · weight 400 · color `--muted` |
| Body | `0.9375rem` · weight 400 |
| Labels / section headings | `0.8125rem` · weight 500–600 · uppercase + wide tracking |

---

## Spacing

| Role | Value |
|---|---|
| Hero vertical padding | `6rem 0 3.5rem` |
| Section max-width | `760 px` |
| Between form and table | flex `gap: 0.875rem` |

---

## Border radii

| Token | Value | Usage |
|---|---|---|
| `--radius-pill` | `9999px` | Input bar, buttons, notice banners |
| `--radius-card` | `1rem` (16 px) | Cards, tables |

---

## Borders, shadows & glow

| Element | Rule |
|---|---|
| Card | `1px solid rgba(255,255,255,0.08)` + `box-shadow: 0 1px 20px rgba(0,0,0,0.45)` |
| Input pill (rest) | `1px solid rgba(255,255,255,0.14)` |
| Input pill (focus-within) | `border-color: rgba(249,115,22,0.5)` + `box-shadow: 0 0 0 3px rgba(249,115,22,0.15)` |

---

## Element → design mapping

| Snip element | Design role |
|---|---|
| Page title + tagline | **Hero**: bold centred headline + muted subline; warm glow pseudo-element behind |
| URL input + "Snip it" button | **Chat-style pill**: dark surface, pill border, gradient button attached inside the pill on the right |
| Success notice | Pill-rounded banner, warm-orange tint, below the input |
| Error notice | Pill-rounded banner, red tint, below the input |
| Links list | **Card**: dark bg, `--radius-card`, subtle border, shadow; row dividers via `--border` |
| Short code | Bold, `--accent-from` coloured link |
| Original URL | Muted, ellipsis-truncated, opens in new tab |
| Hit count | Muted, right-aligned in a narrow column |
