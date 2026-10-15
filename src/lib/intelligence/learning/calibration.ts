import { CalibrationOffset, BodyIntelligence } from './types';
import { MeasurementProfile } from '../measurement';
import { LearningPolicy } from './learning-policy';

/**
 * Calculates effective measurements without destroying raw scan data.
 * rawMeasurements + calibrationOffsets = effectiveMeasurements.
 */
export function computeEffectiveMeasurements(
  raw: MeasurementProfile, 
  offsets: CalibrationOffset[]
): Record<string, number> {
  const effective: Record<string, number> = { ...raw.measurements };

  offsets.forEach(offset => {
    if (effective[offset.dimension] !== undefined) {
      effective[offset.dimension] += offset.offsetValue;
    }
  });

  return effective;
}

/**
 * Generates a new offset array based on feedback analysis.
 * Enforces absolute limits defined in the LearningPolicy.
 */
export function applyCalibrationDeltas(
  currentOffsets: CalibrationOffset[],
  suggestedDeltas: Record<string, number>,
  reason: string
): CalibrationOffset[] {
  const newOffsets = [...currentOffsets];

  Object.entries(suggestedDeltas).forEach(([dimension, delta]) => {
    const existingIndex = newOffsets.findIndex(o => o.dimension === dimension);
    
    if (existingIndex >= 0) {
      let newValue = newOffsets[existingIndex].offsetValue + delta;
      
      // Enforce absolute limits
      const limit = LearningPolicy.calibration.absoluteMaxOffsetLimit;
      newValue = Math.max(-limit, Math.min(limit, newValue));
      
      newOffsets[existingIndex] = {
        ...newOffsets[existingIndex],
        offsetValue: newValue,
        confidence: newOffsets[existingIndex].confidence + 10, // Confidence in this offset grows as we validate it
        timestamp: new Date().toISOString(),
        reason
      };
    } else {
      newOffsets.push({
        dimension: dimension as keyof MeasurementProfile['measurements'],
        offsetValue: delta,
        confidence: 50, // Initial confidence for a new offset
        timestamp: new Date().toISOString(),
        reason
      });
    }
  });

  return newOffsets;
}

