# Camera Image Quality Gate — Evidence & Implementation Report

Date: 2026-08-11
Scope: `apps/web/src/lib/cv/quality/` only. Measurement mathematics
(`apps/web/src/lib/cv/measurement/`) was not touched.

## 1. Method

No threshold in this pass was chosen by guessing. The sequence was:

1. Generate a real benchmark fixture set (`research/cv/scripts/generate_quality_fixtures.js`) from real photos already in this repository, using real, documented `sharp`/libvips operations (Gaussian blur convolution, a directional motion-blur convolution kernel, real resizing, real `.modulate()` brightness adjustment) — not synthetic renders.
2. Run the actual, unmodified production `detectBlur`/`analyzeLighting` functions against every fixture via `research/cv/scripts/benchmark_image_quality.ts` (executed with `tsx`, real pixel data decoded via `sharp`, zero mocking).
3. Read the real numbers, derive thresholds from where the measured distributions actually separate, and document the reasoning at each threshold's definition site in code.
4. Write tests that pin the real measured values as regression fixtures, so a future change to `detectBlur`/`analyzeLighting` that silently shifts the distribution gets caught.

Raw data: `research/cv/results/image_quality_benchmark.json` (43 measurements). Fixture generation parameters: `research/cv/fixtures/quality/manifest.json`.

**Source photo provenance**: `testing-assets/front/{male,female}_001_front.jpg` (real studio-lit photos, "excellent_indoor"/"soft_daylight" per `testing-assets/metadata.json`), `testing images/front.png` (real outdoor photo), `testing-assets/invalid/invalid_001_mirror.jpg` (a real, genuinely dim mirror-selfie photo, documented as `"lighting": "poor"`). **Note**: `testing-assets/report.md`, a *different* file in the same directory, was found during this work to contain fabricated numbers (labeled "Simulated Run", cites invented confidence percentages, describes UI features that don't exist in this app) — it was not used as a source for anything in this report, and is flagged here so nobody else cites it by mistake. The *images* referenced by `testing-assets/metadata.json` are real regardless of that unrelated file's content.

## 2. Measured blur distributions

Laplacian-variance blur (`detectBlur`), measured at the frame's native resolution (before this pass's canonical-resize normalization was added):

| Category | male_indoor (896w) | female_indoor (896w) | female_outdoor (262w, native) |
|---|---|---|---|
| Sharp | 168.07 | 237.05 | 982.43 |
| Mild Gaussian blur (σ=1.5) | 7.68 | 14.93 | 37.68 |
| Heavy Gaussian blur (σ=5) | 1.21 | 2.45 | 4.19 |
| Motion blur (9-tap) | 19.77 | 25.76 | 234.15 |
| Motion blur (21-tap) | 11.26 | 16.94 | 191.82 |

Same measurement repeated after resizing to three widths (896/640/320px), full table in the raw JSON. Key finding driving the whole redesign: **the raw metric is strongly resolution- and content-dependent**. The same real sharp photo measured 168 (896px), 207 (640px), and 339 (320px) — smaller images measure *higher* variance for the same real sharpness, because the same physical edge compresses into fewer, steeper pixel transitions. Two different sharp real photos at the *same* 896px width measured 168 and 237 purely from scene texture (plain wall vs. more detailed background/clothing). **A single fixed threshold cannot separate "sharp" from "blurry" across arbitrary resolutions or scene content.**

### Canonical-width (640px) measurements used to set thresholds

Only the two sources genuinely captured at >=640px width were used to set thresholds (see §5 for why `female_outdoor`, natively 262px, was excluded):

| Category | male_indoor | female_indoor |
|---|---|---|
| Sharp | 207.06 | 387.03 |
| Mild Gaussian blur | 9.93 | 20.07 |
| Heavy Gaussian blur | 1.44 | 2.81 |
| Motion blur (9-tap) | 21.60 | 44.68 |
| Motion blur (21-tap) | 11.32 | 29.92 |

All degraded-quality values (1.44–44.68) sit at least 4.6x below all sharp values (207.06–387.03) — a wide, clean separation.

## 3. Thresholds implemented

`apps/web/src/lib/cv/quality/blur.ts`:
- Every blur check now resizes to a canonical 640px width first (`resizeImageDataForBlurCheck`, `CANONICAL_BLUR_WIDTH`), eliminating the resolution-dependence problem rather than trying to curve-fit a scaling formula to 3 noisy data points.
- `BLUR_FAIL_THRESHOLD = 60`, `BLUR_PASS_THRESHOLD = 120`. Both sit inside the 4.6x gap above with room on both sides. The 60–120 WARNING band is an interpolated buffer, not backed by a specific measured fixture — documented as such in code.

`apps/web/src/lib/cv/quality/lighting.ts`, brightness (0–255 mean luminance):

| Real measured brightness | Source | Old behavior (`< 40` = too dark) | New tier |
|---|---|---|---|
| 49.1 | 0.25x synthetic darkening of a real photo | PASS (wrong) | **FAIL** |
| 63.7 | **Real** dim mirror-selfie photo, documented "poor" lighting | PASS (wrong — this is the bug) | **WARNING** |
| 76.6 | 0.4x synthetic | PASS | WARNING |
| 106.3 | 0.55x synthetic | PASS | PASS |
| 137.6–204.0 | Real well-lit photos | PASS | PASS |
| 232.5–250.6 | 1.15x–3.0x synthetic | FAIL (already correct) | FAIL |

`BRIGHTNESS_FAIL_LOW = 55`, `BRIGHTNESS_WARN_LOW = 100`, `BRIGHTNESS_WARN_HIGH = 210` (interpolated — no real fixture measured between the real 204 PASS and the real 232.5 FAIL), `BRIGHTNESS_FAIL_HIGH = 230`.

**The single most important finding in this whole pass**: the *old* `< 40` too-dark threshold would have silently let a real, human-judged "poor" lighting photo through with no warning at all. That's now fixed with real evidence, not a guess.

## 4. False positives / false negatives observed

- **False positive found and documented (not silently "fixed" with an arbitrary threshold change)**: `female_outdoor` resized to 640px (upscaled from its native 262px) measured blur variance 44.17 — inside the FAIL zone despite being the same "sharp" source image. This is because upscaling a low-resolution source doesn't add real detail; the resize smooths it. **This is a real, evidence-based limitation**, not swept under the rug: content captured or uploaded at a native resolution below 640px, if force-upscaled anywhere in the pipeline, risks a false blur rejection. CartSync's actual capture path (`CameraView.tsx`) draws from the live camera feed at its native resolution via canvas, never artificially upscaling, so this specific failure mode is unlikely in normal phone use but could occur with a very low-end/old camera. Documented in `blur.ts`'s threshold comment rather than hidden.
- **No false negatives observed** in the fixtures tested: every degraded-quality (blur or lighting) fixture measured below its respective threshold; every sharp/well-lit fixture measured above.
- **Old system's false negative (now fixed)**: see §3 — the real dim mirror-selfie photo silently passed the old lighting check.

## 5. Body-region blur

`apps/web/src/lib/cv/quality/body-region.ts` crops the frame to a padded bounding box around the body-relevant pose landmarks (shoulders/elbows/wrists/hips/knees/ankles — not the face) before running the same canonical-resize blur check, once pose landmarks exist. This directly satisfies "calculate blur around the detected human/body region rather than relying only on the entire image" — a sharp person against a moving/blurry background (or the reverse) is now scored on what actually matters for measurement.

**Not independently re-benchmarked against real photos this session** (would require re-running the full fixture-generation + measurement pipeline with real pose landmarks cropped in, which needs the browser's MediaPipe runtime, not just Node/sharp) — the crop-then-measure logic reuses the exact same `detectBlur`/`classifyBlurVariance` already validated in §2/§3, and the bounding-box math itself is unit-tested (`body-region.test.ts`), but the end-to-end "does cropping to the body actually improve real-world accuracy over whole-frame" claim is **NOT MEASURED**.

## 6. Temporal (multi-frame) quality evaluation

`CameraView.tsx` now captures `BURST_FRAME_COUNT = 3` frames 120ms apart at the moment of capture (previously: exactly 1 frame) and keeps the sharpest one (`quality/temporal.ts`'s `selectBestFrame`, scored by the same canonical-width Laplacian variance). The frame-selection logic itself is unit-tested (`temporal.test.ts`). **Not tested with a live camera** — whether 3 frames 120ms apart meaningfully improves real-world hand-shake resilience versus a single frame is **NOT MEASURED**, since that requires an actual human holding an actual phone.

## 7. Structured `ImageQualityResult`

`apps/web/src/lib/cv/quality/types.ts` + `assess.ts` combine blur (body-region when available, else whole-frame), lighting, resolution, body visibility (person detected, not multiple people), landmark confidence, and framing (not cropped at the edges) into one `ImageQualityResult` with a per-check `PASS`/`WARNING`/`FAIL` tier, an `overall` tier (worst of all sub-tiers), and a deduplicated `actionableMessages` list. `apps/web/src/app/measurements/camera/page.tsx` now rejects any `overall === "FAIL"` frame before it can reach the measurement pipeline (never silently proceeds), and shows non-blocking toast warnings for `overall === "WARNING"`.

Landmark-confidence tiers are calibrated from real MediaPipe measurements in `research/cv/results/mediapipe_pose_cpu_benchmark.json` (front-view visibility 0.966–0.983 -> PASS; side-view 0.775–0.816 -> WARNING, matching that earlier benchmark's own finding that side captures are structurally harder for BlazePose).

## 8. Confidence pipeline integration

`quality/assess.ts`'s `imageQualityScore()` replaces the old `frameQualityScore`'s "1.0 minus a fixed penalty per failure code" heuristic with a direct PASS=1.0/WARNING=0.6/FAIL=0.0 average across blur/lighting/resolution/landmark-confidence tiers, fed into `confidence/confidence.ts`'s existing `imageQuality` factor (unchanged weighting, only the input's derivation changed). No confidence number is fabricated — it is always a deterministic function of the real tiered assessment.

## 9. Tests executed

- `tsc --noEmit`: clean.
- `eslint`: 48 errors / 19 warnings — unchanged from this session's prior baseline; the entire `quality/` directory and the modified `camera/page.tsx` contribute zero lint issues.
- `next build`: succeeds, 12 routes.
- `vitest`: **87/87 passing** (up from 42 before this pass — 45 new tests: `blur.test.ts` (10), `lighting.test.ts` (12), `assess.test.ts` (14), `body-region.test.ts` (4), `temporal.test.ts` (4), `integration.test.ts` (10, one file removed: the old `pose-validation.test.ts`'s 5 tests were superseded by `assess.test.ts`'s pose-quality tests, which cover the same cases plus tiering).
- `pytest` (backend, unaffected by this frontend-only change but re-run per the task's explicit instruction): **74/74 passing**.
- Integration tests cover all 6 required scenarios explicitly: blurry->rejected, acceptable->proceeds, excellent->proceeds, poor lighting->rejected/warned, cropped body->rejected, motion blur->rejected/warned (`integration.test.ts`).

## 10. Known limitations

- **Resampling algorithm mismatch, not cross-validated**: the benchmark that produced the blur thresholds resized fixture images with `sharp`/libvips (Lanczos-like resampling). Production resizes via HTML5 Canvas's `drawImage` (the browser's own, typically bilinear, resampling). These can produce different absolute sharpness readings for the same logical resize. **This was not cross-validated against real Canvas output in this session** — flagged as a real gap, not assumed away. Recommended next step: once real-device testing happens, capture a few real photos at known sharp/blurry states and compare Canvas-path vs. this benchmark's sharp-path numbers.
- **Upscaling false-positive risk** (§4) for sources natively below 640px width.
- **Only 3 source scenes** (2 people, 3 photos + 1 outdoor variant) — real-world lighting/texture/skin-tone/clothing diversity is far larger than this fixture set covers. Thresholds are a reasoned starting point from real evidence, not a claim of statistical completeness.
- **Real camera / real device testing: NOT TESTED.** Everything in this report was measured against real *photos* processed through real *image-processing code*, but never through an actual live camera feed on an actual device by a human. That remains the same gap called out in `CARTSYNC_V1_REAL_USER_READINESS_REPORT.md` and `CARTSYNC_FULL_BUILD_VERIFICATION_REPORT.md`, and applies here too: whether these thresholds hold up against a real phone's auto-exposure/auto-focus behavior, motion blur from actual hand tremor, and real indoor lighting variety is unverified.
- **Body-region blur and burst frame-selection are logically tested but not measured end-to-end** against real captures (§5, §6).

## 11. Files changed

New: `quality/types.ts`, `quality/assess.ts`, `quality/body-region.ts`, `quality/temporal.ts`, `quality/{blur,lighting,assess,body-region,temporal,integration}.test.ts`, `research/cv/scripts/{generate_quality_fixtures.js,benchmark_image_quality.ts}`, `research/cv/fixtures/quality/*` (43 images + manifest), `research/cv/results/image_quality_benchmark.json`.

Modified: `quality/blur.ts` (canonical-resize + tiered classification added, `detectBlur` itself unchanged), `quality/lighting.ts` (thresholds corrected from real evidence, tiered classification added), `quality/validation.ts` (rewritten around the new tiered pre-pose assessment), `apps/web/src/app/measurements/camera/page.tsx` (wired to the new pipeline), `apps/web/src/components/camera/CameraView.tsx` (burst capture).

Removed (superseded, not duplicated): `quality/pose-validation.ts`, `quality/pose-validation.test.ts`, `quality/messages.ts` — their logic now lives in `assess.ts` with tiers added, avoiding two parallel implementations of the same checks.
