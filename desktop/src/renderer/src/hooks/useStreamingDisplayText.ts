import { useEffect, useRef, useState } from "react";

const CHAR_MS = 32;

/** Reveals text gradually while streaming; snaps when not streaming. */
export function useStreamingDisplayText(text: string, isStreaming: boolean): string {
  const [display, setDisplay] = useState("");
  const targetRef = useRef(text);
  targetRef.current = text;

  useEffect(() => {
    if (!text) {
      setDisplay("");
      return;
    }

    if (!isStreaming) {
      setDisplay(text);
      return;
    }

    setDisplay((prev) => {
      if (!prev || !text.startsWith(prev.slice(0, Math.min(prev.length, text.length)))) {
        return text.split(/\s+/).slice(0, 1).join(" ") || text.slice(0, 1);
      }
      return prev;
    });
  }, [text, isStreaming]);

  useEffect(() => {
    if (!isStreaming || !text) return;

    const id = window.setInterval(() => {
      setDisplay((prev) => {
        const target = targetRef.current;
        if (!target) return "";
        if (prev === target) return prev;

        if (!target.startsWith(prev) && prev.length > 0) {
          return target.slice(0, 1);
        }

        const words = target.split(/\s+/);
        const prevWords = prev.split(/\s+/).filter(Boolean);

        if (prevWords.length < words.length) {
          return words.slice(0, prevWords.length + 1).join(" ");
        }

        if (prev.length < target.length) {
          return target.slice(0, prev.length + 1);
        }

        return target;
      });
    }, CHAR_MS);

    return () => window.clearInterval(id);
  }, [isStreaming, text]);

  return isStreaming ? display : text;
}
