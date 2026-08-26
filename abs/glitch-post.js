// ABS shared glitch post-process — band shift, chroma, bulge, fuzz.
(function () {
  const defaults = {
    glitch: 0,
    glitchShift: 0.55,
    glitchChroma: 0.45,
    glitchBulge: 0.3,
    glitchRate: 2.5
  };

  function clampAmount(value) {
    return Math.min(1, Math.max(0, value));
  }

  function clampUnit(value) {
    return Math.min(1, Math.max(0, value));
  }

  function clampRate(value) {
    return Math.min(8, Math.max(0.5, value));
  }

  function formatPercent(value) {
    return `${Math.round(value * 100)}%`;
  }

  function hash1(n) {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  function sampleNearest(src, w, h, sx, sy) {
    const ix = Math.max(0, Math.min(w - 1, Math.round(sx)));
    const iy = Math.max(0, Math.min(h - 1, Math.round(sy)));
    const i = (iy * w + ix) * 4;
    return { r: src[i], g: src[i + 1], b: src[i + 2] };
  }

  function glitchMix(now, state) {
    const t = now * 0.001 * state.glitchRate;
    const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2.4));
    const spike = Math.max(0, Math.sin(t * 5.1) * Math.sin(t * 3.3));
    const flash = spike > 0.82 ? 1.35 : 1;
    return state.glitch * pulse * flash;
  }

  function applyPostProcess(now, sourceData, data, w, h, state, frameMs) {
    if (!sourceData || !data || state.glitch <= 0) {
      if (sourceData && data) data.set(sourceData);
      return;
    }

    const mix = glitchMix(now, state);
    if (mix <= 0.001) {
      data.set(sourceData);
      return;
    }

    const cx = w * 0.5;
    const cy = h * 0.5;
    const bandStep = Math.max(2, Math.floor(3 + state.glitchShift * 14));
    const shiftTick = Math.floor(now * 0.001 * state.glitchRate * 6);
    const chromaAmt = state.glitchChroma * mix * 4.5;
    const chromaAngle = now * 0.0022 * state.glitchRate;
    const chromaX = Math.cos(chromaAngle) * chromaAmt;
    const chromaY = Math.sin(chromaAngle) * chromaAmt * 0.35;
    const bulgeAmt = state.glitchBulge * mix * 0.42;
    const fuzzGate = mix * 0.12 * state.glitchRate;
    const frameSeed = Math.floor(now / frameMs);

    for (let gy = 0; gy < h; gy++) {
      const band = Math.floor(gy / bandStep);
      const bandHash = hash1(band * 17.31 + shiftTick * 0.91);
      const bandShift = (bandHash - 0.5) * state.glitchShift * mix * 10;
      const burstShift = bandHash > 0.92 ? (hash1(shiftTick + band) - 0.5) * mix * 18 : 0;

      for (let gx = 0; gx < w; gx++) {
        let sx = gx + bandShift + burstShift;
        let sy = gy;

        const nx = (gx - cx) / Math.max(1, cx);
        const ny = (gy - cy) / Math.max(1, cy);
        const r2 = nx * nx + ny * ny;
        const scale = 1 + bulgeAmt * r2;
        sx = cx + (sx - cx) / scale;
        sy = cy + (sy - cy) / scale;

        const base = sampleNearest(sourceData, w, h, sx, sy);
        let r = base.r;
        let g = base.g;
        let b = base.b;

        if (chromaAmt > 0.05) {
          const rs = sampleNearest(sourceData, w, h, sx + chromaX, sy + chromaY);
          const bs = sampleNearest(sourceData, w, h, sx - chromaX, sy - chromaY);
          r = rs.r;
          b = bs.b;
        }

        if (hash1(gx * 0.71 + gy * 1.37 + frameSeed) < fuzzGate) {
          const n = hash1(gx + gy * 13 + frameSeed * 0.17);
          const fuzz = (n - 0.5) * mix * 90;
          r = Math.max(0, Math.min(255, r + fuzz));
          g = Math.max(0, Math.min(255, g + fuzz * 0.6));
          b = Math.max(0, Math.min(255, b - fuzz * 0.4));
        }

        if (mix > 0.55 && hash1(gx * 0.19 + gy * 0.23 + shiftTick) > 0.985) {
          const flash = mix * 110;
          r = Math.min(255, r + flash);
          g = Math.min(255, g + flash * 0.35);
          b = Math.min(255, b + flash * 0.85);
        }

        const idx = (gy * w + gx) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
  }

  window.AbsGlitchPost = {
    defaults,
    clampAmount,
    clampUnit,
    clampRate,
    formatPercent,
    applyPostProcess
  };
})();
