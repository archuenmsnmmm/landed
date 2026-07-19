import { useEffect, type RefObject } from "react";

/** Click-through overlay: pass clicks to apps below, except over UI zones. */
export function useOverlayClickThrough(
  active: boolean,
  topPanelRef: RefObject<HTMLElement | null>,
  controlBarRef: RefObject<HTMLElement | null>,
  topPanelHidden: boolean,
  /** Keep mouse capture while the ask bar is being dragged / a menu is open. */
  forceCapture = false,
  /** Extra hit zones (e.g. portaled menus outside the control bar). */
  extraZoneRefs: RefObject<HTMLElement | null>[] = [],
) {
  useEffect(() => {
    if (!active) {
      void window.landed?.setIgnoreMouseEvents?.(false);
      return;
    }

    if (forceCapture) {
      void window.landed?.setIgnoreMouseEvents?.(false);
      return;
    }

    void window.landed?.setIgnoreMouseEvents?.(true, { forward: true });

    const isOverZone = (x: number, y: number) => {
      const padding = 16;
      const zones = [
        ...(topPanelHidden ? [controlBarRef] : [topPanelRef, controlBarRef]),
        ...extraZoneRefs,
      ];
      return zones.some((ref) => {
        const el = ref.current;
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return (
          x >= rect.left - padding &&
          x <= rect.right + padding &&
          y >= rect.top - padding &&
          y <= rect.bottom + padding
        );
      });
    };

    let overZone = false;

    const update = (x: number, y: number) => {
      const next = isOverZone(x, y);
      if (next === overZone) return;
      overZone = next;
      void window.landed?.setIgnoreMouseEvents?.(!next, { forward: true });
    };

    const onMove = (e: MouseEvent) => update(e.clientX, e.clientY);
    const onLeave = () => {
      overZone = false;
      void window.landed?.setIgnoreMouseEvents?.(true, { forward: true });
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      void window.landed?.setIgnoreMouseEvents?.(false);
    };
  }, [active, topPanelHidden, topPanelRef, controlBarRef, forceCapture, extraZoneRefs]);
}
