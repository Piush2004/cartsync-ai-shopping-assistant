"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardProps } from "./Card";

export const GlowCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
      e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
    };

    return (
      <Card
        ref={ref}
        onMouseMove={handleMouseMove}
        className={cn("glow-card transition-colors duration-300 hover:border-border-hover hover:bg-bg-hover", className)}
        {...props}
      >
        {children}
      </Card>
    );
  }
);
GlowCard.displayName = "GlowCard";
