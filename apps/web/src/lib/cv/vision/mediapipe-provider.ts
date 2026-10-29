import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { VisionProvider, VisionProviderConfig } from "./interfaces";
import type { Point2D, Point3D, PoseResult, VisionMetrics } from "./types";

// Pinned to the exact installed npm package version (see apps/web/package.json)
// so the WASM runtime fetched from the CDN always matches the JS bindings
// we're calling against -- a version mismatch here is a real, easy-to-hit
// failure mode for MediaPipe's web SDK.
const TASKS_VISION_VERSION = "1.0.1";
const WASM_FILESET_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;

// Same model measured in research/cv/benchmarks/model_candidates.md
// (pose_landmarker_full, float16, Apache 2.0, ~46-49ms/frame on this dev
// machine's CPU). Model version string below must stay in sync with this
// URL -- it is stored as measurement provenance (EffectiveMeasurement.model_version).
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";
export const MEDIAPIPE_MODEL_VERSION = "mediapipe-pose-landmarker-full-float16-1";

/**
 * MediaPipeProvider implements VisionProvider using MediaPipe's Pose
 * Landmarker (BlazePose, 33 landmarks) running client-side via WASM. No
 * image is ever sent to a server for pose detection -- this runs entirely
 * in the browser.
 *
 * Defaults to the CPU delegate. Per research/cv/benchmarks/model_candidates.md
 * §3, GPU-accelerated inference is not something V1 can depend on (browser
 * WebGL delegate support varies by device, and this app must work
 * consistently everywhere); config.enableGPU is honored if the caller
 * explicitly opts in, but CPU is the supported default.
 */
export class MediaPipeProvider implements VisionProvider {
  private landmarker: PoseLandmarker | null = null;
  private lastInferenceTimeMs = 0;
  private frameCount = 0;

  async initialize(config: VisionProviderConfig = {}): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(WASM_FILESET_URL);

    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_ASSET_URL,
        delegate: config.enableGPU ? "GPU" : "CPU",
      },
      runningMode: "IMAGE",
      // Detect up to 2 so we can tell "one person" apart from "more than one
      // person in frame" (MULTIPLE_PEOPLE quality gate) -- we still only use
      // the first/primary pose's landmarks for measurement.
      numPoses: 2,
      minPoseDetectionConfidence: config.minDetectionConfidence ?? 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: config.minTrackingConfidence ?? 0.5,
      outputSegmentationMasks: false,
    });
  }

  async processFrame(
    frame: HTMLVideoElement | HTMLCanvasElement | ImageBitmap
  ): Promise<PoseResult | null> {
    if (!this.landmarker) {
      throw new Error("MediaPipeProvider.processFrame called before initialize()");
    }

    const start = performance.now();
    const result: PoseLandmarkerResult = this.landmarker.detect(frame);
    this.lastInferenceTimeMs = performance.now() - start;
    this.frameCount += 1;

    const landmarks = result.landmarks[0];
    if (!landmarks || landmarks.length === 0) {
      return null;
    }

    const landmarks2D: Point2D[] = landmarks.map((lm) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility,
    }));

    const worldLandmarks = result.worldLandmarks[0];
    const landmarks3D: Point3D[] | undefined = worldLandmarks
      ? worldLandmarks.map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility,
        }))
      : undefined;

    // Overall confidence is the mean per-landmark visibility. This is what
    // research/cv measured (avg_landmark_visibility) -- not invented here,
    // reused as the single most direct signal MediaPipe actually gives us
    // about how much it trusts its own detection.
    const confidence =
      landmarks2D.reduce((sum, p) => sum + (p.visibility ?? 0), 0) / landmarks2D.length;

    return {
      landmarks2D,
      landmarks3D,
      confidence,
      timestamp: Date.now(),
      posesDetected: result.landmarks.length,
    };
  }

  dispose(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }

  getMetrics(): VisionMetrics {
    return {
      fps: this.lastInferenceTimeMs > 0 ? 1000 / this.lastInferenceTimeMs : 0,
      inferenceTimeMs: this.lastInferenceTimeMs,
      isWebGLReady: false, // this provider defaults to the CPU delegate; see class doc
      isWASMReady: this.landmarker !== null,
    };
  }
}
