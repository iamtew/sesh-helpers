# Voroni — ABS operator notes

Full-screen Voronoi pulse field backdrop for OBS Browser Sources.
Part of the **Animated Background System** (ABS). Built by clankers so meat bags
can drop a living cell field behind the sofa without a particle plugin.

ABS apps are backdrops, not overlays: they paint the scene. They do **not** use
shared overlay themes. Palettes are Voroni-specific — see the palette list below.
ABS settings menus omit the checkerboard util — the animation *is* the background.

## Installation

1. Create an OBS **Browser Source**.
2. Use `https://helpers.seshsofa.nl/abs/voroni/`.
3. Match the resolution to the OBS canvas (usually `1920×1080`).
4. Enable **Shutdown source when not visible** and
   **Refresh browser when scene becomes active**.
5. Choose **Interact** to configure the source.

## Configuration and saving

- When the menu is hidden, double-click anywhere to reopen it.
- Close with ✕ (writes `menu=DISABLE`) or start from a Copy-for-OBS URL.
- Per-slider **↺** resets that control to its default (same pattern as Diamond).
- **Copy URL** copies the current operator URL.
- **Copy URL for OBS** copies the same configuration with `menu=DISABLE`.

Paste the copied OBS URL into the Browser Source properties. Every control updates
the address bar immediately; there is no save button or local storage.

## URL parameters

| Parameter | Default | Meaning |
|-----------|---------|---------|
| `palette` | `blue` | Color ramp: `procedural`, `blue`, `pink`, `mint`, `gold`, `red`, `electric`, `bubblegum`, `aqua`, `amber`, `cyber`, `inferno`, `toxic`, `plasma`, `royal`, `pastel`, `lavender`, `teal`, `peach`, `volt`, or `hyper` (unknown → `blue`) |
| `speed` | `4` | Animation speed (`0`–`10`) |
| `rippleInterval` | `8` | Seconds between edge ripples (`0`–`30`; `0` = off) |
| `rippleSpeed` | `1` | Ripple propagation speed (`0.25`–`4`) |
| `rippleWarp` | `0` | Ripple shape warp (`0` = circle, `1` = strong elliptical lobes) |
| `density` | `220` | Voronoi seed point count (`20`–`800`) |
| `glitch` | `0` | Glitch master amount (`0`–`1`; `0` = off) |
| `glitchShift` | `0.55` | Horizontal band shift strength (`0`–`1`) |
| `glitchChroma` | `0.45` | Chromatic aberration fringe (`0`–`1`) |
| `glitchBulge` | `0.3` | Fisheye bulge warp (`0`–`1`) |
| `glitchRate` | `2.5` | Glitch pulse rate in Hz (`0.5`–`8`) |
| `vignette` | `false` | Radial darkening overlay on/off |
| `vignetteStrength` | `100` | Vignette opacity percent (`0`–`100`; ignored when vignette is off) |
| `menu` | `ON` | `DISABLE` hides controls for clean OBS output |
| `side` | `right` | Settings panel edge: `left` or `right` |

Legacy `?color=#RRGGBB`, `?palette=procedural`, and `?ripple=` URLs from the
prototype still hydrate on load; `?glitch=` maps to the glitch **amount** slider.
Saved URLs use `palette`, `rippleInterval`, `rippleSpeed`, and the glitch params.

Example clean-output URL:

`https://helpers.seshsofa.nl/abs/voroni/?palette=blue&speed=4&rippleInterval=8&rippleSpeed=1&density=220&glitch=0.35&glitchShift=0.55&glitchChroma=0.45&glitchBulge=0.3&glitchRate=2.5&menu=DISABLE`

## Runtime notes

- Low-res grid canvas (10 px cells), pixel-scaled to the viewport (~20fps).
- `prefers-reduced-motion: reduce` paints a static frame (no RAF loop).
- No external runtime dependencies.
