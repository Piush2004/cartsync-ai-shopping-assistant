import { describe, expect, it } from "vitest";
import { analyzeLighting, classifyLighting, BRIGHTNESS_FAIL_LOW, BRIGHTNESS_FAIL_HIGH } from "./lighting";

function makeUniformImageData(width: number, height: number, luminance: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = luminance;
    data[i + 1] = luminance;
    data[i + 2] = luminance;
    data[i + 3] = 255;
  }
  return { width, height, data } as unknown as ImageData;
}

describe("analyzeLighting", () => {
  it("measures the correct mean brightness for a uniform image", () => {
    const stats = analyzeLighting(makeUniformImageData(20, 20, 150));
    expect(stats.brightness).toBeCloseTo(150, 0);
  });

  it("flags isTooDark for a uniformly near-black image", () => {
    const stats = analyzeLighting(makeUniformImageData(20, 20, 10));
    expect(stats.isTooDark).toBe(true);
  });

  it("flags isOverexposed for a uniformly near-white image", () => {
    const stats = analyzeLighting(makeUniformImageData(20, 20, 250));
    expect(stats.isOverexposed).toBe(true);
  });

  it("does not flag either condition for a mid-brightness image (real 'normal_reference' fixture value ~204)", () => {
    const stats = analyzeLighting(makeUniformImageData(20, 20, 204));
    expect(stats.isTooDark).toBe(false);
    expect(stats.isOverexposed).toBe(false);
  });

  it("no longer silently passes the real dim mirror-selfie brightness (63.7) as fully lit -- BUG this session found and fixed", () => {
    const stats = analyzeLighting(makeUniformImageData(20, 20, 64));
    // Not FAIL (the old threshold of 40 correctly stays below this), but
    // classifyLighting must now surface it as at least a WARNING, not a
    // silent PASS -- see the classifyLighting tests below.
    expect(stats.isTooDark).toBe(false);
    expect(classifyLighting(stats.brightness)).not.toBe("PASS");
  });
});

describe("classifyLighting", () => {
  it("FAILs the real synthetic extreme-dark fixture (49.1)", () => {
    expect(classifyLighting(49.1)).toBe("FAIL");
  });

  it("WARNs the real dim mirror-selfie photo (63.7) instead of silently passing it", () => {
    expect(classifyLighting(63.7)).toBe("WARNING");
  });

  it("WARNs the real 0.4x-brightness synthetic fixture (76.6)", () => {
    expect(classifyLighting(76.6)).toBe("WARNING");
  });

  it("PASSes the real 0.55x-brightness synthetic fixture (106.3)", () => {
    expect(classifyLighting(106.3)).toBe("PASS");
  });

  it("PASSes the real well-lit photo fixtures (137-204 range)", () => {
    for (const brightness of [137.6, 160.3, 204.0]) {
      expect(classifyLighting(brightness)).toBe("PASS");
    }
  });

  it("FAILs the real overexposed synthetic fixtures (232.5 and above)", () => {
    for (const brightness of [232.5, 238.9, 250.6]) {
      expect(classifyLighting(brightness)).toBe("FAIL");
    }
  });

  it("is monotonic at the exact threshold boundaries", () => {
    expect(classifyLighting(BRIGHTNESS_FAIL_LOW - 0.01)).toBe("FAIL");
    expect(classifyLighting(BRIGHTNESS_FAIL_HIGH - 0.01)).not.toBe("FAIL");
    expect(classifyLighting(BRIGHTNESS_FAIL_HIGH)).toBe("FAIL");
  });
});
