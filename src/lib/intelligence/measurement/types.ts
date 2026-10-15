export interface MeasurementInput {
  frontImageBlob: Blob;
  sideImageBlob: Blob;
  userHeightCm: number;
}

export type BodyShapeType = 'athletic' | 'oval' | 'round' | 'rectangle' | 'inverted_triangle';

export interface BodyMeasurements {
  chest: number;
  waist: number;
  hip: number;
  shoulderWidth: number;
  armLength: number;
  inseam: number;
  torsoHeight: number;
  neck: number;
}

export interface ConfidenceIntervals {
  chest: number;
  waist: number;
  hip: number;
  shoulderWidth: number;
  armLength: number;
  inseam: number;
  torsoHeight: number;
  neck: number;
  overall: number; // 0-100 weighted average of multiple quality factors
}

export interface MeasurementMetadata {
  algorithmVersion: string;
  poseModel: string;
  depthModel: string;
  timestamp: string;
}

export interface MeasurementProfile {
  userId: string;
  version: number;
  metadata: MeasurementMetadata;
  measurements: BodyMeasurements;
  confidence: ConfidenceIntervals;
  shape: BodyShapeType;
  source: 'camera' | 'manual' | 'fused';
  scanCount: number; // For fusion tracking
}

export interface ExtractedKeypoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export type PoseLandmarks = ExtractedKeypoint[];

export interface QualityMetrics {
  lightingScore: number;
  blurScore: number;
  poseScore: number;
  depthScore: number;
}
