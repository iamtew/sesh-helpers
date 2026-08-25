# Spot Smoke — operator notes

OBS Browser Source smoke emitter with precise placement, optional pixelation/glitch
effects, and URL-only configuration. Built by clankers so meat bags can make smoke
without a fog machine.

## Installation

1. Create an OBS **Browser Source**.
2. Use `https://helpers.seshsofa.nl/spotsmoke/`.
3. Match the resolution to the OBS canvas (usually `1920×1080`).
4. Enable **Shutdown source when not visible** and
   **Refresh browser when scene becomes active**.
5. Choose **Interact** to configure the source.

The smoke run starts about 0.8 seconds after the page loads. Hiding and showing a
source starts a fresh run when OBS reloads it.

## Configuration and saving

- Double-click the background while the menu is open to place the yellow smoke
  crosshair. The white crosshair follows the pointer.
- When the menu is hidden, double-click anywhere to reopen it.
- **Test smoke** starts or stops a preview with the current settings.
- The ▚ header button toggles a setup-only checkerboard.
- Background choices are persistent demo backdrops; choose **None** for clean OBS.
- **Copy URL** copies the current operator URL.
- **Copy URL for OBS** copies the same configuration with `menu=DISABLE`.

Paste the copied OBS URL into the Browser Source properties. Every control updates the
address bar immediately; there is no save button, account, or secret clanker vault.

## URL parameters

| Parameter | Default | Meaning |
|-----------|---------|---------|
| `spotX` / `spotY` | `50` / `70` | Smoke origin as viewport percentages |
| `duration` | `6` | Seconds to spawn particles (`1`–`60`) |
| `intensity` | `5` | Spawn rate and opacity (`1`–`10`) |
| `lifetime` | `4` | Particle lifetime in seconds (`1`–`60`, capped at duration) |
| `color` | `#d8d8d8` | Six-digit smoke color |
| `size` | `1` | Overall particle scale (`0.25`–`4`) |
| `width` | `60` | Horizontal spread in pixels (`0`–`400`) |
| `turbulence` | `30` | Sway and drift amount (`0`–`100`) |
| `pixelation` | `false` | Enable pixelated rendering |
| `pixelSize` | `8` | Pixel cell size (`1`–`32`) |
| `glitch` | `false` | Enable position jitter and chromatic fringe |
| `glitchIntensity` | `0` | Jitter distance in pixels (`0`–`40`) |
| `glitchFrequency` | `2` | Jitter updates per second (`0.5`–`12`) |
| `glitchFringe` | `0` | Red/blue fringe offset in pixels (`0`–`30`) |
| `bg` | `0` | Demo backdrop: `0` none, `1` session, `2` linear, `3` radial |
| `checkerboard` | `false` | Setup-only checkerboard preview |
| `menu` | `ON` | `DISABLE` hides controls and crosshairs |
| `side` | `right` | Settings panel edge: `left` or `right` |

Example clean-output URL:

`https://helpers.seshsofa.nl/spotsmoke/?spotX=50&spotY=70&duration=6&intensity=5&menu=DISABLE&bg=0`

## Runtime dependency

The visual color picker loads `@jaames/iro` from jsDelivr. If that CDN is unavailable,
the picker is hidden but the hex color field still works. The smoke renderer itself
has no external runtime dependency.
