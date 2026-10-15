import { FitFeedback } from '../../data/types';
import { LearningPolicy } from './learning-policy';

export interface FeedbackAnalysisResult {
  requiresCalibration: boolean;
  suggestedOffsets: Record<string, number>; // dimension -> offset in cm
  brandInsights: Array<{ brandSlug: string; category: string; sizingBias: 'size_up' | 'size_down' }>;
}

/**
 * Analyzes raw FitFeedback arrays to detect persistent patterns.
 * Applies the LearningPolicy to prevent reactionary single-event updates.
 */
export function analyzeFeedback(history: FitFeedback[]): FeedbackAnalysisResult {
  const result: FeedbackAnalysisResult = {
    requiresCalibration: false,
    suggestedOffsets: {},
    brandInsights: []
  };

  // Group feedback by dimension
  const chestFeedback = history.map(f => f.dimensionFeedback.chest).filter(Boolean);
  const waistFeedback = history.map(f => f.dimensionFeedback.waist).filter(Boolean);

  // Analyze Chest
  const tightChestCount = chestFeedback.filter(f => f === 'tight').length;
  if (tightChestCount >= LearningPolicy.calibration.minConsistentFeedbackToTriggerOffset) {
    result.requiresCalibration = true;
    result.suggestedOffsets['chest'] = LearningPolicy.calibration.maxOffsetPerAdjustment; // Increase chest measurement
  }

  const looseChestCount = chestFeedback.filter(f => f === 'loose').length;
  if (looseChestCount >= LearningPolicy.calibration.minConsistentFeedbackToTriggerOffset) {
    result.requiresCalibration = true;
    result.suggestedOffsets['chest'] = -LearningPolicy.calibration.maxOffsetPerAdjustment; // Decrease chest measurement
  }

  // Analyze Waist
  const tightWaistCount = waistFeedback.filter(f => f === 'tight').length;
  if (tightWaistCount >= LearningPolicy.calibration.minConsistentFeedbackToTriggerOffset) {
    result.requiresCalibration = true;
    result.suggestedOffsets['waist'] = LearningPolicy.calibration.maxOffsetPerAdjustment;
  }

  // TODO: Add Brand-specific pattern detection here (e.g., "Is it only Nike that is tight?")
  
  return result;
}
