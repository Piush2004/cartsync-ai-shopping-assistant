import { BodyMesh, TryOnScene } from './types';
import { PhysicsMap } from './physics-engine';

/**
 * Combines the mesh, aligned garments, physics data, and occlusion logic 
 * into an abstract TryOnScene. This cleanly separates physics from rendering.
 */
export function buildScene(
  mesh: BodyMesh,
  garmentPositions: Record<string, any>,
  physicsMap: PhysicsMap
): TryOnScene {
  
  // Basic occlusion mock (e.g. jacket goes over shirt)
  const occlusionLayers = [
    { layerId: 'body', zIndex: 0 },
    { layerId: 'base_layer', zIndex: 1, type: 'shirt' },
    { layerId: 'outerwear', zIndex: 2, type: 'jacket' }
  ];

  return {
    mesh,
    garmentPositions,
    physicsMap,
    occlusionLayers
  };
}
