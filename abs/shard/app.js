// Shard — ABS recursive stained-glass polygon mosaic.
// Query string is the complete shareable config for meat bags and OBS.

const MAX_SIDE = 640;
const GLITCH_MAX_SIDE = 320;
const PULSE_BASE_DURATION_MS = 1600;
const PULSE_BAND_RATIO = 0.085;
const FRAME_MS = 50;
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const EPS = 0.6;
const MAX_LEAVES = 2500;
const MIN_SPLIT_AREA_FRAC = 0.00008;
const MAX_MERGE_AREA_FRAC = 0.04;
const EVOLVE_BASE_MS = 12000;
const EVOLVE_SCAN_ATTEMPTS = 40;

const PALETTES = {
  stained: [
    [10, 8, 22],
    [28, 16, 64],
    [120, 22, 58],
    [18, 72, 118],
    [22, 108, 72],
    [132, 52, 168],
    [196, 140, 42],
    [210, 78, 96]
  ],
  cathedral: [
    [8, 10, 28],
    [18, 28, 72],
    [140, 28, 48],
    [22, 88, 52],
    [180, 120, 32],
    [72, 48, 120],
    [28, 100, 140],
    [220, 180, 80]
  ],
  sunset: [
    [12, 6, 18],
    [48, 12, 36],
    [140, 28, 48],
    [200, 60, 32],
    [220, 100, 28],
    [180, 48, 88],
    [100, 32, 72],
    [255, 160, 90]
  ],
  ocean: [
    [4, 12, 18],
    [8, 32, 48],
    [12, 72, 88],
    [24, 120, 110],
    [48, 160, 140],
    [20, 80, 140],
    [140, 60, 100],
    [180, 220, 200]
  ],
  aurora: [
    [6, 8, 22],
    [16, 20, 48],
    [32, 80, 72],
    [48, 140, 100],
    [88, 48, 140],
    [120, 60, 180],
    [40, 120, 180],
    [200, 255, 180]
  ],
  lcd: [
    [6, 11, 20],
    [10, 22, 40],
    [14, 34, 62],
    [24, 56, 96],
    [36, 78, 120],
    [48, 100, 140],
    [40, 120, 150],
    [70, 40, 90]
  ],
  violet: [
    [8, 6, 18],
    [16, 12, 36],
    [28, 20, 58],
    [44, 32, 90],
    [64, 48, 120],
    [88, 64, 150],
    [110, 80, 170],
    [200, 70, 160]
  ],
  ember: [
    [12, 6, 4],
    [28, 12, 6],
    [48, 20, 8],
    [78, 32, 10],
    [120, 48, 14],
    [160, 70, 20],
    [190, 100, 30],
    [220, 160, 40]
  ],
  jade: [
    [4, 12, 10],
    [8, 24, 20],
    [12, 40, 32],
    [18, 64, 48],
    [28, 96, 68],
    [40, 128, 88],
    [56, 160, 110],
    [180, 220, 60]
  ],
  rose: [
    [14, 6, 12],
    [28, 10, 24],
    [48, 16, 40],
    [78, 28, 58],
    [120, 44, 80],
    [160, 64, 110],
    [200, 90, 140],
    [255, 140, 190]
  ],
  acid: [
    [6, 12, 4],
    [12, 28, 6],
    [24, 48, 8],
    [40, 78, 10],
    [64, 120, 14],
    [96, 170, 20],
    [140, 220, 30],
    [220, 255, 40]
  ]
};

const PALETTE_IDS = new Set(Object.keys(PALETTES));

const defaults = {
  palette: "stained",
  depth: 4,
  jitter: 0.35,
  mix: 0.55,
  speed: 4,
  evolve: 4,
  pulseInterval: 8,
  pulseSpeed: 1,
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

function clampDepth(value) {
  return Math.min(6, Math.max(2, Math.round(value)));
}

function clampJitter(value) {
  return Math.min(1, Math.max(0, value));
}

function clampMix(value) {
  return Math.min(1, Math.max(0, value));
}

function clampSpeed(value) {
  return Math.min(10, Math.max(0, value));
}

function clampEvolve(value) {
  return Math.min(10, Math.max(0, value));
}

function clampPulseInterval(value) {
  return Math.min(30, Math.max(0, value));
}

function clampPulseSpeed(value) {
  return Math.min(4, Math.max(0.25, value));
}

function clampVignetteStrength(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

let state = {
  palette: normalizePalette(getParam("palette", defaults.palette)),
  depth: clampDepth(getNumberParam("depth", defaults.depth)),
  jitter: clampJitter(getNumberParam("jitter", defaults.jitter)),
  mix: clampMix(getNumberParam("mix", defaults.mix)),
  speed: clampSpeed(getNumberParam("speed", defaults.speed)),
  evolve: clampEvolve(getNumberParam("evolve", defaults.evolve)),
  pulseInterval: clampPulseInterval(getNumberParam("pulseInterval", defaults.pulseInterval)),
  pulseSpeed: clampPulseSpeed(getNumberParam("pulseSpeed", defaults.pulseSpeed)),
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

const canvas = document.getElementById("shard-canvas");
const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });

const glitchCanvas = document.createElement("canvas");
const glitchCtx = glitchCanvas.getContext("2d", { alpha: false, willReadFrequently: true });

let verts = [];
let leaves = [];
let midMap = new Map();
let gridMap = new Map();
let centerMap = new Map();
let meshKey = "";
let glitchImage = null;
let glitchData = null;
let glitchSource = null;

const pulseBurst = {
  active: false,
  start: 0,
  originX: 0,
  originY: 0,
  maxRadius: 0
};

let nextPulseAt = 0;
let nextEvolveAt = 0;

const vignetteEl = document.getElementById("vignette");
const settingsMenu = document.getElementById("settings-menu");
const flipSideButton = document.getElementById("flip-side-button");
const closeSettingsButton = document.getElementById("close-menu-button");
const depthSlider = document.getElementById("depth-slider");
const depthValue = document.getElementById("depth-value");
const jitterSlider = document.getElementById("jitter-slider");
const jitterValue = document.getElementById("jitter-value");
const mixSlider = document.getElementById("mix-slider");
const mixValue = document.getElementById("mix-value");
const speedSlider = document.getElementById("speed-slider");
const speedValue = document.getElementById("speed-value");
const evolveSlider = document.getElementById("evolve-slider");
const evolveValue = document.getElementById("evolve-value");
const pulseIntervalSlider = document.getElementById("pulse-interval-slider");
const pulseIntervalValue = document.getElementById("pulse-interval-value");
const pulseSpeedSlider = document.getElementById("pulse-speed-slider");
const pulseSpeedValue = document.getElementById("pulse-speed-value");
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

function fract(n) {
  return n - Math.floor(n);
}

function hash2(a, b) {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return fract(x);
}

function hash3(a, b, c) {
  const x = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return fract(x);
}

function sampleRamp(colors, t) {
  const wrapped = fract(t);
  const n = colors.length - 1;
  const x = wrapped * n;
  const i = Math.min(n - 1, Math.floor(x));
  const f = x - i;
  const a = colors[i];
  const b = colors[i + 1];
  return [
    lerp(a[0], b[0], f),
    lerp(a[1], b[1], f),
    lerp(a[2], b[2], f)
  ];
}

function rgbCss(r, g, b) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function edgeKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function classify(x, y, w, h) {
  const left = x <= EPS;
  const right = x >= w - EPS;
  const top = y <= EPS;
  const bottom = y >= h - EPS;
  let edge = null;
  if (left) edge = "left";
  else if (right) edge = "right";
  else if (top) edge = "top";
  else if (bottom) edge = "bottom";
  const corner = (left || right) && (top || bottom);
  return { edge, corner };
}

function addVertex(x, y, w, h, seed) {
  x = Math.min(w, Math.max(0, x));
  y = Math.min(h, Math.max(0, y));
  const { edge, corner } = classify(x, y, w, h);
  if (corner) {
    x = x < w * 0.5 ? 0 : w;
    y = y < h * 0.5 ? 0 : h;
  } else if (edge === "left") x = 0;
  else if (edge === "right") x = w;
  else if (edge === "top") y = 0;
  else if (edge === "bottom") y = h;

  const minDim = Math.min(w, h);
  const orbitScale = corner ? 0 : edge ? 0.007 : 0.016;
  const orbitR = orbitScale * minDim * (0.4 + 0.6 * seed);

  verts.push({
    restX: x,
    restY: y,
    x,
    y,
    orbitR,
    phase: seed * Math.PI * 2,
    edge,
    corner
  });
  return verts.length - 1;
}

function getMidpoint(ia, ib, w, h) {
  const key = edgeKey(ia, ib);
  if (midMap.has(key)) return midMap.get(key);

  const a = verts[ia];
  const b = verts[ib];
  let mx = (a.restX + b.restX) * 0.5;
  let my = (a.restY + b.restY) * 0.5;
  const dx = b.restX - a.restX;
  const dy = b.restY - a.restY;
  const len = Math.hypot(dx, dy) || 1;
  const jitterAmt = state.jitter * len * 0.28 * (hash2(ia + 1, ib + 3) * 2 - 1);
  const sharedEdge = a.edge && a.edge === b.edge;

  if (Math.abs(jitterAmt) > 0.001) {
    if (sharedEdge || (a.corner && b.corner && (a.restX === b.restX || a.restY === b.restY))) {
      mx += (dx / len) * jitterAmt * 0.45;
      my += (dy / len) * jitterAmt * 0.45;
    } else {
      mx += (-dy / len) * jitterAmt;
      my += (dx / len) * jitterAmt;
    }
  }

  const idx = addVertex(mx, my, w, h, hash2(ia + 11, ib + 29));
  midMap.set(key, idx);
  return idx;
}

function quadKey(...indices) {
  return [...indices].sort((a, b) => a - b).join(",");
}

function polygonArea(indices) {
  let sum = 0;
  for (let i = 0; i < indices.length; i++) {
    const a = verts[indices[i]];
    const b = verts[indices[(i + 1) % indices.length]];
    sum += a.restX * b.restY - b.restX * a.restY;
  }
  return sum * 0.5;
}

function isConvexCCW(indices) {
  const area = polygonArea(indices);
  if (Math.abs(area) < 1) return false;
  const ccw = area > 0;
  const n = indices.length;
  let sign = 0;

  for (let i = 0; i < n; i++) {
    const a = verts[indices[i]];
    const b = verts[indices[(i + 1) % n]];
    const c = verts[indices[(i + 2) % n]];
    const cross = (b.restX - a.restX) * (c.restY - b.restY) - (b.restY - a.restY) * (c.restX - b.restX);
    if (Math.abs(cross) < 0.5) continue;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }

  return ccw ? sign >= 0 : sign <= 0;
}

function orderCCW(indices) {
  if (indices.length < 3) return indices;
  if (polygonArea(indices) >= 0) return indices;
  return [...indices].reverse();
}

function getGridVertex(gx, gy, cols, rows, w, h) {
  const key = `g:${gx},${gy}`;
  if (gridMap.has(key)) return gridMap.get(key);

  const x = (gx / cols) * w;
  const y = (gy / rows) * h;
  let jx = x;
  let jy = y;
  const interior = gx > 0 && gy > 0 && gx < cols && gy < rows;

  if (interior && state.jitter > 0) {
    const cellW = w / cols;
    const cellH = h / rows;
    jx += (hash2(gx, gy) * 2 - 1) * state.jitter * cellW * 0.32;
    jy += (hash2(gx + 13, gy + 7) * 2 - 1) * state.jitter * cellH * 0.32;
  }

  const idx = addVertex(jx, jy, w, h, hash2(gx + 3, gy + 5));
  gridMap.set(key, idx);
  return idx;
}

function getQuadCenter(ia, ib, ic, id, w, h) {
  const key = `c:${quadKey(ia, ib, ic, id)}`;
  if (centerMap.has(key)) return centerMap.get(key);

  const a = verts[ia];
  const b = verts[ib];
  const c = verts[ic];
  const d = verts[id];
  let cx = (a.restX + b.restX + c.restX + d.restX) * 0.25;
  let cy = (a.restY + b.restY + c.restY + d.restY) * 0.25;
  const minDim = Math.min(w, h);
  const wobble = state.jitter * minDim * 0.045 * (hash3(ia, ib, ic) - 0.5);
  cx += wobble;
  cy += wobble * 0.85;

  const idx = addVertex(cx, cy, w, h, hash3(ia, ic, id));
  centerMap.set(key, idx);
  return idx;
}

function pushLeaf(indices, depth, tint) {
  const ordered = orderCCW(indices);
  if (!isConvexCCW(ordered)) return;
  leaves.push({ indices: ordered, depth, tint });
}

function subdivide(ia, ib, ic, depth, w, h) {
  const maxDepth = state.depth;
  const tint = hash3(ia + 1, ib + 5, ic + 9);
  const earlyStop = depth >= 2 && depth < maxDepth && tint > 0.58 - state.mix * 0.12;
  if (depth >= maxDepth || earlyStop) {
    pushLeaf([ia, ib, ic], depth, tint);
    return;
  }

  const mab = getMidpoint(ia, ib, w, h);
  const mbc = getMidpoint(ib, ic, w, h);
  const mca = getMidpoint(ic, ia, w, h);
  subdivide(ia, mab, mca, depth + 1, w, h);
  subdivide(ib, mbc, mab, depth + 1, w, h);
  subdivide(ic, mca, mbc, depth + 1, w, h);
  subdivide(mab, mbc, mca, depth + 1, w, h);
}

function subdivideQuad(ia, ib, ic, id, depth, w, h) {
  const maxDepth = state.depth;
  const tint = hash3(ia + 2, ib + 7, ic + 11) * 0.55 + hash3(ic + 3, id + 5, ia + 9) * 0.45;
  const earlyStop = depth >= 2 && depth < maxDepth && tint > 0.52 - state.mix * 0.14;
  if (depth >= maxDepth || earlyStop) {
    pushLeaf([ia, ib, ic, id], depth, tint);
    return;
  }

  const splitTri = hash3(ia + depth, ib, id) > 0.68 - state.mix * 0.38;
  if (splitTri) {
    if (hash2(ia, ic) > 0.5) {
      subdivide(ia, ib, id, depth + 1, w, h);
      subdivide(ia, id, ic, depth + 1, w, h);
    } else {
      subdivide(ia, ib, ic, depth + 1, w, h);
      subdivide(ib, ic, id, depth + 1, w, h);
    }
    return;
  }

  const mab = getMidpoint(ia, ib, w, h);
  const mbc = getMidpoint(ib, ic, w, h);
  const mcd = getMidpoint(ic, id, w, h);
  const mda = getMidpoint(id, ia, w, h);
  const center = getQuadCenter(ia, ib, ic, id, w, h);

  subdivideQuad(ia, mab, center, mda, depth + 1, w, h);
  subdivideQuad(mab, ib, mbc, center, depth + 1, w, h);
  subdivideQuad(center, mbc, ic, mcd, depth + 1, w, h);
  subdivideQuad(mda, center, mcd, id, depth + 1, w, h);
}

function joinTrianglesOnEdge(triA, triB, v0, v1) {
  const oppA = triA.indices.find((v) => v !== v0 && v !== v1);
  const oppB = triB.indices.find((v) => v !== v0 && v !== v1);
  if (oppA === undefined || oppB === undefined || oppA === oppB) return null;

  const candidates = [
    [oppA, v0, oppB, v1],
    [oppA, v1, oppB, v0],
    [oppB, v0, oppA, v1],
    [oppB, v1, oppA, v0]
  ];

  for (const quad of candidates) {
    if (isConvexCCW(quad)) return orderCCW(quad);
  }
  return null;
}

function mergeTrianglePairs() {
  if (state.mix < 0.12) return;

  const threshold = 0.28 + (1 - state.mix) * 0.52;
  let changed = true;

  while (changed) {
    changed = false;
    const edgeMap = new Map();
    const removed = new Set();
    const additions = [];

    for (let li = 0; li < leaves.length; li++) {
      if (removed.has(li)) continue;
      const leaf = leaves[li];
      if (leaf.indices.length !== 3) continue;

      for (let e = 0; e < 3; e++) {
        const v0 = leaf.indices[e];
        const v1 = leaf.indices[(e + 1) % 3];
        const key = edgeKey(v0, v1);
        const entry = edgeMap.get(key);

        if (!entry) {
          edgeMap.set(key, { li, leaf });
          continue;
        }

        if (removed.has(entry.li) || entry.li === li) continue;
        if (hash2(entry.li + 1, li + 3) > threshold) continue;

        const quadVerts = joinTrianglesOnEdge(entry.leaf, leaf, v0, v1);
        if (!quadVerts) continue;

        removed.add(entry.li);
        removed.add(li);
        additions.push({
          indices: quadVerts,
          depth: Math.max(entry.leaf.depth, leaf.depth),
          tint: (entry.leaf.tint + leaf.tint) * 0.5
        });
        changed = true;
        break;
      }
      if (removed.has(li)) break;
    }

    if (!additions.length) break;
    leaves = leaves.filter((_, i) => !removed.has(i)).concat(additions);
  }
}

function orderVertsAroundCentroid(indices) {
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < indices.length; i++) {
    cx += verts[indices[i]].restX;
    cy += verts[indices[i]].restY;
  }
  cx /= indices.length;
  cy /= indices.length;

  return [...indices].sort((a, b) => {
    const aa = Math.atan2(verts[a].restY - cy, verts[a].restX - cx);
    const ab = Math.atan2(verts[b].restY - cy, verts[b].restX - cx);
    return aa - ab;
  });
}

function mergeTriangleIntoQuad() {
  if (state.mix < 0.45) return;

  const threshold = 0.42 + (1 - state.mix) * 0.45;
  const removed = new Set();
  const additions = [];

  for (let li = 0; li < leaves.length; li++) {
    if (removed.has(li)) continue;
    const tri = leaves[li];
    if (tri.indices.length !== 3) continue;

    for (let qi = 0; qi < leaves.length; qi++) {
      if (qi === li || removed.has(qi)) continue;
      const quad = leaves[qi];
      if (quad.indices.length !== 4) continue;
      if (hash2(li + 5, qi + 9) > threshold) continue;

      for (let e = 0; e < 3; e++) {
        const v0 = tri.indices[e];
        const v1 = tri.indices[(e + 1) % 3];
        const sharesEdge = quad.indices.some((v, i) => {
          const n = quad.indices[(i + 1) % 4];
          return (v === v0 && n === v1) || (v === v1 && n === v0);
        });
        if (!sharesEdge) continue;

        const merged = orderVertsAroundCentroid([...new Set([...tri.indices, ...quad.indices])]);
        if (merged.length !== 5 || !isConvexCCW(merged)) continue;

        removed.add(li);
        removed.add(qi);
        additions.push({
          indices: orderCCW(merged),
          depth: Math.max(tri.depth, quad.depth),
          tint: (tri.tint + quad.tint) * 0.5
        });
        break;
      }
      if (removed.has(li)) break;
    }
  }

  if (additions.length) {
    leaves = leaves.filter((_, i) => !removed.has(i)).concat(additions);
  }
}

function leafArea(indices) {
  return Math.abs(polygonArea(indices));
}

function childTint(parentTint, seed) {
  return fract(parentTint + (hash2(seed, seed + 7) - 0.5) * 0.08);
}

function makeChildLeaf(indices, depth, tint, seed) {
  const ordered = orderCCW(indices);
  if (!isConvexCCW(ordered)) return null;
  return { indices: ordered, depth, tint: childTint(tint, seed) };
}

function canSplitLeaf(leaf, canvasArea) {
  if (leaf.depth >= state.depth) return false;
  if (leaves.length >= MAX_LEAVES) return false;
  return leafArea(leaf.indices) >= canvasArea * MIN_SPLIT_AREA_FRAC;
}

function splitLeafAt(index, w, h) {
  const leaf = leaves[index];
  const canvasArea = w * h;
  if (!canSplitLeaf(leaf, canvasArea)) return false;

  const depth = leaf.depth + 1;
  const replacements = [];

  if (leaf.indices.length === 3) {
    const [ia, ib, ic] = leaf.indices;
    const mab = getMidpoint(ia, ib, w, h);
    const mbc = getMidpoint(ib, ic, w, h);
    const mca = getMidpoint(ic, ia, w, h);
    const children = [
      makeChildLeaf([ia, mab, mca], depth, leaf.tint, ia + mab),
      makeChildLeaf([ib, mbc, mab], depth, leaf.tint, ib + mbc),
      makeChildLeaf([ic, mca, mbc], depth, leaf.tint, ic + mca),
      makeChildLeaf([mab, mbc, mca], depth, leaf.tint, mab + mbc)
    ];
    for (const child of children) {
      if (!child) return false;
      replacements.push(child);
    }
  } else if (leaf.indices.length === 4) {
    const [ia, ib, ic, id] = leaf.indices;
    const splitTri = hash3(ia + depth, ib, id) > 0.68 - state.mix * 0.38;
    if (splitTri) {
      if (hash2(ia, ic) > 0.5) {
        const c1 = makeChildLeaf([ia, ib, id], depth, leaf.tint, ia + id);
        const c2 = makeChildLeaf([ia, id, ic], depth, leaf.tint, ia + ic);
        if (!c1 || !c2) return false;
        replacements.push(c1, c2);
      } else {
        const c1 = makeChildLeaf([ia, ib, ic], depth, leaf.tint, ia + ic);
        const c2 = makeChildLeaf([ib, ic, id], depth, leaf.tint, ib + id);
        if (!c1 || !c2) return false;
        replacements.push(c1, c2);
      }
    } else {
      const mab = getMidpoint(ia, ib, w, h);
      const mbc = getMidpoint(ib, ic, w, h);
      const mcd = getMidpoint(ic, id, w, h);
      const mda = getMidpoint(id, ia, w, h);
      const center = getQuadCenter(ia, ib, ic, id, w, h);
      const children = [
        makeChildLeaf([ia, mab, center, mda], depth, leaf.tint, ia + center),
        makeChildLeaf([mab, ib, mbc, center], depth, leaf.tint, mab + ib),
        makeChildLeaf([center, mbc, ic, mcd], depth, leaf.tint, center + ic),
        makeChildLeaf([mda, center, mcd, id], depth, leaf.tint, mda + id)
      ];
      for (const child of children) {
        if (!child) return false;
        replacements.push(child);
      }
    }
  } else if (leaf.indices.length === 5) {
    const indices = leaf.indices;
    let bestI = 0;
    let bestLen = Infinity;
    for (let i = 0; i < 5; i++) {
      const v0 = indices[i];
      const v2 = indices[(i + 2) % 5];
      const a = verts[v0];
      const b = verts[v2];
      const len = Math.hypot(a.restX - b.restX, a.restY - b.restY);
      if (len < bestLen) {
        bestLen = len;
        bestI = i;
      }
    }
    const v0 = indices[bestI];
    const v1 = indices[(bestI + 1) % 5];
    const v2 = indices[(bestI + 2) % 5];
    const v3 = indices[(bestI + 3) % 5];
    const v4 = indices[(bestI + 4) % 5];
    const tri = makeChildLeaf([v0, v1, v2], depth, leaf.tint, v0 + v2);
    const quad = makeChildLeaf([v0, v2, v3, v4], depth, leaf.tint, v2 + v4);
    if (!tri || !quad) return false;
    replacements.push(tri, quad);
  } else {
    return false;
  }

  leaves.splice(index, 1, ...replacements);
  return true;
}

function sharesEdge(indicesA, indicesB) {
  for (let e = 0; e < indicesA.length; e++) {
    const v0 = indicesA[e];
    const v1 = indicesA[(e + 1) % indicesA.length];
    for (let f = 0; f < indicesB.length; f++) {
      const u0 = indicesB[f];
      const u1 = indicesB[(f + 1) % indicesB.length];
      if ((v0 === u0 && v1 === u1) || (v0 === u1 && v1 === u0)) {
        return { v0, v1 };
      }
    }
  }
  return null;
}

function canMergeLeaves(leafA, leafB, canvasArea) {
  return leafArea(leafA.indices) + leafArea(leafB.indices) <= canvasArea * MAX_MERGE_AREA_FRAC;
}

function replaceLeavesWithMerged(lo, hi, merged) {
  leaves.splice(hi, 1);
  leaves.splice(lo, 1, merged);
}

function tryMergeOne(w, h) {
  const canvasArea = w * h;
  const n = leaves.length;
  if (n < 2) return false;

  const start = Math.floor(Math.random() * n);
  for (let attempt = 0; attempt < EVOLVE_SCAN_ATTEMPTS; attempt++) {
    const li = (start + attempt) % n;
    const leaf = leaves[li];
    if (!leaf) continue;

    if (state.mix >= 0.12 && leaf.indices.length === 3) {
      for (let lj = 0; lj < n; lj++) {
        if (lj === li) continue;
        const other = leaves[lj];
        if (!other || other.indices.length !== 3) continue;
        const edge = sharesEdge(leaf.indices, other.indices);
        if (!edge) continue;
        if (!canMergeLeaves(leaf, other, canvasArea)) continue;
        if (hash2(li + 1, lj + 3) > 0.28 + (1 - state.mix) * 0.52) continue;

        const quadVerts = joinTrianglesOnEdge(leaf, other, edge.v0, edge.v1);
        if (!quadVerts) continue;

        replaceLeavesWithMerged(Math.min(li, lj), Math.max(li, lj), {
          indices: quadVerts,
          depth: Math.max(leaf.depth, other.depth),
          tint: (leaf.tint + other.tint) * 0.5
        });
        return true;
      }
    }

    if (state.mix >= 0.45 && leaf.indices.length === 3) {
      for (let lj = 0; lj < n; lj++) {
        if (lj === li) continue;
        const quad = leaves[lj];
        if (!quad || quad.indices.length !== 4) continue;
        if (hash2(li + 5, lj + 9) > 0.42 + (1 - state.mix) * 0.45) continue;
        if (!canMergeLeaves(leaf, quad, canvasArea)) continue;

        const edge = sharesEdge(leaf.indices, quad.indices);
        if (!edge) continue;

        const mergedVerts = orderVertsAroundCentroid([...new Set([...leaf.indices, ...quad.indices])]);
        if (mergedVerts.length !== 5 || !isConvexCCW(mergedVerts)) continue;

        replaceLeavesWithMerged(Math.min(li, lj), Math.max(li, lj), {
          indices: orderCCW(mergedVerts),
          depth: Math.max(leaf.depth, quad.depth),
          tint: (leaf.tint + quad.tint) * 0.5
        });
        return true;
      }
    }

    if (state.mix >= 0.45 && leaf.indices.length === 4) {
      for (let lj = 0; lj < n; lj++) {
        if (lj === li) continue;
        const tri = leaves[lj];
        if (!tri || tri.indices.length !== 3) continue;
        if (hash2(lj + 5, li + 9) > 0.42 + (1 - state.mix) * 0.45) continue;
        if (!canMergeLeaves(leaf, tri, canvasArea)) continue;

        const edge = sharesEdge(leaf.indices, tri.indices);
        if (!edge) continue;

        const mergedVerts = orderVertsAroundCentroid([...new Set([...leaf.indices, ...tri.indices])]);
        if (mergedVerts.length !== 5 || !isConvexCCW(mergedVerts)) continue;

        replaceLeavesWithMerged(Math.min(li, lj), Math.max(li, lj), {
          indices: orderCCW(mergedVerts),
          depth: Math.max(leaf.depth, tri.depth),
          tint: (leaf.tint + tri.tint) * 0.5
        });
        return true;
      }
    }
  }

  return false;
}

function pickEvolveOp(w, h) {
  const n = leaves.length;
  if (n === 0) return false;

  const start = Math.floor(Math.random() * n);
  const preferMerge = Math.random() < state.mix;

  if (preferMerge && state.mix >= 0.12) {
    if (tryMergeOne(w, h)) return true;
    for (let attempt = 0; attempt < EVOLVE_SCAN_ATTEMPTS; attempt++) {
      const idx = (start + attempt) % n;
      if (splitLeafAt(idx, w, h)) return true;
    }
    return false;
  }

  for (let attempt = 0; attempt < EVOLVE_SCAN_ATTEMPTS; attempt++) {
    const idx = (start + attempt) % n;
    if (splitLeafAt(idx, w, h)) return true;
  }
  if (state.mix >= 0.12 && tryMergeOne(w, h)) return true;
  return false;
}

function scheduleNextEvolve(fromNow = performance.now()) {
  if (state.evolve <= 0 || REDUCE_MOTION) {
    nextEvolveAt = Infinity;
    return;
  }
  nextEvolveAt = fromNow + EVOLVE_BASE_MS / (state.evolve + 0.5);
}

function evolveTopology(now) {
  if (REDUCE_MOTION || state.evolve <= 0 || now < nextEvolveAt) return;
  pickEvolveOp(canvas.width, canvas.height);
  scheduleNextEvolve(now);
}

function rebuildMesh() {
  const w = canvas.width;
  const h = canvas.height;
  verts = [];
  leaves = [];
  midMap = new Map();
  gridMap = new Map();
  centerMap = new Map();

  const unit = Math.min(w, h);
  const cols = Math.max(2, Math.min(5, Math.round((w / unit) * 2.2)));
  const rows = Math.max(2, Math.min(4, Math.round((h / unit) * 2.2)));

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const ia = getGridVertex(gx, gy, cols, rows, w, h);
      const ib = getGridVertex(gx + 1, gy, cols, rows, w, h);
      const ic = getGridVertex(gx + 1, gy + 1, cols, rows, w, h);
      const id = getGridVertex(gx, gy + 1, cols, rows, w, h);
      subdivideQuad(ia, ib, ic, id, 0, w, h);
    }
  }

  mergeTrianglePairs();
  mergeTriangleIntoQuad();

  meshKey = `${w}x${h}:${state.depth}:${state.jitter.toFixed(3)}:${state.mix.toFixed(3)}`;
}

function resizeCanvas() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(1, MAX_SIDE / Math.max(vw, vh));
  const w = Math.max(1, Math.round(vw * scale));
  const h = Math.max(1, Math.round(vh * scale));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    glitchImage = null;
  }
}

function ensureMesh() {
  const key = `${canvas.width}x${canvas.height}:${state.depth}:${state.jitter.toFixed(3)}:${state.mix.toFixed(3)}`;
  if (key !== meshKey) rebuildMesh();
}

function scheduleNextPulse(fromNow = performance.now()) {
  if (state.pulseInterval <= 0) {
    nextPulseAt = Infinity;
    return;
  }
  nextPulseAt = fromNow + state.pulseInterval * 1000;
}

function triggerPulseBurst(now) {
  const w = canvas.width;
  const h = canvas.height;
  pulseBurst.active = true;
  pulseBurst.start = now;
  pulseBurst.originX = Math.random() * w;
  pulseBurst.originY = Math.random() * h;
  pulseBurst.maxRadius = Math.hypot(w, h) * 1.2;
}

function applyBreath(now) {
  const w = canvas.width;
  const h = canvas.height;
  const speedFactor = state.speed / 10;
  const t = REDUCE_MOTION ? 0 : now * 0.0012 * speedFactor;

  for (let i = 0; i < verts.length; i++) {
    const v = verts[i];
    if (v.corner || v.orbitR <= 0 || t === 0) {
      v.x = v.restX;
      v.y = v.restY;
      continue;
    }

    const s = Math.sin(t + v.phase) * v.orbitR;
    if (v.edge === "left" || v.edge === "right") {
      v.x = v.restX;
      v.y = Math.min(h, Math.max(0, v.restY + s));
    } else if (v.edge === "top" || v.edge === "bottom") {
      v.y = v.restY;
      v.x = Math.min(w, Math.max(0, v.restX + s));
    } else {
      v.x = v.restX + Math.cos(t + v.phase) * v.orbitR;
      v.y = v.restY + Math.sin(t * 0.87 + v.phase) * v.orbitR;
    }
  }
}

function pulseGlow(leaf, radius, envelope, band) {
  if (envelope <= 0 || radius <= 0) return 0;

  let cx = 0;
  let cy = 0;
  for (let i = 0; i < leaf.indices.length; i++) {
    const v = verts[leaf.indices[i]];
    cx += v.x;
    cy += v.y;
  }
  cx /= leaf.indices.length;
  cy /= leaf.indices.length;

  const dist = Math.hypot(cx - pulseBurst.originX, cy - pulseBurst.originY);
  const ring = Math.max(0, 1 - Math.abs(dist - radius) / band);
  const depthW = 0.22 + 0.78 * (leaf.depth / Math.max(1, state.depth));
  return ring * ring * depthW * envelope;
}

function applyGlitchPost(now, w, h) {
  if (state.glitch <= 0) return;

  const scale = Math.min(1, GLITCH_MAX_SIDE / Math.max(w, h));
  const gw = Math.max(1, Math.round(w * scale));
  const gh = Math.max(1, Math.round(h * scale));

  if (glitchCanvas.width !== gw || glitchCanvas.height !== gh) {
    glitchCanvas.width = gw;
    glitchCanvas.height = gh;
    glitchImage = glitchCtx.createImageData(gw, gh);
    glitchData = glitchImage.data;
    glitchSource = new Uint8ClampedArray(glitchData.length);
  }

  glitchCtx.imageSmoothingEnabled = true;
  glitchCtx.drawImage(canvas, 0, 0, gw, gh);
  const sampled = glitchCtx.getImageData(0, 0, gw, gh);
  glitchSource.set(sampled.data);
  AbsGlitchPost.applyPostProcess(now, glitchSource, glitchData, gw, gh, state, FRAME_MS);
  glitchCtx.putImageData(glitchImage, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(glitchCanvas, 0, 0, w, h);
}

function paint(now) {
  const w = canvas.width;
  const h = canvas.height;
  if (w < 1 || h < 1) return;

  ensureMesh();
  evolveTopology(now);
  applyBreath(now);

  if (!REDUCE_MOTION && state.pulseInterval > 0 && !pulseBurst.active && now >= nextPulseAt) {
    triggerPulseBurst(now);
    scheduleNextPulse(now);
  }

  let pulseRadius = 0;
  let pulseEnvelope = 0;
  if (pulseBurst.active) {
    const burstDuration = PULSE_BASE_DURATION_MS / state.pulseSpeed;
    const t = (now - pulseBurst.start) / burstDuration;
    if (t >= 1) {
      pulseBurst.active = false;
    } else {
      pulseEnvelope = 1 - t * t;
      pulseRadius = t * pulseBurst.maxRadius;
    }
  }

  const colors = PALETTES[state.palette] || PALETTES[defaults.palette];
  const bg = colors[0];
  const lead = [
    Math.max(0, bg[0] * 0.18),
    Math.max(0, bg[1] * 0.18),
    Math.max(0, bg[2] * 0.22)
  ];
  const highlight = colors[colors.length - 1];
  const speedFactor = state.speed / 10;
  const drift = REDUCE_MOTION ? 0 : now * 0.00006 * (0.25 + speedFactor);
  const band = Math.hypot(w, h) * PULSE_BAND_RATIO;
  const leadWidth = Math.max(0.85, Math.min(w, h) * 0.0042);

  ctx.fillStyle = rgbCss(bg[0] * 0.45, bg[1] * 0.45, bg[2] * 0.5);
  ctx.fillRect(0, 0, w, h);
  ctx.lineJoin = "round";
  ctx.lineWidth = leadWidth;

  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i];
    const tint = fract(leaf.tint + drift + leaf.depth * 0.07);
    let rgb = sampleRamp(colors, tint * 0.92 + 0.04);
    const glow = pulseGlow(leaf, pulseRadius, pulseEnvelope, band);
    if (glow > 0.01) {
      rgb = [
        lerp(rgb[0], highlight[0], glow * 0.55) + glow * 90,
        lerp(rgb[1], highlight[1], glow * 0.55) + glow * 70,
        lerp(rgb[2], highlight[2], glow * 0.55) + glow * 50
      ];
    }

    const first = verts[leaf.indices[0]];
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (let v = 1; v < leaf.indices.length; v++) {
      const pt = verts[leaf.indices[v]];
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = rgbCss(
      Math.min(255, rgb[0]),
      Math.min(255, rgb[1]),
      Math.min(255, rgb[2])
    );
    ctx.fill();
    ctx.strokeStyle = rgbCss(lead[0], lead[1], lead[2]);
    ctx.stroke();
  }

  applyGlitchPost(now, w, h);
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
  params.set("depth", String(state.depth));
  params.set("jitter", String(state.jitter));
  params.set("mix", String(state.mix));
  params.set("speed", String(state.speed));
  params.set("evolve", String(state.evolve));
  params.set("pulseInterval", String(state.pulseInterval));
  params.set("pulseSpeed", String(state.pulseSpeed));
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

function formatPulseInterval(seconds) {
  return seconds <= 0 ? "Off" : `${seconds.toFixed(1)}s`;
}

function syncInputs() {
  depthSlider.value = state.depth;
  depthValue.textContent = String(state.depth);
  jitterSlider.value = state.jitter;
  jitterValue.textContent = AbsGlitchPost.formatPercent(state.jitter);
  mixSlider.value = state.mix;
  mixValue.textContent = AbsGlitchPost.formatPercent(state.mix);
  speedSlider.value = state.speed;
  speedValue.textContent = state.speed.toFixed(1);
  evolveSlider.value = state.evolve;
  evolveValue.textContent = state.evolve.toFixed(1);
  pulseIntervalSlider.value = state.pulseInterval;
  pulseIntervalValue.textContent = formatPulseInterval(state.pulseInterval);
  pulseSpeedSlider.value = state.pulseSpeed;
  pulseSpeedValue.textContent = `${state.pulseSpeed.toFixed(2)}x`;
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
  resizeCanvas();
  ensureMesh();
  applySettingsMode();
  applySide();
  syncInputs();
  scheduleNextPulse();
  scheduleNextEvolve();
  repaintNow();
}

function resetParam(key) {
  switch (key) {
    case "depth":
      state.depth = defaults.depth;
      break;
    case "jitter":
      state.jitter = defaults.jitter;
      break;
    case "mix":
      state.mix = defaults.mix;
      break;
    case "speed":
      state.speed = defaults.speed;
      break;
    case "evolve":
      state.evolve = defaults.evolve;
      if (!REDUCE_MOTION) scheduleNextEvolve();
      break;
    case "pulseInterval":
      state.pulseInterval = defaults.pulseInterval;
      if (!pulseBurst.active) scheduleNextPulse();
      break;
    case "pulseSpeed":
      state.pulseSpeed = defaults.pulseSpeed;
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
  if (key === "depth" || key === "jitter" || key === "mix") ensureMesh();
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

depthSlider.addEventListener("input", (e) => {
  state.depth = clampDepth(Number.parseFloat(e.target.value));
  ensureMesh();
  syncInputs();
  repaintNow();
  updateURL();
});

jitterSlider.addEventListener("input", (e) => {
  state.jitter = clampJitter(Number.parseFloat(e.target.value));
  ensureMesh();
  syncInputs();
  repaintNow();
  updateURL();
});

mixSlider.addEventListener("input", (e) => {
  state.mix = clampMix(Number.parseFloat(e.target.value));
  ensureMesh();
  syncInputs();
  repaintNow();
  updateURL();
});

speedSlider.addEventListener("input", (e) => {
  state.speed = clampSpeed(Number.parseFloat(e.target.value));
  syncInputs();
  updateURL();
});

evolveSlider.addEventListener("input", (e) => {
  state.evolve = clampEvolve(Number.parseFloat(e.target.value));
  scheduleNextEvolve();
  syncInputs();
  updateURL();
});

pulseIntervalSlider.addEventListener("input", (e) => {
  state.pulseInterval = clampPulseInterval(Number.parseFloat(e.target.value));
  syncInputs();
  if (!pulseBurst.active) scheduleNextPulse();
  updateURL();
});

pulseSpeedSlider.addEventListener("input", (e) => {
  state.pulseSpeed = clampPulseSpeed(Number.parseFloat(e.target.value));
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
  state.palette = defaults.palette;
  state.depth = defaults.depth;
  state.jitter = defaults.jitter;
  state.mix = defaults.mix;
  state.speed = defaults.speed;
  state.evolve = defaults.evolve;
  state.pulseInterval = defaults.pulseInterval;
  state.pulseSpeed = defaults.pulseSpeed;
  state.glitch = defaults.glitch;
  state.glitchShift = defaults.glitchShift;
  state.glitchChroma = defaults.glitchChroma;
  state.glitchBulge = defaults.glitchBulge;
  state.glitchRate = defaults.glitchRate;
  state.vignette = defaults.vignette;
  state.vignetteStrength = defaults.vignetteStrength;
  state.side = defaults.side;
  pulseBurst.active = false;
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
  resizeCanvas();
  ensureMesh();
  repaintNow();
});

applyAll();
updateURL();
if (!REDUCE_MOTION) startAnimation();
