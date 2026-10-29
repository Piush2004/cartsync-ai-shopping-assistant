"use client";

import { Card } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import { TiltCard } from "@/components/effects/TiltCard";

interface MeasurementCardProps {
  label: string;
  value: number;
  unit?: string;
  confidence: number;
  trend?: "up" | "down" | "stable";
  lastUpdated?: string;
}

export function MeasurementCard({ label, value, unit = "cm", confidence, trend = "stable", lastUpdated = "Just now" }: MeasurementCardProps) {
  const progress = useMotionValue(0);
  const animatedValue = useSpring(progress, { stiffness: 50, damping: 15 });
  const [displayValue, setDisplayValue] = useState("0.0");

  useEffect(() => {
    progress.set(value);
  }, [value, progress]);

  useEffect(() => {
    return animatedValue.on("change", (latest) => {
      setDisplayValue(latest.toFixed(1));
    });
  }, [animatedValue]);

  let TrendIcon = Minus;
  let trendColor = "text-text-muted";
  if (trend === "up") {
    TrendIcon = TrendingUp;
    trendColor = "text-accent-emerald";
  } else if (trend === "down") {
    TrendIcon = TrendingDown;
    trendColor = "text-accent-blue";
  }

  // Determine bar color based on confidence
  let barColor = "bg-accent-emerald";
  if (confidence < 70) barColor = "bg-accent-amber";
  if (confidence < 40) barColor = "bg-accent-rose";

  return (
    <TiltCard className="w-full">
      <Card className="relative p-5 h-full group border-border hover:border-border-hover transition-colors overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="flex justify-between items-start mb-2 relative z-10">
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
        </div>
        
        <div className="flex justify-between items-end gap-2 mb-4 relative z-10">
          <div className="flex items-baseline gap-1">
            <motion.span className="text-3xl font-bold tracking-tight text-text-primary">
              {displayValue}
            </motion.span>
            <span className="text-text-tertiary text-sm font-medium">{unit}</span>
          </div>
          <span className="text-[10px] text-text-muted font-medium mb-1">{lastUpdated}</span>
        </div>

        <div className="mt-auto relative z-10">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-text-muted">Confidence</span>
            <span className="text-xs font-semibold text-text-primary">{Math.round(confidence)}%</span>
          </div>
          <div className="w-full h-1 bg-bg-elevated rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: `${confidence}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
              className={`h-full rounded-full ${barColor} relative overflow-hidden`} 
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: '1s' }} />
            </motion.div>
          </div>
        </div>
      </Card>
    </TiltCard>
  );
}
