import { afterEach, describe, expect, it, vi } from "vitest";
import { formatINR } from "./format";

describe("formatINR", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses Indian lakh/crore grouping for an Indian-locale viewer", () => {
    vi.stubGlobal("navigator", { language: "en-IN" });
    expect(formatINR(125000)).toBe("₹1,25,000");
  });

  it("uses Western thousands grouping for a non-Indian-locale viewer, same real rupee amount", () => {
    vi.stubGlobal("navigator", { language: "en-US" });
    // Same underlying value as the Indian-locale test above -- this proves
    // the amount isn't being converted to another currency, only the digit
    // grouping changes.
    expect(formatINR(125000)).toBe("₹125,000");
  });

  it("defaults to Indian formatting when navigator is unavailable (e.g. SSR)", () => {
    vi.stubGlobal("navigator", undefined);
    expect(formatINR(125000)).toBe("₹1,25,000");
  });

  it("falls back to Indian formatting for a malformed locale tag instead of throwing", () => {
    vi.stubGlobal("navigator", { language: "not-a-real-locale-!!!" });
    expect(() => formatINR(2999)).not.toThrow();
    expect(formatINR(2999)).toBe("₹2,999");
  });

  it("rounds to whole rupees rather than showing paise", () => {
    vi.stubGlobal("navigator", { language: "en-IN" });
    expect(formatINR(1299.5)).toBe("₹1,300");
  });
});
