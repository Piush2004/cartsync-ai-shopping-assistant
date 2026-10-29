import { describe, expect, it } from "vitest";
import { assessPoseQuality, combineQualityResult, imageQualityScore } from "./assess";
import type { PrePoseQualityResult } from "./validation";
import { LANDMARK, NUM_POSE_LANDMARKS } from "../vision/landmarks";
import type { Point2D, PoseResult } from "../vision/types";

function wellFramedLandmarks(): Point2D[] {
  const base: Point2D[] = Array.from({ length: NUM_POSE_LANDMARKS }, () => ({ x: 0.5, y: 0.5, visibility: 0.97 }));
  base[LANDMARK.NOSE] = { x: 0.5, y: 0.1, visibility: 0.98 };
  base[LANDMARK.LEFT_ANKLE] = { x: 0.45, y: 0.9, visibility: 0.95 };
  base[LANDMARK.RIGHT_ANKLE] = { x: 0.55, y: 0.9, visibility: 0.95 };
  return base;
}

function makePoseResult(overrides: Partial<PoseResult> = {}): PoseResult {
  return {
    landmarks2D: wellFramedLandmarks(),
    confidence: 0.97,
    timestamp: Date.now(),
    posesDetected: 1,
    ...overrides,
  };
}

function passingPrePose(): PrePoseQualityResult {
  return {
    blur: { tier: "PASS", varianceAtCanonicalWidth: 250 },
    lighting: { tier: "PASS", brightness: 170 },
    resolution: { tier: "PASS", width: 896, height: 1200 },
  };
}

describe("assessPoseQuality", () => {
  it("FAILs everything when no pose was detected", () => {
    const result = assessPoseQuality(null);
    expect(result.bodyVisibility.tier).toBe("FAIL");
    expect(result.landmarkConfidence.tier).toBe("FAIL");
    expect(result.framing.tier).toBe("FAIL");
  });

  it("PASSes a well-framed, high-confidence, single-person pose (real front-view visibility ~0.97-0.98)", () => {
    const result = assessPoseQuality(makePoseResult());
    expect(result.bodyVisibility.tier).toBe("PASS");
    expect(result.landmarkConfidence.tier).toBe("PASS");
    expect(result.framing.tier).toBe("PASS");
  });

  it("WARNs landmark confidence at real measured side-view visibility (0.775-0.816)", () => {
    const landmarks = wellFramedLandmarks();
    for (const idx of [
      LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER, LANDMARK.LEFT_ELBOW, LANDMARK.RIGHT_ELBOW,
      LANDMARK.LEFT_WRIST, LANDMARK.RIGHT_WRIST, LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP,
      LANDMARK.LEFT_KNEE, LANDMARK.RIGHT_KNEE, LANDMARK.LEFT_ANKLE, LANDMARK.RIGHT_ANKLE,
    ]) {
      landmarks[idx] = { ...landmarks[idx], visibility: 0.8 };
    }
    const result = assessPoseQuality(makePoseResult({ landmarks2D: landmarks }));
    expect(result.landmarkConfidence.tier).toBe("WARNING");
  });

  it("FAILs bodyVisibility when more than one person is detected", () => {
    const result = assessPoseQuality(makePoseResult({ posesDetected: 2 }));
    expect(result.bodyVisibility.tier).toBe("FAIL");
  });

  it("FAILs framing when feet are cropped at the frame edge", () => {
    const landmarks = wellFramedLandmarks();
    landmarks[LANDMARK.LEFT_ANKLE] = { x: 0.45, y: 0.999, visibility: 0.9 };
    landmarks[LANDMARK.RIGHT_ANKLE] = { x: 0.55, y: 0.999, visibility: 0.9 };
    const result = assessPoseQuality(makePoseResult({ landmarks2D: landmarks }));
    expect(result.framing.tier).toBe("FAIL");
  });
});

describe("combineQualityResult", () => {
  it("overall is PASS only when every sub-check passes", () => {
    const poseChecks = { bodyVisibility: { tier: "PASS" as const }, landmarkConfidence: { tier: "PASS" as const }, framing: { tier: "PASS" as const } };
    const result = combineQualityResult(passingPrePose(), poseChecks);
    expect(result.overall).toBe("PASS");
    expect(result.actionableMessages).toEqual([]);
  });

  it("overall is FAIL when any single sub-check fails, even if others pass", () => {
    const prePose = passingPrePose();
    prePose.lighting = { tier: "FAIL", brightness: 30, message: "too dark" };
    const poseChecks = { bodyVisibility: { tier: "PASS" as const }, landmarkConfidence: { tier: "PASS" as const }, framing: { tier: "PASS" as const } };
    const result = combineQualityResult(prePose, poseChecks);
    expect(result.overall).toBe("FAIL");
    expect(result.actionableMessages).toContain("too dark");
  });

  it("overall is WARNING when the worst sub-check is a warning and none fail", () => {
    const prePose = passingPrePose();
    prePose.blur = { tier: "WARNING", varianceAtCanonicalWidth: 90, message: "a bit soft" };
    const poseChecks = { bodyVisibility: { tier: "PASS" as const }, landmarkConfidence: { tier: "PASS" as const }, framing: { tier: "PASS" as const } };
    const result = combineQualityResult(prePose, poseChecks);
    expect(result.overall).toBe("WARNING");
  });

  it("deduplicates identical messages across sub-checks", () => {
    const prePose = passingPrePose();
    prePose.blur = { tier: "FAIL", varianceAtCanonicalWidth: 1, message: "same message" };
    const poseChecks = {
      bodyVisibility: { tier: "PASS" as const },
      landmarkConfidence: { tier: "FAIL" as const, message: "same message" },
      framing: { tier: "PASS" as const },
    };
    const result = combineQualityResult(prePose, poseChecks);
    expect(result.actionableMessages.filter((m) => m === "same message")).toHaveLength(1);
  });

  it("prefers body-region blur over whole-frame blur when both are provided", () => {
    const prePose = passingPrePose(); // whole-frame blur PASS
    const poseChecks = { bodyVisibility: { tier: "PASS" as const }, landmarkConfidence: { tier: "PASS" as const }, framing: { tier: "PASS" as const } };
    const bodyRegionBlur = { tier: "FAIL" as const, varianceAtCanonicalWidth: 10, message: "body region blurry" };
    const result = combineQualityResult(prePose, poseChecks, bodyRegionBlur);
    expect(result.blur).toBe(bodyRegionBlur);
    expect(result.overall).toBe("FAIL");
  });
});

describe("imageQualityScore", () => {
  it("is 1.0 when every scored factor passes", () => {
    const poseChecks = { bodyVisibility: { tier: "PASS" as const }, landmarkConfidence: { tier: "PASS" as const }, framing: { tier: "PASS" as const } };
    const result = combineQualityResult(passingPrePose(), poseChecks);
    expect(imageQualityScore(result)).toBe(1);
  });

  it("is 0.0 when every scored factor fails", () => {
    const prePose: PrePoseQualityResult = {
      blur: { tier: "FAIL", varianceAtCanonicalWidth: 1 },
      lighting: { tier: "FAIL", brightness: 10 },
      resolution: { tier: "FAIL", width: 100, height: 100 },
    };
    const poseChecks = assessPoseQuality(null);
    const result = combineQualityResult(prePose, poseChecks);
    expect(imageQualityScore(result)).toBe(0);
  });

  it("is between 0 and 1 for a mixed result", () => {
    const prePose = passingPrePose();
    prePose.lighting = { tier: "WARNING", brightness: 70 };
    const poseChecks = { bodyVisibility: { tier: "PASS" as const }, landmarkConfidence: { tier: "PASS" as const }, framing: { tier: "PASS" as const } };
    const result = combineQualityResult(prePose, poseChecks);
    const score = imageQualityScore(result);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});
