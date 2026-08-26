// Voroni — ABS Voronoi pulse field backdrop.
// Query string is the complete shareable config for meat bags and OBS.

const CELL_SIZE = 10;
const RIPPLE_BASE_DURATION_MS = 1400;
const RIPPLE_BAND = 5.5;
const RIPPLE_EDGE_WIDTH = 1.8;

const PALETTE_HEX = {
  blue: "40b0ff",
  pink: "ff4081",
  mint: "40ff90",
  gold: "ffd040",
  red: "ff4040",
  electric: "8a2be2",
  bubblegum: "ff6ec7",
  aqua: "00e5ff",
  amber: "ffb300",
  cyber: "00ff95",
  inferno: "ff3d00",
  toxic: "9dff00",
  plasma: "ff00e6",
  royal: "3d5afe",
  pastel: "ffd6e0",
  lavender: "b388ff",
  teal: "00ffc8",
  peach: "ff9e80",
  volt: "c6ff00",
  hyper: "ff1744"
};

const PALETTE_IDS = new Set(["procedural", ...Object.keys(PALETTE_HEX)]);

const LEGACY_HEX_TO_PALETTE = Object.fromEntries(
  Object.entries(PALETTE_HEX).map(([id, hex]) => [`#${hex.toLowerCase()}`, id])
);

const FRAME_MS = 50;
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const defaults = {
  palette: "blue",
  speed: 4,
  rippleInterval: 8,
  rippleSpeed: 1,
  rippleWarp: 0,
  density: 220,
  ...AbsGlitchPost.defaults,
  vignette: false,
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

function normalizePaletteFromParams() {
  const paletteParam = getParam("palette", null);
  if (paletteParam === "procedural") return "procedural";

  const paletteId = String(paletteParam ?? "").toLowerCase();
  if (PALETTE_IDS.has(paletteId)) return paletteId;

  const colorParam = getParam("color", null);
  if (colorParam) {
    const normalized = colorParam.startsWith("#") ? colorParam.toLowerCase() : `#${colorParam.toLowerCase()}`;
    if (LEGACY_HEX_TO_PALETTE[normalized]) return LEGACY_HEX_TO_PALETTE[normalized];
  }

  return defaults.palette;
}

function normalizePalette(value) {
  const id = String(value ?? "").toLowerCase();
  return PALETTE_IDS.has(id) ? id : defaults.palette;
}

function clampSpeed(value) {
  return Math.min(10, Math.max(0, value));
}

function clampRippleInterval(value) {
  return Math.min(30, Math.max(0, value));
}

function clampRippleSpeed(value) {
  return Math.min(4, Math.max(0.25, value));
}

function clampRippleWarp(value) {
  return Math.min(1, Math.max(0, value));
}

function getRippleIntervalFromParams() {
  if (params.has("rippleInterval")) {
    return clampRippleInterval(getNumberParam("rippleInterval", defaults.rippleInterval));
  }
  if (params.has("ripple")) {
    const legacy = Number.parseFloat(getParam("ripple", "0"));
    if (!Number.isFinite(legacy) || legacy <= 0) return 0;
    return clampRippleInterval(2 + (1 - Math.min(1, legacy)) * 18);
  }
  return defaults.rippleInterval;
}

function clampDensity(value) {
  return Math.min(800, Math.max(20, Math.round(value)));
}

function clampVignetteStrength(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

let state = {
  palette: normalizePaletteFromParams(),
  speed: clampSpeed(getNumberParam("speed", defaults.speed)),
  rippleInterval: getRippleIntervalFromParams(),
  rippleSpeed: clampRippleSpeed(getNumberParam("rippleSpeed", defaults.rippleSpeed)),
  rippleWarp: clampRippleWarp(getNumberParam("rippleWarp", defaults.rippleWarp)),
  density: clampDensity(getNumberParam("density", defaults.density)),
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

const canvas = document.getElementById("voroni-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

let cols = 0;
let rows = 0;
let image = null;
let data = null;
let sourceData = null;
let points = [];
let pointCount = 0;
let staticBaseHsl = { h: 0.58, s: 0.75, l: 0.55 };

const rippleBurst = {
  active: false,
  start: 0,
  originX: 0,
  originY: 0,
  maxRadius: 0,
  warpAngle: 0,
  warpPhase: 0
};

let nextRippleAt = 0;

const vignetteEl = document.getElementById("vignette");
const settingsMenu = document.getElementById("settings-menu");
const flipSideButton = document.getElementById("flip-side-button");
const closeSettingsButton = document.getElementById("close-menu-button");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const rippleIntervalSlider = document.getElementById("ripple-interval-slider");
const rippleIntervalValue = document.getElementById("ripple-interval-value");
const rippleSpeedSlider = document.getElementById("ripple-speed-slider");
const rippleSpeedValue = document.getElementById("ripple-speed-value");
const rippleWarpSlider = document.getElementById("ripple-warp-slider");
const rippleWarpValue = document.getElementById("ripple-warp-value");
const densitySlider = document.getElementById("density-slider");
const densityValue = document.getElementById("density-value");
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

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rand() {
  return Math.random();
}

function parseColor(hex, fallback) {
  if (!hex) return fallback;
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return fallback;
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
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
    h /= 6;
  }
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

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
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  };
}

function updateStaticBaseHsl() {
  if (state.palette === "procedural") return;
  const hex = PALETTE_HEX[state.palette];
  const rgb = parseColor(hex, { r: 64, g: 176, b: 255 });
  staticBaseHsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
}

function rebuildPoints(density) {
  points = new Array(density);
  for (let i = 0; i < density; i++) {
    points[i] = {
      x: rand() * cols,
      y: rand() * rows,
      phase: rand() * Math.PI * 2,
      driftX: (rand() - 0.5) * 0.03,
      driftY: (rand() - 0.5) * 0.03
    };
  }
  pointCount = density;
}

function resizeGrid() {
  const newCols = Math.max(1, Math.ceil(window.innerWidth / CELL_SIZE));
  const newRows = Math.max(1, Math.ceil(window.innerHeight / CELL_SIZE));

  if (newCols !== cols || newRows !== rows) {
    if (cols > 0 && rows > 0) {
      const scaleX = newCols / cols;
      const scaleY = newRows / rows;
      for (let i = 0; i < pointCount; i++) {
        const p = points[i];
        p.x *= scaleX;
        p.y *= scaleY;
      }
    }
    cols = newCols;
    rows = newRows;
    canvas.width = cols;
    canvas.height = rows;
    image = ctx.createImageData(cols, rows);
    data = image.data;
    sourceData = new Uint8ClampedArray(data.length);
  }
}

function ensurePointCount() {
  if (pointCount !== state.density) {
    rebuildPoints(state.density);
  }
}

function getBaseHsl(now) {
  if (state.palette === "procedural") {
    return {
      h: Math.sin(now * 0.0001) * 0.5 + 0.5,
      s: 0.75,
      l: 0.55
    };
  }
  return staticBaseHsl;
}

function scheduleNextRipple(fromNow = performance.now()) {
  if (state.rippleInterval <= 0) {
    nextRippleAt = Infinity;
    return;
  }
  nextRippleAt = fromNow + state.rippleInterval * 1000;
}

function triggerRippleBurst(now) {
  rippleBurst.active = true;
  rippleBurst.start = now;
  rippleBurst.originX = rand() * cols;
  rippleBurst.originY = rand() * rows;
  rippleBurst.warpAngle = rand() * Math.PI * 2;
  rippleBurst.warpPhase = rand() * Math.PI * 2;
  rippleBurst.maxRadius = Math.hypot(cols, rows) * (1.15 + state.rippleWarp * 0.4);
}

function rippleWarpDistance(x, y) {
  const dx = x - rippleBurst.originX;
  const dy = y - rippleBurst.originY;
  const baseR = Math.hypot(dx, dy);
  const warp = state.rippleWarp;
  if (warp <= 0) return baseR;

  const angle = Math.atan2(dy, dx);
  const aspect = 1 + warp * 0.7;
  const cosA = Math.cos(angle - rippleBurst.warpAngle);
  const sinA = Math.sin(angle - rippleBurst.warpAngle);
  const ellR = Math.hypot(cosA * aspect, sinA / aspect) * baseR;
  const lobe = 1 + warp * 0.42 * (
    Math.sin(angle * 3 + rippleBurst.warpPhase) * 0.55 +
    Math.sin(angle * 5 - rippleBurst.warpPhase * 1.3) * 0.45
  );

  return ellR * lobe;
}

function rippleBand(distFromOrigin, radius, width) {
  return Math.max(0, 1 - Math.abs(distFromOrigin - radius) / width);
}

function computeEdgeRipple(x, y, bestDist, secondDist, rippleRadius, envelope) {
  if (envelope <= 0 || rippleRadius <= 0 || secondDist <= bestDist) return 0;

  const d1 = Math.sqrt(bestDist);
  const d2 = Math.sqrt(secondDist);
  const edgeDist = d2 - d1;
  const edgeMask = Math.max(0, 1 - edgeDist / RIPPLE_EDGE_WIDTH);
  const edgeSharp = edgeMask * edgeMask;

  const distFromOrigin = rippleWarpDistance(x, y);
  const band = RIPPLE_BAND;

  const mainRing = rippleBand(distFromOrigin, rippleRadius, band);
  const echoRing = rippleBand(distFromOrigin, rippleRadius - band * 1.75, band * 0.7) * 0.42;
  const leadRing = rippleBand(distFromOrigin, rippleRadius + band * 0.55, band * 0.45) * 0.18;
  const ripple = Math.min(1, mainRing * mainRing + echoRing + leadRing);

  return edgeSharp * ripple * envelope;
}

function paint(now) {
  if (!data || pointCount === 0) return;

  const speedFactor = 0.5 + state.speed / 10;
  const baseHSL = getBaseHsl(now);
  const globalPhase = now * 0.0003 * speedFactor;
  const minDim = Math.min(cols, rows);

  if (!REDUCE_MOTION && state.rippleInterval > 0 && !rippleBurst.active && now >= nextRippleAt) {
    triggerRippleBurst(now);
    scheduleNextRipple(now);
  }

  let rippleRadius = 0;
  let rippleEnvelope = 0;
  if (rippleBurst.active) {
    const burstDuration = RIPPLE_BASE_DURATION_MS / state.rippleSpeed;
    const t = (now - rippleBurst.start) / burstDuration;
    if (t >= 1) {
      rippleBurst.active = false;
    } else {
      rippleEnvelope = 1 - t * t;
      rippleRadius = t * rippleBurst.maxRadius;
    }
  }

  if (!REDUCE_MOTION) {
    for (let i = 0; i < pointCount; i++) {
      const p = points[i];
      p.x += p.driftX * speedFactor;
      p.y += p.driftY * speedFactor;

      if (p.x < -2) p.x = cols + 2;
      if (p.x > cols + 2) p.x = -2;
      if (p.y < -2) p.y = rows + 2;
      if (p.y > rows + 2) p.y = -2;
    }
  }

  for (let gy = 0; gy < rows; gy++) {
    const y = gy + 0.5;
    for (let gx = 0; gx < cols; gx++) {
      const x = gx + 0.5;

      let bestIdx = -1;
      let secondIdx = -1;
      let bestDist = Infinity;
      let secondDist = Infinity;

      for (let i = 0; i < pointCount; i++) {
        const p = points[i];
        const dx = x - p.x;
        const dy = y - p.y;
        const d2 = dx * dx + dy * dy;

        if (d2 < bestDist) {
          secondDist = bestDist;
          secondIdx = bestIdx;
          bestDist = d2;
          bestIdx = i;
        } else if (d2 < secondDist) {
          secondDist = d2;
          secondIdx = i;
        }
      }

      const p = points[bestIdx];
      const pulsePhase = p.phase + now * 0.0015 * speedFactor;
      const pulse = 0.5 + 0.5 * Math.sin(pulsePhase);
      const wave = 0.5 + 0.5 * Math.sin(globalPhase + (x / cols) * 3.0 + (y / rows) * 2.0);
      const distNorm = Math.min(1, Math.sqrt(bestDist) / (minDim * 0.35));
      const softness = 1 - distNorm;

      let brightness = lerp(0.05, 0.6, pulse * 0.5 + wave * 0.3 + softness * 0.2);

      const hueOffset = (globalPhase * 0.15 + p.phase * 0.05) % (Math.PI * 2);
      let hVal = (baseHSL.h + (hueOffset / (Math.PI * 2)) * 0.25) % 1;
      let sVal = lerp(baseHSL.s, 1.0, 0.4);
      let lVal = brightness;

      if (rippleEnvelope > 0 && secondIdx >= 0) {
        const rippleAmt = computeEdgeRipple(
          x, y, bestDist, secondDist, rippleRadius, rippleEnvelope
        );

        if (rippleAmt > 0.01) {
          const accentH = 0.48;
          hVal = (hVal * (1 - rippleAmt * 0.55) + accentH * rippleAmt * 0.55) % 1;
          sVal = Math.min(1, sVal + rippleAmt * 0.45);
          lVal = Math.min(0.92, lVal + rippleAmt * 0.62);
        }
      }

      const rgb = hslToRgb(hVal, sVal, lVal);
      const idx = (gy * cols + gx) * 4;
      sourceData[idx] = rgb.r;
      sourceData[idx + 1] = rgb.g;
      sourceData[idx + 2] = rgb.b;
      sourceData[idx + 3] = 255;
    }
  }

  AbsGlitchPost.applyPostProcess(now, sourceData, data, cols, rows, state, FRAME_MS);
  ctx.putImageData(image, 0, 0);
}

let raf = 0;
let lastFrame = 0;
let animRunning = false;

function tick(now) {
  raf = requestAnimationFrame(tick);
  if (document.hidden) return;
  if (now - lastFrame < FRAME_MS) return;

  lastFrame = now;
  paint(now);
}

function startAnimation() {
  if (REDUCE_MOTION || animRunning) return;
  animRunning = true;
  lastFrame = 0;
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
  params.set("rippleInterval", String(state.rippleInterval));
  params.set("rippleSpeed", String(state.rippleSpeed));
  params.set("rippleWarp", String(state.rippleWarp));
  params.set("density", String(state.density));
  params.set("glitch", String(state.glitch));
  params.set("glitchShift", String(state.glitchShift));
  params.set("glitchChroma", String(state.glitchChroma));
  params.set("glitchBulge", String(state.glitchBulge));
  params.set("glitchRate", String(state.glitchRate));
  params.set("vignette", String(state.vignette));
  params.set("vignetteStrength", String(state.vignetteStrength));
  params.set("menu", state.settingsMode);
  params.set("side", state.side);
  params.delete("color");
  params.delete("ripple");
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

function formatRippleInterval(seconds) {
  return seconds <= 0 ? "Off" : `${seconds.toFixed(1)}s`;
}

function syncInputs() {
  densitySlider.value = state.density;
  densityValue.textContent = String(state.density);
  speedSlider.value = state.speed;
  speedValue.textContent = state.speed.toFixed(1);
  rippleIntervalSlider.value = state.rippleInterval;
  rippleIntervalValue.textContent = formatRippleInterval(state.rippleInterval);
  rippleSpeedSlider.value = state.rippleSpeed;
  rippleSpeedValue.textContent = `${state.rippleSpeed.toFixed(2)}x`;
  rippleWarpSlider.value = state.rippleWarp;
  rippleWarpValue.textContent = AbsGlitchPost.formatPercent(state.rippleWarp);
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
  updateStaticBaseHsl();
  resizeGrid();
  ensurePointCount();
  applySettingsMode();
  applySide();
  syncInputs();
  scheduleNextRipple();
  repaintNow();
}

function resetParam(key) {
  switch (key) {
    case "speed":
      state.speed = defaults.speed;
      break;
    case "rippleInterval":
      state.rippleInterval = defaults.rippleInterval;
      if (!rippleBurst.active) scheduleNextRipple();
      break;
    case "rippleSpeed":
      state.rippleSpeed = defaults.rippleSpeed;
      break;
    case "rippleWarp":
      state.rippleWarp = defaults.rippleWarp;
      break;
    case "density":
      state.density = defaults.density;
      rebuildPoints(state.density);
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
  if (key !== "vignetteStrength") repaintNow();
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

rippleIntervalSlider.addEventListener("input", (e) => {
  state.rippleInterval = clampRippleInterval(Number.parseFloat(e.target.value));
  syncInputs();
  if (!rippleBurst.active) scheduleNextRipple();
  updateURL();
});

rippleSpeedSlider.addEventListener("input", (e) => {
  state.rippleSpeed = clampRippleSpeed(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

rippleWarpSlider.addEventListener("input", (e) => {
  state.rippleWarp = clampRippleWarp(Number.parseFloat(e.target.value));
  syncInputs();
  repaintNow();
  updateURL();
});

densitySlider.addEventListener("input", (e) => {
  state.density = clampDensity(Number.parseFloat(e.target.value));
  rebuildPoints(state.density);
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
  updateStaticBaseHsl();
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
  state.rippleInterval = defaults.rippleInterval;
  state.rippleSpeed = defaults.rippleSpeed;
  state.rippleWarp = defaults.rippleWarp;
  state.density = defaults.density;
  state.glitch = defaults.glitch;
  state.glitchShift = defaults.glitchShift;
  state.glitchChroma = defaults.glitchChroma;
  state.glitchBulge = defaults.glitchBulge;
  state.glitchRate = defaults.glitchRate;
  state.vignette = defaults.vignette;
  state.vignetteStrength = defaults.vignetteStrength;
  state.side = defaults.side;
  rippleBurst.active = false;
  scheduleNextRipple();
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
