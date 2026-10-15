import { StylistResponse } from './types';

export class GuardrailViolation extends Error {
  constructor(message: string) {
    super(`Guardrail Violation: ${message}`);
    this.name = 'GuardrailViolation';
  }
}

/**
 * Enforces the "No Hallucination" rule in code.
 * Validates the final response before it is sent to the user.
 */
export function enforceGuardrails(response: StylistResponse): StylistResponse {
  // 1. Prohibit unsupported claims
  const lowerMsg = response.message.toLowerCase();
  if (lowerMsg.includes('i guarantee this will fit') || lowerMsg.includes('100% perfect fit')) {
    throw new GuardrailViolation('Stylist cannot make absolute guarantees about fit.');
  }

  // 2. Verify product recommendations have deterministic backing
  if (response.products && response.products.length > 0) {
    response.products.forEach(product => {
      if (!product.recommendedSize) {
        throw new GuardrailViolation(`Product ${product.id} is missing a deterministic recommended size.`);
      }
      if (product.overallRankScore < 50) {
         throw new GuardrailViolation(`Product ${product.id} rank score (${product.overallRankScore}) is below minimum safety threshold (50).`);
      }
    });
  }

  // 3. Ensure structured confidence is present
  if (!response.confidence || response.confidence.answerConfidence === undefined) {
    throw new GuardrailViolation('Structured confidence is missing from response.');
  }

  return response;
}
