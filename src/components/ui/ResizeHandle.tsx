import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

interface ResizeHandleProps {
  onResize: (percentage: number) => void;
  initialPercentage?: number;
  minPercentage?: number;
  maxPercentage?: number;
  className?: string;
}

/**
 * ドラッグ可能なリサイズハンドルコンポーネント
 * 60FPS維持のため、requestAnimationFrameを使用して更新を最適化
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  onResize,
  initialPercentage = 30,
  minPercentage = 10,
  maxPercentage = 90,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.userSelect = 'none';
  }, []);

  const updatePosition = useCallback((clientY: number) => {
    if (!containerRef.current) return;

    const parent = containerRef.current.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const relativeY = clientY - parentRect.top;
    const percentage = (relativeY / parentRect.height) * 100;
    
    const clampedPercentage = Math.max(minPercentage, Math.min(maxPercentage, percentage));
    
    // 60FPS維持のため、16ms（約60fps）ごとに更新
    const now = performance.now();
    if (now - lastUpdateRef.current >= 16) {
      onResize(clampedPercentage);
      lastUpdateRef.current = now;
    }
  }, [onResize, minPercentage, maxPercentage]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        updatePosition(e.clientY);
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          updatePosition(e.touches[0].clientY);
        });
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isDragging, updatePosition]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-3 -my-1.5 z-20 cursor-row-resize group',
        className
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* ドラッグ可能エリア（透明で広め） */}
      <div className="absolute inset-x-0 -top-2 -bottom-2" />
      
      {/* 境界線 */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gray-700" />
      
      {/* ハンドル */}
      <div
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-16 h-6 rounded-full',
          'bg-gray-700 border border-gray-600',
          'flex items-center justify-center',
          'transition-all duration-150',
          'hover:bg-gray-600 hover:scale-110',
          'group-hover:shadow-lg',
          isDragging && 'bg-blue-600 border-blue-500 scale-110 shadow-xl'
        )}
      >
        {/* ハンドルアイコン */}
        <div className="flex flex-col gap-0.5">
          <div className="w-6 h-0.5 bg-gray-400 rounded-full" />
          <div className="w-6 h-0.5 bg-gray-400 rounded-full" />
        </div>
      </div>

      {/* ドラッグ中のヒント */}
      {isDragging && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 bg-blue-600 text-white text-xs rounded whitespace-nowrap">
          ドラッグして調整
        </div>
      )}
    </div>
  );
};

export default ResizeHandle;