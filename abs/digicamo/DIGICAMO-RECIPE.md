# Digital Camo Backdrop Recipe

Portable notes for recreating Subotto’s woodland digicam background in another web app.
Designed to be painted once onto a canvas, then used as a CSS `background-image` — no repeating wallpaper tile.

Good candidate for animation later (noise time offset, palette pulse, cell morph). This doc describes the **static** version as shipped.

---

## What you see

Two fixed full-viewport layers behind the UI:

1. **`.bg-camo`** — pixel digicam painted by JS into a PNG data URL
2. **`.bg-glow`** — soft radial color washes (violet / chartreuse / neon green)

Content sits above both (`z-index: 1`). Camo is dimmed (`opacity: 0.5`) and masked so edges fade out and the center stays readable.

---

## HTML skeleton

```html
<body>
  <div class="bg-camo" aria-hidden="true"></div>
  <div class="bg-glow" aria-hidden="true"></div>
  <!-- app UI here -->
</body>
```

---

## CSS (layers + mask)

```css
:root {
  /* Near-black woodland base (also used in the JS palette) */
  --bg0: #10140f;
  --bg1: #161b14;
  --bg-panel: #1a2118;
  --bg-input: #0c0f0b;
  --line: #2d3528;

  /* Accents used in UI + rare camo flecks / glows */
  --olive: #9aac62;
  --dusty: #6c754a;
  --violet: #8600df;
  --chartreuse: #e5f20d;
  --neon-green: #00f53a;
  --gray: #666666;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg0);
  position: relative;
  overflow-x: hidden;
}

.bg-camo,
.bg-glow {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.bg-camo {
  opacity: 0.5;
  background-color: var(--bg0);
  background-repeat: no-repeat;
  background-position: top left;
  background-size: cover;
  /* Soft vignette — digicam readable in the middle, quiet at edges */
  mask-image: radial-gradient(ellipse 95% 90% at 50% 35%, #000 55%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 95% 90% at 50% 35%, #000 55%, transparent 100%);
}

.bg-glow {
  background:
    radial-gradient(ellipse 45% 35% at 12% 0%, rgba(134, 0, 223, 0.07), transparent 60%),
    radial-gradient(ellipse 40% 30% at 92% 8%, rgba(229, 242, 13, 0.03), transparent 55%),
    radial-gradient(ellipse 55% 35% at 50% 100%, rgba(0, 245, 58, 0.025), transparent 60%);
}

.app-root /* or header/main/footer */ {
  position: relative;
  z-index: 1;
}
```

**Knobs**

| CSS | Effect |
|-----|--------|
| `.bg-camo { opacity }` | How loud the pattern is under content (0.4–0.6 feels “ops desk”) |
| `mask-image` ellipse size / center | Where digicam stays strong |
| `.bg-glow` alpha | Atmosphere without washing out panels |

---

## Color system

### UI tokens (CSS)

| Token | Hex | Role |
|-------|-----|------|
| `--bg-input` | `#0c0f0b` | darkest near-black |
| `--bg0` | `#10140f` | page base |
| `--bg1` | `#161b14` | step up |
| `--bg-panel` | `#1a2118` | panels / cards |
| `--line` | `#2d3528` | borders / mid camo |
| `--dusty` | `#6c754a` | dusty olive |
| `--olive` | `#9aac62` | muted olive highlight |
| `--gray` | `#666666` | neutral mid |
| `--violet` | `#8600df` | rare fleck + glow |
| `--chartreuse` | `#e5f20d` | UI accent / corner glow |
| `--neon-green` | `#00f53a` | OK / bottom glow |

### Digicam paint palette (JS RGB)

Same hues, ordered dark → light, then rare accent. Weighted toward darks so UI panels stay readable.

```js
const palette = [
  [12, 15, 11],   // #0c0f0b  bg-input
  [16, 20, 15],   // #10140f  bg0
  [22, 27, 20],   // between bg0 / bg1
  [26, 33, 24],   // #1a2118  bg-panel
  [45, 53, 40],   // #2d3528  line
  [108, 117, 74], // #6c754a  dusty olive
  [154, 172, 98], // #9aac62  muted olive
  [102, 102, 102],// #666666  gray
  [134, 0, 223],  // #8600df  royal violet (rare)
];
```

### Quantization thresholds (`pickColor`)

Noise `n` ∈ [0, 1]. Separate `accent` hash for violet flecks.

| Condition | Index | Color |
|-----------|-------|-------|
| `accent > 0.965` | 8 | violet (sparse sparkles) |
| `n < 0.18` | 0 | darkest |
| `n < 0.32` | 1 | bg0 |
| `n < 0.46` | 2 | mid-dark |
| `n < 0.58` | 3 | panel |
| `n < 0.7` | 4 | line |
| `n < 0.82` | 5 | dusty |
| `n < 0.92` | 6 | olive |
| else | 7 | gray |

Raising the violet threshold (e.g. `0.99`) makes flecks rarer. Shifting band edges changes how “blotchy” vs “flat dark” it feels.

---

## How the paint works

Pipeline (do **not** draw full-res noise pixel-by-pixel):

```text
1. Pick cell size (CSS px per digicam block)     e.g. cell = 7
2. Compute grid: gw = ceil(W/cell), gh = ceil(H/cell)
3. For each grid cell, sample fractal noise → pick palette RGB
4. Write low-res ImageData (gw × gh)
5. Upscale to (gw*cell) × (gh*cell) with imageSmoothingEnabled = false
6. Set .bg-camo backgroundImage to canvas.toDataURL("image/png")
```

Nearest-neighbor upscale = hard digicam squares. Smoothing on = soft mush (avoid for this look).

### Deterministic hash (no Math.random)

```js
function hash2(x, y) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296; // [0, 1)
}
```

Same `(x, y)` → same value. Resize regenerates for new dimensions but stays stable for a given grid.

### Value noise + FBM

- **Value noise:** bilinear blend of four hashed corners, smoothstep (`t*t*(3-2*t)`).
- **fbm:** 5 octaves, amp `0.55` then `*0.5`, freq starts at `1` then `*2.05`.

```js
function fbm(x, y) {
  let v = 0, amp = 0.55, freq = 1;
  for (let i = 0; i < 5; i++) {
    v += amp * valueNoise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2.05;
  }
  return Math.min(1, Math.max(0, v));
}
```

### Scale stretch (classic digicam lean)

Sample with **unequal** scales so clusters lean horizontal:

```js
const scaleX = 0.085; // stretch in X (lower = wider blobs)
const scaleY = 0.11;
const n = fbm(x * scaleX, y * scaleY);
const accent = hash2(x * 17 + 3, y * 29 + 7);
```

| Knob | Lower | Higher |
|------|-------|--------|
| `cell` | finer pixels | chunkier camo |
| `scaleX` / `scaleY` | larger blotches | finer / busier |
| `scaleX < scaleY` | horizontal lean | — |
| fbm octaves | smoother | more micro-detail |

### Viewport sizing

```js
const w = Math.max(window.innerWidth, document.documentElement.clientWidth, 1280);
const h = Math.max(window.innerHeight, document.documentElement.clientHeight, 800);
```

Floor sizes avoid tiny canvases on weird layouts. Debounce resize (~180ms) so you don’t repaint every frame while dragging a window.

---

## Drop-in JS (static)

```js
function paintDigicam() {
  const el = document.querySelector(".bg-camo");
  if (!el) return;

  const cell = 7;
  const w = Math.max(window.innerWidth, document.documentElement.clientWidth, 1280);
  const h = Math.max(window.innerHeight, document.documentElement.clientHeight, 800);
  const gw = Math.ceil(w / cell);
  const gh = Math.ceil(h / cell);

  const palette = [
    [12, 15, 11], [16, 20, 15], [22, 27, 20], [26, 33, 24],
    [45, 53, 40], [108, 117, 74], [154, 172, 98], [102, 102, 102],
    [134, 0, 223],
  ];

  function hash2(x, y) {
    let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function valueNoise(x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = hash2(x0, y0), b = hash2(x0 + 1, y0);
    const c = hash2(x0, y0 + 1), d = hash2(x0 + 1, y0 + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  }

  function fbm(x, y) {
    let v = 0, amp = 0.55, freq = 1;
    for (let i = 0; i < 5; i++) {
      v += amp * valueNoise(x * freq, y * freq);
      amp *= 0.5;
      freq *= 2.05;
    }
    return Math.min(1, Math.max(0, v));
  }

  function pickColor(n, accent) {
    if (accent > 0.965) return palette[8];
    if (n < 0.18) return palette[0];
    if (n < 0.32) return palette[1];
    if (n < 0.46) return palette[2];
    if (n < 0.58) return palette[3];
    if (n < 0.7) return palette[4];
    if (n < 0.82) return palette[5];
    if (n < 0.92) return palette[6];
    return palette[7];
  }

  const low = document.createElement("canvas");
  low.width = gw;
  low.height = gh;
  const lctx = low.getContext("2d");
  const img = lctx.createImageData(gw, gh);
  const data = img.data;

  const scaleX = 0.085, scaleY = 0.11;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const n = fbm(x * scaleX, y * scaleY);
      const accent = hash2(x * 17 + 3, y * 29 + 7);
      const rgb = pickColor(n, accent);
      const i = (y * gw + x) * 4;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
      data[i + 3] = 255;
    }
  }
  lctx.putImageData(img, 0, 0);

  const out = document.createElement("canvas");
  out.width = gw * cell;
  out.height = gh * cell;
  const octx = out.getContext("2d");
  octx.imageSmoothingEnabled = false;
  octx.drawImage(low, 0, 0, out.width, out.height);

  el.style.backgroundImage = `url(${out.toDataURL("image/png")})`;
  el.style.backgroundSize = `${out.width}px ${out.height}px`;
}

let camoResizeTimer = 0;
function scheduleDigicam() {
  clearTimeout(camoResizeTimer);
  camoResizeTimer = setTimeout(paintDigicam, 180);
}

paintDigicam();
window.addEventListener("resize", scheduleDigicam);
```

---

## Animating later (ideas)

Current ship paints **once** (plus resize). To animate without killing the GPU:

1. **Time-shifted noise** — sample `fbm(x * scaleX + t, y * scaleY)` (or a third dimension). Prefer animating the **low-res** grid only, then nearest-neighbor upscale each frame (or every N frames).
2. **Keep a live `<canvas>`** in `.bg-camo` instead of `toDataURL` each frame (data URLs are expensive).
3. **Palette / opacity pulse** — CSS on `.bg-camo` / `.bg-glow` for cheap atmosphere; keep pixel field slower.
4. **Parallax** — slow `background-position` or transform on camo vs glow.
5. **Seeded morph** — lerp between two `hash2` domains or two scale pairs over seconds.

Avoid full-HD per-pixel noise every frame. Digicam looks right at ~`ceil(W/7)` × `ceil(H/7)` samples.

---

## Design intent (short)

- Woodland digicam: small blocks, irregular clusters, mostly near-black olives
- One continuous field (not a CSS-repeat tile)
- Sparse violet flecks + soft corner glows for “ops desk” without fighting readable panels
- Chunky pixels via nearest-neighbor, not blurry noise

---

## Origin

Extracted from Subotto Admin (`webroot/css/admin.css`, `webroot/js/admin.js`, `webroot/index.html`). Copy this file into the other repo; it is intentionally not part of Subotto’s tracked docs.
