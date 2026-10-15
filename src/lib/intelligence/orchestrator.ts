import { MeasurementProfile } from './measurement';
import { RankedProduct } from './product/types';
import { predictSize } from './brand';
import { generateRecommendations } from './product';

export interface UserIntelligence {
  fitIdentity: {
    primaryFitIntent: string;
    confidenceScore: number;
    lastUpdated: string;
  };
  measurements: MeasurementProfile;
  recommendations: RankedProduct[];
  brandPassport: Record<string, { size: string; confidence: number; message: string }>;
  insights: {
    message: string;
    type: 'positive' | 'warning' | 'info';
  }[];
}

/**
 * The central coordinator for all Intelligence Engines.
 * Connects Measurement, Brand, Product, Data, and (future) Learning engines
 * into a single unified payload for the UI to consume.
 */
export async function generateUserIntelligence(userId: string): Promise<UserIntelligence> {
  // In production, fetch this from Data Layer (history.ts)
  // Mocking for now to satisfy UI requirements
  const mockMeasurements: MeasurementProfile = {
    userId,
    version: '2.0.0',
    source: 'camera',
    measurements: { chest: 98, waist: 82, hip: 95, shoulderWidth: 44, inseam: 80 },
    confidence: { overall: 92, dimensions: {} },
    metadata: { algorithmVersion: '2.1.0', extractedAt: new Date().toISOString() }
  };

  // Run Brand Passport predictions
  const nike = await predictSize(mockMeasurements, 'nike', 'tops');
  const zara = await predictSize(mockMeasurements, 'zara', 'tops');

  const brandPassport = {
    nike: { size: nike.recommendedSize, confidence: nike.confidenceScore, message: nike.explanations[0]?.message || '' },
    zara: { size: zara.recommendedSize, confidence: zara.confidenceScore, message: zara.explanations[0]?.message || '' }
  };

  // Generate Recommendations
  const recommendations = await generateRecommendations({
    profile: mockMeasurements,
    style: { preferredAesthetics: ['Athletic Contemporary', 'Minimalist'], preferredMaterials: ['cotton'], avoidMaterials: ['polyester'], fitPreference: 'slim' },
    query: { category: 'tops', gender: 'men' }
  });

  // Mocking insights (Epic 6 will provide real insights)
  const insights = [
    { message: `${recommendations.length} products fit perfectly based on your latest scan.`, type: 'positive' as const },
    { message: 'Zara updated their size charts this week. Your passport has been automatically recalibrated.', type: 'info' as const },
    { message: 'Your measurement confidence improved by 4% compared to last month.', type: 'positive' as const }
  ];

  return {
    fitIdentity: {
      primaryFitIntent: 'Athletic Contemporary',
      confidenceScore: mockMeasurements.confidence.overall,
      lastUpdated: 'Today' // In prod, derive from metadata.extractedAt
    },
    measurements: mockMeasurements,
    recommendations,
    brandPassport,
    insights
  };
}
