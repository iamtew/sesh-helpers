(function (global) {
  const THEME_ID = "sesh-glass";

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

  function start(panelEl, pulseSpeed) {
    if (!panelEl) return;
    stop(panelEl);

    const run = { id: 0, cancelled: false };

    function tick(ts) {
      if (run.cancelled) return;
      applyChromaticPulse(panelEl, ts, pulseSpeed);
      run.id = requestAnimationFrame(tick);
    }

    run.id = requestAnimationFrame(tick);
    runners.set(panelEl, run);
  }

  function stop(panelEl) {
    if (!panelEl) return;
    const run = runners.get(panelEl);
    if (!run) return;
    run.cancelled = true;
    cancelAnimationFrame(run.id);
    runners.delete(panelEl);
    panelEl.style.removeProperty("--theme-text-shadow");
    panelEl.style.removeProperty("text-shadow");
  }

  global.SeshThemes = global.SeshThemes || { catalog: [], effects: {} };
  global.SeshThemes.catalog = global.SeshThemes.catalog || [];
  global.SeshThemes.effects = global.SeshThemes.effects || {};

  if (!global.SeshThemes.catalog.some(theme => theme.id === THEME_ID)) {
    global.SeshThemes.catalog.push({
      id: THEME_ID,
      name: "Sesh Glass",
      description:
        "Frosted red-to-lime glass with a retro halftone screen. A translucent #F20D0D → #E5F20D gradient sits behind smoked glass (blur + saturate), and a red (#F20D0D) glow pulses on the text."
    });
  }

  global.SeshThemes.effects[THEME_ID] = {
    start,
    stop,
    applyChromaticPulse
  };
})(window);
