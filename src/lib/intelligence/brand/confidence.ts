import { BodyMeasurements, MeasurementProfile } from '../measurement';
import { SizeDimension } from './types';

interface ConfidenceFactors {
  brandQuality: number;
  fabricStretch: number;
  userHistory: number;
}

/**
 * Calculates final size confidence using the formula:
 * Final Confidence = Measurement × Brand × Fabric × History × Boundary
 */
export function calculateSizeConfidence(
  profile: MeasurementProfile,
  size: SizeDimension,
  category: string,
  factors: ConfidenceFactors = { brandQuality: 0.95, fabricStretch: 1.0, userHistory: 1.0 }
): number {
  const measurements = profile.measurements;
  const measurementConfidence = profile.confidence.overall / 100; // Convert 0-100 to 0-1

  // 1. Calculate Boundary Confidence
  const dimensionsToEval: Array<keyof BodyMeasurements> = [];
  if (category === 'tops' || category === 'outerwear' || category === 'dresses') {
    dimensionsToEval.push('chest', 'waist');
  }
  if (category === 'bottoms' || category === 'dresses') {
    dimensionsToEval.push('waist', 'hip');
  }

  let totalBoundaryConf = 0;
  let dimensionsEvaluated = 0;

  dimensionsToEval.forEach(dim => {
    const sizeRange = size[dim as keyof SizeDimension] as { min: number; max: number } | undefined;
    const userVal = measurements[dim];

    if (sizeRange && userVal !== undefined) {
      const center = (sizeRange.min + sizeRange.max) / 2;
      const range = sizeRange.max - sizeRange.min;
      const distanceFromCenter = Math.abs(userVal - center);
      const normalizedDistance = distanceFromCenter / (range / 2);
      
      let dimensionConf = 1.0;
      if (normalizedDistance <= 0.2) {
        dimensionConf = 1.0;
      } else if (normalizedDistance <= 0.8) {
        dimensionConf = 1.0 - ((normalizedDistance - 0.2) / 0.6) * 0.2; // down to 0.8
      } else if (normalizedDistance <= 1.0) {
        dimensionConf = 0.8 - ((normalizedDistance - 0.8) / 0.2) * 0.3; // down to 0.5
      } else {
        dimensionConf = Math.max(0.1, 0.5 - ((normalizedDistance - 1.0) * 0.5));
      }

      let weight = 1.0;
      if (category === 'tops' && dim === 'chest') weight = 1.5;
      if (category === 'bottoms' && dim === 'waist') weight = 1.5;

      totalBoundaryConf += dimensionConf * weight;
      dimensionsEvaluated += weight;
    }
  });

  const boundaryConfidence = dimensionsEvaluated > 0 ? (totalBoundaryConf / dimensionsEvaluated) : 0;

  // 2. Final Multiplicative Formula
  const finalScore = 
    measurementConfidence * 
    factors.brandQuality * 
    factors.fabricStretch * 
    factors.userHistory * 
    boundaryConfidence;

  return Math.min(Math.round(finalScore * 100), 100);
}

