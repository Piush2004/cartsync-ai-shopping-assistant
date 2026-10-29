import { describe, expect, it } from "vitest";
import { checkPlausibility, checkHistoricalConsistency } from "./anatomical";

describe("checkPlausibility", () => {
  it("passes plausible values", () => {
    expect(checkPlausibility({ chest: 96, waist: 80, hip: 100 })).toEqual([]);
  });

  it("flags a negative measurement", () => {
    const failures = checkPlausibility({ chest: -50 });
    expect(failures).toEqual([{ field: "chest", value: -50, reason: "OUT_OF_BOUNDS" }]);
  });

  it("flags an absurdly large measurement", () => {
    const failures = checkPlausibility({ waist: 999999 });
    expect(failures).toEqual([{ field: "waist", value: 999999, reason: "OUT_OF_BOUNDS" }]);
  });

  it("flags non-finite values (NaN/Infinity)", () => {
    const failures = checkPlausibility({ hip: NaN, inseam: Infinity });
    expect(failures).toContainEqual({ field: "hip", value: NaN, reason: "NOT_FINITE" });
    expect(failures).toContainEqual({ field: "inseam", value: Infinity, reason: "NOT_FINITE" });
  });

  it("ignores undefined fields (nothing to validate)", () => {
    expect(checkPlausibility({ chest: undefined })).toEqual([]);
  });

  it("ignores fields with no known bounds", () => {
    expect(checkPlausibility({ unknown_field: 99999 })).toEqual([]);
  });
});

describe("checkHistoricalConsistency", () => {
  it("does not flag a small, plausible change", () => {
    const flags = checkHistoricalConsistency({ waist: 80 }, { waist: 82 });
    expect(flags).toEqual([]);
  });

  it("flags a large jump between scans (master brief's 80cm -> 97cm example)", () => {
    const flags = checkHistoricalConsistency({ waist: 80 }, { waist: 97 });
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ field: "waist", previousValueCm: 80, newValueCm: 97 });
  });

  it("does not flag when there is no prior measurement to compare against", () => {
    const flags = checkHistoricalConsistency({}, { waist: 97 });
    expect(flags).toEqual([]);
  });
});
