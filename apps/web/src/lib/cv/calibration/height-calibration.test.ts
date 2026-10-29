import { describe, expect, it } from "vitest";
import { calibrateFromHeight } from "./height-calibration";
import { LANDMARK, NUM_POSE_LANDMARKS } from "../vision/landmarks";
import type { Point2D } from "../vision/types";

function makeLandmarks(overrides: Partial<Record<number, Point2D>>): Point2D[] {
  const base: Point2D[] = Array.from({ length: NUM_POSE_LANDMARKS }, () => ({
    x: 0.5,
    y: 0.5,
    visibility: 0.95,
  }));
  for (const [idx, point] of Object.entries(overrides)) {
    if (point) base[Number(idx)] = point;
  }
  return base;
}

// A perfectly level, fully-visible standing pose: nose near the top of the
// frame, both ankles near the bottom, shoulders/hips level.
function levelStandingPose(): Point2D[] {
  return makeLandmarks({
    [LANDMARK.NOSE]: { x: 0.5, y: 0.1, visibility: 0.99 },
    [LANDMARK.LEFT_SHOULDER]: { x: 0.4, y: 0.25, visibility: 0.98 },
    [LANDMARK.RIGHT_SHOULDER]: { x: 0.6, y: 0.25, visibility: 0.98 },
    [LANDMARK.LEFT_HIP]: { x: 0.45, y: 0.55, visibility: 0.97 },
    [LANDMARK.RIGHT_HIP]: { x: 0.55, y: 0.55, visibility: 0.97 },
    [LANDMARK.LEFT_ANKLE]: { x: 0.45, y: 0.95, visibility: 0.9 },
    [LANDMARK.RIGHT_ANKLE]: { x: 0.55, y: 0.95, visibility: 0.9 },
  });
}

describe("calibrateFromHeight", () => {
  it("derives a positive cm-per-pixel scale for a level standing pose", () => {
    const result = calibrateFromHeight(levelStandingPose(), 170, 1080, 1920);
    expect(result.cmPerPixel).toBeGreaterThan(0);
    expect(result.method).toBe("user_height");
    expect(result.warnings).toEqual([]);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("scales inversely with detected pixel height (taller pixel span -> smaller cm/px for same real height)", () => {
    const shortSpan = calibrateFromHeight(
      makeLandmarks({
        [LANDMARK.NOSE]: { x: 0.5, y: 0.3, visibility: 0.99 },
        [LANDMARK.LEFT_SHOULDER]: { x: 0.4, y: 0.35, visibility: 0.98 },
        [LANDMARK.RIGHT_SHOULDER]: { x: 0.6, y: 0.35, visibility: 0.98 },
        [LANDMARK.LEFT_HIP]: { x: 0.45, y: 0.5, visibility: 0.97 },
        [LANDMARK.RIGHT_HIP]: { x: 0.55, y: 0.5, visibility: 0.97 },
        [LANDMARK.LEFT_ANKLE]: { x: 0.45, y: 0.65, visibility: 0.9 },
        [LANDMARK.RIGHT_ANKLE]: { x: 0.55, y: 0.65, visibility: 0.9 },
      }),
      170,
      1080,
      1920
    );
    const tallSpan = calibrateFromHeight(levelStandingPose(), 170, 1080, 1920);
    expect(tallSpan.cmPerPixel).toBeLessThan(shortSpan.cmPerPixel);
  });

  it("flags BODY_NOT_LEVEL when shoulders/hips are heavily tilted", () => {
    const tilted = makeLandmarks({
      [LANDMARK.NOSE]: { x: 0.5, y: 0.1, visibility: 0.99 },
      [LANDMARK.LEFT_SHOULDER]: { x: 0.4, y: 0.2, visibility: 0.98 },
      [LANDMARK.RIGHT_SHOULDER]: { x: 0.6, y: 0.35, visibility: 0.98 }, // 0.15 tilt
      [LANDMARK.LEFT_HIP]: { x: 0.45, y: 0.5, visibility: 0.97 },
      [LANDMARK.RIGHT_HIP]: { x: 0.55, y: 0.55, visibility: 0.97 },
      [LANDMARK.LEFT_ANKLE]: { x: 0.45, y: 0.95, visibility: 0.9 },
      [LANDMARK.RIGHT_ANKLE]: { x: 0.55, y: 0.95, visibility: 0.9 },
    });
    const result = calibrateFromHeight(tilted, 170, 1080, 1920);
    expect(result.warnings).toContain("BODY_NOT_LEVEL");
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("flags LOW_LANDMARK_VISIBILITY_FOR_CALIBRATION when a required point is barely visible", () => {
    const lowVis = makeLandmarks({
      [LANDMARK.NOSE]: { x: 0.5, y: 0.1, visibility: 0.99 },
      [LANDMARK.LEFT_SHOULDER]: { x: 0.4, y: 0.25, visibility: 0.98 },
      [LANDMARK.RIGHT_SHOULDER]: { x: 0.6, y: 0.25, visibility: 0.98 },
      [LANDMARK.LEFT_HIP]: { x: 0.45, y: 0.55, visibility: 0.97 },
      [LANDMARK.RIGHT_HIP]: { x: 0.55, y: 0.55, visibility: 0.97 },
      [LANDMARK.LEFT_ANKLE]: { x: 0.45, y: 0.95, visibility: 0.2 }, // occluded
      [LANDMARK.RIGHT_ANKLE]: { x: 0.55, y: 0.95, visibility: 0.9 },
    });
    const result = calibrateFromHeight(lowVis, 170, 1080, 1920);
    expect(result.warnings).toContain("LOW_LANDMARK_VISIBILITY_FOR_CALIBRATION");
  });

  it("returns zero confidence and a clear warning when required landmarks are entirely missing", () => {
    const sparse: Point2D[] = [];
    const result = calibrateFromHeight(sparse, 170, 1080, 1920);
    expect(result.confidence).toBe(0);
    expect(result.warnings).toEqual(["MISSING_REQUIRED_LANDMARKS"]);
  });
});
