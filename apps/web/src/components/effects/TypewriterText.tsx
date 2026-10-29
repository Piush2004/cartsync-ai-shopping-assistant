"use client";

import { useState, useEffect } from "react";

export function TypewriterText({ 
  text, 
  speed = 50, 
  delay = 0,
  className = ""
}: { 
  text: string; 
  speed?: number; 
  delay?: number;
  className?: string;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    // Start delay
    const startTimeout = setTimeout(() => {
      setIsTyping(true);
      let i = 0;
      
      const typeNextChar = () => {
        if (i < text.length) {
          setDisplayedText((prev) => prev + text.charAt(i));
          i++;
          timeout = setTimeout(typeNextChar, speed);
        } else {
          setIsTyping(false);
          // Keep cursor blinking a bit then remove
          setTimeout(() => setIsDone(true), 2000);
        }
      };
      
      typeNextChar();
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeout);
    };
  }, [text, speed, delay]);

  return (
    <span className={className}>
      {displayedText}
      {!isDone && (
        <span className={`inline-block w-[2px] h-[1em] ml-1 bg-current align-middle ${isTyping ? '' : 'animate-pulse'}`}></span>
      )}
    </span>
  );
}
