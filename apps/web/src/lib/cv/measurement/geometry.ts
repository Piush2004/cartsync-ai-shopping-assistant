import type { Point2D } from "../vision/types";
import { LANDMARK } from "../vision/landmarks";

export interface LengthMeasurement {
  valueCm: number;
  /** Landmark-derived measurements have no ellipse-assumption uncertainty; capped by input quality only. */
  method: "landmark_distance";
}

export interface CircumferenceMeasurement {
  valueCm: number;
  method: "front_width_ellipse_estimate";
  /**
   * True whenever this number rests on the assumed depth:width ratio below
   * rather than a directly measured quantity. Always true for V1 -- no depth
   * or segmentation input exists yet (see research/cv/benchmarks/model_candidates.md).
   * The UI must show this as "estimated", never as a precise measurement.
   */
  isEstimate: true;
}

function pixelDistance(a: Point2D, b: Point2D, imageWidthPx: number, imageHeightPx: number): number {
  const dx = (a.x - b.x) * imageWidthPx;
  const dy = (a.y - b.y) * imageHeightPx;
  return Math.sqrt(dx * dx + dy * dy);
}

function midpoint(a: Point2D, b: Point2D): Point2D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Straight-line shoulder-to-shoulder distance, front view. */
export function measureShoulderWidth(
  frontLandmarks: Point2D[],
  cmPerPixel: number,
  imageWidthPx: number,
  imageHeightPx: number
): LengthMeasurement {
  const left = frontLandmarks[LANDMARK.LEFT_SHOULDER];
  const right = frontLandmarks[LANDMARK.RIGHT_SHOULDER];
  const px = pixelDistance(left, right, imageWidthPx, imageHeightPx);
  return { valueCm: px * cmPerPixel, method: "landmark_distance" };
}

/** Shoulder->elbow->wrist summed segment length, front view, averaged over both arms when both are visible. */
export function measureArmLength(
  frontLandmarks: Point2D[],
  cmPerPixel: number,
  imageWidthPx: number,
  imageHeightPx: number
): LengthMeasurement {
  const segments = (shoulder: number, elbow: number, wrist: number) =>
    pixelDistance(frontLandmarks[shoulder], frontLandmarks[elbow], imageWidthPx, imageHeightPx) +
    pixelDistance(frontLandmarks[elbow], frontLandmarks[wrist], imageWidthPx, imageHeightPx);

  const leftPx = segments(LANDMARK.LEFT_SHOULDER, LANDMARK.LEFT_ELBOW, LANDMARK.LEFT_WRIST);
  const rightPx = segments(LANDMARK.RIGHT_SHOULDER, LANDMARK.RIGHT_ELBOW, LANDMARK.RIGHT_WRIST);
  const avgPx = (leftPx + rightPx) / 2;
  return { valueCm: avgPx * cmPerPixel, method: "landmark_distance" };
}

/** Shoulder-midpoint to hip-midpoint distance, front view. */
export function measureTorsoLength(
  frontLandmarks: Point2D[],
  cmPerPixel: number,
  imageWidthPx: number,
  imageHeightPx: number
): LengthMeasurement {
  const shoulderMid = midpoint(frontLandmarks[LANDMARK.LEFT_SHOULDER], frontLandmarks[LANDMARK.RIGHT_SHOULDER]);
  const hipMid = midpoint(frontLandmarks[LANDMARK.LEFT_HIP], frontLandmarks[LANDMARK.RIGHT_HIP]);
  const px = pixelDistance(shoulderMid, hipMid, imageWidthPx, imageHeightPx);
  return { valueCm: px * cmPerPixel, method: "landmark_distance" };
}

/**
 * Hip-midpoint to ankle-midpoint distance, front view, as an inseam proxy.
 * True inseam is measured crotch-to-floor; the hip landmark sits above the
 * crotch, so this systematically under-measures true inseam by a few cm.
 * Documented rather than corrected with an unvalidated fudge factor -- V1
 * calls this a proxy, not "inseam."
 */
export function measureInseamProxy(
  frontLandmarks: Point2D[],
  cmPerPixel: number,
  imageWidthPx: number,
  imageHeightPx: number
): LengthMeasurement {
  const hipMid = midpoint(frontLandmarks[LANDMARK.LEFT_HIP], frontLandmarks[LANDMARK.RIGHT_HIP]);
  const ankleMid = midpoint(frontLandmarks[LANDMARK.LEFT_ANKLE], frontLandmarks[LANDMARK.RIGHT_ANKLE]);
  const px = pixelDistance(hipMid, ankleMid, imageWidthPx, imageHeightPx);
  return { valueCm: px * cmPerPixel, method: "landmark_distance" };
}

/**
 * Assumed body-region depth:width ratios for the ellipse circumference
 * estimate below. THESE ARE NOT MEASURED OR SOURCED FROM A VALIDATED
 * ANTHROPOMETRIC STUDY -- they are working defaults pending real comparison
 * against a human tester's manually-measured values (see
 * research/cv/benchmarks/ and CARTSYNC_V1_REAL_USER_READINESS_REPORT.md).
 * Do not treat these as more authoritative than "a starting guess."
 */
export const ASSUMED_DEPTH_TO_WIDTH_RATIO = {
  chest: 0.7,
  waist: 0.75,
  hip: 0.85,
} as const;

/**
 * Ramanujan's second ellipse-perimeter approximation: for semi-axes a, b,
 * P ~= pi * [3(a+b) - sqrt((3a+b)(a+3b))]. Used here (rather than the cruder
 * P ~= pi*(a+b)) because it stays accurate even when a and b differ
 * substantially, which a torso cross-section often does. This exact formula
 * is also what local-compute/services/measurement_calculator.py used (see
 * docs/architecture/canonical-architecture-decision.md §3) -- a standard,
 * well-known approximation, not a CartSync invention.
 *
 * `widthCm` must come from a real front-view landmark measurement. Depth is
 * NOT measured (no depth/segmentation input in V1) -- it is assumed as
 * widthCm * depthRatio, which is the single biggest source of error in this
 * estimate and the reason this function's result must always be labeled
 * "estimated," never "measured."
 */
export function estimateCircumferenceFromWidth(
  widthCm: number,
  depthRatio: number
): CircumferenceMeasurement {
  const a = widthCm / 2;
  const b = (widthCm * depthRatio) / 2;
  const perimeter = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  return { valueCm: perimeter, method: "front_width_ellipse_estimate", isEstimate: true };
}
