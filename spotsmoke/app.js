// --- CONFIG ---------------------------------------------------------

const BG_NONE = "0";
const BG_SESSION = "1";
const BG_LINEAR = "2";
const BG_RADIAL = "3";
const BG_VALUES = new Set([BG_NONE, BG_SESSION, BG_LINEAR, BG_RADIAL]);

const defaults = {
  spotX: 50, // percent of viewport width
  spotY: 70, // percent of viewport height
  duration: 6, // seconds smoke keeps spawning
  intensity: 5, // 1-10
  lifetime: 4, // seconds per particle, capped at duration
  color: "#d8d8d8",
  size: 1,
  width: 60, // px horizontal spread
  turbulence: 30, // 0-100
  pixelationEnabled: false,
  pixelCellSize: 8,
  glitchEnabled: false,
  glitchIntensity: 0,
  glitchFrequency: 2,
  glitchFringe: 0,
  bg: BG_NONE,
  checkerboardEnabled: false,
  settingsMode: "ON",
  side: "right" // which screen edge the settings controls live on
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

function normalizeBg(value) {
  const bg = String(value ?? "");
  return BG_VALUES.has(bg) ? bg : defaults.bg;
}

let state = {
  spotX: parseFloat(getParam("spotX", defaults.spotX)),
  spotY: parseFloat(getParam("spotY", defaults.spotY)),
  duration: parseFloat(getParam("duration", defaults.duration)),
  intensity: parseFloat(getParam("intensity", defaults.intensity)),
  lifetime: parseFloat(getParam("lifetime", defaults.lifetime)),
  color: getParam("color", defaults.color),
  size: parseFloat(getParam("size", defaults.size)),
  width: parseFloat(getParam("width", defaults.width)),
  turbulence: parseFloat(getParam("turbulence", defaults.turbulence)),
  pixelationEnabled: getBooleanParam("pixelation", defaults.pixelationEnabled),
  pixelCellSize: getNumberParam("pixelSize", defaults.pixelCellSize),
  glitchEnabled: getBooleanParam("glitch", defaults.glitchEnabled),
  glitchIntensity: getNumberParam("glitchIntensity", defaults.glitchIntensity),
  glitchFrequency: getNumberParam("glitchFrequency", defaults.glitchFrequency),
  glitchFringe: getNumberParam("glitchFringe", defaults.glitchFringe),
  bg: normalizeBg(getParam("bg", defaults.bg)),
  checkerboardEnabled: getBooleanParam("checkerboard", defaults.checkerboardEnabled),
  settingsMode: getParam("menu", defaults.settingsMode) === "DISABLE" ? "DISABLE" : "ON",
  side: getParam("side", defaults.side) === "left" ? "left" : "right"
};

state.lifetime = Math.min(state.lifetime, state.duration);

// --- DOM --------------------------------------------------------------

const smokeCanvas = document.getElementById("smoke-canvas");
const smokeCtx = smokeCanvas.getContext("2d");
const overlayCanvas = document.getElementById("overlay-canvas");
const overlayCtx = overlayCanvas.getContext("2d");
const pixelCanvas = document.createElement("canvas");
const pixelCtx = pixelCanvas.getContext("2d");

const settingsMenu = document.getElementById("settings-menu");
const demoBackdrop = document.getElementById("demo-backdrop");
const helpButton = document.getElementById("help-button");
const checkerboardButton = document.getElementById("checkerboard-button");
const flipSideButton = document.getElementById("flip-side-button");
const closeSettingsButton = document.getElementById("close-menu-button");
const helpOverlay = document.getElementById("help-overlay");
const helpCloseButton = document.getElementById("help-close-button");

const durationSlider = document.getElementById("duration-slider");
const durationValue = document.getElementById("duration-value");
const intensitySlider = document.getElementById("intensity-slider");
const intensityValue = document.getElementById("intensity-value");
const lifetimeSlider = document.getElementById("lifetime-slider");
const lifetimeValue = document.getElementById("lifetime-value");
const sectionToggles = document.querySelectorAll("[data-section-toggle]");
const colorPickerEl = document.getElementById("color-picker");
const colorInput = document.getElementById("color-input");
const colorResetButton = document.getElementById("color-reset-button");
const sizeSlider = document.getElementById("size-slider");
const sizeValue = document.getElementById("size-value");
const widthSlider = document.getElementById("width-slider");
const widthValue = document.getElementById("width-value");
const turbulenceSlider = document.getElementById("turbulence-slider");
const turbulenceValue = document.getElementById("turbulence-value");
const pixelationToggle = document.getElementById("pixelation-toggle");
const pixelCellSizeSlider = document.getElementById("pixel-cell-size-slider");
const pixelCellSizeValue = document.getElementById("pixel-cell-size-value");
const glitchToggle = document.getElementById("glitch-toggle");
const glitchIntensitySlider = document.getElementById("glitch-intensity-slider");
const glitchIntensityValue = document.getElementById("glitch-intensity-value");
const glitchFrequencySlider = document.getElementById("glitch-frequency-slider");
const glitchFrequencyValue = document.getElementById("glitch-frequency-value");
const glitchFringeSlider = document.getElementById("glitch-fringe-slider");
const glitchFringeValue = document.getElementById("glitch-fringe-value");
const bgRadios = document.querySelectorAll('input[name="bg"]');
const testButton = document.getElementById("test-button");
const resetButton = document.getElementById("reset-button");
const copyUrlButton = document.getElementById("copy-url-button");
const copyUrlObsButton = document.getElementById("copy-url-obs-button");

/** Brief filled flash for footer actions — OBS Interact needs a clear click signal. */
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

function closeHelpOverlay() {
  helpOverlay.hidden = true;
  helpOverlay.classList.remove("zoomed");
  helpButton.focus();
}

helpButton.addEventListener("click", () => {
  helpOverlay.hidden = false;
});

helpCloseButton.addEventListener("click", closeHelpOverlay);

helpOverlay.addEventListener("click", event => {
  if (event.target === helpCloseButton) return;
  helpOverlay.classList.toggle("zoomed");
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !helpOverlay.hidden) closeHelpOverlay();
});

function applyCheckerboard() {
  document.body.classList.toggle("checkerboard-enabled", state.checkerboardEnabled);
  checkerboardButton.setAttribute("aria-pressed", String(state.checkerboardEnabled));
  checkerboardButton.textContent = state.checkerboardEnabled ? "▞" : "▚";
}

function setOpenSection(section) {
  for (const toggle of sectionToggles) {
    const panel = document.getElementById(toggle.getAttribute("aria-controls"));
    const isOpen = toggle.closest("[data-section]") === section;
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.querySelector(".section-toggle-icon").textContent = isOpen ? "⏷" : "⏵";
    panel.hidden = !isOpen;
  }
}

function syncEffectsEnabled() {
  pixelationToggle.checked = state.pixelationEnabled;
  pixelCellSizeSlider.disabled = !state.pixelationEnabled;
  glitchToggle.checked = state.glitchEnabled;
  glitchIntensitySlider.disabled = !state.glitchEnabled;
  glitchFrequencySlider.disabled = !state.glitchEnabled;
  glitchFringeSlider.disabled = !state.glitchEnabled;
}

for (const toggle of sectionToggles) {
  toggle.addEventListener("click", () => {
    setOpenSection(toggle.closest("[data-section]"));
  });
}

setOpenSection(document.querySelector('[data-section="shape"]'));

let colorPicker = null;

if (window.iro && colorPickerEl) {
  colorPicker = new iro.ColorPicker(colorPickerEl, {
    width: 220,
    color: state.color,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    layoutDirection: "vertical",
    sliderSize: 14,
    handleRadius: 8,
    padding: 4,
    margin: 8
  });

  colorPicker.on("color:change", color => {
    state.color = color.hexString.toLowerCase();
    colorInput.value = state.color;
    updateURL();
  });
} else if (colorPickerEl) {
  colorPickerEl.hidden = true;
}

// --- COLOR UTILS --------------------------------------------------------

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

let cachedRgbColor = null;
let cachedRgb = null;

function getCachedRgb(color) {
  if (cachedRgbColor !== color) {
    cachedRgbColor = color;
    cachedRgb = hexToRgb(color);
  }
  return cachedRgb;
}

function syncColorPicker(color) {
  if (colorPicker && colorPicker.color.hexString !== color) {
    colorPicker.color.hexString = color;
  }
}

// --- CANVAS SETUP --------------------------------------------------------

let width = 0, height = 0;

function resizeCanvases() {
  width = window.innerWidth;
  height = window.innerHeight;
  for (const c of [smokeCanvas, overlayCanvas]) {
    c.width = width;
    c.height = height;
  }
}
resizeCanvases();
window.addEventListener("resize", resizeCanvases);

function applyPixelation() {
  if (!state.pixelationEnabled || !Number.isFinite(state.pixelCellSize) || state.pixelCellSize <= 1) return;

  const cellSize = state.pixelCellSize;
  const pixelWidth = Math.max(1, Math.ceil(width / cellSize));
  const pixelHeight = Math.max(1, Math.ceil(height / cellSize));

  if (pixelCanvas.width !== pixelWidth || pixelCanvas.height !== pixelHeight) {
    pixelCanvas.width = pixelWidth;
    pixelCanvas.height = pixelHeight;
  }

  pixelCtx.clearRect(0, 0, pixelWidth, pixelHeight);
  pixelCtx.imageSmoothingEnabled = false;
  pixelCtx.drawImage(smokeCanvas, 0, 0, pixelWidth, pixelHeight);

  smokeCtx.clearRect(0, 0, width, height);
  smokeCtx.imageSmoothingEnabled = false;
  smokeCtx.drawImage(pixelCanvas, 0, 0, width, height);
  smokeCtx.imageSmoothingEnabled = true;
}

function spotPx() {
  return { x: (state.spotX / 100) * width, y: (state.spotY / 100) * height };
}

// --- SMOKE PARTICLES --------------------------------------------------------

let particles = [];
let spawning = false;
let spawnStart = 0;
let spawnAccumulator = 0;

function startSpawn() {
  particles = [];
  spawning = true;
  spawnStart = performance.now();
  spawnAccumulator = 0;
  testButton.textContent = "Stop smoke";
}

function stopSpawn() {
  spawning = false;
  particles = [];
  testButton.textContent = "Test smoke";
}

function finishSpawn() {
  spawning = false;
  testButton.textContent = "Test smoke";
}

function spawnParticle() {
  const spot = spotPx();
  const spread = state.width * state.size;
  const turb = state.turbulence / 100;
  const exposureRoll = Math.random();
  const exposure = exposureRoll < 0.6 ? 1 : exposureRoll < 0.85 ? 0.72 : 0.45;

  // each particle is a small cluster of puffs, giving the cloud a mottled, billowy texture
  const puffCount = 3 + Math.floor(Math.random() * 3);
  const puffs = [];
  for (let i = 0; i < puffCount; i++) {
    puffs.push({
      angle: Math.random() * Math.PI * 2,
      dist: 0.3 + Math.random() * 0.7,
      sizeMul: 0.45 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
      freq: 1.2 + Math.random() * 2.2
    });
  }

  particles.push({
    x: spot.x + (Math.random() - 0.5) * spread * 0.4,
    y: spot.y,
    seed: Math.random() * 1000,
    swayFreq: 0.4 + Math.random() * 0.6 + turb * 1.5,
    swayAmp: spread * (0.3 + Math.random() * 0.5) * (0.3 + turb),
    driftX: (Math.random() - 0.5) * turb * 20 * state.size,
    riseSpeed: 18 + Math.random() * 14 + turb * 20,
    startSize: (4 + Math.random() * 4) * state.size,
    maxSize: (30 + state.width * 0.25 + Math.random() * 20) * state.size,
    rotationSpeed: (Math.random() - 0.5) * 1.2 * (0.3 + turb),
    puffs,
    exposure,
    age: 0,
    life: state.lifetime * (0.7 + Math.random() * 0.6)
  });
}

function updateAndDrawSmoke(dt, now) {
  smokeCtx.clearRect(0, 0, width, height);

  if (spawning) {
    const elapsed = (now - spawnStart) / 1000;
    if (elapsed < state.duration) {
      const ratePerSecond = 4 + state.intensity * 4;
      spawnAccumulator += dt * ratePerSecond;
      while (spawnAccumulator >= 1) {
        spawnParticle();
        spawnAccumulator -= 1;
      }
    } else {
      finishSpawn();
    }
  }

  const rgb = getCachedRgb(state.color);
  const baseAlpha = 0.12 + (state.intensity / 10) * 0.28;

  particles = particles.filter(p => p.age < p.life);

  for (const p of particles) {
    p.age += dt;
    const t = p.age / p.life;

    p.y -= p.riseSpeed * dt;
    p.x += Math.sin(p.age * p.swayFreq + p.seed) * p.swayAmp * dt * 0.6 + p.driftX * dt;

    const ease = 1 - Math.pow(1 - Math.min(t, 1), 2);
    const size = p.startSize + (p.maxSize - p.startSize) * ease;

    const fadeIn = Math.min(t / 0.15, 1);
    const fadeOut = Math.min((1 - t) / 0.4, 1);
    const alpha = Math.max(0, Math.min(fadeIn, fadeOut)) * baseAlpha * p.exposure;

    if (alpha <= 0.002) continue;

    const rotation = p.age * p.rotationSpeed;
    let glitchX = 0;
    let glitchY = 0;
    const glitchIntensity = Number.isFinite(state.glitchIntensity)
      ? Math.max(0, state.glitchIntensity)
      : 0;
    const glitchFrequency = Number.isFinite(state.glitchFrequency)
      ? Math.max(0, state.glitchFrequency)
      : 0;
    if (state.glitchEnabled && glitchIntensity > 0 && glitchFrequency > 0) {
      const glitchStep = Math.floor((now / 1000) * glitchFrequency);
      const glitchSeed = p.seed + glitchStep * 97.31;
      glitchX = (Math.sin(glitchSeed * 12.9898) * 0.5) * glitchIntensity;
      glitchY = (Math.sin(glitchSeed * 78.233) * 0.5) * glitchIntensity;
    }

    for (const puff of p.puffs) {
      // two out-of-phase sine waves fake turbulent noise in each puff's density and size
      const noise = 0.7 + 0.15 * Math.sin(p.age * puff.freq + puff.phase) +
        0.15 * Math.sin(p.age * puff.freq * 1.7 + puff.phase * 1.3);

      const puffDist = puff.dist * size * 0.55;
      const px = p.x + glitchX + Math.cos(puff.angle + rotation) * puffDist;
      const py = p.y + glitchY + Math.sin(puff.angle + rotation) * puffDist * 0.7;
      const puffSize = Math.max(1, size * puff.sizeMul * noise);
      const puffAlpha = Math.max(0, alpha * (0.55 + 0.45 * noise));

      const gradient = smokeCtx.createRadialGradient(px, py, 0, px, py, puffSize);
      gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${puffAlpha})`);
      gradient.addColorStop(0.6, `rgba(${rgb.r},${rgb.g},${rgb.b},${puffAlpha * 0.45})`);
      gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);

      smokeCtx.fillStyle = gradient;
      smokeCtx.beginPath();
      smokeCtx.arc(px, py, puffSize, 0, Math.PI * 2);
      smokeCtx.fill();

      const fringe = Number.isFinite(state.glitchFringe)
        ? Math.max(0, state.glitchFringe)
        : 0;
      if (state.glitchEnabled && fringe > 0) {
        const redAlpha = puffAlpha * (rgb.r / 255) * 0.65;
        const blueAlpha = puffAlpha * (rgb.b / 255) * 0.65;

        if (redAlpha > 0.002) {
          const redGradient = smokeCtx.createRadialGradient(
            px - fringe, py, 0, px - fringe, py, puffSize
          );
          redGradient.addColorStop(0, `rgba(255,0,0,${redAlpha})`);
          redGradient.addColorStop(0.6, `rgba(255,0,0,${redAlpha * 0.45})`);
          redGradient.addColorStop(1, "rgba(255,0,0,0)");
          smokeCtx.fillStyle = redGradient;
          smokeCtx.beginPath();
          smokeCtx.arc(px - fringe, py, puffSize, 0, Math.PI * 2);
          smokeCtx.fill();
        }

        if (blueAlpha > 0.002) {
          const blueGradient = smokeCtx.createRadialGradient(
            px + fringe, py, 0, px + fringe, py, puffSize
          );
          blueGradient.addColorStop(0, `rgba(0,0,255,${blueAlpha})`);
          blueGradient.addColorStop(0.6, `rgba(0,0,255,${blueAlpha * 0.45})`);
          blueGradient.addColorStop(1, "rgba(0,0,255,0)");
          smokeCtx.fillStyle = blueGradient;
          smokeCtx.beginPath();
          smokeCtx.arc(px + fringe, py, puffSize, 0, Math.PI * 2);
          smokeCtx.fill();
        }
      }
    }
  }

  applyPixelation();
}

// --- CROSSHAIR OVERLAY --------------------------------------------------------

let mouseX = null;
let mouseY = null;

function drawCrosshair(ctx, x, y, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.font = "11px Consolas, monospace";
  ctx.textBaseline = "middle";

  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();

  const left = Math.round(x);
  const right = Math.round(width - x);
  const top = Math.round(y);
  const bottom = Math.round(height - y);

  ctx.textAlign = "left";
  ctx.fillText(`${left}px`, 6, y - 8);
  ctx.textAlign = "right";
  ctx.fillText(`${right}px`, width - 6, y - 8);

  ctx.textAlign = "center";
  ctx.fillText(`${top}px`, x + 24, 12);
  ctx.fillText(`${bottom}px`, x + 24, height - 12);

  ctx.restore();
}

function drawOverlay() {
  overlayCtx.clearRect(0, 0, width, height);
  if (state.settingsMode !== "ON") return;

  const spot = spotPx();
  drawCrosshair(overlayCtx, spot.x, spot.y, "#ffe600");

  if (mouseX !== null && mouseY !== null) {
    drawCrosshair(overlayCtx, mouseX, mouseY, "#ffffff");
  }
}

window.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

document.addEventListener("click", e => {
  if (e.detail !== 2) return;

  if (state.settingsMode === "DISABLE") {
    state.settingsMode = "ON";
    applySettingsMode();
    updateURL();
    return;
  }

  if (e.target instanceof Element && e.target.closest("#settings-menu")) return;

  state.spotX = (e.clientX / width) * 100;
  state.spotY = (e.clientY / height) * 100;
  updateURL();
});

// --- ANIMATION LOOP --------------------------------------------------------

let lastTime = 0;

function loop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.1) || 0;
  lastTime = ts;

  updateAndDrawSmoke(dt, ts);
  drawOverlay();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// --- SETTINGS MODE -----------------------------------------------------

let bgAnimFrame = 0;
let bgAnimRunning = false;

function stopBgAnimation() {
  bgAnimRunning = false;
  if (bgAnimFrame) {
    cancelAnimationFrame(bgAnimFrame);
    bgAnimFrame = 0;
  }
}

function paintLinearGradient(t) {
  const phase = (t * 0.00012) % 1;
  const shift = phase * 100;
  demoBackdrop.style.backgroundImage =
    `linear-gradient(180deg, #0ff ${-50 + shift}%, #f0f ${50 + shift}%, #0ff ${150 + shift}%)`;
  demoBackdrop.style.backgroundSize = "100% 200%";
  demoBackdrop.style.backgroundPosition = `center ${phase * 100}%`;
}

function paintRadialGradient(t) {
  const phase = (t * 0.00015) % 1;
  const pulse = 40 + Math.sin(phase * Math.PI * 2) * 25;
  const angle = phase * 360;
  demoBackdrop.style.backgroundImage =
    `radial-gradient(circle at ${50 + Math.cos(angle * Math.PI / 180) * 12}% ${50 + Math.sin(angle * Math.PI / 180) * 12}%, #0ff 0%, #f0f ${pulse}%, #0ff 100%)`;
  demoBackdrop.style.backgroundSize = "";
  demoBackdrop.style.backgroundPosition = "";
}

function bgTick(t) {
  if (!bgAnimRunning) return;
  if (state.bg === BG_LINEAR) paintLinearGradient(t);
  else if (state.bg === BG_RADIAL) paintRadialGradient(t);
  else {
    stopBgAnimation();
    return;
  }
  bgAnimFrame = requestAnimationFrame(bgTick);
}

function startBgAnimation() {
  if (bgAnimRunning) return;
  bgAnimRunning = true;
  bgAnimFrame = requestAnimationFrame(bgTick);
}

function applyBackground() {
  demoBackdrop.dataset.bg = state.bg;

  for (const radio of bgRadios) {
    radio.checked = radio.value === state.bg;
  }

  if (state.bg === BG_LINEAR || state.bg === BG_RADIAL) {
    startBgAnimation();
  } else {
    stopBgAnimation();
    demoBackdrop.style.backgroundImage = "";
    demoBackdrop.style.backgroundSize = "";
    demoBackdrop.style.backgroundPosition = "";
  }
}

function updateURL() {
  params.set("spotX", state.spotX.toFixed(2));
  params.set("spotY", state.spotY.toFixed(2));
  params.set("duration", state.duration);
  params.set("intensity", state.intensity);
  params.set("lifetime", state.lifetime);
  params.set("color", state.color);
  params.set("size", state.size);
  params.set("width", state.width);
  params.set("turbulence", state.turbulence);
  params.set("pixelation", state.pixelationEnabled);
  params.set("pixelSize", state.pixelCellSize);
  params.set("glitch", state.glitchEnabled);
  params.set("glitchIntensity", state.glitchIntensity);
  params.set("glitchFrequency", state.glitchFrequency);
  params.set("glitchFringe", state.glitchFringe);
  params.set("bg", state.bg);
  params.set("checkerboard", state.checkerboardEnabled);
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

function syncInputs() {
  durationSlider.value = state.duration;
  durationValue.textContent = `${state.duration}s`;

  intensitySlider.value = state.intensity;
  intensityValue.textContent = state.intensity;

  lifetimeSlider.max = state.duration;
  lifetimeSlider.value = state.lifetime;
  lifetimeValue.textContent = `${state.lifetime}s`;

  colorInput.value = state.color;
  syncColorPicker(state.color);

  sizeSlider.value = state.size;
  sizeValue.textContent = `${state.size.toFixed(2)}x`;

  widthSlider.value = state.width;
  widthValue.textContent = `${state.width}px`;

  turbulenceSlider.value = state.turbulence;
  turbulenceValue.textContent = state.turbulence;

  pixelCellSizeSlider.value = state.pixelCellSize;
  pixelCellSizeValue.textContent = `${state.pixelCellSize}px`;

  glitchIntensitySlider.value = state.glitchIntensity;
  glitchIntensityValue.textContent = `${state.glitchIntensity}px`;

  glitchFrequencySlider.value = state.glitchFrequency;
  glitchFrequencyValue.textContent = `${state.glitchFrequency}Hz`;
  glitchFringeSlider.value = state.glitchFringe;
  glitchFringeValue.textContent = `${state.glitchFringe}px`;
  for (const radio of bgRadios) {
    radio.checked = radio.value === state.bg;
  }
  syncEffectsEnabled();
}

flipSideButton.addEventListener("click", () => {
  state.side = state.side === "left" ? "right" : "left";
  applySide();
  updateURL();
});

checkerboardButton.addEventListener("click", () => {
  state.checkerboardEnabled = !state.checkerboardEnabled;
  applyCheckerboard();
  updateURL();
});

closeSettingsButton.addEventListener("click", () => {
  state.settingsMode = "DISABLE";
  applySettingsMode();
  updateURL();
});

durationSlider.addEventListener("input", e => {
  state.duration = parseFloat(e.target.value);
  if (state.lifetime > state.duration) state.lifetime = state.duration;
  syncInputs();
  updateURL();
});

intensitySlider.addEventListener("input", e => {
  state.intensity = parseFloat(e.target.value);
  syncInputs();
  updateURL();
});

lifetimeSlider.addEventListener("input", e => {
  state.lifetime = Math.min(parseFloat(e.target.value), state.duration);
  syncInputs();
  updateURL();
});

colorInput.addEventListener("input", e => {
  const color = e.target.value.trim();
  if (!/^#[\da-f]{6}$/i.test(color)) return;
  state.color = color.toLowerCase();
  syncColorPicker(state.color);
  updateURL();
});

colorResetButton.addEventListener("click", () => {
  state.color = defaults.color;
  syncInputs();
  updateURL();
});

sizeSlider.addEventListener("input", e => {
  const nextSize = parseFloat(e.target.value);
  const scale = nextSize / state.size;
  for (const particle of particles) {
    particle.startSize *= scale;
    particle.maxSize *= scale;
  }
  state.size = nextSize;
  syncInputs();
  updateURL();
});

widthSlider.addEventListener("input", e => {
  state.width = parseFloat(e.target.value);
  syncInputs();
  updateURL();
});

turbulenceSlider.addEventListener("input", e => {
  state.turbulence = parseFloat(e.target.value);
  syncInputs();
  updateURL();
});

pixelationToggle.addEventListener("change", e => {
  state.pixelationEnabled = e.target.checked;
  syncEffectsEnabled();
  updateURL();
});

pixelCellSizeSlider.addEventListener("input", e => {
  state.pixelCellSize = parseFloat(e.target.value);
  syncInputs();
  updateURL();
});

glitchToggle.addEventListener("change", e => {
  state.glitchEnabled = e.target.checked;
  syncEffectsEnabled();
  updateURL();
});

glitchIntensitySlider.addEventListener("input", e => {
  state.glitchIntensity = parseFloat(e.target.value);
  syncInputs();
  updateURL();
});

glitchFrequencySlider.addEventListener("input", e => {
  state.glitchFrequency = parseFloat(e.target.value);
  syncInputs();
  updateURL();
});

glitchFringeSlider.addEventListener("input", e => {
  state.glitchFringe = parseFloat(e.target.value);
  syncInputs();
  updateURL();
});

testButton.addEventListener("click", () => {
  flashMenuAction(testButton);
  if (spawning) {
    stopSpawn();
  } else {
    startSpawn();
  }
});

resetButton.addEventListener("click", () => {
  flashMenuAction(resetButton);
  state = { ...defaults };
  syncInputs();
  applySettingsMode();
  applySide();
  applyBackground();
  applyCheckerboard();
  updateURL();
});

for (const radio of bgRadios) {
  radio.addEventListener("change", e => {
    if (!e.target.checked) return;
    state.bg = normalizeBg(e.target.value);
    applyBackground();
    updateURL();
  });
}

copyUrlButton.addEventListener("click", () => {
  flashMenuAction(copyUrlButton, "Copied!");
  navigator.clipboard.writeText(location.href);
});

copyUrlObsButton.addEventListener("click", () => {
  flashMenuAction(copyUrlObsButton, "Copied!");
  const url = new URL(location.href);
  url.searchParams.set("menu", "DISABLE");
  navigator.clipboard.writeText(url.toString());
});

// --- INIT --------------------------------------------------------------

syncInputs();
applySettingsMode();
applySide();
applyBackground();
applyCheckerboard();

setTimeout(() => {
  startSpawn();
}, 800);
