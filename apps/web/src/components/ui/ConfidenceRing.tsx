"use client";

import * as React from "react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConfidenceRingProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string; // hex or var()
  label?: string;
  className?: string;
}

export function ConfidenceRing({
  value,
  size = 64,
  strokeWidth = 6,
  color = "var(--color-accent-blue)",
  label,
  className,
}: ConfidenceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = useMotionValue(0);
  
  // Smooth spring animation for the progress
  const animatedProgress = useSpring(progress, {
    stiffness: 40,
    damping: 15,
    mass: 1,
  });
  const strokeDashoffset = useTransform(animatedProgress, (v) => circumference - (v / 100) * circumference);

  React.useEffect(() => {
    progress.set(value);
  }, [value, progress]);

  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    return animatedProgress.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
  }, [animatedProgress]);

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background Track */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--color-bg-elevated)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Progress Ring */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
            style={{
              strokeDashoffset,
              filter: `drop-shadow(0 0 4px ${color}80)`
            }}
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-lg font-bold tracking-tight text-text-primary">
            {displayValue}<span className="text-xs font-medium text-text-tertiary ml-0.5">%</span>
          </span>
        </div>
      </div>
      {label && (
        <span className="mt-2 text-xs font-medium text-text-secondary uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}
