/**
 * ファンタジーモード専用PIXI描画コンポーネント
 * SVGベースの敵キャラとエフェクトを統合管理
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

// モンスターのビジュアル状態を不変に管理
interface MonsterVisualState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  tint: number;
  alpha: number;
  visible: boolean;
}

interface MonsterGameState {
  health: number;
  maxHealth: number;
  isAttacking: boolean;
  isHit: boolean;
  hitColor: number;
  originalColor: number;
  staggerOffset: { x: number; y: number };
  hitCount: number;
  isFadingOut: boolean;
  isTransitioning: boolean;
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
  type: 'fire' | 'ice' | 'lightning' | 'magic' | 'damage' | 'explosion' | 'sparkle';
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
  particleCount: number;
}

interface MagicCircle {
  id: string;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: number;
  type: 'success' | 'failure';
}

// ===== 魔法タイプ定義 =====
const MAGIC_TYPES: Record<string, MagicType> = {
  fire: {
    name: 'ファイアーボール',
    color: 0xFF4500,
    particleColor: 0xFF6B35,
    effectTexture: '🔥',
    damageRange: [15, 30],
    particleCount: 20
  },
  ice: {
    name: 'アイスストーム',
    color: 0x87CEEB,
    particleColor: 0xB0E0E6,
    effectTexture: '❄️',
    damageRange: [12, 25],
    particleCount: 25
  },
  lightning: {
    name: 'サンダーボルト',
    color: 0xFFD700,
    particleColor: 0xFFF700,
    effectTexture: '⚡',
    damageRange: [20, 35],
    particleCount: 15
  }
};

// ===== モンスターシンボルマッピング（フラットデザイン） =====
const MONSTER_EMOJI: Record<string, string> = {
  'vampire': '☠', // 頭蓋骨（バンパイア）
  'monster': '🕷', // 蜘蛛（モンスター）
  'reaper': '🎩', // シルクハット（死神）
  'kraken': '👁', // 目玉（クラーケン）
  'werewolf': '🐦', // 鳥（人狼）
  'demon': '🔥'  // 火（悪魔）
};

// ===== PIXI インスタンスクラス =====
export class FantasyPIXIInstance {
  private app: PIXI.Application;
  private monsterContainer: PIXI.Container;
  private particleContainer: PIXI.Container;
  private effectContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  private backgroundContainer: PIXI.Container;
  
  // モンスタースプライトは常に存在する（表示/非表示で制御）
  private monsterSprite: PIXI.Sprite;
  private monsterVisualState: MonsterVisualState;
  private monsterGameState: MonsterGameState;
  private particles: Map<string, PIXI.Graphics> = new Map();
  private particleData: Map<string, ParticleData> = new Map();
  private magicCircles: Map<string, PIXI.Graphics> = new Map();
  private magicCircleData: Map<string, MagicCircle> = new Map();
  private damageNumbers: Map<string, PIXI.Text> = new Map();
  private damageData: Map<string, DamageNumber> = new Map();
  private magicNameText: PIXI.Text | null = null;
  
  private currentMagicType: string = 'fire';
  private emojiTextures: Map<string, PIXI.Texture> = new Map();
  
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
    this.backgroundContainer = new PIXI.Container();
    this.monsterContainer = new PIXI.Container();
    this.particleContainer = new PIXI.Container();
    this.effectContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    
    // z-indexの設定（背景→モンスター→パーティクル→エフェクト→UI）
    this.app.stage.addChild(this.backgroundContainer);
    this.app.stage.addChild(this.monsterContainer);
    this.app.stage.addChild(this.particleContainer);
    this.app.stage.addChild(this.effectContainer);
    this.app.stage.addChild(this.uiContainer);
    
    // モンスターのビジュアル状態初期化（画面真ん中に配置）
    this.monsterVisualState = {
      x: width / 2,
      y: height / 2 - 20,
      scale: 1.0,
      rotation: 0,
      tint: 0xFFFFFF,
      alpha: 1.0,
      visible: false // 初期状態では非表示
    };
    
    // モンスターのゲーム状態初期化
    this.monsterGameState = {
      health: 5,
      maxHealth: 5,
      isAttacking: false,
      isHit: false,
      hitColor: 0xFF6B6B,
      originalColor: 0xFFFFFF,
      staggerOffset: { x: 0, y: 0 },
      hitCount: 0,
      isFadingOut: false,     // 追加
      isTransitioning: false, // 追加
    };
    
    // デフォルトのモンスタースプライトを作成（初期は透明な正方形）
    const defaultTexture = PIXI.Texture.WHITE;
    this.monsterSprite = new PIXI.Sprite(defaultTexture);
    this.monsterSprite.width = 128;
    this.monsterSprite.height = 128;
    this.monsterSprite.anchor.set(0.5);
    this.monsterSprite.visible = false; // 初期は非表示
    this.monsterSprite.interactive = true;
    this.monsterSprite.cursor = 'pointer';
    this.monsterContainer.addChild(this.monsterSprite);
    
    // 絵文字テクスチャの事前読み込み
    this.loadEmojiTextures();
    
    // アニメーションループ開始
    this.startAnimationLoop();
    
    devLog.debug('✅ ファンタジーPIXI初期化完了（安全設計）');
  }

  // 絵文字テクスチャの読み込み
  private async loadEmojiTextures(): Promise<void> {
    try {
      for (const [monsterKey, emoji] of Object.entries(MONSTER_EMOJI)) {
        // 絵文字をCanvasに描画してテクスチャを作成
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        
        canvas.width = 128;
        canvas.height = 128;
        
        // 背景を透明に
        ctx.clearRect(0, 0, 128, 128);
        
        // 絵文字を中央に描画（モノクロ色合い）
        ctx.font = '80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#666666'; // モノクロ色合い
        ctx.fillText(emoji, 64, 64);
        
        // PIXIテクスチャに変換
        const baseTexture = new PIXI.BaseTexture(canvas);
        const texture = new PIXI.Texture(baseTexture);
        
        this.emojiTextures.set(monsterKey, texture);
        devLog.debug(`✅ 絵文字テクスチャ作成完了: ${monsterKey} (${emoji})`);
      }
    } catch (error) {
      devLog.debug('❌ 絵文字テクスチャ作成エラー:', error);
      // フォールバック用の空テクスチャを作成
      this.createFallbackTextures();
    }
  }

  // フォールバック用テクスチャ作成
  private createFallbackTextures(): void {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xDDDDDD);
    graphics.drawCircle(0, 0, 50);
    graphics.endFill();
    
    const fallbackTexture = this.app.renderer.generateTexture(graphics);
    
    Object.keys(MONSTER_EMOJI).forEach(key => {
      this.emojiTextures.set(key, fallbackTexture);
    });
  }

  // ▼▼▼ モンスタースプライト作成（SVGベース）を修正 ▼▼▼
  async createMonsterSprite(icon: string): Promise<void> {
    if (this.isDestroyed) return;
    
    try {
      const texture = this.emojiTextures.get(icon) || this.emojiTextures.get('vampire');
      
      if (texture) {
        this.monsterSprite.texture = texture;
        
        this.monsterVisualState = {
          ...this.monsterVisualState,
          alpha: 1.0,
          visible: true,
          tint: 0xFFFFFF,
          scale: 1.0
        };
        
        // ゲーム状態もリセット
        this.monsterGameState.hitCount = 0;
        this.monsterGameState.health = this.monsterGameState.maxHealth;
        this.monsterGameState.isFadingOut = false;     // リセット
        this.monsterGameState.isTransitioning = false; // 遷移完了
        
        this.updateMonsterSprite();
        
        devLog.debug('✅ SVGモンスタースプライト更新完了:', { icon });
      } else {
        devLog.debug('⚠️ SVGテクスチャが見つかりません:', { icon });
        this.createFallbackMonster();
      }
    } catch (error) {
      devLog.debug('❌ モンスタースプライト作成エラー:', error);
      this.createFallbackMonster();
    }
  }

  // フォールバック用モンスター作成
  private createFallbackMonster(): void {
    if (this.isDestroyed) return;
    
    try {
      // グラフィックスからテクスチャを生成
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0xDDDDDD);
      graphics.drawCircle(64, 64, 64);
      graphics.endFill();
      
      // 絵文字テキスト
      const text = new PIXI.Text('👻', { fontSize: 48, fill: 0xFFFFFF });
      text.anchor.set(0.5);
      text.position.set(64, 64);
      graphics.addChild(text);
      
      // グラフィックスからテクスチャを作成
      const texture = this.app.renderer.generateTexture(graphics);
      graphics.destroy();
      
      // 既存のスプライトのテクスチャを更新
      this.monsterSprite.texture = texture;
      
      // ビジュアル状態をリセット
      this.monsterVisualState = {
        ...this.monsterVisualState,
        alpha: 1.0,
        visible: true,
        tint: 0xFFFFFF,
        scale: 1.0
      };
      
      // スプライトの属性を更新
      this.updateMonsterSprite();
      
      devLog.debug('✅ フォールバックモンスター作成完了');
    } catch (error) {
      devLog.debug('❌ フォールバックモンスター作成エラー:', error);
    }
  }

  // モンスタースプライトの属性を安全に更新
  private updateMonsterSprite(): void {
    // 追加の安全チェックを実装
    if (
      this.isDestroyed ||
      !this.monsterSprite ||
      this.monsterSprite.destroyed ||
      // transform が null になると PIXI 内部で x 代入時にエラーになるため
      !(this.monsterSprite as any).transform
    ) {
      return; // 破棄済みまたは異常状態の場合は更新しない
    }
    
    // ビジュアル状態を適用
    this.monsterSprite.x = this.monsterVisualState.x;
    this.monsterSprite.y = this.monsterVisualState.y;
    this.monsterSprite.scale.set(this.monsterVisualState.scale);
    this.monsterSprite.rotation = this.monsterVisualState.rotation;
    this.monsterSprite.tint = this.monsterVisualState.tint;
    this.monsterSprite.alpha = this.monsterVisualState.alpha;
    this.monsterSprite.visible = this.monsterVisualState.visible;
  }

  // ▼▼▼ 攻撃成功エフェクトを修正 ▼▼▼
  triggerAttackSuccess(): void {
    if (this.isDestroyed || this.monsterGameState.isTransitioning) return;
    
    try {
      // 魔法タイプをローテーション
      const magicTypes = Object.keys(MAGIC_TYPES);
      const currentIndex = magicTypes.indexOf(this.currentMagicType);
      this.currentMagicType = magicTypes[(currentIndex + 1) % magicTypes.length];
      const magic = MAGIC_TYPES[this.currentMagicType];
      
      this.showMagicName(magic.name);
      
      this.monsterGameState.isHit = true;
      this.monsterGameState.hitColor = magic.color;
      this.monsterGameState.staggerOffset = {
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.5) * 15
      };
      
      const damage = Math.floor(Math.random() * (magic.damageRange[1] - magic.damageRange[0] + 1)) + magic.damageRange[0];
      this.createDamageNumber(damage, magic.color);
      
      this.createMagicParticles(magic);
      this.createExplosionEffect(this.monsterVisualState.x, this.monsterVisualState.y);
      
      this.monsterGameState.hitCount++;
      this.monsterGameState.health = Math.max(0, this.monsterGameState.maxHealth - this.monsterGameState.hitCount);
      
      this.createScreenShake(5, 200);
      
      // 5発で敵を倒す処理をフラグ管理に変更
      if (this.monsterGameState.hitCount >= 5) {
        devLog.debug('💀 敵を倒した！消滅アニメーション開始...');
        this.monsterGameState.isFadingOut = true;
        this.monsterGameState.isTransitioning = true;
        // ここにあった requestAnimationFrame を使った fadeOut 関数は完全に削除します
      }
      
      setTimeout(() => {
        this.monsterGameState.isHit = false;
        this.monsterGameState.staggerOffset = { x: 0, y: 0 };
      }, 300);
      
      devLog.debug('⚔️ 攻撃成功:', { 
        magic: magic.name, 
        damage, 
        hitCount: this.monsterGameState.hitCount, 
        enemyHp: this.monsterGameState.health 
      });
    } catch (error) {
      devLog.debug('❌ 攻撃成功エフェクトエラー:', error);
    }
  }

  // 魔法陣エフェクト作成
  private createMagicCircle(x: number, y: number, type: 'success' | 'failure'): void {
    const id = `magic_circle_${Date.now()}`;
    const color = type === 'success' ? 0xFFD700 : 0xFF6B6B;
    
    const graphics = new PIXI.Graphics();
    graphics.x = x;
    graphics.y = y;
    
    this.effectContainer.addChild(graphics);
    this.magicCircles.set(id, graphics);
    this.magicCircleData.set(id, {
      id,
      x,
      y,
      radius: 0,
      rotation: 0,
      alpha: 1,
      life: 2000,
      maxLife: 2000,
      color,
      type
    });
  }

  // 爆発エフェクト作成
  private createExplosionEffect(x: number, y: number): void {
    if (this.isDestroyed) return;
    
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
      const id = `explosion_${Date.now()}_${i}`;
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 3 + Math.random() * 5;
      
      const particle = new PIXI.Graphics();
      const size = 2 + Math.random() * 6;
      const color = [0xFF6B35, 0xFFD700, 0xFF4757][Math.floor(Math.random() * 3)];
      
      particle.beginFill(color);
      particle.drawCircle(0, 0, size);
      particle.endFill();
      
      particle.x = x + (Math.random() - 0.5) * 20;
      particle.y = y + (Math.random() - 0.5) * 20;
      
      this.particleContainer.addChild(particle);
      this.particles.set(id, particle);
      this.particleData.set(id, {
        id,
        x: particle.x,
        y: particle.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1000,
        maxLife: 1000,
        size,
        color,
        alpha: 1,
        type: 'explosion'
      });
    }
  }

  // 画面震動エフェクト
  private createScreenShake(intensity: number, duration: number): void {
    let shakeTime = 0;
    const originalX = this.app.stage.x;
    const originalY = this.app.stage.y;
    
    const shake = () => {
      if (shakeTime >= duration) {
        this.app.stage.x = originalX;
        this.app.stage.y = originalY;
        return;
      }
      
      const shakeIntensity = intensity * (1 - shakeTime / duration);
      this.app.stage.x = originalX + (Math.random() - 0.5) * shakeIntensity;
      this.app.stage.y = originalY + (Math.random() - 0.5) * shakeIntensity;
      
      shakeTime += 16;
      setTimeout(shake, 16);
    };
    
    shake();
  }

  // ダメージ数値作成
  private createDamageNumber(damage: number, color: number): void {
    const id = `damage_${Date.now()}_${Math.random()}`;
    
    const damageText = new PIXI.Text(damage.toString(), {
      fontSize: 28,
      fill: color,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 3
    });
    
    damageText.anchor.set(0.5);
    damageText.x = this.monsterVisualState.x + (Math.random() - 0.5) * 60;
    damageText.y = this.monsterVisualState.y - 80;
    
    this.uiContainer.addChild(damageText);
    this.damageNumbers.set(id, damageText);
    this.damageData.set(id, {
      id,
      x: damageText.x,
      y: damageText.y,
      value: damage,
      life: 2500,
      maxLife: 2500,
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
      fontFamily: 'DotGothic16, "DotGothic16", Gothic16, Arial, sans-serif', // Pixel style font
      fontSize: 36,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 3,
      align: 'center'
    });
    
    // 位置設定（画面中央上部）
    this.magicNameText.x = this.app.screen.width / 2;
    this.magicNameText.y = 60;
    this.magicNameText.anchor.set(0.5);
    
    this.effectContainer.addChild(this.magicNameText);
    
    // 2.5秒後に削除
    setTimeout(() => {
      if (this.magicNameText && !this.isDestroyed) {
        this.effectContainer.removeChild(this.magicNameText);
        this.magicNameText = null;
      }
    }, 2500);
    
    devLog.debug('✨ 魔法名表示:', { magicName });
  }

  // 魔法パーティクル作成
  private createMagicParticles(magic: MagicType): void {
    for (let i = 0; i < magic.particleCount; i++) {
      const id = `particle_${Date.now()}_${i}`;
      const angle = (Math.PI * 2 * i) / magic.particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      
      const particle = new PIXI.Graphics();
      const size = 3 + Math.random() * 5;
      
      particle.beginFill(magic.particleColor);
      particle.drawCircle(0, 0, size);
      particle.endFill();
      
      particle.x = this.monsterVisualState.x;
      particle.y = this.monsterVisualState.y;
      
      this.particleContainer.addChild(particle);
      this.particles.set(id, particle);
      this.particleData.set(id, {
        id,
        x: particle.x,
        y: particle.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 2000,
        maxLife: 2000,
        size,
        color: magic.particleColor,
        alpha: 1,
        type: magic.name.includes('ファイア') ? 'fire' : magic.name.includes('アイス') ? 'ice' : 'lightning'
      });
    }
  }

  // モンスター攻撃状態更新
  updateMonsterAttacking(isAttacking: boolean): void {
    this.monsterGameState.isAttacking = isAttacking;
    
    if (isAttacking) {
      this.monsterVisualState.tint = 0xFF6B6B;
      this.monsterVisualState.scale = 1.3;
      this.updateMonsterSprite();
      
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.monsterVisualState.tint = 0xFFFFFF;
          this.monsterVisualState.scale = 1.0;
          this.updateMonsterSprite();
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
      this.updateMagicCircles();
      this.updateDamageNumbers();
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  // モンスターアニメーション更新（安全バージョン）
  private updateMonsterAnimation(): void {
    // ★【重要修正】 モンスターが存在しない、または破棄済みなら何もせず処理を抜ける
    if (this.isDestroyed || !this.monsterSprite || this.monsterSprite.destroyed || !this.monsterVisualState.visible) {
      return;
    }
    
    try {
      // よろけ効果の適用（ビジュアル状態を更新）
      this.monsterVisualState.x = (this.app.screen.width / 2) + this.monsterGameState.staggerOffset.x;
      this.monsterVisualState.y = (this.app.screen.height / 2 - 20) + this.monsterGameState.staggerOffset.y;
      
      // 色変化の適用
      this.monsterVisualState.tint = this.monsterGameState.isHit 
        ? this.monsterGameState.hitColor 
        : this.monsterGameState.originalColor;
      
      // アイドル時の軽い浮遊効果
      if (!this.monsterGameState.isAttacking && !this.monsterGameState.isHit) {
        this.monsterVisualState.y += Math.sin(Date.now() * 0.002) * 0.5;
      }
      
      // よろけ効果の減衰
      this.monsterGameState.staggerOffset.x *= 0.9;
      this.monsterGameState.staggerOffset.y *= 0.9;
      
      // モンスタースプライトを更新
      this.updateMonsterSprite();
      
    } catch (error) {
      devLog.debug('⚠️ モンスターアニメーション更新エラー:', error);
    }
  }

  // 魔法陣アニメーション更新
  private updateMagicCircles(): void {
    if (this.isDestroyed) return;
    
    for (const [id, circleData] of this.magicCircleData.entries()) {
      const graphics = this.magicCircles.get(id);
      if (!graphics || graphics.destroyed) continue;
      
      try {
        const progress = 1 - (circleData.life / circleData.maxLife);
        circleData.radius = 120 * Math.sin(progress * Math.PI);
        circleData.rotation += 0.05;
        circleData.alpha = Math.sin(progress * Math.PI) * 0.9;
        circleData.life -= 16;
        
        // 魔法陣を描画（nullチェック強化）
        if (graphics.transform && !graphics.destroyed) {
          graphics.clear();
          graphics.lineStyle(4, circleData.color, circleData.alpha);
          graphics.drawCircle(0, 0, circleData.radius);
          graphics.lineStyle(2, circleData.color, circleData.alpha * 0.6);
          graphics.drawCircle(0, 0, circleData.radius * 0.7);
          graphics.rotation = circleData.rotation;
        }
        
        // 削除判定
        if (circleData.life <= 0) {
          if (graphics.parent) {
            this.effectContainer.removeChild(graphics);
          }
          graphics.destroy();
          this.magicCircles.delete(id);
          this.magicCircleData.delete(id);
        }
      } catch (error) {
        // エラー時は安全にグラフィックスを削除
        devLog.debug('⚠️ 魔法陣更新エラー:', error);
        this.magicCircles.delete(id);
        this.magicCircleData.delete(id);
      }
    }
  }

  // パーティクル更新
  private updateParticles(): void {
    if (this.isDestroyed) return;
    
    for (const [id, particleData] of this.particleData.entries()) {
      const particle = this.particles.get(id);
      if (!particle || particle.destroyed) continue;
      
      try {
        // 位置更新
        particleData.x += particleData.vx;
        particleData.y += particleData.vy;
        particleData.vy += 0.12; // 重力効果
        
        // ライフ減少
        particleData.life -= 16; // 60FPS想定
        particleData.alpha = particleData.life / particleData.maxLife;
        
        // スプライト更新（nullチェック強化）
        if (particle.transform && !particle.destroyed) {
          particle.x = particleData.x;
          particle.y = particleData.y;
          particle.alpha = particleData.alpha;
          
          // サイズ変化（爆発系）
          if (particleData.type === 'explosion') {
            const scale = 1 + (1 - particleData.alpha) * 0.5;
            particle.scale.set(scale);
          }
        }
        
        // 削除判定
        if (particleData.life <= 0) {
          if (particle.parent) {
            this.particleContainer.removeChild(particle);
          }
          particle.destroy();
          this.particles.delete(id);
          this.particleData.delete(id);
        }
      } catch (error) {
        // エラー時は安全にパーティクルを削除
        devLog.debug('⚠️ パーティクル更新エラー:', error);
        this.particles.delete(id);
        this.particleData.delete(id);
      }
    }
  }

  // ダメージ数値更新
  private updateDamageNumbers(): void {
    if (this.isDestroyed) return;
    
    for (const [id, damageData] of this.damageData.entries()) {
      const damageText = this.damageNumbers.get(id);
      if (!damageText || damageText.destroyed) continue;
      
      try {
        // 上昇アニメーション
        damageData.y -= 1.5;
        damageData.life -= 16; // 60FPS想定
        
        // スプライト更新（nullチェック強化）
        if (damageText.transform && !damageText.destroyed) {
          damageText.y = damageData.y;
          damageText.alpha = damageData.life / damageData.maxLife;
          
          // サイズ変化
          const scale = 1 + (1 - damageText.alpha) * 0.3;
          damageText.scale.set(scale);
        }
        
        // 削除判定
        if (damageData.life <= 0) {
          if (damageText.parent) {
            this.uiContainer.removeChild(damageText);
          }
          damageText.destroy();
          this.damageNumbers.delete(id);
          this.damageData.delete(id);
        }
      } catch (error) {
        // エラー時は安全にテキストを削除
        devLog.debug('⚠️ ダメージ数値更新エラー:', error);
        this.damageNumbers.delete(id);
        this.damageData.delete(id);
      }
    }
  }

  // サイズ変更（中央配置）
  resize(width: number, height: number): void {
    if (!this.app || !this.app.renderer || this.isDestroyed) {
      devLog.debug('⚠️ PIXIリサイズスキップ: アプリまたはレンダラーがnull');
      return;
    }
    
    try {
      this.app.renderer.resize(width, height);
      
      // ビジュアル状態の基準位置を更新
      this.monsterVisualState.x = width / 2;
      this.monsterVisualState.y = height / 2 - 20;
      
      // スプライトを更新
      this.updateMonsterSprite();
      
      devLog.debug('✅ ファンタジーPIXIリサイズ完了:', { width, height });
    } catch (error) {
      devLog.debug('❌ ファンタジーPIXIリサイズエラー:', error);
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
      this.animationFrameId = null;
    }
    
    // テクスチャクリーンアップ
    this.emojiTextures.forEach((texture: PIXI.Texture) => {
      if (texture && !texture.destroyed) {
        texture.destroy(true);
      }
    });
    this.emojiTextures.clear();
    
    // PIXIアプリケーションの破棄
    if (this.app && !this.app.destroyed) {
      try {
        this.app.destroy(true, { children: true });
      } catch (error) {
        devLog.debug('⚠️ PIXI破棄エラー:', error);
      }
    }
    
    devLog.debug('🗑️ FantasyPIXI破棄完了');
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