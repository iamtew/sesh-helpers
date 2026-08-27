# Shard — ABS operator notes

Full-screen recursive stained-glass triangle mosaic for OBS Browser Sources.
Part of the **Animated Background Scene** (ABS). Built by clankers so meat bags
can drop a living shard field behind the sofa without a particle plugin.

ABS apps are backdrops, not overlays: they paint the scene. They do **not** use
shared overlay themes. Palettes are Shard-specific
(`stained`, `lcd`, `violet`, `ember`, `jade`, `rose`, `acid`).
ABS settings menus omit the checkerboard util — the animation *is* the background.

## Installation

1. Create an OBS **Browser Source**.
2. Use `https://helpers.seshsofa.nl/abs/shard/`.
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
| `palette` | `stained` | Color ramp: `stained`, `lcd`, `violet`, `ember`, `jade`, `rose`, or `acid` (unknown → `stained`) |
| `depth` | `4` | Subdivision levels (`2`–`6`). Some branches stop early so shard sizes mix |
| `jitter` | `0.35` | Midpoint irregularity (`0`–`1`; `0` = geometric mesh) |
| `speed` | `4` | Vertex breath speed (`0`–`10`) |
| `pulseInterval` | `8` | Seconds between depth pulses (`0`–`30`; `0` = off) |
| `pulseSpeed` | `1` | Pulse propagation speed (`0.25`–`4`) |
| `glitch` | `0` | Glitch master amount (`0`–`1`; `0` = off) |
| `glitchShift` | `0.55` | Horizontal band shift strength (`0`–`1`) |
| `glitchChroma` | `0.45` | Chromatic aberration fringe (`0`–`1`) |
| `glitchBulge` | `0.3` | Fisheye bulge warp (`0`–`1`) |
| `glitchRate` | `2.5` | Glitch pulse rate in Hz (`0.5`–`8`) |
| `vignette` | `true` | Radial darkening overlay on/off |
| `vignetteStrength` | `100` | Vignette opacity percent (`0`–`100`; ignored when vignette is off) |
| `menu` | `ON` | `DISABLE` hides controls for clean OBS output |
| `side` | `right` | Settings panel edge: `left` or `right` |

Example clean-output URL:

`https://helpers.seshsofa.nl/abs/shard/?palette=stained&depth=4&jitter=0.35&speed=4&pulseInterval=8&pulseSpeed=1&glitch=0&glitchShift=0.55&glitchChroma=0.45&glitchBulge=0.3&glitchRate=2.5&vignette=true&vignetteStrength=100&menu=DISABLE`

## Runtime notes

- Vector triangle paths on a working canvas (longest side capped at 640), bilinear-scaled to the viewport (~20fps). Not a square-cell pixel grid.
- Vertices breathe around rest positions; a depth-weighted ring pulse lights finer shards more.
- Glitch post-process runs only when `glitch > 0`, on a downsampled buffer.
- `prefers-reduced-motion: reduce` paints a static frame (no RAF loop).
- No external runtime dependencies.
