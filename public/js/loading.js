(() => {
  const loader = document.getElementById("loader");
  const bar = document.getElementById("loader-progress");
  const fill = document.getElementById("loader-fill");
  const percent = document.getElementById("loader-percent");
  const detail = document.getElementById("loader-detail");

  if (!loader || !bar || !fill || !percent || !detail) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let value = 0;
  let finished = false;
  const lastStroke = loader.querySelector(".loader__hello path:last-child");
  const writingDone = reducedMotion || !lastStroke
    ? Promise.resolve()
    : Promise.race([
        new Promise((resolve) => lastStroke.addEventListener("animationend", resolve, { once: true })),
        delay(3100)
      ]);

  const update = (next, status) => {
    value = Math.max(value, next);
    fill.style.width = value + "%";
    percent.textContent = value + "%";
    bar.setAttribute("aria-valuenow", String(value));
    detail.textContent = status;
  };

  const finish = async () => {
    if (finished) return;
    finished = true;
    update(100, "ready");
    await writingDone;
    loader.classList.add("is-ready");
    await delay(reducedMotion ? 0 : 800);
    loader.classList.add("is-leaving");
    await delay(reducedMotion ? 0 : 500);
    loader.remove();
  };

  const start = async () => {
    update(20, "loading html");
    update(45, "styles ready");
    update(70, "loading javascript");

    if (document.readyState !== "complete") {
      await new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
    }

    update(90, "checking assets");
    await Promise.race([
      Promise.all([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        ...Array.from(document.images, (image) => {
          if (image.complete) return Promise.resolve();
          return new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          });
        })
      ]),
      delay(2200)
    ]);
    await finish();
  };

  start().catch(finish);
  setTimeout(finish, 5000);
})();
