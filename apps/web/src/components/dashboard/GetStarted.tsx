"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";

/**
 * The three things a new person does, in order. Numbered because it really
 * is a sequence: a size can't be worked out before measurements exist.
 */
export function GetStarted({ hasMeasurements }: { hasMeasurements: boolean }) {
  const steps = [
    { title: "Add your measurements", detail: "Take two photos or type them in.", href: "/measurements", done: hasMeasurements },
    { title: "Paste a product link", detail: "We read the photo, price and brand.", href: "/try-on", done: false },
    { title: "See your size and how it looks", detail: "Your size on a tag, and the item on your photo.", href: "/try-on", done: false },
  ];

  return (
    <Card>
      <h2 className="text-lg font-bold text-text-primary mb-5">How it works</h2>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Link href={step.href} className="flex items-start gap-3 group">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                  step.done
                    ? "bg-accent-emerald border-accent-emerald text-white"
                    : "border-border-active text-text-secondary group-hover:border-accent-blue group-hover:text-accent-blue"
                }`}
              >
                {step.done ? <Check className="h-4 w-4" aria-label="Done" /> : i + 1}
              </span>
              <span>
                <span className="block text-sm font-bold text-text-primary group-hover:underline">{step.title}</span>
                <span className="block text-sm text-text-secondary">{step.detail}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
