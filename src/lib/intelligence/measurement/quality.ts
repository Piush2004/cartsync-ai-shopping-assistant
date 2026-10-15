import { PoseLandmarks, QualityMetrics } from './types';
import { MeasurementError, MeasurementErrorCode } from './errors';

/**
 * Evaluates the overall quality of the input data before extraction.
 * In a full production browser implementation, lighting and blur
 * would be calculated directly from the HTMLCanvasElement pixel data.
 * Here we stub the image processing but retain the architectural contract.
 */
export async function assessQuality(
  frontImageBlob: Blob,
  sideImageBlob: Blob,
  frontPose: PoseLandmarks,
  sidePose: PoseLandmarks
): Promise<QualityMetrics> {
  // Stub for actual Laplacian variance calculation for blur
  const calculateBlur = (blob: Blob) => 0.85; // 0-1 score
  
  // Stub for actual luminance calculation for lighting
  const calculateLighting = (blob: Blob) => 0.90; // 0-1 score

  // Pose score: average visibility of all critical keypoints
  const calculatePoseScore = (pose: PoseLandmarks) => {
    const criticalPoints = [0, 11, 12, 23, 24, 15, 16, 27, 28];
    const avgVis = criticalPoints.reduce((acc, idx) => acc + (pose[idx]?.visibility || 0), 0) / criticalPoints.length;
    return avgVis;
  };

  const frontBlur = calculateBlur(frontImageBlob);
  const sideBlur = calculateBlur(sideImageBlob);
  const frontLight = calculateLighting(frontImageBlob);
  const sideLight = calculateLighting(sideImageBlob);
  
  const frontPoseScore = calculatePoseScore(frontPose);
  const sidePoseScore = calculatePoseScore(sidePose);

  const metrics: QualityMetrics = {
    lightingScore: (frontLight + sideLight) / 2,
    blurScore: (frontBlur + sideBlur) / 2,
    poseScore: (frontPoseScore + sidePoseScore) / 2,
    depthScore: 0.85, // Stub for depth map confidence metrics
  };

  // Error Thresholds
  if (metrics.lightingScore < 0.4) throw new MeasurementError(MeasurementErrorCode.LOW_LIGHT, 'Lighting is too poor.');
  if (metrics.blurScore < 0.4) throw new MeasurementError(MeasurementErrorCode.HIGH_BLUR, 'Image is too blurry.');
  if (metrics.poseScore < 0.5) throw new MeasurementError(MeasurementErrorCode.BODY_NOT_VISIBLE, 'Key body points not visible.');

  return metrics;
}

