import type { Point2D } from "../vision/types";
import { LANDMARK } from "../vision/landmarks";

export type CalibrationMethod = "user_height";

export interface CalibrationResult {
  /** Real-world centimeters represented by one pixel of the *original, full-resolution* image. */
  cmPerPixel: number;
  method: CalibrationMethod;
  /** 0.0-1.0. See computeCalibrationConfidence for what this is built from. */
  confidence: number;
  warnings: string[];
}

/**
 * Empirical correction factor applied to the nose-to-ankle pixel span to
 * approximate true head-to-floor height. MediaPipe's landmark set has no
 * "top of head" or "floor" point -- the nose (0) sits below the crown, and
 * the ankle (27/28) sits above the sole. This exact 1.1x factor and the
 * nose-to-ankle approach are documented and used unmodified from
 * local-compute/services/height_calibration.py, one of the few genuinely
 * coherent, non-mocked pieces identified in the legacy-tree audit (see
 * docs/architecture/canonical-architecture-decision.md §3). It is an
 * approximation, not a biomechanically derived constant -- flagged here
 * rather than presented as more precise than it is.
 */
const HEAD_AND_FOOT_CORRECTION_FACTOR = 1.1;

/**
 * Body must be reasonably upright and facing the camera for this calibration
 * to be trustworthy -- a large left/right shoulder (or hip) height
 * difference means the subject is tilted or the camera isn't level, which
 * distorts the nose-to-ankle pixel span independent of actual height.
 * Threshold is in normalized (0-1) image-height units.
 */
const MAX_TILT_RATIO_FOR_FULL_CONFIDENCE = 0.02;
const MAX_TILT_RATIO_BEFORE_WARNING = 0.06;

const MIN_VISIBILITY_FOR_CALIBRATION = 0.5;

export function calibrateFromHeight(
  landmarks: Point2D[],
  userHeightCm: number,
  imageWidthPx: number,
  imageHeightPx: number
): CalibrationResult {
  const warnings: string[] = [];

  const nose = landmarks[LANDMARK.NOSE];
  const leftAnkle = landmarks[LANDMARK.LEFT_ANKLE];
  const rightAnkle = landmarks[LANDMARK.RIGHT_ANKLE];
  const leftShoulder = landmarks[LANDMARK.LEFT_SHOULDER];
  const rightShoulder = landmarks[LANDMARK.RIGHT_SHOULDER];
  const leftHip = landmarks[LANDMARK.LEFT_HIP];
  const rightHip = landmarks[LANDMARK.RIGHT_HIP];

  const requiredPoints = [nose, leftAnkle, rightAnkle, leftShoulder, rightShoulder, leftHip, rightHip];
  if (requiredPoints.some((p) => !p)) {
    return {
      cmPerPixel: 0,
      method: "user_height",
      confidence: 0,
      warnings: ["MISSING_REQUIRED_LANDMARKS"],
    };
  }

  const avgAnkleY = (leftAnkle.y + rightAnkle.y) / 2;
  const noseToAnkleNormalized = Math.abs(avgAnkleY - nose.y);
  const noseToAnklePx = noseToAnkleNormalized * imageHeightPx;

  const estimatedHeightPx = noseToAnklePx * HEAD_AND_FOOT_CORRECTION_FACTOR;
  const cmPerPixel = userHeightCm / estimatedHeightPx;

  const shoulderTiltRatio = Math.abs(leftShoulder.y - rightShoulder.y);
  const hipTiltRatio = Math.abs(leftHip.y - rightHip.y);
  const tiltRatio = Math.max(shoulderTiltRatio, hipTiltRatio);

  if (tiltRatio > MAX_TILT_RATIO_BEFORE_WARNING) {
    warnings.push("BODY_NOT_LEVEL");
  }

  const minVisibility = Math.min(
    ...requiredPoints.map((p) => p.visibility ?? 0)
  );
  if (minVisibility < MIN_VISIBILITY_FOR_CALIBRATION) {
    warnings.push("LOW_LANDMARK_VISIBILITY_FOR_CALIBRATION");
  }

  const confidence = computeCalibrationConfidence(tiltRatio, minVisibility);

  return {
    cmPerPixel,
    method: "user_height",
    confidence,
    warnings,
  };
}

/**
 * Confidence factors, both documented rather than fitted:
 * - tiltScore: 1.0 at/under MAX_TILT_RATIO_FOR_FULL_CONFIDENCE, linearly
 *   decaying to 0 at MAX_TILT_RATIO_BEFORE_WARNING*2 (a level body gives a
 *   trustworthy nose-to-ankle span; a tilted one systematically shortens it).
 * - visibilityScore: the minimum landmark visibility among the points this
 *   calibration actually reads, since one occluded point invalidates the span.
 * Combined as their product (both must hold, not either/or) -- not a fitted
 * weight, a deliberate choice that a single bad factor should tank confidence
 * rather than being averaged away by a good one.
 */
function computeCalibrationConfidence(tiltRatio: number, minVisibility: number): number {
  const tiltDecayRange = MAX_TILT_RATIO_BEFORE_WARNING * 2 - MAX_TILT_RATIO_FOR_FULL_CONFIDENCE;
  const tiltScore = clamp01(
    1 - (tiltRatio - MAX_TILT_RATIO_FOR_FULL_CONFIDENCE) / tiltDecayRange
  );
  const visibilityScore = clamp01(minVisibility);
  return clamp01(tiltScore * visibilityScore);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
