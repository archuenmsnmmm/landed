import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

const STORAGE_KEY = "landed.overlayBarPosition";
const EDGE_PAD = 8;
const DRAG_THRESHOLD_PX = 3;
const HOLD_MS = 140;

export type OverlayBarPosition = { x: number; y: number };

function writeStoredPosition(pos: OverlayBarPosition): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

function clearStoredPosition(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function defaultPosition(el: HTMLElement | null): OverlayBarPosition {
  const width = el?.offsetWidth || 560;
  const vw = window.innerWidth;
  return {
    x: Math.max(EDGE_PAD, Math.round((vw - width) / 2)),
    y: 20,
  };
}

function clampPosition(
  x: number,
  y: number,
  el: HTMLElement | null,
): OverlayBarPosition {
  const width = el?.offsetWidth || 320;
  const height = el?.offsetHeight || 56;
  const maxX = Math.max(EDGE_PAD, window.innerWidth - width - EDGE_PAD);
  const maxY = Math.max(EDGE_PAD, window.innerHeight - height - EDGE_PAD);
  return {
    x: Math.min(maxX, Math.max(EDGE_PAD, Math.round(x))),
    y: Math.min(maxY, Math.max(EDGE_PAD, Math.round(y))),
  };
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    "input, textarea, button, a, select, [contenteditable='true'], [data-no-drag]",
  );
}

/**
 * Press-and-hold (or short drag) to reposition the overlay ask bar inside the
 * fullscreen click-through window. Position is CSS-based, not BrowserWindow move.
 */
export function useOverlayBarDrag(barRef: RefObject<HTMLElement | null>) {
  // Always start top-center; drag coords are only kept for the current session.
  const [position, setPosition] = useState<OverlayBarPosition | null>(null);
  const [dragging, setDragging] = useState(false);
  /** True from pointerdown until up — keeps click-through disabled during hold. */
  const [pointerArmed, setPointerArmed] = useState(false);

  const positionRef = useRef(position);
  const draggingRef = useRef(false);
  const holdTimerRef = useRef<number | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    armed: boolean;
    moved: boolean;
  } | null>(null);

  positionRef.current = position;

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current != null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const persist = useCallback((next: OverlayBarPosition) => {
    positionRef.current = next;
    setPosition(next);
    writeStoredPosition(next);
  }, []);

  /** Reset to top-center (used on session launch). */
  const resetToTopCenter = useCallback(() => {
    clearHoldTimer();
    dragStateRef.current = null;
    draggingRef.current = false;
    setDragging(false);
    setPointerArmed(false);
    positionRef.current = null;
    setPosition(null);
    clearStoredPosition();
  }, [clearHoldTimer]);

  const beginDrag = useCallback(() => {
    const state = dragStateRef.current;
    if (!state || state.armed) return;
    state.armed = true;
    draggingRef.current = true;
    setDragging(true);
    void window.landed?.setIgnoreMouseEvents?.(false);
  }, []);

  const endDrag = useCallback(
    (pointerId?: number) => {
      const state = dragStateRef.current;
      clearHoldTimer();
      if (state && pointerId != null && state.pointerId !== pointerId) return;

      if (state && barRef.current) {
        try {
          barRef.current.releasePointerCapture(state.pointerId);
        } catch {
          /* already released */
        }
      }

      dragStateRef.current = null;
      setPointerArmed(false);
      if (draggingRef.current) {
        draggingRef.current = false;
        setDragging(false);
      }
    },
    [barRef, clearHoldTimer],
  );

  const nudge = useCallback(
    (dx: number, dy: number) => {
      const el = barRef.current;
      const base = positionRef.current ?? defaultPosition(el);
      persist(clampPosition(base.x + dx, base.y + dy, el));
    },
    [barRef, persist],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || e.pointerId !== state.pointerId) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;

      if (!state.armed) {
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
          clearHoldTimer();
          beginDrag();
        } else {
          return;
        }
      }

      state.moved = true;
      e.preventDefault();
      const el = barRef.current;
      persist(
        clampPosition(state.originX + dx, state.originY + dy, el),
      );
    };

    const onUp = (e: PointerEvent) => endDrag(e.pointerId);
    const onCancel = (e: PointerEvent) => endDrag(e.pointerId);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      clearHoldTimer();
    };
  }, [barRef, beginDrag, clearHoldTimer, endDrag, persist]);

  // Keep saved position on-screen when the answer panel grows or window resizes.
  useEffect(() => {
    const el = barRef.current;
    if (!el || !positionRef.current) return;

    const reclamp = () => {
      const current = positionRef.current;
      if (!current) return;
      const next = clampPosition(current.x, current.y, barRef.current);
      if (next.x !== current.x || next.y !== current.y) persist(next);
    };

    reclamp();
    const ro = new ResizeObserver(reclamp);
    ro.observe(el);
    window.addEventListener("resize", reclamp);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", reclamp);
    };
  }, [barRef, persist, position]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      if (isInteractiveTarget(e.target)) return;

      const el = barRef.current;
      if (!el) return;

      const origin = positionRef.current ?? defaultPosition(el);
      // Materialize default (centered) into explicit coords on first drag.
      if (!positionRef.current) persist(origin);

      dragStateRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: origin.x,
        originY: origin.y,
        armed: false,
        moved: false,
      };
      setPointerArmed(true);
      void window.landed?.setIgnoreMouseEvents?.(false);
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      clearHoldTimer();
      holdTimerRef.current = window.setTimeout(() => {
        holdTimerRef.current = null;
        const state = dragStateRef.current;
        if (!state || state.pointerId !== e.pointerId) return;
        beginDrag();
      }, HOLD_MS);
    },
    [barRef, beginDrag, clearHoldTimer, persist],
  );

  const style: CSSProperties = position
    ? {
        left: position.x,
        top: position.y,
        transform: "none",
      }
    : {
        left: "50%",
        top: 20,
        transform: "translateX(-50%)",
      };

  return {
    position,
    dragging,
    /** Disable click-through for the whole press/hold/drag gesture. */
    capturing: pointerArmed || dragging,
    style,
    onPointerDown,
    nudge,
    resetToTopCenter,
    isDragging: () => draggingRef.current || dragStateRef.current != null,
  };
}
