(function (global) {
  const THEME_ID = "3026-d3c0";

  // Soft brass glow pulse — placeholder motion for the art-deco skeleton.
  function chromaticShadow(timestamp, pulseSpeed) {
    const speed = pulseSpeed == null ? 3 : pulseSpeed;
    const speedScale = speed <= 0 ? 0 : Math.max(0.1, speed / 5);
    const pulse = (Math.sin(timestamp * 0.003 * speedScale) + 1) / 2;
    const intensity = 0.2 + pulse * 0.8;

    const glowSpread = 4 + intensity * 14;
    const primaryAlpha = 0.2 + intensity * 0.5;
    const softAlpha = 0.1 + intensity * 0.28;

    return (
      `0px 0px ${glowSpread}px rgba(201, 162, 74, ${primaryAlpha}), ` +
      `0px 0px ${glowSpread + 8}px rgba(201, 162, 74, ${softAlpha})`
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
      name: "3026 D3C0",
      description:
        "Futuristic art deco overlay — deep onyx glass, brass geometry, champagne readout text, and a soft gold pulse. Skeleton; refine tokens and surface detail later.",
      preferredDisplay: "Lemondrop",
      preferredRegular: "Brighton Sans NBP"
    });
  }

  global.SeshThemes.effects[THEME_ID] = {
    start,
    stop,
    applyChromaticPulse
  };
})(window);
