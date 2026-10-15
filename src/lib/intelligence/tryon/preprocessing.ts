import { TryOnRequest } from './types';

export class PreprocessingError extends Error {
  constructor(message: string) {
    super(`TryOn Preprocessing Failed: ${message}`);
    this.name = 'PreprocessingError';
  }
}

/**
 * Validates inputs before expensive physics and rendering computations.
 */
export function preprocessRequest(request: TryOnRequest) {
  // 1. Validate Camera Orientation
  if (request.cameraPose.elevation < -45 || request.cameraPose.elevation > 45) {
    throw new PreprocessingError('Camera elevation is too extreme for accurate rendering.');
  }

  // 2. Normalize Pose
  // e.g., mapping 'custom' angles to nearest cardinal direction if quality level is low
  if (request.garmentQuality === 'LEVEL_1_2D_IMAGE' && request.cameraPose.angle === 'custom') {
    throw new PreprocessingError('Level 1 Garments only support exact front/side/back views.');
  }

  // 3. Reject Poor Quality Inputs
  if (!request.productId || !request.recommendedSize) {
    throw new PreprocessingError('Missing garment size parameters.');
  }

  return {
    ...request,
    normalizedAngle: request.cameraPose.angle
  };
}
