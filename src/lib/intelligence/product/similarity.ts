import { Product, RankedProduct, UserStyleProfile } from './types';
import { CatalogRepository } from './catalog';
import { predictSize } from '../brand';
import { rankProducts } from './ranking';
import { generateRecommendationReasons } from './explainability';
import { MeasurementProfile } from '../measurement';

export interface SimilarityQuery {
  targetProductId: string;
  crossBrand?: boolean; // If true, explicitly look for other brands
  matchFit?: boolean;   // If true, prioritize products that yield the same fit confidence
}

/**
 * Finds similar products based on a target product's attributes.
 * "Liked this -> Find similar -> Different brand -> Same fit"
 */
export async function findSimilarProducts(
  query: SimilarityQuery,
  profile: MeasurementProfile,
  styleProfile: UserStyleProfile,
  catalogRepo: CatalogRepository
): Promise<RankedProduct[]> {
  const targetProduct = await catalogRepo.getProductById(query.targetProductId);
  if (!targetProduct) {
    throw new Error('Target product not found');
  }

  // 1. Get baseline target products in the same category
  let candidates = await catalogRepo.getProductsByCategory(targetProduct.category, targetProduct.gender);

  // 2. Apply explicit constraints
  if (query.crossBrand) {
    candidates = candidates.filter(p => p.brandSlug !== targetProduct.brandSlug);
  } else {
    // Remove the target product itself
    candidates = candidates.filter(p => p.id !== targetProduct.id);
  }

  // 3. Run predictions on candidates
  const fitResults = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        const prediction = await predictSize(profile, candidate.brandSlug, candidate.category);
        return {
          product: candidate,
          bestSize: prediction.recommendedSize,
          fitConfidence: prediction.confidenceScore,
          fitExplanations: prediction.explanations
        };
      } catch (e) {
        // Ignore if size chart doesn't exist for a candidate
        return null;
      }
    })
  );

  const validFits = fitResults.filter(Boolean) as Array<{
    product: Product;
    bestSize: string;
    fitConfidence: number;
    fitExplanations: any[];
  }>;

  // 4. Modify style profile temporarily to match target product's exact attributes
  const temporaryStyleProfile: UserStyleProfile = {
    ...styleProfile,
    preferredAesthetics: [...new Set([...styleProfile.preferredAesthetics, ...targetProduct.attributes.aesthetic])],
    fitPreference: targetProduct.attributes.fitIntent
  };

  // 5. Rank the candidates
  const ranked = rankProducts(validFits, temporaryStyleProfile);

  // 6. Generate explainability
  return ranked.map(r => {
    const originalFit = validFits.find(f => f.product.id === r.id);
    const reasons = generateRecommendationReasons(r, originalFit?.fitExplanations || [], temporaryStyleProfile);
    
    if (query.matchFit) {
      reasons.unshift(`Features a similar ${targetProduct.attributes.fitIntent} drape as the ${targetProduct.title}.`);
    }

    return {
      ...r,
      reasons
    };
  });
}
