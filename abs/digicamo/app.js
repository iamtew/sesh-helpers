// Digicamo — ABS woodland digicam backdrop (FBM value noise, nearest-neighbor blocks).
// Query string is the complete shareable config for meat bags and OBS.

const SCALE_X = 0.085;
const SCALE_Y = 0.11;
const FRAME_MS = 50;
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PALETTES = {
  woodland: {
    colors: [
      [12, 15, 11],
      [16, 20, 15],
      [22, 27, 20],
      [26, 33, 24],
      [45, 53, 40],
      [108, 117, 74],
      [154, 172, 98],
      [102, 102, 102]
    ],
    fleck: [134, 0, 223],
    glow: [
      [134, 0, 223],
      [229, 242, 13],
      [0, 245, 58]
    ]
  },
  desert: {
    colors: [
      [28, 22, 14],
      [42, 34, 20],
      [58, 46, 28],
      [78, 62, 36],
      [110, 88, 48],
      [148, 120, 68],
      [180, 150, 96],
      [120, 100, 72]
    ],
    fleck: [180, 72, 32],
    glow: [
      [180, 72, 32],
      [220, 180, 80],
      [160, 110, 40]
    ]
  },
  urban: {
    colors: [
      [10, 12, 14],
      [18, 20, 24],
      [32, 34, 38],
      [48, 50, 56],
      [72, 74, 80],
      [100, 102, 108],
      [140, 142, 148],
      [88, 92, 98]
    ],
    fleck: [0, 200, 220],
    glow: [
      [0, 180, 200],
      [120, 140, 160],
      [40, 60, 80]
    ]
  },
  arctic: {
    colors: [
      [18, 22, 28],
      [36, 42, 52],
      [58, 68, 80],
      [90, 104, 118],
      [130, 148, 162],
      [170, 186, 198],
      [210, 220, 228],
      [150, 160, 170]
    ],
    fleck: [120, 200, 255],
    glow: [
      [120, 200, 255],
      [200, 220, 240],
      [80, 140, 180]
    ]
  },
  neon: {
    colors: [
      [4, 4, 8],
      [10, 8, 16],
      [18, 12, 28],
      [28, 16, 40],
      [8, 40, 48],
      [0, 180, 200],
      [40, 255, 120],
      [80, 80, 100]
    ],
    fleck: [255, 20, 160],
    glow: [
      [255, 20, 160],
      [0, 255, 200],
      [180, 255, 40]
    ]
  },
  synth: {
    colors: [
      [8, 4, 18],
      [18, 8, 36],
      [36, 12, 64],
      [56, 20, 96],
      [80, 28, 130],
      [140, 40, 180],
      [0, 220, 255],
      [100, 60, 140]
    ],
    fleck: [255, 0, 200],
    glow: [
      [180, 0, 255],
      [255, 0, 180],
      [0, 220, 255]
    ]
  },
  toxic: {
    colors: [
      [4, 8, 2],
      [10, 18, 4],
      [18, 32, 6],
      [28, 52, 8],
      [48, 90, 10],
      [90, 160, 12],
      [180, 240, 20],
      [60, 80, 20]
    ],
    fleck: [255, 255, 40],
    glow: [
      [180, 255, 0],
      [255, 240, 40],
      [80, 200, 20]
    ]
  },
  candy: {
    colors: [
      [24, 16, 28],
      [48, 28, 52],
      [80, 48, 90],
      [120, 80, 140],
      [160, 120, 180],
      [140, 200, 180],
      [255, 160, 200],
      [200, 180, 220]
    ],
    fleck: [255, 100, 180],
    glow: [
      [255, 140, 200],
      [160, 220, 200],
      [200, 160, 255]
    ]
  }
};

const PALETTE_IDS = new Set(Object.keys(PALETTES));

const defaults = {
  palette: "woodland",
  speed: 1,
  cellSize: 7,
  fleck: 0.965,
  ...AbsGlitchPost.defaults,
  vignette: true,
  vignetteStrength: 33,
  settingsMode: "ON",
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

function normalizePalette(value) {
  const id = String(value ?? "").toLowerCase();
  return PALETTE_IDS.has(id) ? id : defaults.palette;
}

function clampSpeed(value) {
  return Math.min(3, Math.max(0, value));
}

function clampCellSize(value) {
  return Math.min(24, Math.max(3, Math.round(value)));
}

function clampFleck(value) {
  return Math.min(0.995, Math.max(0.9, value));
}

function clampVignetteStrength(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

let state = {
  palette: normalizePalette(getParam("palette", defaults.palette)),
  speed: clampSpeed(getNumberParam("speed", defaults.speed)),
  cellSize: clampCellSize(getNumberParam("cellSize", defaults.cellSize)),
  fleck: clampFleck(getNumberParam("fleck", defaults.fleck)),
  glitch: AbsGlitchPost.clampAmount(getNumberParam("glitch", defaults.glitch)),
  glitchShift: AbsGlitchPost.clampUnit(getNumberParam("glitchShift", defaults.glitchShift)),
  glitchChroma: AbsGlitchPost.clampUnit(getNumberParam("glitchChroma", defaults.glitchChroma)),
  glitchBulge: AbsGlitchPost.clampUnit(getNumberParam("glitchBulge", defaults.glitchBulge)),
  glitchRate: AbsGlitchPost.clampRate(getNumberParam("glitchRate", defaults.glitchRate)),
  vignette: getBooleanParam("vignette", defaults.vignette),
  vignetteStrength: clampVignetteStrength(getNumberParam("vignetteStrength", defaults.vignetteStrength)),
  settingsMode: getParam("menu", defaults.settingsMode) === "DISABLE" ? "DISABLE" : "ON",
  side: getParam("side", defaults.side) === "left" ? "left" : "right"
};

const canvas = document.getElementById("digicamo-canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const glowEl = document.getElementById("glow");
const vignetteEl = document.getElementById("vignette");
const settingsMenu = document.getElementById("settings-menu");
const flipSideButton = document.getElementById("flip-side-button");
const closeSettingsButton = document.getElementById("close-menu-button");
const palettePickerEl = document.getElementById("palette-picker");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const cellSizeSlider = document.getElementById("cell-size-slider");
const cellSizeValue = document.getElementById("cell-size-value");
const fleckSlider = document.getElementById("fleck-slider");
const fleckValue = document.getElementById("fleck-value");
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
const vignetteToggle = document.getElementById("vignette-toggle");
const vignetteStrengthSlider = document.getElementById("vignette-strength-slider");
const vignetteStrengthValue = document.getElementById("vignette-strength-value");
const resetButton = document.getElementById("reset-button");
const copyUrlButton = document.getElementById("copy-url-button");
const copyUrlObsButton = document.getElementById("copy-url-obs-button");
const sectionToggles = document.querySelectorAll("[data-section-toggle]");

const createMenuPicker = window.SeshMenuPicker.create;
const closeAllMenuPickers = window.SeshMenuPicker.closeAll;

const paletteOptions = Object.keys(PALETTES).map((id) => ({
  value: id,
  label: id.charAt(0).toUpperCase() + id.slice(1)
}));

const palettePicker = createMenuPicker({
  root: palettePickerEl,
  options: paletteOptions,
  labelledBy: "palette-label",
  getValue: () => state.palette,
  setValue: (value) => {
    state.palette = normalizePalette(value);
    applyGlow();
    syncInputs();
    repaintNow();
    updateURL();
  }
});

let cols = 0;
let rows = 0;
let image = null;
let data = null;
let sourceData = null;
let time = 0;
let resizeTimer = 0;

function hash2(x, y) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(x, y) {
  let v = 0;
  let amp = 0.55;
  let freq = 1;
  for (let i = 0; i < 5; i++) {
    v += amp * valueNoise(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2.05;
  }
  return Math.min(1, Math.max(0, v));
}

function pickColor(n, accent, palette) {
  if (accent > state.fleck) return palette.fleck;
  const colors = palette.colors;
  if (n < 0.18) return colors[0];
  if (n < 0.32) return colors[1];
  if (n < 0.46) return colors[2];
  if (n < 0.58) return colors[3];
  if (n < 0.7) return colors[4];
  if (n < 0.82) return colors[5];
  if (n < 0.92) return colors[6];
  return colors[7];
}

function rgbCsv(rgb) {
  return `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`;
}

function applyGlow() {
  const palette = PALETTES[state.palette] || PALETTES.woodland;
  const [a, b, c] = palette.glow;
  glowEl.style.setProperty("--glow-a", rgbCsv(a));
  glowEl.style.setProperty("--glow-b", rgbCsv(b));
  glowEl.style.setProperty("--glow-c", rgbCsv(c));
}

function resizeGrid() {
  cols = Math.max(1, Math.ceil(window.innerWidth / state.cellSize));
  rows = Math.max(1, Math.ceil(window.innerHeight / state.cellSize));
  canvas.width = cols;
  canvas.height = rows;
  image = ctx.createImageData(cols, rows);
  data = image.data;
  sourceData = new Uint8ClampedArray(data.length);
}

function scheduleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    resizeGrid();
    repaintNow();
  }, 180);
}

function paint(nowMs) {
  if (!sourceData) return;

  const palette = PALETTES[state.palette] || PALETTES.woodland;
  const t = time;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const n = fbm(x * SCALE_X + t, y * SCALE_Y);
      const accent = hash2(x * 17 + 3, y * 29 + 7);
      const rgb = pickColor(n, accent, palette);
      const i = (y * cols + x) * 4;
      sourceData[i] = rgb[0];
      sourceData[i + 1] = rgb[1];
      sourceData[i + 2] = rgb[2];
      sourceData[i + 3] = 255;
    }
  }

  AbsGlitchPost.applyPostProcess(nowMs, sourceData, data, cols, rows, state, FRAME_MS);
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
  time += state.speed * 0.012;
  paint(now);
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
  paint(REDUCE_MOTION ? 0 : performance.now());
}

document.addEventListener("visibilitychange", () => {
  if (REDUCE_MOTION) return;
  if (document.hidden) {
    stopAnimation();
  } else {
    startAnimation();
  }
});

window.addEventListener("resize", scheduleResize);

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

function updateURL() {
  params.set("palette", state.palette);
  params.set("speed", String(state.speed));
  params.set("cellSize", String(state.cellSize));
  params.set("fleck", String(state.fleck));
  params.set("glitch", String(state.glitch));
  params.set("glitchShift", String(state.glitchShift));
  params.set("glitchChroma", String(state.glitchChroma));
  params.set("glitchBulge", String(state.glitchBulge));
  params.set("glitchRate", String(state.glitchRate));
  params.set("vignette", String(state.vignette));
  params.set("vignetteStrength", String(state.vignetteStrength));
  params.set("menu", state.settingsMode);
  params.set("side", state.side);
  history.replaceState({}, "", "?" + params.toString());
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

function syncInputs() {
  palettePicker.sync();
  speedSlider.value = state.speed;
  speedValue.textContent = state.speed === 0 ? "0x" : `${state.speed.toFixed(2)}x`;
  cellSizeSlider.value = state.cellSize;
  cellSizeValue.textContent = String(state.cellSize);
  fleckSlider.value = state.fleck;
  fleckValue.textContent = state.fleck.toFixed(3);
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
  applyVignette();
}

function applyAll() {
  applySettingsMode();
  applySide();
  applyGlow();
  syncInputs();
  resizeGrid();
  repaintNow();
}

function resetParam(key) {
  switch (key) {
    case "speed":
      state.speed = defaults.speed;
      break;
    case "cellSize":
      state.cellSize = defaults.cellSize;
      break;
    case "fleck":
      state.fleck = defaults.fleck;
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
  if (key === "cellSize") {
    resizeGrid();
  }
  if (key === "speed" || key === "cellSize" || key === "fleck" || key.startsWith("glitch")) {
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
  if (state.settingsMode === "DISABLE") {
    state.settingsMode = "ON";
    applySettingsMode();
    updateURL();
    return;
  }
  if (e.target instanceof Element && e.target.closest("#settings-menu")) return;
});

flipSideButton.addEventListener("click", () => {
  state.side = state.side === "left" ? "right" : "left";
  applySide();
  updateURL();
});

closeSettingsButton.addEventListener("click", () => {
  state.settingsMode = "DISABLE";
  applySettingsMode();
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
  resizeGrid();
  repaintNow();
  updateURL();
});

fleckSlider.addEventListener("input", (e) => {
  state.fleck = clampFleck(Number.parseFloat(e.target.value));
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
  state.speed = defaults.speed;
  state.cellSize = defaults.cellSize;
  state.fleck = defaults.fleck;
  state.glitch = defaults.glitch;
  state.glitchShift = defaults.glitchShift;
  state.glitchChroma = defaults.glitchChroma;
  state.glitchBulge = defaults.glitchBulge;
  state.glitchRate = defaults.glitchRate;
  state.vignette = defaults.vignette;
  state.vignetteStrength = defaults.vignetteStrength;
  state.side = defaults.side;
  applyAll();
  updateURL();
  flashMenuAction(resetButton, "Reset!");
});

copyUrlButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    flashMenuAction(copyUrlButton, "Copied!");
  } catch {
    flashMenuAction(copyUrlButton, "Failed");
  }
});

copyUrlObsButton.addEventListener("click", async () => {
  try {
    const url = new URL(location.href);
    url.searchParams.set("menu", "DISABLE");
    await navigator.clipboard.writeText(url.toString());
    flashMenuAction(copyUrlObsButton, "Copied!");
  } catch {
    flashMenuAction(copyUrlObsButton, "Failed");
  }
});

applyAll();
updateURL();
if (!REDUCE_MOTION) startAnimation();
