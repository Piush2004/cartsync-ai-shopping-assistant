import type { PoseResult } from "../vision/types";
import type { PrePoseQualityResult } from "./validation";
import type { BlurCheck, ImageQualityResult, QualityCheck, QualityTier } from "./types";
import { worstTier } from "./types";
import { BODY_LANDMARKS_FOR_MEASUREMENT } from "../vision/landmarks";

/**
 * Landmark-confidence tiers are calibrated from real measured values in
 * research/cv/results/mediapipe_pose_cpu_benchmark.json (MediaPipe Pose
 * Landmarker against 4 real photos already in this repo):
 *   front-view avg landmark visibility: 0.966, 0.983
 *   side-view avg landmark visibility:  0.775, 0.816
 * PASS is set to comfortably include both real front-view measurements;
 * WARNING is set to include both real side-view measurements (matching that
 * benchmark's own finding that side captures are structurally harder for
 * BlazePose than front captures, so a side photo should warn, not silently
 * get the same confidence as a front photo); FAIL matches the existing
 * MIN_MEAN_VISIBILITY cutoff already used by pose-validation.ts's
 * LOW_LANDMARK_CONFIDENCE check, so the two stay consistent.
 */
const LANDMARK_CONFIDENCE_FAIL = 0.6;
const LANDMARK_CONFIDENCE_PASS = 0.85;

function classifyLandmarkConfidence(confidence: number): QualityTier {
  if (confidence < LANDMARK_CONFIDENCE_FAIL) return "FAIL";
  if (confidence < LANDMARK_CONFIDENCE_PASS) return "WARNING";
  return "PASS";
}

const MESSAGES: Record<string, string> = {
  POSE_NOT_DETECTED: "We couldn't detect a person in this photo. Make sure you're fully visible and try again.",
  MULTIPLE_PEOPLE: "We detected more than one person in this photo. Please capture with only yourself in frame.",
  BODY_OUT_OF_FRAME: "Make sure your whole body -- head to feet -- is inside the frame.",
  LANDMARK_CONFIDENCE_WARNING: "We couldn't clearly see your outline. A plainer background or better lighting will help.",
  LANDMARK_CONFIDENCE_FAIL: "We couldn't clearly see your body outline. Try better lighting or a plainer background.",
};

export function assessPoseQuality(poseResult: PoseResult | null): {
  bodyVisibility: QualityCheck;
  landmarkConfidence: QualityCheck;
  framing: QualityCheck;
} {
  if (!poseResult) {
    return {
      bodyVisibility: { tier: "FAIL", message: MESSAGES.POSE_NOT_DETECTED },
      landmarkConfidence: { tier: "FAIL", message: MESSAGES.POSE_NOT_DETECTED },
      framing: { tier: "FAIL", message: MESSAGES.POSE_NOT_DETECTED },
    };
  }

  const bodyVisibility: QualityCheck =
    poseResult.posesDetected > 1
      ? { tier: "FAIL", message: MESSAGES.MULTIPLE_PEOPLE }
      : { tier: "PASS" };

  const relevantPoints = BODY_LANDMARKS_FOR_MEASUREMENT.map((idx) => poseResult.landmarks2D[idx]).filter(Boolean);
  const meanVisibility =
    relevantPoints.reduce((sum, p) => sum + (p.visibility ?? 0), 0) / (relevantPoints.length || 1);
  const confidenceTier = classifyLandmarkConfidence(meanVisibility);
  const landmarkConfidence: QualityCheck = {
    tier: confidenceTier,
    message:
      confidenceTier === "FAIL" ? MESSAGES.LANDMARK_CONFIDENCE_FAIL
        : confidenceTier === "WARNING" ? MESSAGES.LANDMARK_CONFIDENCE_WARNING
        : undefined,
  };

  const FRAME_EDGE_MARGIN = 0.02;
  const checkPoints = [0, 27, 28].map((idx) => poseResult.landmarks2D[idx]).filter(Boolean); // NOSE, LEFT_ANKLE, RIGHT_ANKLE
  const isNearEdge = checkPoints.some(
    (p) => p.x < FRAME_EDGE_MARGIN || p.x > 1 - FRAME_EDGE_MARGIN || p.y < FRAME_EDGE_MARGIN || p.y > 1 - FRAME_EDGE_MARGIN
  );
  const framing: QualityCheck =
    isNearEdge || checkPoints.length < 3
      ? { tier: "FAIL", message: MESSAGES.BODY_OUT_OF_FRAME }
      : { tier: "PASS" };

  return { bodyVisibility, landmarkConfidence, framing };
}

export function combineQualityResult(
  prePose: PrePoseQualityResult,
  poseChecks: { bodyVisibility: QualityCheck; landmarkConfidence: QualityCheck; framing: QualityCheck },
  /** From body-region.ts's computeBodyRegionBlur -- when available, supersedes prePose.blur (whole-frame estimate) as the authoritative blur reading, since it scores the body specifically rather than the whole frame including background. */
  bodyRegionBlur?: BlurCheck | null
): ImageQualityResult {
  const blur = bodyRegionBlur ?? prePose.blur;

  const overall = worstTier([
    blur.tier,
    prePose.lighting.tier,
    prePose.resolution.tier,
    poseChecks.bodyVisibility.tier,
    poseChecks.landmarkConfidence.tier,
    poseChecks.framing.tier,
  ]);

  const actionableMessages = Array.from(
    new Set(
      [
        blur.message,
        prePose.lighting.message,
        prePose.resolution.message,
        poseChecks.bodyVisibility.message,
        poseChecks.landmarkConfidence.message,
        poseChecks.framing.message,
      ].filter((m): m is string => Boolean(m))
    )
  );

  return {
    overall,
    blur,
    lighting: prePose.lighting,
    resolution: prePose.resolution,
    bodyVisibility: poseChecks.bodyVisibility,
    landmarkConfidence: poseChecks.landmarkConfidence,
    framing: poseChecks.framing,
    actionableMessages,
  };
}

/**
 * 0.0-1.0 image-quality factor for the confidence pipeline (see
 * confidence/confidence.ts's ConfidenceFactors.imageQuality). Replaces the
 * old frameQualityScore's "1.0 minus a fixed penalty per failure code"
 * heuristic with the actual tiered assessment: PASS=1.0, WARNING=0.6 (still
 * usable, degraded), FAIL=0.0 (should not have reached the confidence
 * pipeline at all -- see requirement that a FAIL frame is rejected before
 * measurement, this is a defensive floor, not the primary gate).
 */
export function imageQualityScore(result: ImageQualityResult): number {
  const tierScore = (tier: QualityTier) => (tier === "PASS" ? 1 : tier === "WARNING" ? 0.6 : 0);
  const tiers = [result.blur.tier, result.lighting.tier, result.resolution.tier, result.landmarkConfidence.tier];
  return tiers.reduce((sum, t) => sum + tierScore(t), 0) / tiers.length;
}
