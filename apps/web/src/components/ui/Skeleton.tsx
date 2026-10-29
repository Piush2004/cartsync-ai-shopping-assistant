import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: boolean;
}

export function Skeleton({ className, rounded, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "shimmer border border-border/50",
        rounded ? "rounded-full" : "rounded-xl",
        className
      )}
      {...props}
    />
  );
}
