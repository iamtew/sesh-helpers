// Trick Request Banner runtime. Clanker contract: every persisted edit applies
// live and rewrites the complete URL that a meat bag can paste into OBS.
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
const BG_VALUES = new Set([
  BG_NONE,
  BG_SESSION,
  BG_LINEAR,
  BG_RADIAL
]);

const defaults = {
  title: "Trick Request by:",
  user: "Modney Rullen",
  message: "Do a kickflip!",
  theme: "lcd-glass",
  titleFont: THEME_FONT_FALLBACK.preferredDisplay,
  userFont: THEME_FONT_FALLBACK.preferredDisplay,
  messageFont: THEME_FONT_FALLBACK.preferredRegular,
  titleSize: 20,
  userSize: 26,
  messageSize: 28,
  width: 100,
  height: 100,
  alignX: "center",
  alignY: "center",
  bannerX: 2,
  bannerY: 4,
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

function normalizeBg(value) {
  const bg = String(value ?? "");
  return BG_VALUES.has(bg) ? bg : defaults.bg;
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
  state.userFont = fonts.display;
  state.messageFont = fonts.regular;
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

function normalizeAlignX(value) {
  const align = String(value || "");
  return align === "left" || align === "center" || align === "right" ? align : defaults.alignX;
}

function normalizeAlignY(value) {
  const align = String(value || "");
  return align === "top" || align === "center" || align === "bottom" ? align : defaults.alignY;
}

/** Split sized half-padding across start/end. Extra beyond base hugs the far side. */
function padPair(halfRem, baseRem, align, startKey) {
  if (align === "center") return [halfRem, halfRem];
  const total = halfRem * 2;
  const hug = Math.min(halfRem, baseRem);
  if (align === startKey) return [hug, total - hug];
  return [total - hug, hug];
}

/** Prefer width/height; accept legacy scaleX/scaleY or uniform scale URLs. */
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
  user: getParam("user", defaults.user),
  message: getParam("message", defaults.message),
  theme: initialTheme,
  titleFont: resolveFontParam(
    params.has("titleFont") ? params.get("titleFont") : null,
    ALL_FONTS,
    themeFonts.display
  ),
  userFont: resolveFontParam(
    params.has("userFont") ? params.get("userFont") : null,
    ALL_FONTS,
    themeFonts.display
  ),
  messageFont: resolveFontParam(
    params.has("messageFont") ? params.get("messageFont") : null,
    ALL_FONTS,
    themeFonts.regular
  ),
  titleSize: getSizeParam("titleSize", defaults.titleSize, 12, 96),
  userSize: getSizeParam("userSize", defaults.userSize, 12, 96),
  messageSize: getSizeParam("messageSize", defaults.messageSize, 12, 96),
  width: getAxisSize("width"),
  height: getAxisSize("height"),
  alignX: normalizeAlignX(getParam("alignX", defaults.alignX)),
  alignY: normalizeAlignY(getParam("alignY", defaults.alignY)),
  bannerX: getNumberParam("bannerX", defaults.bannerX),
  bannerY: getNumberParam("bannerY", defaults.bannerY),
  bg: normalizeBg(getParam("bg", defaults.bg)),
  checkerboardEnabled: getBooleanParam("checkerboard", defaults.checkerboardEnabled),
  settingsMode: getParam("menu", defaults.settingsMode) === "DISABLE" ? "DISABLE" : "ON",
  side: getParam("side", defaults.side) === "left" ? "left" : "right"
};

// --- DOM --------------------------------------------------------------

const banner = document.getElementById("banner");
const bannerPanel = banner.querySelector(".banner-content");
const titleEl = document.getElementById("title-text");
const userEl = document.getElementById("user-text");
const messageEl = document.getElementById("message-text");

const demoBackdrop = document.getElementById("demo-backdrop");
const settingsMenu = document.getElementById("settings-menu");
const checkerboardButton = document.getElementById("checkerboard-button");
const flipSideButton = document.getElementById("flip-side-button");
const closeSettingsButton = document.getElementById("close-menu-button");

const titleInput = document.getElementById("title-input");
const userInput = document.getElementById("user-input");
const messageInput = document.getElementById("message-input");
const positionValue = document.getElementById("position-value");
const titleFontPickerEl = document.getElementById("title-font-picker");
const userFontPickerEl = document.getElementById("user-font-picker");
const messageFontPickerEl = document.getElementById("message-font-picker");
const titleSizeSlider = document.getElementById("title-size-slider");
const titleSizeValue = document.getElementById("title-size-value");
const userSizeSlider = document.getElementById("user-size-slider");
const userSizeValue = document.getElementById("user-size-value");
const messageSizeSlider = document.getElementById("message-size-slider");
const messageSizeValue = document.getElementById("message-size-value");
const widthSlider = document.getElementById("width-slider");
const widthValue = document.getElementById("width-value");
const heightSlider = document.getElementById("height-slider");
const heightValue = document.getElementById("height-value");
const alignXButtons = document.querySelectorAll("[data-align-x]");
const alignYButtons = document.querySelectorAll("[data-align-y]");
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

const userFontPicker = createFontPicker(
  userFontPickerEl,
  ALL_FONTS,
  "user-font-label",
  () => state.userFont,
  font => {
    state.userFont = pickFont(font, ALL_FONTS, getThemePreferredFonts(state.theme).display);
    applyFonts();
    userFontPicker.sync();
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

fontPickers.push(titleFontPicker, userFontPicker, messageFontPicker);

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

// --- BACKGROUND ANIMATION ---------------------------------------------

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
  // Slow slide: shift color-stop positions along the vertical axis.
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

// --- APPLY ------------------------------------------------------------

function setIfChanged(out, key, value, defaultValue) {
  if (String(value) !== String(defaultValue)) out.set(key, String(value));
}

/** Build query: omit defaults; free-text title/user/message last. */
function buildSearchParams(source, options = {}) {
  const out = new URLSearchParams();
  const menu = options.menu != null ? options.menu : source.settingsMode;
  const preferred = getThemePreferredFonts(source.theme);

  setIfChanged(out, "theme", source.theme, defaults.theme);
  setIfChanged(out, "titleFont", fontIndex(source.titleFont, ALL_FONTS), fontIndex(preferred.display, ALL_FONTS));
  setIfChanged(out, "userFont", fontIndex(source.userFont, ALL_FONTS), fontIndex(preferred.display, ALL_FONTS));
  setIfChanged(out, "messageFont", fontIndex(source.messageFont, ALL_FONTS), fontIndex(preferred.regular, ALL_FONTS));
  setIfChanged(out, "titleSize", source.titleSize, defaults.titleSize);
  setIfChanged(out, "userSize", source.userSize, defaults.userSize);
  setIfChanged(out, "messageSize", source.messageSize, defaults.messageSize);
  setIfChanged(out, "width", source.width, defaults.width);
  setIfChanged(out, "height", source.height, defaults.height);
  setIfChanged(out, "alignX", source.alignX, defaults.alignX);
  setIfChanged(out, "alignY", source.alignY, defaults.alignY);
  setIfChanged(out, "bannerX", Number(source.bannerX).toFixed(2), Number(defaults.bannerX).toFixed(2));
  setIfChanged(out, "bannerY", Number(source.bannerY).toFixed(2), Number(defaults.bannerY).toFixed(2));
  setIfChanged(out, "bg", source.bg, defaults.bg);
  setIfChanged(out, "checkerboard", source.checkerboardEnabled, defaults.checkerboardEnabled);
  setIfChanged(out, "menu", menu, defaults.settingsMode);
  setIfChanged(out, "side", source.side, defaults.side);

  setIfChanged(out, "title", source.title, defaults.title);
  setIfChanged(out, "user", source.user, defaults.user);
  setIfChanged(out, "message", source.message, defaults.message);
  return out;
}

function updateURL() {
  const search = buildSearchParams(state).toString();
  history.replaceState({}, "", search ? "?" + search : location.pathname);
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
  const radiusBase = readCssPx("--banner-radius-base", 16);
  const padXBase = 1.75;
  const padYBase = 1.25;
  const [padLeft, padRight] = padPair(padXBase * w, padXBase, state.alignX, "left");
  const [padTop, padBottom] = padPair(padYBase * h, padYBase, state.alignY, "top");

  document.documentElement.style.setProperty("--banner-max-width", "100vw");
  document.documentElement.style.setProperty(
    "--banner-pad-top",
    `${padTop.toFixed(3)}rem`
  );
  document.documentElement.style.setProperty(
    "--banner-pad-right",
    `${padRight.toFixed(3)}rem`
  );
  document.documentElement.style.setProperty(
    "--banner-pad-bottom",
    `${padBottom.toFixed(3)}rem`
  );
  document.documentElement.style.setProperty(
    "--banner-pad-left",
    `${padLeft.toFixed(3)}rem`
  );
  document.documentElement.style.setProperty(
    "--banner-gap",
    `${(1.5 * w).toFixed(3)}rem`
  );
  document.documentElement.style.setProperty(
    "--banner-accent-w",
    `${Math.max(2, 4 * w).toFixed(2)}px`
  );
  document.documentElement.style.setProperty(
    "--banner-radius",
    `${radiusBase}px`
  );

  for (const button of alignXButtons) {
    button.classList.toggle("is-active", button.dataset.alignX === state.alignX);
  }
  for (const button of alignYButtons) {
    button.classList.toggle("is-active", button.dataset.alignY === state.alignY);
  }
}

function applyFonts() {
  document.documentElement.style.setProperty(
    "--banner-title-font",
    `'${state.titleFont}', sans-serif`
  );
  document.documentElement.style.setProperty(
    "--banner-user-font",
    `'${state.userFont}', sans-serif`
  );
  document.documentElement.style.setProperty(
    "--banner-message-font",
    `'${state.messageFont}', sans-serif`
  );
  document.documentElement.style.setProperty(
    "--banner-title-size",
    `${state.titleSize}px`
  );
  document.documentElement.style.setProperty(
    "--banner-user-size",
    `${state.userSize}px`
  );
  document.documentElement.style.setProperty(
    "--banner-message-size",
    `${state.messageSize}px`
  );
  applySize();
}

function applyContent() {
  titleEl.textContent = state.title;
  userEl.textContent = state.user;
  messageEl.textContent = state.message;
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;

  const effects = (window.SeshThemes && window.SeshThemes.effects) || {};
  for (const [id, effect] of Object.entries(effects)) {
    if (typeof effect.stop === "function" && id !== state.theme) {
      effect.stop(bannerPanel);
    }
  }
  const active = effects[state.theme];
  if (active && typeof active.start === "function") {
    active.start(bannerPanel);
  }

  applySize();
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

function applyAll() {
  applyContent();
  applyTheme();
  applyFonts();
  applyBackground();
  applyBannerPosition();
  applySettingsMode();
  applySide();
  applyCheckerboard();
}

function syncInputs() {
  titleInput.value = state.title;
  userInput.value = state.user;
  messageInput.value = state.message;
  titleFontPicker.sync();
  userFontPicker.sync();
  messageFontPicker.sync();
  titleSizeSlider.value = state.titleSize;
  titleSizeValue.textContent = `${state.titleSize}px`;
  userSizeSlider.value = state.userSize;
  userSizeValue.textContent = `${state.userSize}px`;
  messageSizeSlider.value = state.messageSize;
  messageSizeValue.textContent = `${state.messageSize}px`;
  widthSlider.value = state.width;
  widthValue.textContent = `${state.width}%`;
  heightSlider.value = state.height;
  heightValue.textContent = `${state.height}%`;
  for (const radio of bgRadios) {
    radio.checked = radio.value === state.bg;
  }
  themeSelect.value = state.theme;
  const themeMeta = findTheme(state.theme);
  themeDescription.textContent = formatThemeDescription(themeMeta);
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

// --- DRAG (settings-only; preserve the pointer's grab offset) ---------

let dragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

banner.addEventListener("pointerdown", e => {
  if (state.settingsMode !== "ON") return;
  if (e.button !== 0) return;

  const rect = banner.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
  dragging = true;
  banner.classList.add("dragging");
  banner.setPointerCapture(e.pointerId);
  e.preventDefault();
});

banner.addEventListener("pointermove", e => {
  if (!dragging || state.settingsMode !== "ON") return;

  const x = ((e.clientX - dragOffsetX) / window.innerWidth) * 100;
  const y = ((e.clientY - dragOffsetY) / window.innerHeight) * 100;
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

userInput.addEventListener("input", e => {
  state.user = e.target.value;
  applyContent();
  updateURL();
});

messageInput.addEventListener("input", e => {
  state.message = e.target.value;
  applyContent();
  updateURL();
});

titleSizeSlider.addEventListener("input", e => {
  state.titleSize = clamp(parseFloat(e.target.value), 12, 96);
  titleSizeValue.textContent = `${state.titleSize}px`;
  applyFonts();
  updateURL();
});

userSizeSlider.addEventListener("input", e => {
  state.userSize = clamp(parseFloat(e.target.value), 12, 96);
  userSizeValue.textContent = `${state.userSize}px`;
  applyFonts();
  updateURL();
});

messageSizeSlider.addEventListener("input", e => {
  state.messageSize = clamp(parseFloat(e.target.value), 12, 96);
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

for (const button of alignXButtons) {
  button.addEventListener("click", () => {
    state.alignX = normalizeAlignX(button.dataset.alignX);
    applySize();
    updateURL();
  });
}

for (const button of alignYButtons) {
  button.addEventListener("click", () => {
    state.alignY = normalizeAlignY(button.dataset.alignY);
    applySize();
    updateURL();
  });
}

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
    case "align":
      state.alignX = defaults.alignX;
      state.alignY = defaults.alignY;
      break;
    case "titleSize":
      state.titleSize = defaults.titleSize;
      break;
    case "userSize":
      state.userSize = defaults.userSize;
      break;
    case "messageSize":
      state.messageSize = defaults.messageSize;
      break;
    case "titleFont":
      state.titleFont = getThemePreferredFonts(state.theme).display;
      break;
    case "userFont":
      state.userFont = getThemePreferredFonts(state.theme).display;
      break;
    case "messageFont":
      state.messageFont = getThemePreferredFonts(state.theme).regular;
      break;
    default:
      return;
  }

  if (key === "width" || key === "height" || key === "align") applySize();
  if (
    key === "titleSize" || key === "userSize" || key === "messageSize" ||
    key === "titleFont" || key === "userFont" || key === "messageFont"
  ) {
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
  const search = buildSearchParams(state, { menu: "DISABLE" }).toString();
  url.search = search;
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
