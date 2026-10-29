"use client";

import { motion } from "framer-motion";
import { GlowCard } from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/Button";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <GlowCard className={`flex flex-col items-center justify-center text-center p-12 ${className}`}>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 100 }}
      >
        <motion.div 
          className="w-16 h-16 rounded-full bg-bg-elevated border border-border flex items-center justify-center mb-6 mx-auto"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {icon}
        </motion.div>
        
        <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary max-w-md mx-auto mb-8">
          {description}
        </p>
        
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="secondary">
            {actionLabel}
          </Button>
        )}
      </motion.div>
    </GlowCard>
  );
}
