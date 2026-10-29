"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "info" | "premium";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-bg-elevated text-text-secondary border border-border",
    success: "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20",
    warning: "bg-accent-amber/10 text-accent-amber border border-accent-amber/20",
    info: "bg-accent-blue/10 text-accent-blue border border-accent-blue/20",
    premium: "bg-bg-primary text-text-primary border border-transparent relative overflow-hidden",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {variant === "premium" && (
        <div className="absolute inset-0 rounded-full p-[1px] bg-gradient-accent -z-10 [mask-image:linear-gradient(#fff_0_0)] [mask-composite:exclude]" />
      )}
      {children}
    </div>
  );
}
