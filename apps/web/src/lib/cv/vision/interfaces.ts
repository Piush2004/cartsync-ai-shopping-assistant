import { PoseResult, VisionMetrics } from "./types";

export interface VisionProviderConfig {
  enableGPU?: boolean;
  modelComplexity?: 0 | 1 | 2; // e.g. MediaPipe Lite(0), Full(1), Heavy(2)
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
}

export interface VisionProvider {
  /**
   * Initializes the underlying vision model and downloads required assets (WASM/Weights).
   */
  initialize(config?: VisionProviderConfig): Promise<void>;

  /**
   * Processes a single image frame and returns the extracted pose result.
   */
  processFrame(frame: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<PoseResult | null>;

  /**
   * Disposes of the model and releases memory.
   */
  dispose(): void;

  /**
   * Returns current performance metrics for the provider.
   */
  getMetrics(): VisionMetrics;
}
