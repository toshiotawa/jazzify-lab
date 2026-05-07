/**
 * 魔王城降下マップ用: 仮想カメラフック
 * transform: translate3d(0, -cameraY, 0) でマップを縦に動かす。
 * ブラウザスクロールは使用しない。次ブロック(未解放)は先頭だけチラ見せして下限クランプ。
 * Basic / Songs マップ別のレイアウトを参照する。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { platform } from '@/platform';
import { getBlockLayoutsByCategory, getMapLogicalHeightByCategory } from './descentLayout';
import { getAccessibleBlockIndex } from './descentBlocks';
import { SurvivalMapCategory, DEFAULT_SURVIVAL_MAP_CATEGORY } from '../SurvivalTypes';

interface UseDescentCameraParams {
  viewportHeight: number;
  /** 論理 → 実ピクセル変換係数 */
  scale: number;
  /** 最前線ステージ番号(キャラがいる位置) */
  frontierStageNumber: number;
  clearedStages: ReadonlySet<number>;
  /** 対象マップ */
  mapCategory?: SurvivalMapCategory;
}

interface CameraState {
  cameraY: number;
  maxCameraY: number;
  focusCamera: (logicalY: number) => void;
  adjustCamera: (deltaPx: number) => void;
  setCamera: (valuePx: number) => void;
}

export const useDescentCamera = ({
  viewportHeight,
  scale,
  frontierStageNumber,
  clearedStages,
  mapCategory = DEFAULT_SURVIVAL_MAP_CATEGORY,
}: UseDescentCameraParams): CameraState => {
  const [cameraY, setCameraY] = useState(0);

  const currentRef = useRef(0);
  const targetRef = useRef(0);
  const velocityRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const maxCameraYRef = useRef(0);

  const layouts = getBlockLayoutsByCategory(mapCategory);
  const mapLogicalHeight = getMapLogicalHeightByCategory(mapCategory);
  const accessibleIndex = getAccessibleBlockIndex(frontierStageNumber, clearedStages, mapCategory);
  const accessibleBlock = layouts[accessibleIndex];
  const nextBlock = layouts[accessibleIndex + 1];
  const peekDepth = 180;
  const maxLogicalY = nextBlock
    ? Math.min(nextBlock.startY + peekDepth, mapLogicalHeight)
    : mapLogicalHeight;
  const visibleBottom = Math.max(accessibleBlock?.endY ?? 0, maxLogicalY);
  const maxCameraY = Math.max(0, visibleBottom * scale - viewportHeight);
  maxCameraYRef.current = maxCameraY;

  const focusCamera = useCallback((logicalY: number) => {
    const rawTargetPx = logicalY * scale - viewportHeight * 0.55;
    const clamped = Math.max(0, Math.min(maxCameraYRef.current, rawTargetPx));
    targetRef.current = clamped;
  }, [scale, viewportHeight]);

  const adjustCamera = useCallback((deltaPx: number) => {
    const next = targetRef.current + deltaPx;
    targetRef.current = Math.max(0, Math.min(maxCameraYRef.current, next));
  }, []);

  const setCamera = useCallback((valuePx: number) => {
    targetRef.current = Math.max(0, Math.min(maxCameraYRef.current, valuePx));
  }, []);

  useEffect(() => {
    const animate = (now: number) => {
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
