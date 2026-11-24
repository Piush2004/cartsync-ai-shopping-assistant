"use client";

/**
 * The fit result, drawn as the paper hang tag you find on a garment in a
 * shop: punched hole, string, one big size. This is the single memorable
 * element of the try-on screen -- everything around it stays quiet so the
 * answer to "what size do I buy?" is the first thing the eye lands on.
 */
export function SizeTag({ size }: { size: string }) {
  return (
    <svg
      viewBox="0 0 120 170"
      role="img"
      aria-label={`Your size is ${size}`}
      className="tag-swing h-36 w-auto drop-shadow-sm"
    >
      <path d="M60 46 C 60 22 60 14 60 2" fill="none" stroke="#232B6B" strokeWidth="2" strokeLinecap="round" />
      <polygon
        points="34,30 86,30 106,50 106,160 14,160 14,50"
        fill="#F4C20D"
        stroke="#232B6B"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="46" r="5.5" fill="#F5F7F4" stroke="#232B6B" strokeWidth="2" />
      <text x="60" y="84" textAnchor="middle" fontSize="12" fill="#232B6B" style={{ fontFamily: "var(--font-body)" }}>
        Your size
      </text>
      <text
        x="60"
        y="134"
        textAnchor="middle"
        fontSize={size.length > 2 ? 40 : 52}
        fontWeight="700"
        fill="#232B6B"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        {size}
      </text>
    </svg>
  );
}
