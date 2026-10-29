import type { PoseResult } from "../vision/types";
import { LANDMARK } from "../vision/landmarks";
import { MEDIAPIPE_MODEL_VERSION } from "../vision/mediapipe-provider";
import { calibrateFromHeight } from "../calibration/height-calibration";
import {
  measureShoulderWidth,
  measureArmLength,
  measureTorsoLength,
  measureInseamProxy,
  estimateCircumferenceFromWidth,
  ASSUMED_DEPTH_TO_WIDTH_RATIO,
} from "./geometry";
import { computeOverallConfidence, computeGeometryConfidence, type ConfidenceBreakdown } from "../confidence/confidence";
import { checkFrontSideConsistency } from "../validation/consistency";
import { checkPlausibility, checkHistoricalConsistency, type PlausibilityFailure, type HistoricalChangeFlag } from "../validation/anatomical";

export const ALGORITHM_VERSION = "geometric-v1";

export interface CaptureInput {
  poseResult: PoseResult;
  imageWidthPx: number;
  imageHeightPx: number;
  /** 0.0-1.0, from quality/validation.ts's ValidationResult, converted by the caller (see camera page). */
  imageQualityScore: number;
}

export interface MeasurementFieldResult {
  valueCm: number;
  /** Per-field display confidence -- NOT sent to the backend individually; only confidenceBreakdown.overall is stored (see apps/api/schemas/measurement.py). */
  confidence: number;
  isEstimate: boolean;
}

export interface PipelineResult {
  ok: true;
  measurements: Record<
    "shoulder" | "arm_length" | "torso_length" | "inseam" | "chest" | "waist" | "hip",
    MeasurementFieldResult
  >;
  confidenceBreakdown: ConfidenceBreakdown;
  plausibilityFailures: PlausibilityFailure[];
  historicalFlags: HistoricalChangeFlag[];
  consistencyWarnings: string[];
  modelVersion: string;
  algorithmVersion: string;
  calibrationMethod: "user_height";
  /** True if any failure/warning means this result should not be silently trusted -- surface it to the user instead of auto-confirming. */
  requiresReview: boolean;
}

export interface PipelineFailure {
  ok: false;
  reason: "CALIBRATION_FAILED";
  warnings: string[];
}

export function runMeasurementPipeline(
  front: CaptureInput,
  side: CaptureInput,
  userHeightCm: number,
  previousMeasurementsCm: Record<string, number | undefined> = {}
): PipelineResult | PipelineFailure {
  const frontCal = calibrateFromHeight(front.poseResult.landmarks2D, userHeightCm, front.imageWidthPx, front.imageHeightPx);
  const sideCal = calibrateFromHeight(side.poseResult.landmarks2D, userHeightCm, side.imageWidthPx, side.imageHeightPx);

  if (frontCal.confidence === 0 || sideCal.confidence === 0) {
    return { ok: false, reason: "CALIBRATION_FAILED", warnings: [...frontCal.warnings, ...sideCal.warnings] };
  }

  const shoulder = measureShoulderWidth(front.poseResult.landmarks2D, frontCal.cmPerPixel, front.imageWidthPx, front.imageHeightPx);
  const armLength = measureArmLength(front.poseResult.landmarks2D, frontCal.cmPerPixel, front.imageWidthPx, front.imageHeightPx);
  const frontTorso = measureTorsoLength(front.poseResult.landmarks2D, frontCal.cmPerPixel, front.imageWidthPx, front.imageHeightPx);
  const frontInseam = measureInseamProxy(front.poseResult.landmarks2D, frontCal.cmPerPixel, front.imageWidthPx, front.imageHeightPx);
  const sideTorso = measureTorsoLength(side.poseResult.landmarks2D, sideCal.cmPerPixel, side.imageWidthPx, side.imageHeightPx);
  const sideInseam = measureInseamProxy(side.poseResult.landmarks2D, sideCal.cmPerPixel, side.imageWidthPx, side.imageHeightPx);

  const consistency = checkFrontSideConsistency({
    frontTorsoLengthCm: frontTorso.valueCm,
    sideTorsoLengthCm: sideTorso.valueCm,
    frontInseamProxyCm: frontInseam.valueCm,
    sideInseamProxyCm: sideInseam.valueCm,
  });

  // Hip width has a direct landmark pair (LEFT_HIP/RIGHT_HIP); chest and
  // waist do not (BlazePose has no chest- or waist-level landmark), so both
  // are approximated from the shoulder/hip line -- see geometry.ts's doc
  // comment for why this, and the resulting circumference, is an ESTIMATE.
  const leftHip = front.poseResult.landmarks2D[LANDMARK.LEFT_HIP];
  const rightHip = front.poseResult.landmarks2D[LANDMARK.RIGHT_HIP];
  const hipWidthPx = Math.hypot(
    (leftHip.x - rightHip.x) * front.imageWidthPx,
    (leftHip.y - rightHip.y) * front.imageHeightPx
  );
  const hipWidthCm = hipWidthPx * frontCal.cmPerPixel;
  const chestWidthCm = shoulder.valueCm * 0.9; // chest is typically narrower than shoulder-to-shoulder; unvalidated ratio, see ASSUMED_DEPTH_TO_WIDTH_RATIO doc
  const waistWidthCm = (chestWidthCm + hipWidthCm) / 2; // no waist landmark exists at all; linear interpolation between chest and hip as a rough placeholder

  const chestCirc = estimateCircumferenceFromWidth(chestWidthCm, ASSUMED_DEPTH_TO_WIDTH_RATIO.chest);
  const waistCirc = estimateCircumferenceFromWidth(waistWidthCm, ASSUMED_DEPTH_TO_WIDTH_RATIO.waist);
  const hipCirc = estimateCircumferenceFromWidth(hipWidthCm, ASSUMED_DEPTH_TO_WIDTH_RATIO.hip);

  const poseConfidence = (front.poseResult.confidence + side.poseResult.confidence) / 2;
  const imageQualityConfidence = (front.imageQualityScore + side.imageQualityScore) / 2;
  const calibrationConfidence = (frontCal.confidence + sideCal.confidence) / 2;
  // Plausibility of the assumed depth ratios can't be evaluated yet (no
  // ground truth) -- fixed at 1.0 so computeGeometryConfidence's ceiling is
  // the only thing capping this factor, not a second unjustified guess.
  const geometryConfidence = computeGeometryConfidence(1.0);

  const confidenceBreakdown = computeOverallConfidence({
    pose: poseConfidence,
    imageQuality: imageQualityConfidence,
    calibration: calibrationConfidence,
    geometry: geometryConfidence,
    frontSideConsistency: consistency.confidence,
  });

  const directFieldConfidence = clamp01(poseConfidence * imageQualityConfidence * calibrationConfidence);

  const measurements: PipelineResult["measurements"] = {
    shoulder: { valueCm: shoulder.valueCm, confidence: directFieldConfidence, isEstimate: false },
    arm_length: { valueCm: armLength.valueCm, confidence: directFieldConfidence, isEstimate: false },
    torso_length: { valueCm: frontTorso.valueCm, confidence: directFieldConfidence, isEstimate: false },
    inseam: { valueCm: frontInseam.valueCm, confidence: directFieldConfidence, isEstimate: false },
    chest: { valueCm: chestCirc.valueCm, confidence: geometryConfidence, isEstimate: true },
    waist: { valueCm: waistCirc.valueCm, confidence: geometryConfidence, isEstimate: true },
    hip: { valueCm: hipCirc.valueCm, confidence: geometryConfidence, isEstimate: true },
  };

  const plausibilityFailures = checkPlausibility({
    chest: measurements.chest.valueCm,
    waist: measurements.waist.valueCm,
    hip: measurements.hip.valueCm,
    inseam: measurements.inseam.valueCm,
    shoulder: measurements.shoulder.valueCm,
    arm_length: measurements.arm_length.valueCm,
    torso_length: measurements.torso_length.valueCm,
  });

  const historicalFlags = checkHistoricalConsistency(previousMeasurementsCm, {
    chest: measurements.chest.valueCm,
    waist: measurements.waist.valueCm,
    hip: measurements.hip.valueCm,
    inseam: measurements.inseam.valueCm,
    shoulder: measurements.shoulder.valueCm,
  });

  const requiresReview =
    plausibilityFailures.length > 0 ||
    historicalFlags.length > 0 ||
    consistency.warnings.length > 0 ||
    confidenceBreakdown.overall < 0.5;

  return {
    ok: true,
    measurements,
    confidenceBreakdown,
    plausibilityFailures,
    historicalFlags,
    consistencyWarnings: consistency.warnings,
    modelVersion: MEDIAPIPE_MODEL_VERSION,
    algorithmVersion: ALGORITHM_VERSION,
    calibrationMethod: "user_height",
    requiresReview,
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
