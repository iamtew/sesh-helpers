# Fractals — ABS operator notes

Full-screen fractal zoomer for OBS Browser Sources. Part of the **Animated
Background Scene** (ABS). Built by clankers so meat bags can drop a living
fractal backdrop behind the sofa without a GPU plugin.

ABS apps are backdrops, not overlays: they paint the scene. They do **not** use
shared overlay themes. Palettes are Fractals-specific (`cosmic`, `ember`, `aurora`,
`neon`, `ocean`, `plasma`). ABS settings menus omit the checkerboard util — the
animation *is* the background.

## Installation

1. Create an OBS **Browser Source**.
2. Use `https://helpers.seshsofa.nl/abs/fractals/`.
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
| `set` | `mandelbrot` | Fractal set: `mandelbrot`, `julia`, `burningship`, or `tricorn` |
| `speed` | `1` | Zoom speed, signed `−5`…`5` (`0` = paused; negative = zoom out) |
| `palette` | `cosmic` | Color ramp: `cosmic`, `ember`, `aurora`, `neon`, `ocean`, or `plasma` (unknown → `cosmic`) |
| `glitch` | `0` | Glitch master amount (`0`–`1`; `0` = off) |
| `glitchShift` | `0.55` | Horizontal band shift strength (`0`–`1`) |
| `glitchChroma` | `0.45` | Chromatic aberration fringe (`0`–`1`) |
| `glitchBulge` | `0.3` | Fisheye bulge warp (`0`–`1`) |
| `glitchRate` | `2.5` | Glitch pulse rate in Hz (`0.5`–`8`) |
| `vignette` | `true` | Radial darkening overlay on/off |
| `vignetteStrength` | `33` | Vignette opacity percent (`0`–`100`; ignored when vignette is off) |
| `menu` | `ON` | `DISABLE` hides controls for clean OBS output |
| `side` | `right` | Settings panel edge: `left` or `right` |

Example clean-output URL:

`https://helpers.seshsofa.nl/abs/fractals/?set=mandelbrot&speed=1&palette=cosmic&glitch=0&glitchShift=0.55&glitchChroma=0.45&glitchBulge=0.3&glitchRate=2.5&vignette=true&vignetteStrength=33&menu=DISABLE`

## Runtime notes

- WebGL fragment-shader renderer at a fixed working resolution (longest side capped
  at 480 px), bilinear-scaled to the viewport (~20 fps).
- Classic sets: Mandelbrot, Julia (−0.8 + 0.156*i), Burning Ship, Tricorn.
- Zoom loops back to each set's start view before float precision degrades, with a
  brief fade through black at the loop point.
- Glitch post-process runs only when `glitch > 0`, on a downsampled 2D buffer (same as Shard).
- `prefers-reduced-motion: reduce` paints a static frame (no RAF loop).
- No external runtime dependencies.
