/**
 * EnemyGaugeMarker - 敵攻撃ゲージの80%地点にタイミングマーカーを表示
 */

import React from 'react';
import type { RhythmEnemy } from '@/types';

interface EnemyGaugeMarkerProps {
  enemy: RhythmEnemy;
  className?: string;
}

export const EnemyGaugeMarker: React.FC<EnemyGaugeMarkerProps> = ({
  enemy,
  className = '',
}) => {
  const isActive = enemy.isActive && enemy.assignedChord;
  const progress = Math.min(100, Math.max(0, enemy.attackProgress * 100));
  const markerPosition = 80; // 80%の位置
  
  return (
    <div className={`enemy-gauge-container relative ${className}`}>
      {/* ゲージの背景 */}
      <div className="gauge-background bg-gray-300 rounded-full h-4 w-full relative overflow-hidden">
        {/* 攻撃ゲージ */}
        <div 
          className={`gauge-fill h-full transition-all duration-100 ${
            isActive ? 'bg-red-500' : 'bg-gray-400'
          }`}
          style={{ width: `${progress}%` }}
        />
        
        {/* 80%マーカー - 判定タイミング表示 */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-yellow-400 border-l-2 border-yellow-600 z-10"
          style={{ left: `${markerPosition}%` }}
        >
          {/* マーカーの輝き効果 */}
          <div className="absolute -top-1 -bottom-1 w-2 -left-0.5 bg-yellow-300 opacity-60 animate-pulse" />
        </div>
        
        {/* タイミングインジケーター */}
        {isActive && (
          <>
            {/* 判定ウィンドウの表示 */}
            <div 
              className="absolute top-0 bottom-0 bg-green-200 opacity-40"
              style={{ 
                left: `${Math.max(0, markerPosition - 5)}%`,
                width: '10%' // ±5%の判定ウィンドウ
              }}
            />
            
            {/* パーフェクトタイミングの線 */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-20"
              style={{ left: `${markerPosition}%` }}
            />
          </>
        )}
      </div>
      
      {/* コード表示 */}
      {isActive && enemy.assignedChord && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold shadow-lg">
            {enemy.assignedChord}
          </div>
          {/* 矢印 */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-600" />
        </div>
      )}
      
      {/* HP表示 */}
      <div className="flex justify-between items-center mt-1 text-xs">
        <span className="text-gray-600">HP: {enemy.hp}/{enemy.maxHp}</span>
        <span className="text-gray-600">Pos: {String.fromCharCode(65 + enemy.position)}</span>
      </div>
    </div>
  );
};

export default EnemyGaugeMarker;