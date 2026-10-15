import { LearningPolicy } from './learning-policy';

export interface ConfidenceAdjustmentResult {
  newConfidence: number;
  reason: string;
}

/**
 * Adjusts the overall system confidence based on explicit behavioral evidence.
 * 
 * Rules:
 * - A successful purchase (kept item) adds small confidence (+2).
 * - A return due to fit subtracts significant confidence (-5).
 * - Time decay lowers confidence slightly over months (bodies change).
 */
export function adjustConfidence(
  currentConfidence: number,
  event: 'successful_purchase' | 'fit_return' | 'time_decay'
): ConfidenceAdjustmentResult {
  let newConf = currentConfidence;
  let reason = '';

  switch (event) {
    case 'successful_purchase':
      newConf += LearningPolicy.confidence.successIncrement;
      reason = `Increased due to successful purchase validation (+${LearningPolicy.confidence.successIncrement}%)`;
      break;
    case 'fit_return':
      newConf -= LearningPolicy.confidence.failureDecrement;
      reason = `Decreased due to item returned for fit issues (-${LearningPolicy.confidence.failureDecrement}%)`;
      break;
    case 'time_decay':
      newConf -= LearningPolicy.confidence.decayPerMonth;
      reason = `Decreased due to time elapsed since last scan (-${LearningPolicy.confidence.decayPerMonth}%)`;
      break;
  }

  // Enforce bounds
  newConf = Math.max(LearningPolicy.confidence.minConfidence, Math.min(LearningPolicy.confidence.maxConfidence, newConf));

  return {
    newConfidence: newConf,
    reason
  };
}
