import { test, expect } from "@playwright/test";

const examples = [
  { lang: "en", text: "hello", duration: 3500 },
  { lang: "vi", text: "xin chào", duration: 7800 }
];

for (const { lang, text, duration } of examples) {
  test(`${lang} greeting draws visibly and reveals homepage`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(`/?lang=${lang}`, { waitUntil: "domcontentloaded" });

    const loader = page.locator("#loader");
    const greeting = loader.locator(`.loader__hello[data-language="${lang}"]`);
    const other = loader.locator(`.loader__hello[data-language="${lang === "en" ? "vi" : "en"}"]`);
    const firstStroke = greeting.locator("path").first();

    await expect(loader).toHaveAttribute("data-language", lang);
    await expect(greeting).toBeVisible();
    await expect(other).toBeHidden();
    await expect(loader.locator("#loader-detail")).toHaveText(`writing ${text}`);

    await expect.poll(async () => {
      return firstStroke.evaluate((path) => {
        const styles = getComputedStyle(path);
        const dash = Number.parseFloat(styles.strokeDashoffset);
        const box = path.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && styles.visibility !== "hidden"
          && styles.stroke !== "none" && Number.isFinite(dash) && dash < 0.98;
      });
    }, { timeout: 2500, message: "The handwriting must visibly begin drawing" }).toBe(true);

    const progress = loader.locator("#loader-progress");
    await expect.poll(async () => Number(await progress.getAttribute("aria-valuenow")), {
      timeout: duration + 2500
    }).toBeGreaterThanOrEqual(95);

    await expect(loader).toHaveCount(0, { timeout: duration + 4500 });
    await expect(page.locator("#home-title")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("saved Vietnamese preference chooses only Vietnamese", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("x86-language", "vi"));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#loader")).toHaveAttribute("data-language", "vi");
  await expect(page.locator('.loader__hello[data-language="vi"]')).toBeVisible();
  await expect(page.locator('.loader__hello[data-language="en"]')).toBeHidden();
});

test("browser locale selects a greeting when no setting exists", async ({ browser }) => {
  const context = await browser.newContext({ locale: "vi-VN" });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#loader")).toHaveAttribute("data-language", "vi");
  await context.close();
});

test("reduced motion skips handwriting without blocking the homepage", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#loader")).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator("#home-title")).toBeVisible();
});

test("hero description switches to assembly code and back", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?lang=en");
  await expect(page.locator("#loader")).toHaveCount(0, { timeout: 5000 });

  const toggle = page.locator("#hero-toggle");
  await expect(toggle).toContainText("Explore the fundamentals");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(toggle.locator(".hero-toggle__code")).toBeVisible();
  await expect(toggle.locator(".hero-toggle__code")).toContainText("syscall");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(toggle.locator(".hero-toggle__code")).toHaveAttribute("aria-hidden", "true");
});

test("CRT terminal is visible and its filter can be toggled", async ({ page }) => {
  await page.goto("/?lang=en", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#crt-source")).toBeVisible();
  await expect(page.locator(".crt-terminal")).toBeVisible();
  const toggle = page.locator("#crt-toggle");
  await expect(toggle).toBeVisible();
  await expect.poll(async () => toggle.getAttribute("aria-pressed")).toBe("true");
  await expect(page.locator("#crtcanvas")).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("#crtcanvas")).toHaveCSS("opacity", "0");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
});

test("editorial loader keeps hello and progress left of vintage computer collage", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1200, height: 675 });
  await page.goto("/?lang=vi", { waitUntil: "domcontentloaded" });
  const loader = page.locator("#loader");
  const left = loader.locator(".loader__left");
  const art = loader.locator(".loader__art");
  const photos = art.locator(".loader__photo img");
  await expect(photos).toHaveCount(3);
  await expect(loader.locator(".loader__hello[data-language=vi]")).toBeVisible();
  await expect(loader.locator("#loader-progress")).toBeVisible();
  const leftRect = await left.boundingBox();
  const artRect = await art.boundingBox();
  expect(leftRect.x + leftRect.width).toBeLessThanOrEqual(artRect.x + 2);
  await expect.poll(() => photos.evaluateAll((images) =>
    images.every((image) => image.complete && image.naturalWidth > 0)
  ), { timeout: 5000 }).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("layout-desktop.png") });

  await page.setViewportSize({ width: 390, height: 844 });
  const stackedLeft = await left.boundingBox();
  const stackedArt = await art.boundingBox();
  expect(stackedArt.y).toBeGreaterThan(stackedLeft.y);
  await expect(loader.locator("#loader-progress")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("layout-mobile.png") });
});

test("hamburger settings persist across pages", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?lang=en");
  const menu = page.locator("#site-menu");
  await menu.locator("summary").first().click();
  await expect(menu).toHaveAttribute("open", "");
  await menu.locator("#site-settings > summary").click();
  await menu.locator('input[name="theme"][value="hacked"]').check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "hacked");
  await menu.locator("#motion-toggle").check();
  await expect(page.locator("html")).toHaveClass(/reduce-motion/);
  await page.goto("/public/history/index.html");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "hacked");
  await expect(page.locator("html")).toHaveClass(/reduce-motion/);
});
