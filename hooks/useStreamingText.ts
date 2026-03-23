'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useStreamingText(): {
  text: string;
  isStreaming: boolean;
  startStreaming: (fullText: string, delayMs?: number) => void;
} {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startStreaming = useCallback(
    (fullText: string, delayMs = 40) => {
      cleanup();

      const tokens = fullText.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) {
        setText('');
        return;
      }

      let index = 0;
      setText('');
      setIsStreaming(true);

      const tick = () => {
        index += 1;
        const partial = tokens.slice(0, index).join(' ');
        setText(partial);

        if (index >= tokens.length) {
          setIsStreaming(false);
          timeoutRef.current = null;
          return;
        }

        timeoutRef.current = setTimeout(tick, delayMs);
      };

      timeoutRef.current = setTimeout(tick, delayMs);
    },
    [cleanup],
  );

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { text, isStreaming, startStreaming };
}
