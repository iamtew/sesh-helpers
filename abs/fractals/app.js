// Fractals — ABS WebGL fractal zoomer.
// Query string is the complete shareable config for meat bags and OBS.

const MAX_SIDE = 480;
const GLITCH_MAX_SIDE = 320;
const FRAME_MS = 50;
const ZOOM_RATE = 0.15;
const MAX_LOG_ZOOM = 6.5;
const MIN_LOG_ZOOM = 0;
const MAX_ITER = 96;
const FADE_OUT_MS = 280;
const FADE_IN_MS = 280;
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SET_IDS = ["mandelbrot", "julia", "burningship", "tricorn"];
const SET_INDEX = { mandelbrot: 0, julia: 1, burningship: 2, tricorn: 3 };

const WAYPOINTS = {
  mandelbrot: { cx: -0.743643887037158, cy: 0.13182590420533, baseScale: 3.0 },
  julia: { cx: 0.0, cy: 0.0, baseScale: 2.5 },
  burningship: { cx: -1.75, cy: -0.02, baseScale: 2.8 },
  tricorn: { cx: -0.5, cy: 0.0, baseScale: 3.0 }
};

const PALETTES = {
  cosmic: {
    a: [0.5, 0.5, 0.5],
    b: [0.5, 0.5, 0.5],
    c: [1.0, 1.0, 0.6],
    d: [0.0, 0.1, 0.2]
  },
  ember: {
    a: [0.5, 0.35, 0.2],
    b: [0.5, 0.4, 0.3],
    c: [1.0, 0.7, 0.4],
    d: [0.0, 0.15, 0.2]
  },
  aurora: {
    a: [0.5, 0.5, 0.5],
    b: [0.5, 0.5, 0.5],
    c: [1.0, 1.0, 0.5],
    d: [0.3, 0.2, 0.2]
  },
  neon: {
    a: [0.5, 0.5, 0.5],
    b: [0.5, 0.5, 0.5],
    c: [1.0, 1.0, 1.0],
    d: [0.0, 0.33, 0.67]
  },
  ocean: {
    a: [0.5, 0.5, 0.5],
    b: [0.5, 0.5, 0.5],
    c: [1.0, 0.7, 0.4],
    d: [0.0, 0.15, 0.2]
  },
  plasma: {
    a: [0.5, 0.5, 0.5],
    b: [0.5, 0.5, 0.5],
    c: [1.0, 2.0, 3.0],
    d: [0.0, 0.33, 0.67]
  }
};

const PALETTE_IDS = new Set(Object.keys(PALETTES));
const SET_PARAM_IDS = new Set(SET_IDS);

const VERT_SRC = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_scale;
uniform int u_set;
uniform vec3 u_palA;
uniform vec3 u_palB;
uniform vec3 u_palC;
uniform vec3 u_palD;

const vec2 JULIA_C = vec2(-0.8, 0.156);
const float MAX_ITER = ${MAX_ITER}.0;

vec3 cosinePalette(float t) {
  return u_palA + u_palB * cos(6.28318 * (u_palC * t + u_palD));
}

float escapeIter(vec2 z, vec2 c, int mode) {
  float iter = 0.0;
  for (int i = 0; i < ${MAX_ITER}; i++) {
    if (dot(z, z) > 4.0) break;
    if (mode == 2) {
      z = vec2(abs(z.x), abs(z.y));
      z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    } else if (mode == 3) {
      z = vec2(z.x * z.x - z.y * z.y, -2.0 * z.x * z.y) + c;
    } else {
      z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    }
    iter += 1.0;
  }
  if (iter >= MAX_ITER - 0.5) return -1.0;
  float z2 = max(dot(z, z), 1.0001);
  return iter + 1.0 - log(log(z2)) / log(2.0);
}

float sampleFractal(vec2 p) {
  if (u_set == 1) return escapeIter(p, JULIA_C, 1);
  if (u_set == 2) return escapeIter(vec2(0.0), p, 2);
  if (u_set == 3) return escapeIter(vec2(0.0), p, 3);
  return escapeIter(vec2(0.0), p, 0);
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = (v_uv - 0.5) * vec2(aspect, 1.0) * u_scale + u_center;
  float sm = sampleFractal(p);
  if (sm < 0.0) {
    gl_FragColor = vec4(0.02, 0.02, 0.05, 1.0);
  } else {
    float t = sm / MAX_ITER;
    vec3 col = cosinePalette(t * 4.0 + 0.05);
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

const defaults = {
  set: "mandelbrot",
  speed: 1,
  palette: "cosmic",
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

function normalizeSet(value) {
  const id = String(value ?? "").toLowerCase();
  return SET_PARAM_IDS.has(id) ? id : defaults.set;
}

function normalizePalette(value) {
  const id = String(value ?? "").toLowerCase();
  return PALETTE_IDS.has(id) ? id : defaults.palette;
}

function clampSpeed(value) {
  return Math.min(5, Math.max(-5, value));
}

function clampVignetteStrength(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

let state = {
  set: normalizeSet(getParam("set", defaults.set)),
  speed: clampSpeed(getNumberParam("speed", defaults.speed)),
  palette: normalizePalette(getParam("palette", defaults.palette)),
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

const displayCanvas = document.getElementById("fractals-canvas");
const displayCtx = displayCanvas.getContext("2d", { alpha: false });

const webglCanvas = document.createElement("canvas");
const glitchCanvas = document.createElement("canvas");
const glitchCtx = glitchCanvas.getContext("2d", { alpha: false, willReadFrequently: true });

let gl = null;
let glProgram = null;
let glBuf = null;
let glUniforms = {};
let glitchData = null;

let logZoom = 0;
let lastAnimAt = 0;
let lastFrame = 0;
let fadeAlpha = 0;
let fadePhase = null;
let fadeStart = 0;

let displayW = 0;
let displayH = 0;
let renderW = 0;
let renderH = 0;

const vignetteEl = document.getElementById("vignette");
const settingsMenu = document.getElementById("settings-menu");
const flipSideButton = document.getElementById("flip-side-button");
const closeSettingsButton = document.getElementById("close-menu-button");
const sectionToggles = document.querySelectorAll("[data-section-toggle]");
const setSelect = document.getElementById("set-select");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
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

let raf = 0;
let animRunning = false;

function compileShader(type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initWebGL() {
  gl = webglCanvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power"
  });
  if (!gl) return false;

  const vs = compileShader(gl.VERTEX_SHADER, VERT_SRC);
  const fs = compileShader(gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vs || !fs) return false;

  glProgram = gl.createProgram();
  gl.attachShader(glProgram, vs);
  gl.attachShader(glProgram, fs);
  gl.linkProgram(glProgram);
  if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(glProgram));
    return false;
  }

  gl.useProgram(glProgram);
  glBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, glBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(glProgram, "a_pos");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  glUniforms = {
    resolution: gl.getUniformLocation(glProgram, "u_resolution"),
    center: gl.getUniformLocation(glProgram, "u_center"),
    scale: gl.getUniformLocation(glProgram, "u_scale"),
    set: gl.getUniformLocation(glProgram, "u_set"),
    palA: gl.getUniformLocation(glProgram, "u_palA"),
    palB: gl.getUniformLocation(glProgram, "u_palB"),
    palC: gl.getUniformLocation(glProgram, "u_palC"),
    palD: gl.getUniformLocation(glProgram, "u_palD")
  };

  return true;
}

webglCanvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  stopAnimation();
});
webglCanvas.addEventListener("webglcontextrestored", () => {
  if (initWebGL()) {
    applyAll();
    if (!REDUCE_MOTION) startAnimation();
  }
});

function computeRenderSize() {
  const aspect = window.innerWidth / Math.max(1, window.innerHeight);
  let w;
  let h;
  if (aspect >= 1) {
    w = MAX_SIDE;
    h = Math.max(1, Math.round(MAX_SIDE / aspect));
  } else {
    h = MAX_SIDE;
    w = Math.max(1, Math.round(MAX_SIDE * aspect));
  }
  return { w, h };
}

function resize() {
  displayW = Math.max(1, Math.floor(window.innerWidth));
  displayH = Math.max(1, Math.floor(window.innerHeight));
  displayCanvas.width = displayW;
  displayCanvas.height = displayH;

  const render = computeRenderSize();
  renderW = render.w;
  renderH = render.h;
  webglCanvas.width = renderW;
  webglCanvas.height = renderH;
  if (gl) gl.viewport(0, 0, renderW, renderH);
}

function resetZoom() {
  logZoom = MIN_LOG_ZOOM;
}

function startResetFade(now) {
  if (REDUCE_MOTION) {
    resetZoom();
    return;
  }
  fadePhase = "out";
  fadeStart = now;
  fadeAlpha = 0;
}

function updateResetFade(now) {
  if (!fadePhase) return;

  const elapsed = now - fadeStart;
  if (fadePhase === "out") {
    fadeAlpha = Math.min(1, elapsed / FADE_OUT_MS);
    if (fadeAlpha >= 1) {
      resetZoom();
      fadePhase = "in";
      fadeStart = now;
    }
    return;
  }

  fadeAlpha = 1 - Math.min(1, elapsed / FADE_IN_MS);
  if (fadeAlpha <= 0) {
    fadeAlpha = 0;
    fadePhase = null;
  }
}

function isZoomPaused() {
  return fadePhase === "out" || fadePhase === "in";
}

function currentScale() {
  const wp = WAYPOINTS[state.set];
  return wp.baseScale * Math.pow(2, -logZoom);
}

function renderWebGL() {
  if (!gl || !glProgram) return false;
  const wp = WAYPOINTS[state.set];
  const pal = PALETTES[state.palette];
  const setIdx = SET_INDEX[state.set];
  if (!wp || setIdx === undefined) return false;

  gl.useProgram(glProgram);
  gl.uniform2f(glUniforms.resolution, renderW, renderH);
  gl.uniform2f(glUniforms.center, wp.cx, wp.cy);
  gl.uniform1f(glUniforms.scale, currentScale());
  gl.uniform1i(glUniforms.set, setIdx);
  gl.uniform3fv(glUniforms.palA, pal.a);
  gl.uniform3fv(glUniforms.palB, pal.b);
  gl.uniform3fv(glUniforms.palC, pal.c);
  gl.uniform3fv(glUniforms.palD, pal.d);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  return true;
}

function blitToDisplay(now) {
  displayCtx.imageSmoothingEnabled = true;
  if (state.glitch <= 0) {
    displayCtx.drawImage(webglCanvas, 0, 0, displayW, displayH);
  } else {
    const aspect = renderW / renderH;
    let gw = GLITCH_MAX_SIDE;
    let gh = Math.max(1, Math.round(gw / aspect));
    if (gh > GLITCH_MAX_SIDE) {
      gh = GLITCH_MAX_SIDE;
      gw = Math.max(1, Math.round(gh * aspect));
    }
    if (glitchCanvas.width !== gw || glitchCanvas.height !== gh) {
      glitchCanvas.width = gw;
      glitchCanvas.height = gh;
      glitchData = glitchCtx.createImageData(gw, gh);
    }
    glitchCtx.drawImage(webglCanvas, 0, 0, gw, gh);
    const src = glitchCtx.getImageData(0, 0, gw, gh).data;
    AbsGlitchPost.applyPostProcess(now, src, glitchData.data, gw, gh, state, FRAME_MS);
    glitchCtx.putImageData(glitchData, 0, 0);
    displayCtx.drawImage(glitchCanvas, 0, 0, displayW, displayH);
  }

  if (fadeAlpha > 0) {
    displayCtx.fillStyle = `rgba(2, 2, 5, ${fadeAlpha})`;
    displayCtx.fillRect(0, 0, displayW, displayH);
  }
}

function updateZoom(now) {
  if (REDUCE_MOTION || state.speed === 0 || isZoomPaused()) return;

  if (lastAnimAt > 0) {
    const dt = (now - lastAnimAt) * 0.001;
    logZoom += state.speed * dt * ZOOM_RATE;

    if (logZoom >= MAX_LOG_ZOOM) {
      logZoom = MAX_LOG_ZOOM;
      startResetFade(now);
    } else if (logZoom <= MIN_LOG_ZOOM && state.speed < 0) {
      logZoom = MIN_LOG_ZOOM;
      startResetFade(now);
    }
  }
}

function paint(now) {
  updateResetFade(now);
  updateZoom(now);
  if (!renderWebGL()) return;
  blitToDisplay(now);
  lastAnimAt = now;
}

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
  lastAnimAt = 0;
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

window.addEventListener("resize", () => {
  resize();
  repaintNow();
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
  params.set("set", state.set);
  params.set("speed", String(state.speed));
  params.set("palette", state.palette);
  params.set("glitch", String(state.glitch));
  params.set("glitchShift", String(state.glitchShift));
  params.set("glitchChroma", String(state.glitchChroma));
  params.set("glitchBulge", String(state.glitchBulge));
  params.set("glitchRate", String(state.glitchRate));
  params.set("vignette", String(state.vignette));
  params.set("vignetteStrength", String(state.vignetteStrength));
  params.set("menu", state.settingsMode);
  params.set("side", state.side);
  params.delete("cycleTime");
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

function formatSpeed(value) {
  if (value === 0) return "0";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}`;
}

function syncInputs() {
  setSelect.value = state.set;
  speedSlider.value = state.speed;
  speedValue.textContent = formatSpeed(state.speed);
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
  fadePhase = null;
  fadeAlpha = 0;
  resetZoom();
  repaintNow();
}

function resetParam(key) {
  switch (key) {
    case "speed":
      state.speed = defaults.speed;
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

setSelect.addEventListener("change", (e) => {
  state.set = normalizeSet(e.target.value);
  fadePhase = null;
  fadeAlpha = 0;
  resetZoom();
  syncInputs();
  repaintNow();
  updateURL();
});

speedSlider.addEventListener("input", (e) => {
  state.speed = clampSpeed(Number.parseFloat(e.target.value));
  syncInputs();
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
  state.set = defaults.set;
  state.speed = defaults.speed;
  state.palette = defaults.palette;
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

resize();
if (!initWebGL()) {
  displayCtx.fillStyle = "#06060a";
  displayCtx.fillRect(0, 0, displayW, displayH);
  displayCtx.fillStyle = "#f40";
  displayCtx.font = "16px monospace";
  displayCtx.fillText("WebGL not available", 20, 40);
} else {
  applyAll();
  updateURL();
  if (!REDUCE_MOTION) startAnimation();
}
