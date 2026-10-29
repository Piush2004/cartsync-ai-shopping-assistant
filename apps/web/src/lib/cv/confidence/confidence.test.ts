import { describe, expect, it } from "vitest";
import { computeOverallConfidence, computeGeometryConfidence, GEOMETRY_CONFIDENCE_CEILING } from "./confidence";

describe("computeOverallConfidence", () => {
  it("returns 1.0 overall when every factor is perfect", () => {
    const result = computeOverallConfidence({
      pose: 1,
      imageQuality: 1,
      calibration: 1,
      geometry: 1,
      frontSideConsistency: 1,
    });
    expect(result.overall).toBeCloseTo(1, 5);
  });

  it("returns 0.0 overall when every factor is zero", () => {
    const result = computeOverallConfidence({
      pose: 0,
      imageQuality: 0,
      calibration: 0,
      geometry: 0,
      frontSideConsistency: 0,
    });
    expect(result.overall).toBe(0);
  });

  it("clamps out-of-range inputs instead of producing an invalid confidence", () => {
    const result = computeOverallConfidence({
      pose: 1.5,
      imageQuality: -0.3,
      calibration: 1,
      geometry: 1,
      frontSideConsistency: 1,
    });
    expect(result.pose).toBe(1);
    expect(result.imageQuality).toBe(0);
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(1);
  });

  it("weights sum to a coherent [0,1] overall for a realistic mixed input", () => {
    const result = computeOverallConfidence({
      pose: 0.95,
      imageQuality: 0.9,
      calibration: 0.85,
      geometry: 0.6,
      frontSideConsistency: 0.8,
    });
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThan(1);
  });
});

describe("computeGeometryConfidence", () => {
  it("never exceeds the documented ceiling, even for perfect plausibility", () => {
    expect(computeGeometryConfidence(1)).toBeCloseTo(GEOMETRY_CONFIDENCE_CEILING, 5);
  });

  it("scales down with lower plausibility", () => {
    expect(computeGeometryConfidence(0.5)).toBeCloseTo(GEOMETRY_CONFIDENCE_CEILING * 0.5, 5);
  });
});
