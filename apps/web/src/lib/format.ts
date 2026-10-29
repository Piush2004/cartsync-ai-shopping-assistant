/**
 * Prices from link-import always come from Indian e-commerce platforms
 * (Flipkart / Amazon.in / Myntra -- see services/link_import's allowlist)
 * and are always genuinely denominated in INR. This formats that same real
 * amount according to the viewer's own locale numbering convention
 * (India's lakh/crore grouping, e.g. "₹1,25,000", vs the international
 * thousands grouping, e.g. "₹125,000") -- it does not convert currency.
 * Converting would mean fabricating an exchange rate this app has no real
 * data for, which is worse than just showing the real rupee amount to
 * everyone regardless of where they're viewing from.
 */
export function formatINR(amount: number): string {
  const locale = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-IN";
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  };
  try {
    return new Intl.NumberFormat(locale, options).format(amount);
  } catch {
    // Intl.NumberFormat can throw on a malformed locale tag -- fall back to
    // India's own formatting rather than crash the preview card over it.
    return new Intl.NumberFormat("en-IN", options).format(amount);
  }
}
