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

  const update = (next, status) => {
    progress = Math.max(progress, next);
    fill.style.width = progress + "%";
    percent.textContent = progress + "%";
    bar.setAttribute("aria-valuenow", String(progress));
    detail.textContent = status;
  };

  const draw = async (svg) => {
    svg.hidden = false;
    const strokes = svg.querySelectorAll("path");
    if (reducedMotion) {
      strokes.forEach((stroke) => { stroke.style.strokeDashoffset = "0"; });
      return;
    }

    await new Promise((resolve) => {
      const last = strokes[strokes.length - 1];
      last.addEventListener("animationend", resolve, { once: true });
      svg.classList.add("is-writing");
      setTimeout(resolve, Number(svg.dataset.duration) + 500);
    });
  };

  const resourcesReady = (async () => {
    update(20, "loading html");
    update(45, "loading styles");
    update(70, "loading javascript");

    if (document.readyState !== "complete") {
      await Promise.race([
        new Promise((resolve) => window.addEventListener("load", resolve, { once: true })),
        delay(5000)
      ]);
    }

    update(90, "checking assets");
    await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), delay(2000)]);
  })();

  const run = async () => {
    try {
      update(20, "writing hello");
      await draw(english);
      if (!reducedMotion) {
        await delay(950);
        english.hidden = true;
        update(90, "writing xin chào");
        await draw(vietnamese);
        await delay(950);
      }

      await resourcesReady;
      update(100, "ready");
      loader.classList.add("is-ready");
      await delay(reducedMotion ? 0 : 850);
      loader.classList.add("is-leaving");
      await delay(reducedMotion ? 0 : 500);
      loader.remove();
    } catch {
      loader.remove();
    }
  };

  run();
})();
