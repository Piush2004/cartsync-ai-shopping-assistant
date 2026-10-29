"use client";

import * as React from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { Sparkles, ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FitScoreBadgeProps {
  score: number; // 0 to 1
  className?: string;
}

export function FitScoreBadge({ score, className }: FitScoreBadgeProps) {
  const percentage = Math.round(score * 100);
  const progress = useMotionValue(0);
  
  const animatedProgress = useSpring(progress, {
    stiffness: 50,
    damping: 15,
  });

  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    progress.set(percentage);
  }, [percentage, progress]);

  React.useEffect(() => {
    return animatedProgress.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
  }, [animatedProgress]);

  let config = {
    bg: "bg-accent-rose/10",
    text: "text-accent-rose",
    border: "border-accent-rose/20",
    label: "Poor Fit",
    Icon: ThumbsDown,
  };

  if (percentage >= 90) {
    config = {
      bg: "bg-accent-emerald/10",
      text: "text-accent-emerald",
      border: "border-accent-emerald/20",
      label: "Excellent Fit",
      Icon: Sparkles,
    };
  } else if (percentage >= 75) {
    config = {
      bg: "bg-accent-blue/10",
      text: "text-accent-blue",
      border: "border-accent-blue/20",
      label: "Great Fit",
      Icon: CheckCircle2,
    };
  } else if (percentage >= 50) {
    config = {
      bg: "bg-accent-amber/10",
      text: "text-accent-amber",
      border: "border-accent-amber/20",
      label: "Good Fit",
      Icon: ThumbsUp,
    };
  }

  const { Icon } = config;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border shadow-sm",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{displayValue}% — {config.label}</span>
    </div>
  );
}
