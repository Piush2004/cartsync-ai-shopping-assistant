/**
 * Front/side consistency check.
 *
 * Important honesty note: BlazePose landmarks give joint *positions*, not
 * body-surface depth, in either the front or side image -- there is no
 * "front torso surface" vs "back torso surface" landmark pair to compare in
 * a side-view photo (see measurement/geometry.ts's doc comment and
 * research/cv/benchmarks/model_candidates.md §"Depth estimation
 * candidates"). So this does NOT cross-validate circumference estimates
 * against each other the way the master brief's illustrative example
 * ("front implies 96cm, side implies 112cm") suggests -- that would require
 * a real depth/segmentation signal this pipeline doesn't have in V1.
 *
 * What it DOES do, honestly: torso length and inseam are proportions of the
 * body that should measure the same real-world value regardless of which
 * direction the camera is facing. Comparing the front-derived and
 * side-derived calibrated values for the same two subjects is a genuine,
 * independent consistency signal -- if they disagree substantially, either
 * the calibration, the pose detection, or the capture itself (different
 * apparent distance/framing between the two shots) has a problem, and the
 * user should be asked to recapture rather than have the discrepancy
 * silently averaged away.
 */

export interface ConsistencyCheckInput {
  frontTorsoLengthCm: number;
  sideTorsoLengthCm: number;
  frontInseamProxyCm: number;
  sideInseamProxyCm: number;
}

export interface ConsistencyResult {
  consistent: boolean;
  maxRelativeDifference: number;
  warnings: string[];
  /** 1.0 = perfect agreement, 0.0 = at or beyond INCONSISTENCY_THRESHOLD. */
  confidence: number;
}

/**
 * Two independent noisy pose-based estimates of the same real quantity will
 * never match exactly. 15% is a deliberately loose threshold for V1 --
 * tighten it once real repeated-capture data (research/cv's repeatability
 * protocol) shows what normal front/side disagreement actually looks like
 * for a correctly-captured pair.
 */
const INCONSISTENCY_THRESHOLD = 0.15;

function relativeDifference(a: number, b: number): number {
  const denom = (a + b) / 2;
  if (denom <= 0) return 1;
  return Math.abs(a - b) / denom;
}

export function checkFrontSideConsistency(input: ConsistencyCheckInput): ConsistencyResult {
  const torsoDiff = relativeDifference(input.frontTorsoLengthCm, input.sideTorsoLengthCm);
  const inseamDiff = relativeDifference(input.frontInseamProxyCm, input.sideInseamProxyCm);
  const maxRelativeDifference = Math.max(torsoDiff, inseamDiff);

  const warnings: string[] = [];
  if (maxRelativeDifference > INCONSISTENCY_THRESHOLD) {
    warnings.push("MEASUREMENT_INCONSISTENCY");
  }

  const confidence = Math.max(0, 1 - maxRelativeDifference / INCONSISTENCY_THRESHOLD);

  return {
    consistent: maxRelativeDifference <= INCONSISTENCY_THRESHOLD,
    maxRelativeDifference,
    warnings,
    confidence: Math.min(1, confidence),
  };
}
