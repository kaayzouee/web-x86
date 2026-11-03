# Visual QA report — homepage editorial and binary surf

Date: 2026-11-02  
Source: user-supplied reference screenshot (736×920, original is not in the repository)  
Branch: `quality/visual-first-workflow`

## Findings from actual browser screenshots

We inspected the previous `main` screenshots, the intermediate versions, and final screenshots produced by GitHub Actions. The earlier site was technically green but visually poor: its foreground was a nearly uniform carpet of binary glyphs, faint shore shapes did not read as a wave, the desktop section had excessive vertical space, and the mobile workstation and bottom caption collided visually.

Fixes:
- Rebuilt the wave distribution with a coherent curved surface, foam bands and two cloud-like digit banks. Far characters are small and pale; near ones are larger and darker. Only values change, every 1.2 seconds; reduced motion freezes the effect.
- Removed the overlaid scene caption that crossed over the artwork at small widths.
- Moved the banks higher and tightened the gap after the editorial captions, keeping a separate visual region for the workstation and footer.
- Corrected an actual grid-stretch bug that made the supposed square X86 block 7.8px taller than it was wide on a small phone.
- Removed an inconsistent 320px media-query font override that shrank the headline much more than intended.
- Preserved navigation and menu, theme tokens and reduced-motion loading behavior.

## Browser evidence and coverage

- Playwright/Chromium screenshot sizes: **320×700**, **390×844**, **736×920**, **1280×900**, **1440×900**, after the loader has left.
- Theme screenshots: Default, High Contrast, Navy, Hacked.
- Measured: square aspect ratio, title and scene placement, workstation containment, footer separation, layout overflow, nonblank canvas, computed theme colors, same-origin request failures, HTTP errors, console errors and page errors.
- Existing tests also cover keyboard/menu operation, settings persistence, loader timing, simulated reduced motion, and binary animation updates.
- The first expanded test detected the square-stretch bug; it was fixed rather than waiving the assertion. The subsequent run passed.

**Verified CI:** https://github.com/kaayzouee/web-x86/actions/runs/41468492656  
**Screenshot artifacts:** https://github.com/kaayzouee/web-x86/actions/runs/41468492656 (artifact `loader-layout-previews`).

The captured visual audit reported **zero** browser page errors, console errors, failed requests or HTTP errors on the examined run. Remote image reliability on other networks is not guaranteed.

## Limitations and next review criteria

- The original picture is an editorial illustration and a photograph-like pixel-art scene. A glyph-only binary ocean and CSS workstation cannot reproduce the exact texture or train-station details; visual fidelity is about **layout, scale, negative space and tonal depth**, not a pixel-perfect copy.
- Named third-party visual agents listed in the task summary were not installed here; this audit used real Playwright screenshots, browser DOM/runtime measurements, and manual inspection of the downloaded images.
- Subsequent changes should capture new screenshots and inspect them, not merely depend on CI returning green. If the page loses its recognizable shore silhouette, shows clipped type, or overlaps the navigation/footer, iterate before release.

## Workstation and binary-depth correction — 2026-11-02

- Kept the JS-style X86 badge on one line at the lower-right corner.
- Reworked the monitor and tower top/side faces and reduced the screen wordmark.
- Added a faint, full-width binary layer behind the workstation, preserving stronger foreground digits.
- Reviewed actual screenshots at 320×700, 390×844, 736×920, 1280×900 and 1440×900, plus Default, High Contrast, Navy and Hacked themes.
- Browser audit: no console errors, page errors, request failures, or HTTP errors.
- Regression checks: badge/text bounds, visible workstation depth, readable screen contents and center binary coverage.
- GitHub Actions: https://github.com/kaayzouee/web-x86/actions/runs/41471541673 — passed.

## Homepage navigation redesign — 2026-11-03

- Replaced the oversized decorative X86 block with a typed `_x86` motif and the **Inside x86.** H1.
- Added a dedicated Explore list that appears three seconds after loading. Reduced-motion users see it immediately, and navigation remains visible without JavaScript.
- Made the field-guide CTA a prominent green action with dark text, and added direct topic entries for the 8086, basic instructions and registers.
- Preserved the header hamburger, all four themes, and the existing binary scene and 3D model.
- Checked Chromium screenshots at 320×700 and 736×920: title, topic cards and links are legible and do not overflow horizontally. Automated geometry checks cover 390×844, 1280×900 and 1440×900 as well.
- The browser audit reported no page errors, console errors, network failures or HTTP errors on the inspected run.
- A model-viewer full-page capture can omit its WebGL scene when offscreen; screenshots now scroll the 3D model into view before capture.
- Regression coverage includes the delayed Explore appearance, reduced motion, no-JavaScript availability, and destination URLs.

## X86-specific homepage copy — 2026-11-03

- Replaced the generic hero sentence with Intel 8086's 1978 introduction; kept the `Inside x86.` H1, existing CTA label and `The binary tide`.
- Updated the three route descriptions to identify the 8086's 16-bit ISA, MOV/ADD/JMP operations, and AX/EAX/RAX register evolution.
- Replaced the ornamental three-color swatches with a 16/32/64-bit timeline and added distinct technical labels to the topic cards.
- Added exactly one demonstrative 16-bit instruction sequence (`mov ax, 5`; `add ax, 3`) with the resulting `AX = 0008h`.
- Internal navigation now uses →; the external model credit uses ↗. The original header menu, theme controls, loading sequence, 3D model and canvas wave were not changed.
- Reviewed Playwright captures at 320×700, 736×920, 1280×900 and 1280×900 High Contrast. The 736px label wrapping and small-phone bit-width labels were subsequently tightened.
- Updated automated tests to check technical text, exact link destinations and arrow semantics. Tests were also corrected to distinguish a card's heading from its description when both contain "instruction set".
