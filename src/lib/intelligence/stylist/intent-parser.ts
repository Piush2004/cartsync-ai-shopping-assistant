import { StylistIntent } from './types';

/**
 * Parses natural language into a structured StylistIntent.
 * In production, this uses Gemini with Function Calling (Structured Outputs).
 */
export async function parseStylistIntent(message: string, contextString: string): Promise<StylistIntent> {
  const lowerMsg = message.toLowerCase();

  // Basic mock parsing for v3.0 execution
  
  if (lowerMsg.includes('why') && (lowerMsg.includes('fit') || lowerMsg.includes('zara') || lowerMsg.includes('nike'))) {
    return {
      action: 'explain_fit',
      targetBrand: lowerMsg.includes('zara') ? 'zara' : (lowerMsg.includes('nike') ? 'nike' : undefined)
    };
  }

  if (lowerMsg.includes('wedding') || lowerMsg.includes('summer') || lowerMsg.includes('find') || lowerMsg.includes('suit')) {
    const searchParams: any = { aesthetics: [] };
    
    if (lowerMsg.includes('wedding')) searchParams.occasions = ['wedding', 'formal'];
    if (lowerMsg.includes('summer')) searchParams.aesthetics.push('summer');
    if (lowerMsg.includes('suit') || lowerMsg.includes('shirt')) {
      searchParams.category = 'tops'; // Simplification for MVP
    }
    if (lowerMsg.includes('linen')) searchParams.materials = ['linen'];

    return {
      action: 'search',
      searchParams
    };
  }

  return { action: 'general_advice' };
}
