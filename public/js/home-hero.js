(() => {
  const typed = document.getElementById("hero-typed");
  const explore = document.getElementById("home-explore");
  if (!typed || !explore) return;

  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("reduce-motion");

  const start = () => {
    if (reduced()) {
      typed.textContent = "x86";
      explore.classList.add("is-visible");
      return;
    }

    typed.textContent = "";
    let index = 0;
    const typing = setInterval(() => {
      typed.textContent = "x86".slice(0, ++index);
      if (index === 3) clearInterval(typing);
    }, 150);
    setTimeout(() => explore.classList.add("is-visible"), 3000);
  };

  if (!document.getElementById("loader")) {
    start();
    return;
  }

  const observer = new MutationObserver(() => {
    if (!document.getElementById("loader")) {
      observer.disconnect();
      start();
    }
  });
  observer.observe(document.body, { childList: true });
})();
