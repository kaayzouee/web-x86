/* Procedural binary surf. No images, fonts, or animation libraries required. */
(() => {
  const canvas = document.getElementById("binary-wave");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const root = document.documentElement;
  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let tick = 0;
  let redrawQueued = false;

  // Stable positions give the binary sea structure; only some digits flip
  // on each tick so the motion reads as a subtle data current, not a flash.
  const hash = (a, b, c = 0) => {
    const n = Math.sin(a * 127.1 + b * 311.7 + c * 71.9) * 43758.5453123;
    return n - Math.floor(n);
  };
  const isReduced = () => motionQuery.matches || root.classList.contains("reduce-motion");
  const css = (styles, key) => styles.getPropertyValue(key).trim();

  const glyph = (x, y, row, col, size, color, alpha, salt = 0) => {
    const base = hash(row, col, salt) > .5;
    const flip = tick > 0 && hash(row, col, tick + salt * 13) > .78;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = "700 " + size + "px ui-monospace, SFMono-Regular, Consolas, monospace";
    ctx.fillText(base !== flip ? "1" : "0", x, y);
  };

  const drawCloud = (cx, cy, rx, ry, color, layer) => {
    // A digit-built blocky foam bank, with scalloped edges like the clouds
    // in the reference artwork. Far away means tiny and close to the paper.
    for (let y = Math.max(18, cy - ry); y < cy + ry; y += 9) {
      const ny = (y - cy) / ry;
      for (let x = Math.max(0, cx - rx); x < Math.min(width, cx + rx); x += 9) {
        const nx = (x - cx) / rx;
        const scallop = .14 * Math.sin(x * .028) + .09 * Math.cos(x * .053);
        if (nx * nx + (ny + scallop) * (ny + scallop) > .87) continue;
        if (hash(Math.floor(x / 9), Math.floor(y / 9), 39 + layer) < .36) continue;
        glyph(x, y, layer + 31, Math.floor(x / 9) + Math.floor(y / 9) * 79,
          5, color, .12 + .16 * Math.max(0, ny + 1) / 2, 44 + layer);
      }
    }
  };

  const drawWave = () => {
    if (!width || !height) return;
    const styles = getComputedStyle(root);
    const backdrop = css(styles, "--home-bg") || "#ffffff";
    const faint = css(styles, "--home-pale") || "#eaf2ff";
    const foam = css(styles, "--home-foam") || "#b4d0ff";
    const vivid = css(styles, "--home-wave") || "#4d99fa";
    const deep = css(styles, "--home-deep") || "#082a72";
    const blue = css(styles, "--home-blue") || "#2869fa";
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = backdrop;
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "top";

    // Pale clouds/surf on opposite shores. These are made only of 0 and 1.
    drawCloud(width * .05, height * .36, width * .23, height * .24, faint, 1);
    drawCloud(width * .94, height * .32, width * .24, height * .21, foam, 2);
    drawCloud(width * .63, height * .42, width * .15, height * .12, faint, 3);

    // Lines of surf get wider, darker and more legible as they approach.
    let row = 0;
    for (let y = height * .13; y < height + 18; ) {
      const depth = Math.min(1, Math.max(0, y / height));
      const size = Math.max(5, Math.round(4.5 + 11.5 * Math.pow(depth, 1.45)));
      const gap = Math.max(8, size * 1.12);
      const stepY = Math.max(8, size * 1.08);
      const phase = row * .3;
      for (let col = 0, x = (row % 2) * (gap / 2); x < width; col++, x += gap) {
        const swell = Math.sin(x * .009 + .2) * 24
          + Math.sin(x * .025 - .8) * 10
          + Math.sin(x * .004 + y * .007) * 12;
        const crest = height * .38 + swell
          - 20 * Math.exp(-Math.pow((x - width * .75) / (width * .2), 2));
        const foamEdge = Math.sin(x * .017 + phase) * 11;
        if (y < crest - 34) continue;
        if (y < crest + foamEdge && hash(row, col, 5) < .83) continue;
        if (y < crest + 48 && hash(row, col, 7) < .27) continue;
        if (y < height * .7 && hash(row, col, 9) < .13) continue;

        const wavelet = Math.sin(x * .012 + y * .037) + Math.cos(x * .022 - y * .016);
        const color = depth < .46 ? faint : depth < .62 ? foam
          : depth < .8 ? vivid : (wavelet > .48 ? blue : deep);
        const opacity = depth < .46 ? .35 : depth < .62 ? .51
          : depth < .8 ? .7 : .79 + .18 * hash(row, col, 14);
        const xOffset = Math.sin(y * .034 + x * .013) * (1 + depth * 2.5);
        glyph(x + xOffset, y + Math.sin(x * .011 + phase) * 3.3,
          row, col, size, color, opacity);
      }
      y += stepY;
      row++;
    }

    // Bright broken ribbons suggest a rolling pixelated shoreline.
    for (let band = 0; band < 4; band++) {
      const depth = .54 + band * .105;
      const baseline = height * depth;
      const size = Math.round(6 + band * 2.3);
      for (let x = 0, col = 0; x < width; x += size * 1.35, col++) {
        if (hash(col, band, 26) < .38) continue;
        const y = baseline + Math.sin(x * .01 + band * 1.8) * (12 + band * 5)
          + Math.sin(x * .035 + band) * 5;
        glyph(x, y, 210 + band, col, size,
          band < 2 ? foam : vivid, .38 + band * .12, 33);
      }
    }
    ctx.globalAlpha = 1;
    canvas.dataset.waveReady = "true";
    canvas.dataset.waveTick = String(tick);
    canvas.dataset.waveColor = blue;
    canvas.dataset.waveReduced = String(isReduced());
  };

  const resizeAndDraw = () => {
    const rect = canvas.getBoundingClientRect();
    const nextWidth = Math.round(rect.width);
    const nextHeight = Math.round(rect.height);
    if (!nextWidth || !nextHeight) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = nextWidth;
    height = nextHeight;
    const scaledWidth = Math.round(width * ratio);
    const scaledHeight = Math.round(height * ratio);
    if (canvas.width !== scaledWidth || canvas.height !== scaledHeight) {
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawWave();
  };
  const scheduleDraw = () => {
    if (redrawQueued) return;
    redrawQueued = true;
    requestAnimationFrame(() => {
      redrawQueued = false;
      resizeAndDraw();
    });
  };

  if ("ResizeObserver" in window) new ResizeObserver(scheduleDraw).observe(canvas);
  else window.addEventListener("resize", scheduleDraw, { passive: true });
  new MutationObserver(scheduleDraw).observe(root,
    { attributes: true, attributeFilter: ["data-theme", "class"] });
  if (motionQuery.addEventListener) motionQuery.addEventListener("change", scheduleDraw);
  else motionQuery.addListener(scheduleDraw);

  // Updating digits costs far less than a per-frame canvas animation.
  window.setInterval(() => {
    if (isReduced() || document.hidden) return;
    tick++;
    drawWave();
  }, 1200);
  scheduleDraw();
})();
