import { StylistIntent, ExecutionPlan, ExecutionStep } from './types';
import { UserKnowledgeGraph } from '../learning/types';

/**
 * The Planner decomposes complex user requests into discrete, actionable tool calls.
 * This prepares the system for full agentic capabilities.
 */
export async function createExecutionPlan(
  intent: StylistIntent,
  graph: UserKnowledgeGraph
): Promise<ExecutionPlan> {
  const steps: ExecutionStep[] = [];

  // If simple search, just route to Product Engine
  if (intent.action === 'search' || intent.complexity === 'simple') {
    steps.push({
      stepId: 'step_1_search',
      tool: 'product_engine',
      parameters: intent.searchParams,
      status: 'pending'
    });
  } 
  
  // Example of Multi-Step Planning ("Wedding in Amsterdam next weekend")
  else if (intent.action === 'complex_plan' || intent.complexity === 'multi_step') {
    // 1. Get Weather for Amsterdam
    steps.push({
      stepId: 'step_1_weather',
      tool: 'weather_api',
      parameters: { location: 'Amsterdam', timeframe: 'next_weekend' },
      status: 'pending'
    });

    // 2. Query Knowledge Graph for Formal Preferences
    steps.push({
      stepId: 'step_2_kg',
      tool: 'knowledge_graph',
      parameters: { query: 'formal_preferences' },
      status: 'pending'
    });

    // 3. Search Products based on Weather + Preferences
    steps.push({
      stepId: 'step_3_search',
      tool: 'product_engine',
      parameters: { dependentOn: ['step_1_weather', 'step_2_kg'] },
      status: 'pending'
    });
  }

  // Explain Fit just needs the Brand Engine
  else if (intent.action === 'explain_fit') {
    steps.push({
      stepId: 'step_1_brand',
      tool: 'brand_engine',
      parameters: { targetBrand: intent.targetBrand },
      status: 'pending'
    });
  }

  return {
    planId: `plan_${Date.now()}`,
    originalIntent: intent,
    steps
  };
}
