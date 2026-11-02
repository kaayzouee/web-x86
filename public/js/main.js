(() => {
  const element = document.getElementById("assembly-command");
  if (!element) return;

  const commands = [
    "mov eax, 1",
    "xor ebx, ebx",
    "add eax, ebx",
    "push rbp",
    "mov rbp, rsp",
    "cmp eax, 0",
    "jne .loop",
    "ret"
  ];

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.textContent = commands[0];
    return;
  }

  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let index = 0;

  const animate = async () => {
    while (true) {
      const command = commands[index];
      const started = performance.now();

      for (let i = 1; i <= command.length; i++) {
        element.textContent = command.slice(0, i);
        await pause(75);
      }

      await pause(Math.max(0, 5000 - (performance.now() - started)));

      for (let i = command.length - 1; i >= 0; i--) {
        element.textContent = command.slice(0, i);
        await pause(35);
      }

      index = (index + 1) % commands.length;
      await pause(200);
    }
  };

  element.textContent = "";
  animate();
})();

(() => {
  const toggle = document.getElementById("hero-toggle");
  if (!toggle) return;

  toggle.querySelectorAll(".hero-toggle__code code span").forEach((line, index) => {
    line.style.setProperty("--line", index);
  });

  toggle.addEventListener("click", () => {
    const active = toggle.classList.toggle("is-code");
    toggle.setAttribute("aria-pressed", String(active));
    toggle.setAttribute("aria-label", active ? "Show description" : "Show assembly code");
    toggle.querySelector(".hero-toggle__code").setAttribute("aria-hidden", String(!active));
  });
})();
