"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuroraOrbProps {
  color?: string;
  size?: string;
  blur?: string;
  className?: string;
}

export function AuroraOrb({ 
  color, 
  size = "600px", 
  blur = "150px", 
  className 
}: AuroraOrbProps) {
  const { scrollY } = useScroll();
  
  // Drift upward slowly as user scrolls
  const y = useTransform(scrollY, [0, 1000], [0, -200]);

  return (
    <motion.div 
      className={cn(
        "absolute z-0 rounded-full pointer-events-none",
        !color && "aurora-border opacity-20",
        className
      )}
      style={{ 
        y, 
        left: className?.includes('left') || className?.includes('right') ? undefined : '50%', 
        top: className?.includes('top') || className?.includes('bottom') ? undefined : '10%',
        x: className?.includes('left') || className?.includes('right') ? undefined : '-50%',
        width: size,
        height: size,
        filter: `blur(${blur})`,
        backgroundColor: color,
        animation: 'float 20s ease-in-out infinite' 
      }}
    />
  );
}
