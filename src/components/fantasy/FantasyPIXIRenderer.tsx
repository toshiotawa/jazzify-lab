/**
 * ファンタジーモード専用PIXI描画コンポーネント
 * SVGベースの敵キャラとエフェクトを統合管理
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';

// ===== 型定義 =====

// 状態機械の型定義
type MonsterState = 'IDLE' | 'HITTING' | 'DEFEATED' | 'FADING_OUT' | 'GONE';

// モンスター個体情報（GameEngineから）
interface MonsterInstance {
  id: string;
  index: number;
  hp: number;
  maxHp: number;
  attackGauge: number;
  statusAilment: { type: 'burn' | 'freeze' | 'paralysis'; duration: number; startTime: number } | null;
  defenseShields: number;
  isHealer: boolean;
  isBoss: boolean;
  position: 'A' | 'B' | 'C';
  icon: string;
  name: string;
}

interface FantasyPIXIRendererProps {
  width: number;
  height: number;
  monsterIcon: string;
  isMonsterAttacking: boolean;
  enemyGauge: number;
  onReady?: (instance: FantasyPIXIInstance) => void;
  onMonsterDefeated?: () => void; // 状態機械用コールバック
  onShowMagicName?: (magicName: string, isSpecial: boolean) => void; // 魔法名表示コールバック
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
  isAttacking: boolean;
  isHit: boolean;
  hitColor: number;
  originalColor: number;
  staggerOffset: { x: number; y: number };
  hitCount: number;
  state: MonsterState; // 状態機械の状態
  isFadingOut: boolean;
  fadeOutStartTime: number;
}

// モンスター管理データ
interface ManagedMonster {
  instance: MonsterInstance;
  sprite: PIXI.Sprite;
  visualState: MonsterVisualState;
  gameState: MonsterGameState;
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

interface DamageNumberData {
  text: PIXI.Text;
  startTime: number;
  startY: number;
  velocity: number;
  life: number;
  maxLife: number;
}

interface MagicType {
  name: string; // 通常魔法名
  color: number; // 通常魔法の色
  particleColor: number; // パーティクルの色
  svg: string; // 使用するSVGのパス
  tier2Name: string; // 上位魔法名
  tier2Color: number; // 上位魔法の色
  particleCount: number; // パーティクル数
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
  fire: { // フレア -> インフェルノ
    name: 'フレア',
    color: 0xFF8C00, // オレンジ
    particleColor: 0xFF6B35,
    svg: 'fire.png', // .png に変更
    tier2Name: 'インフェルノ',
    tier2Color: 0xDC143C, // クリムゾン
    particleCount: 20,
  },
  ice: { // フロスト -> ブリザード
    name: 'フロスト',
    color: 0x00BFFF, // ディープスカイブルー
    particleColor: 0xB0E0E6,
    svg: 'ice.png', // .png に変更
    tier2Name: 'ブリザード',
    tier2Color: 0x4169E1, // ロイヤルブルー
    particleCount: 25,
  },
  lightning: { // スパーク -> サンダー・ストライク
    name: 'スパーク',
    color: 0xFFD700, // ゴールド
    particleColor: 0xFFF700,
    svg: 'thunder.png', // .png に変更
    tier2Name: 'サンダー・ストライク',
    tier2Color: 0xFFF8DC, // オフホワイト
    particleCount: 15,
  },
};

// ===== モンスターシンボルマッピング（フラットデザイン） =====
const MONSTER_EMOJI: Record<string, string> = {
  'vampire': '☠', // 頭蓋骨（バンパイア）
  'monster': '🕷', // 蜘蛛（モンスター）
  'reaper': '🎩', // シルクハット（死神）
  'kraken': '👁', // 目玉（クラーケン）
  'werewolf': '🐦', // 鳥（人狼）
  'demon': '🔥',  // 火（悪魔）
  'healer': '✨', // きらめき（ヒーラー）
  'dragon': '🔥', // 火（ドラゴン）
  'ice_queen': '❄️', // 雪の結晶（氷の女王）
  'thunder_bird': '⚡' // 稲妻（雷鳥）
};

// ===== PIXI インスタンスクラス =====
export class FantasyPIXIInstance {
  private app: PIXI.Application;
  private monsterContainer: PIXI.Container;
  private particleContainer: PIXI.Container;
  private effectContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  private backgroundContainer: PIXI.Container;
  private onDefeated?: () => void;
  private onMonsterDefeated?: () => void;
  private onShowMagicName?: (magicName: string, isSpecial: boolean) => void; // 魔法名表示コールバック
  
  // 複数モンスター管理
  private monsters: Map<string, ManagedMonster> = new Map();
  
  // エフェクト管理（既存）
  private particles: Map<string, PIXI.Graphics> = new Map();
  private particleData: Map<string, ParticleData> = new Map();
  private magicCircles: Map<string, PIXI.Graphics> = new Map();
  private magicCircleData: Map<string, MagicCircle> = new Map();
  private damageNumbers: Map<string, PIXI.Text> = new Map();
  private damageData: Map<string, DamageNumberData> = new Map();
  private chordNameText: PIXI.Text | null = null;
  private angerMark: PIXI.Text | null = null;
  
  private currentMagicType: string = 'fire';
  private emojiTextures: Map<string, PIXI.Texture> = new Map();
  private imageTextures: Map<string, PIXI.Texture> = new Map(); // pngテクスチャ用に変更
  
  private isDestroyed: boolean = false;
  private animationFrameId: number | null = null;
  
  // 画面揺れ関連のプロパティ
  private screenShakeState: {
    isActive: boolean;
    intensity: number;
    duration: number;
    elapsed: number;
    originalX: number;
    originalY: number;
  } = {
    isActive: false,
    intensity: 0,
    duration: 0,
    elapsed: 0,
    originalX: 0,
    originalY: 0
  };

  constructor(width: number, height: number, onMonsterDefeated?: () => void, onShowMagicName?: (magicName: string, isSpecial: boolean) => void) {
    // コールバックの保存
    this.onDefeated = onMonsterDefeated;
    this.onMonsterDefeated = onMonsterDefeated; // 状態機械用コールバック
    this.onShowMagicName = onShowMagicName; // 魔法名表示コールバック
    
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
    
    // ソート可能にする
    this.uiContainer.sortableChildren = true;
    
    // z-indexの設定（背景→モンスター→パーティクル→エフェクト→UI）
    this.app.stage.addChild(this.backgroundContainer);
    this.app.stage.addChild(this.monsterContainer);
    this.app.stage.addChild(this.particleContainer);
    this.app.stage.addChild(this.effectContainer);
    this.app.stage.addChild(this.uiContainer);
    
    // 絵文字テクスチャの事前読み込み
    this.loadEmojiTextures();
    this.loadImageTextures(); // メソッド名変更
    
    // アニメーションループ開始
    this.startAnimationLoop();
    
    devLog.debug('✅ ファンタジーPIXI初期化完了（マルチモンスター対応）');
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

  // PNG画像テクスチャの読み込み
  private async loadImageTextures(): Promise<void> {
    try {
      for (const magic of Object.values(MAGIC_TYPES)) {
        // Load from public directory (directly from root)
        const texture = await PIXI.Assets.load(`/${magic.svg}`);
        this.imageTextures.set(magic.svg, texture);
        devLog.debug(`✅ 画像テクスチャ読み込み: /${magic.svg}`);
      }
      devLog.debug('✅ 全画像テクスチャ読み込み完了');
    } catch (error) {
      devLog.debug('❌ 画像テクスチャ読み込みエラー:', error);
    }
  }

  // モンスタースプライトの更新（マルチモンスター対応）
  async updateMonsterSprite(monsterInstance: MonsterInstance): Promise<void> {
    if (this.isDestroyed) return;
    
    try {
      devLog.debug('👾 モンスタースプライト更新:', { 
        id: monsterInstance.id,
        position: monsterInstance.position,
        hp: monsterInstance.hp 
      });
      
      // 既存のモンスターがあるかチェック
      let managedMonster = this.monsters.get(monsterInstance.id);
      
      if (!managedMonster) {
        // 新規作成
        const texture = this.emojiTextures.get(monsterInstance.icon) || PIXI.Texture.WHITE;
        const sprite = new PIXI.Sprite(texture);
        sprite.width = 64;
        sprite.height = 64;
        sprite.anchor.set(0.5);
        sprite.interactive = true;
        sprite.cursor = 'pointer';
        
        // 位置を設定（A, B, C列に応じて）
        const xPositions = {
          'A': this.app.screen.width * 0.25,
          'B': this.app.screen.width * 0.5,
          'C': this.app.screen.width * 0.75
        };
        
        const visualState: MonsterVisualState = {
          x: xPositions[monsterInstance.position],
          y: this.app.screen.height / 2,
          scale: monsterInstance.isBoss ? 1.5 : 1.0,
          rotation: 0,
          tint: 0xFFFFFF,
          alpha: 1.0,
          visible: true
        };
        
        const gameState: MonsterGameState = {
          isAttacking: false,
          isHit: false,
          hitColor: 0xFF6B6B,
          originalColor: 0xFFFFFF,
          staggerOffset: { x: 0, y: 0 },
          hitCount: 0,
          state: 'IDLE',
          isFadingOut: false,
          fadeOutStartTime: 0
        };
        
        sprite.x = visualState.x;
        sprite.y = visualState.y;
        sprite.scale.set(visualState.scale);
        
        managedMonster = {
          instance: monsterInstance,
          sprite,
          visualState,
          gameState
        };
        
        this.monsters.set(monsterInstance.id, managedMonster);
        this.monsterContainer.addChild(sprite);
        
        devLog.debug('✅ 新規モンスター作成:', monsterInstance.id);
      } else {
        // 既存のモンスターの情報を更新
        managedMonster.instance = monsterInstance;
        
        // HPが0になったら撃破処理
        if (monsterInstance.hp <= 0 && managedMonster.gameState.state === 'IDLE') {
          this.triggerMonsterDefeat(monsterInstance.id);
        }
      }
      
      // 状態異常のエフェクト適用
      if (monsterInstance.statusAilment) {
        switch (monsterInstance.statusAilment.type) {
          case 'burn':
            managedMonster.visualState.tint = 0xFF6666;
            break;
          case 'freeze':
            managedMonster.visualState.tint = 0x6666FF;
            break;
          case 'paralysis':
            managedMonster.visualState.tint = 0xFFFF66;
            break;
        }
      } else {
        managedMonster.visualState.tint = 0xFFFFFF;
      }
      
      this.updateMonsterVisual(managedMonster);
      
    } catch (error) {
      devLog.debug('❌ モンスタースプライト更新エラー:', error);
    }
  }

  // モンスターのビジュアル更新
  private updateMonsterVisual(managedMonster: ManagedMonster): void {
    const { sprite, visualState } = managedMonster;
    
    sprite.x = visualState.x;
    sprite.y = visualState.y;
    sprite.scale.set(visualState.scale);
    sprite.rotation = visualState.rotation;
    sprite.tint = visualState.tint;
    sprite.alpha = visualState.alpha;
    sprite.visible = visualState.visible;
  }
  
  // モンスタースプライト作成（旧メソッド、互換性のため残す）
  async createMonsterSprite(icon: string): Promise<void> {
    // 新しいシステムでは使用しない
    devLog.debug('⚠️ createMonsterSprite呼び出し（旧メソッド）');
  }

  // フォールバックモンスター作成
  private createFallbackMonster(): void {
    // 新しいシステムでは不要
  }

  // モンスタースプライトの更新（旧メソッド）
  private updateMonsterSprite(): void {
    // 新しいシステムでは使用しない
  }

  // ▼▼▼ 攻撃成功エフェクトを修正 ▼▼▼
  triggerAttackSuccess(chordName: string, isSpecial: boolean = false, damage: number = 0, hasDefeated: boolean = false): void {
    if (this.isDestroyed) return;
    
    devLog.debug('⚡ 攻撃成功エフェクト:', { 
      chord: chordName, 
      special: isSpecial,
      damage,
      hasDefeated,
      monstersCount: this.monsters.size
    });
    
    // 魔法タイプに基づいてエフェクトを生成
    const magicType = isSpecial ? 'lightning' : this.currentMagicType;
    const magic = MAGIC_TYPES[magicType] || MAGIC_TYPES.fire;
    
    // すべてのモンスターに対してエフェクトを適用
    this.monsters.forEach(managedMonster => {
      if (managedMonster.instance.hp > 0) {
        // ヒットエフェクト
        managedMonster.gameState.isHit = true;
        managedMonster.gameState.hitCount++;
        
        // ダメージ数値表示
        if (damage > 0) {
          this.showDamageNumber(
            managedMonster.visualState.x,
            managedMonster.visualState.y - 50,
            damage,
            isSpecial ? 0xFFD700 : 0xFF4444
          );
        }
        
        // パーティクルエフェクト
        this.createMagicEffect(
          managedMonster.visualState.x,
          managedMonster.visualState.y,
          magic.particleColor,
          isSpecial ? magic.particleCount * 2 : magic.particleCount,
          magicType as any
        );
        
        // ヒット後の処理
        setTimeout(() => {
          managedMonster.gameState.isHit = false;
        }, 300);
      }
    });
    
    // 画面揺れ（SPアタックの場合は強め）
    if (isSpecial) {
      this.screenShake(15, 500);
    } else {
      this.screenShake(5, 200);
    }
    
    // コード名表示
    this.showChordName(chordName, isSpecial);
  }

  // 攻撃失敗エフェクト
  triggerAttackFailure(): void {
    if (this.isDestroyed) return;
    
    devLog.debug('❌ 攻撃失敗エフェクト');
    
    // すべてのモンスターに怒りマーク表示
    this.monsters.forEach(managedMonster => {
      // 怒りマーク表示
      const angerMark = new PIXI.Text('💢', { fontSize: 32 });
      angerMark.anchor.set(0.5);
      angerMark.x = managedMonster.visualState.x + 40;
      angerMark.y = managedMonster.visualState.y - 40;
      this.uiContainer.addChild(angerMark);
      
      setTimeout(() => {
        this.uiContainer.removeChild(angerMark);
        angerMark.destroy();
      }, 1000);
    });
    
    // 画面揺れ
    this.screenShake(3, 200);
  }

  // PNG画像魔法エフェクト作成
  private createImageMagicEffect(imagePath: string, color: number, isSpecial: boolean): void {
    // 状態ガード：モンスターが存在しない場合は何もしない
    if (!this.monsterSprite || !this.monsterSprite.visible) {
      devLog.debug(`⚠️ 魔法エフェクト生成スキップ: モンスター非表示`);
      return;
    }

    const texture = this.imageTextures.get(imagePath);
    if (!texture) {
      devLog.debug(`⚠️ 画像テクスチャが見つかりません: ${imagePath}`);
      return;
    }

    const count = isSpecial ? 3 : 1;
    for (let i = 0; i < count; i++) {
      try {
        const magicSprite = new PIXI.Sprite(texture);
        
        // 基本的な安全チェック
        if (!magicSprite || !magicSprite.anchor) {
          devLog.debug('⚠️ 魔法スプライト作成失敗');
          continue;
        }
        
        magicSprite.anchor.set(0.5);
        
        // 画面の下から敵に向かって飛ぶように初期位置を設定
        const startX = this.app.screen.width / 2 + (Math.random() - 0.5) * 200;
        const startY = this.app.screen.height - 100;
        magicSprite.x = startX;
        magicSprite.y = startY;
        
        magicSprite.tint = color;
        magicSprite.alpha = 0.8;
        magicSprite.scale.set(0.3); // 初期サイズを小さく
        
        // コンテナに追加する前にコンテナの状態を確認
        if (!this.effectContainer || this.effectContainer.destroyed) {
          magicSprite.destroy();
          return;
        }
        
        this.effectContainer.addChild(magicSprite);

        // アニメーション - 敵に向かって飛ぶ
        let life = 800; // アニメーション時間を短く
        const targetX = this.monsterVisualState.x + (isSpecial ? (Math.random() - 0.5) * 80 : 0);
        const targetY = this.monsterVisualState.y + (isSpecial ? (Math.random() - 0.5) * 40 : 0);
        // startXとstartYは既に上で宣言されているため、ここでは削除
        
        const animate = () => {
          if (this.isDestroyed || !magicSprite || magicSprite.destroyed) {
            return;
          }
          
          if (life > 0) {
            try {
              life -= 16;
              const progress = 1 - (life / 800);
              
              if (!magicSprite.destroyed && (magicSprite as any).transform) {
                // 放物線を描いて敵に向かう
                const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
                magicSprite.x = startX + (targetX - startX) * easeProgress;
                
                // Y座標は放物線
                const arcHeight = -100; // 弧の高さ
                const baseY = startY + (targetY - startY) * easeProgress;
                const arc = arcHeight * 4 * progress * (1 - progress);
                magicSprite.y = baseY + arc;
                
                // サイズと透明度の調整
                magicSprite.scale.set(0.3 + progress * 0.2); // 最大0.5まで
                magicSprite.alpha = 0.8 * (1 - progress * 0.3); // 徐々に薄く
                
                // 回転アニメーション
                magicSprite.rotation += 0.2;
              }
              requestAnimationFrame(animate);
            } catch (error) {
              devLog.debug('⚠️ 魔法エフェクトアニメーションエラー:', error);
              // エラー時は安全にスプライトを削除
              if (magicSprite && !magicSprite.destroyed) {
                if (magicSprite.parent) {
                  magicSprite.parent.removeChild(magicSprite);
                }
                magicSprite.destroy();
              }
            }
          } else {
            // アニメーション終了時の安全な削除
            try {
              if (!magicSprite.destroyed) {
                // ヒットエフェクトを作成
                this.createHitParticles(targetX, targetY, color);
                
                if (magicSprite.parent) {
                  magicSprite.parent.removeChild(magicSprite);
                }
                magicSprite.destroy();
              }
            } catch (error) {
              devLog.debug('⚠️ 魔法エフェクト削除エラー:', error);
            }
          }
        };
        setTimeout(animate, i * 100); // SPアタック時は少しずらして表示
      } catch (error) {
        devLog.debug('⚠️ SVG魔法エフェクト作成エラー:', error);
      }
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

  // ヒットパーティクル作成（魔法が敵に当たった時のエフェクト）
  private createHitParticles(x: number, y: number, color: number): void {
    if (this.isDestroyed) return;
    
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
      const id = `hit_${Date.now()}_${i}`;
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      
      const particle = new PIXI.Graphics();
      const size = 2 + Math.random() * 4;
      
      particle.beginFill(color);
      particle.drawCircle(0, 0, size);
      particle.endFill();
      particle.x = x;
      particle.y = y;
      
      this.effectContainer.addChild(particle);
      this.particles.set(id, particle);
      
      this.particleData.set(id, {
        id,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500,
        maxLife: 500,
        size,
        color,
        alpha: 1,
        type: 'sparkle'
      });
    }
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

  // 画面震動エフェクト（setTimeout を使わない安全な実装）
  private createScreenShake(intensity: number, duration: number): void {
    if (this.isDestroyed) return;
    
    this.screenShakeState = {
      isActive: true,
      intensity,
      duration,
      elapsed: 0,
      originalX: this.app.stage.x,
      originalY: this.app.stage.y
    };
  }

  // 画面揺れの更新（アニメーションループから呼び出し）
  private updateScreenShake(): void {
    if (this.isDestroyed || !this.screenShakeState.isActive) return;
    
    this.screenShakeState.elapsed += 16; // 約60FPSで16ms刻み
    
    if (this.screenShakeState.elapsed >= this.screenShakeState.duration) {
      // 揺れ終了：元の位置に戻す
      this.app.stage.x = this.screenShakeState.originalX;
      this.app.stage.y = this.screenShakeState.originalY;
      this.screenShakeState.isActive = false;
      return;
    }
    
    // 揺れの強度を時間経過とともに減衰
    const progress = this.screenShakeState.elapsed / this.screenShakeState.duration;
    const currentIntensity = this.screenShakeState.intensity * (1 - progress);
    
    // ランダムなオフセットを適用
    this.app.stage.x = this.screenShakeState.originalX + (Math.random() - 0.5) * currentIntensity;
    this.app.stage.y = this.screenShakeState.originalY + (Math.random() - 0.5) * currentIntensity;
  }

  // ダメージ数値表示
  private createDamageNumber(damage: number, color: number): void {
    const id = `damage_${Date.now()}_${Math.random()}`;
    
    const damageText = new PIXI.Text(damage.toString(), {
      fontSize: 36, // 少し大きくして見やすく
      fill: 0xFFFFFF, // ダメージ数値は白で統一
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 4, // 縁取りを太く
      dropShadow: true,
      dropShadowBlur: 4,
      dropShadowDistance: 2
    });
    
    damageText.anchor.set(0.5);
    // モンスターの少し上に表示し、左右のランダム幅を狭める
    damageText.x = this.monsterVisualState.x + (Math.random() - 0.5) * 30;
    damageText.y = this.monsterVisualState.y - 50; // モンスターの上に表示
    damageText.zIndex = 1000; // 最前面に表示
    
    this.uiContainer.addChild(damageText);
    this.damageNumbers.set(id, damageText);
    this.damageData.set(id, {
      text: damageText,
      startTime: Date.now(),
      startY: damageText.y,
      velocity: -2 - Math.random() * 1, // ゆっくり上昇
      life: 1500, // 表示時間を延長
      maxLife: 1500
    });
  }

  // コード名とチェックマーク表示
  private showChordWithCheckmark(chordName: string): void {
    // 既存のコードテキストを削除
    if (this.chordNameText) {
      this.effectContainer.removeChild(this.chordNameText);
      this.chordNameText = null;
    }
    
    // コード名とチェックマークのテキスト作成
    this.chordNameText = new PIXI.Text(`✓ ${chordName}`, {
      fontFamily: 'DotGothic16, "DotGothic16", Gothic16, Arial, sans-serif',
      fontSize: 48,
      fontWeight: 'bold',
      fill: 0x00FF00, // 緑色
      stroke: 0x000000,
      strokeThickness: 4,
      align: 'center'
    });
    
    // 位置設定（画面中央）
    this.chordNameText.x = this.app.screen.width / 2;
    this.chordNameText.y = this.app.screen.height / 2;
    this.chordNameText.anchor.set(0.5);
    
    // スケールアニメーション用の初期値
    this.chordNameText.scale.set(0.5);
    
    this.effectContainer.addChild(this.chordNameText);
    
    // スケールアップアニメーション
    const scaleUp = () => {
      if (this.chordNameText && !this.isDestroyed) {
        if (this.chordNameText.scale.x < 1.2) {
          this.chordNameText.scale.x += 0.05;
          this.chordNameText.scale.y += 0.05;
          requestAnimationFrame(scaleUp);
        } else {
          // スケールダウン
          const scaleDown = () => {
            if (this.chordNameText && !this.isDestroyed) {
              if (this.chordNameText.scale.x > 1.0) {
                this.chordNameText.scale.x -= 0.02;
                this.chordNameText.scale.y -= 0.02;
                requestAnimationFrame(scaleDown);
              }
            }
          };
          scaleDown();
        }
      }
    };
    scaleUp();
    
    // 3秒後に削除
    setTimeout(() => {
      if (this.chordNameText && !this.isDestroyed) {
        this.effectContainer.removeChild(this.chordNameText);
        this.chordNameText = null;
      }
    }, 3000);
    
    devLog.debug('✅ コード名表示:', { chordName });
  }

  // モンスターのフェードアウトアニメーション
  private startMonsterFadeOut(): void {
    if (this.isDestroyed) return;
    
    const fadeOut = () => {
      // 状態ガード: 消滅中でない場合は停止
      if (this.isDestroyed || this.monsterGameState.state !== 'FADING_OUT') return;
      
      // アルファ値を減少
      this.monsterVisualState.alpha -= 0.05;
      
      // スプライトを更新
      this.updateMonsterSprite();
      
      // フェードアウト完了判定
      if (this.monsterVisualState.alpha <= 0) {
        this.monsterVisualState.alpha = 0;
        this.monsterVisualState.visible = false;
        this.setMonsterState('GONE');
      } else {
        requestAnimationFrame(fadeOut);
      }
    };
    
    fadeOut();
  }

  // ▼▼▼ 修正点: 不要になったため関数ごと削除 ▼▼▼
  // private resetMonsterState(): void { ... }

  // 魔法パーティクル作成
  private createMagicParticles(magic: MagicType, isSpecial: boolean): void {
    const particleCount = magic.particleCount * (isSpecial ? 3 : 1);

    for (let i = 0; i < particleCount; i++) {
      const id = `particle_${Date.now()}_${i}`;
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      
      const particle = new PIXI.Graphics();
      const size = (3 + Math.random() * 5) * (isSpecial ? 1.5 : 1);
      
      particle.beginFill(magic.particleColor);
      particle.drawCircle(0, 0, size);
      particle.endFill();
      
      particle.x = this.monsterVisualState.x;
      particle.y = this.monsterVisualState.y;
      
      this.effectContainer.addChild(particle);
      
      // パーティクルアニメーション
      let life = 1000;
      const animate = () => {
        if (life > 0 && !particle.destroyed) {
          life -= 16;
          particle.x += Math.cos(angle) * speed;
          particle.y += Math.sin(angle) * speed;
          particle.alpha = life / 1000;
          particle.scale.set(particle.scale.x * 0.98);
          requestAnimationFrame(animate);
        } else if (!particle.destroyed) {
          this.effectContainer.removeChild(particle);
          particle.destroy();
        }
      };
      animate();
    }
  }

  // モンスター攻撃状態更新
  updateMonsterAttacking(isAttacking: boolean): void {
    this.monsters.forEach(managedMonster => {
      managedMonster.gameState.isAttacking = isAttacking;
      
      if (isAttacking) {
        // 攻撃エフェクト
        this.animateStagger(managedMonster);
        this.screenShake(8, 300);
      }
    });
  }

  // 特定のモンスターの攻撃
  triggerMonsterAttack(monsterId: string): void {
    const managedMonster = this.monsters.get(monsterId);
    if (!managedMonster) return;
    
    managedMonster.gameState.isAttacking = true;
    this.animateStagger(managedMonster);
    
    setTimeout(() => {
      managedMonster.gameState.isAttacking = false;
    }, 600);
  }

  // モンスター撃破処理
  private triggerMonsterDefeat(monsterId: string): void {
    const managedMonster = this.monsters.get(monsterId);
    if (!managedMonster || managedMonster.gameState.state !== 'IDLE') return;
    
    managedMonster.gameState.state = 'DEFEATED';
    managedMonster.gameState.isFadingOut = true;
    managedMonster.gameState.fadeOutStartTime = Date.now();
    
    // 撃破エフェクト
    this.createExplosionEffect(
      managedMonster.visualState.x,
      managedMonster.visualState.y,
      30
    );
    
    // フェードアウト
    setTimeout(() => {
      this.monsterContainer.removeChild(managedMonster.sprite);
      this.monsters.delete(monsterId);
      devLog.debug('👾 モンスター削除完了:', monsterId);
    }, 1000);
  }

  // よろめきアニメーション（個別モンスター対応）
  private animateStagger(managedMonster: ManagedMonster): void {
    const staggerIntensity = 5;
    const duration = 200;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        managedMonster.gameState.staggerOffset = { x: 0, y: 0 };
        return;
      }
      
      const progress = elapsed / duration;
      const intensity = staggerIntensity * (1 - progress);
      
      managedMonster.gameState.staggerOffset = {
        x: (Math.random() - 0.5) * intensity,
        y: (Math.random() - 0.5) * intensity
      };
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  // アニメーションループ
  private animateFrame = (currentTime: number): void => {
    if (this.isDestroyed) return;
    
    // モンスターアニメーション
    this.monsters.forEach(managedMonster => {
      // よろめき効果
      if (managedMonster.gameState.isAttacking || managedMonster.gameState.isHit) {
        managedMonster.sprite.x = managedMonster.visualState.x + managedMonster.gameState.staggerOffset.x;
        managedMonster.sprite.y = managedMonster.visualState.y + managedMonster.gameState.staggerOffset.y;
      } else {
        managedMonster.sprite.x = managedMonster.visualState.x;
        managedMonster.sprite.y = managedMonster.visualState.y;
      }
      
      // フェードアウト処理
      if (managedMonster.gameState.isFadingOut) {
        const elapsed = currentTime - managedMonster.gameState.fadeOutStartTime;
        const fadeProgress = Math.min(elapsed / 1000, 1);
        managedMonster.sprite.alpha = 1 - fadeProgress;
      }
      
      // ボスのアニメーション（拡大縮小）
      if (managedMonster.instance.isBoss) {
        const scale = managedMonster.visualState.scale + Math.sin(currentTime * 0.002) * 0.05;
        managedMonster.sprite.scale.set(scale);
      }
    });
    
    // 既存のアニメーション処理
    this.updateParticles();
    this.updateMagicCircles();
    this.updateDamageNumbers();
    this.updateScreenShake();
    
    this.animationFrameId = requestAnimationFrame(this.animateFrame);
  };

  // アニメーションループ
  private startAnimationLoop(): void {
    const animate = () => {
      if (this.isDestroyed) return;
      
      this.updateMonsterAnimation();
      this.updateParticles();
      this.updateMagicCircles();
      this.updateDamageNumbers();
      this.updateScreenShake(); // 画面揺れの更新を追加
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  // モンスターアニメーション更新
  private updateMonsterAnimation(): void {
    if (this.isDestroyed) return;
    
    try {
      // フェードアウト中は位置を固定
      if (!this.monsterGameState.isFadingOut) {
        // よろけ効果の適用（ビジュアル状態を更新）
        this.monsterVisualState.x = (this.app.screen.width / 2) + this.monsterGameState.staggerOffset.x;
        this.monsterVisualState.y = (this.app.screen.height / 2 - 20) + this.monsterGameState.staggerOffset.y;
      }
      
      // 色変化の適用
      this.monsterVisualState.tint = this.monsterGameState.isHit 
        ? this.monsterGameState.hitColor 
        : this.monsterGameState.originalColor;
      
      // アイドル時の軽い浮遊効果
      if (this.monsterGameState.state === 'IDLE' && !this.monsterGameState.isAttacking) {
        this.monsterVisualState.y = (this.app.screen.height / 2 - 20) + Math.sin(Date.now() * 0.002) * 8;
      }
      
      // よろけ効果の減衰
      this.monsterGameState.staggerOffset.x *= 0.9;
      this.monsterGameState.staggerOffset.y *= 0.9;
      
      // フェードアウト処理
      if (this.monsterGameState.isFadingOut) {
        this.monsterVisualState.alpha -= 0.05;
        if (this.monsterVisualState.alpha <= 0) {
          this.monsterVisualState.alpha = 0;
          this.monsterVisualState.visible = false;
        }
      }
      
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
      if (!graphics || graphics.destroyed) {
        // 削除されたグラフィックスの参照をクリーンアップ
        this.magicCircles.delete(id);
        this.magicCircleData.delete(id);
        continue;
      }
      
      try {
        const progress = 1 - (circleData.life / circleData.maxLife);
        circleData.radius = 120 * Math.sin(progress * Math.PI);
        circleData.rotation += 0.05;
        circleData.alpha = Math.sin(progress * Math.PI) * 0.9;
        circleData.life -= 16;
        
        // 魔法陣を描画（nullチェック強化）
        if (graphics.transform && !graphics.destroyed && graphics.clear) {
          graphics.clear();
          if (graphics.lineStyle && graphics.drawCircle) {
            graphics.lineStyle(4, circleData.color, circleData.alpha);
            graphics.drawCircle(0, 0, circleData.radius);
            graphics.lineStyle(2, circleData.color, circleData.alpha * 0.6);
            graphics.drawCircle(0, 0, circleData.radius * 0.7);
            graphics.rotation = circleData.rotation;
          }
        }
        
        // 削除判定
        if (circleData.life <= 0) {
          try {
            if (graphics.parent) {
              graphics.parent.removeChild(graphics);
            }
            if (typeof graphics.destroy === 'function') {
              graphics.destroy();
            }
          } catch (destroyError) {
            devLog.debug('⚠️ 魔法陣削除エラー:', destroyError);
          }
          this.magicCircles.delete(id);
          this.magicCircleData.delete(id);
        }
      } catch (error) {
        // エラー時は安全にグラフィックスを削除
        devLog.debug('⚠️ 魔法陣更新エラー:', error);
        try {
          if (graphics && !graphics.destroyed) {
            if (graphics.parent) {
              graphics.parent.removeChild(graphics);
            }
            if (typeof graphics.destroy === 'function') {
              graphics.destroy();
            }
          }
        } catch (cleanupError) {
          devLog.debug('⚠️ 魔法陣クリーンアップエラー:', cleanupError);
        }
        this.magicCircles.delete(id);
        this.magicCircleData.delete(id);
      }
    }
  }

  // パーティクル更新
  private updateParticles(): void {
    const toRemove: string[] = [];
    
    this.particleData.forEach((data, id) => {
      data.life -= 16;
      
      if (data.life <= 0) {
        toRemove.push(id);
        return;
      }
      
      data.x += data.vx;
      data.y += data.vy;
      
      if (data.type === 'explosion') {
        data.vy += 0.3;
      }
      
      const particle = this.particles.get(id);
      if (particle) {
        particle.x = data.x;
        particle.y = data.y;
        particle.alpha = data.life / data.maxLife;
      }
    });
    
    toRemove.forEach(id => {
      const particle = this.particles.get(id);
      if (particle) {
        this.particleContainer.removeChild(particle);
        particle.destroy();
      }
      this.particles.delete(id);
      this.particleData.delete(id);
    });
  }

  // ダメージ数値更新
  private updateDamageNumbers(): void {
    const toRemove: string[] = [];
    
    this.damageData.forEach((data, id) => {
      data.life -= 16;
      
      if (data.life <= 0) {
        toRemove.push(id);
        return;
      }
      
      const progress = 1 - (data.life / data.maxLife);
      data.text.y = data.startY - progress * 50;
      data.text.alpha = data.life / data.maxLife;
      data.text.scale.set(1 + progress * 0.5);
    });
    
    toRemove.forEach(id => {
      const text = this.damageNumbers.get(id);
      if (text) {
        this.uiContainer.removeChild(text);
        text.destroy();
      }
      this.damageNumbers.delete(id);
      this.damageData.delete(id);
    });
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
    devLog.debug('🧹 FantasyPIXI破棄開始');
    this.isDestroyed = true;
    
    // アニメーションループ停止
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // モンスターのクリーンアップ
    this.monsters.forEach(managedMonster => {
      this.monsterContainer.removeChild(managedMonster.sprite);
      managedMonster.sprite.destroy();
    });
    this.monsters.clear();
    
    // 既存のクリーンアップ処理
    this.particles.forEach(particle => particle.destroy());
    this.particles.clear();
    this.particleData.clear();
    
    this.magicCircles.forEach(circle => circle.destroy());
    this.magicCircles.clear();
    this.magicCircleData.clear();
    
    this.damageNumbers.forEach(text => text.destroy());
    this.damageNumbers.clear();
    this.damageData.clear();
    
    if (this.chordNameText) {
      this.chordNameText.destroy();
      this.chordNameText = null;
    }
    
    if (this.angerMark) {
      this.angerMark.destroy();
      this.angerMark = null;
    }
    
    // テクスチャの破棄
    this.emojiTextures.forEach(texture => texture.destroy());
    this.emojiTextures.clear();
    
    this.imageTextures.forEach(texture => texture.destroy());
    this.imageTextures.clear();
    
    // PIXIアプリケーションの破棄
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
    
    devLog.debug('✅ FantasyPIXI破棄完了');
  }

  // 状態機械: モンスターの状態を安全に遷移させる
  private setMonsterState(newState: MonsterState): void {
    if (this.monsterGameState.state === newState) return;

    devLog.debug(`👾 Monster state changed: ${this.monsterGameState.state} -> ${newState}`, {
      previousState: this.monsterGameState.state,
      newState: newState,
      hitCount: this.monsterGameState.hitCount,
      isDestroyed: this.isDestroyed
    });
    
    this.monsterGameState.state = newState;

    // 新しい状態に応じた処理をトリガー
    if (newState === 'FADING_OUT') {
      devLog.debug('💀 モンスター消滅アニメーション開始');
      this.startMonsterFadeOut();
    } else if (newState === 'GONE') {
      devLog.debug('💀 モンスター完全消滅、親コンポーネントに通知', {
        hasCallback: !!this.onDefeated,
        isDestroyed: this.isDestroyed
      });

      // ▼▼▼ 追加 ▼▼▼
      // 完全に消えたら、スプライトを安全に非表示にする
      if (this.monsterSprite && !this.monsterSprite.destroyed) {
        this.monsterSprite.visible = false;
      }
      // ▲▲▲ ここまで ▲▲▲

      // 親コンポーネントに通知
      // isDestroyedフラグをチェックして、インスタンス破棄後のコールバック呼び出しを防ぐ
      if (!this.isDestroyed) {
        this.onDefeated?.();
      } 
    }
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
  onMonsterDefeated,
  onShowMagicName,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pixiInstance, setPixiInstance] = useState<FantasyPIXIInstance | null>(null);

  // PIXI初期化
  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new FantasyPIXIInstance(width, height, onMonsterDefeated, onShowMagicName);
    containerRef.current.appendChild(instance.getCanvas());
    
    setPixiInstance(instance);
    onReady?.(instance);

    return () => {
      instance.destroy();
    };
  }, [width, height, onReady, onMonsterDefeated, onShowMagicName]);

  // モンスターアイコン変更（状態機械による安全な生成）
  useEffect(() => {
    if (pixiInstance) {
      // 状態機械のガード処理により、適切なタイミングでのみモンスターが生成される
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