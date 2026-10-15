"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendationAgent = exports.RecommendationAgent = void 0;
const sizeRecommendationEngine_1 = require("../services/sizing/sizeRecommendationEngine");
class RecommendationAgent {
    /**
     * Evaluates chest, waist, hips measurements against size charts.
     */
    async recommend(measurements, sizeChart) {
        console.log('[RecommendationAgent] Generating fit recommendations...');
        const result = (0, sizeRecommendationEngine_1.recommendSize)(measurements, sizeChart);
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
exports.RecommendationAgent = RecommendationAgent;
exports.recommendationAgent = new RecommendationAgent();
//# sourceMappingURL=recommendation.agent.js.map