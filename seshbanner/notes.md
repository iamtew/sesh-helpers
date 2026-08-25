# Sesh Banner — operator notes

OBS Browser Source overlay: title/message banner with layouts, fonts, drag positioning,
and an optional public YouTube playlist ticker. Config lives entirely in the URL—one
less state machine for the meat bags to feed.

## Transparent background (OBS)

Page background is **transparent** so the banner composites over your scene. Do not set an opaque `html`/`body` fill.

- Header ▚ checkerboard = settings-mode preview only (`checkerboard`).
- **Background** section (`bg`) = persistent demo backdrop (visible even with `menu=DISABLE`). Use `bg=0` for clean OBS output.

## Installation

1. Browser Source → URL `https://helpers.seshsofa.nl/seshbanner/` → canvas resolution (e.g. `1920×1080`).
2. Enable *Shutdown when not visible* + *Refresh when scene becomes active*.
3. Interact → configure live → ✕ close → **Copy URL for OBS** → paste into source URL.

## Configuration

- Double-click background to open the settings menu when hidden.
- Drag the banner (settings open only) to set position — its center follows the
  pointer and is saved as `bannerX` / `bannerY`.
- Banner cannot move when `menu=DISABLE`.
- **Theme** section (between Layout and Size) picks the overlay look. LCD Glass is the default; Sesh Glass is also available.

## URL params

| Param | Meaning | Default |
|-------|---------|---------|
| `title` | Banner title | `TITLE` |
| `message` | Banner message | `Message` |
| `prefix` | Optional playlist prefix (layout 3) | empty |
| `prefixEnabled` | Show prefix before playlist content | `false` |
| `prefixAlign` | Prefix text alignment `left` · `center` · `right` | `left` |
| `nameAlign` | Playlist-name alignment `left` · `center` · `right` | `left` |
| `prefixFont` | Prefix font index (0–9, layout 3) | `0` |
| `prefixSize` | Prefix font size (px, 16–96, layout 3) | `38` |
| `layout` | `1` inline · `2` stacked accent · `3` YouTube playlist | `1` |
| `theme` | Overlay theme id (`lcd-glass` · `sesh-glass`) | `lcd-glass` |
| `titleFont` / `messageFont` | Font **index** in combined list (0–9) | title `0` Monster Chiller · message `5` Better VCR |
| `titleSize` | Title font size (px, 16–96) | `38` |
| `messageSize` | Message font size (px, 12–64) | `18` |
| `width` | Banner width size (%, 25–1000) | `100` |
| `height` | Banner height size (%, 25–1000) | `100` |
| `bannerX` / `bannerY` | Position (% of viewport) | `50` / `85` |
| `playlist` | YouTube playlist URL or id (layout 3) | empty |
| `playlistLayout` | Ticker layout `1`–`4` (layout 3) | `1` |
| `playlistDelimiter` | Ticker item delimiter `0`–`5` (layout 3) | `0` (bullet) |
| `playlistDelimiterCustom` | Custom delimiter text (1–5 chars, when `5`) | `•` |
| `marqueeSpeed` | Ticker scroll speed `25`–`400`% (layout 3) | `100` |
| `menu` | `ON` or `DISABLE` | `ON` |
| `side` | Settings panel `left` \| `right` | `right` |
| `bg` | Demo background `0`–`3` | `0` (None) |
| `checkerboard` | Settings preview backdrop | `false` |

Example:

`https://helpers.seshsofa.nl/seshbanner/?title=LIVE&message=Starting%20soon&layout=1&menu=DISABLE&bg=0`

## Background (`bg`)

Persistent demo layer at 0.75 opacity. Independent of the header ▚ toggle.

| Value | Mode |
|-------|------|
| `0` | None (default) |
| `1` | Session — `img/apartment_panorama.png`, height-matched, centered |
| `2` | Linear gradient `#0FF` → `#F0F` (animated slide) |
| `3` | Radial gradient `#0FF` / `#F0F` (animated) |

## Theme

See [`docs/THEMES.md`](../docs/THEMES.md). Overlay look is separate from layout and fonts.

- **LCD Glass** — frosted navy-cyan glass with pulsing magenta/cyan LCD fringing.
- **Sesh Glass** — frosted red-to-lime glass with a retro halftone screen and pulsing red glow.

## Layouts

1. **Inline** — `title | message` with a font-colored bar delimiter between them (chromatic fringe from the active theme).
2. **Stacked accent** — title over message, left font-colored accent bar (lower-third feel).
3. **YouTube playlist** — public playlist extract (`playlist.js`) with a left-scrolling ticker. Optional **Prefix** in Content (`prefix` + `prefixEnabled`) appears as `Prefix | …` before all sub-layouts. Sub-layouts (`playlistLayout`):
   1. Playlist name over `title by channel` ticker
   2. Playlist name | channel ticker
   3. Playlist name | title ticker
   4. `title by channel` ticker (no name)

## Size

**Width / height** (`width` / `height`, 25–1000%) size the banner box (padding + max-width). Type scales with **`min(width, height)`** so glyphs stay proportional — no CSS stretch. Crank both toward 1000 to nearly fill the canvas. Fonts section sets base title/message px; Size multiplies them.

Legacy `scale` / `scaleX` / `scaleY` still load, then rewrite to `width` / `height`.

Per-control **↺** resets that setting to its default (sliders, fonts, position). **Reset all** still clears everything.

## Fonts

See [`docs/TYPOGRAPHY.md`](../docs/TYPOGRAPHY.md). Title and message pickers share one combined list (Display + Regular). In playlist layout, labels become **Playlist name** / **Ticker**; **Prefix font** appears in Fonts when prefix is enabled. Size sliders sit under each font picker and persist as `titleSize` / `messageSize`.

**Combined index (`titleFont` / `messageFont`):** `0` Monster Chiller · `1` YouMurderer BB · `2` Streetmark · `3` Germania One · `4` Konstruktor · `5` Better VCR · `6` Flapdoodle · `7` Londrina Solid · `8` Pill Gothic 600mg · `9` Segoe UI

Legacy URLs that still use font names are accepted on load, then rewritten to indices.

## Playlist data

Layout 3 accepts a public YouTube playlist URL or bare playlist ID. The clanker first
tries a small list of public Invidious instances, then YouTube's public RSS feed
through feed-to-JSON relays. No API key is required.

These are third-party network services and may be unavailable or rate-limited. The
banner reports fetch errors in the ticker; private or unlisted playlists are not
guaranteed to load. Regular text layouts do not use these services.
