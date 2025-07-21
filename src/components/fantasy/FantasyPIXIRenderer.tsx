/**
 * ファンタジーモード専用PIXI描画コンポーネント
 * 敵、パーティクル、エフェクトを管理
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';

// ===== 型定義 =====

interface FantasyPIXIRendererProps {
  width: number;
  height: number;
  monsterIcon: string;
  isMonsterAttacking: boolean;
  enemyGauge: number;
  onReady?: (instance: FantasyPIXIInstance) => void;
  className?: string;
}

interface MonsterState {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isAttacking: boolean;
  isHit: boolean;
  hitColor: number;
  originalColor: number;
  staggerOffset: { x: number; y: number };
}

interface ParticleData {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
  type: 'fire' | 'ice' | 'lightning' | 'magic' | 'damage';
}

interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  life: number;
  maxLife: number;
  color: number;
}

interface MagicType {
  name: string;
  color: number;
  particleColor: number;
  effectTexture: string;
  damageRange: [number, number];
}

// ===== 魔法タイプ定義 =====
const MAGIC_TYPES: Record<string, MagicType> = {
  fire: {
    name: 'ファイアー',
    color: 0xFF4500,
    particleColor: 0xFF6B35,
    effectTexture: '🔥',
    damageRange: [15, 30]
  },
  ice: {
    name: 'アイス',
    color: 0x87CEEB,
    particleColor: 0xB0E0E6,
    effectTexture: '❄️',
    damageRange: [12, 25]
  },
  lightning: {
    name: 'サンダー',
    color: 0xFFD700,
    particleColor: 0xFFF700,
    effectTexture: '⚡',
    damageRange: [20, 35]
  }
};

// ===== モンスターアイコンマッピング =====
const MONSTER_ICONS: Record<string, string> = {
  'ghost': '▢',        // シンプルな四角
  'dragon': '△',       // 三角
  'skull': '◈',        // ダイアモンド
  'fire': '●',         // 円
  'ice': '◆',          // ダイアモンド塗り
  'tree': '♦',         // ダイアモンド
  'seedling': '◇',     // 空のダイアモンド
  'droplet': '○',      // 空の円
  'sun': '☉',          // 太陽記号
  'rock': '■',         // 四角塗り
  'sparkles': '✦',     // スター
  'gem': '◊',          // ダイアモンド記号
  'wind_face': '◐',    // 半円
  'zap': '⚡',         // 雷（これは残す）
  'star2': '★',        // 星（これは残す）
  'lightning': '◯'     // 大きな円
};

// ===== PIXI インスタンスクラス =====
export class FantasyPIXIInstance {
  private app: PIXI.Application;
  private monsterContainer: PIXI.Container;
  private particleContainer: PIXI.Container;
  private effectContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  
  private monsterSprite: PIXI.Text | null = null;
  private monsterState: MonsterState;
  private particles: Map<string, PIXI.Graphics> = new Map();
  private particleData: Map<string, ParticleData> = new Map();
  private damageNumbers: Map<string, PIXI.Text> = new Map();
  private damageData: Map<string, DamageNumber> = new Map();
  private magicNameText: PIXI.Text | null = null;
  
  private currentMagicType: string = 'fire';
  private enemyHitCount: number = 0;
  
  private isDestroyed: boolean = false;
  private animationFrameId: number | null = null;

  constructor(width: number, height: number) {
    // PIXI アプリケーション初期化
    this.app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });

    // コンテナ初期化
    this.monsterContainer = new PIXI.Container();
    this.particleContainer = new PIXI.Container();
    this.effectContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    
    // z-indexの設定（背景→モンスター→パーティクル→エフェクト→UI）
    this.app.stage.addChild(this.monsterContainer);
    this.app.stage.addChild(this.particleContainer);
    this.app.stage.addChild(this.effectContainer);
    this.app.stage.addChild(this.uiContainer);
    
    // モンスター状態初期化（中央配置）
    this.monsterState = {
      x: width / 2,
      y: height / 2,  // 中央に配置
      health: 5,
      maxHealth: 5,
      isAttacking: false,
      isHit: false,
      hitColor: 0xFF6B6B,
      originalColor: 0xFFFFFF,
      staggerOffset: { x: 0, y: 0 }
    };
    
    // アニメーションループ開始
    this.startAnimationLoop();
    
    devLog.debug('✅ ファンタジーPIXI初期化完了');
  }

  // モンスタースプライト作成
  createMonsterSprite(icon: string): void {
    if (this.monsterSprite) {
      this.monsterContainer.removeChild(this.monsterSprite);
    }

    const monsterText = MONSTER_ICONS[icon] || '👻';
    this.monsterSprite = new PIXI.Text(monsterText, {
      fontSize: 64,
      fill: this.monsterState.originalColor,
      fontFamily: 'Arial'
    });

    this.monsterSprite.anchor.set(0.5);
    this.monsterSprite.x = this.monsterState.x;
    this.monsterSprite.y = this.monsterState.y;
    
    this.monsterContainer.addChild(this.monsterSprite);
  }

  // 攻撃成功エフェクト
  triggerAttackSuccess(): void {
    if (!this.monsterSprite) return;
    
    // 魔法タイプをローテーション
    const magicTypes = Object.keys(MAGIC_TYPES);
    const currentIndex = magicTypes.indexOf(this.currentMagicType);
    this.currentMagicType = magicTypes[(currentIndex + 1) % magicTypes.length];
    const magic = MAGIC_TYPES[this.currentMagicType];
    
    // 魔法名表示
    this.showMagicName(magic.name);
    
    // 敵の色変化とよろけ
    this.monsterState.isHit = true;
    this.monsterState.hitColor = magic.color;
    this.monsterState.staggerOffset = {
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 10
    };
    
    // ダメージ数値生成
    const damage = Math.floor(Math.random() * (magic.damageRange[1] - magic.damageRange[0] + 1)) + magic.damageRange[0];
    this.createDamageNumber(damage, magic.color);
    
    // パーティクルエフェクト生成
    this.createMagicParticles(magic);
    
    // 敵のヒットカウント増加
    this.enemyHitCount++;
    this.monsterState.health = Math.max(0, this.monsterState.maxHealth - this.enemyHitCount);
    
    // 5発で次のモンスターに交代
    if (this.enemyHitCount >= 5) {
      setTimeout(() => {
        this.switchToNextMonster();
      }, 1500);
    }
    
    // 色とよろけ効果をリセット
    setTimeout(() => {
      this.monsterState.isHit = false;
      this.monsterState.staggerOffset = { x: 0, y: 0 };
    }, 300);
    
    devLog.debug('⚔️ 攻撃成功:', { magic: magic.name, damage, hitCount: this.enemyHitCount });
  }

  // 次のモンスターに交代
  private switchToNextMonster(): void {
    // フェードアウトエフェクト
    if (this.monsterSprite) {
      const fadeOut = () => {
        if (this.monsterSprite) {
          this.monsterSprite.alpha -= 0.05;
          if (this.monsterSprite.alpha <= 0) {
            // 新しいモンスター生成
            this.enemyHitCount = 0;
            this.monsterState.health = this.monsterState.maxHealth;
            this.monsterSprite.alpha = 1;
          } else {
            requestAnimationFrame(fadeOut);
          }
        }
      };
      fadeOut();
    }
    
    devLog.debug('🔄 次のモンスターに交代');
  }

  // ダメージ数値作成
  private createDamageNumber(damage: number, color: number): void {
    const id = `damage_${Date.now()}_${Math.random()}`;
    
    const damageText = new PIXI.Text(damage.toString(), {
      fontSize: 24,
      fill: color,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 2
    });
    
    damageText.anchor.set(0.5);
    damageText.x = this.monsterState.x + (Math.random() - 0.5) * 50;
    damageText.y = this.monsterState.y - 50;
    
    this.uiContainer.addChild(damageText);
    this.damageNumbers.set(id, damageText);
    this.damageData.set(id, {
      id,
      x: damageText.x,
      y: damageText.y,
      value: damage,
      life: 2000,
      maxLife: 2000,
      color
    });
  }

  // 魔法名表示
  private showMagicName(magicName: string): void {
    // 既存のテキストを削除
    if (this.magicNameText) {
      this.effectContainer.removeChild(this.magicNameText);
      this.magicNameText = null;
    }
    
    // 新しい魔法名テキスト作成
    this.magicNameText = new PIXI.Text(magicName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: 32,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 2,
      align: 'center'
    });
    
    // 位置設定（画面中央上部）
    this.magicNameText.x = this.app.screen.width / 2;
    this.magicNameText.y = 50;
    this.magicNameText.anchor.set(0.5);
    
    this.effectContainer.addChild(this.magicNameText);
    
    // 2秒後に削除
    setTimeout(() => {
      if (this.magicNameText) {
        this.effectContainer.removeChild(this.magicNameText);
        this.magicNameText = null;
      }
    }, 2000);
    
    devLog.debug('✨ 魔法名表示:', { magicName });
  }

  // 魔法パーティクル作成
  private createMagicParticles(magic: MagicType): void {
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
      const id = `particle_${Date.now()}_${i}`;
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      
      const particle = new PIXI.Graphics();
      particle.beginFill(magic.particleColor);
      particle.drawCircle(0, 0, 3 + Math.random() * 4);
      particle.endFill();
      
      particle.x = this.monsterState.x;
      particle.y = this.monsterState.y;
      
      this.particleContainer.addChild(particle);
      this.particles.set(id, particle);
      this.particleData.set(id, {
        id,
        x: particle.x,
        y: particle.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1500,
        maxLife: 1500,
        size: 3 + Math.random() * 4,
        color: magic.particleColor,
        alpha: 1,
        type: magic.name === '炎系魔法' ? 'fire' : magic.name === '氷系魔法' ? 'ice' : 'lightning'
      });
    }
  }

  // モンスター攻撃状態更新
  updateMonsterAttacking(isAttacking: boolean): void {
    this.monsterState.isAttacking = isAttacking;
    
    if (this.monsterSprite && isAttacking) {
      this.monsterSprite.tint = 0xFF6B6B;
      this.monsterSprite.scale.set(1.2);
      
      setTimeout(() => {
        if (this.monsterSprite) {
          this.monsterSprite.tint = 0xFFFFFF;
          this.monsterSprite.scale.set(1.0);
        }
      }, 600);
    }
  }

  // アニメーションループ
  private startAnimationLoop(): void {
    const animate = () => {
      if (this.isDestroyed) return;
      
      this.updateMonsterAnimation();
      this.updateParticles();
      this.updateDamageNumbers();
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  // モンスターアニメーション更新
  private updateMonsterAnimation(): void {
    if (!this.monsterSprite) return;
    
    // よろけ効果の適用
    this.monsterSprite.x = this.monsterState.x + this.monsterState.staggerOffset.x;
    this.monsterSprite.y = this.monsterState.y + this.monsterState.staggerOffset.y;
    
    // 色変化の適用
    if (this.monsterState.isHit) {
      this.monsterSprite.tint = this.monsterState.hitColor;
    } else {
      this.monsterSprite.tint = this.monsterState.originalColor;
    }
    
    // よろけ効果の減衰
    this.monsterState.staggerOffset.x *= 0.9;
    this.monsterState.staggerOffset.y *= 0.9;
  }

  // パーティクル更新
  private updateParticles(): void {
    for (const [id, particleData] of this.particleData.entries()) {
      const particle = this.particles.get(id);
      if (!particle) continue;
      
      // 位置更新
      particleData.x += particleData.vx;
      particleData.y += particleData.vy;
      particleData.vy += 0.1; // 重力効果
      
      // ライフ減少
      particleData.life -= 16; // 60FPS想定
      particleData.alpha = particleData.life / particleData.maxLife;
      
      // スプライト更新
      particle.x = particleData.x;
      particle.y = particleData.y;
      particle.alpha = particleData.alpha;
      
      // 削除判定
      if (particleData.life <= 0) {
        this.particleContainer.removeChild(particle);
        this.particles.delete(id);
        this.particleData.delete(id);
      }
    }
  }

  // ダメージ数値更新
  private updateDamageNumbers(): void {
    for (const [id, damageData] of this.damageData.entries()) {
      const damageText = this.damageNumbers.get(id);
      if (!damageText) continue;
      
      // 上昇アニメーション
      damageData.y -= 1;
      damageData.life -= 16; // 60FPS想定
      
      // スプライト更新
      damageText.y = damageData.y;
      damageText.alpha = damageData.life / damageData.maxLife;
      
      // 削除判定
      if (damageData.life <= 0) {
        this.uiContainer.removeChild(damageText);
        this.damageNumbers.delete(id);
        this.damageData.delete(id);
      }
    }
  }

  // サイズ変更（中央配置）
  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
    this.monsterState.x = width / 2;
    this.monsterState.y = height / 2;  // 中央に配置
    
    if (this.monsterSprite) {
      this.monsterSprite.x = this.monsterState.x;
      this.monsterSprite.y = this.monsterState.y;
    }
  }

  // Canvas要素取得
  getCanvas(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement;
  }

  // 破棄
  destroy(): void {
    this.isDestroyed = true;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.app.destroy(true, { children: true });
  }
}

// ===== Reactコンポーネント =====

export const FantasyPIXIRenderer: React.FC<FantasyPIXIRendererProps> = ({
  width,
  height,
  monsterIcon,
  isMonsterAttacking,
  enemyGauge,
  onReady,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pixiInstance, setPixiInstance] = useState<FantasyPIXIInstance | null>(null);

  // PIXI初期化
  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new FantasyPIXIInstance(width, height);
    containerRef.current.appendChild(instance.getCanvas());
    
    setPixiInstance(instance);
    onReady?.(instance);

    return () => {
      instance.destroy();
    };
  }, [width, height, onReady]);

  // モンスターアイコン変更
  useEffect(() => {
    if (pixiInstance) {
      pixiInstance.createMonsterSprite(monsterIcon);
    }
  }, [pixiInstance, monsterIcon]);

  // 攻撃状態更新
  useEffect(() => {
    if (pixiInstance) {
      pixiInstance.updateMonsterAttacking(isMonsterAttacking);
    }
  }, [pixiInstance, isMonsterAttacking]);

  // サイズ変更
  useEffect(() => {
    if (pixiInstance) {
      pixiInstance.resize(width, height);
    }
  }, [pixiInstance, width, height]);

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ width, height }}
    />
  );
};

export default FantasyPIXIRenderer; 