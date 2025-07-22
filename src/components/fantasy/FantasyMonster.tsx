/**
 * ファンタジーモンスターコンポーネント
 * モンスターの表示・アニメーション管理
 */

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGhost,
  faTree, 
  faSeedling,
  faTint,
  faSun,
  faCube,
  faStar,
  faGem,
  faWind,
  faBolt,
  faDragon,
  faSkull,
  faFire,
  faSnowflake,
  faSpider,
  faKhanda,
  faMask,
  faEye,
  faHatWizard,
  faBug
} from '@fortawesome/free-solid-svg-icons';
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

// モンスターアイコンマッピング（FontAwesome）
const MONSTER_ICONS: Record<string, any> = {
  'ghost': faGhost,
  'tree': faTree,
  'seedling': faSeedling, 
  'droplet': faTint,
  'sun': faSun,
  'rock': faCube,
  'sparkles': faStar,
  'gem': faGem,
  'wind_face': faWind,
  'zap': faBolt,
  'star2': faStar,
  'dragon': faDragon,
  'skull': faSkull,
  'fire': faFire,
  'ice': faSnowflake,
  'lightning': faBolt,
  // ファンタジーモード用の敵アイコンマッピング
  'vampire': faEye,
  'monster': faBug,
  'reaper': faSkull,
  'kraken': faSpider,
  'werewolf': faMask,
  'demon': faHatWizard
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

// モンスター特性（アイコンごとの特殊効果）- 単色設定
const MONSTER_TRAITS: Record<string, { color: string; glowColor: string; specialEffect?: string }> = {
  'ghost': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'float' },
  'tree': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'sway' },
  'seedling': { color: 'text-gray-300', glowColor: 'drop-shadow-md' },
  'droplet': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'bounce' },
  'sun': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'pulse' },
  'rock': { color: 'text-gray-300', glowColor: 'drop-shadow-md' },
  'sparkles': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'sparkle' },
  'gem': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'shine' },
  'wind_face': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'float' },
  'zap': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'shake' },
  'star2': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'twinkle' },
  'dragon': { color: 'text-gray-300', glowColor: 'drop-shadow-md' },
  'skull': { color: 'text-gray-300', glowColor: 'drop-shadow-md' },
  'fire': { color: 'text-gray-300', glowColor: 'drop-shadow-md' },
  'ice': { color: 'text-gray-300', glowColor: 'drop-shadow-md' },
  'lightning': { color: 'text-gray-300', glowColor: 'drop-shadow-md' },
  // ファンタジーモード用の敵特性
  'vampire': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'float' },
  'monster': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'pulse' },
  'reaper': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'float' },
  'kraken': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'pulse' },
  'werewolf': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'shake' },
  'demon': { color: 'text-gray-300', glowColor: 'drop-shadow-md', specialEffect: 'pulse' }
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
  const iconDef = MONSTER_ICONS[monsterIcon] || faGhost;
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
            "inline-block",
            // 攻撃時の追加エフェクト
            showRageEffect && "animate-bounce"
          )}
          style={{
            filter: isAttacking 
              ? 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.8))' 
              : 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))'
          }}
        >
          <FontAwesomeIcon
            icon={iconDef}
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
              !isAttacking && traits.glowColor
            )}
          />
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