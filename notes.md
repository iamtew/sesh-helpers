# Landing page — backdrop operator notes

The root landing page (`https://helpers.seshsofa.nl/`) has an animated LCD
lattice behind the project list. A Control UI panel configures **only that
backdrop**. Logo, cards, tagline, and LCD Glass chrome stay as they are.

The menu starts **closed**. Click the header logo, or double-click the
background (not a project link), to open it. Close with ✕.

## URL parameters

The query string is the complete config. Params that match defaults are omitted,
so a clean landing URL has no query. Missing params load as defaults.

| Parameter | Default | Meaning |
|-----------|---------|---------|
| `palette` | `lcd` | Color ramp: `lcd`, `violet`, `ember`, `jade`, `rose`, `acid`, or `custom` (unknown → `lcd`) |
| `color` | — | Seven hex stops (`#rrggbb`), one per lattice slot. Written only when `palette=custom` |
| `shape` | `diamond` | Lattice ring shape: `diamond`, `circle`, `square`, `hex`, `octagon`, `star`, `triangle`, `cross`, `heart`, `flower`, or `multiple` |
| `shapes` | all named shapes | Cycle set when `shape=multiple`, comma-separated in default order (unknown/empty → all) |
| `shapeRandom` | `false` | When multiple: random next shape instead of selected order |
| `cycle` | `8` | Seconds until the next shape (`1`–`30`). Only when multiple |
| `smooth` | `50` | Blend percent of each cycle (`0`–`100`; `0` = snap). Only when multiple |
| `glitch` | `0` | Glitch master amount (`0`–`1`; `0` = off) |
| `glitchShift` | `0.55` | Horizontal band shift strength (`0`–`1`) |
| `glitchChroma` | `0.45` | Chromatic aberration fringe (`0`–`1`) |
| `glitchBulge` | `0.3` | Fisheye bulge warp (`0`–`1`) |
| `glitchRate` | `2.5` | Glitch pulse rate in Hz (`0.5`–`8`) |
| `vignette` | `true` | Radial darkening overlay on/off |
| `vignetteStrength` | `33` | Vignette opacity percent (`0`–`100`; ignored when vignette is off) |
| `menu` | `DISABLE` | `ON` shows the settings panel. Omit when closed |
| `side` | `right` | Settings panel edge: `left` or `right` |

Example (custom palette, cycling two shapes, menu closed):

`https://helpers.seshsofa.nl/?palette=custom&color=%23060b14,%2300ffff&shape=multiple&shapes=diamond,heart&cycle=5`

## Configuration

- Per-slider **↺** resets that control to its default.
- **Reset all** restores every backdrop default and clears the query.

Custom colors are seven fixed slots — same count the lattice actually paints
(six brightness steps + fleck). Switching to Custom seeds them from the named
palette you were on. If the color-wheel CDN is down, the hex field still works.

Multiple-shape morph: hold for `cycle × (1 − smooth/100)`, then lerp the two
distance fields for the rest of the cycle. Random order picks the next shape
from the selection excluding the current one.

## Runtime notes

- Low-res 96×54 canvas, pixel-scaled to the viewport (~20fps).
- `prefers-reduced-motion: reduce` paints a static frame (no RAF loop, no
  shape cycling).
- No `localStorage`. Reload the URL to restore the same backdrop.
