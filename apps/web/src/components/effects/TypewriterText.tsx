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
    let doneTimeout: NodeJS.Timeout;

    // Start delay
    const startTimeout = setTimeout(() => {
      setIsTyping(true);
      let i = 0;

      const typeNextChar = () => {
        if (i < text.length) {
          // Slice by a number that is final before React runs the update. The
          // old `(prev) => prev + text.charAt(i)` read `i` later, after it had
          // already been incremented, so the first letter was skipped
          // ("AI-powered" showed as "I-powered").
          i++;
          setDisplayedText(text.slice(0, i));
          timeout = setTimeout(typeNextChar, speed);
        } else {
          setIsTyping(false);
          // Keep cursor blinking a bit then remove
          doneTimeout = setTimeout(() => setIsDone(true), 2000);
        }
      };

      typeNextChar();
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeout);
      clearTimeout(doneTimeout);
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
