(() => {
  const loader = document.getElementById("loader");
  const bar = document.getElementById("loader-progress");
  const fill = document.getElementById("loader-fill");
  const percent = document.getElementById("loader-percent");
  const detail = document.getElementById("loader-detail");
  if (!loader || !bar || !fill || !percent || !detail) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches || (() => { try { return localStorage.getItem("x86-reduced-motion") === "true"; } catch { return false; } })();
  const english = loader.querySelector('.loader__hello[data-language="en"]');
  const vietnamese = loader.querySelector('.loader__hello[data-language="vi"]');
  const preference = (() => {
    try {
      return localStorage.getItem("x86-language")
        || localStorage.getItem("language")
        || localStorage.getItem("lang");
    } catch {
      return null;
    }
  })();
  const requested = new URLSearchParams(location.search).get("lang");
  const saved = preference && /^(en|vi)(-|$)/i.test(preference) ? preference : null;
  const configured = (requested === "en" || requested === "vi") ? requested : saved;
  const language = (configured || navigator.language || document.documentElement.lang || "en").toLowerCase().startsWith("vi") ? "vi" : "en";
  const selected = language === "vi" ? vietnamese : english;
  loader.dataset.language = language;
  for (const greeting of [english, vietnamese]) {
    greeting.toggleAttribute("hidden", greeting !== selected);
  }
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let progress = 0;
  let closed = false;
  const watchdog = setTimeout(() => {
    loader.classList.add("is-leaving");
    loader.remove();
  }, 20000);

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
    for (const greeting of [english, vietnamese]) {
      greeting.toggleAttribute("hidden", greeting !== svg);
    }
    detail.textContent = status;
    const strokes = svg.querySelectorAll("path");
    if (reducedMotion) {
      strokes.forEach((stroke) => { stroke.style.strokeDashoffset = "0"; });
      update(to, status);
      return;
    }

    const duration = Math.max(...Array.from(strokes, (stroke) => {
      const style = getComputedStyle(stroke);
      return parseFloat(style.getPropertyValue("--delay")) + parseFloat(style.getPropertyValue("--duration"));
    }));
    const started = performance.now();
    update(from, status);

    await new Promise((resolve) => {
      const last = strokes[strokes.length - 1];
      let settled = false;
      let tick;
      let fallback;

      const finish = () => {
        if (settled) return;
        settled = true;
        clearInterval(tick);
        clearTimeout(fallback);
        last.removeEventListener("animationend", onEnd);
        resolve();
      };
      const onEnd = (event) => {
        if (event.target === last) finish();
      };

      last.addEventListener("animationend", onEnd);
      svg.classList.add("is-writing");

      tick = setInterval(() => {
        if (closed) return finish();
        const fraction = Math.min(1, (performance.now() - started) / duration);
        update(from + (to - from) * fraction, status);
      }, 80);

      fallback = setTimeout(finish, duration + 500);
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
      const status = language === "vi" ? "writing xin chào" : "writing hello";
      update(10, status);
      await draw(selected, 15, 95, status);
      await ready;
    } finally {
      await close();
    }
  };

  run().catch(() => close());
})();
