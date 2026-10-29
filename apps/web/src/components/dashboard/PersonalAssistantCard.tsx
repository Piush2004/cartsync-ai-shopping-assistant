"use client";

import Link from "next/link";
import { Sparkles, Link2, Ruler } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function PersonalAssistantCard() {
  return (
    <Card className="bg-gradient-to-br from-accent-blue/5 to-transparent">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-accent-blue" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary">Your AI Personal Assistant</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Ask about sizing below, or bring in a product you're already looking at.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/try-on"
          className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 hover:border-accent-blue/40 hover:bg-bg-hover transition-colors"
        >
          <Link2 className="w-4 h-4 text-accent-blue shrink-0" />
          <div>
            <p className="text-sm font-semibold text-text-primary">Import &amp; Try It On</p>
            <p className="text-xs text-text-muted">Paste a product link for a fit guide + try-on</p>
          </div>
        </Link>

        <Link
          href="/measurements"
          className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 hover:border-accent-blue/40 hover:bg-bg-hover transition-colors"
        >
          <Ruler className="w-4 h-4 text-accent-blue shrink-0" />
          <div>
            <p className="text-sm font-semibold text-text-primary">My Measurements</p>
            <p className="text-xs text-text-muted">Keep these current for accurate sizing</p>
          </div>
        </Link>
      </div>
    </Card>
  );
}
