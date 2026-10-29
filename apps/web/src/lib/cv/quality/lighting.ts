import type { QualityTier } from "./types";

export interface LightingStats {
  brightness: number; // 0 to 255
  isTooDark: boolean;
  isOverexposed: boolean;
}

/**
 * Thresholds re-measured this session against real photos (see
 * research/cv/results/image_quality_benchmark.json and
 * docs/qa/CAMERA_IMAGE_QUALITY_REPORT.md). The PREVIOUS threshold
 * (isTooDark: brightness < 40) was evidence-checked and found too lenient:
 * a real, genuinely dim mirror-selfie photo already in this repo's test
 * fixtures (testing-assets/invalid/invalid_001_mirror.jpg, documented in
 * testing-assets/metadata.json as "lighting": "poor") measured brightness
 * 63.67 -- comfortably ABOVE the old 40 threshold, meaning that real bad
 * photo would have silently passed the old check.
 *
 * Measured brightness ladder (real photo + a synthetic brightness-multiplier
 * series over a real source, via sharp's real .modulate(), see
 * generate_quality_fixtures.js):
 *   49.1  (0.25x synthetic)         -> should FAIL
 *   63.7  (REAL poor-lighting photo) -> should WARN, not silently pass
 *   76.6  (0.4x synthetic)          -> should WARN
 *   106.3 (0.55x synthetic)         -> should PASS
 *   137.6-204.0 (real good photos)  -> should PASS
 *   232.5 (1.15x synthetic)         -> should FAIL (overexposed)
 *   238.9-250.6 (1.3x-3.0x)         -> should FAIL (overexposed)
 */
export const BRIGHTNESS_FAIL_LOW = 55;
export const BRIGHTNESS_WARN_LOW = 100;
/** No real fixture measured between 204 (real PASS) and 232.5 (real FAIL) -- this upper band is interpolated, not measured. */
export const BRIGHTNESS_WARN_HIGH = 210;
export const BRIGHTNESS_FAIL_HIGH = 230;

export function analyzeLighting(imageData: ImageData): LightingStats {
  const data = imageData.data;
  let sum = 0;
  let overexposedCount = 0;
  let underexposedCount = 0;

  // Stride through pixels to save computation
  const stride = 16; // Skip 4 pixels (16 bytes) at a time
  let pixelCount = 0;

  for (let i = 0; i < data.length; i += stride) {
    // Basic luminance formula: 0.299*R + 0.587*G + 0.114*B
    const luminance = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    sum += luminance;
    pixelCount++;

    if (luminance > 240) overexposedCount++;
    if (luminance < 15) underexposedCount++;
  }

  const meanBrightness = sum / pixelCount;
  const overexposedRatio = overexposedCount / pixelCount;
  const underexposedRatio = underexposedCount / pixelCount;

  return {
    brightness: meanBrightness,
    isTooDark: meanBrightness < BRIGHTNESS_FAIL_LOW || underexposedRatio > 0.4,
    // The ratio-based check (localized blown-out highlights) is unchanged --
    // real evidence confirmed it already correctly flags 1.15x+ brightness.
    // The absolute brightness/FAIL_HIGH check is additive, evidence-based.
    isOverexposed: overexposedRatio > 0.3 || meanBrightness >= BRIGHTNESS_FAIL_HIGH
  };
}

export function classifyLighting(brightness: number): QualityTier {
  if (brightness < BRIGHTNESS_FAIL_LOW || brightness >= BRIGHTNESS_FAIL_HIGH) return "FAIL";
  if (brightness < BRIGHTNESS_WARN_LOW || brightness >= BRIGHTNESS_WARN_HIGH) return "WARNING";
  return "PASS";
}
