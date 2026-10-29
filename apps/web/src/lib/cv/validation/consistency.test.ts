import { describe, expect, it } from "vitest";
import { checkFrontSideConsistency } from "./consistency";

describe("checkFrontSideConsistency", () => {
  it("is consistent when front and side measurements closely agree", () => {
    const result = checkFrontSideConsistency({
      frontTorsoLengthCm: 50,
      sideTorsoLengthCm: 51,
      frontInseamProxyCm: 78,
      sideInseamProxyCm: 77,
    });
    expect(result.consistent).toBe(true);
    expect(result.warnings).toEqual([]);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it("flags MEASUREMENT_INCONSISTENCY when front and side diverge substantially", () => {
    // torso: 50 vs 65 -> relative diff = 15/57.5 = 26% > 15% threshold
    const result = checkFrontSideConsistency({
      frontTorsoLengthCm: 50,
      sideTorsoLengthCm: 65,
      frontInseamProxyCm: 78,
      sideInseamProxyCm: 77,
    });
    expect(result.consistent).toBe(false);
    expect(result.warnings).toContain("MEASUREMENT_INCONSISTENCY");
  });

  it("reports the max of the two relative differences, not an average that could hide one bad axis", () => {
    const result = checkFrontSideConsistency({
      frontTorsoLengthCm: 50,
      sideTorsoLengthCm: 50, // perfect
      frontInseamProxyCm: 78,
      sideInseamProxyCm: 100, // way off
    });
    expect(result.consistent).toBe(false);
    expect(result.maxRelativeDifference).toBeGreaterThan(0.2);
  });
});
