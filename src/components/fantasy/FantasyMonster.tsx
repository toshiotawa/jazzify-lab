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
  faKhanda,
  faUserSecret,
  faSpider,
  faFish,
  faDog,
  faBiohazard,
  faBug,
  faPaw,
  faHatWizard,
  faCrow,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/utils/cn';

interface FantasyMonsterProps {
  monsterIcon: string;
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
  // ファンタジーモード用の敵アイコンマッピング - より適切なアイコンに変更
  'vampire': faSkull, // バンパイア：頭蓋骨で威圧感を演出
  'monster': faSpider, // モンスター：蜘蛛のまま
  'reaper': faHatWizard, // 死神：魔法使いの帽子で神秘的に
  'kraken': faEye, // クラーケン：目玉で不気味さを演出
  'werewolf': faCrow, // 人狼：カラスで野生感を演出
  'demon': faFire // 悪魔：炎で地獄感を演出
};

// モンスターサイズ設定
const SIZE_CONFIGS = {
  small: {
    monster: 'text-2xl',  // text-4xl から text-2xl に変更
    gauge: 'h-2',
    gaugeBg: 'h-2',
    container: 'p-1'      // p-2 から p-1 に変更
  },
  medium: {
    monster: 'text-3xl',  // text-6xl から text-3xl に変更
    gauge: 'h-2',         // h-3 から h-2 に変更
    gaugeBg: 'h-2',       // h-3 から h-2 に変更
    container: 'p-2'      // p-4 から p-2 に変更
  },
  large: {
    monster: 'text-4xl',  // text-8xl から text-4xl に変更
    gauge: 'h-3',         // h-4 から h-3 に変更
    gaugeBg: 'h-3',       // h-4 から h-3 に変更
    container: 'p-3'      // p-6 から p-3 に変更
  }
};

// モンスター特性（アイコンごとの特殊効果）- 明るい色に変更
const MONSTER_TRAITS: Record<string, { color: string; glowColor: string; specialEffect?: string }> = {
  'ghost': { color: 'text-blue-200', glowColor: 'drop-shadow-md', specialEffect: 'float' },
  'tree': { color: 'text-green-400', glowColor: 'drop-shadow-md', specialEffect: 'sway' },
  'seedling': { color: 'text-green-300', glowColor: 'drop-shadow-md' },
  'droplet': { color: 'text-blue-400', glowColor: 'drop-shadow-md', specialEffect: 'bounce' },
  'sun': { color: 'text-yellow-400', glowColor: 'drop-shadow-md', specialEffect: 'pulse' },
  'rock': { color: 'text-stone-400', glowColor: 'drop-shadow-md' },
  'sparkles': { color: 'text-yellow-300', glowColor: 'drop-shadow-md', specialEffect: 'sparkle' },
  'gem': { color: 'text-cyan-400', glowColor: 'drop-shadow-md', specialEffect: 'shine' },
  'wind_face': { color: 'text-sky-300', glowColor: 'drop-shadow-md', specialEffect: 'float' },
  'zap': { color: 'text-yellow-400', glowColor: 'drop-shadow-md', specialEffect: 'shake' },
  'star2': { color: 'text-yellow-300', glowColor: 'drop-shadow-md', specialEffect: 'twinkle' },
  'dragon': { color: 'text-red-500', glowColor: 'drop-shadow-md' },
  'skull': { color: 'text-red-400', glowColor: 'drop-shadow-md' },
  'fire': { color: 'text-orange-400', glowColor: 'drop-shadow-md' },
  'ice': { color: 'text-cyan-300', glowColor: 'drop-shadow-md' },
  'lightning': { color: 'text-yellow-400', glowColor: 'drop-shadow-md' },
  // ファンタジーモード用の敵特性 - 明るく見やすい色に変更
  'vampire': { color: 'text-red-300', glowColor: 'drop-shadow-lg', specialEffect: 'float' },
  'monster': { color: 'text-purple-300', glowColor: 'drop-shadow-lg', specialEffect: 'pulse' },
  'reaper': { color: 'text-cyan-300', glowColor: 'drop-shadow-lg', specialEffect: 'float' },
  'kraken': { color: 'text-blue-300', glowColor: 'drop-shadow-lg', specialEffect: 'pulse' },
  'werewolf': { color: 'text-amber-300', glowColor: 'drop-shadow-lg', specialEffect: 'shake' },
  'demon': { color: 'text-orange-300', glowColor: 'drop-shadow-lg', specialEffect: 'pulse' }
};

const FantasyMonster: React.FC<FantasyMonsterProps> = ({
  monsterIcon,
  hp,
  maxHp,
  enemyGauge,
  size = 'medium',  // 'large' から 'medium' に変更
  className
}) => {
  const [isFloating, setIsFloating] = useState(false);

  
  const sizeConfig = SIZE_CONFIGS[size];
  const iconDef = MONSTER_ICONS[monsterIcon] || faGhost;
  const traits = MONSTER_TRAITS[monsterIcon] || MONSTER_TRAITS['ghost'];
  

  
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
      <div className="mt-3 w-full relative">
        <div className="flex space-x-1">
          {blocks}
        </div>
        {/* 80%判定タイミングマーカー */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
          style={{ left: '80%' }}
        />
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

          )}
          style={{
            filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.2))'
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

              // グロー効果
              traits.glowColor
            )}
          />
        </div>
        

        
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