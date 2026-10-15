import { StylistRequest, StylistResponse, DecisionRecord } from './types';
import { UserKnowledgeGraph } from '../learning/types';
import { manageContext } from './context-manager';
import { buildStylistContext } from './context-builder';
import { parseStylistIntent } from './intent-parser';
import { createExecutionPlan } from './planner';
import { executePlan } from './tool-router';
import { evaluateDecisions } from './decision-engine';
import { generateStylistResponse } from './response-generator';
import { enforceGuardrails } from './guardrails';

/**
 * Main entrypoint for the AI Stylist.
 * Implements the architecture: Context Manager -> Context Builder -> Intent -> Planner -> Router -> Decision -> Response -> Guardrails.
 */
export async function chatWithStylist(
  request: StylistRequest,
  graph: UserKnowledgeGraph
): Promise<StylistResponse> {
  // 0. Context Manager: Prune and prioritize graph nodes
  const managedGraph = manageContext(graph);

  // 1. Serialize Graph into LLM-readable context
  const contextString = buildStylistContext(managedGraph);

  // 2. Parse natural language into structured intent
  const intent = await parseStylistIntent(request.message, contextString);

  // 3. Planner: Decompose intent into execution steps
  const plan = await createExecutionPlan(intent, graph);

  // 4. Tool Router: Execute the plan against deterministic engines
  const toolResults = await executePlan(plan, graph);

  // 5. Decision Engine: Compare tradeoffs, resolve conflicts
  // Extract products from tool results for decisioning
  let allProducts: any[] = [];
  Object.values(toolResults).forEach(result => {
    if (Array.isArray(result) && result[0]?.overallRankScore !== undefined) {
      allProducts.push(...result);
    }
  });
  
  const decisionRecord: DecisionRecord = evaluateDecisions(allProducts, graph);

  // 6. Response Generator: Combine structured data with conversational explanation
  const rawResponse = await generateStylistResponse(intent, graph, decisionRecord, contextString);

  // 7. Guardrails: Verify no hallucination rules before sending to client
  return enforceGuardrails(rawResponse);
}

export * from './types';
export * from './context-builder';
export * from './intent-parser';
export * from './planner';
export * from './tool-router';
export * from './decision-engine';
export * from './response-generator';
export * from './guardrails';

