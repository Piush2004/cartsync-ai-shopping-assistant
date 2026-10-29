import type { QualityTier } from "./types";

/**
 * Laplacian-variance blur estimator. Unchanged from the original
 * implementation -- validated directionally correct against real fixture
 * data in research/cv/results/image_quality_benchmark.json (sharp images
 * consistently and substantially outscore mild/heavy/motion-blurred
 * versions of the same photo).
 *
 * IMPORTANT (evidence, not assumption): this benchmark also showed the raw
 * output of this function is strongly resolution- and content-dependent --
 * the same real sharp photo measured 168 at 896px width, 207 at 640px, and
 * 339 at 320px, and two different sharp real photos at the same 896px width
 * measured 168 and 237 respectively purely due to scene content (plain wall
 * vs. textured background). A single fixed threshold applied to a raw
 * detectBlur() output is therefore not usable across arbitrary input
 * resolutions -- see CANONICAL_BLUR_WIDTH and classifyBlurVariance() below,
 * which is why nothing calls detectBlur() directly outside of this file and
 * its own generation.
 */
export function detectBlur(imageData: ImageData): number {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Convert to grayscale and apply Laplacian operator in one pass to estimate variance
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  // A very simplified laplacian variance to run fast on the main thread or worker
  for (let y = 1; y < height - 1; y += 2) { // stride by 2 for performance
    for (let x = 1; x < width - 1; x += 2) {
      const idx = (y * width + x) * 4;

      const gray = (data[idx] + data[idx+1] + data[idx+2]) / 3;

      const top = (data[idx - width * 4] + data[idx - width * 4 + 1] + data[idx - width * 4 + 2]) / 3;
      const bottom = (data[idx + width * 4] + data[idx + width * 4 + 1] + data[idx + width * 4 + 2]) / 3;
      const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3;
      const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3;

      const laplacian = (top + bottom + left + right - 4 * gray);

      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);

  return variance;
}

/**
 * Every blur check resizes to this width first (see resizeImageDataForBlurCheck)
 * so classifyBlurVariance's thresholds apply regardless of the camera's
 * native capture resolution. Matches the "mid" resolution bucket used in
 * research/cv/scripts/generate_quality_fixtures.js, so the thresholds below
 * are calibrated at exactly this width.
 */
export const CANONICAL_BLUR_WIDTH = 640;

/**
 * Thresholds measured in research/cv/results/image_quality_benchmark.json
 * at 640px width, from the two source photos that were genuinely captured
 * at a resolution >= 640px (male_indoor, female_indoor -- the third source,
 * female_outdoor, was natively 262px wide, so resizing it to 640 upscales
 * rather than downscales, which is a materially different operation; see
 * docs/qa/CAMERA_IMAGE_QUALITY_REPORT.md's "Known limitations" for why that
 * source was excluded from threshold-setting):
 *
 *   sharp:            207.06, 387.03           (both PASS)
 *   mild gaussian:      9.93,  20.07            (both should FAIL)
 *   heavy gaussian:      1.44,   2.81            (both should FAIL)
 *   motion (9-tap):     21.60,  44.68            (both should FAIL)
 *   motion (21-tap):    11.32,  29.92            (both should FAIL)
 *
 * All degraded-quality values (1.44-44.68) sit far below all sharp values
 * (207.06-387.03) -- a >4x margin -- so FAIL_THRESHOLD=60 and
 * PASS_THRESHOLD=120 both sit safely inside that gap with room either side.
 * The WARNING band between them (60-120) has no fixture directly inside it;
 * it exists to degrade gracefully rather than hard-cliff between PASS and
 * FAIL, not because a real borderline photo was measured there -- documented
 * as an interpolated, not measured, boundary.
 */
export const BLUR_FAIL_THRESHOLD = 60;
export const BLUR_PASS_THRESHOLD = 120;

export function classifyBlurVariance(varianceAtCanonicalWidth: number): QualityTier {
  if (varianceAtCanonicalWidth < BLUR_FAIL_THRESHOLD) return "FAIL";
  if (varianceAtCanonicalWidth < BLUR_PASS_THRESHOLD) return "WARNING";
  return "PASS";
}

/**
 * Resizes to CANONICAL_BLUR_WIDTH via an offscreen canvas before the caller
 * runs detectBlur() on the result -- browser-only (uses document/canvas),
 * not unit-testable in this repo's Node-based vitest environment, so it is
 * intentionally kept as a thin, separate function from the pure/tested
 * detectBlur() and classifyBlurVariance().
 *
 * KNOWN GAP (see docs/qa/CAMERA_IMAGE_QUALITY_REPORT.md): the benchmark that
 * produced BLUR_FAIL_THRESHOLD/BLUR_PASS_THRESHOLD resized fixture images
 * with sharp/libvips (Lanczos-like resampling), not this function's Canvas
 * drawImage scaling (the browser's own, typically bilinear, resampling).
 * The two algorithms can produce different absolute sharpness readings for
 * the same logical resize. This was not cross-validated against real Canvas
 * output in this session -- flagged as NOT TESTED rather than assumed
 * equivalent.
 */
export function resizeImageDataForBlurCheck(
  source: HTMLCanvasElement | HTMLVideoElement | ImageBitmap,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number = CANONICAL_BLUR_WIDTH
): ImageData {
  const targetHeight = Math.round((sourceHeight / sourceWidth) * targetWidth);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("resizeImageDataForBlurCheck: 2D canvas context unavailable");
  }
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  return ctx.getImageData(0, 0, targetWidth, targetHeight);
}
