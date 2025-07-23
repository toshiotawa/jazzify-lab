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
  private onDefeated?: () => void;
  private onMonsterDefeated?: () => void;
  private onShowMagicName?: (magicName: string, isSpecial: boolean) => void; // 魔法名表示コールバック
  
  // モンスタースプライトは常に存在する（表示/非表示で制御）
  private monsterSprite: PIXI.Sprite;
  private monsterVisualState: MonsterVisualState;
  private monsterGameState: MonsterGameState;
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

  // 状態機械
  private monsterStateMachine = new MonsterStateMachine();


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
      isAttacking: false,
      isHit: false,
      hitColor: 0xFF6B6B,
      originalColor: 0xFFFFFF,
      staggerOffset: { x: 0, y: 0 },
      hitCount: 0,
      // ▼▼▼ 修正点 ▼▼▼
      // 初期状態を「存在しない(GONE)」にして、最初のモンスターが生成できるようにする
      state: 'GONE' as MonsterState,
      isFadingOut: false,
      fadeOutStartTime: 0
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
    this.loadImageTextures(); // メソッド名変更
    
    // アニメーションループ開始
    this.startAnimationLoop();
    
    devLog.debug('✅ ファンタジーPIXI初期化完了（状態機械対応）');
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

  // ▼▼▼ モンスタースプライト作成（SVGベース）を修正 ▼▼▼
  async createMonsterSprite(icon: string): Promise<void> {
    // 状態ガード: 前のモンスターが完全に消えるまで生成しない
    if (this.monsterGameState.state !== 'GONE' && this.monsterGameState.state !== undefined) {
      // undefinedは初回生成時のみ許容
      devLog.debug('⚠️ モンスター生成スキップ: 前のモンスターがまだ存在中', {
        currentState: this.monsterGameState.state
      });
      return; 
    }
    
    if (this.isDestroyed) return;
    
    try {
      devLog.debug('👾 モンスタースプライト作成開始:', { icon });
      
      // 既存のテクスチャをクリア
      if (this.monsterSprite.texture && this.monsterSprite.texture !== PIXI.Texture.WHITE) {
        this.monsterSprite.texture.destroy(true);
      }
      
      // 絵文字テクスチャを取得
      const texture = this.emojiTextures.get(icon);
      
      if (texture && !texture.destroyed && texture.width && texture.height) {
        this.monsterSprite.texture = texture;
        devLog.debug('✅ 絵文字テクスチャ適用:', { icon });
      } else {
        devLog.debug('⚠️ 絵文字テクスチャが見つからないか無効、フォールバック作成:', { icon });
        this.createFallbackMonster();
      }
      
      // ビジュアル状態をリセット
      this.monsterVisualState = {
        ...this.monsterVisualState,
        alpha: 1.0,
        visible: true,
        tint: 0xFFFFFF,
        scale: 1.0
      };
      
      // ゲーム状態をリセット
      this.monsterGameState.hitCount = 0;
      this.monsterGameState.state = 'IDLE';
      
      this.updateMonsterSprite();
      
      devLog.debug('✅ モンスタースプライト作成完了:', { icon });
      
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
      !(this.monsterSprite as any).transform ||
      !this.monsterSprite.texture ||
      this.monsterSprite.texture.destroyed
    ) {
      return; // 破棄済みまたは異常状態の場合は更新しない
    }
    
    try {
      // ビジュアル状態を適用
      this.monsterSprite.x = this.monsterVisualState.x;
      this.monsterSprite.y = this.monsterVisualState.y;
      this.monsterSprite.scale.set(this.monsterVisualState.scale);
      this.monsterSprite.rotation = this.monsterVisualState.rotation;
      this.monsterSprite.tint = this.monsterVisualState.tint;
      this.monsterSprite.alpha = this.monsterVisualState.alpha;
      this.monsterSprite.visible = this.monsterVisualState.visible;
    } catch (error) {
      devLog.debug('⚠️ モンスタースプライト更新エラー:', error);
      // エラーが発生した場合はスプライトを非表示にして安全性を確保
      if (this.monsterSprite && !this.monsterSprite.destroyed) {
        this.monsterSprite.visible = false;
      }
    }
  }

  // ▼▼▼ 攻撃成功エフェクトを修正 ▼▼▼
  triggerAttackSuccess(chordName: string | undefined, isSpecial: boolean, damageDealt: number, defeated: boolean): void { // ★ 4番目の引数 defeated を受け取る
    // 状態ガード: 消滅中または完全消滅中は何もしない
    if (this.isDestroyed || this.monsterGameState.state === 'FADING_OUT' || this.monsterGameState.state === 'GONE') {
      return;
    }

    try {
      // 魔法タイプをローテーション
      const magicTypes = Object.keys(MAGIC_TYPES);
      const currentIndex = magicTypes.indexOf(this.currentMagicType);
      this.currentMagicType = magicTypes[(currentIndex + 1) % magicTypes.length];
      const magic = MAGIC_TYPES[this.currentMagicType];

      // 魔法名表示
      const magicName = isSpecial ? magic.tier2Name : magic.name;
      const magicColor = isSpecial ? magic.tier2Color : magic.color;
      
      // HTMLでの表示のためコールバックを呼び出す
      if (this.onShowMagicName) {
        this.onShowMagicName(magicName, isSpecial);
      }

      this.monsterGameState.isHit = true;
      this.monsterGameState.hitColor = magicColor;

      // 5発目の場合はよろめきエフェクトを無効化
      if (this.monsterGameState.hitCount < 4) {
        this.monsterGameState.staggerOffset = {
          x: (Math.random() - 0.5) * 30,
          y: (Math.random() - 0.5) * 15
        };
      } else {
        // 5発目はよろめかない
        this.monsterGameState.staggerOffset = { x: 0, y: 0 };
      }

      // ダメージ数値を表示（エンジンから渡された値を使用）
      this.createDamageNumber(damageDealt, magicColor);

      this.createImageMagicEffect(magic.svg, magicColor, isSpecial);
      this.createMagicParticles(magic, isSpecial);

      // 状態を更新
      this.monsterGameState.hitCount++;

      // ★ 修正点: 内部のHP判定を削除し、引数の defeated を使う
      if (defeated) {
        this.setMonsterState('FADING_OUT');
      }

      devLog.debug('⚔️ 攻撃成功:', { 
        magic: magic.name, 
        damage: damageDealt,
        defeated: defeated, // ログにも追加
        hitCount: this.monsterGameState.hitCount, 
        state: this.monsterGameState.state
      });

    } catch (error) {
      devLog.debug('❌ 攻撃成功エフェクトエラー:', error);
    }
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
    // 状態ガード
    if (this.isDestroyed || !this.monsterSprite || this.monsterSprite.destroyed) return;

    this.monsterGameState.isAttacking = isAttacking;

    if (isAttacking) {
      this.monsterVisualState.tint = 0xFF6B6B;
      this.monsterVisualState.scale = 1.2; // 少し大きくなる
      this.updateMonsterSprite();

      // 怒りマーク表示
      if (!this.angerMark) {
        this.angerMark = new PIXI.Text('💢', { fontSize: 48 });
        this.angerMark.anchor.set(0.5);
        this.uiContainer.addChild(this.angerMark);
      } 
      this.angerMark.x = this.monsterVisualState.x + 60; // 右に表示
      this.angerMark.y = this.monsterVisualState.y - 60;
      this.angerMark.visible = true;

      setTimeout(() => {
        if (!this.isDestroyed) {
          this.monsterVisualState.tint = 0xFFFFFF;
          this.monsterVisualState.scale = 1.0; // 元の大きさに戻る
          this.updateMonsterSprite();
          if (this.angerMark) {
            this.angerMark.visible = false;
          }
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
    if (this.isDestroyed) return;
    
    for (const [id, particleData] of this.particleData.entries()) {
      const particle = this.particles.get(id);
      if (!particle || particle.destroyed) {
        // 削除されたパーティクルの参照をクリーンアップ
        this.particles.delete(id);
        this.particleData.delete(id);
        continue;
      }
      
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
          if (particleData.type === 'explosion' && particle.scale && particle.scale.set) {
            const scale = 1 + (1 - particleData.alpha) * 0.5;
            particle.scale.set(scale);
          }
        }
        
        // 削除判定
        if (particleData.life <= 0) {
          try {
            if (particle.parent) {
              particle.parent.removeChild(particle);
            }
            if (typeof particle.destroy === 'function') {
              particle.destroy();
            }
          } catch (destroyError) {
            devLog.debug('⚠️ パーティクル削除エラー:', destroyError);
          }
          this.particles.delete(id);
          this.particleData.delete(id);
        }
      } catch (error) {
        // エラー時は安全にパーティクルを削除
        devLog.debug('⚠️ パーティクル更新エラー:', error);
        try {
          if (particle && !particle.destroyed) {
            if (particle.parent) {
              particle.parent.removeChild(particle);
            }
            if (typeof particle.destroy === 'function') {
              particle.destroy();
            }
          }
        } catch (cleanupError) {
          devLog.debug('⚠️ パーティクルクリーンアップエラー:', cleanupError);
        }
        this.particles.delete(id);
        this.particleData.delete(id);
      }
    }
  }

  // ダメージ数値更新
  private updateDamageNumbers(): void {
    if (this.isDestroyed) return;
    
    for (const [id, damageNumberData] of this.damageData.entries()) {
      const damageText = this.damageNumbers.get(id);
      if (!damageText || damageText.destroyed) {
        // 削除されたテキストの参照をクリーンアップ
        this.damageNumbers.delete(id);
        this.damageData.delete(id);
        continue;
      }
      
      try {
        // 上昇アニメーション
        const elapsedTime = 1500 - damageNumberData.life;
        damageNumberData.life -= 16; // 60FPS想定
        
        // スプライト更新（nullチェック強化）
        if (damageText.transform && !damageText.destroyed) {
          // ゆっくり上に移動
          damageText.y = damageNumberData.startY + damageNumberData.velocity * (elapsedTime / 16);
          
          // フェードアウト（最初の500msは不透明、その後フェードアウト）
          if (elapsedTime < 500) {
            damageText.alpha = 1;
          } else {
            damageText.alpha = (damageNumberData.life - 0) / (damageNumberData.maxLife - 500);
          }
          
          // 少しだけ拡大
          const scaleProgress = Math.min(elapsedTime / 1000, 1);
          damageText.scale.set(1 + scaleProgress * 0.3);
        }
        
        // 削除判定
        if (damageNumberData.life <= 0) {
          try {
            if (damageText.parent) {
              damageText.parent.removeChild(damageText);
            }
            if (typeof damageText.destroy === 'function') {
              damageText.destroy();
            }
          } catch (destroyError) {
            devLog.debug('⚠️ ダメージ数値削除エラー:', destroyError);
          }
          this.damageNumbers.delete(id);
          this.damageData.delete(id);
        }
      } catch (error) {
        // エラー時は安全にテキストを削除
        devLog.debug('⚠️ ダメージ数値更新エラー:', error);
        try {
          if (damageText && !damageText.destroyed) {
            if (damageText.parent) {
              damageText.parent.removeChild(damageText);
            }
            if (typeof damageText.destroy === 'function') {
              damageText.destroy();
            }
          }
        } catch (cleanupError) {
          devLog.debug('⚠️ ダメージ数値クリーンアップエラー:', cleanupError);
        }
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
    
    // パーティクルとエフェクトの安全な削除
    try {
      this.particles.forEach((particle, id) => {
        try {
          if (particle && typeof particle.destroy === 'function' && !particle.destroyed) {
            if (particle.parent) {
              particle.parent.removeChild(particle);
            }
            particle.destroy();
          }
        } catch (error) {
          devLog.debug(`⚠️ パーティクル削除エラー ${id}:`, error);
        }
      });
      this.particles.clear();
      this.particleData.clear();
      
      this.magicCircles.forEach((circle, id) => {
        try {
          if (circle && typeof circle.destroy === 'function' && !circle.destroyed) {
            if (circle.parent) {
              circle.parent.removeChild(circle);
            }
            circle.destroy();
          }
        } catch (error) {
          devLog.debug(`⚠️ 魔法陣削除エラー ${id}:`, error);
        }
      });
      this.magicCircles.clear();
      this.magicCircleData.clear();
      
      this.damageNumbers.forEach((text, id) => {
        try {
          if (text && typeof text.destroy === 'function' && !text.destroyed) {
            if (text.parent) {
              text.parent.removeChild(text);
            }
            text.destroy();
          }
        } catch (error) {
          devLog.debug(`⚠️ ダメージ数値削除エラー ${id}:`, error);
        }
      });
      this.damageNumbers.clear();
      this.damageData.clear();
    } catch (error) {
      devLog.debug('⚠️ エフェクト削除エラー:', error);
    }
    
    // テクスチャクリーンアップ
    try {
      this.emojiTextures.forEach((texture: PIXI.Texture) => {
        try {
          if (texture && typeof texture.destroy === 'function' && !texture.destroyed) {
            texture.destroy(true);
          }
        } catch (error) {
          devLog.debug('⚠️ 絵文字テクスチャ削除エラー:', error);
        }
      });
      this.emojiTextures.clear();
      
      this.imageTextures.forEach((texture: PIXI.Texture) => {
        try {
          if (texture && typeof texture.destroy === 'function' && !texture.destroyed) {
            texture.destroy(true);
          }
        } catch (error) {
          devLog.debug('⚠️ 画像テクスチャ削除エラー:', error);
        }
      });
      this.imageTextures.clear();
    } catch (error) {
      devLog.debug('⚠️ テクスチャクリーンアップエラー:', error);
    }
    
    // PIXIアプリケーションの破棄
    if (this.app) {
      try {
        this.app.destroy(true, { children: true });
      } catch (error) {
        devLog.debug('⚠️ PIXI破棄エラー:', error);
      }
    }
    
    devLog.debug('🗑️ FantasyPIXI破棄完了');
  }

  // 状態機械: モンスターの状態を安全に遷移させる
  private setMonsterState(newState: MonsterState): void {
    if (this.monsterGameState.state === newState) return;

    devLog.debug(`👾 Monster state changed: ${this.monsterGameState.state} -> ${newState}`, {
      previousState: this.monsterGameState.state,
      newState: newState,
      health: this.monsterGameState.health,
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