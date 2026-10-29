import { detectBlur, resizeImageDataForBlurCheck, CANONICAL_BLUR_WIDTH } from "./blur";

export interface FrameCandidate {
  canvas: HTMLCanvasElement;
  imageData: ImageData;
}

export interface FrameScore {
  index: number;
  blurVarianceAtCanonicalWidth: number;
}

/**
 * Scores each candidate frame by canonical-width Laplacian variance
 * (higher = sharper) -- the same metric and resolution-normalization used
 * for the single-frame blur check (see blur.ts), so scores here are
 * directly comparable to the PASS/WARNING/FAIL thresholds calibrated in
 * research/cv/results/image_quality_benchmark.json. Blur is the criterion
 * that most directly reflects hand-shake/motion between a burst of frames
 * taken a few hundred milliseconds apart -- lighting and framing don't
 * meaningfully change frame-to-frame during a single capture burst, so
 * they aren't used as tie-breakers here (kept simple, per scope: this is a
 * frame-selection heuristic, not a second confidence model).
 */
export function scoreFrames(candidates: FrameCandidate[]): FrameScore[] {
  return candidates.map((c, index) => {
    const resized = resizeImageDataForBlurCheck(c.canvas, c.canvas.width, c.canvas.height, CANONICAL_BLUR_WIDTH);
    return { index, blurVarianceAtCanonicalWidth: detectBlur(resized) };
  });
}

export interface BestFrameResult {
  bestIndex: number;
  scores: FrameScore[];
}

/**
 * Pure selection logic (no canvas/DOM involved) -- kept separate from
 * scoreFrames so it's directly unit-testable in this repo's Node-based
 * vitest environment, unlike scoreFrames/selectBestFrame which need a real
 * canvas to resize/decode frames.
 */
export function pickBestScore(scores: FrameScore[]): FrameScore {
  if (scores.length === 0) {
    throw new Error("pickBestScore: scores must not be empty");
  }
  return scores.reduce((a, b) => (b.blurVarianceAtCanonicalWidth > a.blurVarianceAtCanonicalWidth ? b : a));
}

/** Picks the sharpest of a burst of candidate frames captured in quick succession. */
export function selectBestFrame(candidates: FrameCandidate[]): BestFrameResult {
  if (candidates.length === 0) {
    throw new Error("selectBestFrame: candidates must not be empty");
  }
  const scores = scoreFrames(candidates);
  const best = pickBestScore(scores);
  return { bestIndex: best.index, scores };
}
