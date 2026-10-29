(function (global) {
  const THEME_ID = "lcd-glass";
  const CANVAS_CLASS = "lcd-glass-pixi";
  const MOTE_COUNT = 18;
  const WASH_W = 128;
  const GLOW_W = 160;
  const RIM_W = 256;
  const RIM_H = 48;
  const MOTE_W = 8;

  function chromaticShadow(timestamp, pulseSpeed) {
    const speed = pulseSpeed == null ? 3 : pulseSpeed;
    const speedScale = speed <= 0 ? 0 : Math.max(0.1, speed / 5);
    const pulse = (Math.sin(timestamp * 0.003 * speedScale) + 1) / 2;
    const intensity = 0.2 + pulse * 0.8;

    const glowSpread = 4 + intensity * 16;
    const sideOffset = 1.5 + intensity * 5;
    const primaryAlpha = 0.2 + intensity * 0.55;
    const secondaryAlpha = 0.12 + intensity * 0.3;
    const tertiaryAlpha = 0.08 + intensity * 0.25;

    return (
      `0px 0px ${glowSpread}px rgba(209, 76, 255, ${primaryAlpha}), ` +
      `${sideOffset}px 0px ${glowSpread - 4}px rgba(255, 0, 255, ${secondaryAlpha}), ` +
      `${-sideOffset}px 0px ${glowSpread - 4}px rgba(0, 255, 255, ${tertiaryAlpha})`
    );
  }

  function applyChromaticPulse(panelEl, timestamp, pulseSpeed) {
    if (!panelEl) return;
    const shadow = chromaticShadow(timestamp, pulseSpeed);
    panelEl.style.setProperty("--theme-text-shadow", shadow);
    panelEl.style.textShadow = shadow;
  }

  const runners = new WeakMap();

  function panelSize(panelEl) {
    const box = panelEl.getBoundingClientRect();
    const w = Math.max(1, Math.round(box.width || panelEl.clientWidth || 1));
    const h = Math.max(1, Math.round(box.height || panelEl.clientHeight || 1));
    return { w: w, h: h };
  }

  function startPulseOnly(panelEl, pulseSpeed, run) {
    function tick(ts) {
      if (run.cancelled) return;
      applyChromaticPulse(panelEl, ts, pulseSpeed);
      run.raf = requestAnimationFrame(tick);
    }
    run.raf = requestAnimationFrame(tick);
  }

  function hash2(ix, iy) {
    const s = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  }

  function n2(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const a = hash2(ix, iy);
    const b = hash2(ix + 1, iy);
    const c = hash2(ix, iy + 1);
    const d = hash2(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }

  function fbm2(x, y) {
    return (
      n2(x, y) * 0.5 +
      n2(x * 2.07 + 3.1, y * 1.93 + 8.2) * 0.28 +
      n2(x * 4.13 + 1.7, y * 3.71 + 5.4) * 0.14
    );
  }

  function noiseCanvas(w, h, alpha, tint) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = 80 + Math.random() * 140;
      d[i] = n * (tint ? tint[0] : 0.7);
      d[i + 1] = n * (tint ? tint[1] : 0.88);
      d[i + 2] = n * (tint ? tint[2] : 1);
      d[i + 3] = alpha;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  function blobTexture(PIXI, inner, outer) {
    const w = WASH_W;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = w;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, inner);
    g.addColorStop(0.55, outer);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
    return PIXI.Texture.from(c);
  }

  function rimTexture(PIXI) {
    const w = RIM_W;
    const h = RIM_H;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(224,254,254,0.55)");
    g.addColorStop(0.35, "rgba(170,220,255,0.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const side = ctx.createLinearGradient(0, 0, w, 0);
    side.addColorStop(0, "rgba(0,0,0,0.55)");
    side.addColorStop(0.18, "rgba(0,0,0,0)");
    side.addColorStop(0.82, "rgba(0,0,0,0)");
    side.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, w, h);
    return PIXI.Texture.from(c);
  }

  function moteTexture(PIXI) {
    const w = MOTE_W;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = w;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, "rgba(224,254,254,0.95)");
    g.addColorStop(0.4, "rgba(0,255,255,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
    return PIXI.Texture.from(c);
  }

  function dispTexture(PIXI) {
    const small = noiseCanvas(32, 32, 255, [0.75, 0.9, 1]);
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(small, 0, 0, 128, 128);
    const tex = PIXI.Texture.from(c);
    if (tex.source && tex.source.style) tex.source.style.addressMode = "repeat";
    return tex;
  }

  function resetMote(m, w, h, scatter) {
    m.s.x = Math.random() * w;
    m.s.y = scatter ? Math.random() * h : h * (0.15 + Math.random() * 0.7);
    m.vx = (Math.random() - 0.5) * 8;
    m.vy = -4 - Math.random() * 10;
    m.life = 2.4 + Math.random() * 3.2;
    m.age = scatter ? Math.random() * m.life : 0;
    m.base = 0.18 + Math.random() * 0.28;
    m.sz = 0.35 + Math.random() * 0.55;
  }

  function makeWash(PIXI, tex, spec) {
    const s = new PIXI.Sprite(tex);
    s.anchor.set(0.5);
    s.blendMode = spec.add ? "add" : "normal";
    s.alpha = spec.baseA;
    return {
      s: s,
      nx: spec.nx,
      ny: spec.ny,
      sxMul: spec.sxMul,
      syMul: spec.syMul,
      baseA: spec.baseA,
      ph: spec.ph,
      tw: WASH_W
    };
  }

  function buildPane(PIXI, app, w, h) {
    const navyTex = blobTexture(PIXI, "rgba(14,34,62,0.7)", "rgba(14,34,62,0.12)");
    const cyanTex = blobTexture(PIXI, "rgba(48,92,144,0.55)", "rgba(48,92,144,0.08)");
    const glowTex = blobTexture(PIXI, "rgba(0,255,255,0.22)", "rgba(170,220,255,0.04)");
    const rimTex = rimTexture(PIXI);
    const moteTex = moteTexture(PIXI);
    const grainTex = PIXI.Texture.from(noiseCanvas(64, 64, 255, [0.65, 0.85, 1]));
    const mapTex = dispTexture(PIXI);

    const washLayer = new PIXI.Container();
    const sparkLayer = new PIXI.Container();
    app.stage.addChild(washLayer);
    app.stage.addChild(sparkLayer);

    const washes = [
      makeWash(PIXI, navyTex, { nx: 0.28, ny: 0.62, sxMul: 1.15, syMul: 1.05, baseA: 0.85, ph: 0.2, add: false }),
      makeWash(PIXI, cyanTex, { nx: 0.72, ny: 0.32, sxMul: 1.05, syMul: 0.95, baseA: 0.7, ph: 1.4, add: false }),
      makeWash(PIXI, cyanTex, { nx: 0.5, ny: 0.5, sxMul: 0.85, syMul: 0.8, baseA: 0.45, ph: 2.6, add: true })
    ];
    for (let i = 0; i < washes.length; i++) washLayer.addChild(washes[i].s);

    const glow = new PIXI.Sprite(glowTex);
    glow.anchor.set(0.5);
    glow.blendMode = "add";
    glow.alpha = 0.55;
    washLayer.addChild(glow);

    const rim = new PIXI.Sprite(rimTex);
    rim.anchor.set(0.5, 0);
    rim.blendMode = "add";
    rim.alpha = 0.7;
    sparkLayer.addChild(rim);

    const Tiling = PIXI.TilingSprite;
    let disp = null;
    let dispFilter = null;
    if (PIXI.DisplacementFilter) {
      disp = new Tiling({ texture: mapTex, width: w * 2, height: h * 2 });
      disp.alpha = 0;
      app.stage.addChild(disp);
      dispFilter = new PIXI.DisplacementFilter({
        sprite: disp,
        scale: { x: 8, y: 6 }
      });
      washLayer.filters = [dispFilter];
    }

    const grain = new Tiling({ texture: grainTex, width: w, height: h });
    grain.blendMode = "multiply";
    grain.alpha = 0.1;
    app.stage.addChild(grain);

    const motes = [];
    for (let i = 0; i < MOTE_COUNT; i++) {
      const s = new PIXI.Sprite(moteTex);
      s.anchor.set(0.5);
      s.blendMode = "add";
      sparkLayer.addChild(s);
      motes.push({ s: s });
    }

    return {
      washes: washes,
      glow: glow,
      rim: rim,
      motes: motes,
      grain: grain,
      disp: disp,
      dispFilter: dispFilter,
      textures: [navyTex, cyanTex, glowTex, rimTex, moteTex, grainTex, mapTex]
    };
  }

  function layoutPane(pane, w, h) {
    for (let i = 0; i < pane.washes.length; i++) {
      const b = pane.washes[i];
      b.s.x = w * b.nx;
      b.s.y = h * b.ny;
      b.s.scale.set((w * b.sxMul) / b.tw, (h * b.syMul) / b.tw);
    }
    pane.glow.x = w * 0.5;
    pane.glow.y = h * 0.48;
    pane.glow.scale.set((w * 0.7) / GLOW_W, (h * 0.55) / GLOW_W);
    pane.rim.x = w * 0.5;
    pane.rim.y = 0;
    pane.rim.scale.set(w / RIM_W, Math.max(10, h * 0.18) / RIM_H);
    pane.grain.width = w;
    pane.grain.height = h;
    if (pane.disp) {
      pane.disp.width = w * 2;
      pane.disp.height = h * 2;
    }
    if (pane.dispFilter && pane.dispFilter.scale) {
      pane.dispFilter.scale.x = Math.max(5, w * 0.012);
      pane.dispFilter.scale.y = Math.max(4, h * 0.018);
    }
  }

  function tickPane(app, pane, now, dt) {
    const t = now * 0.001;
    const w = app.renderer.width;
    const h = app.renderer.height;

    pane.grain.tilePosition.x += 6 * dt;
    pane.grain.tilePosition.y += 4 * dt;
    if (pane.disp) {
      pane.disp.tilePosition.x += (10 + 6 * fbm2(t * 0.18, t * 0.14 + 2)) * dt;
      pane.disp.tilePosition.y += (8 + 5 * fbm2(t * 0.12 + 3, t * 0.2)) * dt;
    }

    for (let i = 0; i < pane.washes.length; i++) {
      const b = pane.washes[i];
      const n = fbm2(t * 0.22 + b.ph, t * 0.17 + i);
      b.s.x = w * b.nx + n * w * 0.03;
      b.s.y = h * b.ny + fbm2(t * 0.15 + i, b.ph) * h * 0.025;
      b.s.alpha = b.baseA * (0.88 + 0.12 * (0.5 + 0.5 * n));
    }

    const breathe = 0.5 + 0.5 * fbm2(t * 0.28, t * 0.21 + 4);
    pane.glow.alpha = 0.42 + 0.22 * breathe;
    pane.glow.scale.set(
      (w * (0.66 + 0.08 * breathe)) / GLOW_W,
      (h * (0.5 + 0.08 * breathe)) / GLOW_W
    );
    pane.rim.alpha = 0.55 + 0.18 * breathe;

    for (let i = 0; i < pane.motes.length; i++) {
      const m = pane.motes[i];
      m.age += dt;
      if (m.age >= m.life || m.s.y < -8) {
        resetMote(m, w, h, false);
        continue;
      }
      const p = m.age / m.life;
      m.s.x += m.vx * dt;
      m.s.y += m.vy * dt;
      if (m.s.x < -8) m.s.x += w + 16;
      if (m.s.x > w + 8) m.s.x -= w + 16;
      m.s.alpha = m.base * (p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8);
      const sz = m.sz * Math.max(0.45, h / 90);
      m.s.scale.set(sz);
    }
  }

  function seedMotes(pane, w, h) {
    for (let i = 0; i < pane.motes.length; i++) {
      resetMote(pane.motes[i], w, h, true);
    }
  }

  function destroyTextures(list) {
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      try {
        list[i].destroy(true);
      } catch (err) {
        /* texture teardown is best-effort */
      }
    }
  }

  async function bootPixi(panelEl, pulseSpeed, run, PIXI) {
    const app = new PIXI.Application();
    const size = panelSize(panelEl);
    await app.init({
      width: size.w,
      height: size.h,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(global.devicePixelRatio || 1, 2),
      preference: "webgl"
    });
    if (run.cancelled) {
      app.destroy(true);
      return;
    }

    run.app = app;
    app.canvas.className = CANVAS_CLASS;
    app.canvas.style.position = "absolute";
    app.canvas.style.inset = "0";
    app.canvas.style.width = "100%";
    app.canvas.style.height = "100%";
    app.canvas.style.pointerEvents = "none";
    panelEl.insertBefore(app.canvas, panelEl.firstChild);

    const pane = buildPane(PIXI, app, size.w, size.h);
    run.textures = pane.textures;
    layoutPane(pane, size.w, size.h);
    seedMotes(pane, size.w, size.h);

    app.ticker.add(function () {
      if (run.cancelled) return;
      const now = performance.now();
      const dt = Math.min(0.05, app.ticker.deltaMS / 1000);
      tickPane(app, pane, now, dt);
      applyChromaticPulse(panelEl, now, pulseSpeed);
    });

    run.ro = new ResizeObserver(function () {
      if (run.cancelled || !run.app) return;
      const next = panelSize(panelEl);
      run.app.renderer.resize(next.w, next.h);
      layoutPane(pane, next.w, next.h);
    });
    run.ro.observe(panelEl);
  }

  function start(panelEl, pulseSpeed) {
    if (!panelEl) return;
    stop(panelEl);

    const run = { cancelled: false, app: null, raf: 0, ro: null, textures: null };
    runners.set(panelEl, run);

    const PIXI = global.PIXI;
    // Hosts pass the panel or an ancestor (#banner). Landing tagline has neither.
    const wantsPane =
      (panelEl.classList && panelEl.classList.contains("theme-panel")) ||
      (panelEl.querySelector && panelEl.querySelector(".theme-panel"));
    if (!wantsPane || !PIXI || typeof PIXI.Application !== "function") {
      startPulseOnly(panelEl, pulseSpeed, run);
      return;
    }

    bootPixi(panelEl, pulseSpeed, run, PIXI).catch(function () {
      if (!run.cancelled) startPulseOnly(panelEl, pulseSpeed, run);
    });
  }

  function stop(panelEl) {
    if (!panelEl) return;
    const run = runners.get(panelEl);
    if (run) {
      run.cancelled = true;
      if (run.raf) cancelAnimationFrame(run.raf);
      if (run.ro) run.ro.disconnect();
      if (run.app) {
        try {
          run.app.destroy(true);
        } catch (err) {
          /* destroy is best-effort so the next theme can start */
        }
      }
      destroyTextures(run.textures);
      runners.delete(panelEl);
    }

    const leftover = panelEl.querySelectorAll("canvas." + CANVAS_CLASS);
    for (let i = 0; i < leftover.length; i++) leftover[i].remove();

    panelEl.style.removeProperty("--theme-text-shadow");
    panelEl.style.removeProperty("text-shadow");
  }

  global.SeshThemes = global.SeshThemes || { catalog: [], effects: {} };
  global.SeshThemes.catalog = global.SeshThemes.catalog || [];
  global.SeshThemes.effects = global.SeshThemes.effects || {};

  if (!global.SeshThemes.catalog.some(function (theme) { return theme.id === THEME_ID; })) {
    global.SeshThemes.catalog.push({
      id: THEME_ID,
      name: "LCD Glass",
      description:
        "Frosted navy-cyan glass pane with a PixiJS caustic wash, specular rim, ice phosphor specks, CRT scanlines with occasional horizontal glitch jitters, and a magenta/cyan chromatic pulse on the ice-blue readout.",
      preferredDisplay: "Better VCR",
      preferredRegular: "Better VCR"
    });
  }

  global.SeshThemes.effects[THEME_ID] = {
    start: start,
    stop: stop,
    applyChromaticPulse: applyChromaticPulse
  };
})(window);
