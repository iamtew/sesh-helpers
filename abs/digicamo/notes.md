# Digicamo — ABS operator notes

Full-screen pixel digicam backdrop for OBS Browser Sources.
Part of the **Animated Background Scene** (ABS). Built by clankers so meat bags
can drop a living woodland (or wacky) camo field behind the sofa.

ABS apps are backdrops, not overlays: they paint the scene. They do **not** use
shared overlay themes. Palettes are Digicamo-specific
(`woodland`, `desert`, `urban`, `arctic`, `neon`, `synth`, `toxic`, `candy`).
ABS settings menus omit the checkerboard util — the animation *is* the background.

## Installation

1. Create an OBS **Browser Source**.
2. Use `https://helpers.seshsofa.nl/abs/digicamo/`.
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
| `palette` | `woodland` | Color ramp: `woodland`, `desert`, `urban`, `arctic`, `neon`, `synth`, `toxic`, or `candy` (unknown → `woodland`) |
| `speed` | `1` | Animation time multiplier (`0`–`3`; `0` = frozen field) |
| `cellSize` | `7` | Digicam block size in px (`3`–`24`) |
| `fleck` | `0.965` | Accent fleck rarity threshold (`0.90`–`0.995`; higher = rarer) |
| `glitch` | `0` | Glitch master amount (`0`–`1`; `0` = off) |
| `glitchShift` | `0.55` | Horizontal band shift strength (`0`–`1`) |
| `glitchChroma` | `0.45` | Chromatic aberration fringe (`0`–`1`) |
| `glitchBulge` | `0.3` | Fisheye bulge warp (`0`–`1`) |
| `glitchRate` | `2.5` | Glitch pulse rate in Hz (`0.5`–`8`) |
| `vignette` | `true` | Soft edge darkening overlay on/off |
| `vignetteStrength` | `33` | Vignette opacity percent (`0`–`100`; ignored when vignette is off) |
| `menu` | `ON` | `DISABLE` hides controls for clean OBS output |
| `side` | `right` | Settings panel edge: `left` or `right` |

Example clean-output URL:

`https://helpers.seshsofa.nl/abs/digicamo/?palette=woodland&speed=1&cellSize=7&fleck=0.965&glitch=0&glitchShift=0.55&glitchChroma=0.45&glitchBulge=0.3&glitchRate=2.5&vignette=true&vignetteStrength=33&menu=DISABLE`

## Runtime notes

- Low-res grid (`ceil(W/cell) × ceil(H/cell)`), pixel-scaled to the viewport (~20fps).
- FBM value noise with horizontal digicam lean; time offset drifts the field.
- Soft glow washes follow the active palette; vignette softens the edges.
- `prefers-reduced-motion: reduce` paints a static frame (no RAF loop).
- Design recipe: [`DIGICAMO-RECIPE.md`](DIGICAMO-RECIPE.md).
- No external runtime dependencies.
