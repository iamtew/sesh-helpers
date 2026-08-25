# Trick Request Banner — operator notes

OBS Browser Source overlay: title / user / message banner with fixed layout, fonts, drag positioning, and optional demo backgrounds. Config lives entirely in the URL.

## Transparent background (OBS)

Page background is **transparent** so the banner composites over your scene. Do not set an opaque `html`/`body` fill.

- Header ▚ checkerboard = settings-mode preview only (`checkerboard`).
- **Background** section (`bg`) = persistent demo backdrop (visible even with `menu=DISABLE`). Use `bg=0` for clean OBS output.

## Installation

1. Browser Source → URL → canvas resolution (e.g. `1920×1080`).
2. Enable *Shutdown when not visible* + *Refresh when scene becomes active*.
3. Interact → configure live → ✕ close → **Copy URL for OBS** → paste into source URL.

## Configuration

- Double-click background to open the settings menu when hidden.
- Drag the banner (settings open only) to set position — saved as `bannerX` / `bannerY`.
- Banner cannot move when `menu=DISABLE`.
- Layout is fixed (title + user on the left, message on the right). No Layout section.
- **Theme** picks the overlay look. LCD Glass is the default; Sesh Glass is also available.
- Banner grows to fit title, user, and message (no marquee / clipping).

## URL params

| Param | Meaning | Default |
|-------|---------|---------|
| `title` | Banner title | `Trick Request by:` |
| `user` | Requester name | `Modney Rullen` |
| `message` | Request text | `Do a kickflip!` |
| `theme` | Overlay theme id (`lcd-glass` · `sesh-glass`) | `lcd-glass` |
| `titleFont` / `userFont` / `messageFont` | Font **index** in combined list (0–9) | `5` = Better VCR |
| `titleSize` | Title font size (px, 12–96) | `20` |
| `userSize` | User font size (px, 12–96) | `26` |
| `messageSize` | Message font size (px, 12–96) | `28` |
| `width` | Banner width size (%, 25–1000) | `100` |
| `height` | Banner height size (%, 25–1000) | `100` |
| `bannerX` / `bannerY` | Position (% of viewport, top-left of banner) | `2` / `4` |
| `bg` | Demo background `0`–`3` | `0` (None) |
| `menu` | `ON` or `DISABLE` | `ON` |
| `side` | Settings panel `left` \| `right` | `right` |
| `checkerboard` | Settings preview backdrop | `false` |

Example:

`trbanner/?title=Trick%20Request%20by:&user=Modney%20Rullen&message=Do%20a%20kickflip!&menu=DISABLE&bg=0`

## Background (`bg`)

Persistent demo layer at 0.75 opacity. Independent of the header ▚ toggle.

| Value | Mode |
|-------|------|
| `0` | None (default) |
| `1` | Session — `img/apartment_panorama.png`, height-matched, centered |
| `2` | Linear gradient `#0FF` → `#F0F` (animated slide) |
| `3` | Radial gradient `#0FF` / `#F0F` (animated) |

## Theme

See [`docs/THEMES.md`](../docs/THEMES.md). Overlay look is separate from fonts and background.

- **LCD Glass** — frosted navy-cyan glass with pulsing magenta/cyan LCD fringing.
- **Sesh Glass** — frosted red-to-lime glass with a retro halftone screen and pulsing magenta glow.

## Size

**Width / height** (`width` / `height`, 25–1000%) size the banner box. Type scales with **`min(width, height)`** so glyphs stay proportional. Fonts section sets base title/user/message px; Size multiplies them.

Per-control **↺** resets that setting. **Reset all** clears everything.

## Fonts

See [`docs/TYPOGRAPHY.md`](../docs/TYPOGRAPHY.md). All three fields share one combined list (Display + Regular). Size sliders sit under each font picker.

**Combined index (`titleFont` / `userFont` / `messageFont`):**

| Index | Font | Group |
|-------|------|-------|
| `0` | Monster Chiller | Display |
| `1` | YouMurderer BB | Display |
| `2` | Streetmark | Display |
| `3` | Germania One | Display |
| `4` | Konstruktor | Display |
| `5` | Better VCR | Regular |
| `6` | Flapdoodle | Regular |
| `7` | Londrina Solid | Regular |
| `8` | Pill Gothic 600mg | Regular |
| `9` | Segoe UI | Regular |

Legacy URLs that still use font names are accepted on load, then rewritten to indices.
