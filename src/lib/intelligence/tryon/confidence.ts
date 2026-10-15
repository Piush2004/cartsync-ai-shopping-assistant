import { TryOnExplanation, GarmentQualityLevel, SimulationMode } from './types';
import { PhysicsMap } from './physics-engine';

/**
 * Calculates how mathematically accurate the render is.
 * Protects user trust by avoiding "false precision".
 */
export function evaluateConfidence(
  quality: GarmentQualityLevel,
  mode: SimulationMode,
  physics: PhysicsMap
): TryOnExplanation {
  
  let baseConfidence = 1.0;
  const assumptions: string[] = [];

  // Quality Penalties
  if (quality === 'LEVEL_1_2D_IMAGE') {
    baseConfidence -= 0.4;
    assumptions.push('Garment is a 2D image; 3D wrap is estimated.');
  } else if (quality === 'LEVEL_2_MULTI_VIEW') {
    baseConfidence -= 0.2;
    assumptions.push('3D depth inferred from multiple 2D angles.');
  }

  // Simulation Mode Penalties
  if (mode === 'fast_preview') {
    baseConfidence -= 0.1;
    assumptions.push('Fast preview mode: physics approximations used.');
  }

  // Extract Physics regions
  const tightRegions = physics.tensionZones.filter(t => t.intensity > 0.1).map(t => t.region);
  const looseRegions = physics.drapeOffset > 0.1 ? ['hem', 'waist'] : [];

  return {
    fitConfidence: Math.max(0.1, baseConfidence), // Ensure it doesn't go below 0.1
    tightRegions,
    looseRegions,
    assumptions
  };
}
