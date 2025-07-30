/**
 * リズムタイミング表示コンポーネント
 * モンスターの攻撃ゲージと判定タイミングを表示
 */

import React from 'react';
import { cn } from '@/utils/cn';
import type { RhythmMonsterState } from '@/types/rhythm';

interface RhythmTimingIndicatorProps {
  monsters: RhythmMonsterState[];
  className?: string;
}

const RhythmTimingIndicator: React.FC<RhythmTimingIndicatorProps> = ({
  monsters,
  className
}) => {
  return (
    <div className={cn('relative', className)}>
      {monsters.map((monster) => (
        <MonsterGauge key={monster.id} monster={monster} />
      ))}
    </div>
  );
};

interface MonsterGaugeProps {
  monster: RhythmMonsterState;
}

const MonsterGauge: React.FC<MonsterGaugeProps> = ({ monster }) => {
  const gaugeWidth = `${monster.gaugeProgress}%`;
  const isNearTiming = monster.gaugeProgress >= 70 && monster.gaugeProgress <= 90;
  const isPerfectTiming = monster.gaugeProgress >= 75 && monster.gaugeProgress <= 85;
  
  return (
    <div className="mb-4 p-2 bg-gray-800/50 rounded-lg">
      {/* モンスター情報 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <i className={`fas ${monster.icon} text-2xl text-purple-400`} />
          <span className="text-white font-bold">{monster.name}</span>
          <span className="text-yellow-300 font-mono text-lg">
            {monster.chordTarget.id}
          </span>
        </div>
        <div className="text-sm text-gray-400">
          HP: {monster.currentHp}/{monster.maxHp}
        </div>
      </div>
      
      {/* ゲージバー */}
      <div className="relative h-8 bg-gray-700 rounded-full overflow-hidden">
        {/* 判定タイミングマーカー (80%地点) */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-20"
          style={{ left: '80%' }}
        >
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 
                          border-l-transparent border-r-transparent border-b-yellow-400" />
          </div>
        </div>
        
        {/* Perfect判定範囲 (75-85%) */}
        <div 
          className="absolute top-0 bottom-0 bg-green-500/20 z-10"
          style={{ left: '75%', width: '10%' }}
        />
        
        {/* Good判定範囲 (60-100%) */}
        <div 
          className="absolute top-0 bottom-0 bg-blue-500/10 z-5"
          style={{ left: '60%', width: '40%' }}
        />
        
        {/* 進行ゲージ */}
        <div 
          className={cn(
            "absolute top-0 bottom-0 left-0 transition-all duration-100",
            "bg-gradient-to-r",
            monster.isDefeated 
              ? "from-gray-600 to-gray-500"
              : isPerfectTiming
              ? "from-green-500 to-green-400"
              : isNearTiming
              ? "from-blue-500 to-blue-400"
              : "from-purple-600 to-purple-500"
          )}
          style={{ width: gaugeWidth }}
        >
          {/* ゲージ先端のエフェクト */}
          {!monster.isDefeated && (
            <div className="absolute right-0 top-0 bottom-0 w-2 
                          bg-white/30 animate-pulse" />
          )}
        </div>
        
        {/* ゲージテキスト */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-bold text-sm",
            monster.isDefeated ? "text-gray-400" : "text-white"
          )}>
            {monster.isDefeated ? "DEFEATED" : `${Math.round(monster.gaugeProgress)}%`}
          </span>
        </div>
      </div>
      
      {/* タイミング表示 */}
      {!monster.isDefeated && isNearTiming && (
        <div className="mt-1 text-center">
          <span className={cn(
            "text-sm font-bold animate-pulse",
            isPerfectTiming ? "text-green-400" : "text-blue-400"
          )}>
            {isPerfectTiming ? "PERFECT!" : "GOOD!"}
          </span>
        </div>
      )}
    </div>
  );
};

export default RhythmTimingIndicator;