(() => {
  const canvas = document.getElementById("binary-wave");
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;

  const root = document.documentElement;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let tick = 0;
  let queued = false;

  const hash = (x, y, seed = 0) => {
    const v = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
    return v - Math.floor(v);
  };
  const reduced = () => motion.matches || root.classList.contains("reduce-motion");
  const color = (styles, name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  const drawDigit = (x, y, size, ink, opacity, row, col, seed = 0) => {
    const base = hash(row, col, seed) > .5;
    const change = tick && hash(row, col, tick * 3 + seed) > .76;
    ctx.globalAlpha = opacity;
    ctx.fillStyle = ink;
    ctx.font = "700 " + Math.round(size) + "px ui-monospace, SFMono-Regular, Consolas, monospace";
    ctx.fillText(base !== Boolean(change) ? "1" : "0", x, y);
  };

  // Distant banks use staggered pixel glyphs instead of a gradient or image.
  // Their scalloped shapes follow the reference's blue cloud silhouettes.
  const paintBank = (side, pale, foam, shadow) => {
    const left = side === "left";
    const xMin = left ? 0 : width * .68;
    const xMax = left ? width * .32 : width;
    const midX = left ? width * .06 : width * .94;
    const step = width < 500 ? 7.6 : 8.7;
    for (let y = height * .06, row = 0; y < height * .75; y += step, row++) {
      for (let x = xMin, col = 0; x < xMax; x += step, col++) {
        const centerDist = Math.abs(x - midX) / width;
        const cap = left
          ? .10 + .16 * Math.abs(Math.sin(x * .015 + .5)) + .10 * centerDist
          : .08 + .17 * Math.abs(Math.cos(x * .018)) + .14 * centerDist;
        const floor = .72 - .07 * Math.sin(x * .009);
        if (y / height < cap || y / height > floor) continue;
        const chance = hash(row, col, left ? 43 : 91);
        if (chance < .14 + .2 * centerDist) continue;
        const distanceToEdge = Math.abs(y / height - cap);
        const ink = distanceToEdge < .06 ? foam : chance > .72 ? shadow : pale;
        const alpha = distanceToEdge < .045 ? .52 : .20 + .21 * chance;
        drawDigit(x, y, step * .88, ink, alpha, row + (left ? 17 : 37), col, 62);
      }
    }
  };

  const paintHorizon = (haze, foam) => {
    const step = width < 500 ? 10 : 12;
    for (let y = height * .18, row = 0; y < height * .7; y += step, row++) {
      for (let x = 0, col = 0; x < width; x += step, col++) {
        const start = height * (.12 + .035 * Math.sin(x * .012));
        if (y < start) continue;
        const depth = (y - start) / (height * .5);
        const chance = hash(row, col, 19);
        if (chance > .55 + depth * .35) continue;
        drawDigit(x, y, 5 + depth * 5, chance > .35 ? foam : haze,
          .44 + depth * .26, row + 800, col, 20);
      }
    }
  };

  const crest = (x) => {
    const t = x / width;
    const leftSwell = .125 * Math.exp(-Math.pow((t + .035) / .19, 2));
    const rightSwell = .13 * Math.exp(-Math.pow((t - .97) / .22, 2));
    const wavelet = .022 * Math.sin(t * 17 + .3) + .012 * Math.sin(t * 39 - .8);
    return height * (.50 - leftSwell - rightSwell + wavelet);
  };

  const render = () => {
    if (!width || !height) return;
    const styles = getComputedStyle(root);
    const paper = color(styles, "--home-bg", "#ffffff");
    const haze = color(styles, "--home-pale", "#eaf2ff");
    const foam = color(styles, "--home-foam", "#b4d0ff");
    const bright = color(styles, "--home-wave", "#4d99fa");
    const ink = color(styles, "--home-deep", "#082a72");
    const blue = color(styles, "--home-blue", "#2869fa");
    const shadow = color(styles, "--home-shadow", "#aac5ef");

    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "top";
    paintHorizon(haze, foam);
    paintBank("left", haze, foam, shadow);
    paintBank("right", haze, foam, shadow);

    for (let y = height * .30, row = 0; y < height + 20; row++) {
      const depth = y / height;
      const size = 5.2 + 13.4 * Math.pow(depth, 1.65);
      const spacing = size * (depth > .76 ? 1.04 : 1.2);
      const stepY = size * (depth > .76 ? .94 : 1.12);
      for (let x = (row % 2) * spacing * .5, col = 0; x < width; x += spacing, col++) {
        const surface = crest(x);
        const offset = y - surface;
        if (offset < -55) continue;
        const r = hash(row, col, 7);
        const foamZone = offset <= 42;
        if (offset < -20 && r < .87) continue;
        if (offset < 10 && r < .4) continue;
        if (offset >= 10 && offset < 70 && r < .22) continue;
        if (offset >= 70 && r < Math.max(.04, .17 - depth * .13)) continue;

        const ripple = Math.sin(x * .014 + y * .035) + Math.cos(x * .019 - y * .012);
        let fill;
        let alpha;
        if (offset < 0) {
          fill = foam;
          alpha = .42 + r * .28;
        } else if (foamZone) {
          fill = r > .48 ? foam : bright;
          alpha = .48 + r * .25;
        } else if (depth < .67) {
          fill = r > .66 ? bright : shadow;
          alpha = .44 + .28 * r;
        } else if (depth < .83) {
          fill = ripple > .55 ? foam : bright;
          alpha = .65 + .23 * r;
        } else {
          fill = ripple > 1.12 ? bright : r > .82 ? ink : blue;
          alpha = .78 + .18 * r;
        }
        drawDigit(x + Math.sin(x * .008 + y * .027) * 2, y, size, fill, alpha,
          row, col, 12);
      }
      y += stepY;
    }

    for (let band = 0; band < 5; band++) {
      const h = height * (.56 + band * .082);
      const size = 7 + band * 2;
      for (let x = 0, col = 0; x < width; x += size * 1.32, col++) {
        const surface = h + Math.sin(x * .011 + band * 1.7) * (10 + band * 3)
          + Math.sin(x * .032 - band) * 5;
        if (surface < crest(x) + 7 || hash(col, band, 28) < .43) continue;
        drawDigit(x, surface, size, band < 3 ? foam : bright,
          .40 + band * .095, 400 + band, col, 29);
      }
    }

    ctx.globalAlpha = 1;
    canvas.dataset.waveReady = "true";
    canvas.dataset.waveTick = String(tick);
    canvas.dataset.waveColor = blue;
    canvas.dataset.waveReduced = String(reduced());
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (!w || !h) return;
    width = w;
    height = h;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(w * ratio);
    const pixelHeight = Math.round(h * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    render();
  };

  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; resize(); });
  };
  if ("ResizeObserver" in window) new ResizeObserver(queue).observe(canvas);
  else window.addEventListener("resize", queue, { passive: true });
  new MutationObserver(queue).observe(root, {
    attributes: true, attributeFilter: ["class", "data-theme"]
  });
  if (motion.addEventListener) motion.addEventListener("change", queue);
  else motion.addListener(queue);

  window.setInterval(() => {
    if (document.hidden || reduced()) return;
    tick++;
    render();
  }, 1200);
  queue();
})();
