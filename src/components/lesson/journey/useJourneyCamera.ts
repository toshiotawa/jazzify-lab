/**
 * レッスンマップ用の仮想カメラフック (上昇型)
 * - 起動時はマップ下端 (スタート側) に配置
 * - 特定の論理 Y をビューポート中央に配置できる focusCamera を提供
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { platform } from '@/platform';

interface UseJourneyCameraParams {
  viewportHeight: number;
  scale: number;
  mapLogicalHeight: number;
}

interface JourneyCameraState {
  cameraY: number;
  maxCameraY: number;
  focusCamera: (logicalY: number) => void;
  adjustCamera: (deltaPx: number) => void;
  setCamera: (valuePx: number) => void;
}

export const useJourneyCamera = ({
  viewportHeight,
  scale,
  mapLogicalHeight,
}: UseJourneyCameraParams): JourneyCameraState => {
  const [cameraY, setCameraY] = useState(0);

  const currentRef = useRef(0);
  const targetRef = useRef(0);
  const velocityRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const maxCameraYRef = useRef(0);

  const totalPx = mapLogicalHeight * scale;
  const maxCameraY = Math.max(0, totalPx - viewportHeight);
  maxCameraYRef.current = maxCameraY;

  const focusCamera = useCallback(
    (logicalY: number) => {
      const rawTargetPx = logicalY * scale - viewportHeight * 0.5;
      const clamped = Math.max(0, Math.min(maxCameraYRef.current, rawTargetPx));
      targetRef.current = clamped;
    },
    [scale, viewportHeight],
  );

  const adjustCamera = useCallback((deltaPx: number) => {
    const next = targetRef.current + deltaPx;
    targetRef.current = Math.max(0, Math.min(maxCameraYRef.current, next));
  }, []);

  const setCamera = useCallback((valuePx: number) => {
    targetRef.current = Math.max(0, Math.min(maxCameraYRef.current, valuePx));
    currentRef.current = targetRef.current;
    velocityRef.current = 0;
    setCameraY(targetRef.current);
  }, []);

  useEffect(() => {
    const animate = (now: number): void => {
      const last = lastTimeRef.current;
      const dt = last == null ? 1 / 60 : Math.min(0.05, (now - last) / 1000);
      lastTimeRef.current = now;
      const current = currentRef.current;
      const target = Math.max(0, Math.min(maxCameraYRef.current, targetRef.current));
      const diff = target - current;
      if (Math.abs(diff) < 0.3 && Math.abs(velocityRef.current) < 0.3) {
        if (current !== target) {
          currentRef.current = target;
          velocityRef.current = 0;
          setCameraY(target);
        }
      } else {
        const stiffness = 120;
        const damping = 22;
        const acc = stiffness * diff - damping * velocityRef.current;
        velocityRef.current += acc * dt;
        currentRef.current += velocityRef.current * dt;
        setCameraY(currentRef.current);
      }
      rafIdRef.current = platform.requestAnimationFrame(animate);
    };
    rafIdRef.current = platform.requestAnimationFrame(animate);
    return () => {
      if (rafIdRef.current !== null) platform.cancelAnimationFrame(rafIdRef.current);
      lastTimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (targetRef.current > maxCameraY) {
      targetRef.current = maxCameraY;
    }
  }, [maxCameraY]);

  return {
    cameraY: Math.max(0, Math.min(maxCameraY, cameraY)),
    maxCameraY,
    focusCamera,
    adjustCamera,
    setCamera,
  };
};
