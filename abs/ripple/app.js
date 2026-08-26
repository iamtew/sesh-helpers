// Ripple — ABS pulsing pixel wave backdrop.
// Query string is the complete shareable config for meat bags and OBS.

const PATTERN_IDS = [
  "radial",
  "linear",
  "diagonal",
  "noise",
  "pulse",
  "turbulence",
  "helix",
  "flow",
  "weave",
  "checkerwarp",
  "fog"
];

const PALETTE_BASE = {
  lcd: "2896b4",
  violet: "6032b4",
  ember: "c8300a",
  jade: "28a068",
  rose: "c8286e",
  acid: "78dc14"
};

const PALETTE_IDS = new Set(["spectrum", ...Object.keys(PALETTE_BASE)]);
const FRAME_MS = 50;
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const defaults = {
  pattern: "radial",
  cellSize: 24,
  speed: 0.01,
  palette: "spectrum",
  vignette: true,
  vignetteStrength: 100,
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

function normalizePattern(value) {
  const id = String(value ?? "").toLowerCase();
  return PATTERN_IDS.includes(id) ? id : defaults.pattern;
}

function normalizePalette(value) {
  const id = String(value ?? "").toLowerCase();
  return PALETTE_IDS.has(id) ? id : defaults.palette;
}

function clampSpeed(value) {
  return Math.min(0.05, Math.max(0.002, value));
}

function clampCellSize(value) {
  return Math.min(80, Math.max(16, Math.round(value)));
}

function clampVignetteStrength(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

let state = {
  pattern: normalizePattern(getParam("pattern", defaults.pattern)),
  cellSize: clampCellSize(getNumberParam("cellSize", defaults.cellSize)),
  speed: clampSpeed(getNumberParam("speed", defaults.speed)),
  palette: normalizePalette(getParam("palette", defaults.palette)),
  vignette: getBooleanParam("vignette", defaults.vignette),
  vignetteStrength: clampVignetteStrength(getNumberParam("vignetteStrength", defaults.vignetteStrength)),
  settingsMode: getParam("menu", defaults.settingsMode) === "DISABLE" ? "DISABLE" : "ON",
  side: getParam("side", defaults.side) === "left" ? "left" : "right"
};

const canvas = document.getElementById("ripple-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

let cols = 0;
let rows = 0;
let image = null;
let data = null;
let time = 0;
let triadicPalette = null;

const vignetteEl = document.getElementById("vignette");
const settingsMenu = document.getElementById("settings-menu");
const flipSideButton = document.getElementById("flip-side-button");
const closeSettingsButton = document.getElementById("close-menu-button");
const patternSelect = document.getElementById("pattern-select");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const cellSizeSlider = document.getElementById("cell-size-slider");
const cellSizeValue = document.getElementById("cell-size-value");
const paletteSelect = document.getElementById("palette-select");
const vignetteToggle = document.getElementById("vignette-toggle");
const vignetteStrengthSlider = document.getElementById("vignette-strength-slider");
const vignetteStrengthValue = document.getElementById("vignette-strength-value");
const resetButton = document.getElementById("reset-button");
const copyUrlButton = document.getElementById("copy-url-button");
const copyUrlObsButton = document.getElementById("copy-url-obs-button");
const sectionToggles = document.querySelectorAll("[data-section-toggle]");

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const num = Number.parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;

  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  h /= 360;
  let r;
  let g;
  let b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function rotateHue(rgb, deg) {
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + deg) % 360;
  return hslToRgb(hsl.h, hsl.s, hsl.l);
}

function updateTriadicPalette() {
  if (state.palette === "spectrum") {
    triadicPalette = null;
    return;
  }
  const hex = PALETTE_BASE[state.palette];
  if (!hex) {
    triadicPalette = null;
    return;
  }
  const rgb = hexToRgb(hex);
  if (!rgb) {
    triadicPalette = null;
    return;
  }
  triadicPalette = [rgb, rotateHue(rgb, 120), rotateHue(rgb, 240)];
}

function getPhase(x, y, t) {
  switch (state.pattern) {
    case "linear":
      return x * 0.35 + t * 3;
    case "diagonal":
      return (x + y) * 0.25 + t * 3;
    case "noise":
      return Math.sin(x * 0.3 + t * 2) + Math.sin(y * 0.5 + t * 1.5);
    case "pulse":
      return t * 4 + Math.sin(x * 0.3 + t) * 1.5 + Math.sin(y * 0.25 - t * 0.5) * 1.5;
    case "turbulence":
      return Math.sin(x * 0.15 + t * 1.5) * 2 + Math.sin(y * 0.22 - t * 1.2) * 2 + Math.sin((x + y) * 0.1 + t * 0.7) * 2;
    case "helix":
      return Math.sin(x * 0.25 + t * 3) + Math.sin((y + x) * 0.15 - t * 2);
    case "flow":
      return Math.sin(x * 0.12 + t * 1.5) * 2 + Math.sin(y * 0.18 - t * 1.2) * 2;
    case "weave":
      return Math.sin(x * 0.25 + t * 2) + Math.sin(y * 0.35 - t * 2.5);
    case "checkerwarp":
      return Math.sin((x ^ y) * 0.15 + t * 4);
    case "fog":
      return Math.sin(x * 0.1 + t * 0.6) + Math.sin(y * 0.1 - t * 0.4);
    case "radial":
    default: {
      const dx = x - cols / 2;
      const dy = y - rows / 2;
      return Math.sqrt(dx * dx + dy * dy) * 0.25 + t * 2;
    }
  }
}

function computeColorFromPhase(phase) {
  if (!triadicPalette) {
    return {
      r: Math.floor(lerp(10, 255, (Math.sin(phase) + 1) / 2)),
      g: Math.floor(lerp(10, 255, (Math.sin(phase + 2) + 1) / 2)),
      b: Math.floor(lerp(10, 255, (Math.sin(phase + 4) + 1) / 2))
    };
  }

  const t = (Math.sin(phase) + 1) / 2;
  const c1 = triadicPalette[0];
  const c2 = triadicPalette[1];

  return {
    r: Math.floor(lerp(c1.r, c2.r, t)),
    g: Math.floor(lerp(c1.g, c2.g, t)),
    b: Math.floor(lerp(c1.b, c2.b, t))
  };
}

function resizeGrid() {
  cols = Math.max(1, Math.ceil(window.innerWidth / state.cellSize));
  rows = Math.max(1, Math.ceil(window.innerHeight / state.cellSize));
  canvas.width = cols;
  canvas.height = rows;
  image = ctx.createImageData(cols, rows);
  data = image.data;
}

function paint() {
  if (!data) return;

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const phase = getPhase(gx, gy, time);
      const { r, g, b } = computeColorFromPhase(phase);
      const alpha = ((Math.sin(phase * 0.7) + 1) / 2) * 0.9;

      const idx = (gy * cols + gx) * 4;
      data[idx] = Math.round(r * alpha);
      data[idx + 1] = Math.round(g * alpha);
      data[idx + 2] = Math.round(b * alpha);
      data[idx + 3] = 255;
    }
  }

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
  time += state.speed;
  paint();
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
  if (!REDUCE_MOTION) {
    time += state.speed;
  }
  paint();
}

document.addEventListener("visibilitychange", () => {
  if (REDUCE_MOTION) return;
  if (document.hidden) {
    stopAnimation();
  } else {
    startAnimation();
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

function updateURL() {
  params.set("pattern", state.pattern);
  params.set("cellSize", String(state.cellSize));
  params.set("speed", String(state.speed));
  params.set("palette", state.palette);
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
  patternSelect.value = state.pattern;
  speedSlider.value = state.speed;
  speedValue.textContent = state.speed.toFixed(3);
  cellSizeSlider.value = state.cellSize;
  cellSizeValue.textContent = String(state.cellSize);
  paletteSelect.value = state.palette;
  vignetteStrengthSlider.value = state.vignetteStrength;
  vignetteStrengthValue.textContent = `${state.vignetteStrength}%`;
  applyVignette();
}

function applyAll() {
  updateTriadicPalette();
  resizeGrid();
  applySettingsMode();
  applySide();
  syncInputs();
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
    case "vignetteStrength":
      state.vignetteStrength = defaults.vignetteStrength;
      break;
    default:
      return;
  }
  if (key === "cellSize") {
    resizeGrid();
  }
  syncInputs();
  if (key === "speed" || key === "cellSize") repaintNow();
  updateURL();
}

sectionToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
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

patternSelect.addEventListener("change", (e) => {
  state.pattern = normalizePattern(e.target.value);
  syncInputs();
  repaintNow();
  updateURL();
});

speedSlider.addEventListener("input", (e) => {
  state.speed = clampSpeed(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

cellSizeSlider.addEventListener("input", (e) => {
  state.cellSize = clampCellSize(Number.parseFloat(e.target.value));
  syncInputs();
  resizeGrid();
  repaintNow();
  updateURL();
});

paletteSelect.addEventListener("change", (e) => {
  state.palette = normalizePalette(e.target.value);
  updateTriadicPalette();
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
  state.pattern = defaults.pattern;
  state.cellSize = defaults.cellSize;
  state.speed = defaults.speed;
  state.palette = defaults.palette;
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

window.addEventListener("resize", () => {
  resizeGrid();
  repaintNow();
});

applyAll();
updateURL();
if (!REDUCE_MOTION) startAnimation();
