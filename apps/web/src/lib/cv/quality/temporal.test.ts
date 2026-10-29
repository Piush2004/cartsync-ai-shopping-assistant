import { describe, expect, it } from "vitest";
import { pickBestScore, type FrameScore } from "./temporal";

describe("pickBestScore", () => {
  it("picks the frame with the highest blur variance (sharpest)", () => {
    const scores: FrameScore[] = [
      { index: 0, blurVarianceAtCanonicalWidth: 40 },
      { index: 1, blurVarianceAtCanonicalWidth: 210 }, // sharpest
      { index: 2, blurVarianceAtCanonicalWidth: 95 },
    ];
    expect(pickBestScore(scores).index).toBe(1);
  });

  it("handles a single candidate", () => {
    const scores: FrameScore[] = [{ index: 0, blurVarianceAtCanonicalWidth: 150 }];
    expect(pickBestScore(scores).index).toBe(0);
  });

  it("throws on an empty list rather than silently returning something", () => {
    expect(() => pickBestScore([])).toThrow();
  });

  it("picks consistently even when all frames are blurry (still picks the least-bad one, doesn't crash)", () => {
    const scores: FrameScore[] = [
      { index: 0, blurVarianceAtCanonicalWidth: 5 },
      { index: 1, blurVarianceAtCanonicalWidth: 2 },
      { index: 2, blurVarianceAtCanonicalWidth: 8 },
    ];
    expect(pickBestScore(scores).index).toBe(2);
  });
});
