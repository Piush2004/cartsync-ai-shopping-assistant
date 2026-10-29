import { describe, expect, it } from "vitest";
import { computeBodyBoundingBoxPx } from "./body-region";
import { LANDMARK, NUM_POSE_LANDMARKS } from "../vision/landmarks";
import type { Point2D } from "../vision/types";

function standingLandmarks(): Point2D[] {
  const base: Point2D[] = Array.from({ length: NUM_POSE_LANDMARKS }, () => ({ x: 0.5, y: 0.5, visibility: 0.9 }));
  base[LANDMARK.LEFT_SHOULDER] = { x: 0.4, y: 0.2, visibility: 0.95 };
  base[LANDMARK.RIGHT_SHOULDER] = { x: 0.6, y: 0.2, visibility: 0.95 };
  base[LANDMARK.LEFT_ELBOW] = { x: 0.38, y: 0.35, visibility: 0.9 };
  base[LANDMARK.RIGHT_ELBOW] = { x: 0.62, y: 0.35, visibility: 0.9 };
  base[LANDMARK.LEFT_WRIST] = { x: 0.37, y: 0.45, visibility: 0.9 };
  base[LANDMARK.RIGHT_WRIST] = { x: 0.63, y: 0.45, visibility: 0.9 };
  base[LANDMARK.LEFT_HIP] = { x: 0.45, y: 0.5, visibility: 0.95 };
  base[LANDMARK.RIGHT_HIP] = { x: 0.55, y: 0.5, visibility: 0.95 };
  base[LANDMARK.LEFT_KNEE] = { x: 0.45, y: 0.7, visibility: 0.9 };
  base[LANDMARK.RIGHT_KNEE] = { x: 0.55, y: 0.7, visibility: 0.9 };
  base[LANDMARK.LEFT_ANKLE] = { x: 0.45, y: 0.9, visibility: 0.9 };
  base[LANDMARK.RIGHT_ANKLE] = { x: 0.55, y: 0.9, visibility: 0.9 };
  return base;
}

describe("computeBodyBoundingBoxPx", () => {
  it("produces a pixel box roughly matching the landmark spread, padded outward", () => {
    const bbox = computeBodyBoundingBoxPx(standingLandmarks(), 1000, 2000);
    expect(bbox).not.toBeNull();
    // Landmark x range is 0.37-0.63 (26% of width); padded box should be wider than that but not by a huge margin.
    expect(bbox!.width).toBeGreaterThan(260);
    expect(bbox!.width).toBeLessThan(400);
    // Landmark y range is 0.2-0.9 (70% of height).
    expect(bbox!.height).toBeGreaterThan(1400);
    expect(bbox!.height).toBeLessThan(1800);
  });

  it("clamps the box to the image bounds even when padding would push it outside", () => {
    const landmarks = standingLandmarks();
    // Push shoulders/ankles near the very edges so padding overflows [0,1].
    landmarks[LANDMARK.LEFT_SHOULDER] = { x: 0.01, y: 0.01, visibility: 0.95 };
    landmarks[LANDMARK.RIGHT_ANKLE] = { x: 0.99, y: 0.99, visibility: 0.9 };
    const bbox = computeBodyBoundingBoxPx(landmarks, 500, 500);
    expect(bbox).not.toBeNull();
    expect(bbox!.x).toBeGreaterThanOrEqual(0);
    expect(bbox!.y).toBeGreaterThanOrEqual(0);
    expect(bbox!.x + bbox!.width).toBeLessThanOrEqual(500);
    expect(bbox!.y + bbox!.height).toBeLessThanOrEqual(500);
  });

  it("returns null when too few body landmarks are present", () => {
    const sparse: Point2D[] = [];
    expect(computeBodyBoundingBoxPx(sparse, 500, 500)).toBeNull();
  });

  it("returns null for a degenerate (near-zero-size) box", () => {
    const landmarks = standingLandmarks();
    for (const idx of [
      LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER, LANDMARK.LEFT_ELBOW, LANDMARK.RIGHT_ELBOW,
      LANDMARK.LEFT_WRIST, LANDMARK.RIGHT_WRIST, LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP,
      LANDMARK.LEFT_KNEE, LANDMARK.RIGHT_KNEE, LANDMARK.LEFT_ANKLE, LANDMARK.RIGHT_ANKLE,
    ]) {
      landmarks[idx] = { x: 0.5, y: 0.5, visibility: 0.9 };
    }
    expect(computeBodyBoundingBoxPx(landmarks, 500, 500)).toBeNull();
  });
});
