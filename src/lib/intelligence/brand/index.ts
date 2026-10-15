import { MeasurementProfile } from '../measurement';
import { SizePrediction, GarmentCategory } from './types';
import { BrandRepository, InMemoryBrandRepository } from './database';
import { predictBestSize } from './prediction';
import { calculateSizeConfidence } from './confidence';
import { generateFitExplanations } from './explanation';

/**
 * Predicts the best fit size for a given brand and category.
 * Integrates database lookup, constraint matching, multi-factor confidence,
 * and deterministic fit explanations.
 */
export async function predictSize(
  profile: MeasurementProfile,
  brandSlug: string,
  category: GarmentCategory,
  repository: BrandRepository = new InMemoryBrandRepository(),
  gender: 'men' | 'women' | 'unisex' = 'men'
): Promise<SizePrediction> {
  const brand = await repository.getBrandBySlug(brandSlug);
  if (!brand) {
    throw new Error(`Brand ${brandSlug} not found.`);
  }

  const chart = await repository.getSizeChart(brand.id, category, gender);
  if (!chart) {
    throw new Error(`Size chart not found for ${brand.name} > ${category} > ${gender}.`);
  }

  // 1. Math-based prediction using weighted constraint hierarchy
  const { bestFit, alternatives } = predictBestSize(profile.measurements, chart);

  // 2. Multi-factor confidence calculation
  const confidenceScore = calculateSizeConfidence(profile, bestFit, category);

  // 3. Deterministic fit explanation generation
  const explanations = generateFitExplanations(profile.measurements, bestFit, category);

  // 4. Alternative formatting
  const altFormatted = alternatives.map(alt => {
    // Generate an explanation for the alternative
    const altExplanations = generateFitExplanations(profile.measurements, alt, category);
    const mainReason = altExplanations.length > 0 ? altExplanations[0].message : 'Alternative fit option.';
    return { size: alt.label, reason: mainReason };
  });

  return {
    brandSlug: brand.slug,
    category,
    recommendedSize: bestFit.label,
    confidenceScore,
    explanations,
    alternatives: altFormatted
  };
}

export * from './types';
export * from './database';
export * from './prediction';
export * from './confidence';
export * from './explanation';
