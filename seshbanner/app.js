// Sesh Banner runtime. Clanker contract: every persisted edit applies live and
// rewrites the complete URL that a meat bag can paste into OBS.
// --- CONFIG ---------------------------------------------------------

const DISPLAY_FONTS = [
  "Monster Chiller",
  "YouMurderer BB",
  "Streetmark",
  "Germania One",
  "Konstruktor",
  "Lemondrop"
];

const REGULAR_FONTS = [
  "Better VCR",
  "Flapdoodle",
  "Londrina Solid",
  "Pill Gothic 600mg",
  "Segoe UI",
  "Brighton Sans NBP"
];

/**
 * Combined catalog order = persisted URL index (docs/TYPOGRAPHY.md).
 * Better VCR is Display & Regular; Lemondrop / Brighton Sans NBP are appended
 * so indices 0–9 stay stable for old bookmarks.
 */
const ALL_FONTS = [
  "Monster Chiller",
  "YouMurderer BB",
  "Streetmark",
  "Germania One",
  "Konstruktor",
  "Better VCR",
  "Flapdoodle",
  "Londrina Solid",
  "Pill Gothic 600mg",
  "Segoe UI",
  "Lemondrop",
  "Brighton Sans NBP"
];

const THEME_FONT_FALLBACK = {
  preferredDisplay: "Better VCR",
  preferredRegular: "Better VCR"
};

const BG_NONE = "0";
const BG_SESSION = "1";
const BG_LINEAR = "2";
const BG_RADIAL = "3";
const BG_VALUES = new Set([BG_NONE, BG_SESSION, BG_LINEAR, BG_RADIAL]);

const defaults = {
  title: "TITLE",
  message: "Message",
  prefix: "",
  prefixEnabled: false,
  prefixAlign: "left",
  nameAlign: "left",
  layout: "1",
  theme: "lcd-glass",
  titleFont: THEME_FONT_FALLBACK.preferredDisplay,
  messageFont: THEME_FONT_FALLBACK.preferredRegular,
  prefixFont: THEME_FONT_FALLBACK.preferredDisplay,
  prefixSize: 38,
  titleSize: 38,
  messageSize: 18,
  width: 100,
  height: 100,
  bannerX: 50,
  bannerY: 85,
  playlist: "",
  playlistLayout: "1",
  playlistDelimiter: "0",
  playlistDelimiterCustom: "•",
  marqueeSpeed: 100,
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

function normalizePlaylistLayout(value) {
  const layout = String(value || "");
  return layout === "1" || layout === "2" || layout === "3" || layout === "4"
    ? layout
    : defaults.playlistLayout;
}

function isPlaylistLayout(layout) {
  return layout === "3";
}

function normalizePlaylistDelimiter(value) {
  const api = window.SeshBannerPlaylist;
  if (api && typeof api.normalizeDelimiterId === "function") {
    return api.normalizeDelimiterId(value);
  }
  return defaults.playlistDelimiter;
}

function normalizePlaylistDelimiterCustom(value) {
  const api = window.SeshBannerPlaylist;
  if (api && typeof api.normalizeCustomDelimiterText === "function") {
    return api.normalizeCustomDelimiterText(value);
  }
  const raw = String(value ?? "").trim();
  return raw ? raw.slice(0, 5) : "•";
}

function isCustomPlaylistDelimiter() {
  const api = window.SeshBannerPlaylist;
  return !!(api && state.playlistDelimiter === api.CUSTOM_DELIMITER_ID);
}

function getPlaylistDelimiter() {
  const api = window.SeshBannerPlaylist;
  if (api && typeof api.getDelimiterById === "function") {
    return api.getDelimiterById(state.playlistDelimiter, state.playlistDelimiterCustom);
  }
  return " • ";
}

function isPrefixActive() {
  return state.prefixEnabled && String(state.prefix || "").trim().length > 0;
}

function normalizeTextAlign(value, fallback) {
  const align = String(value || "");
  return align === "left" || align === "center" || align === "right" ? align : fallback;
}

function normalizePrefixAlign(value) {
  return normalizeTextAlign(value, defaults.prefixAlign);
}

function normalizeNameAlign(value) {
  return normalizeTextAlign(value, defaults.nameAlign);
}

function isNameAlignLayout() {
  return state.playlistLayout !== "4";
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
  return [
    {
      id: "lcd-glass",
      name: "LCD Glass",
      description: "",
      preferredDisplay: "Better VCR",
      preferredRegular: "Better VCR"
    },
    {
      id: "sesh-glass",
      name: "Sesh Glass",
      description: "",
      preferredDisplay: "Monster Chiller",
      preferredRegular: "Londrina Solid"
    },
    {
      id: "3026-d3c0",
      name: "3026 D3C0",
      description: "",
      preferredDisplay: "Lemondrop",
      preferredRegular: "Brighton Sans NBP"
    }
  ];
}

const THEMES = getThemeCatalog();

function normalizeTheme(value) {
  const id = String(value || "");
  return THEMES.some(theme => theme.id === id) ? id : defaults.theme;
}

function findTheme(id) {
  return THEMES.find(theme => theme.id === id) || THEMES[0];
}

/** Preferred Display / Regular for a theme (docs/TYPOGRAPHY.md). */
function getThemePreferredFonts(themeId) {
  const theme = findTheme(themeId);
  return {
    display: pickFont(
      theme && theme.preferredDisplay,
      ALL_FONTS,
      THEME_FONT_FALLBACK.preferredDisplay
    ),
    regular: pickFont(
      theme && theme.preferredRegular,
      ALL_FONTS,
      THEME_FONT_FALLBACK.preferredRegular
    )
  };
}

function applyThemePreferredFonts(themeId) {
  const fonts = getThemePreferredFonts(themeId == null ? state.theme : themeId);
  state.titleFont = fonts.display;
  state.messageFont = fonts.regular;
  state.prefixFont = fonts.display;
}

function formatThemeDescription(theme) {
  if (!theme) return "";
  const parts = [];
  if (theme.description) parts.push(theme.description);
  const display = theme.preferredDisplay || THEME_FONT_FALLBACK.preferredDisplay;
  const regular = theme.preferredRegular || THEME_FONT_FALLBACK.preferredRegular;
  parts.push(`Preferred fonts — Display: ${display}; Regular: ${regular}.`);
  return parts.join(" ");
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

const initialTheme = normalizeTheme(getParam("theme", defaults.theme));
const themeFonts = getThemePreferredFonts(initialTheme);

let state = {
  title: getParam("title", defaults.title),
  message: getParam("message", defaults.message),
  prefix: getParam("prefix", defaults.prefix),
  prefixEnabled: getBooleanParam("prefixEnabled", defaults.prefixEnabled),
  prefixAlign: normalizePrefixAlign(getParam("prefixAlign", defaults.prefixAlign)),
  nameAlign: normalizeNameAlign(getParam("nameAlign", defaults.nameAlign)),
  layout: normalizeLayout(getParam("layout", defaults.layout)),
  theme: initialTheme,
  titleFont: resolveFontParam(
    params.has("titleFont") ? params.get("titleFont") : null,
    ALL_FONTS,
    themeFonts.display
  ),
  messageFont: resolveFontParam(
    params.has("messageFont") ? params.get("messageFont") : null,
    ALL_FONTS,
    themeFonts.regular
  ),
  prefixFont: resolveFontParam(
    params.has("prefixFont") ? params.get("prefixFont") : null,
    ALL_FONTS,
    themeFonts.display
  ),
  prefixSize: getSizeParam("prefixSize", defaults.prefixSize, 16, 96),
  titleSize: getSizeParam("titleSize", defaults.titleSize, 16, 96),
  messageSize: getSizeParam("messageSize", defaults.messageSize, 12, 64),
  width: getAxisSize("width"),
  height: getAxisSize("height"),
  bannerX: getNumberParam("bannerX", defaults.bannerX),
  bannerY: getNumberParam("bannerY", defaults.bannerY),
  playlist: getParam("playlist", defaults.playlist),
  playlistLayout: normalizePlaylistLayout(getParam("playlistLayout", defaults.playlistLayout)),
  playlistDelimiter: normalizePlaylistDelimiter(getParam("playlistDelimiter", defaults.playlistDelimiter)),
  playlistDelimiterCustom: normalizePlaylistDelimiterCustom(
    getParam("playlistDelimiterCustom", defaults.playlistDelimiterCustom)
  ),
  marqueeSpeed: getSizeParam("marqueeSpeed", defaults.marqueeSpeed, 25, 400),
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
const playlistPanel = banner.querySelector(".banner-playlist-layout");
const playlistPrefixBlock = banner.querySelector(".playlist-prefix-block");
const playlistPrefix = banner.querySelector(".playlist-prefix");
const playlistMain = banner.querySelector(".playlist-main");
const playlistName = banner.querySelector(".playlist-name");
const playlistMarqueeTrack = banner.querySelector(".playlist-marquee-track");

const demoBackdrop = document.getElementById("demo-backdrop");
const settingsMenu = document.getElementById("settings-menu");
const checkerboardButton = document.getElementById("checkerboard-button");
const flipSideButton = document.getElementById("flip-side-button");
const closeSettingsButton = document.getElementById("close-menu-button");

const titleInput = document.getElementById("title-input");
const messageInput = document.getElementById("message-input");
const contentTextFields = document.getElementById("content-text-fields");
const contentPrefixFields = document.getElementById("content-prefix-fields");
const prefixEnabledInput = document.getElementById("prefix-enabled");
const prefixInput = document.getElementById("prefix-input");
const prefixInputGroup = document.getElementById("prefix-input-group");
const prefixAlignGroup = document.getElementById("prefix-align-group");
const prefixAlignButtons = document.querySelectorAll("[data-prefix-align]");
const nameAlignGroup = document.getElementById("name-align-group");
const nameAlignButtons = document.querySelectorAll("[data-name-align]");
const prefixFontGroup = document.getElementById("prefix-font-group");
const positionValue = document.getElementById("position-value");
const playlistInput = document.getElementById("playlist-input");
const playlistStatus = document.getElementById("playlist-status");
const youtubePlaylistSection = document.getElementById("youtube-playlist-section");
const playlistLayoutRadios = document.querySelectorAll('input[name="playlist-layout"]');
const playlistDelimiterSelect = document.getElementById("playlist-delimiter-select");
const playlistDelimiterCustomGroup = document.getElementById("playlist-delimiter-custom-group");
const playlistDelimiterCustomInput = document.getElementById("playlist-delimiter-custom");
const marqueeSpeedSlider = document.getElementById("marquee-speed-slider");
const marqueeSpeedValue = document.getElementById("marquee-speed-value");
const titleFontPickerEl = document.getElementById("title-font-picker");
const messageFontPickerEl = document.getElementById("message-font-picker");
const prefixFontPickerEl = document.getElementById("prefix-font-picker");
const prefixSizeSlider = document.getElementById("prefix-size-slider");
const prefixSizeValue = document.getElementById("prefix-size-value");
const titleFontLabel = document.getElementById("title-font-label");
const messageFontLabel = document.getElementById("message-font-label");
const titleSizeLabel = document.getElementById("title-size-label");
const messageSizeLabel = document.getElementById("message-size-label");
const titleFontResetButton = document.querySelector('[data-reset="titleFont"]');
const messageFontResetButton = document.querySelector('[data-reset="messageFont"]');
const titleSizeResetButton = document.querySelector('[data-reset="titleSize"]');
const messageSizeResetButton = document.querySelector('[data-reset="messageSize"]');
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
  ALL_FONTS,
  "title-font-label",
  () => state.titleFont,
  font => {
    state.titleFont = pickFont(font, ALL_FONTS, getThemePreferredFonts(state.theme).display);
    applyFonts();
    titleFontPicker.sync();
    updateURL();
  }
);

const messageFontPicker = createFontPicker(
  messageFontPickerEl,
  ALL_FONTS,
  "message-font-label",
  () => state.messageFont,
  font => {
    state.messageFont = pickFont(font, ALL_FONTS, getThemePreferredFonts(state.theme).regular);
    applyFonts();
    messageFontPicker.sync();
    updateURL();
  }
);

const prefixFontPicker = createFontPicker(
  prefixFontPickerEl,
  ALL_FONTS,
  "prefix-font-label",
  () => state.prefixFont,
  font => {
    state.prefixFont = pickFont(font, ALL_FONTS, getThemePreferredFonts(state.theme).display);
    applyFonts();
    prefixFontPicker.sync();
    updateURL();
  }
);

fontPickers.push(titleFontPicker, messageFontPicker, prefixFontPicker);

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
  params.set("titleFont", String(fontIndex(state.titleFont, ALL_FONTS)));
  params.set("messageFont", String(fontIndex(state.messageFont, ALL_FONTS)));
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
  params.set("playlistLayout", state.playlistLayout);
  params.set("playlistDelimiter", state.playlistDelimiter);
  params.set("playlistDelimiterCustom", state.playlistDelimiterCustom);
  params.set("marqueeSpeed", String(state.marqueeSpeed));
  params.set("bg", state.bg);
  params.set("checkerboard", String(state.checkerboardEnabled));
  params.set("menu", state.settingsMode);
  params.set("side", state.side);
  params.set("title", state.title);
  params.set("message", state.message);
  params.set("prefix", state.prefix);
  params.set("prefixEnabled", String(state.prefixEnabled));
  params.set("prefixAlign", state.prefixAlign);
  params.set("nameAlign", state.nameAlign);
  params.set("prefixFont", String(fontIndex(state.prefixFont, ALL_FONTS)));
  params.set("prefixSize", String(state.prefixSize));
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
  document.documentElement.style.setProperty(
    "--banner-prefix-size",
    `${(state.prefixSize * fontScale).toFixed(2)}px`
  );

  syncMarqueeDuration();
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
  document.documentElement.style.setProperty(
    "--banner-prefix-font",
    `'${state.prefixFont}', sans-serif`
  );
  applySize();
}

function applyFontLabels() {
  const isPlaylist = isPlaylistLayout(state.layout);
  const titleFontText = isPlaylist ? "Playlist name font" : "Title font";
  const messageFontText = isPlaylist ? "Ticker font" : "Message font";
  const titleSizeText = isPlaylist ? "Playlist name size" : "Title size";
  const messageSizeText = isPlaylist ? "Ticker size" : "Message size";

  titleFontLabel.textContent = titleFontText;
  messageFontLabel.textContent = messageFontText;
  titleSizeLabel.textContent = titleSizeText;
  messageSizeLabel.textContent = messageSizeText;

  if (titleFontResetButton) {
    titleFontResetButton.setAttribute("aria-label", `Reset ${titleFontText.toLowerCase()}`);
    titleFontResetButton.title = `Reset ${titleFontText.toLowerCase()}`;
  }
  if (messageFontResetButton) {
    messageFontResetButton.setAttribute("aria-label", `Reset ${messageFontText.toLowerCase()}`);
    messageFontResetButton.title = `Reset ${messageFontText.toLowerCase()}`;
  }
  if (titleSizeResetButton) {
    titleSizeResetButton.setAttribute("aria-label", `Reset ${titleSizeText.toLowerCase()}`);
    titleSizeResetButton.title = `Reset ${titleSizeText.toLowerCase()}`;
  }
  if (messageSizeResetButton) {
    messageSizeResetButton.setAttribute("aria-label", `Reset ${messageSizeText.toLowerCase()}`);
    messageSizeResetButton.title = `Reset ${messageSizeText.toLowerCase()}`;
  }
}

function applyPlaylistControls() {
  const isCustom = isCustomPlaylistDelimiter();
  if (playlistDelimiterCustomInput) {
    playlistDelimiterCustomInput.disabled = !isCustom;
  }
  if (playlistDelimiterCustomGroup) {
    playlistDelimiterCustomGroup.classList.toggle("is-disabled", !isCustom);
  }
  if (nameAlignGroup) {
    nameAlignGroup.hidden = !isPlaylistLayout(state.layout) || !isNameAlignLayout();
  }
  for (const button of nameAlignButtons) {
    button.classList.toggle("is-active", button.dataset.nameAlign === state.nameAlign);
  }
}

function applyFontControls() {
  const showPrefixOptions = isPlaylistLayout(state.layout) && state.prefixEnabled;
  prefixFontGroup.hidden = !showPrefixOptions;
  applyFontLabels();
}

function applyContentControls() {
  const isPlaylist = isPlaylistLayout(state.layout);
  contentTextFields.hidden = isPlaylist;
  contentPrefixFields.hidden = !isPlaylist;
  prefixInput.disabled = !state.prefixEnabled;
  prefixInputGroup.classList.toggle("is-disabled", !state.prefixEnabled);
  prefixAlignGroup.hidden = !state.prefixEnabled;
  for (const button of prefixAlignButtons) {
    button.classList.toggle("is-active", button.dataset.prefixAlign === state.prefixAlign);
  }
  applyFontControls();
}

function applyPlaylistPrefix() {
  const showPrefix = isPrefixActive();
  banner.dataset.prefixEnabled = showPrefix ? "true" : "false";
  banner.dataset.prefixAlign = state.prefixAlign;
  playlistPrefixBlock.hidden = !showPrefix;
  if (showPrefix) {
    playlistPrefix.textContent = String(state.prefix).trim();
  } else {
    playlistPrefix.textContent = "";
  }
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

let playlistData = null;
let playlistError = null;
let playlistLoading = false;
let playlistFetchGen = 0;
let playlistFetchTimer = 0;
let loadedListId = null;

function currentListId() {
  const api = window.SeshBannerPlaylist;
  if (!api) return null;
  return api.parsePlaylistUrl(state.playlist).listId;
}

function setPlaylistStatus(msg, isError) {
  if (!playlistStatus) return;
  playlistStatus.textContent = msg || "";
  playlistStatus.classList.toggle("is-error", !!isError);
}

function clearPlaylistFetch() {
  playlistFetchGen += 1;
  if (playlistFetchTimer) {
    clearTimeout(playlistFetchTimer);
    playlistFetchTimer = 0;
  }
  playlistLoading = false;
}

function resetPlaylistCache() {
  clearPlaylistFetch();
  playlistData = null;
  playlistError = null;
  loadedListId = null;
  setPlaylistStatus("");
}

function syncMarqueeDuration() {
  if (!playlistMarqueeTrack || playlistMarqueeTrack.classList.contains("is-static")) return;
  if (!isPlaylistLayout(state.layout)) return;

  playlistMarqueeTrack.style.animation = "none";
  void playlistMarqueeTrack.offsetWidth;
  const half = playlistMarqueeTrack.scrollWidth / 2;
  const speedFactor = state.marqueeSpeed / 100;
  const duration = Math.max(10, half / (45 * speedFactor));
  playlistMarqueeTrack.style.setProperty("--marquee-duration", `${duration}s`);
  playlistMarqueeTrack.style.animation = "";
}

function renderMarqueeStatic(message) {
  playlistMarqueeTrack.classList.add("is-static");
  playlistMarqueeTrack.style.removeProperty("--marquee-duration");
  playlistMarqueeTrack.style.animation = "";
  playlistMarqueeTrack.textContent = message;
}

function renderMarqueeScrolling(parts) {
  const delimiter = getPlaylistDelimiter();
  const unit = parts.join(delimiter) + delimiter;

  playlistMarqueeTrack.classList.remove("is-static");
  playlistMarqueeTrack.textContent = "";
  const first = document.createElement("span");
  first.textContent = unit;
  const second = document.createElement("span");
  second.textContent = unit;
  playlistMarqueeTrack.append(first, second);
  syncMarqueeDuration();
}

function applyPlaylistBanner() {
  banner.dataset.playlistLayout = state.playlistLayout;
  banner.dataset.nameAlign = state.nameAlign;
  applyPlaylistPrefix();
  playlistName.textContent = "Playlist title";

  if (playlistLoading) {
    if (playlistData && playlistData.playlistTitle) {
      playlistName.textContent = playlistData.playlistTitle;
    }
    renderMarqueeStatic("Fetching playlist…");
    return;
  }

  if (playlistError) {
    renderMarqueeStatic(playlistError);
    return;
  }

  if (!playlistData || !playlistData.items.length) {
    const listId = currentListId();
    renderMarqueeStatic(listId ? "No videos found" : "Paste a playlist URL");
    return;
  }

  playlistName.textContent = playlistData.playlistTitle || "Playlist";
  const api = window.SeshBannerPlaylist;
  const parts = api
    ? api.formatTickerItems(playlistData.items, state.playlistLayout)
    : [];

  if (!parts.length) {
    renderMarqueeStatic("No videos found");
    return;
  }

  renderMarqueeScrolling(parts);
}

async function runPlaylistFetch() {
  const api = window.SeshBannerPlaylist;
  if (!api || !isPlaylistLayout(state.layout)) return;

  const listId = currentListId();
  if (!listId) {
    playlistData = null;
    playlistError = null;
    playlistLoading = false;
    loadedListId = null;
    setPlaylistStatus("");
    applyPlaylistBanner();
    return;
  }

  if (listId === loadedListId && playlistData && playlistData.items.length) {
    playlistLoading = false;
    playlistError = null;
    setPlaylistStatus(`${playlistData.items.length} videos`);
    applyPlaylistBanner();
    return;
  }

  const gen = ++playlistFetchGen;
  playlistLoading = true;
  playlistError = null;
  setPlaylistStatus("Fetching playlist…");
  applyPlaylistBanner();

  try {
    const data = await api.fetchPlaylistData(state.playlist);
    if (gen !== playlistFetchGen || !isPlaylistLayout(state.layout)) return;

    playlistLoading = false;
    playlistData = data;
    loadedListId = listId;

    if (!data || !data.items.length) {
      playlistError = "No videos found. Is the playlist public?";
      setPlaylistStatus(playlistError, true);
    } else {
      playlistError = null;
      setPlaylistStatus(`${data.items.length} videos`);
    }
    applyPlaylistBanner();
  } catch (err) {
    if (gen !== playlistFetchGen || !isPlaylistLayout(state.layout)) return;
    playlistLoading = false;
    playlistData = null;
    loadedListId = null;
    playlistError = err.message || "Could not load playlist";
    setPlaylistStatus(playlistError, true);
    applyPlaylistBanner();
  }
}

function refreshPlaylist(options) {
  if (!isPlaylistLayout(state.layout)) return;

  applyPlaylistBanner();

  if (playlistFetchTimer) {
    clearTimeout(playlistFetchTimer);
    playlistFetchTimer = 0;
  }

  if (options && options.debounce) {
    playlistFetchTimer = setTimeout(runPlaylistFetch, 500);
    return;
  }

  runPlaylistFetch();
}

function applyLayout() {
  banner.dataset.layout = state.layout;
  banner.dataset.playlistLayout = state.playlistLayout;

  const isPlaylist = isPlaylistLayout(state.layout);
  textLayout.hidden = isPlaylist;
  playlistPanel.hidden = !isPlaylist;
  playlistInput.disabled = !isPlaylist;
  youtubePlaylistSection.hidden = !isPlaylist;
  applyPlaylistControls();
  applyContentControls();

  for (const radio of layoutRadios) {
    radio.checked = radio.value === state.layout;
  }
  for (const radio of playlistLayoutRadios) {
    radio.checked = radio.value === state.playlistLayout;
  }

  if (isPlaylist) {
    refreshPlaylist({ debounce: false });
  } else {
    clearPlaylistFetch();
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
  prefixInput.value = state.prefix;
  prefixEnabledInput.checked = state.prefixEnabled;
  playlistInput.value = state.playlist;
  titleFontPicker.sync();
  messageFontPicker.sync();
  prefixFontPicker.sync();
  prefixSizeSlider.value = state.prefixSize;
  prefixSizeValue.textContent = `${state.prefixSize}px`;
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
  themeDescription.textContent = formatThemeDescription(themeMeta);
  playlistInput.disabled = !isPlaylistLayout(state.layout);
  youtubePlaylistSection.hidden = !isPlaylistLayout(state.layout);
  if (playlistDelimiterSelect) {
    playlistDelimiterSelect.value = state.playlistDelimiter;
  }
  if (playlistDelimiterCustomInput) {
    playlistDelimiterCustomInput.value = state.playlistDelimiterCustom;
  }
  marqueeSpeedSlider.value = state.marqueeSpeed;
  marqueeSpeedValue.textContent = `${state.marqueeSpeed}%`;
  applyPlaylistControls();
  applyContentControls();
  for (const radio of playlistLayoutRadios) {
    radio.checked = radio.value === state.playlistLayout;
  }
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

// --- DRAG (settings-only; banner center follows the pointer) ----------

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

prefixEnabledInput.addEventListener("change", e => {
  state.prefixEnabled = e.target.checked;
  applyContentControls();
  applyPlaylistBanner();
  updateURL();
});

prefixInput.addEventListener("input", e => {
  state.prefix = e.target.value;
  applyPlaylistBanner();
  updateURL();
});

prefixSizeSlider.addEventListener("input", e => {
  state.prefixSize = clamp(parseFloat(e.target.value), 16, 96);
  prefixSizeValue.textContent = `${state.prefixSize}px`;
  applyFonts();
  updateURL();
});

for (const button of prefixAlignButtons) {
  button.addEventListener("click", () => {
    state.prefixAlign = normalizePrefixAlign(button.dataset.prefixAlign);
    applyContentControls();
    applyPlaylistPrefix();
    updateURL();
  });
}

for (const button of nameAlignButtons) {
  button.addEventListener("click", () => {
    state.nameAlign = normalizeNameAlign(button.dataset.nameAlign);
    applyPlaylistControls();
    applyPlaylistBanner();
    updateURL();
  });
}

playlistInput.addEventListener("input", e => {
  state.playlist = e.target.value;
  if (currentListId() !== loadedListId) {
    playlistData = null;
    playlistError = null;
    loadedListId = null;
  }
  refreshPlaylist({ debounce: true });
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
      state.titleFont = getThemePreferredFonts(state.theme).display;
      break;
    case "messageFont":
      state.messageFont = getThemePreferredFonts(state.theme).regular;
      break;
    case "prefixFont":
      state.prefixFont = getThemePreferredFonts(state.theme).display;
      break;
    case "prefixSize":
      state.prefixSize = defaults.prefixSize;
      break;
    case "marqueeSpeed":
      state.marqueeSpeed = defaults.marqueeSpeed;
      break;
    default:
      return;
  }

  if (key === "width" || key === "height") applySize();
  if (key === "marqueeSpeed") syncMarqueeDuration();
  if (key === "titleSize" || key === "messageSize" || key === "prefixSize" || key === "titleFont" || key === "messageFont" || key === "prefixFont") {
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

for (const radio of playlistLayoutRadios) {
  radio.addEventListener("change", e => {
    if (!e.target.checked) return;
    state.playlistLayout = normalizePlaylistLayout(e.target.value);
    applyPlaylistControls();
    applyPlaylistBanner();
    updateURL();
  });
}

if (playlistDelimiterSelect) {
  playlistDelimiterSelect.addEventListener("change", () => {
    state.playlistDelimiter = normalizePlaylistDelimiter(playlistDelimiterSelect.value);
    applyPlaylistControls();
    applyPlaylistBanner();
    updateURL();
  });
}

if (playlistDelimiterCustomInput) {
  playlistDelimiterCustomInput.addEventListener("input", e => {
    const next = normalizePlaylistDelimiterCustom(e.target.value);
    state.playlistDelimiterCustom = next;
    if (e.target.value !== next) {
      e.target.value = next;
    }
    if (isCustomPlaylistDelimiter()) {
      applyPlaylistBanner();
      updateURL();
    }
  });
}

marqueeSpeedSlider.addEventListener("input", e => {
  state.marqueeSpeed = clamp(parseFloat(e.target.value), 25, 400);
  marqueeSpeedValue.textContent = `${state.marqueeSpeed}%`;
  syncMarqueeDuration();
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

themeSelect.addEventListener("change", () => {
  state.theme = normalizeTheme(themeSelect.value);
  applyThemePreferredFonts();
  applyTheme();
  applyFonts();
  syncInputs();
  updateURL();
});

resetButton.addEventListener("click", () => {
  flashMenuAction(resetButton);
  state = { ...defaults };
  applyThemePreferredFonts(defaults.theme);
  resetPlaylistCache();
  closeAllFontPickers();
  syncInputs();
  applyAll();
  updateURL();
});

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

for (const theme of THEMES) {
  const option = document.createElement("option");
  option.value = theme.id;
  option.textContent = theme.name;
  themeSelect.appendChild(option);
}

const delimiterApi = window.SeshBannerPlaylist;
if (playlistDelimiterSelect && delimiterApi && Array.isArray(delimiterApi.ITEM_DELIMITERS)) {
  for (const entry of delimiterApi.ITEM_DELIMITERS) {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = entry.label;
    playlistDelimiterSelect.appendChild(option);
  }
}

syncInputs();
applyAll();
updateURL();

window.addEventListener("resize", () => {
  if (isPlaylistLayout(state.layout)) syncMarqueeDuration();
});
