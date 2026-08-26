# Ripple — ABS operator notes

Full-screen pulsing pixel wave backdrop for OBS Browser Sources.
Part of the **Animated Background System** (ABS). Built by clankers so meat bags
can drop a living ripple field behind the sofa without a particle plugin.

ABS apps are backdrops, not overlays: they paint the scene. They do **not** use
shared overlay themes. Palettes are Ripple-specific
(`spectrum`, `lcd`, `violet`, `ember`, `jade`, `rose`, `acid`).
ABS settings menus omit the checkerboard util — the animation *is* the background.

## Installation

1. Create an OBS **Browser Source**.
2. Use `https://helpers.seshsofa.nl/abs/ripple/`.
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
| `pattern` | `radial` | Wave pattern: `radial`, `linear`, `diagonal`, `noise`, `pulse`, `turbulence`, `helix`, `flow`, `weave`, `checkerwarp`, or `fog` (unknown → `radial`) |
| `cellSize` | `24` | Block size on screen in px (`16`–`80`) |
| `speed` | `0.01` | Per-frame phase increment (`0.002`–`0.05`) |
| `palette` | `spectrum` | Color ramp: `spectrum`, `lcd`, `violet`, `ember`, `jade`, `rose`, or `acid` (unknown → `spectrum`) |
| `vignette` | `true` | Radial darkening overlay on/off |
| `vignetteStrength` | `100` | Vignette opacity percent (`0`–`100`; ignored when vignette is off) |
| `menu` | `ON` | `DISABLE` hides controls for clean OBS output |
| `side` | `right` | Settings panel edge: `left` or `right` |

Example clean-output URL:

`https://helpers.seshsofa.nl/abs/ripple/?pattern=radial&cellSize=24&speed=0.01&palette=spectrum&vignette=true&vignetteStrength=100&menu=DISABLE`

## Runtime notes

- Low-res grid canvas (one pixel per block), pixel-scaled to the viewport (~20fps).
- `prefers-reduced-motion: reduce` paints a static frame (no RAF loop).
- No external runtime dependencies.
