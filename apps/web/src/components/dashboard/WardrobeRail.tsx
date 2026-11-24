"use client";

import Link from "next/link";

interface WardrobeRailProps {
  displayName: string;
  hasMeasurements: boolean;
}

/**
 * The dashboard's opening: a clothes rail with the app's three jobs hanging
 * from it as garment tags. Each tag is a link and swings when you touch or
 * focus it -- the same hang tag that carries your size on the try-on page.
 */
export function WardrobeRail({ displayName, hasMeasurements }: WardrobeRailProps) {
  const tags = [
    {
      href: "/try-on",
      title: "Try on a product",
      hint: "Paste a link from Myntra and see it on you",
      primary: true,
    },
    {
      href: "/measurements",
      title: hasMeasurements ? "Update my measurements" : "Add my measurements",
      hint: hasMeasurements ? "Keep them current for the right size" : "Two photos, or type them in",
      primary: false,
    },
    {
      href: "/stylist",
      title: "Ask about a size",
      hint: "Which size should I buy in this brand?",
      primary: false,
    },
  ];

  return (
    <section className="mb-12">
      <h1 className="text-4xl sm:text-5xl 2xl:text-6xl font-bold text-text-primary">Hello, {displayName}</h1>
      <p className="mt-3 text-lg 2xl:text-xl text-text-secondary max-w-2xl">
        {hasMeasurements
          ? "Your measurements are saved. Bring in something you want to buy and see your size."
          : "Add your measurements once. After that, every product you bring in comes with your size."}
      </p>

      <nav aria-label="What would you like to do?" className="rail mt-10">
        <div className="rail-bar" aria-hidden="true" />
        <ul className="rail-list">
          {tags.map((tag) => (
            <li key={tag.href} className="rail-item">
              <span className="rail-string" aria-hidden="true" />
              <Link href={tag.href} className={`rail-tag ${tag.primary ? "rail-tag-primary" : ""}`}>
                <span className="rail-hole" aria-hidden="true" />
                <span className="block text-lg font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                  {tag.title}
                </span>
                <span className="block mt-2 text-sm leading-snug opacity-80">{tag.hint}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
