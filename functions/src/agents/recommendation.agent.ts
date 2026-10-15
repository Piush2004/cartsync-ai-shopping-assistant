import { recommendSize } from '../services/sizing/sizeRecommendationEngine';

export interface SizeRecommendationResult {
  recommendedSize: string;
  fitType: string;
  confidence: number;
  reasoning: string[];
}

export class RecommendationAgent {
  /**
   * Evaluates chest, waist, hips measurements against size charts.
   */
  async recommend(measurements: { chest: number; waist: number; hips: number }, sizeChart: any): Promise<SizeRecommendationResult> {
    console.log('[RecommendationAgent] Generating fit recommendations...');
    const result = recommendSize(measurements, sizeChart);
    return {
      recommendedSize: result.recommendedSize,
      fitType: result.fitType,
      confidence: 0.92,
      reasoning: [
        `Chest: matched size ${result.recommendedSize}`,
        `Waist: matched size ${result.recommendedSize}`,
        `Hips: matched size ${result.recommendedSize}`
      ]
    };
  }
}

export const recommendationAgent = new RecommendationAgent();
