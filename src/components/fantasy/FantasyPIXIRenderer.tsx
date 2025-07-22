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
  scale: number;
  rotation: number;
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

// ===== 絵文字モンスターマッピング（モノクロ） =====
const MONSTER_EMOJI: Record<string, string> = {
  'vampire': '🧛',
  'monster': '👹',
  'reaper': '💀',
  'kraken': '🐙',
  'werewolf': '🐺',
  'demon': '👿'
};

// ===== PIXI インスタンスクラス =====
export class FantasyPIXIInstance {
  private app: PIXI.Application;
  private monsterContainer: PIXI.Container;
  private particleContainer: PIXI.Container;
  private effectContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  private backgroundContainer: PIXI.Container;
  
  private monsterSprite: PIXI.Sprite | null = null;
  private monsterState: MonsterState;
  private particles: Map<string, PIXI.Graphics> = new Map();
  private particleData: Map<string, ParticleData> = new Map();
  private magicCircles: Map<string, PIXI.Graphics> = new Map();
  private magicCircleData: Map<string, MagicCircle> = new Map();
  private damageNumbers: Map<string, PIXI.Text> = new Map();
  private damageData: Map<string, DamageNumber> = new Map();
  private magicNameText: PIXI.Text | null = null;
  
  private currentMagicType: string = 'fire';
  private enemyHitCount: number = 0;
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
    
    // モンスター状態初期化（画面真ん中に配置）
    this.monsterState = {
      x: width / 2,
      y: height / 2 - 20, // 少し上に配置
      health: 5,
      maxHealth: 5,
      isAttacking: false,
      isHit: false,
      hitColor: 0xFF6B6B,
      originalColor: 0x666666, // モノクロ色合い
      staggerOffset: { x: 0, y: 0 },
      scale: 1.0,
      rotation: 0
    };
    
    // 絵文字テクスチャの事前読み込み
    this.loadEmojiTextures();
    
    // アニメーションループ開始
    this.startAnimationLoop();
    
    devLog.debug('✅ ファンタジーPIXI初期化完了（SVGサポート付き）');
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
    graphics.beginFill(0x666666);
    graphics.drawCircle(0, 0, 50);
    graphics.endFill();
    
    const fallbackTexture = this.app.renderer.generateTexture(graphics);
    
    Object.keys(MONSTER_EMOJI).forEach(key => {
      this.emojiTextures.set(key, fallbackTexture);
    });
  }

  // モンスタースプライト作成（SVGベース）
  async createMonsterSprite(icon: string): Promise<void> {
    if (this.isDestroyed) return;
    
    try {
      if (this.monsterSprite) {
        this.monsterContainer.removeChild(this.monsterSprite);
        this.monsterSprite.destroy();
        this.monsterSprite = null;
      }

      // 絵文字テクスチャを取得
      const texture = this.emojiTextures.get(icon) || this.emojiTextures.get('vampire');
      
      if (texture) {
        this.monsterSprite = new PIXI.Sprite(texture);
        
        // サイズ調整（128x128固定）
        this.monsterSprite.width = 128;
        this.monsterSprite.height = 128;
        this.monsterSprite.anchor.set(0.5);
        this.monsterSprite.x = this.monsterState.x;
        this.monsterSprite.y = this.monsterState.y;
        this.monsterSprite.tint = 0x666666; // モノクロ色合いを強制設定
        
        // インタラクティブ設定
        this.monsterSprite.interactive = true;
        this.monsterSprite.cursor = 'pointer';
        
        this.monsterContainer.addChild(this.monsterSprite);
        devLog.debug('✅ SVGモンスタースプライト作成完了:', { icon });
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
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0x666666);
      graphics.drawCircle(0, 0, 64);
      graphics.endFill();
      
      // テキスト付きフォールバック
      const fallbackContainer = new PIXI.Container();
      fallbackContainer.addChild(graphics);
      
      const text = new PIXI.Text('👻', { fontSize: 48, fill: 0xFFFFFF });
      text.anchor.set(0.5);
      fallbackContainer.addChild(text);
      
      fallbackContainer.x = this.monsterState.x;
      fallbackContainer.y = this.monsterState.y;
      
      this.monsterContainer.addChild(fallbackContainer);
      
      // フォールバックモンスターをメインスプライトとして設定
      this.monsterSprite = fallbackContainer as any;
    } catch (error) {
      devLog.debug('❌ フォールバックモンスター作成エラー:', error);
    }
  }

  // 攻撃成功エフェクト
  triggerAttackSuccess(): void {
    if (!this.monsterSprite || this.isDestroyed) return;
    
    try {
      // 魔法タイプをローテーション
      const magicTypes = Object.keys(MAGIC_TYPES);
      const currentIndex = magicTypes.indexOf(this.currentMagicType);
      this.currentMagicType = magicTypes[(currentIndex + 1) % magicTypes.length];
      const magic = MAGIC_TYPES[this.currentMagicType];
      
      // 魔法名表示
      this.showMagicName(magic.name);
      
      // 魔法陣エフェクト - 削除
      // this.createMagicCircle(this.monsterState.x, this.monsterState.y, 'success');
      
      // 敵の色変化とよろけ
      this.monsterState.isHit = true;
      this.monsterState.hitColor = magic.color;
      this.monsterState.staggerOffset = {
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.5) * 15
      };
      
      // ダメージ数値生成
      const damage = Math.floor(Math.random() * (magic.damageRange[1] - magic.damageRange[0] + 1)) + magic.damageRange[0];
      this.createDamageNumber(damage, magic.color);
      
      // パーティクルエフェクト生成
      this.createMagicParticles(magic);
      this.createExplosionEffect(this.monsterState.x, this.monsterState.y);
      
      // 敵のヒットカウント増加
      this.enemyHitCount++;
      this.monsterState.health = Math.max(0, this.monsterState.maxHealth - this.enemyHitCount);
      
      // 画面震動エフェクト
      this.createScreenShake(5, 200);
      
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
      
      devLog.debug('⚔️ 攻撃成功:', { magic: magic.name, damage, hitCount: this.enemyHitCount, enemyHp: this.monsterState.health });
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

  // 次のモンスターに交代
  private switchToNextMonster(): void {
    if (!this.monsterSprite) return;
    
    // フェードアウトエフェクト
    const fadeOut = () => {
      if (this.monsterSprite && this.monsterSprite.alpha > 0) {
        this.monsterSprite.alpha -= 0.05;
        requestAnimationFrame(fadeOut);
      } else if (this.monsterSprite) {
        // 新しいモンスター生成
        this.enemyHitCount = 0;
        this.monsterState.health = this.monsterState.maxHealth;
        this.monsterSprite.alpha = 1;
        
        // ランダムな新しいモンスターを選択
        const monsterKeys = Object.keys(MONSTER_EMOJI);
        const randomKey = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
        this.createMonsterSprite(randomKey);
      }
    };
    fadeOut();
    
    devLog.debug('🔄 次のモンスターに交代');
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
    damageText.x = this.monsterState.x + (Math.random() - 0.5) * 60;
    damageText.y = this.monsterState.y - 80;
    
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
      fontFamily: 'Gothic16, Arial, sans-serif', // Gothic16を追加
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
    this.monsterState.isAttacking = isAttacking;
    
    if (this.monsterSprite && isAttacking) {
      this.monsterSprite.tint = 0xFF6B6B;
      this.monsterSprite.scale.set(1.3);
      
      // 攻撃エフェクト - 魔法陣削除
      // this.createMagicCircle(this.monsterState.x, this.monsterState.y, 'failure');
      
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
      this.updateMagicCircles();
      this.updateDamageNumbers();
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  // モンスターアニメーション更新
  private updateMonsterAnimation(): void {
    if (!this.monsterSprite || this.isDestroyed) return;
    
    try {
      // nullチェックを追加
      if (!this.monsterSprite || this.monsterSprite.destroyed) {
        return;
      }
      
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
      
      // アイドル時の軽い浮遊効果
      if (!this.monsterState.isAttacking && !this.monsterState.isHit) {
        this.monsterSprite.y += Math.sin(Date.now() * 0.002) * 0.5;
      }
    } catch (error) {
      devLog.debug('⚠️ モンスターアニメーション更新エラー:', error);
    }
  }

  // 魔法陣アニメーション更新
  private updateMagicCircles(): void {
    for (const [id, circleData] of this.magicCircleData.entries()) {
      const graphics = this.magicCircles.get(id);
      if (!graphics) continue;
      
      const progress = 1 - (circleData.life / circleData.maxLife);
      circleData.radius = 120 * Math.sin(progress * Math.PI);
      circleData.rotation += 0.05;
      circleData.alpha = Math.sin(progress * Math.PI) * 0.9;
      circleData.life -= 16;
      
      // 魔法陣を描画
      graphics.clear();
      graphics.lineStyle(4, circleData.color, circleData.alpha);
      graphics.drawCircle(0, 0, circleData.radius);
      graphics.lineStyle(2, circleData.color, circleData.alpha * 0.6);
      graphics.drawCircle(0, 0, circleData.radius * 0.7);
      graphics.rotation = circleData.rotation;
      
      // 削除判定
      if (circleData.life <= 0) {
        this.effectContainer.removeChild(graphics);
        this.magicCircles.delete(id);
        this.magicCircleData.delete(id);
      }
    }
  }

  // パーティクル更新
  private updateParticles(): void {
    for (const [id, particleData] of this.particleData.entries()) {
      const particle = this.particles.get(id);
      if (!particle) continue;
      
      // 位置更新
      particleData.x += particleData.vx;
      particleData.y += particleData.vy;
      particleData.vy += 0.12; // 重力効果
      
      // ライフ減少
      particleData.life -= 16; // 60FPS想定
      particleData.alpha = particleData.life / particleData.maxLife;
      
      // スプライト更新
      particle.x = particleData.x;
      particle.y = particleData.y;
      particle.alpha = particleData.alpha;
      
      // サイズ変化（爆発系）
      if (particleData.type === 'explosion') {
        const scale = 1 + (1 - particleData.alpha) * 0.5;
        particle.scale.set(scale);
      }
      
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
      damageData.y -= 1.5;
      damageData.life -= 16; // 60FPS想定
      
      // スプライト更新
      damageText.y = damageData.y;
      damageText.alpha = damageData.life / damageData.maxLife;
      
      // サイズ変化
      const scale = 1 + (1 - damageText.alpha) * 0.3;
      damageText.scale.set(scale);
      
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
    // nullチェックを追加してエラーを防ぐ
    if (!this.app || !this.app.renderer || this.isDestroyed) {
      devLog.debug('⚠️ PIXIリサイズスキップ: アプリまたはレンダラーがnull');
      return;
    }
    
    try {
      this.app.renderer.resize(width, height);
      this.monsterState.x = width / 2;
      this.monsterState.y = height / 2;
      
      if (this.monsterSprite && !this.monsterSprite.destroyed) {
        this.monsterSprite.x = this.monsterState.x;
        this.monsterSprite.y = this.monsterState.y;
      }
      
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