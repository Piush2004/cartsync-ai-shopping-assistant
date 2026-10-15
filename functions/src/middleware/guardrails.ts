import { Gender, GuardrailResult } from '../utils/types';

// Categories of clothing that are inherently gendered in this context
const GENDERED_CATEGORIES = [
  'dress',
  'skirt',
  'lehenga',
  'saree',
  'kurta',
  'sherwani',
  'suit'
];

/**
 * Pre-Flight Visual Guardrail to block cross-gender clothing try-ons.
 * 
 * Policy:
 * 1. If the product category is in the restricted list (GENDERED_CATEGORIES)
 * 2. AND the user's gender does not match the product's intended gender
 * 3. AND neither the user nor the product is classified as 'non-binary'
 * Then block the request.
 * 
 * @param userGender The user's self-identified gender
 * @param productGender The intended gender for the product
 * @param productCategory The category of the product
 * @returns GuardrailResult indicating pass/fail status
 */
export function preFlightVTONCheck(
  userGender: Gender,
  productGender: Gender,
  productCategory: string
): GuardrailResult {
  const isGenderedCategory = GENDERED_CATEGORIES.includes(productCategory.toLowerCase());
  
  if (
    isGenderedCategory && 
    userGender !== productGender && 
    userGender !== 'non-binary' && 
    productGender !== 'non-binary'
  ) {
    return {
      passed: false,
      reason: 'Cross-gender try-on blocked for gendered garment category',
      code: 403
    };
  }

  return { passed: true };
}
