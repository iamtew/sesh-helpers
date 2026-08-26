# Trick Request Banner — operator notes

OBS Browser Source overlay: title / user / message banner with fixed layout, fonts,
drag positioning, and optional demo backgrounds. Config lives entirely in the URL,
because clankers enjoy portability and meat bags enjoy not losing settings.

## Transparent background (OBS)

Page background is **transparent** so the banner composites over your scene. Do not set an opaque `html`/`body` fill.

- Header ▚ checkerboard = settings-mode preview only (`checkerboard`).
- **Background** section (`bg`) = persistent demo backdrop (visible even with `menu=DISABLE`). Use `bg=0` for clean OBS output.

## Installation

1. Browser Source → URL `https://helpers.seshsofa.nl/trbanner/` → canvas resolution (e.g. `1920×1080`).
2. Enable *Shutdown when not visible* + *Refresh when scene becomes active*.
3. Interact → configure live → ✕ close → **Copy URL for OBS** → paste into source URL.

## Configuration

- Double-click background to open the settings menu when hidden.
- Drag the banner (settings open only) from any grab point to set its top-left
  position — saved as `bannerX` / `bannerY`.
- Banner cannot move when `menu=DISABLE`.
- Layout is fixed (title + user on the left, message on the right). No Layout section.
- **Theme** picks the overlay look. LCD Glass is the default; Sesh Glass is also available.
- Banner grows to fit title, user, and message (no marquee / clipping).
- Every edit updates the address bar immediately. **Copy URL for OBS** copies that
  state with `menu=DISABLE`; paste it back into the Browser Source properties.

## URL params

| Param | Meaning | Default |
|-------|---------|---------|
| `title` | Banner title | `Trick Request by:` |
| `user` | Requester name | `Modney Rullen` |
| `message` | Request text | `Do a kickflip!` |
| `theme` | Overlay theme id (`lcd-glass` · `sesh-glass` · `3026-d3c0`) | `lcd-glass` |
| `titleFont` / `userFont` / `messageFont` | Font **index** in combined list (0–11) | theme preferred Display / Regular when unset |
| `titleSize` | Title font size (px, 12–96) | `20` |
| `userSize` | User font size (px, 12–96) | `26` |
| `messageSize` | Message font size (px, 12–96) | `28` |
| `width` | Banner width size (%, 25–1000) | `100` |
| `height` | Banner height size (%, 25–1000) | `100` |
| `alignX` | Content horizontal align `left` · `center` · `right` | `center` |
| `alignY` | Content vertical align `top` · `center` · `bottom` | `center` |
| `bannerX` / `bannerY` | Position (% of viewport, top-left of banner) | `2` / `4` |
| `bg` | Demo background `0`–`3` | `0` (None) |
| `menu` | `ON` or `DISABLE` | `ON` |
| `side` | Settings panel `left` \| `right` | `right` |
| `checkerboard` | Settings preview backdrop | `false` |

Example:

`https://helpers.seshsofa.nl/trbanner/?title=Trick%20Request%20by:&user=Modney%20Rullen&message=Do%20a%20kickflip!&menu=DISABLE&bg=0`

## Background (`bg`)

Persistent demo layer at 0.75 opacity. Independent of the header ▚ toggle.

| Value | Mode |
|-------|------|
| `0` | None (default) |
| `1` | Session — `img/apartment_panorama.png`, height-matched, centered |
| `2` | Linear gradient `#0FF` → `#F0F` (animated slide) |
| `3` | Radial gradient `#0FF` / `#F0F` (animated) |

## Theme

See [`docs/THEMES.md`](../docs/THEMES.md). Overlay look is separate from layout; themes also declare preferred Display / Regular fonts (see Fonts).

- **LCD Glass** — frosted navy-cyan glass with pulsing magenta/cyan LCD fringing.
- **Sesh Glass** — frosted red-to-lime glass with a retro halftone screen and pulsing red glow.

## Size

**Width / height** (`width` / `height`, 25–1000%) size the banner box independently (padding + gap). Fonts section sets title/user/message px directly — Size does not multiply them. Corner radius stays at the theme base.

**Content align** (`alignX` / `alignY`, default `center` / `center`) puts extra size padding on the opposite side(s). Center keeps equal padding (previous behavior).

Per-control **↺** resets that setting. Font ↺ uses the **active theme’s** preferred Display/Regular. **Reset all** clears everything and re-applies the default theme’s preferred fonts.

## Fonts

See [`docs/TYPOGRAPHY.md`](../docs/TYPOGRAPHY.md). All three fields share one combined list (Display + Regular). Size sliders sit under each font picker.

Changing **Theme** applies that theme’s preferred fonts (title/user → Display, message → Regular). Fonts can still be overridden in this section afterward.

**Combined index (`titleFont` / `userFont` / `messageFont`):**

| Index | Font | Group |
|-------|------|-------|
| `0` | Monster Chiller | Display |
| `1` | YouMurderer BB | Display |
| `2` | Streetmark | Display |
| `3` | Germania One | Display |
| `4` | Konstruktor | Display |
| `5` | Better VCR | Display & Regular |
| `6` | Flapdoodle | Regular |
| `7` | Londrina Solid | Regular |
| `8` | Pill Gothic 600mg | Regular |
| `9` | Segoe UI | Regular |
| `10` | Lemondrop | Display |
| `11` | Brighton Sans NBP | Regular |

Legacy URLs that still use font names are accepted on load, then rewritten to indices.
