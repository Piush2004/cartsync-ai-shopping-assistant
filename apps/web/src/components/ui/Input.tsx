"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, success, icon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="w-full">
        <label className="mb-2 block text-sm text-text-tertiary font-medium">
          {label}
        </label>
        <motion.div 
          className="relative flex items-center"
          animate={error ? { x: [-4, 4, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {icon && (
            <div className="absolute left-4 text-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "flex h-12 w-full rounded-xl border bg-bg-secondary px-4 py-2 text-base text-text-primary placeholder:text-text-muted transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-1",
              icon && "pl-11",
              error 
                ? "border-accent-rose focus-visible:ring-accent-rose" 
                : success 
                  ? "border-accent-emerald focus-visible:ring-accent-emerald"
                  : isFocused
                    ? "border-accent-blue focus-visible:ring-accent-blue shadow-glow-blue"
                    : "border-border hover:border-border-hover",
              className
            )}
            {...props}
          />
        </motion.div>
        {error && (
          <p className="mt-2 text-xs text-accent-rose font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
