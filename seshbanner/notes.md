# Sesh Banner — operator notes

OBS Browser Source overlay: title/message banner with layouts, fonts, and drag positioning. Config lives entirely in the URL.

## Transparent background (OBS)

Page background is **transparent** so the banner composites over your scene. Do not set an opaque `html`/`body` fill. Checkerboard is settings-mode preview only.

## Installation

1. Browser Source → URL → canvas resolution (e.g. `1920×1080`).
2. Enable *Shutdown when not visible* + *Refresh when scene becomes active*.
3. Interact → configure live → ✕ close → **Copy URL for OBS** → paste into source URL.

## Configuration

- Double-click background to open the settings menu when hidden.
- Drag the banner (settings open only) to set position — saved as `bannerX` / `bannerY`.
- Banner cannot move when `menu=DISABLE`.
- **Theme** section (between Layout and Size) picks the overlay look. LCD Glass is the current theme.

## URL params

| Param | Meaning | Default |
|-------|---------|---------|
| `title` | Banner title | `TITLE` |
| `message` | Banner message | `Message` |
| `layout` | `1` inline · `2` playlist stub · `3` stacked accent | `1` |
| `theme` | Overlay theme id (`lcd-glass`) | `lcd-glass` |
| `titleFont` | Display font **index** (0–4) | `0` = Monster Chiller |
| `messageFont` | Regular font **index** (0–4) | `0` = Better VCR |
| `titleSize` | Title font size (px, 16–96) | `38` |
| `messageSize` | Message font size (px, 12–64) | `18` |
| `width` | Banner width size (%, 25–1000) | `100` |
| `height` | Banner height size (%, 25–1000) | `100` |
| `bannerX` / `bannerY` | Position (% of viewport) | `50` / `85` |
| `playlist` | YouTube playlist URL (layout 2) | empty |
| `menu` | `ON` or `DISABLE` | `ON` |
| `side` | Settings panel `left` \| `right` | `left` |
| `checkerboard` | Settings preview backdrop | `false` |

Example:

`seshbanner/?title=LIVE&message=Starting%20soon&layout=1&menu=DISABLE`

## Theme

See [`docs/THEMES.md`](../docs/THEMES.md). Overlay look is separate from layout and fonts. **LCD Glass** — frosted navy-cyan glass with pulsing magenta/cyan LCD fringing. More themes will land in `themes/` later.

## Layouts

1. **Inline** — `title | message` with a cyan bar delimiter between them.
2. YouTube playlist — scaffolding only (`playlist.js`); paste URL for later extract.
3. **Stacked accent** — title over message, left cyan accent bar (lower-third feel).

## Size

**Width / height** (`width` / `height`, 25–1000%) size the banner box (padding + max-width). Type scales with **`min(width, height)`** so glyphs stay proportional — no CSS stretch. Crank both toward 1000 to nearly fill the canvas. Fonts section sets base title/message px; Size multiplies them.

Legacy `scale` / `scaleX` / `scaleY` still load, then rewrite to `width` / `height`.

Per-control **↺** resets that setting to its default (sliders, fonts, position). **Reset all** still clears everything.

## Fonts

See [`docs/TYPOGRAPHY.md`](../docs/TYPOGRAPHY.md). Title select = display fonts; message select = regular fonts. Size sliders sit under each font picker and persist as `titleSize` / `messageSize`.

**Display (`titleFont` index):** `0` Monster Chiller · `1` YouMurderer BB · `2` Streetmark · `3` Germania One · `4` Konstruktor

**Regular (`messageFont` index):** `0` Better VCR · `1` Flapdoodle · `2` Londrina Solid · `3` Pill Gothic 600mg · `4` Segoe UI

Legacy URLs that still use font names are accepted on load, then rewritten to indices.
