import { useEffect, useRef } from "react";

export function useWindowResize(
  ref: React.RefObject<HTMLElement | null>,
  enabled = true,
  deps: unknown[] = [],
) {
  const lastSize = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const el = ref.current;

    const measure = () => {
      const roundedW = Math.ceil(el.offsetWidth);
      const roundedH = Math.ceil(el.offsetHeight);

      if (
        roundedW === lastSize.current.width &&
        roundedH === lastSize.current.height
      ) {
        return;
      }

      lastSize.current = { width: roundedW, height: roundedH };
      void window.landed?.resize(roundedW, roundedH).then(() => {
        window.landed?.ready?.();
      });
    };

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(el);
    measure();

    const raf = requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, 220);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, enabled, ...deps]);
}
