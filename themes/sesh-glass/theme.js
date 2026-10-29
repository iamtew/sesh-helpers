(function (global) {
  const THEME_ID = "sesh-glass";
  const CANVAS_CLASS = "sesh-glass-pixi";

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

  function buildBlobs(PIXI, app) {
    const blobs = [];
    const colors = [0xf20d0d, 0xe5f20d, 0xff4d00, 0xf20d0d, 0xc8e000];
    for (let i = 0; i < 5; i++) {
      const g = new PIXI.Graphics();
      const r = 90 + i * 28;
      g.circle(0, 0, r);
      g.fill({ color: colors[i % colors.length], alpha: 0.5 });
      app.stage.addChild(g);
      blobs.push({
        g: g,
        sp: 0.18 + i * 0.04,
        ph: i * 1.37
      });
    }
    if (PIXI.BlurFilter) {
      app.stage.filters = [new PIXI.BlurFilter({ strength: 28, quality: 2 })];
    }
    return blobs;
  }

  function tickBlobs(app, blobs, now) {
    const t = now * 0.001;
    const w = app.renderer.width;
    const h = app.renderer.height;
    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i];
      b.g.x = w * (0.18 + 0.64 * (0.5 + 0.5 * Math.sin(t * b.sp + b.ph)));
      b.g.y = h * (0.18 + 0.64 * (0.5 + 0.5 * Math.cos(t * b.sp * 0.82 + b.ph * 0.7)));
      const s = 0.8 + 0.28 * Math.sin(t * b.sp * 1.1 + b.ph);
      b.g.scale.set(s);
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

    const blobs = buildBlobs(PIXI, app);

    app.ticker.add(function () {
      if (run.cancelled) return;
      const now = performance.now();
      tickBlobs(app, blobs, now);
      applyChromaticPulse(panelEl, now, pulseSpeed);
    });

    run.ro = new ResizeObserver(function () {
      if (run.cancelled || !run.app) return;
      const next = panelSize(panelEl);
      run.app.renderer.resize(next.w, next.h);
    });
    run.ro.observe(panelEl);
  }

  function start(panelEl, pulseSpeed) {
    if (!panelEl) return;
    stop(panelEl);

    const run = { cancelled: false, app: null, raf: 0, ro: null };
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
        "Frosted red-to-lime glass with a live PixiJS warp of the #F20D0D → #E5F20D gradient, a retro halftone screen on top, and a red (#F20D0D) glow pulse on the text.",
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
