// Code Rain — ABS matrix backdrop / overlay.
// Query string is the complete shareable config for meat bags and OBS.

const CHAR_ARRAY = "アイウエオカキクケコ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DIR_ORDER = ["top", "right", "bottom", "left"];
const DIR_SET = new Set(DIR_ORDER);
const FADE_ALPHA = 0.05;
const MOTION_SCALE = 0.01;
const SPIN_RAD_PER_SEC = 0.4;
const GLITCH_W = 192;
const GLITCH_H = 108;
const FRAME_MS = 50;
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const defaults = {
  colors: ["#00ff00"],
  bg: "#000000",
  speed: 1,
  size: 16,
  dir: ["top"],
  motion: 0,
  spin: 0,
  ...AbsGlitchPost.defaults,
  settingsMode: "ON",
  side: "right"
};

const params = new URLSearchParams(location.search);

function getParam(key, fallback) {
  return params.has(key) ? params.get(key) : fallback;
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
  if (!parts.length) return defaults.colors.slice();
  return parts.slice(0, 3);
}

function parseBg(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "transparent" || raw === "none") return "transparent";
  return normalizeHex(value) || defaults.bg;
}

function parseDir(value) {
  const parts = String(value ?? "")
    .toLowerCase()
    .split(/[+,]/)
    .map((part) => part.trim())
    .filter((part) => DIR_SET.has(part));
  const enabled = DIR_ORDER.filter((dir) => parts.includes(dir));
  return enabled.length ? enabled : defaults.dir.slice();
}

function clampSpeed(value) {
  return Math.min(4, Math.max(0.25, value));
}

function clampSize(value) {
  return Math.min(48, Math.max(8, Math.round(value)));
}

function clampMotion(value) {
  return Math.min(2, Math.max(-2, Math.round(value * 100) / 100));
}

function clampSpin(value) {
  return clampMotion(value);
}

function hexToRgb(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbCss(rgb) {
  return `rgb(${rgb.r | 0},${rgb.g | 0},${rgb.b | 0})`;
}

function lerpColor(a, b, t) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t
  };
}

let state = {
  colors: parseColors(getParam("color", defaults.colors.join(","))),
  bg: parseBg(getParam("bg", defaults.bg)),
  speed: clampSpeed(getNumberParam("speed", defaults.speed)),
  size: clampSize(getNumberParam("size", defaults.size)),
  dir: parseDir(getParam("dir", defaults.dir.join(","))),
  motion: clampMotion(getNumberParam("motion", defaults.motion)),
  spin: clampSpin(getNumberParam("spin", defaults.spin)),
  glitch: AbsGlitchPost.clampAmount(getNumberParam("glitch", defaults.glitch)),
  glitchShift: AbsGlitchPost.clampUnit(getNumberParam("glitchShift", defaults.glitchShift)),
  glitchChroma: AbsGlitchPost.clampUnit(getNumberParam("glitchChroma", defaults.glitchChroma)),
  glitchBulge: AbsGlitchPost.clampUnit(getNumberParam("glitchBulge", defaults.glitchBulge)),
  glitchRate: AbsGlitchPost.clampRate(getNumberParam("glitchRate", defaults.glitchRate)),
  settingsMode: getParam("menu", defaults.settingsMode) === "DISABLE" ? "DISABLE" : "ON",
  side: getParam("side", defaults.side) === "left" ? "left" : "right"
};

let selectedColorIndex = 0;
let lastBgHex = state.bg === "transparent" ? "#000000" : state.bg;
let rainRgb = state.colors.map(hexToRgb);
let syncingColor = false;
let gradientAngle = 0;
let spinSin = 0;
let spinCos = 1;

const canvas = document.getElementById("coderain-canvas");
const ctx = canvas.getContext("2d", { alpha: true });

const motionCanvas = document.createElement("canvas");
const motionCtx = motionCanvas.getContext("2d", { alpha: true });

const glitchCanvas = document.createElement("canvas");
glitchCanvas.width = GLITCH_W;
glitchCanvas.height = GLITCH_H;
const glitchCtx = glitchCanvas.getContext("2d", { alpha: true, willReadFrequently: true });
const glitchImage = glitchCtx.createImageData(GLITCH_W, GLITCH_H);
const glitchSource = new Uint8ClampedArray(glitchImage.data.length);

const settingsMenu = document.getElementById("settings-menu");
const flipSideButton = document.getElementById("flip-side-button");
const closeSettingsButton = document.getElementById("close-menu-button");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const sizeSlider = document.getElementById("size-slider");
const sizeValue = document.getElementById("size-value");
const motionSlider = document.getElementById("motion-slider");
const motionValue = document.getElementById("motion-value");
const spinGroup = document.getElementById("gradient-rotation-group");
const spinSlider = document.getElementById("spin-slider");
const spinValue = document.getElementById("spin-value");
const dirInputs = {
  top: document.getElementById("dir-top"),
  right: document.getElementById("dir-right"),
  bottom: document.getElementById("dir-bottom"),
  left: document.getElementById("dir-left")
};
const rainSwatches = document.getElementById("rain-swatches");
const addColorButton = document.getElementById("add-color-button");
const colorPickerEl = document.getElementById("color-picker");
const colorInput = document.getElementById("color-input");
const colorResetButton = document.getElementById("color-reset-button");
const bgColorPicker = document.getElementById("bg-color-picker");
const bgHexInput = document.getElementById("bg-hex-input");
const bgTransparentButton = document.getElementById("bg-transparent-button");
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
const resetButton = document.getElementById("reset-button");
const copyUrlButton = document.getElementById("copy-url-button");
const copyUrlObsButton = document.getElementById("copy-url-obs-button");
const sectionToggles = document.querySelectorAll("[data-section-toggle]");

const streams = { top: [], right: [], bottom: [], left: [] };

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
    rainRgb = state.colors.map(hexToRgb);
    colorInput.value = state.colors[selectedColorIndex];
    renderSwatches();
    applySpinVisibility();
    updateURL();
  });
} else if (colorPickerEl) {
  colorPickerEl.hidden = true;
}

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

function sampleGradient(t) {
  const colors = rainRgb;
  const u = Math.max(0, Math.min(1, t));
  if (colors.length === 1) return colors[0];
  if (colors.length === 2) return lerpColor(colors[0], colors[1], u);
  if (u < 0.5) return lerpColor(colors[0], colors[1], u * 2);
  return lerpColor(colors[1], colors[2], (u - 0.5) * 2);
}

function updateSpinBasis() {
  spinSin = Math.sin(gradientAngle);
  spinCos = Math.cos(gradientAngle);
}

function advanceSpin(dtMs) {
  if (state.spin === 0 || rainRgb.length < 2) return;
  gradientAngle += state.spin * (dtMs / 1000) * SPIN_RAD_PER_SEC;
  const tau = Math.PI * 2;
  if (gradientAngle > tau || gradientAngle < -tau) gradientAngle %= tau;
  updateSpinBasis();
}

function sampleGradientAt(x, y) {
  if (rainRgb.length === 1) return rainRgb[0];
  const w = canvas.width;
  const h = canvas.height;
  const nx = w ? x / w - 0.5 : 0;
  const ny = h ? y / h - 0.5 : 0;
  return sampleGradient(nx * -spinSin + ny * spinCos + 0.5);
}

function applySpinVisibility() {
  spinGroup.hidden = state.colors.length < 2;
}

function randomChar() {
  return CHAR_ARRAY[(Math.random() * CHAR_ARRAY.length) | 0];
}

function spawnAlong(length) {
  return Math.random() * Math.max(1, length);
}

function ensureStream(key, count, length) {
  if (!state.dir.includes(key)) {
    streams[key] = [];
    return;
  }
  const prev = streams[key];
  if (prev.length === count) return;
  const next = new Array(count);
  for (let i = 0; i < count; i++) {
    next[i] = i < prev.length ? prev[i] : spawnAlong(length);
  }
  streams[key] = next;
}

function rebuildStreams() {
  const size = state.size;
  const cols = Math.max(1, Math.floor(canvas.width / size));
  const rows = Math.max(1, Math.floor(canvas.height / size));
  const colLen = canvas.height / size;
  const rowLen = canvas.width / size;
  ensureStream("top", cols, colLen);
  ensureStream("bottom", cols, colLen);
  ensureStream("left", rows, rowLen);
  ensureStream("right", rows, rowLen);
}

function isTransparentBg() {
  return state.bg === "transparent";
}

function fillOpaque() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = state.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (canvas.width === w && canvas.height === h) {
    rebuildStreams();
    return;
  }
  canvas.width = w;
  canvas.height = h;
  motionCanvas.width = w;
  motionCanvas.height = h;
  if (isTransparentBg()) {
    ctx.clearRect(0, 0, w, h);
  } else {
    fillOpaque();
  }
  rebuildStreams();
}

function applyTrailFade() {
  if (isTransparentBg()) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0,0,0,${FADE_ALPHA})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
    return;
  }
  const rgb = hexToRgb(state.bg);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${FADE_ALPHA})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function applyMotion() {
  if (state.motion === 0) return;
  const w = canvas.width;
  const h = canvas.height;
  motionCtx.clearRect(0, 0, w, h);
  motionCtx.drawImage(canvas, 0, 0);
  const scale = 1 + state.motion * MOTION_SCALE;
  const cx = w * 0.5;
  const cy = h * 0.5;
  if (!isTransparentBg()) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = state.bg;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
  }
  ctx.setTransform(scale, 0, 0, scale, cx * (1 - scale), cy * (1 - scale));
  ctx.drawImage(motionCanvas, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function drawStream(key, drops, step) {
  const size = state.size;
  const w = canvas.width;
  const h = canvas.height;
  const resetChance = 0.975;

  if (key === "top" || key === "bottom") {
    const down = key === "top";
    for (let i = 0; i < drops.length; i++) {
      drops[i] += down ? step : -step;
      const y = drops[i] * size;
      if (down) {
        if (y > h && Math.random() > resetChance) drops[i] = 0;
      } else if (y < 0 && Math.random() > resetChance) {
        drops[i] = h / size;
      }
      const gy = drops[i] * size;
      ctx.fillStyle = rgbCss(sampleGradientAt(i * size, gy));
      ctx.fillText(randomChar(), i * size, gy);
    }
    return;
  }

  const rightward = key === "left";
  for (let i = 0; i < drops.length; i++) {
    drops[i] += rightward ? step : -step;
    const x = drops[i] * size;
    if (rightward) {
      if (x > w && Math.random() > resetChance) drops[i] = 0;
    } else if (x < 0 && Math.random() > resetChance) {
      drops[i] = w / size;
    }
    const gx = drops[i] * size;
    ctx.fillStyle = rgbCss(sampleGradientAt(gx, i * size));
    ctx.fillText(randomChar(), gx, i * size);
  }
}

function drawGlyphs(step) {
  ctx.globalCompositeOperation = "source-over";
  ctx.font = `${state.size}px monospace`;
  ctx.textBaseline = "alphabetic";
  for (const dir of state.dir) {
    drawStream(dir, streams[dir], step);
  }
}

function applyGlitch(nowMs) {
  if (state.glitch <= 0) return;
  const w = canvas.width;
  const h = canvas.height;
  glitchCtx.clearRect(0, 0, GLITCH_W, GLITCH_H);
  glitchCtx.drawImage(canvas, 0, 0, GLITCH_W, GLITCH_H);
  const frame = glitchCtx.getImageData(0, 0, GLITCH_W, GLITCH_H);
  glitchSource.set(frame.data);
  AbsGlitchPost.applyPostProcess(nowMs, glitchSource, glitchImage.data, GLITCH_W, GLITCH_H, state, FRAME_MS);
  if (isTransparentBg()) {
    for (let i = 3; i < glitchImage.data.length; i += 4) {
      glitchImage.data[i] = glitchSource[i];
    }
  }
  glitchCtx.putImageData(glitchImage, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  if (isTransparentBg()) ctx.clearRect(0, 0, w, h);
  ctx.drawImage(glitchCanvas, 0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
}

function paint(nowMs, step) {
  applyTrailFade();
  applyMotion();
  drawGlyphs(step);
  applyGlitch(nowMs);
}

function paintStatic() {
  resize();
  if (isTransparentBg()) ctx.clearRect(0, 0, canvas.width, canvas.height);
  else fillOpaque();
  for (let i = 0; i < 48; i++) {
    applyTrailFade();
    drawGlyphs(1);
  }
  applyGlitch(0);
}

let raf = 0;
let last = 0;
let animRunning = false;

function tick(now) {
  raf = requestAnimationFrame(tick);
  if (document.hidden) return;
  if (!last) last = now;
  const dt = Math.min(50, now - last);
  last = now;
  const step = state.speed * (dt / 16.67);
  advanceSpin(dt);
  paint(now, step);
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

document.addEventListener("visibilitychange", () => {
  if (REDUCE_MOTION) return;
  if (document.hidden) stopAnimation();
  else startAnimation();
});

function updateURL() {
  params.set("color", state.colors.join(","));
  params.set("bg", state.bg);
  params.set("speed", String(state.speed));
  params.set("size", String(state.size));
  params.set("dir", state.dir.join(","));
  params.set("motion", String(state.motion));
  params.set("spin", String(state.spin));
  params.set("glitch", String(state.glitch));
  params.set("glitchShift", String(state.glitchShift));
  params.set("glitchChroma", String(state.glitchChroma));
  params.set("glitchBulge", String(state.glitchBulge));
  params.set("glitchRate", String(state.glitchRate));
  params.set("menu", state.settingsMode);
  params.set("side", state.side);
  history.replaceState({}, "", `?${params.toString()}`);
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

function syncColorPicker(hex) {
  if (!colorPicker) return;
  if (colorPicker.color.hexString.toLowerCase() === hex) return;
  syncingColor = true;
  colorPicker.color.hexString = hex;
  syncingColor = false;
}

function renderSwatches() {
  rainSwatches.replaceChildren();
  state.colors.forEach((hex, index) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "swatch";
    if (index === selectedColorIndex) swatch.classList.add("is-selected");
    swatch.style.background = hex;
    swatch.setAttribute("aria-label", `Rain color ${index + 1}`);
    swatch.addEventListener("click", () => {
      selectedColorIndex = index;
      colorInput.value = state.colors[selectedColorIndex];
      syncColorPicker(state.colors[selectedColorIndex]);
      renderSwatches();
    });
    if (index > 0) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "swatch-remove";
      remove.setAttribute("aria-label", `Remove rain color ${index + 1}`);
      remove.textContent = "×";
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        state.colors.splice(index, 1);
        rainRgb = state.colors.map(hexToRgb);
        if (selectedColorIndex >= state.colors.length) {
          selectedColorIndex = state.colors.length - 1;
        }
        colorInput.value = state.colors[selectedColorIndex];
        syncColorPicker(state.colors[selectedColorIndex]);
        renderSwatches();
        updateURL();
      });
      swatch.appendChild(remove);
    }
    rainSwatches.appendChild(swatch);
  });
  addColorButton.disabled = state.colors.length >= 3;
  applySpinVisibility();
}

function applyBgModeChange(previousBg) {
  if (previousBg === state.bg) return;
  const wasTransparent = previousBg === "transparent";
  const nowTransparent = isTransparentBg();
  if (wasTransparent === nowTransparent) return;
  if (nowTransparent) ctx.clearRect(0, 0, canvas.width, canvas.height);
  else fillOpaque();
}

function syncInputs() {
  speedSlider.value = state.speed;
  speedValue.textContent = `${state.speed.toFixed(2)}x`;
  sizeSlider.value = state.size;
  sizeValue.textContent = `${state.size}px`;
  motionSlider.value = state.motion;
  motionValue.textContent = state.motion === 0 ? "0.00" : state.motion.toFixed(2);
  spinSlider.value = state.spin;
  spinValue.textContent = state.spin === 0 ? "0.00" : state.spin.toFixed(2);
  applySpinVisibility();
  for (const dir of DIR_ORDER) {
    dirInputs[dir].checked = state.dir.includes(dir);
  }
  if (selectedColorIndex >= state.colors.length) selectedColorIndex = 0;
  colorInput.value = state.colors[selectedColorIndex];
  syncColorPicker(state.colors[selectedColorIndex]);
  renderSwatches();
  const bgHex = isTransparentBg() ? lastBgHex : state.bg;
  bgColorPicker.value = bgHex;
  bgHexInput.value = bgHex;
  bgTransparentButton.setAttribute("aria-pressed", String(isTransparentBg()));
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
}

function applyAll() {
  rainRgb = state.colors.map(hexToRgb);
  applySettingsMode();
  applySide();
  syncInputs();
  resize();
}

function resetParam(key) {
  switch (key) {
    case "speed":
      state.speed = defaults.speed;
      break;
    case "size":
      state.size = defaults.size;
      rebuildStreams();
      break;
    case "motion":
      state.motion = defaults.motion;
      break;
    case "spin":
      state.spin = defaults.spin;
      gradientAngle = 0;
      updateSpinBasis();
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
    default:
      return;
  }
  syncInputs();
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
  updateURL();
});

sizeSlider.addEventListener("input", (e) => {
  state.size = clampSize(Number.parseFloat(e.target.value));
  rebuildStreams();
  syncInputs();
  updateURL();
});

motionSlider.addEventListener("input", (e) => {
  state.motion = clampMotion(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

spinSlider.addEventListener("input", (e) => {
  state.spin = clampSpin(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

for (const dir of DIR_ORDER) {
  dirInputs[dir].addEventListener("change", () => {
    const next = DIR_ORDER.filter((name) => dirInputs[name].checked);
    state.dir = next.length ? next : ["top"];
    rebuildStreams();
    syncInputs();
    updateURL();
  });
}

addColorButton.addEventListener("click", () => {
  if (state.colors.length >= 3) return;
  state.colors.push(state.colors[state.colors.length - 1]);
  rainRgb = state.colors.map(hexToRgb);
  selectedColorIndex = state.colors.length - 1;
  colorInput.value = state.colors[selectedColorIndex];
  syncColorPicker(state.colors[selectedColorIndex]);
  renderSwatches();
  updateURL();
});

colorInput.addEventListener("input", (e) => {
  const color = normalizeHex(e.target.value.trim());
  if (!color) return;
  state.colors[selectedColorIndex] = color;
  rainRgb = state.colors.map(hexToRgb);
  syncColorPicker(color);
  renderSwatches();
  updateURL();
});

colorResetButton.addEventListener("click", () => {
  state.colors = defaults.colors.slice();
  rainRgb = state.colors.map(hexToRgb);
  selectedColorIndex = 0;
  syncInputs();
  updateURL();
});

function setBackground(nextBg) {
  const previous = state.bg;
  state.bg = nextBg;
  if (nextBg !== "transparent") lastBgHex = nextBg;
  applyBgModeChange(previous);
  syncInputs();
  updateURL();
}

bgColorPicker.addEventListener("input", (e) => {
  const color = normalizeHex(e.target.value);
  if (!color) return;
  setBackground(color);
});

bgHexInput.addEventListener("input", (e) => {
  const color = normalizeHex(e.target.value.trim());
  if (!color) return;
  setBackground(color);
});

bgTransparentButton.addEventListener("click", () => {
  if (isTransparentBg()) setBackground(lastBgHex);
  else setBackground("transparent");
});

glitchAmountSlider.addEventListener("input", (e) => {
  state.glitch = AbsGlitchPost.clampAmount(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

glitchShiftSlider.addEventListener("input", (e) => {
  state.glitchShift = AbsGlitchPost.clampUnit(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

glitchChromaSlider.addEventListener("input", (e) => {
  state.glitchChroma = AbsGlitchPost.clampUnit(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

glitchBulgeSlider.addEventListener("input", (e) => {
  state.glitchBulge = AbsGlitchPost.clampUnit(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

glitchRateSlider.addEventListener("input", (e) => {
  state.glitchRate = AbsGlitchPost.clampRate(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

for (const button of document.querySelectorAll("[data-reset]")) {
  button.addEventListener("click", () => {
    resetParam(button.getAttribute("data-reset"));
  });
}

resetButton.addEventListener("click", () => {
  const previousBg = state.bg;
  state.colors = defaults.colors.slice();
  state.bg = defaults.bg;
  lastBgHex = defaults.bg;
  state.speed = defaults.speed;
  state.size = defaults.size;
  state.dir = defaults.dir.slice();
  state.motion = defaults.motion;
  state.spin = defaults.spin;
  gradientAngle = 0;
  updateSpinBasis();
  state.glitch = defaults.glitch;
  state.glitchShift = defaults.glitchShift;
  state.glitchChroma = defaults.glitchChroma;
  state.glitchBulge = defaults.glitchBulge;
  state.glitchRate = defaults.glitchRate;
  state.side = defaults.side;
  selectedColorIndex = 0;
  applyBgModeChange(previousBg);
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

window.addEventListener("resize", resize);

applyAll();
updateURL();
updateSpinBasis();
if (REDUCE_MOTION) {
  paintStatic();
} else {
  startAnimation();
}
