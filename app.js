// Landing page — LCD geometric backdrop + Control UI (background only).
// Query string is the complete shareable config. Defaults are omitted.

const PALETTES = {
  lcd: {
    colors: [
      [10, 22, 40],
      [14, 34, 62],
      [24, 56, 96],
      [36, 78, 120],
      [48, 100, 140],
      [40, 120, 150],
      [70, 40, 90]
    ],
    fleckIndex: 6
  },
  violet: {
    colors: [
      [16, 12, 36],
      [28, 20, 58],
      [44, 32, 90],
      [64, 48, 120],
      [88, 64, 150],
      [110, 80, 170],
      [200, 70, 160]
    ],
    fleckIndex: 6
  },
  ember: {
    colors: [
      [28, 12, 6],
      [48, 20, 8],
      [78, 32, 10],
      [120, 48, 14],
      [160, 70, 20],
      [190, 100, 30],
      [220, 160, 40]
    ],
    fleckIndex: 6
  },
  jade: {
    colors: [
      [8, 24, 20],
      [12, 40, 32],
      [18, 64, 48],
      [28, 96, 68],
      [40, 128, 88],
      [56, 160, 110],
      [180, 220, 60]
    ],
    fleckIndex: 6
  },
  rose: {
    colors: [
      [28, 10, 24],
      [48, 16, 40],
      [78, 28, 58],
      [120, 44, 80],
      [160, 64, 110],
      [200, 90, 140],
      [255, 140, 190]
    ],
    fleckIndex: 6
  },
  acid: {
    colors: [
      [12, 28, 6],
      [24, 48, 8],
      [40, 78, 10],
      [64, 120, 14],
      [96, 170, 20],
      [140, 220, 30],
      [220, 255, 40]
    ],
    fleckIndex: 6
  }
};

const NAMED_PALETTE_IDS = Object.keys(PALETTES);
const PALETTE_IDS = new Set([...NAMED_PALETTE_IDS, "custom"]);
const SHAPE_IDS = ["diamond", "circle", "square", "hex", "octagon", "star", "triangle", "cross", "heart", "flower"];
const SHAPE_SET = new Set(SHAPE_IDS);
const SHAPE_MODE_IDS = new Set([...SHAPE_IDS, "multiple"]);
const COLOR_COUNT = PALETTES.lcd.colors.length;
const FRAME_MS = 50;
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SHAPES = {
  diamond(x, y) {
    return Math.abs(x) + Math.abs(y) * 1.2;
  },
  circle(x, y) {
    return Math.hypot(x, y) * 1.35;
  },
  square(x, y) {
    return Math.max(Math.abs(x), Math.abs(y) * 1.2) * 1.5;
  },
  hex(x, y) {
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    return Math.max(ax * 0.866 + ay * 0.5, ay) * 1.55;
  },
  octagon(x, y) {
    const ax = Math.abs(x);
    const ay = Math.abs(y) * 1.2;
    return Math.max(ax, ay, (ax + ay) * 0.7071) * 1.4;
  },
  star(x, y) {
    const a = Math.atan2(y, x);
    const r = Math.hypot(x, y);
    const k = 0.55 + 0.45 * Math.abs(Math.cos(a * 2.5));
    return (r / k) * 1.1;
  },
  triangle(x, y) {
    const py = y + 6;
    return Math.max(-py, py * 0.5 + x * 0.866, py * 0.5 - x * 0.866) * 1.55 + 8;
  },
  cross(x, y) {
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    return Math.min(ax, ay) * 1.85 + 6;
  },
  heart(x, y) {
    const a = Math.atan2(x, -y);
    const r = Math.hypot(x, y);
    const s = 0.72 + 0.38 * Math.sin(a) + 0.22 * Math.sqrt(Math.abs(Math.cos(a)));
    return (r / s) * 1.15;
  },
  flower(x, y) {
    const a = Math.atan2(y, x);
    const r = Math.hypot(x, y);
    const petals = 0.55 + 0.45 * Math.cos(a * 5);
    return (r / Math.max(0.28, petals)) * 0.95;
  }
};

function rgbToHex(rgb) {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function paletteToHexes(palette) {
  return palette.colors.map(rgbToHex);
}

const defaults = {
  palette: "lcd",
  colors: paletteToHexes(PALETTES.lcd),
  shape: "diamond",
  shapes: SHAPE_IDS.slice(),
  shapeRandom: false,
  cycle: 8,
  smooth: 50,
  speed: 1,
  cellSize: 5,
  pixelSize: 20,
  ...AbsGlitchPost.defaults,
  vignette: true,
  vignetteStrength: 33,
  settingsMode: "DISABLE",
  side: "right"
};

const params = new URLSearchParams(location.search);

function getParam(key, fallback) {
  return params.has(key) ? params.get(key) : fallback;
}

function getBooleanParam(key, fallback) {
  return params.has(key) ? params.get(key) === "true" : fallback;
}

function getNumberParam(key, fallback) {
  const value = Number.parseFloat(getParam(key, fallback));
  return Number.isFinite(value) ? value : fallback;
}

function normalizeHex(value) {
  let hex = String(value ?? "").trim();
  if (!hex) return null;
  if (hex[0] !== "#") hex = `#${hex}`;
  if (/^#[0-9a-f]{6}$/i.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  }
  return null;
}

function parseColors(value) {
  const parts = String(value ?? "")
    .split(",")
    .map(normalizeHex)
    .filter(Boolean);
  const colors = defaults.colors.slice();
  if (!parts.length) return colors;
  for (let i = 0; i < COLOR_COUNT; i++) {
    colors[i] = parts[i] || parts[parts.length - 1];
  }
  return colors;
}

function normalizePalette(value) {
  const id = String(value ?? "").toLowerCase();
  return PALETTE_IDS.has(id) ? id : defaults.palette;
}

function normalizeShape(value) {
  const id = String(value ?? "").toLowerCase();
  return SHAPE_MODE_IDS.has(id) ? id : defaults.shape;
}

function parseShapes(value) {
  const raw = String(value ?? "")
    .toLowerCase()
    .split(/[+,]/)
    .map((part) => part.trim())
    .filter((id) => SHAPE_SET.has(id));
  const ordered = SHAPE_IDS.filter((id) => raw.includes(id));
  return ordered.length ? ordered : SHAPE_IDS.slice();
}

function clampCycle(value) {
  const n = Math.round(value * 2) / 2;
  return Math.min(30, Math.max(1, n));
}

function clampSmooth(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function clampSpeed(value) {
  return Math.min(3, Math.max(0.25, value));
}

function clampCellSize(value) {
  return Math.min(16, Math.max(2, Math.round(value)));
}

function clampPixelSize(value) {
  return Math.min(48, Math.max(4, Math.round(value)));
}

function clampVignetteStrength(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function currentLattice() {
  if (state.palette === "custom") {
    return { colors: state.colors.map(hexToRgb), fleckIndex: COLOR_COUNT - 1 };
  }
  return PALETTES[state.palette] || PALETTES.lcd;
}

let state = {
  palette: normalizePalette(getParam("palette", defaults.palette)),
  colors: parseColors(getParam("color", defaults.colors.join(","))),
  shape: normalizeShape(getParam("shape", defaults.shape)),
  shapes: parseShapes(getParam("shapes", defaults.shapes.join(","))),
  shapeRandom: getBooleanParam("shapeRandom", defaults.shapeRandom),
  cycle: clampCycle(getNumberParam("cycle", defaults.cycle)),
  smooth: clampSmooth(getNumberParam("smooth", defaults.smooth)),
  speed: clampSpeed(getNumberParam("speed", defaults.speed)),
  cellSize: clampCellSize(getNumberParam("cellSize", defaults.cellSize)),
  pixelSize: clampPixelSize(getNumberParam("pixelSize", defaults.pixelSize)),
  glitch: AbsGlitchPost.clampAmount(getNumberParam("glitch", defaults.glitch)),
  glitchShift: AbsGlitchPost.clampUnit(getNumberParam("glitchShift", defaults.glitchShift)),
  glitchChroma: AbsGlitchPost.clampUnit(getNumberParam("glitchChroma", defaults.glitchChroma)),
  glitchBulge: AbsGlitchPost.clampUnit(getNumberParam("glitchBulge", defaults.glitchBulge)),
  glitchRate: AbsGlitchPost.clampRate(getNumberParam("glitchRate", defaults.glitchRate)),
  vignette: getBooleanParam("vignette", defaults.vignette),
  vignetteStrength: clampVignetteStrength(getNumberParam("vignetteStrength", defaults.vignetteStrength)),
  settingsMode: getParam("menu", defaults.settingsMode) === "ON" ? "ON" : "DISABLE",
  side: getParam("side", defaults.side) === "left" ? "left" : "right"
};

const canvas = document.getElementById("lcd-backdrop");
const ctx = canvas.getContext("2d", { alpha: false });
let W = 0;
let H = 0;
let image = null;
let data = null;
let sourceData = null;

function resizeCanvas() {
  const nextW = Math.max(16, Math.round(window.innerWidth / state.pixelSize));
  const nextH = Math.max(9, Math.round(window.innerHeight / state.pixelSize));
  if (nextW === W && nextH === H && image) return;
  W = nextW;
  H = nextH;
  canvas.width = W;
  canvas.height = H;
  image = ctx.createImageData(W, H);
  data = image.data;
  sourceData = new Uint8ClampedArray(data.length);
}

const vignetteEl = document.getElementById("vignette");
const settingsMenu = document.getElementById("settings-menu");
const flipSideButton = document.getElementById("flip-side-button");
const closeSettingsButton = document.getElementById("close-menu-button");
const logo = document.querySelector(".logo");
const customColorGroup = document.getElementById("custom-color-group");
const colorSwatches = document.getElementById("color-swatches");
const colorPickerEl = document.getElementById("color-picker");
const colorInput = document.getElementById("color-input");
const colorResetButton = document.getElementById("color-reset-button");
const shapeMultipleGroup = document.getElementById("shape-multiple-group");
const shapeGrid = document.getElementById("shape-grid");
const shapeRandomToggle = document.getElementById("shape-random-toggle");
const cycleSlider = document.getElementById("cycle-slider");
const cycleValue = document.getElementById("cycle-value");
const smoothSlider = document.getElementById("smooth-slider");
const smoothValue = document.getElementById("smooth-value");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const cellSizeSlider = document.getElementById("cell-size-slider");
const cellSizeValue = document.getElementById("cell-size-value");
const pixelSizeSlider = document.getElementById("pixel-size-slider");
const pixelSizeValue = document.getElementById("pixel-size-value");
const glitchAmountSlider = document.getElementById("glitch-amount-slider");
const glitchAmountValue = document.getElementById("glitch-amount-value");
const glitchShiftSlider = document.getElementById("glitch-shift-slider");
const glitchShiftValue = document.getElementById("glitch-shift-value");
const glitchChromaSlider = document.getElementById("glitch-chroma-slider");
const glitchChromaValue = document.getElementById("glitch-chroma-value");
const glitchBulgeSlider = document.getElementById("glitch-bulge-slider");
const glitchBulgeValue = document.getElementById("glitch-bulge-value");
const glitchRateSlider = document.getElementById("glitch-rate-slider");
const glitchRateValue = document.getElementById("glitch-rate-value");
const palettePickerEl = document.getElementById("palette-picker");
const shapePickerEl = document.getElementById("shape-picker");
const vignetteToggle = document.getElementById("vignette-toggle");
const vignetteStrengthSlider = document.getElementById("vignette-strength-slider");
const vignetteStrengthValue = document.getElementById("vignette-strength-value");
const resetButton = document.getElementById("reset-button");
const sectionToggles = document.querySelectorAll("[data-section-toggle]");

const createMenuPicker = window.SeshMenuPicker.create;
const closeAllMenuPickers = window.SeshMenuPicker.closeAll;

const shapeInputs = {};
SHAPE_IDS.forEach((id) => {
  const label = document.createElement("label");
  label.className = "switch-row";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.dataset.shape = id;
  const span = document.createElement("span");
  span.textContent = humanizeId(id);
  label.append(input, span);
  shapeGrid.appendChild(label);
  shapeInputs[id] = input;
});

let selectedColorIndex = 0;
let syncingColor = false;
let currentShapeId = state.shape === "multiple" ? (state.shapes[0] || "diamond") : state.shape;
let nextShapeId = currentShapeId;
let cycleStartMs = 0;

let colorPicker = null;
if (window.iro && colorPickerEl) {
  colorPicker = new iro.ColorPicker(colorPickerEl, {
    width: 220,
    color: state.colors[0],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    layoutDirection: "vertical",
    sliderSize: 14,
    handleRadius: 8,
    padding: 4,
    margin: 8
  });
  colorPicker.on("color:change", (color) => {
    if (syncingColor) return;
    state.colors[selectedColorIndex] = color.hexString.toLowerCase();
    colorInput.value = state.colors[selectedColorIndex];
    renderSwatches();
    repaintNow();
    updateURL();
  });
} else if (colorPickerEl) {
  colorPickerEl.hidden = true;
}

function humanizeId(id) {
  if (id === "lcd") return "LCD";
  return id.charAt(0).toUpperCase() + id.slice(1);
}

const paletteOptions = [
  ...NAMED_PALETTE_IDS.map((id) => ({ value: id, label: humanizeId(id) })),
  { value: "custom", label: "Custom" }
];

const shapeOptions = [
  ...SHAPE_IDS.map((id) => ({ value: id, label: humanizeId(id) })),
  { value: "multiple", label: "Multiple" }
];

const palettePicker = createMenuPicker({
  root: palettePickerEl,
  options: paletteOptions,
  labelledBy: "palette-label",
  getValue: () => state.palette,
  setValue: (value) => {
    const next = normalizePalette(value);
    if (next === "custom" && state.palette !== "custom") {
      const named = PALETTES[state.palette] || PALETTES.lcd;
      state.colors = paletteToHexes(named);
      selectedColorIndex = 0;
    }
    state.palette = next;
    syncInputs();
    repaintNow();
    updateURL();
  }
});

const shapePicker = createMenuPicker({
  root: shapePickerEl,
  options: shapeOptions,
  labelledBy: "shape-label",
  getValue: () => state.shape,
  setValue: (value) => {
    state.shape = normalizeShape(value);
    resetShapeCycle();
    syncInputs();
    repaintNow();
    updateURL();
  }
});

function flashMenuAction(button, tempLabel) {
  if (!button) return;
  const original = button.textContent;
  button.classList.add("is-clicked");
  if (tempLabel) button.textContent = tempLabel;
  clearTimeout(button._flashTimer);
  button._flashTimer = setTimeout(() => {
    button.classList.remove("is-clicked");
    if (tempLabel) button.textContent = original;
  }, 550);
}

function activeShapes() {
  if (state.shape !== "multiple") return [state.shape];
  return state.shapes.length ? state.shapes : SHAPE_IDS.slice();
}

function pickNext(fromId) {
  const list = activeShapes();
  if (list.length <= 1) return list[0] || "diamond";
  if (state.shapeRandom) {
    const others = list.filter((id) => id !== fromId);
    return others[(Math.random() * others.length) | 0];
  }
  const i = list.indexOf(fromId);
  return list[i < 0 ? 0 : (i + 1) % list.length];
}

function resetShapeCycle(nowMs) {
  const list = activeShapes();
  currentShapeId = list[0] || "diamond";
  nextShapeId = list.length > 1 ? pickNext(currentShapeId) : currentShapeId;
  cycleStartMs = nowMs != null ? nowMs : performance.now();
}

function shapePair(nowMs) {
  const list = activeShapes();
  const fnOf = (id) => SHAPES[id] || SHAPES.diamond;
  if (REDUCE_MOTION || state.shape !== "multiple" || list.length <= 1) {
    const id = list[0] || "diamond";
    const fn = fnOf(id);
    return { fnA: fn, fnB: fn, mix: 0 };
  }

  let elapsed = (nowMs - cycleStartMs) / 1000;
  const cycle = state.cycle;
  if (elapsed >= cycle) {
    const steps = Math.max(1, Math.floor(elapsed / cycle));
    for (let i = 0; i < steps; i++) {
      currentShapeId = nextShapeId;
      nextShapeId = pickNext(currentShapeId);
    }
    cycleStartMs += steps * cycle * 1000;
    elapsed = (nowMs - cycleStartMs) / 1000;
  }

  const phase = Math.min(1, Math.max(0, elapsed / cycle));
  const smooth = state.smooth / 100;
  const hold = 1 - smooth;
  let mix = 0;
  if (smooth > 0 && phase > hold) mix = (phase - hold) / smooth;

  return { fnA: fnOf(currentShapeId), fnB: fnOf(nextShapeId), mix };
}

function paint(timeSec, nowMs) {
  if (!image) resizeCanvas();
  const lattice = currentLattice();
  const colors = lattice.colors;
  const fleckIndex = lattice.fleckIndex;
  const cellSize = state.cellSize;
  const half = cellSize / 2;
  const edgeTol = Math.max(0.4, cellSize * 0.11);
  const t = timeSec;
  const cx = W * 0.5;
  const cy = H * 0.42;
  const ox = Math.sin(t * 0.12) * 6;
  const oy = Math.cos(t * 0.09) * 4;
  const ringPhase = t * 0.55;
  const shear = t * 0.18;
  const pair = shapePair(nowMs);
  const mix = pair.mix;
  const fnA = pair.fnA;
  const fnB = pair.fnB;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x - cx - ox;
      const dy = y - cy - oy;

      const manh = mix === 0 ? fnA(dx, dy) : fnA(dx, dy) * (1 - mix) + fnB(dx, dy) * mix;
      const rings = ((manh * 0.45 - ringPhase) % 4 + 4) % 4;
      const ringBand = rings < 0.55 || rings > 3.45 ? 2 : rings < 1.1 ? 1 : 0;

      const u = dx * 0.7 + dy * 0.4 + shear * 4;
      const v = -dx * 0.4 + dy * 0.7 - shear * 3;
      const cell = (Math.floor(u / cellSize) + Math.floor(v / cellSize)) & 1;
      const edgeU = Math.abs((u % cellSize + cellSize) % cellSize - half);
      const edgeV = Math.abs((v % cellSize + cellSize) % cellSize - half);
      const onGrid = edgeU < edgeTol || edgeV < edgeTol ? 1 : 0;

      const pulse = Math.sin(manh * 0.2 - t * 0.4) * 0.5 + 0.5;

      let level = cell + ringBand + onGrid;
      if (pulse > 0.72) level += 1;
      level = Math.max(0, Math.min(colors.length - 1, level | 0));

      let rgb = colors[level];
      if (onGrid && level >= 4 && ((x + y + (t * 3 | 0)) & 31) === 0) {
        rgb = colors[fleckIndex];
      }

      const i = (y * W + x) * 4;
      sourceData[i] = rgb[0];
      sourceData[i + 1] = rgb[1];
      sourceData[i + 2] = rgb[2];
      sourceData[i + 3] = 255;
    }
  }

  AbsGlitchPost.applyPostProcess(nowMs, sourceData, data, W, H, state, FRAME_MS);
  ctx.putImageData(image, 0, 0);
}

let raf = 0;
let last = 0;
let animRunning = false;

function tick(now) {
  raf = requestAnimationFrame(tick);
  if (document.hidden) return;
  if (now - last < FRAME_MS) return;
  last = now;
  paint(now * 0.001 * state.speed, now);
}

function startAnimation() {
  if (REDUCE_MOTION || animRunning) return;
  animRunning = true;
  last = 0;
  raf = requestAnimationFrame(tick);
}

function stopAnimation() {
  animRunning = false;
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}

function repaintNow() {
  const nowMs = REDUCE_MOTION ? 0 : performance.now();
  paint(nowMs * 0.001 * state.speed, nowMs);
}

document.addEventListener("visibilitychange", () => {
  if (REDUCE_MOTION) return;
  if (document.hidden) {
    stopAnimation();
  } else {
    startAnimation();
  }
});

function setIfChanged(out, key, value, defaultValue) {
  if (String(value) !== String(defaultValue)) out.set(key, String(value));
}

function buildSearchParams(source, options = {}) {
  const out = new URLSearchParams();
  const menu = options.menu != null ? options.menu : source.settingsMode;
  setIfChanged(out, "palette", source.palette, defaults.palette);
  if (source.palette === "custom") out.set("color", source.colors.join(","));
  setIfChanged(out, "shape", source.shape, defaults.shape);
  if (source.shape === "multiple") {
    setIfChanged(out, "shapes", source.shapes.join(","), defaults.shapes.join(","));
    setIfChanged(out, "shapeRandom", source.shapeRandom, defaults.shapeRandom);
    setIfChanged(out, "cycle", source.cycle, defaults.cycle);
    setIfChanged(out, "smooth", source.smooth, defaults.smooth);
  }
  setIfChanged(out, "speed", source.speed, defaults.speed);
  setIfChanged(out, "cellSize", source.cellSize, defaults.cellSize);
  setIfChanged(out, "pixelSize", source.pixelSize, defaults.pixelSize);
  setIfChanged(out, "glitch", source.glitch, defaults.glitch);
  setIfChanged(out, "glitchShift", source.glitchShift, defaults.glitchShift);
  setIfChanged(out, "glitchChroma", source.glitchChroma, defaults.glitchChroma);
  setIfChanged(out, "glitchBulge", source.glitchBulge, defaults.glitchBulge);
  setIfChanged(out, "glitchRate", source.glitchRate, defaults.glitchRate);
  setIfChanged(out, "vignette", source.vignette, defaults.vignette);
  setIfChanged(out, "vignetteStrength", source.vignetteStrength, defaults.vignetteStrength);
  setIfChanged(out, "menu", menu, defaults.settingsMode);
  setIfChanged(out, "side", source.side, defaults.side);
  return out;
}

function updateURL() {
  const search = buildSearchParams(state).toString();
  history.replaceState({}, "", search ? `${location.pathname}?${search}` : location.pathname);
}

function applySettingsMode() {
  if (state.settingsMode === "DISABLE") {
    settingsMenu.classList.remove("open");
    document.body.classList.remove("settings-mode");
  } else {
    settingsMenu.classList.add("open");
    document.body.classList.add("settings-mode");
  }
}

function applySide() {
  settingsMenu.classList.toggle("side-right", state.side === "right");
}

function applyVignette() {
  const on = state.vignette;
  vignetteToggle.checked = on;
  vignetteStrengthSlider.disabled = !on;
  if (!on) {
    vignetteEl.hidden = true;
    return;
  }
  vignetteEl.hidden = false;
  vignetteEl.style.opacity = String(state.vignetteStrength / 100);
}

function applyGroupVisibility() {
  customColorGroup.hidden = state.palette !== "custom";
  shapeMultipleGroup.hidden = state.shape !== "multiple";
}

function syncColorPicker(hex) {
  if (!colorPicker) return;
  if (colorPicker.color.hexString.toLowerCase() === hex) return;
  syncingColor = true;
  colorPicker.color.hexString = hex;
  syncingColor = false;
}

function renderSwatches() {
  colorSwatches.replaceChildren();
  state.colors.forEach((hex, index) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "swatch";
    if (index === selectedColorIndex) swatch.classList.add("is-selected");
    swatch.style.background = hex;
    swatch.setAttribute("aria-label", `Custom color ${index + 1}`);
    swatch.addEventListener("click", () => {
      selectedColorIndex = index;
      colorInput.value = state.colors[selectedColorIndex];
      syncColorPicker(state.colors[selectedColorIndex]);
      renderSwatches();
    });
    colorSwatches.appendChild(swatch);
  });
}

function setSettingsMode(mode) {
  if (state.settingsMode === mode) return;
  state.settingsMode = mode;
  applySettingsMode();
  updateURL();
}

function toggleSettings() {
  setSettingsMode(state.settingsMode === "ON" ? "DISABLE" : "ON");
}

function syncInputs() {
  if (selectedColorIndex >= state.colors.length) selectedColorIndex = 0;
  colorInput.value = state.colors[selectedColorIndex];
  syncColorPicker(state.colors[selectedColorIndex]);
  renderSwatches();
  palettePicker.sync();
  shapePicker.sync();
  for (const id of SHAPE_IDS) {
    shapeInputs[id].checked = state.shapes.includes(id);
  }
  shapeRandomToggle.checked = state.shapeRandom;
  cycleSlider.value = state.cycle;
  cycleValue.textContent = `${state.cycle.toFixed(1)}s`;
  smoothSlider.value = state.smooth;
  smoothValue.textContent = `${state.smooth}%`;
  speedSlider.value = state.speed;
  speedValue.textContent = `${state.speed.toFixed(2)}x`;
  cellSizeSlider.value = state.cellSize;
  cellSizeValue.textContent = String(state.cellSize);
  pixelSizeSlider.value = state.pixelSize;
  pixelSizeValue.textContent = String(state.pixelSize);
  glitchAmountSlider.value = state.glitch;
  glitchAmountValue.textContent = AbsGlitchPost.formatPercent(state.glitch);
  glitchShiftSlider.value = state.glitchShift;
  glitchShiftValue.textContent = AbsGlitchPost.formatPercent(state.glitchShift);
  glitchChromaSlider.value = state.glitchChroma;
  glitchChromaValue.textContent = AbsGlitchPost.formatPercent(state.glitchChroma);
  glitchBulgeSlider.value = state.glitchBulge;
  glitchBulgeValue.textContent = AbsGlitchPost.formatPercent(state.glitchBulge);
  glitchRateSlider.value = state.glitchRate;
  glitchRateValue.textContent = `${state.glitchRate.toFixed(1)}Hz`;
  vignetteStrengthSlider.value = state.vignetteStrength;
  vignetteStrengthValue.textContent = `${state.vignetteStrength}%`;
  applyGroupVisibility();
  applyVignette();
}

function applyAll() {
  applySettingsMode();
  applySide();
  syncInputs();
  resetShapeCycle();
  resizeCanvas();
  repaintNow();
}

function resetParam(key) {
  switch (key) {
    case "cycle":
      state.cycle = defaults.cycle;
      break;
    case "smooth":
      state.smooth = defaults.smooth;
      break;
    case "speed":
      state.speed = defaults.speed;
      break;
    case "cellSize":
      state.cellSize = defaults.cellSize;
      break;
    case "pixelSize":
      state.pixelSize = defaults.pixelSize;
      break;
    case "glitch":
      state.glitch = defaults.glitch;
      break;
    case "glitchShift":
      state.glitchShift = defaults.glitchShift;
      break;
    case "glitchChroma":
      state.glitchChroma = defaults.glitchChroma;
      break;
    case "glitchBulge":
      state.glitchBulge = defaults.glitchBulge;
      break;
    case "glitchRate":
      state.glitchRate = defaults.glitchRate;
      break;
    case "vignetteStrength":
      state.vignetteStrength = defaults.vignetteStrength;
      break;
    default:
      return;
  }
  syncInputs();
  if (key === "speed" || key === "cellSize" || key === "pixelSize" || key.startsWith("glitch")) {
    if (key === "pixelSize") resizeCanvas();
    repaintNow();
  }
  updateURL();
}

sectionToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    closeAllMenuPickers();
    const section = toggle.closest(".settings-section");
    const panel = section.querySelector(".section-panel");
    const icon = toggle.querySelector(".section-toggle-icon");
    const willOpen = toggle.getAttribute("aria-expanded") !== "true";

    sectionToggles.forEach((other) => {
      const otherSection = other.closest(".settings-section");
      const otherPanel = otherSection.querySelector(".section-panel");
      const otherIcon = other.querySelector(".section-toggle-icon");
      other.setAttribute("aria-expanded", "false");
      otherPanel.hidden = true;
      if (otherIcon) otherIcon.textContent = "⏵";
    });

    if (willOpen) {
      toggle.setAttribute("aria-expanded", "true");
      panel.hidden = false;
      if (icon) icon.textContent = "⏷";
    }
  });
});

document.addEventListener("click", (e) => {
  if (e.detail !== 2) return;
  if (!(e.target instanceof Element)) return;
  if (e.target.closest("#settings-menu")) return;
  if (e.target.closest("a")) return;
  if (e.target.closest(".logo-glitch")) return;
  toggleSettings();
});

if (logo) {
  logo.addEventListener("click", () => {
    toggleSettings();
  });
}

flipSideButton.addEventListener("click", () => {
  state.side = state.side === "left" ? "right" : "left";
  applySide();
  updateURL();
});

closeSettingsButton.addEventListener("click", () => {
  setSettingsMode("DISABLE");
});

colorInput.addEventListener("input", (e) => {
  const color = normalizeHex(e.target.value.trim());
  if (!color) return;
  state.colors[selectedColorIndex] = color;
  syncColorPicker(color);
  renderSwatches();
  repaintNow();
  updateURL();
});

colorResetButton.addEventListener("click", () => {
  state.colors = defaults.colors.slice();
  selectedColorIndex = 0;
  syncInputs();
  repaintNow();
  updateURL();
});

for (const id of SHAPE_IDS) {
  shapeInputs[id].addEventListener("change", () => {
    const next = SHAPE_IDS.filter((name) => shapeInputs[name].checked);
    state.shapes = next.length ? next : ["diamond"];
    resetShapeCycle();
    syncInputs();
    repaintNow();
    updateURL();
  });
}

shapeRandomToggle.addEventListener("change", (e) => {
  state.shapeRandom = e.target.checked;
  resetShapeCycle();
  updateURL();
});

cycleSlider.addEventListener("input", (e) => {
  state.cycle = clampCycle(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

smoothSlider.addEventListener("input", (e) => {
  state.smooth = clampSmooth(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

speedSlider.addEventListener("input", (e) => {
  state.speed = clampSpeed(Number.parseFloat(e.target.value));
  syncInputs();
  if (!REDUCE_MOTION) repaintNow();
  updateURL();
});

cellSizeSlider.addEventListener("input", (e) => {
  state.cellSize = clampCellSize(Number.parseFloat(e.target.value));
  syncInputs();
  repaintNow();
  updateURL();
});

pixelSizeSlider.addEventListener("input", (e) => {
  state.pixelSize = clampPixelSize(Number.parseFloat(e.target.value));
  resizeCanvas();
  syncInputs();
  repaintNow();
  updateURL();
});

glitchAmountSlider.addEventListener("input", (e) => {
  state.glitch = AbsGlitchPost.clampAmount(Number.parseFloat(e.target.value));
  syncInputs();
  repaintNow();
  updateURL();
});

glitchShiftSlider.addEventListener("input", (e) => {
  state.glitchShift = AbsGlitchPost.clampUnit(Number.parseFloat(e.target.value));
  syncInputs();
  repaintNow();
  updateURL();
});

glitchChromaSlider.addEventListener("input", (e) => {
  state.glitchChroma = AbsGlitchPost.clampUnit(Number.parseFloat(e.target.value));
  syncInputs();
  repaintNow();
  updateURL();
});

glitchBulgeSlider.addEventListener("input", (e) => {
  state.glitchBulge = AbsGlitchPost.clampUnit(Number.parseFloat(e.target.value));
  syncInputs();
  repaintNow();
  updateURL();
});

glitchRateSlider.addEventListener("input", (e) => {
  state.glitchRate = AbsGlitchPost.clampRate(Number.parseFloat(e.target.value));
  syncInputs();
  repaintNow();
  updateURL();
});

vignetteToggle.addEventListener("change", (e) => {
  state.vignette = e.target.checked;
  applyVignette();
  updateURL();
});

vignetteStrengthSlider.addEventListener("input", (e) => {
  state.vignetteStrength = clampVignetteStrength(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

for (const button of document.querySelectorAll("[data-reset]")) {
  button.addEventListener("click", () => {
    resetParam(button.getAttribute("data-reset"));
  });
}

resetButton.addEventListener("click", () => {
  state.palette = defaults.palette;
  state.colors = defaults.colors.slice();
  state.shape = defaults.shape;
  state.shapes = defaults.shapes.slice();
  state.shapeRandom = defaults.shapeRandom;
  state.cycle = defaults.cycle;
  state.smooth = defaults.smooth;
  state.speed = defaults.speed;
  state.cellSize = defaults.cellSize;
  state.pixelSize = defaults.pixelSize;
  state.glitch = defaults.glitch;
  state.glitchShift = defaults.glitchShift;
  state.glitchChroma = defaults.glitchChroma;
  state.glitchBulge = defaults.glitchBulge;
  state.glitchRate = defaults.glitchRate;
  state.vignette = defaults.vignette;
  state.vignetteStrength = defaults.vignetteStrength;
  state.side = defaults.side;
  selectedColorIndex = 0;
  applyAll();
  updateURL();
  flashMenuAction(resetButton, "Reset!");
});

applyAll();
updateURL();
window.addEventListener("resize", () => {
  resizeCanvas();
  repaintNow();
});
if (!REDUCE_MOTION) startAnimation();

if (!REDUCE_MOTION) {
  const pulseRoot = document.getElementById("pulse-root");
  const effect = window.SeshThemes && window.SeshThemes.effects && window.SeshThemes.effects["lcd-glass"];
  if (pulseRoot && effect && typeof effect.start === "function") {
    effect.start(pulseRoot);
  }
}
