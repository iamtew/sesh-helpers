// Diamond — ABS LCD geometric diamond lattice backdrop.
// Query string is the complete shareable config for meat bags and OBS.

const PALETTES = {
  lcd: {
    colors: [
      [6, 11, 20],
      [10, 22, 40],
      [14, 34, 62],
      [24, 56, 96],
      [36, 78, 120],
      [48, 100, 140],
      [40, 120, 150],
      [70, 40, 90]
    ],
    fleckIndex: 7
  },
  violet: {
    colors: [
      [8, 6, 18],
      [16, 12, 36],
      [28, 20, 58],
      [44, 32, 90],
      [64, 48, 120],
      [88, 64, 150],
      [110, 80, 170],
      [200, 70, 160]
    ],
    fleckIndex: 7
  },
  ember: {
    colors: [
      [12, 6, 4],
      [28, 12, 6],
      [48, 20, 8],
      [78, 32, 10],
      [120, 48, 14],
      [160, 70, 20],
      [190, 100, 30],
      [220, 160, 40]
    ],
    fleckIndex: 7
  },
  jade: {
    colors: [
      [4, 12, 10],
      [8, 24, 20],
      [12, 40, 32],
      [18, 64, 48],
      [28, 96, 68],
      [40, 128, 88],
      [56, 160, 110],
      [180, 220, 60]
    ],
    fleckIndex: 7
  },
  rose: {
    colors: [
      [14, 6, 12],
      [28, 10, 24],
      [48, 16, 40],
      [78, 28, 58],
      [120, 44, 80],
      [160, 64, 110],
      [200, 90, 140],
      [255, 140, 190]
    ],
    fleckIndex: 7
  },
  acid: {
    colors: [
      [6, 12, 4],
      [12, 28, 6],
      [24, 48, 8],
      [40, 78, 10],
      [64, 120, 14],
      [96, 170, 20],
      [140, 220, 30],
      [220, 255, 40]
    ],
    fleckIndex: 7
  }
};

const PALETTE_IDS = new Set(Object.keys(PALETTES));
const FRAME_MS = 50;
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const defaults = {
  palette: "lcd",
  speed: 1,
  cellSize: 5,
  ...AbsGlitchPost.defaults,
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

function normalizePalette(value) {
  const id = String(value ?? "").toLowerCase();
  return PALETTE_IDS.has(id) ? id : defaults.palette;
}

function clampSpeed(value) {
  return Math.min(3, Math.max(0.25, value));
}

function clampCellSize(value) {
  return Math.min(16, Math.max(2, Math.round(value)));
}

function clampVignetteStrength(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

let state = {
  palette: normalizePalette(getParam("palette", defaults.palette)),
  speed: clampSpeed(getNumberParam("speed", defaults.speed)),
  cellSize: clampCellSize(getNumberParam("cellSize", defaults.cellSize)),
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

const canvas = document.getElementById("diamond-canvas");
const ctx = canvas.getContext("2d", { alpha: false });
const W = canvas.width;
const H = canvas.height;
const image = ctx.createImageData(W, H);
const data = image.data;
const sourceData = new Uint8ClampedArray(data.length);

const vignetteEl = document.getElementById("vignette");
const settingsMenu = document.getElementById("settings-menu");
const flipSideButton = document.getElementById("flip-side-button");
const closeSettingsButton = document.getElementById("close-menu-button");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const cellSizeSlider = document.getElementById("cell-size-slider");
const cellSizeValue = document.getElementById("cell-size-value");
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
const paletteSelect = document.getElementById("palette-select");
const vignetteToggle = document.getElementById("vignette-toggle");
const vignetteStrengthSlider = document.getElementById("vignette-strength-slider");
const vignetteStrengthValue = document.getElementById("vignette-strength-value");
const resetButton = document.getElementById("reset-button");
const copyUrlButton = document.getElementById("copy-url-button");
const copyUrlObsButton = document.getElementById("copy-url-obs-button");
const sectionToggles = document.querySelectorAll("[data-section-toggle]");

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

function paint(timeSec, nowMs) {
  const palette = PALETTES[state.palette] || PALETTES.lcd;
  const colors = palette.colors;
  const fleckIndex = palette.fleckIndex;
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

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x - cx - ox;
      const dy = y - cy - oy;

      const manh = Math.abs(dx) + Math.abs(dy) * 1.2;
      const rings = ((manh * 0.45 - ringPhase) % 4 + 4) % 4;
      const ringBand = rings < 0.55 || rings > 3.45 ? 2 : rings < 1.1 ? 1 : 0;

      const u = dx * 0.7 + dy * 0.4 + shear * 4;
      const v = -dx * 0.4 + dy * 0.7 - shear * 3;
      const cell = (Math.floor(u / cellSize) + Math.floor(v / cellSize)) & 1;
      const edgeU = Math.abs((u % cellSize + cellSize) % cellSize - half);
      const edgeV = Math.abs((v % cellSize + cellSize) % cellSize - half);
      const onGrid = edgeU < edgeTol || edgeV < edgeTol ? 1 : 0;

      const pulse = Math.sin(manh * 0.2 - t * 0.4) * 0.5 + 0.5;

      let level = 1 + cell + ringBand + onGrid;
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

function updateURL() {
  params.set("palette", state.palette);
  params.set("speed", String(state.speed));
  params.set("cellSize", String(state.cellSize));
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
  speedSlider.value = state.speed;
  speedValue.textContent = `${state.speed.toFixed(2)}x`;
  cellSizeSlider.value = state.cellSize;
  cellSizeValue.textContent = String(state.cellSize);
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
  paletteSelect.value = state.palette;
  vignetteStrengthSlider.value = state.vignetteStrength;
  vignetteStrengthValue.textContent = `${state.vignetteStrength}%`;
  applyVignette();
}

function applyAll() {
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
  if (key === "speed" || key === "cellSize" || key.startsWith("glitch")) repaintNow();
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

paletteSelect.addEventListener("change", (e) => {
  state.palette = normalizePalette(e.target.value);
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
paint(0, 0);
if (!REDUCE_MOTION) startAnimation();
