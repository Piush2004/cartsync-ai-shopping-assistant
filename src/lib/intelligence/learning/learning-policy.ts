/**
 * Centralized rules for the Learning Engine.
 * Keeps business logic and tuning parameters out of the execution code.
 */

export const LearningPolicy = {
  // Calibration Thresholds (How many consistent signals before we adjust biometrics?)
  calibration: {
    minReturnsToTriggerOffset: 3,
    minConsistentFeedbackToTriggerOffset: 2,
    maxOffsetPerAdjustment: 2.0, // max cm to adjust at once
    absoluteMaxOffsetLimit: 10.0 // never adjust more than 10cm from raw scan without requesting a new scan
  },

  // Confidence Rules
  confidence: {
    successIncrement: 2,  // +2% for kept item
    failureDecrement: 5,  // -5% for returned item due to fit
    decayPerMonth: 1,     // -1% per month if no new data (bodies change)
    maxConfidence: 98,
    minConfidence: 40     // below this, require a new scan
  },

  // Brand Intelligence Rules
  brand: {
    minPurchasesToEstablishAffinity: 2,
    returnPenalty: -15,
    favoriteBonus: 5,
    decayFactor: 0.95,     // Multiply affinity by 0.95 periodically to prioritize recent sentiment
    sizeOffsetThreshold: 3 // If returned 3 times for 'tight', permanently recommend size_up
  },

  // Style Intelligence Rules
  style: {
    consecutiveActionsToChangeImplicit: 5, // E.g., buy 5 'relaxed' items -> update implicit preference
    abandonmentDecay: 0.90 // Decay style affinity if no interaction in 6 months
  },

  // Behavioral Intelligence Thresholds
  behaviour: {
    minBrowsingTimeForInterestSeconds: 120,
    minClicksForInterest: 5
  },

  // Memory Policies
  memory: {
    episodicRetentionMonths: 24, // Forget specific browsing sessions after 2 years
    semanticRetentionMonths: 120 // Keep learned facts (e.g., brand sizing bias) for 10 years
  }
};

