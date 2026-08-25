(function (global) {
  const THEME_ID = "lcd-glass";

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
      name: "LCD Glass",
      description:
        "Frosted navy-cyan glass with an ice-blue LCD readout. A translucent gradient panel sits behind smoked glass (blur + saturate), and magenta/cyan chromatic fringing pulses on the text like a backlit CRT."
    });
  }

  global.SeshThemes.effects[THEME_ID] = {
    start,
    stop,
    applyChromaticPulse
  };
})(window);
