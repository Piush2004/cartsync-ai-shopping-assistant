"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useSpring } from "framer-motion";

export function AnimatedCounter({ 
  value, 
  suffix = "", 
  className = "" 
}: { 
  value: number; 
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(0);
  
  const spring = useSpring(0, {
    stiffness: 40,
    damping: 15,
    mass: 1
  });

  useEffect(() => {
    if (inView) {
      spring.set(value);
    }
  }, [inView, spring, value]);

  useEffect(() => {
    return spring.onChange((latest) => {
      setDisplayValue(Math.floor(latest));
    });
  }, [spring]);

  // Format with commas if large number
  const formattedValue = new Intl.NumberFormat('en-US').format(displayValue);

  return (
    <span ref={ref} className={className}>
      {formattedValue}{suffix}
    </span>
  );
}
