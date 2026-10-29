import { describe, expect, it } from "vitest";
import {
  measureShoulderWidth,
  measureArmLength,
  measureTorsoLength,
  measureInseamProxy,
  estimateCircumferenceFromWidth,
  ASSUMED_DEPTH_TO_WIDTH_RATIO,
} from "./geometry";
import { LANDMARK, NUM_POSE_LANDMARKS } from "../vision/landmarks";
import type { Point2D } from "../vision/types";

function makeLandmarks(overrides: Partial<Record<number, Point2D>>): Point2D[] {
  const base: Point2D[] = Array.from({ length: NUM_POSE_LANDMARKS }, () => ({ x: 0, y: 0, visibility: 1 }));
  for (const [idx, point] of Object.entries(overrides)) {
    if (point) base[Number(idx)] = point;
  }
  return base;
}

describe("measureShoulderWidth", () => {
  it("computes a known distance correctly with a simple calibration", () => {
    // Shoulders exactly 0.1 apart in normalized x, same y, in a 1000x1000 image
    // -> 100px apart. cmPerPixel = 0.5 -> 50cm.
    const landmarks = makeLandmarks({
      [LANDMARK.LEFT_SHOULDER]: { x: 0.4, y: 0.3 },
      [LANDMARK.RIGHT_SHOULDER]: { x: 0.5, y: 0.3 },
    });
    const result = measureShoulderWidth(landmarks, 0.5, 1000, 1000);
    expect(result.valueCm).toBeCloseTo(50, 5);
  });
});

describe("measureArmLength", () => {
  it("averages left and right arm segment sums", () => {
    const landmarks = makeLandmarks({
      [LANDMARK.LEFT_SHOULDER]: { x: 0.5, y: 0.0 },
      [LANDMARK.LEFT_ELBOW]: { x: 0.5, y: 0.1 },
      [LANDMARK.LEFT_WRIST]: { x: 0.5, y: 0.2 },
      [LANDMARK.RIGHT_SHOULDER]: { x: 0.5, y: 0.0 },
      [LANDMARK.RIGHT_ELBOW]: { x: 0.5, y: 0.1 },
      [LANDMARK.RIGHT_WRIST]: { x: 0.5, y: 0.22 },
    });
    // left arm: 0.1 + 0.1 = 0.2 normalized y -> 200px in a 1000px-tall image
    // right arm: 0.1 + 0.12 = 0.22 -> 220px
    // avg = 210px, cmPerPixel=1 -> 210cm
    const result = measureArmLength(landmarks, 1, 1000, 1000);
    expect(result.valueCm).toBeCloseTo(210, 5);
  });
});

describe("measureTorsoLength and measureInseamProxy", () => {
  const landmarks = makeLandmarks({
    [LANDMARK.LEFT_SHOULDER]: { x: 0.4, y: 0.2 },
    [LANDMARK.RIGHT_SHOULDER]: { x: 0.6, y: 0.2 },
    [LANDMARK.LEFT_HIP]: { x: 0.45, y: 0.5 },
    [LANDMARK.RIGHT_HIP]: { x: 0.55, y: 0.5 },
    [LANDMARK.LEFT_ANKLE]: { x: 0.45, y: 0.9 },
    [LANDMARK.RIGHT_ANKLE]: { x: 0.55, y: 0.9 },
  });

  it("measures torso length as shoulder-midpoint to hip-midpoint distance", () => {
    // shoulder midpoint (0.5, 0.2), hip midpoint (0.5, 0.5) -> 0.3 normalized y -> 300px in 1000px image
    const result = measureTorsoLength(landmarks, 1, 1000, 1000);
    expect(result.valueCm).toBeCloseTo(300, 5);
  });

  it("measures inseam proxy as hip-midpoint to ankle-midpoint distance", () => {
    // hip midpoint (0.5, 0.5), ankle midpoint (0.5, 0.9) -> 0.4 -> 400px
    const result = measureInseamProxy(landmarks, 1, 1000, 1000);
    expect(result.valueCm).toBeCloseTo(400, 5);
  });
});

describe("estimateCircumferenceFromWidth", () => {
  it("is always labeled as an estimate", () => {
    const result = estimateCircumferenceFromWidth(90, ASSUMED_DEPTH_TO_WIDTH_RATIO.chest);
    expect(result.isEstimate).toBe(true);
    expect(result.method).toBe("front_width_ellipse_estimate");
  });

  it("degenerates to a circle's circumference when depth ratio is 1.0", () => {
    // a = b = width/2 -> ellipse becomes a circle, perimeter = pi * width
    const width = 40;
    const result = estimateCircumferenceFromWidth(width, 1.0);
    expect(result.valueCm).toBeCloseTo(Math.PI * width, 5);
  });

  it("produces a larger circumference for a wider assumed depth ratio, same width", () => {
    const narrow = estimateCircumferenceFromWidth(90, 0.5);
    const wide = estimateCircumferenceFromWidth(90, 0.9);
    expect(wide.valueCm).toBeGreaterThan(narrow.valueCm);
  });

  it("scales roughly linearly with width for a fixed depth ratio", () => {
    const small = estimateCircumferenceFromWidth(80, ASSUMED_DEPTH_TO_WIDTH_RATIO.waist);
    const large = estimateCircumferenceFromWidth(160, ASSUMED_DEPTH_TO_WIDTH_RATIO.waist);
    expect(large.valueCm).toBeCloseTo(small.valueCm * 2, 5);
  });
});
