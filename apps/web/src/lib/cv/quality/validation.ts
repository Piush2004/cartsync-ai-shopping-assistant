import { analyzeLighting, classifyLighting } from "./lighting";
import { detectBlur, classifyBlurVariance, resizeImageDataForBlurCheck, CANONICAL_BLUR_WIDTH } from "./blur";
import type { BlurCheck, LightingCheck, ResolutionCheck } from "./types";

/**
 * Below this width, pose detection and measurement geometry both become
 * unreliable regardless of how sharp the image is -- there simply aren't
 * enough pixels across the body to place landmarks precisely. This is a
 * conservative engineering floor, NOT a value derived from the blur/lighting
 * benchmark (see docs/qa/CAMERA_IMAGE_QUALITY_REPORT.md's "Known
 * limitations" -- resolution FAIL/WARNING is a sanity check on capture
 * dimensions, not a measured perceptual-quality threshold like blur/lighting
 * are).
 */
const RESOLUTION_FAIL_WIDTH = 240;
const RESOLUTION_WARN_WIDTH = 480;

export interface PrePoseQualityResult {
  blur: BlurCheck;
  lighting: LightingCheck;
  resolution: ResolutionCheck;
}

/**
 * Runs the blur/lighting/resolution checks that don't require pose
 * detection, so an obviously bad frame (e.g. lens-cap-dark, or badly out of
 * focus) can be rejected before paying MediaPipe's inference cost.
 *
 * `canvas` is the full-resolution captured frame (used for the resized blur
 * check -- see resizeImageDataForBlurCheck's doc comment on why blur
 * specifically needs a canonical resolution first); `fullResImageData` is
 * that same frame's already-extracted ImageData (used directly for lighting
 * and resolution, which don't have the same resolution-dependence problem).
 */
export function assessPrePoseQuality(
  canvas: HTMLCanvasElement,
  fullResImageData: ImageData
): PrePoseQualityResult {
  const lighting = analyzeLighting(fullResImageData);
  const lightingTier = classifyLighting(lighting.brightness);

  const resized = resizeImageDataForBlurCheck(canvas, canvas.width, canvas.height, CANONICAL_BLUR_WIDTH);
  const blurVariance = detectBlur(resized);
  const blurTier = classifyBlurVariance(blurVariance);

  const resolutionTier =
    fullResImageData.width < RESOLUTION_FAIL_WIDTH ? "FAIL"
    : fullResImageData.width < RESOLUTION_WARN_WIDTH ? "WARNING"
    : "PASS";

  return {
    blur: {
      tier: blurTier,
      varianceAtCanonicalWidth: blurVariance,
      message: blurTier === "FAIL" ? "Your photo looks blurry. Hold your phone steady and try again."
        : blurTier === "WARNING" ? "Your photo looks a little soft. Hold still for a sharper capture."
        : undefined,
    },
    lighting: {
      tier: lightingTier,
      brightness: lighting.brightness,
      message: lighting.isOverexposed ? "Your photo is too bright. Move out of direct light and try again."
        : lightingTier === "FAIL" ? "Your photo is too dark. Move somewhere brighter and try again."
        : lightingTier === "WARNING" ? "Lighting is a bit dim. A brighter room will improve accuracy."
        : undefined,
    },
    resolution: {
      tier: resolutionTier,
      width: fullResImageData.width,
      height: fullResImageData.height,
      message: resolutionTier === "FAIL" ? "Your camera resolution is too low for an accurate scan."
        : resolutionTier === "WARNING" ? "A higher camera resolution will improve accuracy."
        : undefined,
    },
  };
}

// --- Legacy types, kept only for messages.ts's FRAME_VALIDATION_MESSAGES map
// (still referenced for the pre-MediaPipe "obviously bad frame" fast path in
// some call sites). New code should use assessPrePoseQuality + ImageQualityResult.
export type ValidationFailureCode =
  | 'IMAGE_TOO_BLURRY'
  | 'LIGHT_TOO_LOW'
  | 'LIGHT_TOO_BRIGHT'
  | 'PERSON_NOT_FOUND'
  | 'FRAMING_INCOMPLETE';
