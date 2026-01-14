/**
 * ファンタジーエフェクトコンポーネント
 * PIXI.jsベースのエフェクト管理
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/utils/cn';

// ===== 型定義 =====

interface MagicCircle {
  id: string;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'success' | 'failure';
}

interface MonsterAnimation {
  id: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'idle' | 'attack' | 'damage';
}

interface MagicText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface DamageText {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FantasyEffectsProps {
  width: number;
  height: number;
  onEffectComplete?: (effectId: string) => void;
  className?: string;
}

interface FantasyEffectsRef {
  triggerMagicCircle: (x: number, y: number, type: 'success' | 'failure') => string;
  triggerScreenShake: (intensity: number, duration: number) => void;
  triggerMonsterAnimation: (x: number, y: number, type: 'idle' | 'attack' | 'damage') => string;
  triggerMagicText: (x: number, y: number, text: string, color?: string) => string;
  triggerDamageText: (x: number, y: number, damage: number, isCritical?: boolean) => string;
  clearAllEffects: () => void;
}

// ===== エフェクト設定 =====

const EFFECT_CONFIGS = {
  magicCircle: {
    success: {
      color: '#FFD700', // ゴールド
      glowColor: '#FFA500',
      duration: 2000,
      maxRadius: 120
    },
    failure: {
      color: '#FF6B6B', // レッド
      glowColor: '#FF4757',
      duration: 1000,
      maxRadius: 80
    }
  },
  monsterAnimation: {
    idle: {
      duration: 2000,
      scaleRange: 0.1,
      rotationRange: 0.05
    },
    attack: {
      duration: 800,
      scaleRange: 0.3,
      rotationRange: 0.1
    },
    damage: {
      duration: 600,
      scaleRange: 0.2,
      rotationRange: 0.15
    }
  },
  magicText: {
    duration: 500,
    fontSize: 14,
    strokeColor: '#000000',
    strokeThickness: 2
  },
  damageText: {
    duration: 1000,
    fontSize: 28,
    strokeColor: '#ffffff',
    strokeThickness: 4
  }
};

// ===== CSSベースのエフェクト実装 =====

const FantasyEffects = React.forwardRef<FantasyEffectsRef, FantasyEffectsProps>(({
  width,
  height,
  onEffectComplete,
  className
}, ref) => {
  // 状態管理
  const [magicCircles, setMagicCircles] = useState<MagicCircle[]>([]);
  const [monsterAnimations, setMonsterAnimations] = useState<MonsterAnimation[]>([]);
  const [magicTexts, setMagicTexts] = useState<MagicText[]>([]);
  const [damageTexts, setDamageTexts] = useState<DamageText[]>([]);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  // 魔法陣エフェクトの生成
  const triggerMagicCircle = useCallback((x: number, y: number, type: 'success' | 'failure'): string => {
    const id = `magic_circle_${Date.now()}_${Math.random()}`;
    const config = EFFECT_CONFIGS.magicCircle[type];
    
    const newCircle: MagicCircle = {
      id,
      x,
      y,
      radius: 0,
      rotation: 0,
      alpha: 1,
      life: config.duration,
      maxLife: config.duration,
      type
    };
    
    setMagicCircles(prev => [...prev, newCircle]);
    
    // 完了コールバック
    setTimeout(() => {
      onEffectComplete?.(id);
    }, config.duration);
    
    return id;
  }, [onEffectComplete]);
  
  // モンスターアニメーションの生成
  const triggerMonsterAnimation = useCallback((
    x: number, 
    y: number, 
    type: 'idle' | 'attack' | 'damage'
  ): string => {
    const id = `monster_animation_${Date.now()}_${Math.random()}`;
    const config = EFFECT_CONFIGS.monsterAnimation[type];
    
    const newAnimation: MonsterAnimation = {
      id,
      x,
      y,
      scale: 1,
      rotation: 0,
      alpha: 1,
      life: config.duration,
      maxLife: config.duration,
      type
    };
    
    setMonsterAnimations(prev => [...prev, newAnimation]);
    
    // 完了コールバック
    setTimeout(() => {
      onEffectComplete?.(id);
    }, config.duration);
    
    return id;
  }, [onEffectComplete]);
  
  // 魔法名テキストの生成
  const triggerMagicText = useCallback((
    x: number, 
    y: number, 
    text: string, 
    color: string = '#ffffff'
  ): string => {
    const id = `magic_text_${Date.now()}_${Math.random()}`;
    const config = EFFECT_CONFIGS.magicText;
    
    const newText: MagicText = {
      id,
      x,
      y,
      text,
      color,
      alpha: 1,
      life: config.duration,
      maxLife: config.duration
    };
    
    setMagicTexts(prev => [...prev, newText]);
    
    // 完了コールバック
    setTimeout(() => {
      onEffectComplete?.(id);
    }, config.duration);
    
    return id;
  }, [onEffectComplete]);
  
  // ダメージテキストの生成
  const triggerDamageText = useCallback((
    x: number, 
    y: number, 
    damage: number, 
    isCritical: boolean = false
  ): string => {
    const id = `damage_text_${Date.now()}_${Math.random()}`;
    const config = EFFECT_CONFIGS.damageText;
    
    const newText: DamageText = {
      id,
      x,
      y,
      value: damage,
      color: isCritical ? '#FF0000' : '#FF6B6B',
      alpha: 1,
      life: config.duration,
      maxLife: config.duration
    };
    
    setDamageTexts(prev => [...prev, newText]);
    
    // 完了コールバック
    setTimeout(() => {
      onEffectComplete?.(id);
    }, config.duration);
    
    return id;
  }, [onEffectComplete]);
  
  // 画面振動エフェクト
  const triggerScreenShake = useCallback((intensity: number, duration: number) => {
    setShakeIntensity(intensity);
    setIsScreenShaking(true);
    
    setTimeout(() => {
      setIsScreenShaking(false);
      setShakeIntensity(0);
    }, duration);
  }, []);
  
  // 全エフェクトのクリア
  const clearAllEffects = useCallback(() => {
    setMagicCircles([]);
    setMonsterAnimations([]);
    setMagicTexts([]);
    setDamageTexts([]);
    setIsScreenShaking(false);
    setShakeIntensity(0);
  }, []);
  
  // ref公開
  React.useImperativeHandle(ref, () => ({
    triggerMagicCircle,
    triggerScreenShake,
    triggerMonsterAnimation,
    triggerMagicText,
    triggerDamageText,
    clearAllEffects
  }));
  
  // 🚀 アクティブなエフェクトがあるかどうかをチェック
  const hasActiveEffects = magicCircles.length > 0 || 
    monsterAnimations.length > 0 || 
    magicTexts.length > 0 || 
    damageTexts.length > 0 ||
    isScreenShaking;

  // アニメーションループ（エフェクトがある時のみ実行）
  const animate = useCallback((currentTime: number) => {
    const deltaTime = Math.min(currentTime - lastTimeRef.current, 50); // 最大50msに制限
    lastTimeRef.current = currentTime;
    
    let hasRemainingEffects = false;
    
    // 魔法陣の更新
    setMagicCircles(prev => {
      if (prev.length === 0) return prev;
      const updated = prev
        .map(circle => {
          const config = EFFECT_CONFIGS.magicCircle[circle.type];
          const progress = 1 - (circle.life / circle.maxLife);
          
          return {
            ...circle,
            life: circle.life - deltaTime,
            radius: config.maxRadius * Math.sin(progress * Math.PI),
            rotation: circle.rotation + deltaTime * 0.003,
            alpha: Math.sin(progress * Math.PI) * 0.8
          };
        })
        .filter(circle => circle.life > 0);
      if (updated.length > 0) hasRemainingEffects = true;
      return updated;
    });
    
    // モンスターアニメーションの更新
    setMonsterAnimations(prev => {
      if (prev.length === 0) return prev;
      const updated = prev
        .map(animation => {
          const config = EFFECT_CONFIGS.monsterAnimation[animation.type];
          const progress = 1 - (animation.life / animation.maxLife);
          
          let scale = 1;
          let rotation = 0;
          
          switch (animation.type) {
            case 'idle':
              scale = 1 + Math.sin(progress * Math.PI * 4) * config.scaleRange;
              rotation = Math.sin(progress * Math.PI * 2) * config.rotationRange;
              break;
            case 'attack':
              scale = 1 + Math.sin(progress * Math.PI) * config.scaleRange;
              rotation = Math.sin(progress * Math.PI) * config.rotationRange;
              break;
            case 'damage':
              scale = 1 + Math.sin(progress * Math.PI * 3) * config.scaleRange;
              rotation = Math.sin(progress * Math.PI * 6) * config.rotationRange;
              break;
          }
          
          return {
            ...animation,
            life: animation.life - deltaTime,
            scale,
            rotation,
            alpha: Math.sin(progress * Math.PI) * 0.8
          };
        })
        .filter(animation => animation.life > 0);
      if (updated.length > 0) hasRemainingEffects = true;
      return updated;
    });
    
    // 魔法テキストの更新
    setMagicTexts(prev => {
      if (prev.length === 0) return prev;
      const updated = prev
        .map(text => ({
          ...text,
          life: text.life - deltaTime,
          alpha: text.life / text.maxLife,
          y: text.y - deltaTime * 0.05 // 上に移動
        }))
        .filter(text => text.life > 0);
      if (updated.length > 0) hasRemainingEffects = true;
      return updated;
    });
    
    // ダメージテキストの更新
    setDamageTexts(prev => {
      if (prev.length === 0) return prev;
      const updated = prev
        .map(text => ({
          ...text,
          life: text.life - deltaTime,
          alpha: text.life / text.maxLife,
          y: text.y - deltaTime * 0.08, // 上に移動
          x: text.x + Math.sin(text.life * 0.01) * 2 // 左右に揺れる
        }))
        .filter(text => text.life > 0);
      if (updated.length > 0) hasRemainingEffects = true;
      return updated;
    });
    
    // 🚀 エフェクトが残っている場合のみ次フレームを要求
    if (hasRemainingEffects) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      animationFrameRef.current = undefined;
    }
  }, []);
  
  // 🚀 エフェクトがある時のみアニメーション開始
  useEffect(() => {
    if (hasActiveEffects && !animationFrameRef.current) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [animate, hasActiveEffects]);
  
  return (
    <div
      className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden",
        isScreenShaking && "animate-pulse",
        className
      )}
      style={{
        width,
        height,
        transform: isScreenShaking 
          ? `translate(${Math.random() * shakeIntensity - shakeIntensity/2}px, ${Math.random() * shakeIntensity - shakeIntensity/2}px)`
          : 'none'
      }}
    >
      {/* 魔法陣エフェクト */}
      {magicCircles.map(circle => {
        const config = EFFECT_CONFIGS.magicCircle[circle.type];
        
        return (
          <div
            key={circle.id}
            className="absolute"
            style={{
              left: circle.x - circle.radius,
              top: circle.y - circle.radius,
              width: circle.radius * 2,
              height: circle.radius * 2,
              opacity: circle.alpha,
              transform: `rotate(${circle.rotation}rad)`
            }}
          >
            {/* 外側の円 */}
            <div
              className="absolute inset-0 rounded-full border-4"
              style={{
                borderColor: config.color,
                boxShadow: `0 0 20px ${config.glowColor}`
              }}
            />
            
            {/* 内側のパターン */}
            <div
              className="absolute inset-4 rounded-full border-2"
              style={{
                borderColor: config.color,
                opacity: 0.6
              }}
            />
            
            {/* 中央のシンボル */}
            <div 
              className="absolute inset-0 flex items-center justify-center text-2xl"
              style={{ color: config.color }}
            >
              {circle.type === 'success' ? '✨' : '💥'}
            </div>
          </div>
        );
      })}
      
      {/* モンスターアニメーション */}
      {monsterAnimations.map(animation => (
        <div
          key={animation.id}
          className="absolute flex items-center justify-center text-4xl"
          style={{
            left: animation.x - 30,
            top: animation.y - 30,
            width: 60,
            height: 60,
            opacity: animation.alpha,
            transform: `scale(${animation.scale}) rotate(${animation.rotation}rad)`
          }}
        >
          {animation.type === 'idle' && '👻'}
          {animation.type === 'attack' && '😈'}
          {animation.type === 'damage' && '💥'}
        </div>
      ))}
      
      {/* 魔法名テキスト */}
      {magicTexts.map(text => (
        <div
          key={text.id}
          className="absolute text-center font-bold"
          style={{
            left: text.x - 50,
            top: text.y,
            width: 'auto',
            whiteSpace: 'nowrap',
            color: text.color,
            opacity: text.alpha * 0.75,
            fontSize: EFFECT_CONFIGS.magicText.fontSize,
            textShadow: `${EFFECT_CONFIGS.magicText.strokeThickness}px ${EFFECT_CONFIGS.magicText.strokeThickness}px ${EFFECT_CONFIGS.magicText.strokeColor}`
          }}
        >
          {text.text}
        </div>
      ))}
      
      {/* ダメージテキスト */}
      {damageTexts.map(text => (
        <div
          key={text.id}
          className="absolute text-center font-bold"
          style={{
            left: text.x - 30,
            top: text.y,
            width: 60,
            color: text.color,
            opacity: text.alpha,
            fontSize: EFFECT_CONFIGS.damageText.fontSize,
            textShadow: `${EFFECT_CONFIGS.damageText.strokeThickness}px ${EFFECT_CONFIGS.damageText.strokeThickness}px ${EFFECT_CONFIGS.damageText.strokeColor}`
          }}
        >
          {text.value}
        </div>
      ))}
      
      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
          <div>魔法陣: {magicCircles.length}</div>
          <div>モンスター: {monsterAnimations.length}</div>
          <div>魔法テキスト: {magicTexts.length}</div>
          <div>ダメージ: {damageTexts.length}</div>
          <div>画面振動: {isScreenShaking ? 'ON' : 'OFF'}</div>
        </div>
      )}
    </div>
  );
});

FantasyEffects.displayName = 'FantasyEffects';

export default FantasyEffects;
export type { FantasyEffectsRef };