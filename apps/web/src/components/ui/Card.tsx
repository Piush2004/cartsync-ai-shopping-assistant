"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/motion";

export interface CardProps extends HTMLMotionProps<"div"> {
  gradient?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, gradient = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        variants={fadeInUp}
        className={cn(
          "rounded-2xl border border-border bg-bg-card p-6 shadow-sm hover:shadow-md transition-shadow overflow-hidden",
          gradient && "relative",
          className
        )}
        {...props}
      >
        {gradient && (
          <div className="absolute inset-0 bg-[var(--gradient-card)] pointer-events-none z-0" />
        )}
        <div className="relative z-10 h-full flex flex-col">{children as any}</div>
      </motion.div>
    );
  }
);
Card.displayName = "Card";
