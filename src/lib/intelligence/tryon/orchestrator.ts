import { TryOnRequest, TryOnResult, TryOnRenderer } from './types';
import { preprocessRequest } from './preprocessing';
import { generateBodyMesh } from './body-mesh';
import { alignGarment } from './garment-alignment';
import { simulatePhysics } from './physics-engine';
import { buildScene } from './scene-builder';
import { evaluateConfidence } from './confidence';

/**
 * Orchestrates the Virtual Try-On Pipeline.
 * 1. Preprocessing -> 2. Mesh -> 3. Align -> 4. Physics -> 5. Scene -> 6. Render -> 7. Confidence
 */
export class TryOnOrchestrator {
  constructor(private renderer: TryOnRenderer) {}

  public async execute(
    request: TryOnRequest, 
    effectiveMeasurements: Record<string, number>,
    garmentMetadata: any // From Epic 3 Product Engine
  ): Promise<TryOnResult> {
    const startTime = Date.now();

    // 1. Preprocessing (Validates inputs)
    const validRequest = preprocessRequest(request);

    // 2. Body Mesh (Cached internally)
    const mesh = generateBodyMesh(effectiveMeasurements);

    // 3. Garment Alignment
    const alignedPositions = alignGarment(mesh, garmentMetadata.category || 'tops');

    // 4. Physics Simulation
    const physicsMap = simulatePhysics(mesh, alignedPositions, garmentMetadata, validRequest.simulationMode);

    // 5. Scene Representation
    const scene = buildScene(mesh, alignedPositions, physicsMap);

    // 6. Rendering
    const renderUrl = await this.renderer.render(scene);

    // 7. Explainability / Confidence
    const explanation = evaluateConfidence(validRequest.garmentQuality, validRequest.simulationMode, physicsMap);

    return {
      renderUrl,
      explanation,
      computationTimeMs: Date.now() - startTime
    };
  }
}
