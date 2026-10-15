"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendSize = recommendSize;
/**
 * Size Recommendation Engine
 * Compares computed measurements against brand size charts to recommend the best fit.
 */
function recommendSize(measurements, chart) {
    let bestSize = "";
    let highestScore = -1;
    let bestReasoning = [];
    for (const [size, ranges] of Object.entries(chart)) {
        let score = 0;
        let reasoning = [];
        // Evaluate Chest
        if (measurements.chest >= ranges.chest[0] && measurements.chest <= ranges.chest[1]) {
            score += 1;
            reasoning.push(`Chest measurement (${measurements.chest}cm) matches ${size}`);
        }
        else if (measurements.chest < ranges.chest[0]) {
            reasoning.push(`${size} might be oversized in the chest`);
        }
        else {
            reasoning.push(`${size} might be a tight fit in the chest`);
        }
        // Evaluate Waist
        if (measurements.waist >= ranges.waist[0] && measurements.waist <= ranges.waist[1]) {
            score += 1;
            reasoning.push(`Waist measurement falls within ${size} range`);
        }
        else if (measurements.waist > ranges.waist[1]) {
            reasoning.push(`${size} will be tight on the waist`);
        }
        // Evaluate Hips
        if (measurements.hips >= ranges.hips[0] && measurements.hips <= ranges.hips[1]) {
            score += 1;
            reasoning.push(`Hips measurement matches ${size}`);
        }
        if (score > highestScore) {
            highestScore = score;
            bestSize = size;
            bestReasoning = reasoning;
        }
    }
    // Calculate generic confidence
    const confidence = highestScore / 3;
    // Determine fit type and detect risks
    let fitType = "Regular";
    const isTightRisk = bestReasoning.some(r => r.includes('tight'));
    const isOversizedRisk = bestReasoning.some(r => r.includes('oversized'));
    if (confidence < 0.6) {
        fitType = "Warning: Check Measurements";
    }
    else if (isTightRisk) {
        fitType = "Slim / Tight";
    }
    else if (isOversizedRisk) {
        fitType = "Oversized / Loose";
    }
    return {
        recommendedSize: bestSize || "Unknown",
        confidence: Number(confidence.toFixed(2)),
        fitType,
        reasoning: bestReasoning
    };
}
//# sourceMappingURL=sizeRecommendationEngine.js.map