import { useCallback, useRef, useState, type HTMLAttributes } from 'react';

interface UseTapCancelOnDragOptions {
  disabled?: boolean;
}

const DRAG_CANCEL_PX_SQ = 100;

/**
 * ドラッグ開始とみなした距離を超えたら `onTap` を呼ばない。ロール押下の視覚フィードバック用。
 */
export function useTapCancelOnDrag(
  onTap: () => void,
  options: UseTapCancelOnDragOptions = {},
): { pressed: boolean; tapHandlers: HTMLAttributes<HTMLElement> } {
  const { disabled = false } = options;
  const [pressed, setPressed] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const cancelledRef = useRef(false);

  const reset = useCallback(() => {
    setPressed(false);
    startRef.current = null;
    cancelledRef.current = false;
  }, []);

  const tapHandlers: HTMLAttributes<HTMLElement> = {
    onPointerDown: (event) => {
      if (disabled) {
        return;
      }
      cancelledRef.current = false;
      startRef.current = { x: event.clientX, y: event.clientY };
      setPressed(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerMove: (event) => {
      const start = startRef.current;
      if (!start || disabled) {
        return;
      }
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (dx * dx + dy * dy > DRAG_CANCEL_PX_SQ) {
        cancelledRef.current = true;
      }
    },
    onPointerUp: (event) => {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      if (!disabled && !cancelledRef.current && startRef.current) {
        onTap();
      }
      reset();
    },
    onPointerCancel: (event) => {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      reset();
    },
  };

  return { pressed, tapHandlers };
}
