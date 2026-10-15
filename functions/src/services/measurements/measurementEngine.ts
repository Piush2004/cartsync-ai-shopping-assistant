import { extractPoseLandmarks } from './poseDetection';
import { calculatePixelsPerCm } from './heightCalibration';
import { estimateMeasurements } from './measurementCalculator';
import { validateImagesWithAgent } from './measurementValidation';

export interface MeasurementProfile {
  height: number;
  shoulderWidth: number;
  chest: number;
  waist: number;
  hips: number;
  inseam: number;
  confidence: number;
}

/**
 * Core Orchestrator for the MVP AI Measurement Pipeline
 * Modular design allows future upgrades (Depth Anything V2, LiDAR) to be swapped 
 * in without changing the core workflow.
 */
export async function processMeasurementImages(
  frontImageUrl: string,
  sideImageUrl: string,
  actualHeightCm: number
): Promise<MeasurementProfile> {
  
  // Run Validation Agent on input photos
  await validateImagesWithAgent(frontImageUrl, sideImageUrl);

  // Stage 1: Pose Detection
  const frontPose = await extractPoseLandmarks(frontImageUrl);
  const sidePose = await extractPoseLandmarks(sideImageUrl);

  // Stage 2: Height Calibration
  const pixelsPerCm = calculatePixelsPerCm(frontPose.landmarks, actualHeightCm);

  // Stage 3 & 5: Estimation and Circumference Calculations
  const measurements = estimateMeasurements(frontPose.landmarks, sidePose.landmarks, pixelsPerCm);

  // Generate mock confidence score based on pipeline success (MVP)
  const confidenceScore = 0.88;

  // Stage 6: Return Measurement Profile
  return {
    height: actualHeightCm,
    ...measurements,
    confidence: confidenceScore
  };
}
