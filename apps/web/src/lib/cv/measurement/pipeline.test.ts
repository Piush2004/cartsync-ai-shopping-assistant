import { describe, expect, it } from "vitest";
import { runMeasurementPipeline, type CaptureInput, type PipelineResult } from "./pipeline";
import { LANDMARK, NUM_POSE_LANDMARKS } from "../vision/landmarks";
import type { Point2D, PoseResult } from "../vision/types";

// A plausible, level, fully-visible standing pose in a 1080x1920 portrait
// photo -- SYNTHETIC fixture for pipeline wiring/regression tests only, not
// a claim about real-world accuracy (see research/cv/README.md's ground rules).
function standingPose(xOffset = 0): Point2D[] {
  const p: Point2D[] = Array.from({ length: NUM_POSE_LANDMARKS }, () => ({ x: 0.5, y: 0.5, visibility: 0.9 }));
  const set = (idx: number, x: number, y: number, visibility = 0.95) => {
    p[idx] = { x: x + xOffset, y, visibility };
  };
  set(LANDMARK.NOSE, 0.5, 0.08);
  set(LANDMARK.LEFT_SHOULDER, 0.42, 0.2);
  set(LANDMARK.RIGHT_SHOULDER, 0.58, 0.2);
  set(LANDMARK.LEFT_ELBOW, 0.4, 0.32);
  set(LANDMARK.RIGHT_ELBOW, 0.6, 0.32);
  set(LANDMARK.LEFT_WRIST, 0.39, 0.44);
  set(LANDMARK.RIGHT_WRIST, 0.61, 0.44);
  set(LANDMARK.LEFT_HIP, 0.46, 0.5);
  set(LANDMARK.RIGHT_HIP, 0.54, 0.5);
  set(LANDMARK.LEFT_KNEE, 0.46, 0.72);
  set(LANDMARK.RIGHT_KNEE, 0.54, 0.72);
  set(LANDMARK.LEFT_ANKLE, 0.46, 0.93);
  set(LANDMARK.RIGHT_ANKLE, 0.54, 0.93);
  return p;
}

function makeCapture(landmarks: Point2D[], overrides: Partial<PoseResult> = {}): CaptureInput {
  const poseResult: PoseResult = {
    landmarks2D: landmarks,
    confidence: 0.92,
    timestamp: Date.now(),
    posesDetected: 1,
    ...overrides,
  };
  return { poseResult, imageWidthPx: 1080, imageHeightPx: 1920, imageQualityScore: 0.9 };
}

describe("runMeasurementPipeline", () => {
  it("produces plausible measurements for a realistic front+side capture pair", () => {
    const front = makeCapture(standingPose());
    const side = makeCapture(standingPose());
    const result = runMeasurementPipeline(front, side, 170) as PipelineResult;

    expect("measurements" in result).toBe(true);
    for (const field of ["shoulder", "chest", "waist", "hip", "inseam", "arm_length", "torso_length"] as const) {
      expect(result.measurements[field].valueCm).toBeGreaterThan(0);
      expect(Number.isFinite(result.measurements[field].valueCm)).toBe(true);
    }
    expect(result.plausibilityFailures).toEqual([]);
    expect(result.confidenceBreakdown.overall).toBeGreaterThan(0);
    expect(result.confidenceBreakdown.overall).toBeLessThanOrEqual(1);
  });

  it("marks circumference measurements as estimates and direct measurements as not", () => {
    const front = makeCapture(standingPose());
    const side = makeCapture(standingPose());
    const result = runMeasurementPipeline(front, side, 170) as PipelineResult;

    expect(result.measurements.chest.isEstimate).toBe(true);
    expect(result.measurements.waist.isEstimate).toBe(true);
    expect(result.measurements.hip.isEstimate).toBe(true);
    expect(result.measurements.shoulder.isEstimate).toBe(false);
    expect(result.measurements.arm_length.isEstimate).toBe(false);
  });

  it("caps circumference confidence at the documented geometry ceiling", () => {
    const front = makeCapture(standingPose());
    const side = makeCapture(standingPose());
    const result = runMeasurementPipeline(front, side, 170) as PipelineResult;
    expect(result.measurements.chest.confidence).toBeLessThanOrEqual(0.65);
  });

  it("flags requiresReview when front and side captures are geometrically inconsistent", () => {
    const front = makeCapture(standingPose());
    // Side capture with a much shorter apparent torso -- simulates a bad
    // second capture (different distance/framing from the front shot).
    const sideLandmarks = standingPose();
    sideLandmarks[LANDMARK.LEFT_HIP] = { x: 0.46, y: 0.35, visibility: 0.95 };
    sideLandmarks[LANDMARK.RIGHT_HIP] = { x: 0.54, y: 0.35, visibility: 0.95 };
    const side = makeCapture(sideLandmarks);

    const result = runMeasurementPipeline(front, side, 170) as PipelineResult;
    expect(result.consistencyWarnings).toContain("MEASUREMENT_INCONSISTENCY");
    expect(result.requiresReview).toBe(true);
  });

  it("flags requiresReview when a measurement differs significantly from history", () => {
    const front = makeCapture(standingPose());
    const side = makeCapture(standingPose());
    const result = runMeasurementPipeline(front, side, 170, { waist: 1 }) as PipelineResult; // absurdly different prior value
    expect(result.historicalFlags.length).toBeGreaterThan(0);
    expect(result.requiresReview).toBe(true);
  });

  it("returns a CALIBRATION_FAILED failure instead of garbage numbers when landmarks are missing", () => {
    const emptyLandmarks: Point2D[] = [];
    const front = makeCapture(emptyLandmarks);
    const side = makeCapture(standingPose());
    const result = runMeasurementPipeline(front, side, 170);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("CALIBRATION_FAILED");
    }
  });
});
