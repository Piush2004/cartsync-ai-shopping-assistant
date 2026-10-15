import { UserKnowledgeGraph } from '../learning/types';

/**
 * Serializes the complex UserKnowledgeGraph into a dense string
 * optimized for the LLM context window.
 */
export function buildStylistContext(graph: UserKnowledgeGraph): string {
  let context = `[USER KNOWLEDGE GRAPH]\n`;
  context += `User ID: ${graph.userId}\n`;
  
  // Biometrics
  context += `\n[EFFECTIVE BIOMETRICS]\n`;
  Object.entries(graph.bodyIntelligence.effectiveMeasurements).forEach(([dim, val]) => {
    context += `- ${dim}: ${val}cm\n`;
  });
  
  // Calibration Insights
  if (graph.bodyIntelligence.calibrationOffsets.length > 0) {
    context += `\n[CALIBRATION OFFSETS]\n`;
    context += `(The user's raw measurements were adjusted based on their return history. Use this to explain fit issues.)\n`;
    graph.bodyIntelligence.calibrationOffsets.forEach(offset => {
      context += `- ${offset.dimension}: ${offset.offsetValue > 0 ? '+' : ''}${offset.offsetValue}cm (Reason: ${offset.reason})\n`;
    });
  }

  // Style Profile
  context += `\n[STYLE PROFILE]\n`;
  context += `- Preferred Aesthetics: ${Object.keys(graph.styleIntelligence.aesthetics).join(', ')}\n`;
  context += `- Fit Intents: ${Object.keys(graph.styleIntelligence.fitIntents).join(', ')}\n`;

  // Brand Affinity
  context += `\n[BRAND AFFINITY & SIZING BIAS]\n`;
  Object.entries(graph.brandIntelligence.brands).forEach(([brand, categories]) => {
    context += `- ${brand.toUpperCase()}:\n`;
    categories.forEach((cat) => {
      context += `  - ${cat.category}: ${cat.fitPattern} (Confidence: ${cat.confidence}%)\n`;
    });
  });

  context += `\n[SYSTEM DIRECTIVE]\n`;
  context += `You are CartSync AI, a highly analytical, premium fashion stylist. 
Do not hallucinate sizes. You are constrained by the exact biometrics and brand biases listed above. 
If the user asks why something fits, refer to their Calibration Offsets and Brand Affinity.`;

  return context;
}

