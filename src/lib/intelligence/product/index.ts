import { Product, RankedProduct, UserStyleProfile, SearchQuery } from './types';
import { CatalogRepository, InMemoryCatalogRepository } from './catalog';
import { searchCatalog } from './search';
import { rankProducts } from './ranking';
import { generateRecommendationReasons } from './explainability';
import { predictSize } from '../brand';
import { MeasurementProfile } from '../measurement';

export interface RecommendationRequest {
  profile: MeasurementProfile;
  style: UserStyleProfile;
  query: SearchQuery;
}

/**
 * Main entry point for the Product Intelligence Engine.
 * Generates highly personalized, explainable product recommendations.
 */
export async function generateRecommendations(
  request: RecommendationRequest,
  catalogRepo: CatalogRepository = new InMemoryCatalogRepository()
): Promise<RankedProduct[]> {
  
  // 1. Fetch initial candidates matching category/gender
  if (!request.query.category || !request.query.gender) {
    throw new Error('Category and Gender are required for recommendations.');
  }

  const rawCatalog = await catalogRepo.getProductsByCategory(request.query.category, request.query.gender, 100);

  // 2. Filter candidates via Semantic Search (Aesthetics, Color, Price)
  const filteredCandidates = searchCatalog(rawCatalog, request.query);

  // 3. Compute Fit & Confidence via Brand Intelligence
  const fitResults = await Promise.all(
    filteredCandidates.map(async (candidate) => {
      try {
        const prediction = await predictSize(request.profile, candidate.brandSlug, candidate.category);
        return {
          product: candidate,
          bestSize: prediction.recommendedSize,
          fitConfidence: prediction.confidenceScore,
          fitExplanations: prediction.explanations
        };
      } catch (e) {
        // Drop product if we can't confidently predict the size (e.g., missing brand size chart)
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

  // 4. Rank products (FitScore x StyleScore)
  const ranked = rankProducts(validFits, request.style);

  // 5. Generate conversational explainability
  const finalRecommendations = ranked.map(r => {
    const originalFit = validFits.find(f => f.product.id === r.id);
    const reasons = generateRecommendationReasons(r, originalFit?.fitExplanations || [], request.style);
    return {
      ...r,
      reasons
    };
  });

  return finalRecommendations;
}

export * from './types';
export * from './catalog';
export * from './search';
export * from './ranking';
export * from './similarity';
export * from './explainability';
