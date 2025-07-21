/**
 * ファンタジーモンスターコンポーネント
 * モンスターの表示・アニメーション管理
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface FantasyMonsterProps {
  monsterIcon: string;
  isAttacking: boolean;
  hp?: number;
  maxHp?: number;
  enemyGauge: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

// モンスターアイコンマッピング
const MONSTER_ICONS: Record<string, string> = {
  'ghost': '👻',
  'tree': '🌳',
  'seedling': '🌱', 
  'droplet': '💧',
  'sun': '☀️',
  'rock': '🪨',
  'sparkles': '✨',
  'gem': '💎',
  'wind_face': '🌬️',
  'zap': '⚡',
  'star2': '⭐',
  'dragon': '🐉',
  'skull': '💀',
  'fire': '🔥',
  'ice': '🧊',
  'lightning': '⚡'
};

// モンスターサイズ設定
const SIZE_CONFIGS = {
  small: {
    monster: 'text-4xl',
    gauge: 'h-2',
    gaugeBg: 'h-2',
    container: 'p-2'
  },
  medium: {
    monster: 'text-6xl',
    gauge: 'h-3',
    gaugeBg: 'h-3',
    container: 'p-4'
  },
  large: {
    monster: 'text-8xl',
    gauge: 'h-4',
    gaugeBg: 'h-4',
    container: 'p-6'
  }
};

// モンスター特性（アイコンごとの特殊効果）
const MONSTER_TRAITS: Record<string, { color: string; glowColor: string; specialEffect?: string }> = {
  'ghost': { color: 'text-purple-300', glowColor: 'shadow-purple-500', specialEffect: 'float' },
  'tree': { color: 'text-green-400', glowColor: 'shadow-green-500', specialEffect: 'sway' },
  'seedling': { color: 'text-green-300', glowColor: 'shadow-green-400' },
  'droplet': { color: 'text-blue-400', glowColor: 'shadow-blue-500', specialEffect: 'bounce' },
  'sun': { color: 'text-yellow-400', glowColor: 'shadow-yellow-500', specialEffect: 'pulse' },
  'rock': { color: 'text-gray-400', glowColor: 'shadow-gray-500' },
  'sparkles': { color: 'text-yellow-300', glowColor: 'shadow-yellow-400', specialEffect: 'sparkle' },
  'gem': { color: 'text-pink-400', glowColor: 'shadow-pink-500', specialEffect: 'shine' },
  'wind_face': { color: 'text-cyan-300', glowColor: 'shadow-cyan-500', specialEffect: 'float' },
  'zap': { color: 'text-yellow-500', glowColor: 'shadow-yellow-600', specialEffect: 'shake' },
  'star2': { color: 'text-yellow-200', glowColor: 'shadow-yellow-300', specialEffect: 'twinkle' }
};

const FantasyMonster: React.FC<FantasyMonsterProps> = ({
  monsterIcon,
  isAttacking,
  hp,
  maxHp,
  enemyGauge,
  size = 'large',
  className
}) => {
  const [isFloating, setIsFloating] = useState(false);
  const [showRageEffect, setShowRageEffect] = useState(false);
  
  const sizeConfig = SIZE_CONFIGS[size];
  const monsterEmoji = MONSTER_ICONS[monsterIcon] || '👻';
  const traits = MONSTER_TRAITS[monsterIcon] || MONSTER_TRAITS['ghost'];
  
  // 攻撃時のエフェクト
  useEffect(() => {
    if (isAttacking) {
      setShowRageEffect(true);
      const timer = setTimeout(() => {
        setShowRageEffect(false);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [isAttacking]);
  
  // フローティングアニメーション（一部モンスターのアイドル状態）
  useEffect(() => {
    if (traits.specialEffect === 'float') {
      const interval = setInterval(() => {
        setIsFloating(prev => !prev);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [traits.specialEffect]);
  
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
        {/* モンスター本体 */}
        <div
          className={cn(
            "transition-all duration-300 select-none",
            sizeConfig.monster,
            traits.color,
            // 基本アニメーション
            traits.specialEffect === 'float' && isFloating && "transform -translate-y-2",
            traits.specialEffect === 'bounce' && "animate-bounce",
            traits.specialEffect === 'pulse' && "animate-pulse",
            traits.specialEffect === 'shake' && "animate-pulse",
            traits.specialEffect === 'sparkle' && "animate-pulse",
            traits.specialEffect === 'shine' && "animate-pulse",
            traits.specialEffect === 'twinkle' && "animate-ping",
            traits.specialEffect === 'sway' && "hover:animate-pulse",
            // 攻撃時のエフェクト
            isAttacking && "transform scale-125 text-red-500",
            // グロー効果
            !isAttacking && `drop-shadow-lg`,
            // 攻撃時の追加エフェクト
            showRageEffect && "animate-bounce"
          )}
          style={{
            filter: isAttacking 
              ? 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.8))' 
              : `drop-shadow(0 0 10px ${traits.color.includes('purple') ? 'rgba(147, 51, 234, 0.5)' : 'rgba(255, 255, 255, 0.2)'})`
          }}
        >
          {monsterEmoji}
        </div>
        
        {/* 怒りマーク（攻撃時） */}
        {showRageEffect && (
          <div className="absolute -top-4 -right-4 text-red-500 text-2xl animate-bounce z-10">
            💢
          </div>
        )}
        
        {/* 特殊エフェクトオーバーレイ */}
        {traits.specialEffect === 'sparkle' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-yellow-300 text-sm animate-ping opacity-50">✨</div>
          </div>
        )}
        
        {traits.specialEffect === 'shine' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-white text-xs animate-pulse opacity-30">💫</div>
          </div>
        )}
      </div>
      
      {/* 敵の行動ゲージ */}
      {renderEnemyGauge()}
      
      {/* HPバー（オプション） */}
      {renderHpBar()}
      
      {/* モンスター名/タイプ表示（デバッグ用） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-400">
          {monsterIcon} | ゲージ: {enemyGauge.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

export default FantasyMonster;