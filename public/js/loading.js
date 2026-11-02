(() => {
  const loader = document.getElementById("loader");
  const bar = document.getElementById("loader-progress");
  const fill = document.getElementById("loader-fill");
  const percent = document.getElementById("loader-percent");
  const detail = document.getElementById("loader-detail");
  if (!loader || !bar || !fill || !percent || !detail) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const english = loader.querySelector('.loader__hello[data-language="en"]');
  const vietnamese = loader.querySelector('.loader__hello[data-language="vi"]');
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let progress = 0;
  let closed = false;
  const watchdog = setTimeout(() => {
    loader.classList.add("is-leaving");
    loader.remove();
  }, 16000);

  const update = (next, status) => {
    if (closed) return;
    progress = Math.max(progress, Math.min(100, Math.round(next)));
    fill.style.width = progress + "%";
    percent.textContent = progress + "%";
    bar.setAttribute("aria-valuenow", String(progress));
    detail.textContent = status;
  };

  const close = async () => {
    if (closed) return;
    closed = true;
    clearTimeout(watchdog);
    fill.style.width = "100%";
    percent.textContent = "100%";
    bar.setAttribute("aria-valuenow", "100");
    detail.textContent = "ready";
    loader.classList.add("is-ready");
    await delay(reducedMotion ? 0 : 500);
    loader.classList.add("is-leaving");
    await delay(reducedMotion ? 0 : 500);
    loader.remove();
  };

  const draw = async (svg, from, to, status) => {
    svg.hidden = false;
    const strokes = svg.querySelectorAll("path");
    if (reducedMotion) {
      strokes.forEach((stroke) => { stroke.style.strokeDashoffset = "0"; });
      update(to, status);
      return;
    }

    const duration = Number(svg.dataset.duration) || 3500;
    const started = performance.now();
    update(from, status);

    await new Promise((resolve) => {
      const last = strokes[strokes.length - 1];
      last.addEventListener("animationend", resolve, { once: true });
      svg.classList.add("is-writing");

      const tick = setInterval(() => {
        if (closed) return clearInterval(tick);
        const fraction = Math.min(1, (performance.now() - started) / duration);
        update(from + (to - from) * fraction, status);
      }, 80);

      setTimeout(() => {
        clearInterval(tick);
        resolve();
      }, duration + 500);
    });

    update(to, status);
  };

  const ready = (async () => {
    if (document.readyState !== "complete") {
      await Promise.race([
        new Promise((resolve) => window.addEventListener("load", resolve, { once: true })),
        delay(5000)
      ]);
    }
    await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), delay(2000)]);
  })();

  const run = async () => {
    try {
      update(10, "loading assets");
      await draw(english, 15, 45, "writing hello");
      if (!reducedMotion) {
        await delay(550);
        english.hidden = true;
        await draw(vietnamese, 50, 95, "writing xin chào");
        await delay(550);
      }
      await ready;
    } finally {
      await close();
    }
  };

  run().catch(() => close());
})();
