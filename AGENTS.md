# AGENTS.md — web-x86 visual and interaction quality contract

This repository is a static educational x86 website. **A green Playwright job does not prove a good UI.** When working on frontend code, the agent must inspect the *painted result* and observe real interactions before declaring success.

## Source of truth and project invariants

- The original editorial visual reference uses a white canvas, cobalt-blue shapes, oversized typography, sparse annotation and a bottom illustration. The homepage replaces decorative swatches with a 16/32/64-bit timeline.
- Translate that layout to x86 terminology. Keep **Inside x86.** as the primary H1, the small typed `_x86` motif, the timed Explore links, topic-card navigation, and the existing header/settings hamburger. Do not silently remove navigation, theme controls, or accessibility semantics.
- The bottom artwork is a workstation in front of an ocean-like, pixelated **0/1** wave. Distant digits are smaller/fainter; near digits are larger/more saturated. The binary surf must have recognizable crest, foam, depth and negative space, rather than a uniform random text carpet. Digits can change periodically but must not flicker every frame.
- Do not restore the old CRT terminal or use image generation for the workstation or wave.
- Homepage copy should name x86-specific facts, registers or instructions rather than generic educational claims. Preserve clear navigation labels and use → for internal links and ↗ for external links.
- Maintain the themes Default (`light`), High Contrast (`dark`), Navy, and Hacked; preserve persisted theme IDs. High Contrast palette: `#000000`, `#1E1E2F`, `#FF4500`, `#F8F8FF`, `#FFEA00`, `#00CED1`, `#8A2BE2`.
- Honor both `prefers-reduced-motion` and the saved `x86-reduced-motion` preference. In reduced motion, freeze decorative animation but keep the loader on screen for at least one second.

## The four-part QA loop (mandatory for visual work)

1. **See — screenshot and visual perception.** Render the actual page in Chromium at **320×700, 390×844, 736×920, 1280×900 and 1440×900**, plus any breakpoint touched by the change. Capture full-page screenshots after the loader has left and fonts/layout have settled. Include Default and High Contrast at minimum, and all four themes when theme styles change. Inspect the image *with your eyes* (or a vision-capable reviewer). Screenshots are evidence, not proof. Compare spacing, alignment, hierarchy, composition, font weight, contrast, and visible/hidden content with the reference; do not infer appearance from CSS declarations alone. Explicitly examine bottom-of-page overlaps and narrow-device clipping.
2. **Hear — runtime diagnostics.** Collect browser `pageerror`, `console.error`, failed same-origin requests and unexpected HTTP 4xx/5xx. Investigate reported failures and remote assets separately; avoid making the CI depend on unpredictable off-site image downloads. If an animation looks wrong, inspect canvas pixels as well as JavaScript state.
3. **Understand — DOM, computed styles and source.** For suspect elements collect computed color, background, font size, bounding rectangle, stacking context, overflow, visibility, focus and ARIA state. Identify the exact HTML/CSS/JS rule responsible. Browser-visible labels must agree with their visual states. Check canvas bitmap dimensions against CSS display dimensions, especially after resizing and device-pixel-ratio changes.
4. **Act — realistic and adversarial UX.** Use Playwright to operate mouse, keyboard and touch-size controls; switch every theme; reload; navigate away/back; change language; toggle reduced motion; scroll; resize while the menu is open; rapidly open/close; click outside; press Escape; use local storage blocked, unset, invalid and legacy preferences. Test repeated actions, not only one happy path. Inspect fresh screenshots after fixes and rerun functional tests.

Use tools that actually exist in the environment: Playwright + Chromium and GitHub Actions are the default. Optional `frontend-visualqa`, `CursorFlow`, `Squint`, `Glimpse`, `Chrome DevTools MCP`, `Krometrail`, `Loupe`, or source-inspector integrations can augment this loop **if installed**, but never state that a named integration was used without having run it. If no interactive browser is available, run the repository Playwright workflow, download its screenshot artifacts, inspect those images, and report any unverified claims.

## How to run and review

- The CI workflow is `.github/workflows/loader-tests.yml`; Playwright config is `playwright.config.mjs`. Locally run `npm install --no-save @playwright/test@1.56.1`, then `npx playwright test`. In CI use its pinned Playwright container. Python 3 is used for the local static HTTP server.
- Preserve existing functional loader tests. Store additional visual and adversarial tests in `tests/`. Name visual previews `layout-*.png` and make the workflow upload them on success **and** failure. Store DOM/runtime audit details alongside these images where practical.
- Use semantic assertions for real invariants: no overlapping visible components, no horizontal overflow, readable navigation, consistent theme state on all pages, canvas nonblank, canvas resized when viewport changes, reduction of motion, bounded loader lifetime. Test actual rendered output, not only element count and class existence.
- Before approving a change, read both the test result **and** the desktop/mobile images. If screenshots show ugly typography, a flat or noisy binary field, clipping, incorrect theme colors or a colliding caption, keep iterating even if CI is green. Use screenshot and computed-style evidence to justify the correction.
- Avoid brittle tests that assert the same paint at a particular millisecond of animation. Freeze motion for deterministic screenshot comparisons, and test random changes separately using eventual assertions.
- Maintain a short QA report per substantive frontend change: examined viewports/themes, console/network errors, visual findings, fixes, test results and remaining limitations. Never mark a run passed while it is pending or assume pushing code is validation.

## Frontend implementation details

- Homepage: `index.html`, `public/css/home.css`, `public/js/home-hero.js`, `public/js/home-wave.js`. Shared theme/menu behavior: `public/css/main.css`, `public/js/main.js`. Loader: `public/css/loading.css`, `public/js/loading.js`.
- Keep decorative canvas out of tab navigation; provide succinct text alternative via `aria-label` or a visually-hidden description. Text links and settings should remain keyboard accessible with visible focus indicators.
- Prefer CSS variables and theme-specific tokens to hardcoded colors. Verify contrast visually and through computed colors. Keep a fallback for unavailable canvas and respect mobile CPU/power: throttle binary updates, pause when the tab is hidden, do not allocate huge glyph arrays on every frame.
- If the request says to match a reference, prioritize its **proportions and negative space**, not merely its colors. Preserve clear separation between illustration, captions and footer.
