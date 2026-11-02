import { initFilterCRT } from "./vendor/crt-filter/initFilterCRT.js";

const source = document.getElementById("crt-source");
const toggle = document.getElementById("crt-toggle");

if (source && toggle) {
  const ctx = source.getContext("2d");
  const lines = [
    "section .text",
    "global _start",
    "",
    "_start:",
    "  mov rax, 1",
    "  mov rdi, 1",
    "  lea rsi, [rel msg]",
    "  mov rdx, msg_len",
    "  syscall",
    "",
    "  xor rdi, rdi",
    "  mov rax, 60",
    "  syscall"
  ];

  const draw = (elapsed) => {
    if (!ctx) return;
    const { width, height } = source;
    ctx.fillStyle = "#071a1b";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#0c5b5b";
    ctx.fillRect(27, 23, 8, 8);
    ctx.font = "15px ui-monospace, SFMono-Regular, Consolas, monospace";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#61dbce";
    ctx.fillText("x86.asm", 45, 18);
    ctx.fillStyle = "#294c4c";
    ctx.fillRect(27, 44, width - 54, 1);

    const count = Math.min(lines.length, Math.floor(elapsed / 400) + 1);
    ctx.font = "15px ui-monospace, SFMono-Regular, Consolas, monospace";
    lines.slice(0, count).forEach((line, i) => {
      ctx.fillStyle = line.trim().startsWith("section") || line.trim().startsWith("global")
        ? "#7eaeae" : "#b7f4e7";
      ctx.fillText(line, 30, 57 + i * 18);
    });

    if (count < lines.length && Math.floor(elapsed / 450) % 2 === 0) {
      ctx.fillStyle = "#61dbce";
      ctx.fillRect(30 + ctx.measureText(lines[count - 1] || "").width, 57 + (count - 1) * 18, 8, 15);
    }
  };

  let elapsed = 0;
  let previous = 0;
  let filtered;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frame = (now) => {
    if (!document.hidden && !reduced) {
      elapsed = (elapsed + (previous ? Math.min(now - previous, 100) : 0)) % 8500;
      draw(elapsed);
    }
    previous = now;
    requestAnimationFrame(frame);
  };

  draw(reduced ? 8500 : 0);
  if (!reduced) requestAnimationFrame(frame);

  try {
    filtered = reduced ? null : initFilterCRT(source, [0.027, 0.102, 0.106]);
  } catch {
    filtered = null;
  }

  if (!filtered) {
    toggle.textContent = "CRT OFF";
    toggle.setAttribute("aria-pressed", "false");
    toggle.disabled = true;
  } else {
    toggle.addEventListener("click", () => {
      const active = toggle.getAttribute("aria-pressed") !== "true";
      filtered.setActive(active);
      toggle.setAttribute("aria-pressed", String(active));
      toggle.textContent = active ? "CRT ON" : "CRT OFF";
    });
  }
}
