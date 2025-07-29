/**
 * リズムモード用タイミングマーカー
 * ゲージの80%地点にマーカーを表示し、タイミング判定の視覚的フィードバックを提供
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { GAUGE_MARKER_PERCENT } from '@/utils/rhythmGameLogic';

interface RhythmTimingMarkerProps {
  gaugePercent: number;
  isActive: boolean;
  lastJudgment?: 'perfect' | 'good' | 'early' | 'late' | 'miss';
  onAnimationEnd?: () => void;
}

export const RhythmTimingMarker: React.FC<RhythmTimingMarkerProps> = ({
  gaugePercent,
  isActive,
  lastJudgment,
  onAnimationEnd
}) => {
  const markerRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // 判定フィードバックのアニメーション
  useEffect(() => {
    if (lastJudgment && feedbackRef.current) {
      // アニメーションをリセット
      feedbackRef.current.style.animation = 'none';
      void feedbackRef.current.offsetHeight; // リフローを強制
      
      // アニメーションを開始
      feedbackRef.current.style.animation = 'judgmentFeedback 0.5s ease-out';
      
      const timer = setTimeout(() => {
        if (onAnimationEnd) {
          onAnimationEnd();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [lastJudgment, onAnimationEnd]);

  // 判定結果の色とテキスト
  const getJudgmentStyle = () => {
    switch (lastJudgment) {
      case 'perfect':
        return { color: 'text-yellow-400', text: 'PERFECT!' };
      case 'good':
        return { color: 'text-green-400', text: 'GOOD!' };
      case 'early':
        return { color: 'text-blue-400', text: 'EARLY' };
      case 'late':
        return { color: 'text-orange-400', text: 'LATE' };
      case 'miss':
        return { color: 'text-red-400', text: 'MISS' };
      default:
        return { color: '', text: '' };
    }
  };

  const judgmentStyle = getJudgmentStyle();

  return (
    <>
      {/* マーカーライン（80%地点） */}
      <div
        ref={markerRef}
        className={cn(
          "absolute top-0 bottom-0 w-1 transition-all duration-150",
          isActive ? "bg-yellow-400 shadow-glow" : "bg-white bg-opacity-50"
        )}
        style={{
          left: `${GAUGE_MARKER_PERCENT}%`,
          boxShadow: isActive ? '0 0 10px rgba(251, 191, 36, 0.8)' : 'none'
        }}
      >
        {/* マーカーの装飾 */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <div className={cn(
            "w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px]",
            isActive ? "border-b-yellow-400" : "border-b-white border-opacity-50"
          )} />
        </div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className={cn(
            "w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]",
            isActive ? "border-t-yellow-400" : "border-t-white border-opacity-50"
          )} />
        </div>
      </div>

      {/* 判定フィードバック */}
      {lastJudgment && (
        <div
          ref={feedbackRef}
          className={cn(
            "absolute top-1/2 transform -translate-y-1/2 font-bold text-2xl pointer-events-none",
            judgmentStyle.color
          )}
          style={{
            left: `${GAUGE_MARKER_PERCENT}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {judgmentStyle.text}
        </div>
      )}

      {/* 現在のゲージ位置インジケーター */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-blue-400 transition-all duration-100"
        style={{
          left: `${gaugePercent}%`,
          opacity: Math.abs(gaugePercent - GAUGE_MARKER_PERCENT) < 20 ? 0.8 : 0.3
        }}
      />

      {/* CSS アニメーション */}
      <style jsx>{`
        @keyframes judgmentFeedback {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -100%) scale(1);
            opacity: 0;
          }
        }

        .shadow-glow {
          filter: drop-shadow(0 0 8px currentColor);
        }
      `}</style>
    </>
  );
};

// ゲージコンテナコンポーネント
interface RhythmGaugeContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const RhythmGaugeContainer: React.FC<RhythmGaugeContainerProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn(
      "relative w-full h-12 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600",
      className
    )}>
      {/* 背景のグリッド（拍子を視覚化） */}
      <div className="absolute inset-0 flex">
        {[0, 25, 50, 75].map((percent) => (
          <div
            key={percent}
            className="absolute top-0 bottom-0 w-px bg-gray-700"
            style={{ left: `${percent}%` }}
          />
        ))}
      </div>
      
      {children}
    </div>
  );
};