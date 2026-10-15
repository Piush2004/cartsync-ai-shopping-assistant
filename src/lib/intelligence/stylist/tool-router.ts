import { ExecutionPlan, ExecutionStep } from './types';
import { UserKnowledgeGraph } from '../learning/types';
import { generateRecommendations } from '../product';
import { MeasurementProfile } from '../measurement';
import { InMemoryCatalogRepository } from '../product/catalog';

/**
 * The Tool Router iterates through an ExecutionPlan and executes the required tools.
 * It passes state between dependent steps.
 */
export async function executePlan(plan: ExecutionPlan, graph: UserKnowledgeGraph): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  for (const step of plan.steps) {
    try {
      if (step.tool === 'product_engine') {
        const effectiveProfile: MeasurementProfile = {
          ...graph.bodyIntelligence.rawMeasurements,
          measurements: graph.bodyIntelligence.effectiveMeasurements as any
        };
        
        // Mock style mapping
        const mockStyleProfile = {
          fitPreference: 'slim' as const,
          preferredAesthetics: Object.keys(graph.styleIntelligence.aesthetics),
          preferredMaterials: [],
          avoidMaterials: []
        };

        const params = step.parameters.dependentOn 
          ? { ...step.parameters, category: 'tops' } // In prod, resolve dependencies from `results`
          : step.parameters;

        const products = await generateRecommendations({
          profile: effectiveProfile,
          style: mockStyleProfile,
          query: params
        }, new InMemoryCatalogRepository());

        results[step.stepId] = products;
      }
      
      else if (step.tool === 'brand_engine') {
        results[step.stepId] = graph.brandIntelligence.brands[step.parameters.targetBrand] || [];
      }

      else if (step.tool === 'weather_api') {
        results[step.stepId] = { temp: 22, conditions: 'Sunny' }; // Mock API call
      }

      step.status = 'completed';
    } catch (error) {
      step.status = 'failed';
      throw error; // Or trigger recovery mechanisms
    }
  }

  return results;
}
