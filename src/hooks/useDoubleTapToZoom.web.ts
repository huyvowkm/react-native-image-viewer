import { useCallback } from "react";

const DOUBLE_TAP_DELAY = 300;
let lastTapTS: number | null = null;

function useDoubleTapToZoom(
  scaled: boolean,
  setScale: (scale: number) => void,
  onZoom: (isZoomed: boolean) => void
) {
  // For web: just toggle scale between 1 and 1.5 on double tap
  const handleDoubleTap = useCallback(() => {
    const nowTS = Date.now();
    if (lastTapTS && nowTS - lastTapTS < DOUBLE_TAP_DELAY) {
      if (!scaled) {
        setScale(1.5);
        onZoom(true);
      } else {
        setScale(1);
        onZoom(false);
      }
    }
    lastTapTS = nowTS;
  }, [scaled, setScale, onZoom]);

  return handleDoubleTap;
}

export default useDoubleTapToZoom;
