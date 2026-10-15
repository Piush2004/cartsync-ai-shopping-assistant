export type Coordinate3D = { x: number; y: number; z: number };

export type SimulationMode = 'fast_preview' | 'approximate_physics' | 'high_accuracy';

export type GarmentQualityLevel = 
  | 'LEVEL_1_2D_IMAGE'
  | 'LEVEL_2_MULTI_VIEW'
  | 'LEVEL_3_3D_MESH'
  | 'LEVEL_4_SIMULATION_READY';

export interface CameraPose {
  angle: 'front' | 'side' | 'back' | 'custom';
  elevation: number;
}

export interface TryOnRequest {
  userId: string;
  productId: string;
  recommendedSize: string;
  cameraPose: CameraPose;
  simulationMode: SimulationMode;
  garmentQuality: GarmentQualityLevel;
}

export interface TryOnExplanation {
  fitConfidence: number; // 0.0 to 1.0
  tightRegions: string[];
  looseRegions: string[];
  assumptions: string[];
}

export interface TryOnResult {
  renderUrl: string; 
  explanation: TryOnExplanation;
  computationTimeMs: number;
}

export interface BodyMesh {
  landmarks: Record<string, Coordinate3D>;
  volume: number;
  hash: string;
}

export interface TryOnScene {
  mesh: BodyMesh;
  garmentPositions: Record<string, Coordinate3D>;
  physicsMap: any;
  occlusionLayers: any[];
}

export interface TryOnRenderer {
  render(scene: TryOnScene): Promise<string>;
}
