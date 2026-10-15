import { PoseLandmarks, BodyMeasurements, ConfidenceIntervals, QualityMetrics } from './types';

/**
 * Calculates a confidence score (0-100) based on MediaPipe keypoint visibility
 * and overall pipeline quality metrics.
 */
export function calculateConfidence(
  frontPose: PoseLandmarks,
  sidePose: PoseLandmarks,
  quality: QualityMetrics
): ConfidenceIntervals {
  const getScore = (index1: number, index2?: number) => {
    let score = frontPose[index1]?.visibility || 0.5;
    if (index2 !== undefined) {
      const score2 = frontPose[index2]?.visibility || 0.5;
      score = (score + score2) / 2;
    }
    return Math.min(Math.round(score * 100), 99);
  };

  const chestConf = getScore(11, 12);
  const waistConf = getScore(23, 24);
  const hipConf = getScore(23, 24);
  const shoulderConf = getScore(11, 12);
  const armConf = getScore(15, 16);
  const inseamConf = getScore(27, 28);
  const torsoConf = (chestConf + waistConf) / 2;
  const neckConf = getScore(0, 11);

  // Geometry consistency (average of all keypoint confidences)
  const geometryConsistency = (chestConf + waistConf + hipConf + shoulderConf + armConf + inseamConf) / 600;

  // Weighted overall confidence
  const overall = Math.round(
    (quality.poseScore * 0.20) * 100 +
    (quality.blurScore * 0.15) * 100 +
    (quality.lightingScore * 0.15) * 100 +
    (quality.depthScore * 0.15) * 100 +
    (0.90 * 0.15) * 100 + // Calibration baseline (stub for v3.0 until feedback is active)
    (geometryConsistency * 0.20) * 100
  );

  return {
    chest: chestConf,
    waist: waistConf,
    hip: hipConf,
    shoulderWidth: shoulderConf,
    armLength: armConf,
    inseam: inseamConf,
    torsoHeight: torsoConf,
    neck: neckConf,
    overall: Math.min(Math.max(overall, 0), 100)
  };
}

/**
 * Applies calibration offsets learned from user feedback to the raw measurements.
 */
export function applyCalibrationOffsets(
  rawMeasurements: BodyMeasurements,
  offsets: Partial<BodyMeasurements> | null
): BodyMeasurements {
  if (!offsets) return { ...rawMeasurements };

  return {
    chest: rawMeasurements.chest + (offsets.chest || 0),
    waist: rawMeasurements.waist + (offsets.waist || 0),
    hip: rawMeasurements.hip + (offsets.hip || 0),
    shoulderWidth: rawMeasurements.shoulderWidth + (offsets.shoulderWidth || 0),
    armLength: rawMeasurements.armLength + (offsets.armLength || 0),
    inseam: rawMeasurements.inseam + (offsets.inseam || 0),
    torsoHeight: rawMeasurements.torsoHeight + (offsets.torsoHeight || 0),
    neck: rawMeasurements.neck + (offsets.neck || 0),
  };
}

