(function (global) {
  const THEME_ID = "sesh-glass";
  const CANVAS_CLASS = "sesh-glass-pixi";
  const EMBER_COUNT = 40;
  const WISP_COUNT = 14;
  const BED_COUNT = 2;
  const WISP_W = 96;
  const WISP_H = 160;
  const COAL_W = 128;
  const COAL_H = 48;

  // The shared API kept its chromatic-pulse name; this theme intentionally
  // produces a monochrome red glow rather than LCD-style color separation.
  function chromaticShadow(timestamp, pulseSpeed) {
    const speed = pulseSpeed == null ? 3 : pulseSpeed;
    const speedScale = speed <= 0 ? 0 : Math.max(0.1, speed / 5);
    const pulse = (Math.sin(timestamp * 0.003 * speedScale) + 1) / 2;
    const intensity = 0.2 + pulse * 0.8;

    const glowSpread = 4 + intensity * 16;
    const primaryAlpha = 0.2 + intensity * 0.55;
    const softAlpha = 0.1 + intensity * 0.3;

    return (
      `0px 0px ${glowSpread}px rgba(242, 13, 13, ${primaryAlpha}), ` +
      `0px 0px ${glowSpread + 8}px rgba(242, 13, 13, ${softAlpha})`
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
      n2(x * 4.13 + 1.7, y * 3.71 + 5.4) * 0.14 +
      n2(x * 8.03, y * 7.19) * 0.08
    );
  }

  // Weak spring + noisy accel so values wander instead of rocking 1D noise.
  function wander(state, key, velKey, accel, dt, spring, damp) {
    state[velKey] += (accel - state[key] * spring) * dt;
    state[velKey] *= Math.exp(-damp * dt);
    state[key] += state[velKey] * dt;
  }

  function noiseCanvas(w, h, alpha) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = 70 + Math.random() * 140;
      d[i] = n;
      d[i + 1] = n * 0.72;
      d[i + 2] = n * 0.4;
      d[i + 3] = alpha;
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  function paintBlob(ctx, w, cy, rx, ry, ox, inner, outer) {
    const cx = w * 0.5 + ox;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    g.addColorStop(0, inner);
    g.addColorStop(0.55, outer);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft stacked glows, not a teardrop outline — displacement will shred the rest.
  function wispTexture(PIXI, variant) {
    const w = WISP_W;
    const h = WISP_H;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    const lean = variant === 1 ? -10 : variant === 2 ? 10 : 0;

    ctx.globalCompositeOperation = "lighter";
    paintBlob(ctx, w, h * 0.88, w * 0.42, h * 0.2, lean * 0.15, "rgba(242,13,13,0.95)", "rgba(180,20,0,0.35)");
    paintBlob(ctx, w, h * 0.68, w * 0.32, h * 0.22, lean * 0.4, "rgba(255,77,0,0.9)", "rgba(242,13,13,0.2)");
    paintBlob(ctx, w, h * 0.46, w * 0.22, h * 0.22, -lean * 0.35, "rgba(255,170,0,0.8)", "rgba(255,77,0,0.15)");
    paintBlob(ctx, w, h * 0.26, w * 0.13, h * 0.2, lean * 0.25, "rgba(255,200,40,0.45)", "rgba(255,170,0,0.08)");
    paintBlob(ctx, w, h * 0.08, w * 0.07, h * 0.14, 0, "rgba(229,242,13,0.35)", "rgba(255,200,40,0.05)");

    ctx.globalCompositeOperation = "destination-in";
    const fade = ctx.createLinearGradient(0, h, 0, 0);
    fade.addColorStop(0, "rgba(0,0,0,1)");
    fade.addColorStop(0.78, "rgba(0,0,0,1)");
    fade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 0.28;
    ctx.drawImage(noiseCanvas(w, h, 200), 0, 0);

    return PIXI.Texture.from(c);
  }

  function coalTexture(PIXI) {
    const w = COAL_W;
    const h = COAL_H;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(w / 2, h * 0.8, 2, w / 2, h * 0.65, w * 0.55);
    g.addColorStop(0, "rgba(255,77,0,0.95)");
    g.addColorStop(0.4, "rgba(242,13,13,0.7)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return PIXI.Texture.from(c);
  }

  function dispTexture(PIXI) {
    const small = noiseCanvas(32, 32, 255);
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

  function streakTexture(PIXI) {
    const w = 8;
    const h = 32;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    for (let x = 0; x < w; x++) {
      const across = 1 - Math.abs(x - (w - 1) / 2) / (w / 2);
      const edge = across * across;
      const g = ctx.createLinearGradient(0, h, 0, 0);
      g.addColorStop(0, "rgba(242,13,13,0)");
      g.addColorStop(0.22, "rgba(242,13,13," + (0.45 * edge) + ")");
      g.addColorStop(0.5, "rgba(255,77,0," + (0.95 * edge) + ")");
      g.addColorStop(0.78, "rgba(229,242,13," + edge + ")");
      g.addColorStop(1, "rgba(255,255,220,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 1, h);
    }
    return PIXI.Texture.from(c);
  }

  function grainTexture(PIXI) {
    return PIXI.Texture.from(noiseCanvas(64, 64, 255));
  }

  function resetEmber(e, w, h, scatter) {
    e.s.x = Math.random() * w;
    e.s.y = scatter ? h * (0.4 + Math.random() * 0.6) : h * (0.78 + Math.random() * 0.2);
    e.vy = -(70 + Math.random() * 130);
    e.vx = (Math.random() - 0.5) * 36;
    e.life = 0.35 + Math.random() * 0.7;
    e.age = scatter ? Math.random() * e.life : 0;
    e.base = 0.45 + Math.random() * 0.55;
    e.len = 0.45 + Math.random() * 0.55;
    e.wob = 2 + Math.random() * 4;
    e.wph = Math.random() * Math.PI * 2;
    e.s.tint = Math.random() < 0.35 ? 0xe5f20d : Math.random() < 0.5 ? 0xff4d00 : 0xf20d0d;
  }

  function makeFlameSprite(PIXI, tex, spec) {
    const s = new PIXI.Sprite(tex);
    s.anchor.set(0.5, 1);
    s.blendMode = spec.add ? "add" : "normal";
    return {
      s: s,
      nx: spec.nx,
      ph: spec.ph,
      sp: spec.sp,
      sxMul: spec.sxMul,
      syMul: spec.syMul,
      baseA: spec.baseA,
      coal: !!spec.coal,
      tw: spec.tw,
      th: spec.th,
      sway: 0,
      lick: 0,
      rot: 0,
      flick: 0,
      vs: 0,
      vl: 0,
      vr: 0,
      vf: 0
    };
  }

  function buildFire(PIXI, app, w, h) {
    const wispA = wispTexture(PIXI, 0);
    const wispB = wispTexture(PIXI, 1);
    const wispC = wispTexture(PIXI, 2);
    const wisps = [wispA, wispB, wispC];
    const coalTex = coalTexture(PIXI);
    const streakTex = streakTexture(PIXI);
    const grainTex = grainTexture(PIXI);
    const mapTex = dispTexture(PIXI);

    const flameLayer = new PIXI.Container();
    const emberLayer = new PIXI.Container();
    app.stage.addChild(flameLayer);
    app.stage.addChild(emberLayer);

    const flames = [];
    for (let i = 0; i < BED_COUNT; i++) {
      const spec = {
        nx: 0.3 + i * 0.4,
        ph: i * 2.1,
        sp: 1.05 + i * 0.12,
        sxMul: 0.7,
        syMul: 0.16,
        baseA: 0.95,
        coal: true,
        add: false,
        tw: COAL_W,
        th: COAL_H
      };
      const f = makeFlameSprite(PIXI, coalTex, spec);
      flameLayer.addChild(f.s);
      flames.push(f);
    }
    for (let i = 0; i < WISP_COUNT; i++) {
      const hot = i % 3 !== 1;
      const spec = {
        nx: 0.05 + (i / (WISP_COUNT - 1)) * 0.9 + Math.sin(i * 1.9) * 0.04,
        ph: i * 1.37,
        sp: 1.6 + (i % 5) * 0.35,
        sxMul: 0.16 + (i % 4) * 0.04,
        syMul: [0.95, 1.55, 1.1, 1.35, 1.75, 1.0, 1.5, 1.2, 1.65, 1.05, 1.42, 1.8, 0.98, 1.28][i],
        baseA: hot ? 0.7 : 0.85,
        coal: false,
        add: hot,
        tw: WISP_W,
        th: WISP_H
      };
      const f = makeFlameSprite(PIXI, wisps[i % wisps.length], spec);
      f.s.tint = [0xffffff, 0xff6a3c, 0xffaa44, 0xf20d0d, 0xffffff, 0xff8833][i % 6];
      flameLayer.addChild(f.s);
      flames.push(f);
    }

    const Tiling = PIXI.TilingSprite;
    let disp = null;
    let dispFilter = null;
    if (PIXI.DisplacementFilter) {
      disp = new Tiling({ texture: mapTex, width: w * 2, height: h * 2 });
      disp.alpha = 0;
      app.stage.addChild(disp);
      dispFilter = new PIXI.DisplacementFilter({
        sprite: disp,
        scale: { x: 22, y: 48 }
      });
      flameLayer.filters = [dispFilter];
    }

    const grain = new Tiling({ texture: grainTex, width: w, height: h });
    grain.blendMode = "multiply";
    grain.alpha = 0.12;
    app.stage.addChild(grain);

    const embers = [];
    for (let i = 0; i < EMBER_COUNT; i++) {
      const s = new PIXI.Sprite(streakTex);
      s.anchor.set(0.5, 0.5);
      s.blendMode = "add";
      emberLayer.addChild(s);
      embers.push({ s: s });
    }

    return {
      flames: flames,
      embers: embers,
      grain: grain,
      disp: disp,
      dispFilter: dispFilter,
      textures: [wispA, wispB, wispC, coalTex, streakTex, grainTex, mapTex]
    };
  }

  function layoutFire(fire, w, h) {
    for (let i = 0; i < fire.flames.length; i++) {
      const f = fire.flames[i];
      f.s.x = w * f.nx;
      f.s.y = h + h * 0.04;
    }
    fire.grain.width = w;
    fire.grain.height = h;
    if (fire.disp) {
      fire.disp.width = w * 2;
      fire.disp.height = h * 2;
    }
    if (fire.dispFilter && fire.dispFilter.scale) {
      fire.dispFilter.scale.x = Math.max(16, w * 0.18);
      fire.dispFilter.scale.y = Math.max(18, h * 0.22);
    }
  }

  function tickFire(app, fire, now, dt) {
    const t = now * 0.001;
    const w = app.renderer.width;
    const h = app.renderer.height;

    fire.grain.tilePosition.y -= 40 * dt;
    if (fire.disp) {
      fire.disp.tilePosition.x += (40 + 28 * fbm2(t * 0.55, t * 0.33 + 4)) * dt;
      fire.disp.tilePosition.y -= (58 + 32 * fbm2(t * 0.44 + 5, t * 0.62)) * dt;
    }
    if (fire.dispFilter && fire.dispFilter.scale) {
      const bx = Math.max(16, w * 0.18);
      const by = Math.max(18, h * 0.22);
      const breathe = 0.85 + 0.2 * (0.5 + 0.5 * fbm2(t * 0.32, t * 0.41 + 2));
      fire.dispFilter.scale.x = bx * breathe;
      fire.dispFilter.scale.y = by * (0.9 + 0.15 * (0.5 + 0.5 * fbm2(t * 0.36 + 6, t * 0.19)));
    }

    for (let i = 0; i < fire.flames.length; i++) {
      const f = fire.flames[i];
      const tx = t * (0.52 + f.sp * 0.14) + f.ph;
      const ty = t * (0.71 + f.ph * 0.04) + i * 0.7;
      wander(f, "sway", "vs", fbm2(tx, ty) * 11, dt, 1.8, 3.8);
      wander(f, "lick", "vl", fbm2(tx + 11, ty * 1.17 + 3) * 20, dt, 2.4, 4.6);
      wander(f, "rot", "vr", fbm2(ty + 7, tx * 0.83) * 14, dt, 2.1, 4.2);
      wander(f, "flick", "vf", fbm2(tx * 1.3 + 19, ty + 5) * 10, dt, 2.6, 3.8);
      const nSway = f.sway;
      const nLick = f.lick;
      const flicker = 0.62 + 0.28 * (0.5 + 0.5 * Math.max(-1, Math.min(1, f.flick)));
      const sx = w * f.sxMul * (0.94 + 0.08 * Math.max(-1, Math.min(1, nSway)));
      const sy = h * f.syMul * (f.coal ? 0.9 + 0.12 * flicker : 0.88 + 0.22 * flicker);
      f.s.x =
        w * f.nx +
        nSway * w * (f.coal ? 0.018 : 0.055) +
        nLick * w * (f.coal ? 0.006 : 0.022);
      f.s.y = h + h * 0.04;
      f.s.scale.set(sx / f.tw, sy / f.th);
      f.s.rotation = f.coal ? 0 : f.rot * 0.2;
      f.s.skew.x = f.coal ? 0 : nLick * 0.32;
      f.s.alpha = f.baseA * (f.coal ? 0.88 + 0.12 * flicker : 0.7 + 0.3 * flicker);
    }

    for (let i = 0; i < fire.embers.length; i++) {
      const e = fire.embers[i];
      e.age += dt;
      if (e.age >= e.life || e.s.y < -16) {
        resetEmber(e, w, h, false);
        continue;
      }
      const p = e.age / e.life;
      e.s.y += e.vy * dt;
      e.s.x += e.vx * dt + Math.sin(e.age * e.wob + e.wph) * 22 * dt;
      if (e.s.x < 0) e.s.x += w;
      if (e.s.x > w) e.s.x -= w;
      e.s.rotation = Math.atan2(e.vy, e.vx) + Math.PI / 2;
      e.s.alpha = (1 - p) * e.base;
      e.s.scale.set(0.4 + 0.2 * (1 - p), e.len * (0.55 + 0.4 * (1 - p)));
    }
  }

  function seedEmbers(fire, w, h) {
    for (let i = 0; i < fire.embers.length; i++) {
      resetEmber(fire.embers[i], w, h, true);
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

    const fire = buildFire(PIXI, app, size.w, size.h);
    run.textures = fire.textures;
    layoutFire(fire, size.w, size.h);
    seedEmbers(fire, size.w, size.h);

    app.ticker.add(function () {
      if (run.cancelled) return;
      const now = performance.now();
      const dt = Math.min(0.05, app.ticker.deltaMS / 1000);
      tickFire(app, fire, now, dt);
      applyChromaticPulse(panelEl, now, pulseSpeed);
    });

    run.ro = new ResizeObserver(function () {
      if (run.cancelled || !run.app) return;
      const next = panelSize(panelEl);
      run.app.renderer.resize(next.w, next.h);
      layoutFire(fire, next.w, next.h);
    });
    run.ro.observe(panelEl);
  }

  function start(panelEl, pulseSpeed) {
    if (!panelEl) return;
    stop(panelEl);

    const run = { cancelled: false, app: null, raf: 0, ro: null, textures: null };
    runners.set(panelEl, run);

    const PIXI = global.PIXI;
    if (!PIXI || typeof PIXI.Application !== "function") {
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
      name: "Sesh Glass",
      description:
        "Frosted red-to-lime glass with a PixiJS fire bed along the bottom of the panel, rising embers, and a red (#F20D0D) glow pulse on the text.",
      preferredDisplay: "Monster Chiller",
      preferredRegular: "Londrina Solid"
    });
  }

  global.SeshThemes.effects[THEME_ID] = {
    start: start,
    stop: stop,
    applyChromaticPulse: applyChromaticPulse
  };
})(window);
