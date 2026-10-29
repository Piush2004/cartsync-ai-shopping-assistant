import { describe, expect, it } from "vitest";
import { detectBlur, classifyBlurVariance, BLUR_FAIL_THRESHOLD, BLUR_PASS_THRESHOLD } from "./blur";

function makeImageData(width: number, height: number, fill: (x: number, y: number) => number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = fill(x, y);
      const idx = (y * width + x) * 4;
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
      data[idx + 3] = 255;
    }
  }
  return { width, height, data } as unknown as ImageData;
}

describe("detectBlur", () => {
  it("returns ~0 variance for a perfectly flat (uniform-color) image", () => {
    const flat = makeImageData(40, 40, () => 128);
    expect(detectBlur(flat)).toBeCloseTo(0, 5);
  });

  it("returns a large variance for high-frequency noise", () => {
    // A period-2 checkerboard aliases against this function's stride-2
    // sampling (every sampled pixel lands on the same parity, so the
    // Laplacian is identical at every sample point and its variance is
    // exactly 0 -- a real, documented characteristic of stride-based
    // sampling, not something a real photo's texture would trigger).
    // Pseudo-random noise is a more realistic stand-in for real texture and
    // isn't period-aligned with the stride.
    let seed = 42;
    const pseudoRandom = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % 256;
    };
    const noisy = makeImageData(40, 40, () => pseudoRandom());
    const flat = makeImageData(40, 40, () => 128);
    expect(detectBlur(noisy)).toBeGreaterThan(detectBlur(flat));
    expect(detectBlur(noisy)).toBeGreaterThan(1000);
  });

  it("shows a smoothed version of the same pattern has lower variance than the sharp version", () => {
    // A single hard edge vs. the same edge smoothed over a few pixels.
    const sharpEdge = makeImageData(40, 40, (x) => (x < 20 ? 0 : 255));
    const softEdge = makeImageData(40, 40, (x) => {
      if (x < 17) return 0;
      if (x > 22) return 255;
      return Math.round(((x - 17) / 5) * 255); // linear ramp across the edge
    });
    expect(detectBlur(softEdge)).toBeLessThan(detectBlur(sharpEdge));
  });
});

describe("classifyBlurVariance", () => {
  it("FAILs values at or below real measured blur-degraded fixtures", () => {
    // Real values measured at 640px canonical width in
    // research/cv/results/image_quality_benchmark.json (mild/heavy gaussian
    // blur and motion blur applied to real photos via sharp).
    for (const measured of [9.93, 20.07, 1.44, 2.81, 21.6, 11.32, 44.68, 29.92]) {
      expect(classifyBlurVariance(measured)).toBe("FAIL");
    }
  });

  it("PASSes values at real measured sharp-photo fixtures", () => {
    // Real values measured at 640px canonical width for two genuinely sharp
    // real photos (male_indoor, female_indoor).
    for (const measured of [207.06, 387.03]) {
      expect(classifyBlurVariance(measured)).toBe("PASS");
    }
  });

  it("WARNs in the interpolated buffer band between the thresholds", () => {
    expect(classifyBlurVariance((BLUR_FAIL_THRESHOLD + BLUR_PASS_THRESHOLD) / 2)).toBe("WARNING");
  });

  it("is monotonic at the exact threshold boundaries", () => {
    expect(classifyBlurVariance(BLUR_FAIL_THRESHOLD - 0.01)).toBe("FAIL");
    expect(classifyBlurVariance(BLUR_FAIL_THRESHOLD)).toBe("WARNING");
    expect(classifyBlurVariance(BLUR_PASS_THRESHOLD - 0.01)).toBe("WARNING");
    expect(classifyBlurVariance(BLUR_PASS_THRESHOLD)).toBe("PASS");
  });
});
