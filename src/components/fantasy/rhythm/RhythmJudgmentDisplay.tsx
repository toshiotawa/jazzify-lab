/**
 * リズム判定結果表示コンポーネント
 * Perfect/Good/Missの判定結果とコンボ数を表示
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import type { JudgmentType } from '@/types/rhythm';

interface JudgmentResult {
  id: string;
  type: JudgmentType;
  timestamp: number;
}

interface RhythmJudgmentDisplayProps {
  combo: number;
  maxCombo: number;
  perfectHits: number;
  goodHits: number;
  missHits: number;
  score: number;
  onJudgment?: (type: JudgmentType) => void;
  className?: string;
}

const RhythmJudgmentDisplay: React.FC<RhythmJudgmentDisplayProps> = ({
  combo,
  maxCombo,
  perfectHits,
  goodHits,
  missHits,
  score,
  onJudgment,
  className
}) => {
  const [judgments, setJudgments] = useState<JudgmentResult[]>([]);
  
  // 判定結果の追加（外部から呼び出し可能にする場合）
  useEffect(() => {
    if (onJudgment) {
      const handleJudgment = (type: JudgmentType) => {
        const newJudgment: JudgmentResult = {
          id: `judgment-${Date.now()}`,
          type,
          timestamp: Date.now()
        };
        setJudgments(prev => [...prev.slice(-4), newJudgment]);
      };
      
      // イベントリスナーの登録など（必要に応じて）
    }
  }, [onJudgment]);
  
  // 古い判定結果の削除
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setJudgments(prev => prev.filter(j => now - j.timestamp < 2000));
    }, 100);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className={cn('relative', className)}>
      {/* スコア表示 */}
      <div className="bg-gray-800/80 rounded-lg p-4 mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">
            SCORE: {score.toLocaleString()}
          </div>
          
          {/* コンボ表示 */}
          <div className={cn(
            "text-2xl font-bold transition-all",
            combo > 0 ? "text-yellow-400" : "text-gray-500"
          )}>
            {combo > 0 && (
              <>
                <span className="text-4xl">{combo}</span>
                <span className="text-xl ml-1">COMBO</span>
              </>
            )}
          </div>
          
          {/* 最大コンボ */}
          {maxCombo > 0 && (
            <div className="text-sm text-gray-400 mt-1">
              MAX COMBO: {maxCombo}
            </div>
          )}
        </div>
      </div>
      
      {/* 判定結果統計 */}
      <div className="bg-gray-800/80 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">{perfectHits}</div>
            <div className="text-sm text-gray-400">PERFECT</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{goodHits}</div>
            <div className="text-sm text-gray-400">GOOD</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">{missHits}</div>
            <div className="text-sm text-gray-400">MISS</div>
          </div>
        </div>
      </div>
      
      {/* 判定結果アニメーション */}
      <div className="absolute inset-0 pointer-events-none">
        {judgments.map((judgment) => (
          <JudgmentAnimation
            key={judgment.id}
            type={judgment.type}
            timestamp={judgment.timestamp}
          />
        ))}
      </div>
    </div>
  );
};

interface JudgmentAnimationProps {
  type: JudgmentType;
  timestamp: number;
}

const JudgmentAnimation: React.FC<JudgmentAnimationProps> = ({ type, timestamp }) => {
  const age = Date.now() - timestamp;
  const opacity = Math.max(0, 1 - age / 2000);
  const scale = 1 + age / 1000;
  const y = -age / 10;
  
  const judgmentConfig = {
    perfect: {
      text: 'PERFECT!',
      color: 'text-green-400',
      glow: 'drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]'
    },
    good: {
      text: 'GOOD!',
      color: 'text-blue-400',
      glow: 'drop-shadow-[0_0_15px_rgba(96,165,250,0.6)]'
    },
    miss: {
      text: 'MISS',
      color: 'text-red-400',
      glow: 'drop-shadow-[0_0_10px_rgba(248,113,113,0.4)]'
    }
  };
  
  const config = judgmentConfig[type];
  
  return (
    <div
      className={cn(
        "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "font-bold text-4xl",
        config.color,
        config.glow,
        "transition-none"
      )}
      style={{
        opacity,
        transform: `translate(-50%, calc(-50% + ${y}px)) scale(${scale})`,
      }}
    >
      {config.text}
    </div>
  );
};

// 外部から判定結果を追加するためのヘルパー関数
export const addJudgment = (
  setJudgments: React.Dispatch<React.SetStateAction<JudgmentResult[]>>,
  type: JudgmentType
) => {
  const newJudgment: JudgmentResult = {
    id: `judgment-${Date.now()}-${Math.random()}`,
    type,
    timestamp: Date.now()
  };
  setJudgments(prev => [...prev.slice(-4), newJudgment]);
};

export default RhythmJudgmentDisplay;