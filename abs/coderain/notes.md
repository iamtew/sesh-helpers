# Code Rain — ABS operator notes

Full-screen matrix code-rain backdrop for OBS Browser Sources.
Part of the **Animated Background System** (ABS). Built by clankers so meat bags
can drop falling glyphs behind the sofa without a particle plugin.

ABS apps are backdrops by default: they paint the scene. They do **not** use
shared overlay themes. Rain color is a 1–3 stop picker, not a named palette.
Set `bg=transparent` to use Code Rain as an overlay instead.
ABS settings menus omit the checkerboard util — the animation *is* the background
when opaque.

## Installation

1. Create an OBS **Browser Source**.
2. Use `https://helpers.seshsofa.nl/abs/coderain/`.
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
| `color` | `#00ff00` | Rain color stops, comma-separated hex (`#rrggbb`, 1–3 stops). One stop is solid; two or three lerp along the fall axis |
| `bg` | `#000000` | Backdrop fill hex, or `transparent` for OBS overlay mode |
| `speed` | `1` | Drop advance (`0.25`–`4`) |
| `size` | `16` | Glyph size in px (`8`–`48`) |
| `dir` | `top` | Rain origins: `top`, `right`, `bottom`, `left` (comma-separated; unknown/empty → `top`) |
| `motion` | `0` | Fly-through zoom (`-2`–`2`). Positive zooms in; negative zooms out; `0` is flat rain |
| `glitch` | `0` | Glitch master amount (`0`–`1`; `0` = off) |
| `glitchShift` | `0.55` | Horizontal band shift strength (`0`–`1`) |
| `glitchChroma` | `0.45` | Chromatic aberration fringe (`0`–`1`) |
| `glitchBulge` | `0.3` | Fisheye bulge warp (`0`–`1`) |
| `glitchRate` | `2.5` | Glitch pulse rate in Hz (`0.5`–`8`) |
| `menu` | `ON` | `DISABLE` hides controls for clean OBS output |
| `side` | `right` | Settings panel edge: `left` or `right` |

Example clean-output URL:

`https://helpers.seshsofa.nl/abs/coderain/?color=%2300ff00&bg=%23000000&speed=1&size=16&dir=top&motion=0&glitch=0&glitchShift=0.55&glitchChroma=0.45&glitchBulge=0.3&glitchRate=2.5&menu=DISABLE`

Overlay example (`bg=transparent`, two-color gradient, rain from top and left):

`https://helpers.seshsofa.nl/abs/coderain/?color=%2300ff00,%2300ffff&bg=transparent&speed=1&size=16&dir=top,left&motion=0.4&menu=DISABLE`

## Runtime notes

- Full-viewport canvas with trail fade (opaque bg tints toward `bg`; transparent punches alpha so the scene shows through).
- The visual color picker loads `@jaames/iro` from jsDelivr. If that CDN is unavailable, the picker is hidden but the hex color field still works.
- Glitch post-process runs on a ~192×108 buffer when `glitch > 0`, then is scaled up. Transparent mode keeps original alpha so overlay holes stay holes.
- `prefers-reduced-motion: reduce` paints a static rain field (no RAF loop).
