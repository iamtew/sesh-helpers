// --- CONFIG ---------------------------------------------------------

const DISPLAY_FONTS = [
  "Monster Chiller",
  "YouMurderer BB",
  "Streetmark",
  "Germania One",
  "Konstruktor"
];

const REGULAR_FONTS = [
  "Better VCR",
  "Flapdoodle",
  "Londrina Solid",
  "Pill Gothic 600mg",
  "Segoe UI"
];

const BG_NONE = "0";
const BG_SESSION = "1";
const BG_LINEAR = "2";
const BG_RADIAL = "3";
const BG_VALUES = new Set([BG_NONE, BG_SESSION, BG_LINEAR, BG_RADIAL]);

const defaults = {
  title: "TITLE",
  message: "Message",
  layout: "1",
  theme: "lcd-glass",
  titleFont: "Monster Chiller",
  messageFont: "Better VCR",
  titleSize: 38,
  messageSize: 18,
  width: 100,
  height: 100,
  bannerX: 50,
  bannerY: 85,
  playlist: "",
  bg: BG_NONE,
  checkerboardEnabled: false,
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

function normalizeLayout(value) {
  const layout = String(value || "");
  return layout === "1" || layout === "2" || layout === "3" ? layout : defaults.layout;
}

function normalizeBg(value) {
  const bg = String(value ?? "");
  return BG_VALUES.has(bg) ? bg : defaults.bg;
}

function getThemeCatalog() {
  const catalog = window.SeshThemes && Array.isArray(window.SeshThemes.catalog)
    ? window.SeshThemes.catalog
    : [];
  if (catalog.length) return catalog;
  return [{ id: "lcd-glass", name: "LCD Glass", description: "" }];
}

const THEMES = getThemeCatalog();

function normalizeTheme(value) {
  const id = String(value || "");
  return THEMES.some(theme => theme.id === id) ? id : defaults.theme;
}

function findTheme(id) {
  return THEMES.find(theme => theme.id === id) || THEMES[0];
}

function pickFont(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

/** Resolve URL font param: index preferred; legacy font names still accepted. */
function resolveFontParam(raw, fonts, fallbackFont) {
  const fallbackIndex = Math.max(0, fonts.indexOf(fallbackFont));
  if (raw == null || raw === "") return fonts[fallbackIndex];

  const trimmed = String(raw).trim();
  if (/^\d+$/.test(trimmed)) {
    const index = Number.parseInt(trimmed, 10);
    return fonts[index] ?? fonts[fallbackIndex];
  }

  return fonts.includes(trimmed) ? trimmed : fonts[fallbackIndex];
}

function fontIndex(font, fonts) {
  const index = fonts.indexOf(font);
  return index >= 0 ? index : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readCssPx(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function getSizeParam(key, fallback, min, max) {
  return clamp(getNumberParam(key, fallback), min, max);
}

/** Prefer width/height; fall back to legacy scaleX/scaleY or uniform scale. */
function getAxisSize(key) {
  if (params.has(key)) return getSizeParam(key, defaults[key], 25, 1000);
  const legacyKey = key === "width" ? "scaleX" : "scaleY";
  if (params.has(legacyKey)) return getSizeParam(legacyKey, defaults[key], 25, 1000);
  if (params.has("scale")) return getSizeParam("scale", 100, 25, 1000);
  return defaults[key];
}

let state = {
  title: getParam("title", defaults.title),
  message: getParam("message", defaults.message),
  layout: normalizeLayout(getParam("layout", defaults.layout)),
  theme: normalizeTheme(getParam("theme", defaults.theme)),
  titleFont: resolveFontParam(getParam("titleFont", "0"), DISPLAY_FONTS, defaults.titleFont),
  messageFont: resolveFontParam(getParam("messageFont", "0"), REGULAR_FONTS, defaults.messageFont),
  titleSize: getSizeParam("titleSize", defaults.titleSize, 16, 96),
  messageSize: getSizeParam("messageSize", defaults.messageSize, 12, 64),
  width: getAxisSize("width"),
  height: getAxisSize("height"),
  bannerX: getNumberParam("bannerX", defaults.bannerX),
  bannerY: getNumberParam("bannerY", defaults.bannerY),
  playlist: getParam("playlist", defaults.playlist),
  bg: normalizeBg(getParam("bg", defaults.bg)),
  checkerboardEnabled: getBooleanParam("checkerboard", defaults.checkerboardEnabled),
  settingsMode: getParam("menu", defaults.settingsMode) === "DISABLE" ? "DISABLE" : "ON",
  side: getParam("side", defaults.side) === "left" ? "left" : "right"
};

// --- DOM --------------------------------------------------------------

const banner = document.getElementById("banner");
const bannerTitle = banner.querySelector(".banner-title");
const bannerMessage = banner.querySelector(".banner-message");
const textLayout = banner.querySelector(".banner-text-layout");
const playlistLayout = banner.querySelector(".banner-playlist-layout");
const playlistTitle = banner.querySelector(".playlist-title");
const playlistMeta = banner.querySelector(".playlist-meta");
const playlistThumb = banner.querySelector(".playlist-thumb");

const demoBackdrop = document.getElementById("demo-backdrop");
const settingsMenu = document.getElementById("settings-menu");
const checkerboardButton = document.getElementById("checkerboard-button");
const flipSideButton = document.getElementById("flip-side-button");
const closeSettingsButton = document.getElementById("close-menu-button");

const titleInput = document.getElementById("title-input");
const messageInput = document.getElementById("message-input");
const positionValue = document.getElementById("position-value");
const playlistGroup = document.getElementById("playlist-group");
const playlistInput = document.getElementById("playlist-input");
const titleFontPickerEl = document.getElementById("title-font-picker");
const messageFontPickerEl = document.getElementById("message-font-picker");
const titleSizeSlider = document.getElementById("title-size-slider");
const titleSizeValue = document.getElementById("title-size-value");
const messageSizeSlider = document.getElementById("message-size-slider");
const messageSizeValue = document.getElementById("message-size-value");
const widthSlider = document.getElementById("width-slider");
const widthValue = document.getElementById("width-value");
const heightSlider = document.getElementById("height-slider");
const heightValue = document.getElementById("height-value");
const layoutRadios = document.querySelectorAll('input[name="layout"]');
const bgRadios = document.querySelectorAll('input[name="bg"]');
const themeSelect = document.getElementById("theme-select");
const themeDescription = document.getElementById("theme-description");

const resetButton = document.getElementById("reset-button");
const copyUrlButton = document.getElementById("copy-url-button");
const copyUrlObsButton = document.getElementById("copy-url-obs-button");

const sectionToggles = document.querySelectorAll("[data-section-toggle]");

// --- FONT PICKER ------------------------------------------------------

function createFontPicker(root, fonts, labelledBy, getValue, setValue) {
  root.innerHTML = "";
  root.dataset.open = "false";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "font-picker-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-labelledby", labelledBy);

  const valueEl = document.createElement("span");
  valueEl.className = "font-picker-value";
  const caret = document.createElement("span");
  caret.className = "font-picker-caret";
  caret.setAttribute("aria-hidden", "true");
  caret.textContent = "▾";
  trigger.append(valueEl, caret);

  const list = document.createElement("ul");
  list.className = "font-picker-list";
  list.setAttribute("role", "listbox");
  list.hidden = true;

  const optionButtons = [];

  for (const font of fonts) {
    const li = document.createElement("li");
    li.setAttribute("role", "presentation");
    const option = document.createElement("button");
    option.type = "button";
    option.className = "font-picker-option";
    option.setAttribute("role", "option");
    option.dataset.value = font;
    option.textContent = font;
    option.style.fontFamily = `'${font}', sans-serif`;
    option.addEventListener("click", e => {
      e.stopPropagation();
      setValue(font);
      close();
      trigger.focus();
    });
    li.appendChild(option);
    list.appendChild(li);
    optionButtons.push(option);
  }

  function sync() {
    const value = getValue();
    valueEl.textContent = value;
    valueEl.style.fontFamily = `'${value}', sans-serif`;
    for (const option of optionButtons) {
      option.setAttribute("aria-selected", String(option.dataset.value === value));
    }
  }

  function positionList() {
    const rect = trigger.getBoundingClientRect();
    const maxHeight = Math.min(14 * 16, window.innerHeight * 0.42);
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < Math.min(maxHeight, 160) && spaceAbove > spaceBelow;
    const height = Math.min(maxHeight, openUp ? spaceAbove : spaceBelow);

    list.style.left = `${Math.round(rect.left)}px`;
    list.style.width = `${Math.round(rect.width)}px`;
    list.style.maxHeight = `${Math.max(120, Math.round(height))}px`;

    if (openUp) {
      list.style.top = "auto";
      list.style.bottom = `${Math.round(window.innerHeight - rect.top + 4)}px`;
    } else {
      list.style.bottom = "auto";
      list.style.top = `${Math.round(rect.bottom + 4)}px`;
    }
  }

  function open() {
    closeAllFontPickers(root);
    root.dataset.open = "true";
    // Portal outside #settings-menu — backdrop-filter creates a fixed containing block
    // and overflow clips the list if it stays nested.
    document.body.appendChild(list);
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    positionList();
    const selected = optionButtons.find(o => o.getAttribute("aria-selected") === "true");
    (selected || optionButtons[0])?.focus();
  }

  function close() {
    root.dataset.open = "false";
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (list.parentElement !== root) root.appendChild(list);
  }

  function toggle() {
    if (root.dataset.open === "true") close();
    else open();
  }

  trigger.addEventListener("click", e => {
    e.stopPropagation();
    toggle();
  });

  trigger.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });

  list.addEventListener("keydown", e => {
    const current = document.activeElement;
    const index = optionButtons.indexOf(current);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      trigger.focus();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      optionButtons[Math.min(index + 1, optionButtons.length - 1)]?.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      optionButtons[Math.max(index - 1, 0)]?.focus();
    }
    if (e.key === "Home") {
      e.preventDefault();
      optionButtons[0]?.focus();
    }
    if (e.key === "End") {
      e.preventDefault();
      optionButtons[optionButtons.length - 1]?.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (root.dataset.open === "true") positionList();
  });

  root.append(trigger, list);
  sync();

  return { sync, close, reposition: positionList, root };
}

const fontPickers = [];

function closeAllFontPickers(except) {
  for (const picker of fontPickers) {
    if (picker.root !== except) picker.close();
  }
}

const titleFontPicker = createFontPicker(
  titleFontPickerEl,
  DISPLAY_FONTS,
  "title-font-label",
  () => state.titleFont,
  font => {
    state.titleFont = pickFont(font, DISPLAY_FONTS, defaults.titleFont);
    applyFonts();
    titleFontPicker.sync();
    updateURL();
  }
);

const messageFontPicker = createFontPicker(
  messageFontPickerEl,
  REGULAR_FONTS,
  "message-font-label",
  () => state.messageFont,
  font => {
    state.messageFont = pickFont(font, REGULAR_FONTS, defaults.messageFont);
    applyFonts();
    messageFontPicker.sync();
    updateURL();
  }
);

fontPickers.push(titleFontPicker, messageFontPicker);

document.addEventListener("click", e => {
  if (!(e.target instanceof Element)) {
    closeAllFontPickers();
    return;
  }
  if (e.target.closest(".font-picker") || e.target.closest(".font-picker-list")) return;
  closeAllFontPickers();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeAllFontPickers();
});

settingsMenu.addEventListener("scroll", () => {
  for (const picker of fontPickers) {
    if (picker.root.dataset.open === "true") picker.reposition();
  }
}, { passive: true });

// --- APPLY ------------------------------------------------------------

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
  // Drop first so re-set at the end — URLSearchParams keeps insertion order.
  params.delete("title");
  params.delete("message");

  params.set("layout", state.layout);
  params.set("theme", state.theme);
  params.set("titleFont", String(fontIndex(state.titleFont, DISPLAY_FONTS)));
  params.set("messageFont", String(fontIndex(state.messageFont, REGULAR_FONTS)));
  params.set("titleSize", String(state.titleSize));
  params.set("messageSize", String(state.messageSize));
  params.set("width", String(state.width));
  params.set("height", String(state.height));
  params.delete("scale");
  params.delete("scaleX");
  params.delete("scaleY");
  params.set("bannerX", state.bannerX.toFixed(2));
  params.set("bannerY", state.bannerY.toFixed(2));
  params.set("playlist", state.playlist);
  params.set("bg", state.bg);
  params.set("checkerboard", String(state.checkerboardEnabled));
  params.set("menu", state.settingsMode);
  params.set("side", state.side);
  params.set("title", state.title);
  params.set("message", state.message);
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

function applyCheckerboard() {
  document.body.classList.toggle("checkerboard-enabled", state.checkerboardEnabled);
  checkerboardButton.setAttribute("aria-pressed", String(state.checkerboardEnabled));
  checkerboardButton.textContent = state.checkerboardEnabled ? "▞" : "▚";
}

function applyBannerPosition() {
  banner.style.left = `${state.bannerX}%`;
  banner.style.top = `${state.bannerY}%`;
  positionValue.textContent = `${state.bannerX.toFixed(0)}% / ${state.bannerY.toFixed(0)}%`;
}

function applySize() {
  const w = state.width / 100;
  const h = state.height / 100;
  // Uniform type scale from the smaller axis — never stretch glyphs.
  const fontScale = Math.min(w, h);
  const radiusBase = readCssPx("--banner-radius-base", 6);

  document.documentElement.style.setProperty(
    "--banner-max-width",
    `min(${(56 * w).toFixed(2)}rem, ${(90 * w).toFixed(2)}vw, 100vw)`
  );
  document.documentElement.style.setProperty(
    "--banner-pad-x",
    `${(1.25 * w).toFixed(3)}rem`
  );
  document.documentElement.style.setProperty(
    "--banner-pad-y",
    `${(0.85 * h).toFixed(3)}rem`
  );
  document.documentElement.style.setProperty(
    "--banner-accent-w",
    `${Math.max(2, 4 * fontScale).toFixed(2)}px`
  );
  document.documentElement.style.setProperty(
    "--banner-radius",
    `${Math.max(2, radiusBase * fontScale).toFixed(2)}px`
  );
  document.documentElement.style.setProperty(
    "--banner-title-size",
    `${(state.titleSize * fontScale).toFixed(2)}px`
  );
  document.documentElement.style.setProperty(
    "--banner-message-size",
    `${(state.messageSize * fontScale).toFixed(2)}px`
  );
}

function applyFonts() {
  document.documentElement.style.setProperty(
    "--banner-title-font",
    `'${state.titleFont}', sans-serif`
  );
  document.documentElement.style.setProperty(
    "--banner-message-font",
    `'${state.messageFont}', sans-serif`
  );
  applySize();
}

function applyContent() {
  bannerTitle.textContent = state.title;
  bannerMessage.textContent = state.message;
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;

  const effects = (window.SeshThemes && window.SeshThemes.effects) || {};
  for (const [id, effect] of Object.entries(effects)) {
    if (typeof effect.stop === "function" && id !== state.theme) {
      effect.stop(banner);
    }
  }
  const active = effects[state.theme];
  if (active && typeof active.start === "function") {
    active.start(banner);
  }

  applySize();
}

function applyLayout() {
  banner.dataset.layout = state.layout;

  const isPlaylist = state.layout === "2";
  textLayout.hidden = isPlaylist;
  playlistLayout.hidden = !isPlaylist;
  playlistGroup.hidden = !isPlaylist;

  for (const radio of layoutRadios) {
    radio.checked = radio.value === state.layout;
  }

  if (isPlaylist && window.SeshBannerPlaylist) {
    window.SeshBannerPlaylist.applyPlaylistScaffold(
      {
        titleEl: playlistTitle,
        metaEl: playlistMeta,
        thumbEl: playlistThumb
      },
      null,
      state.playlist
    );

    window.SeshBannerPlaylist.fetchPlaylistData(state.playlist).then(data => {
      if (state.layout !== "2") return;
      window.SeshBannerPlaylist.applyPlaylistScaffold(
        {
          titleEl: playlistTitle,
          metaEl: playlistMeta,
          thumbEl: playlistThumb
        },
        data,
        state.playlist
      );
    });
  }
}

function applyAll() {
  applyContent();
  applyTheme();
  applyFonts();
  applyLayout();
  applyBackground();
  applyBannerPosition();
  applySettingsMode();
  applySide();
  applyCheckerboard();
}

function syncInputs() {
  titleInput.value = state.title;
  messageInput.value = state.message;
  playlistInput.value = state.playlist;
  titleFontPicker.sync();
  messageFontPicker.sync();
  titleSizeSlider.value = state.titleSize;
  titleSizeValue.textContent = `${state.titleSize}px`;
  messageSizeSlider.value = state.messageSize;
  messageSizeValue.textContent = `${state.messageSize}px`;
  widthSlider.value = state.width;
  widthValue.textContent = `${state.width}%`;
  heightSlider.value = state.height;
  heightValue.textContent = `${state.height}%`;
  for (const radio of layoutRadios) {
    radio.checked = radio.value === state.layout;
  }
  for (const radio of bgRadios) {
    radio.checked = radio.value === state.bg;
  }
  themeSelect.value = state.theme;
  const themeMeta = findTheme(state.theme);
  themeDescription.textContent = themeMeta && themeMeta.description ? themeMeta.description : "";
  playlistGroup.hidden = state.layout !== "2";
  positionValue.textContent = `${state.bannerX.toFixed(0)}% / ${state.bannerY.toFixed(0)}%`;
}

function setOpenSection(section) {
  closeAllFontPickers();
  for (const toggle of sectionToggles) {
    const panel = document.getElementById(toggle.getAttribute("aria-controls"));
    const isOpen = toggle.closest("[data-section]") === section;
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.querySelector(".section-toggle-icon").textContent = isOpen ? "⏷" : "⏵";
    panel.hidden = !isOpen;
  }
}

for (const toggle of sectionToggles) {
  toggle.addEventListener("click", () => {
    setOpenSection(toggle.closest("[data-section]"));
  });
}

setOpenSection(document.querySelector('[data-section="content"]'));

// --- DRAG (settings-only) ---------------------------------------------

let dragging = false;

banner.addEventListener("pointerdown", e => {
  if (state.settingsMode !== "ON") return;
  if (e.button !== 0) return;

  dragging = true;
  banner.classList.add("dragging");
  banner.setPointerCapture(e.pointerId);
  e.preventDefault();
});

banner.addEventListener("pointermove", e => {
  if (!dragging || state.settingsMode !== "ON") return;

  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  state.bannerX = clamp(x, 0, 100);
  state.bannerY = clamp(y, 0, 100);
  applyBannerPosition();
  updateURL();
});

function endDrag(e) {
  if (!dragging) return;
  dragging = false;
  banner.classList.remove("dragging");
  if (e && banner.hasPointerCapture?.(e.pointerId)) {
    banner.releasePointerCapture(e.pointerId);
  }
}

banner.addEventListener("pointerup", endDrag);
banner.addEventListener("pointercancel", endDrag);

// --- CONTROL UI EVENTS ------------------------------------------------

document.addEventListener("click", e => {
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

titleInput.addEventListener("input", e => {
  state.title = e.target.value;
  applyContent();
  updateURL();
});

messageInput.addEventListener("input", e => {
  state.message = e.target.value;
  applyContent();
  updateURL();
});

playlistInput.addEventListener("input", e => {
  state.playlist = e.target.value;
  applyLayout();
  updateURL();
});

titleSizeSlider.addEventListener("input", e => {
  state.titleSize = clamp(parseFloat(e.target.value), 16, 96);
  titleSizeValue.textContent = `${state.titleSize}px`;
  applyFonts();
  updateURL();
});

messageSizeSlider.addEventListener("input", e => {
  state.messageSize = clamp(parseFloat(e.target.value), 12, 64);
  messageSizeValue.textContent = `${state.messageSize}px`;
  applyFonts();
  updateURL();
});

widthSlider.addEventListener("input", e => {
  state.width = clamp(parseFloat(e.target.value), 25, 1000);
  widthValue.textContent = `${state.width}%`;
  applySize();
  updateURL();
});

heightSlider.addEventListener("input", e => {
  state.height = clamp(parseFloat(e.target.value), 25, 1000);
  heightValue.textContent = `${state.height}%`;
  applySize();
  updateURL();
});

function resetParam(key) {
  switch (key) {
    case "position":
      state.bannerX = defaults.bannerX;
      state.bannerY = defaults.bannerY;
      applyBannerPosition();
      break;
    case "width":
      state.width = defaults.width;
      break;
    case "height":
      state.height = defaults.height;
      break;
    case "titleSize":
      state.titleSize = defaults.titleSize;
      break;
    case "messageSize":
      state.messageSize = defaults.messageSize;
      break;
    case "titleFont":
      state.titleFont = defaults.titleFont;
      break;
    case "messageFont":
      state.messageFont = defaults.messageFont;
      break;
    default:
      return;
  }

  if (key === "width" || key === "height") applySize();
  if (key === "titleSize" || key === "messageSize" || key === "titleFont" || key === "messageFont") {
    applyFonts();
  }

  syncInputs();
  updateURL();
}

for (const button of document.querySelectorAll("[data-reset]")) {
  button.addEventListener("click", () => {
    resetParam(button.getAttribute("data-reset"));
  });
}

for (const radio of layoutRadios) {
  radio.addEventListener("change", e => {
    if (!e.target.checked) return;
    state.layout = normalizeLayout(e.target.value);
    applyLayout();
    updateURL();
  });
}

for (const radio of bgRadios) {
  radio.addEventListener("change", e => {
    if (!e.target.checked) return;
    state.bg = normalizeBg(e.target.value);
    applyBackground();
    updateURL();
  });
}

themeSelect.addEventListener("change", () => {
  state.theme = normalizeTheme(themeSelect.value);
  applyTheme();
  syncInputs();
  updateURL();
});

resetButton.addEventListener("click", () => {
  state = { ...defaults };
  closeAllFontPickers();
  syncInputs();
  applyAll();
  updateURL();
});

copyUrlButton.addEventListener("click", () => {
  navigator.clipboard.writeText(location.href);
});

copyUrlObsButton.addEventListener("click", () => {
  const url = new URL(location.href);
  url.searchParams.set("menu", "DISABLE");
  navigator.clipboard.writeText(url.toString());
});

// --- INIT --------------------------------------------------------------

for (const theme of THEMES) {
  const option = document.createElement("option");
  option.value = theme.id;
  option.textContent = theme.name;
  themeSelect.appendChild(option);
}

syncInputs();
applyAll();
updateURL();
