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
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFps(currentFPS);
        frameCount = 0;
        lastTime = currentTime;
        
        // ストアのデバッグ情報も更新
        useGameStore.getState().updateDebugInfo({ fps: currentFPS });
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
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