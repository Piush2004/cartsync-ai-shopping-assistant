import { BodyMeasurements } from '../measurement';
import { SizeDimension, FitExplanation, GarmentCategory } from './types';

/**
 * Generates natural language fit explanations deterministically based on
 * the difference between user measurements and the garment's target measurements.
 */
export function generateFitExplanations(
  measurements: BodyMeasurements,
  size: SizeDimension,
  category: GarmentCategory
): FitExplanation[] {
  const explanations: FitExplanation[] = [];

  const evaluateDimension = (dimName: keyof BodyMeasurements, label: string) => {
    const sizeRange = size[dimName as keyof SizeDimension] as { min: number; max: number } | undefined;
    const userVal = measurements[dimName];

    if (sizeRange && userVal !== undefined) {
      const center = (sizeRange.min + sizeRange.max) / 2;
      const range = sizeRange.max - sizeRange.min;
      const delta = userVal - center; // Positive means user is larger than center
      const threshold = range * 0.4; // 40% of range from center is "tight" or "relaxed"

      let state: FitExplanation['state'];
      let message: string;

      // Delta < 0 means garment is larger than user (relaxed)
      // Delta > 0 means user is larger than garment center (tight)
      
      if (Math.abs(delta) <= threshold) {
        state = 'perfect';
        message = `${label} fits perfectly within intended design limits.`;
      } else if (delta > threshold && userVal <= sizeRange.max) {
        state = 'tight';
        message = `${label} will have a slightly closer, more tailored fit.`;
      } else if (delta < -threshold && userVal >= sizeRange.min) {
        state = 'relaxed';
        message = `${label} provides extra allowance for a relaxed drape.`;
      } else if (delta > 0) {
        state = 'tight';
        message = `${label} measurements are near the maximum limit for this size. Expect a very snug fit.`;
      } else {
        state = 'loose';
        message = `${label} has significant extra fabric (${Math.round(Math.abs(delta))}cm allowance).`;
      }

      explanations.push({ dimension: label, state, message });
    }
  };

  if (category === 'tops' || category === 'outerwear' || category === 'dresses') {
    evaluateDimension('chest', 'Chest');
    evaluateDimension('waist', 'Waist');
  }
  
  if (category === 'bottoms') {
    evaluateDimension('waist', 'Waist');
    evaluateDimension('hip', 'Hips');
    if (measurements.inseam && size.inseam) evaluateDimension('inseam', 'Inseam');
  }

  return explanations;
}
