import { DecisionRecord } from './types';
import { RankedProduct } from '../product/types';
import { UserKnowledgeGraph } from '../learning/types';

/**
 * Separates business decisions from language generation.
 * Compares options, ranks tradeoffs, and ensures only the best products 
 * are passed to the final LLM response generator.
 */
export function evaluateDecisions(
  rawProducts: RankedProduct[],
  graph: UserKnowledgeGraph
): DecisionRecord {
  // 1. Sort by overallRankScore (which already includes geometry and base style)
  const sorted = [...rawProducts].sort((a, b) => b.overallRankScore - a.overallRankScore);

  // 2. Resolve Conflicts (e.g. Budget vs Quality)
  const selected: RankedProduct[] = [];
  const rejected: RankedProduct[] = [];
  const tradeoffs: string[] = [];

  const maxBudget = graph.contextIntelligence.budgetMax || Infinity;

  sorted.forEach(product => {
    // Conflict: Perfect fit, but over budget
    if (product.price > maxBudget) {
      if (product.overallRankScore > 95) {
        tradeoffs.push(`Included ${product.title} despite being over budget because fit is >95%.`);
        selected.push(product);
      } else {
        rejected.push(product);
      }
    } else {
      selected.push(product);
    }
  });

  // 3. Limit to top 3 choices to prevent cognitive overload
  const finalSelection = selected.slice(0, 3);
  rejected.push(...selected.slice(3));

  return {
    selectedProducts: finalSelection,
    rejectedProducts: rejected,
    tradeoffs,
    reasoning: `Selected top ${finalSelection.length} items balancing fit confidence and user budget constraints.`
  };
}
