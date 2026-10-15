import { RankedProduct, UserStyleProfile } from './types';
import { FitExplanation } from '../brand';

/**
 * Generates conversational, explainable AI responses for why a product was recommended.
 * Combines mathematical fit explanations with stylistic matching.
 */
export function generateRecommendationReasons(
  product: Omit<RankedProduct, 'reasons'>,
  fitExplanations: FitExplanation[],
  profile: UserStyleProfile
): string[] {
  const reasons: string[] = [];

  // 1. Core Fit Reason (Take the most important dimension based on category)
  // For tops, prioritize chest/waist.
  let primaryFit = fitExplanations.find(e => e.dimension.toLowerCase() === 'chest');
  if (!primaryFit) primaryFit = fitExplanations.find(e => e.dimension.toLowerCase() === 'waist');
  
  if (primaryFit) {
    if (primaryFit.state === 'perfect') {
      reasons.push(`The ${primaryFit.dimension.toLowerCase()} is a perfect mathematical match for your measurements.`);
    } else {
      reasons.push(primaryFit.message); // E.g., "Provides extra allowance for a relaxed drape."
    }
  }

  // 2. Style Match Reason
  const matchingAesthetics = product.attributes.aesthetic.filter(a => profile.preferredAesthetics.includes(a));
  if (matchingAesthetics.length > 0) {
    reasons.push(`Matches your preference for ${matchingAesthetics[0]} aesthetics.`);
  }

  // 3. Fit Intent & Material
  if (product.attributes.fitIntent === profile.fitPreference) {
    reasons.push(`Designed with the ${profile.fitPreference} fit you prefer.`);
  }

  const matchingMaterials = product.attributes.material.filter(m => profile.preferredMaterials.includes(m));
  if (matchingMaterials.length > 0) {
    reasons.push(`Made with ${matchingMaterials.join(' and ')}, which you typically prefer.`);
  }

  // Fallback if we somehow have no reasons
  if (reasons.length === 0) {
    reasons.push(`Recommended based on your overall measurement profile and sizing constraints.`);
  }

  return reasons;
}
