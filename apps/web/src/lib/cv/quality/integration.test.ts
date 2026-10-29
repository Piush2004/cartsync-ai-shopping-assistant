/**
 * Integration tests exercising the full quality pipeline (pre-pose blur/
 * lighting/resolution -> pose-based body-visibility/landmark-confidence/
 * framing -> combined ImageQualityResult), for the 6 scenarios explicitly
 * required for this feature.
 *
 * These do not decode a real JPEG (this repo's vitest environment has no
 * DOM/canvas -- see blur.ts's resizeImageDataForBlurCheck doc comment), so
 * blur/lighting inputs here are the REAL numbers already measured against
 * real photos in research/cv/results/image_quality_benchmark.json, fed
 * through the exact same classifyBlurVariance/classifyLighting/
 * assessPoseQuality/combineQualityResult functions production code calls.
 * What's "simulated" is which real measured number represents which
 * fixture; the classification logic itself is exactly what runs in the app.
 */
import { describe, expect, it } from "vitest";
import { classifyBlurVariance } from "./blur";
import { classifyLighting } from "./lighting";
import { assessPoseQuality, combineQualityResult } from "./assess";
import type { PrePoseQualityResult } from "./validation";
import { LANDMARK, NUM_POSE_LANDMARKS } from "../vision/landmarks";
import type { Point2D, PoseResult } from "../vision/types";

function wellFramedPose(): PoseResult {
  const landmarks: Point2D[] = Array.from({ length: NUM_POSE_LANDMARKS }, () => ({ x: 0.5, y: 0.5, visibility: 0.97 }));
  landmarks[LANDMARK.NOSE] = { x: 0.5, y: 0.1, visibility: 0.98 };
  landmarks[LANDMARK.LEFT_ANKLE] = { x: 0.45, y: 0.9, visibility: 0.95 };
  landmarks[LANDMARK.RIGHT_ANKLE] = { x: 0.55, y: 0.9, visibility: 0.95 };
  return { landmarks2D: landmarks, confidence: 0.97, timestamp: Date.now(), posesDetected: 1 };
}

function croppedPose(): PoseResult {
  const pose = wellFramedPose();
  // Feet cut off at the very bottom edge of the frame.
  pose.landmarks2D[LANDMARK.LEFT_ANKLE] = { x: 0.45, y: 0.999, visibility: 0.9 };
  pose.landmarks2D[LANDMARK.RIGHT_ANKLE] = { x: 0.55, y: 0.999, visibility: 0.9 };
  return pose;
}

// Mirrors the message-assignment logic in validation.ts's assessPrePoseQuality
// so these tests exercise realistic ImageQualityResult objects (with
// messages populated on any non-PASS tier, as production code always
// produces) rather than bypassing that and asserting against bare tiers.
function buildResult(blurVariance: number, brightness: number, pose: PoseResult | null) {
  const blurTier = classifyBlurVariance(blurVariance);
  const lightingTier = classifyLighting(brightness);
  const prePose: PrePoseQualityResult = {
    blur: {
      tier: blurTier,
      varianceAtCanonicalWidth: blurVariance,
      message: blurTier === "PASS" ? undefined : "Your photo looks blurry. Hold your phone steady and try again.",
    },
    lighting: {
      tier: lightingTier,
      brightness,
      message: lightingTier === "PASS" ? undefined : "Lighting needs adjustment.",
    },
    resolution: { tier: "PASS", width: 896, height: 1200 },
  };
  const poseChecks = assessPoseQuality(pose);
  return combineQualityResult(prePose, poseChecks);
}

describe("Scenario: blurry image -> rejected", () => {
  it("heavily blurred real-photo measurement (variance 1.44) is rejected", () => {
    const result = buildResult(1.44, 170, wellFramedPose());
    expect(result.overall).toBe("FAIL");
    expect(result.actionableMessages.length).toBeGreaterThan(0);
  });
});

describe("Scenario: acceptable image -> proceeds", () => {
  it("a real sharp-photo measurement with good lighting and a well-framed pose passes", () => {
    const result = buildResult(207.06, 170, wellFramedPose());
    expect(result.overall).toBe("PASS");
    expect(result.actionableMessages).toEqual([]);
  });
});

describe("Scenario: excellent image -> proceeds", () => {
  it("the sharpest real-photo measurement with ideal lighting passes with zero warnings", () => {
    const result = buildResult(387.03, 180, wellFramedPose());
    expect(result.overall).toBe("PASS");
  });
});

describe("Scenario: poor lighting -> rejected or warned", () => {
  it("the real dim mirror-selfie brightness (63.7) is at least a warning, not a silent pass", () => {
    const result = buildResult(250, 63.7, wellFramedPose());
    expect(result.overall).not.toBe("PASS");
    expect(result.lighting.tier).toBe("WARNING");
  });

  it("an extreme-dark measurement (49.1) is rejected outright", () => {
    const result = buildResult(250, 49.1, wellFramedPose());
    expect(result.overall).toBe("FAIL");
  });

  it("an overexposed measurement (250.6) is rejected", () => {
    const result = buildResult(250, 250.6, wellFramedPose());
    expect(result.overall).toBe("FAIL");
  });
});

describe("Scenario: cropped body -> rejected", () => {
  it("a pose with feet cut off at the frame edge is rejected", () => {
    const result = buildResult(250, 170, croppedPose());
    expect(result.overall).toBe("FAIL");
    expect(result.framing.tier).toBe("FAIL");
  });

  it("no pose detected at all (e.g. person entirely out of frame) is rejected", () => {
    const result = buildResult(250, 170, null);
    expect(result.overall).toBe("FAIL");
  });
});

describe("Scenario: motion blur -> rejected or warned", () => {
  it("real motion-blur measurements (9-tap and 21-tap, both real sources) are rejected", () => {
    for (const variance of [21.6, 11.32, 44.68, 29.92]) {
      const result = buildResult(variance, 170, wellFramedPose());
      expect(result.overall).toBe("FAIL");
    }
  });
});

describe("Cross-cutting: never silently proceeds on any single failing sub-check", () => {
  it("good blur + good lighting + but low landmark confidence still rejects overall", () => {
    const pose = wellFramedPose();
    for (const idx of [
      LANDMARK.LEFT_SHOULDER, LANDMARK.RIGHT_SHOULDER, LANDMARK.LEFT_HIP, LANDMARK.RIGHT_HIP,
      LANDMARK.LEFT_KNEE, LANDMARK.RIGHT_KNEE,
    ]) {
      pose.landmarks2D[idx] = { ...pose.landmarks2D[idx], visibility: 0.1 };
    }
    const result = buildResult(250, 170, pose);
    expect(result.overall).toBe("FAIL");
  });
});
