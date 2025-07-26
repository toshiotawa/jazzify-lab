/**
 * ファンタジーモンスターコンポーネント
 * モンスターの表示・アニメーション管理
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface FantasyMonsterProps {
  monsterIcon: string;
  hp?: number;
  maxHp?: number;
  enemyGauge: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

// モンスターサイズ設定
const SIZE_CONFIGS = {
  small: {
    monster: 'w-16 h-16',  // 小サイズ
    gauge: 'h-2',
    gaugeBg: 'h-2',
    container: 'p-1'
  },
  medium: {
    monster: 'w-24 h-24',  // 中サイズ
    gauge: 'h-2',
    gaugeBg: 'h-2',
    container: 'p-2'
  },
  large: {
    monster: 'w-32 h-32',  // 大サイズ
    gauge: 'h-3',
    gaugeBg: 'h-3',
    container: 'p-3'
  }
};

const FantasyMonster: React.FC<FantasyMonsterProps> = ({
  monsterIcon,
  hp,
  maxHp,
  enemyGauge,
  size = 'medium',
  className
}) => {
  const [isFloating, setIsFloating] = useState(false);
  const [imageError, setImageError] = useState(false);

  const sizeConfig = SIZE_CONFIGS[size];
  
  // フローティングアニメーション
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFloating(prev => !prev);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // 画像パスの生成
  const getImagePath = () => {
    // monsterIconがmonster_01〜monster_63の形式の場合
    if (monsterIcon.startsWith('monster_')) {
      return `/monster_icons/${monsterIcon}.png`;
    }
    // 互換性のため、古い形式も一応サポート
    return `/monster_icons/monster_01.png`; // デフォルト画像
  };
  
  // 敵ゲージのレンダリング
  const renderEnemyGauge = () => {
    const filledBlocks = Math.floor(enemyGauge / 10);
    const blocks = [];
    
    for (let i = 0; i < 10; i++) {
      blocks.push(
        <div
          key={i}
          className={cn(
            "flex-1 border border-gray-600 transition-all duration-100",
            sizeConfig.gauge,
            i < filledBlocks ? "bg-red-500" : "bg-gray-700"
          )}
        />
      );
    }
    
    return (
      <div className="mt-3 w-full">
        <div className="flex space-x-1">
          {blocks}
        </div>
        <div className="text-center text-xs text-gray-300 mt-1">
          行動ゲージ
        </div>
      </div>
    );
  };
  
  // HPバーのレンダリング（オプション）
  const renderHpBar = () => {
    if (!hp || !maxHp) return null;
    
    const hpPercentage = (hp / maxHp) * 100;
    
    return (
      <div className="mt-2 w-full">
        <div className={cn("bg-gray-700 rounded-full overflow-hidden", sizeConfig.gaugeBg)}>
          <div
            className="bg-red-500 transition-all duration-300 h-full"
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
        <div className="text-center text-xs text-gray-300 mt-1">
          HP: {hp}/{maxHp}
        </div>
      </div>
    );
  };
  
  return (
    <div className={cn("text-center relative", sizeConfig.container, className)}>
      {/* メインモンスター */}
      <div className="relative inline-block">
        {/* モンスター画像 */}
        <div 
          className={cn(
            "inline-block relative",
            isFloating && "transform -translate-y-2",
            "transition-transform duration-1000"
          )}
        >
          {!imageError ? (
            <img
              src={getImagePath()}
              alt="Monster"
              className={cn(
                "object-contain",
                sizeConfig.monster,
                "drop-shadow-lg"
              )}
              onError={() => setImageError(true)}
            />
          ) : (
            // エラー時のフォールバック
            <div className={cn(
              "bg-gray-600 rounded-full flex items-center justify-center",
              sizeConfig.monster
            )}>
              <span className="text-gray-400 text-2xl">?</span>
            </div>
          )}
        </div>
      </div>
      
      {/* 敵の行動ゲージ */}
      {renderEnemyGauge()}
      
      {/* HPバー（オプション） */}
      {renderHpBar()}
      
      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400">
          {monsterIcon} | ゲージ: {enemyGauge.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

export default FantasyMonster;