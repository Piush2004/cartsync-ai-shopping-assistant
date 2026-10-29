"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { hoverLift } from "@/lib/motion";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: any;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden active:scale-[0.98]";
    
    const variants = {
      primary: "bg-accent-blue text-white rounded-xl shadow-md hover:shadow-lg hover:bg-blue-700 border border-transparent",
      secondary: "bg-bg-card text-text-primary rounded-xl shadow-sm border border-border hover:bg-bg-hover hover:border-border-hover",
      outline: "bg-transparent text-text-primary rounded-xl border border-border hover:bg-bg-hover",
      ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-xl",
      danger: "bg-accent-rose text-white rounded-xl shadow-sm hover:bg-rose-600 border border-transparent",
      success: "bg-accent-emerald text-white rounded-xl shadow-sm hover:bg-emerald-600 border border-transparent",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm rounded-lg",
      md: "h-11 px-6 text-base rounded-xl",
      lg: "h-14 px-8 text-lg rounded-xl",
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        whileHover={disabled || loading ? {} : hoverLift.whileHover}
        whileTap={disabled || loading ? {} : hoverLift.whileTap}
        {...props}
      >
        {/* Primary shimmer effect */}
        {variant === "primary" && (
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]" />
        )}
        
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
