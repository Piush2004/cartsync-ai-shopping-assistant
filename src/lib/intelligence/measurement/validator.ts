import { BodyMeasurements } from './types';
import { MeasurementError, MeasurementErrorCode } from './errors';

/**
 * Validates extracted measurements against human anatomical possibilities.
 */
export function validateMeasurements(measurements: BodyMeasurements, userHeightCm: number): void {
  // Adult human constraints
  const bounds = {
    chest: { min: 60, max: 150 },
    waist: { min: 50, max: 140 },
    hip: { min: 60, max: 160 },
    shoulderWidth: { min: 30, max: 70 },
    armLength: { min: 40, max: 90 },
    inseam: { min: 50, max: 110 },
  };

  const checkBound = (name: keyof BodyMeasurements, val: number, min: number, max: number) => {
    if (val < min || val > max) {
      throw new MeasurementError(
        MeasurementErrorCode.IMPOSSIBLE_DIMENSIONS,
        `${name} (${val}cm) is outside possible bounds (${min}-${max}cm)`
      );
    }
  };

  checkBound('chest', measurements.chest, bounds.chest.min, bounds.chest.max);
  checkBound('waist', measurements.waist, bounds.waist.min, bounds.waist.max);
  checkBound('hip', measurements.hip, bounds.hip.min, bounds.hip.max);
  checkBound('shoulderWidth', measurements.shoulderWidth, bounds.shoulderWidth.min, bounds.shoulderWidth.max);
  checkBound('armLength', measurements.armLength, bounds.armLength.min, bounds.armLength.max);
  checkBound('inseam', measurements.inseam, bounds.inseam.min, bounds.inseam.max);
  
  // Proportional checks
  if (measurements.inseam > userHeightCm * 0.7) {
    throw new MeasurementError(
      MeasurementErrorCode.IMPOSSIBLE_DIMENSIONS,
      'Inseam cannot be > 70% of total height'
    );
  }
}


