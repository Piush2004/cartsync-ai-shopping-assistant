import { StylistIntent, StylistResponse, DecisionRecord, StylistConfidence } from './types';
import { UserKnowledgeGraph } from '../learning/types';

/**
 * Generates the final StylistResponse.
 * Uses the DecisionRecord instead of executing the engines directly.
 */
export async function generateStylistResponse(
  intent: StylistIntent,
  graph: UserKnowledgeGraph,
  decisionRecord: DecisionRecord,
  llmContext: string
): Promise<StylistResponse> {
  
  // Base Confidence (In prod, LLM structured outputs provide these)
  const confidence: StylistConfidence = {
    answerConfidence: 0.95,
    fitConfidence: 0.92,
    styleConfidence: 0.88,
    brandConfidence: 0.90
  };

  // 1. Handle "Explain Fit"
  if (intent.action === 'explain_fit') {
    const targetBrand = intent.targetBrand || 'that brand';
    const brandData = graph.brandIntelligence.brands[targetBrand];
    
    let message = `Looking at your Knowledge Graph, you have a strong affinity for ${targetBrand}. `;
    if (brandData && brandData.find(c => c.category === 'tops')?.fitPattern === 'true_to_size') {
      message += `Their tops map almost perfectly to your geometric measurements without requiring any offset calibrations. `;
    } else if (graph.bodyIntelligence.calibrationOffsets.find(o => o.dimension === 'chest')) {
      message += `We've had to calibrate your chest measurement because you prefer a relaxed fit, and ${targetBrand}'s patterns accommodate that naturally.`;
    }

    return {
      message,
      suggestedPrompts: [`Show me ${targetBrand} tops`, `Compare ${targetBrand} with another brand`],
      confidence
    };
  }

  // 2. Handle "Search" or "Complex Plan"
  if ((intent.action === 'search' || intent.action === 'complex_plan') && decisionRecord.selectedProducts.length > 0) {
    return {
      message: `I've found ${decisionRecord.selectedProducts.length} options that mathematically fit your geometry. ${decisionRecord.tradeoffs.join(' ')}`,
      products: decisionRecord.selectedProducts,
      suggestedPrompts: ['Show me cheaper options', 'Different colors', 'Why these?'],
      confidence,
      decisionSummary: decisionRecord.reasoning
    };
  }

  // 3. Handle "General Advice"
  return {
    message: "I'm your Personal AI Stylist. I can recommend outfits based on your exact body geometry, or explain why certain brands fit you differently. What are you looking for today?",
    suggestedPrompts: ["Build an outfit for a date night", "Why do I always return pants?", "Show me my fit DNA"],
    confidence
  };
}

