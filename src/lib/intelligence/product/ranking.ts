import { Product, UserStyleProfile, RankedProduct } from './types';

/**
 * Calculates a style match score (0-100) based on user preferences vs product attributes.
 */
function calculateStyleScore(product: Product, profile: UserStyleProfile): number {
  let score = 50; // Baseline

  // 1. Aesthetics match
  const aestheticMatches = product.attributes.aesthetic.filter(a => profile.preferredAesthetics.includes(a));
  score += aestheticMatches.length * 15;

  // 2. Fit Intent match
  if (product.attributes.fitIntent === profile.fitPreference) {
    score += 20;
  } else if (
    (profile.fitPreference === 'slim' && product.attributes.fitIntent === 'oversized') ||
    (profile.fitPreference === 'oversized' && product.attributes.fitIntent === 'slim')
  ) {
    score -= 30; // Strong penalty for opposite fit preference
  }

  // 3. Material match/avoid
  const materialMatches = product.attributes.material.filter(m => profile.preferredMaterials.includes(m));
  score += materialMatches.length * 10;

  const avoids = product.attributes.material.filter(m => profile.avoidMaterials.includes(m));
  if (avoids.length > 0) {
    score -= 40; // Penalty for disliked materials
  }

  return Math.min(Math.max(score, 0), 100);
}

/**
 * The Hybrid Ranking Algorithm.
 * Multiplies FitScore x StyleScore to determine the final rank.
 */
export function rankProducts(
  products: Array<{ product: Product; bestSize: string; fitConfidence: number }>,
  profile: UserStyleProfile
): Omit<RankedProduct, 'reasons'>[] {
  
  const ranked = products.map(item => {
    // Drop products where the recommended size is out of stock
    if (!item.product.inStockSizes.includes(item.bestSize)) {
      return null;
    }

    const styleMatchScore = calculateStyleScore(item.product, profile);
    
    // Convert 0-100 scales to 0-1 for multiplication
    const fitFactor = item.fitConfidence / 100;
    const styleFactor = styleMatchScore / 100;
    
    // Overall rank is a hybrid. Fit is slightly more important than style.
    // 60% Fit, 40% Style
    const overallRankScore = Math.round(((fitFactor * 0.6) + (styleFactor * 0.4)) * 100);

    return {
      ...item.product,
      recommendedSize: item.bestSize,
      fitConfidence: item.fitConfidence,
      styleMatchScore,
      overallRankScore
    };
  }).filter(Boolean) as Omit<RankedProduct, 'reasons'>[];

  // Sort highest rank first
  ranked.sort((a, b) => b.overallRankScore - a.overallRankScore);

  return ranked;
}
