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

  if (matchMedia("(prefers-reduced-motion: reduce)").matches || (() => { try { return localStorage.getItem("x86-reduced-motion") === "true"; } catch { return false; } })()) {
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

(() => {
  const root = document.documentElement;
  const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const themes = ["light", "dark", "navy", "hacked"];
  const theme = themes.includes(read("x86-theme")) ? read("x86-theme") : "light";
  const requested = new URLSearchParams(location.search).get("lang");
  const saved = read("x86-language");
  const language = ["en", "vi"].includes(requested) ? requested
    : ["en", "vi"].includes(saved) ? saved
    : navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
  const reduced = read("x86-reduced-motion") === "true";
  root.dataset.theme = theme;
  root.lang = language;
  root.classList.toggle("reduce-motion", reduced);
  const header = document.querySelector(".site-header__inner");
  if (!header) return;
  const links = [
    ["introduction", "Overview"], ["history", "History"],
    ["architecture", "Architecture"], ["instructions", "Instructions"], ["comparison", "Comparison"]
  ];
  const base = new URL(document.querySelector(".site-logo")?.getAttribute("href") || "index.html", location.href).href.replace(/index\.html(?:\?.*)?$/, "");
  const makeLink = (section, label) => {
    const a = document.createElement("a");
    a.href = new URL("public/" + section + "/index.html", base).href;
    a.textContent = label;
    return a;
  };
  const menu = document.createElement("details");
  menu.className = "site-menu";
  menu.id = "site-menu";
  const summary = document.createElement("summary");
  summary.setAttribute("aria-label", "Toggle site menu");
  summary.innerHTML = '<span class="menu-icon" aria-hidden="true"><i></i><i></i><i></i></span>';
  const panel = document.createElement("div");
  panel.className = "site-menu__panel";
  const group = (title) => {
    const details = document.createElement("details");
    details.className = "site-menu__group";
    const heading = document.createElement("summary");
    heading.textContent = title;
    details.append(heading);
    panel.append(details);
    return details;
  };
  const explore = group(language === "vi" ? "Khám phá" : "Explore");
  const exploreNav = document.createElement("nav");
  exploreNav.setAttribute("aria-label", "Explore");
  links.forEach(([section, label]) => exploreNav.append(makeLink(section, label)));
  explore.append(exploreNav);
  const info = group(language === "vi" ? "Thông tin" : "Information");
  const infoNav = document.createElement("nav");
  infoNav.setAttribute("aria-label", "Information");
  infoNav.append(makeLink("references", "References"), makeLink("license", "License"));
  const github = document.createElement("a");
  github.href = "https://github.com/kaayzouee/web-x86";
  github.textContent = "GitHub";
  infoNav.append(github);
  info.append(infoNav);
  const settings = group(language === "vi" ? "Cài đặt" : "Settings");
  settings.id = "site-settings";
  const options = (title, name, values, selected) => {
    const field = document.createElement("fieldset");
    field.className = "site-menu__options";
    const legend = document.createElement("legend");
    legend.textContent = title;
    field.append(legend);
    values.forEach(([value, label]) => {
      const wrap = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = value;
      input.checked = value === selected;
      wrap.append(input, document.createTextNode(label));
      field.append(wrap);
    });
    settings.append(field);
  };
  options(language === "vi" ? "Giao diện" : "Theme", "theme",
    [["light", "Default"], ["dark", "High Contrast"], ["navy", "Navy"], ["hacked", "Hacked!"]], theme);
  options(language === "vi" ? "Ngôn ngữ" : "Language", "language",
    [["en", "EN"], ["vi", "VI"]], language);
  const motionLabel = document.createElement("label");
  motionLabel.className = "site-menu__motion";
  const motion = document.createElement("input");
  motion.type = "checkbox";
  motion.id = "motion-toggle";
  motion.checked = reduced;
  motionLabel.append(motion, document.createTextNode(language === "vi" ? "Giảm chuyển động" : "Reduced motion"));
  settings.append(motionLabel);
  menu.append(summary, panel);
  header.append(menu);
  root.classList.add("has-site-menu");
  summary.setAttribute("aria-expanded", "false");
  menu.addEventListener("toggle", () => summary.setAttribute("aria-expanded", String(menu.open)));

  menu.addEventListener("change", (event) => {
    const input = event.target;
    if (input.name === "theme" && themes.includes(input.value)) {
      root.dataset.theme = input.value;
      save("x86-theme", input.value);
    } else if (input.name === "language") {
      save("x86-language", input.value);
      const url = new URL(location.href);
      url.searchParams.set("lang", input.value);
      location.assign(url.href);
    } else if (input.id === "motion-toggle") {
      save("x86-reduced-motion", String(input.checked));
      root.classList.toggle("reduce-motion", input.checked);
      location.reload();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.open) {
      menu.open = false;
      summary.focus();
    }
  });
  for (const item of panel.querySelectorAll(".site-menu__group")) {
    item.addEventListener("toggle", () => {
      if (item.open) panel.querySelectorAll(".site-menu__group").forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  }
})();
