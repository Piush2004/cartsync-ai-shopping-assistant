export interface ConfidenceFactors {
  /** Mean landmark visibility from MediaPipe (MediaPipeProvider.processFrame's PoseResult.confidence), averaged over front+side. */
  pose: number;
  /** From the pre-pose ImageData quality gate (blur/lighting), averaged over front+side. 1.0 = passed cleanly, lower = passed with warnings suppressed by the user proceeding anyway. */
  imageQuality: number;
  /** From height-calibration.ts's CalibrationResult.confidence, averaged over front+side. */
  calibration: number;
  /**
   * Reflects that every circumference number is a front-width + assumed-depth-ratio
   * ESTIMATE (see measurement/geometry.ts), not a direct measurement. This is
   * intentionally capped low (see GEOMETRY_CONFIDENCE_CEILING) -- it must
   * never reach 1.0 until a real validation pass (ground truth from an
   * actual tester) justifies raising the ceiling.
   */
  geometry: number;
  /** From consistency.ts -- how well independently-derived front/side proportions agree. */
  frontSideConsistency: number;
}

export interface ConfidenceBreakdown extends ConfidenceFactors {
  overall: number;
}

/**
 * No factor here was fitted from data -- there is no ground-truth dataset to
 * fit against yet (see research/cv/benchmarks/model_candidates.md and
 * CARTSYNC_V1_REAL_USER_READINESS_REPORT.md). These weights are a declared,
 * documented starting point, not a trained model:
 * - geometry and pose weighted highest: they're the most direct signal of
 *   "did we actually see this person's body correctly."
 * - imageQuality and calibration next: preconditions for everything else
 *   being meaningful, but not measurements themselves.
 * - frontSideConsistency lowest: a sanity check on the other four, not
 *   independent evidence.
 * Revisit once real accuracy data exists to see whether any factor actually
 * predicts error -- until then, treat this as provisional.
 */
const FACTOR_WEIGHTS: Record<keyof ConfidenceFactors, number> = {
  pose: 0.25,
  imageQuality: 0.15,
  calibration: 0.2,
  geometry: 0.25,
  frontSideConsistency: 0.15,
};

/**
 * No circumference estimate should present as more trustworthy than this,
 * because every one of them rests on an unvalidated assumed depth:width
 * ratio (see measurement/geometry.ts's ASSUMED_DEPTH_TO_WIDTH_RATIO). Pure
 * landmark-distance measurements (shoulder width, arm length, etc.) are NOT
 * subject to this cap -- they don't go through estimateCircumferenceFromWidth.
 */
export const GEOMETRY_CONFIDENCE_CEILING = 0.65;

export function computeGeometryConfidence(proportionPlausibility: number): number {
  return clamp01(proportionPlausibility) * GEOMETRY_CONFIDENCE_CEILING;
}

export function computeOverallConfidence(factors: ConfidenceFactors): ConfidenceBreakdown {
  const clamped: ConfidenceFactors = {
    pose: clamp01(factors.pose),
    imageQuality: clamp01(factors.imageQuality),
    calibration: clamp01(factors.calibration),
    geometry: clamp01(factors.geometry),
    frontSideConsistency: clamp01(factors.frontSideConsistency),
  };

  const overall =
    clamped.pose * FACTOR_WEIGHTS.pose +
    clamped.imageQuality * FACTOR_WEIGHTS.imageQuality +
    clamped.calibration * FACTOR_WEIGHTS.calibration +
    clamped.geometry * FACTOR_WEIGHTS.geometry +
    clamped.frontSideConsistency * FACTOR_WEIGHTS.frontSideConsistency;

  return { ...clamped, overall: clamp01(overall) };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
