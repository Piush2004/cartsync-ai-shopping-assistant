import { SimulationMode, BodyMesh } from './types';

export interface PhysicsMap {
  tensionZones: { region: string; intensity: number }[];
  drapeOffset: number;
}

/**
 * Calculates cloth tension and drape.
 * Execution complexity scales based on the requested SimulationMode.
 */
export function simulatePhysics(
  mesh: BodyMesh, 
  garmentPositions: Record<string, any>, 
  garmentMetadata: any,
  mode: SimulationMode
): PhysicsMap {
  const tensionZones: { region: string; intensity: number }[] = [];
  let drapeOffset = 0;

  // 1. Fast Preview: Skip collision detection, use simple heuristics
  if (mode === 'fast_preview') {
    if (garmentMetadata.fitPattern === 'slim') {
      tensionZones.push({ region: 'chest', intensity: 0.5 });
    }
    return { tensionZones, drapeOffset: 0.1 };
  }

  // 2. Approximate / High Accuracy: Calculate tension from body volume vs garment volume
  const garmentVolume = garmentMetadata.estimatedVolume || mesh.volume * 1.05; // Default slightly larger
  
  if (mesh.volume > garmentVolume) {
    // Garment is tight
    const tension = (mesh.volume - garmentVolume) / mesh.volume;
    tensionZones.push({ region: 'chest', intensity: tension });
    tensionZones.push({ region: 'shoulders', intensity: tension * 0.8 });
    drapeOffset = 0; // Tight fit doesn't drape
  } else {
    // Garment is loose, it drapes
    drapeOffset = (garmentVolume - mesh.volume) / garmentVolume;
  }

  // High Accuracy would run actual collision meshes here in WebWorker/Server

  return {
    tensionZones,
    drapeOffset
  };
}
