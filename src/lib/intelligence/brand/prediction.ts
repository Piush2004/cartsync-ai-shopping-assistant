import { BodyMeasurements } from '../measurement';
import { SizeChart, SizeDimension } from './types';

interface PredictionResult {
  bestFit: SizeDimension;
  alternatives: SizeDimension[];
  dimensionErrors: Record<string, number>;
}

/**
 * Predicts the best size using a weighted constraint hierarchy rather than pure Euclidean distance.
 * This mimics how a human stylist selects clothing (e.g. Chest must fit first, then shoulders, then waist).
 */
export function predictBestSize(measurements: BodyMeasurements, chart: SizeChart): PredictionResult {
  if (chart.sizes.length === 0) {
    throw new Error('Size chart is empty');
  }

  // 1. Define the constraint hierarchy based on garment category
  let primaryConstraints: Array<keyof BodyMeasurements> = [];
  let secondaryConstraints: Array<keyof BodyMeasurements> = [];

  if (chart.category === 'tops' || chart.category === 'outerwear' || chart.category === 'dresses') {
    primaryConstraints = ['chest', 'shoulderWidth'];
    secondaryConstraints = ['waist', 'hip'];
  } else if (chart.category === 'bottoms') {
    primaryConstraints = ['waist', 'hip'];
    secondaryConstraints = ['inseam'];
  }

  const evaluateSize = (size: SizeDimension) => {
    let penaltyScore = 0;
    const errors: Record<string, number> = {};

    const checkDimension = (dim: keyof BodyMeasurements, weight: number) => {
      const sizeRange = size[dim as keyof SizeDimension] as { min: number; max: number } | undefined;
      const userVal = measurements[dim];

      if (sizeRange && userVal !== undefined) {
        const center = (sizeRange.min + sizeRange.max) / 2;
        const delta = userVal - center;
        errors[dim as string] = delta;

        // Hard constraint violation (User is significantly larger than max)
        if (userVal > sizeRange.max + 2) { // 2cm tolerance
          penaltyScore += 1000 * weight; // Huge penalty for simply not fitting
        } 
        // User is smaller than min (Garment is too big)
        else if (userVal < sizeRange.min - 2) {
          penaltyScore += 100 * weight; // Moderate penalty for being oversized
        } 
        // Within bounds, optimize for closeness to center
        else {
          penaltyScore += Math.abs(delta) * weight;
        }
      }
    };

    primaryConstraints.forEach(dim => checkDimension(dim, 3.0));
    secondaryConstraints.forEach(dim => checkDimension(dim, 1.0));

    return { size, penaltyScore, errors };
  };

  const results = chart.sizes.map(evaluateSize);

  // Sort by lowest penalty (closest match to stylist constraints)
  results.sort((a, b) => a.penaltyScore - b.penaltyScore);

  return {
    bestFit: results[0].size,
    alternatives: results.slice(1, 3).map(r => r.size),
    dimensionErrors: results[0].errors
  };
}

