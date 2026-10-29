export type QualityTier = "PASS" | "WARNING" | "FAIL";

export interface QualityCheck {
  tier: QualityTier;
  /** User-facing message. Present whenever tier !== "PASS". */
  message?: string;
}

export interface BlurCheck extends QualityCheck {
  /** Laplacian variance measured after resizing to CANONICAL_BLUR_WIDTH (see blur.ts). Higher = sharper. */
  varianceAtCanonicalWidth: number;
}

export interface LightingCheck extends QualityCheck {
  /** Mean luminance, 0-255. */
  brightness: number;
}

export interface ResolutionCheck extends QualityCheck {
  width: number;
  height: number;
}

/**
 * Combines every quality signal CartSync can compute for a single captured
 * frame into one structured result. Produced in two passes by
 * quality/assess.ts: assessPrePoseQuality() fills blur/lighting/resolution
 * before pose detection runs (so an obviously bad frame can be rejected
 * without paying MediaPipe's inference cost); combineQualityResult() adds
 * bodyVisibility/landmarkConfidence/framing once a PoseResult exists and
 * produces the final `overall` tier and `actionableMessages`.
 */
export interface ImageQualityResult {
  overall: QualityTier;
  blur: BlurCheck;
  lighting: LightingCheck;
  resolution: ResolutionCheck;
  bodyVisibility: QualityCheck;
  landmarkConfidence: QualityCheck;
  framing: QualityCheck;
  /** Ordered, deduplicated, user-facing strings for every non-PASS check. Empty when overall === "PASS". */
  actionableMessages: string[];
}

export function worstTier(tiers: QualityTier[]): QualityTier {
  if (tiers.includes("FAIL")) return "FAIL";
  if (tiers.includes("WARNING")) return "WARNING";
  return "PASS";
}
