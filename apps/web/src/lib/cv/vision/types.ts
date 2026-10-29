export interface Point2D {
  x: number;
  y: number;
  z?: number; // Optional depth
  visibility?: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface BoundingBox {
  xMin: number;
  yMin: number;
  width: number;
  height: number;
}

export interface PoseResult {
  landmarks2D: Point2D[];
  landmarks3D?: Point3D[];
  boundingBox?: BoundingBox;
  confidence: number;
  timestamp: number;
  /** How many distinct poses MediaPipe detected in the frame (landmarks2D is always the first/primary one). >1 means more than one person is in frame. */
  posesDetected: number;
}

export interface VisionMetrics {
  fps: number;
  inferenceTimeMs: number;
  isWebGLReady: boolean;
  isWASMReady: boolean;
}
