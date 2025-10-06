import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export function useTypewriter({ text, speed = 30, onComplete }: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Reset when text changes
    indexRef.current = 0;
    setDisplayedText('');
    setIsTyping(true);

    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current++;
        timerRef.current = setTimeout(typeNextChar, speed);
      } else {
        setIsTyping(false);
        onComplete?.();
      }
    };

    timerRef.current = setTimeout(typeNextChar, speed);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [text, speed, onComplete]);

  const skipAnimation = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setDisplayedText(text);
    setIsTyping(false);
    onComplete?.();
  };

  return { displayedText, isTyping, skipAnimation };
}
