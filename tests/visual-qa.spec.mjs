import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";

const viewports = [
  { width: 320, height: 700, label: "phone-small" },
  { width: 390, height: 844, label: "phone" },
  { width: 736, height: 920, label: "reference" },
  { width: 1280, height: 900, label: "desktop" },
  { width: 1440, height: 900, label: "desktop-wide" }
];

const rect = async (locator) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box;
};

const captureRuntime = (page) => {
  const messages = { pageErrors: [], consoleErrors: [], requestFailures: [], httpErrors: [] };
  page.on("pageerror", (error) => messages.pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") messages.consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    messages.requestFailures.push({ url: request.url(), failure: request.failure()?.errorText });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      messages.httpErrors.push({ url: response.url(), status: response.status() });
    }
  });
  return messages;
};

test("painted homepage has no cropped headings or illustration/footer collisions", async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const runtime = captureRuntime(page);
  const measurements = [];
  await page.goto("/?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#loader")).toHaveCount(0, { timeout: 8000 });
  await expect(page.locator("#binary-wave")).toHaveAttribute("data-wave-ready", "true");
  await expect(page.locator("#retro-model")).toHaveAttribute("data-state", "ready", { timeout: 20000 });
  await expect(page.locator("#home-explore")).toBeVisible();

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() => (
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    ))).toBe(true);

    const header = await rect(page.locator(".site-header"));
    const prompt = await rect(page.locator(".hero-prompt"));
    const explore = await rect(page.locator("#home-explore"));
    const paths = await rect(page.locator(".home-paths"));
    const title = await rect(page.locator("#home-title"));
    const scene = await rect(page.locator(".binary-scene"));
    const station = await rect(page.locator(".retro-model"));
    const footer = await rect(page.locator(".home-footer"));
    const label = await rect(page.locator(".binary-scene__label"));

    await expect(page.locator(".hero-stamp")).toHaveCount(0);
    await expect(page.locator("#hero-typed")).toHaveText("x86");
    await expect(page.locator(".home-path")).toHaveCount(3);
    await expect(page.locator("#home-explore a")).toHaveCount(5);
    await expect(page.locator(".workstation")).toHaveCount(0);
    await expect(page.locator("#retro-computer")).toHaveAttribute("data-asset-ready", "true");
    await expect(page.locator("#retro-computer")).toHaveAttribute("alt", /retro computer/);

    expect(prompt.y).toBeGreaterThanOrEqual(header.y + header.height - 5);
    expect(title.y).toBeGreaterThan(prompt.y + prompt.height + 10);
    expect(paths.y).toBeGreaterThan(title.y + title.height + 25);
    expect(scene.y).toBeGreaterThanOrEqual(paths.y + paths.height - 2);
    expect(explore.x).toBeGreaterThanOrEqual(0);
    expect(explore.x + explore.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(station.y).toBeGreaterThan(scene.y + 10);
    expect(station.y + station.height).toBeLessThan(scene.y + scene.height - 10);
    expect(label.y + label.height).toBeLessThan(station.y + 5);
    expect(footer.y).toBeGreaterThanOrEqual(scene.y + scene.height - 2);

    const canvas = page.locator("#binary-wave");
    const drawn = await canvas.evaluate((element) => {
      const context = element.getContext("2d");
      const p = context.getImageData(0, 0, element.width, element.height).data;
      let foreground = 0;
      const limit = p.length;
      for (let i = 0; i < limit; i += 96) {
        if (p[i] < 245 || p[i + 1] < 245 || p[i + 2] < 245) foreground++;
      }
      return foreground;
    });
    expect(drawn).toBeGreaterThan(30);

    const centerSurf = await canvas.evaluate(element => {
      const context = element.getContext("2d");
      const background = context.getImageData(0, 0, 1, 1).data;
      let pixels = 0;
      for (let y = Math.round(element.height * .24); y < element.height * .42; y += 3) {
        for (let x = Math.round(element.width * .4); x < element.width * .6; x += 3) {
          const sample = context.getImageData(x, y, 1, 1).data;
          if (Math.abs(sample[0] - background[0]) +
              Math.abs(sample[1] - background[1]) +
              Math.abs(sample[2] - background[2]) > 4) pixels++;
        }
      }
      return pixels;
    });
    expect(centerSurf).toBeGreaterThan(10);

    measurements.push({ viewport: viewport.label, width: viewport.width, height: viewport.height, header, prompt, explore, title, paths, scene, station, footer, sceneLabel: label, drawn });
    await page.locator("#retro-computer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: testInfo.outputPath("layout-qa-" + viewport.label + ".png"),
      fullPage: true,
      animations: "disabled"
    });
  }
  writeFileSync(testInfo.outputPath("visual-audit.json"),
    JSON.stringify({ measurements, runtime }, null, 2));
  expect(runtime.pageErrors).toEqual([]);
  expect(runtime.consoleErrors.filter(message => !message.includes("wikimedia.org"))).toEqual([]);
  const sameOriginFailures = runtime.requestFailures.filter(item =>
    item.url.startsWith("http://127.0.0.1:4173/"));
  expect(sameOriginFailures).toEqual([]);
  const sameOriginHttpErrors = runtime.httpErrors.filter(item =>
    item.url.startsWith("http://127.0.0.1:4173/"));
  expect(sameOriginHttpErrors).toEqual([]);
});

test("each theme paints a legible homepage while preserving the binary artwork", async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#loader")).toHaveCount(0, { timeout: 8000 });
  const palettes = {
    light: "#2869fa",
    dark: "#ff4500",
    navy: "#69b6ff",
    hacked: "#52e96e"
  };
  for (const [theme, waveColor] of Object.entries(palettes)) {
    await page.evaluate(value => localStorage.setItem("x86-theme", value), theme);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.locator("#binary-wave")).toHaveAttribute("data-wave-color", waveColor);
    await expect(page.locator("#loader")).toHaveCount(0, { timeout: 8000 });
    await expect(page.locator("#retro-model")).toHaveAttribute("data-state", "ready", { timeout: 20000 });

    const colors = await page.evaluate(() => {
      const paragraph = document.querySelector(".editorial-hero__description");
      return {
        text: getComputedStyle(paragraph).color,
        paper: getComputedStyle(document.body).backgroundColor
      };
    });
    expect(colors.text).not.toBe(colors.paper);
    await page.locator("#retro-computer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: testInfo.outputPath("layout-qa-theme-" + theme + ".png"),
      fullPage: true,
      animations: "disabled"
    });
  }
});
