import { MeasurementInput, MeasurementProfile } from './types';
import { estimatePoseFromBlob } from './pose';
import { estimateDepth } from './depth';
import { extractMeasurements } from './extraction';
import { calculateConfidence, applyCalibrationOffsets } from './calibration';
import { assessQuality } from './quality';
import { validateMeasurements } from './validator';

/**
 * Main entry point for the Measurement Intelligence Pipeline.
 * Orchestrates pose detection, depth estimation, quality assessment, and geometric extraction.
 */
export async function processMeasurements(
  input: MeasurementInput,
  userId: string,
  calibrationOffsets = null,
  scanCount = 1
): Promise<MeasurementProfile> {
  
  // 1. Extract Pose Landmarks
  const frontPose = await estimatePoseFromBlob(input.frontImageBlob);
  const sidePose = await estimatePoseFromBlob(input.sideImageBlob);

  if (!frontPose || !sidePose) {
    throw new Error('BODY_NOT_VISIBLE: Failed to detect body in one or both images.');
  }

  // 2. Assess Quality (Throws error if below threshold)
  const quality = await assessQuality(input.frontImageBlob, input.sideImageBlob, frontPose, sidePose);

  // 3. Extract Depth Map
  // Note: Wrapped in try/catch to fallback to relative depth if ONNX model is missing
  let depthMap: Float32Array | undefined;
  try {
    depthMap = await estimateDepth(input.frontImageBlob);
  } catch (e) {
    console.warn('Depth model not available, using geometric fallback.', e);
  }
  
  // 4. Extract Raw Measurements & Shape
  const { measurements: rawMeasurements, shape } = extractMeasurements(frontPose, sidePose, input.userHeightCm, depthMap);

  // 5. Validate Anatomical Possibility (Throws error if impossible)
  validateMeasurements(rawMeasurements, input.userHeightCm);

  // 6. Calculate Confidence
  const confidence = calculateConfidence(frontPose, sidePose, quality);

  // 7. Apply Calibration Offsets
  const calibratedMeasurements = applyCalibrationOffsets(rawMeasurements, calibrationOffsets);

  // 8. Construct final profile
  const profile: MeasurementProfile = {
    userId,
    version: 1.1,
    metadata: {
      algorithmVersion: '1.1.0',
      poseModel: 'BlazePose (WASM)',
      depthModel: depthMap ? 'Depth Anything V2 (ONNX)' : 'Fallback',
      timestamp: new Date().toISOString()
    },
    measurements: calibratedMeasurements,
    confidence,
    shape,
    source: 'camera',
    scanCount
  };

  return profile;
}

export * from './types';
export * from './errors';
export * from './fusion';
export * from './benchmark';
