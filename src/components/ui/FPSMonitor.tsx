/**
 * FPSモニターコンポーネント
 * パフォーマンス監視用のFPS表示（プロダクション環境では無効）
 */

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';

interface FPSMonitorProps {
  /** ミニマル表示モード */
  minimal?: boolean;
  /** 追加のCSSクラス */
  className?: string;
}

const FPSMonitor: React.FC<FPSMonitorProps> = ({ 
  minimal = false, 
  className 
}) => {
  // プロダクション環境では何も表示しない
  if (import.meta.env.PROD) {
    return null;
  }

  const [fps, setFps] = useState(60);
  const debug = useGameStore((state) => state.debug);
  
  useEffect(() => {
    const updateFPSFromPerformanceMonitor = () => {
      if (window.performanceMonitor) {
        const currentFPS = window.performanceMonitor.getFPS();
        setFps(currentFPS);
        
        // ストアのデバッグ情報も更新
        useGameStore.getState().updateDebugInfo({ fps: currentFPS });
      }
    };
    
    // 1秒間隔で更新（競合しない軽量な方式）
    const intervalId = setInterval(updateFPSFromPerformanceMonitor, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  if (minimal) {
    return (
      <div className={cn(
        "bg-black bg-opacity-60 text-green-400 px-2 py-1 rounded text-xs font-mono",
        className
      )}>
        FPS: {fps}
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-black bg-opacity-70 text-green-400 px-3 py-2 rounded text-sm font-mono space-y-1",
      className
    )}>
      <div>FPS: {fps}</div>
      <div>Render: {debug.renderTime.toFixed(1)}ms</div>
      {debug.audioLatency > 0 && (
        <div>Audio: {debug.audioLatency.toFixed(1)}ms</div>
      )}
    </div>
  );
};

export default FPSMonitor; 