/**
 * ファンタジーモード専用PIXI描画コンポーネント
 * SVGベースの敵キャラとエフェクトを統合管理
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { MonsterState as GameMonsterState } from './FantasyGameEngine';

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
  onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void; // 魔法名表示コールバック
  className?: string;
  activeMonsters?: GameMonsterState[]; // マルチモンスター対応
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
  originalScale?: number;
  state: MonsterState; // 状態機械の状態
  isFadingOut: boolean;
  fadeOutStartTime: number;
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
    svg: 'fire.png',
    tier2Name: 'インフェルノ',
    tier2Color: 0xDC143C, // クリムゾン
    particleCount: 20,
  },
  ice: { // フロスト -> ブリザード
    name: 'フロスト',
    color: 0x00BFFF, // ディープスカイブルー
    particleColor: 0xB0E0E6,
    svg: 'ice.png',
    tier2Name: 'ブリザード',
    tier2Color: 0x4169E1, // ロイヤルブルー
    particleCount: 25,
  },
  lightning: { // スパーク -> サンダー・ストライク
    name: 'スパーク',
    color: 0xFFD700, // ゴールド
    particleColor: 0xFFF700,
    svg: 'thunder.png',
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
interface MonsterSpriteData {
  id: string;
  sprite: PIXI.Sprite;
  visualState: MonsterVisualState;
  gameState: MonsterGameState;
  position: 'A' | 'B' | 'C';
  ui?: {
    anger?: PIXI.Text;
  };
}

export class FantasyPIXIInstance {
  private app: PIXI.Application;
  private monsterContainer: PIXI.Container;

  private effectContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  private backgroundContainer: PIXI.Container;
  private onDefeated?: () => void;
  private onMonsterDefeated?: () => void;
  private onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void; // 魔法名表示コールバック
  
  /** ────────────────────────────────────
   *  safe‑default で初期化しておく
   * ─────────────────────────────────── */
  private monsterGameState: MonsterGameState = {
    isAttacking: false,
    isHit: false,
    hitColor: 0xffffff,
    originalColor: 0xffffff,
    staggerOffset: { x: 0, y: 0 },
    hitCount: 0,
    state: 'IDLE',
    isFadingOut: false,
    fadeOutStartTime: 0
  };
  
  /* 既存のフィールドはこのまま */
  private monsterSprite: PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
  private monsterVisualState: MonsterVisualState = {
    x: 0, y: 0, scale: 0.3, rotation: 0, tint: 0xffffff, alpha: 1, visible: false  // scale を 1 から 0.3 に変更
  };
  
  // マルチモンスター対応
  private monsterSprites: Map<string, MonsterSpriteData> = new Map();

  private magicCircles: Map<string, PIXI.Graphics> = new Map();
  private magicCircleData: Map<string, MagicCircle> = new Map();
  private damageNumbers: Map<string, PIXI.Text> = new Map();
  private damageData: Map<string, DamageNumberData> = new Map();
  private chordNameText: PIXI.Text | null = null;
  private angerMark: PIXI.Text | null = null;
  
  private currentMagicType: string = 'fire';
  // ★★★ MONSTER_EMOJI と loadEmojiTextures を削除、またはコメントアウト ★★★
  /*
  private emojiTextures: Map<string, PIXI.Texture> = new Map();
  */
  private imageTextures: Map<string, PIXI.Texture> = new Map(); // ★ imageTextures は残す
  
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




  constructor(width: number, height: number, onMonsterDefeated?: () => void, onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void) {
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

    this.effectContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    
    // ソート可能にする
    this.uiContainer.sortableChildren = true;
    
    // z-indexの設定（背景→モンスター→パーティクル→エフェクト→UI）
    this.app.stage.addChild(this.backgroundContainer);
    this.app.stage.addChild(this.monsterContainer);

    this.app.stage.addChild(this.effectContainer);
    this.app.stage.addChild(this.uiContainer);
    
    // 絵文字テクスチャの事前読み込み
    // this.loadEmojiTextures(); // ★ 削除
    this.loadMonsterTextures(); // ★★★ 新しいメソッドを呼ぶ ★★★
    
    // ★★★ 修正点(1): 魔法エフェクトのテクスチャ読み込みを追加 ★★★
    this.loadImageTextures(); // この行を追加して魔法画像をロードします
    
    // アニメーションループ開始
    this.startAnimationLoop();
    
    devLog.debug('✅ ファンタジーPIXI初期化完了（状態機械対応）');
  }

  // ★★★ 絵文字テクスチャ読み込みをモンスター画像読み込みに変更 ★★★
  private async loadMonsterTextures(): Promise<void> {
    try {
      // ▼▼▼ 変更点 ▼▼▼
      // 複数のモンスター画像をロードする（ENEMY_LISTと完全に一致させる）
      const monsterIcons = ['devil', 'dragon', 'mao', 'mummy', 'shinigami', 'slime_green', 'slime_red', 'zombie', 'skeleton', 'grey', 'pumpkin', 'alien', 'bat1', 'bat2', 'ghost'];
      /** まず .svg を読みに行き，失敗したら .png にフォールバックします */
      const iconMap: Record<string, string> = {
        devil:        'character_monster_devil_purple.svg',
        dragon:       'character_monster_dragon_01_red.svg',
        mao:          'character_monster_mao_01.svg',
        mummy:        'character_monster_mummy_red.svg',
        shinigami:    'character_monster_shinigami_01.svg',
        slime_green:  'character_monster_slime_green.svg',
        slime_red:    'character_monster_slime_red.svg',
        zombie:       'character_monster_zombie_brown.svg',
        skeleton:     'gaikotsu_01.svg',
        grey:         'grey_green.svg',
        pumpkin:      'jackolantern_01_orange.svg',
        alien:        'kaseijin_green.svg',
        bat1:         'komori_01.svg',
        bat2:         'komori_02.svg',
        ghost:        'yurei_halloween_orange.svg'
      };

      // プリロード用のアセット定義
      const monsterAssets: Record<string, string> = {};
      for (const icon of monsterIcons) {
        const path = `${import.meta.env.BASE_URL}data/${iconMap[icon]}`;
        monsterAssets[icon] = path;
      }

      // バンドルとして一括ロード
      await PIXI.Assets.addBundle('monsterTextures', monsterAssets);
      await PIXI.Assets.loadBundle('monsterTextures');

      // ロードされたテクスチャを保存
      for (const icon of monsterIcons) {
        const texture = PIXI.Assets.get(icon);
        if (texture) {
          this.imageTextures.set(icon, texture);
          devLog.debug(`✅ モンスターテクスチャ読み込み完了: ${icon}`);
        } else {
          devLog.debug(`❌ モンスターテクスチャ読み込み失敗: ${icon}`);
        }
      }
      // ▲▲▲ ここまで ▲▲▲
    } catch (error) {
      devLog.debug('❌ モンスターテクスチャの読み込みエラー:', error);
    }
  }

  // フォールバック用テクスチャ作成
  private createFallbackTextures(): void {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xDDDDDD);
    graphics.drawCircle(0, 0, 50);
    graphics.endFill();
    
    const fallbackTexture = this.app.renderer.generateTexture(graphics);
    
    // デフォルトモンスター用のフォールバックテクスチャを設定
    this.imageTextures.set('default_monster', fallbackTexture);
  }

  // ★★★ 修正点(2): 画像読み込みパスを `public` ディレクトリ基準に修正 ★★★
  private async loadImageTextures(): Promise<void> {
    try {
      // 魔法テクスチャのアセット定義
      const magicAssets: Record<string, string> = {};
      for (const [key, magic] of Object.entries(MAGIC_TYPES)) {
        const path = `${import.meta.env.BASE_URL}${magic.svg}`;
        magicAssets[key] = path;
      }

      // バンドルとして一括ロード
      await PIXI.Assets.addBundle('magicTextures', magicAssets);
      await PIXI.Assets.loadBundle('magicTextures');

      // ロードされたテクスチャを保存
      for (const [key, magic] of Object.entries(MAGIC_TYPES)) {
        const texture = PIXI.Assets.get(key);
        if (texture) {
          this.imageTextures.set(magic.svg, texture);
          devLog.debug(`✅ 画像テクスチャ読み込み: ${magic.svg}`);
        }
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
      
      // ★★★ createMonsterSpriteForId を画像ベースに修正 ★★★
      const sprite = await this.createMonsterSpriteForId('default', icon);
      if (sprite) {
        this.monsterSprite.texture = sprite.texture;
        devLog.debug('✅ モンスター画像テクスチャ適用:', { icon });
      } else {
        devLog.debug('⚠️ モンスター画像テクスチャが見つからないか無効、フォールバック作成:', { icon });
        this.createFallbackMonster();
      }
      
      // ビジュアル状態をリセット
      this.monsterVisualState = {
        ...this.monsterVisualState,
        alpha: 1.0,
        visible: true,
        tint: 0xFFFFFF,
        scale: 0.3  // 1.0 から 0.3 に変更
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
        scale: 0.3  // 1.0 から 0.3 に変更
      };
      
      // スプライトの属性を更新
      this.updateMonsterSprite();
      
      devLog.debug('✅ フォールバックモンスター作成完了');
    } catch (error) {
      devLog.debug('❌ フォールバックモンスター作成エラー:', error);
    }
  }

  // ===== マルチモンスター対応メソッド =====
  
  /**
   * アクティブなモンスター配列に基づいてスプライトを更新
   */
  async updateActiveMonsters(monsters: GameMonsterState[]): Promise<void> {
    if (this.isDestroyed) return;

    devLog.debug('👾 アクティブモンスター更新:', { count: monsters.length });
    
    const currentIds = new Set(monsters.map(m => m.id));
    
    // 削除されたモンスターをクリーンアップ
    for (const [id, monsterData] of this.monsterSprites) {
      if (!currentIds.has(id)) {
        if (monsterData.sprite && !monsterData.sprite.destroyed) {
            monsterData.sprite.destroy();
        }
        this.monsterSprites.delete(id);
      }
    }
    
    // 各モンスターのスプライトを作成または更新
    for (const monster of monsters) {
      let monsterData = this.monsterSprites.get(monster.id);
      
      if (!monsterData) {
        // 新しいモンスターのスプライトを作成
        const sprite = await this.createMonsterSpriteForId(monster.id, monster.icon);
        if (!sprite) continue;
        
        const visualState: MonsterVisualState = {
          x: this.getPositionX(monster.position),
          y: 100, // Y座標を100pxに固定（200px高さの中央）
          scale: 0.3,  // 1.0 から 0.3 に変更
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
        
        monsterData = {
          id: monster.id,
          sprite,
          visualState,
          gameState,
          position: monster.position
        };
        
        this.monsterSprites.set(monster.id, monsterData);
        this.monsterContainer.addChild(sprite);
      }
      
      // 位置を更新
      if (monsterData.position !== monster.position) {
        monsterData.position = monster.position;
        monsterData.visualState.x = this.getPositionX(monster.position);
      }
      
      this.updateMonsterSpriteData(monsterData);
    }
  }
  
  /** UI 側（25 %|50 %|75 %）に完全同期させる */
  private getPositionX(position: 'A' | 'B' | 'C'): number {
    const w = this.app.screen.width;
    switch (position) {
      case 'A': return w * 0.25;
      case 'B': return w * 0.50;
      case 'C': return w * 0.75;
    }
  }
  
  /**
   * 特定のIDのモンスタースプライトを作成
   */
  private async createMonsterSpriteForId(id: string, icon: string): Promise<PIXI.Sprite | null> {
    try {
      // ▼▼▼ 変更点 ▼▼▼
      // iconに基づいてテクスチャを動的に選択
      let texture = this.imageTextures.get(icon);
      
      // テクスチャが見つからない場合はフォールバックを使用
      if (!texture || texture.destroyed) {
        // devLog.debug('⚠️ モンスターテクスチャが見つかりません、フォールバックを使用:', { id, icon });
        texture = this.imageTextures.get('default_monster');
        if (!texture || texture.destroyed) {
          devLog.debug('❌ フォールバックテクスチャも見つかりません');
          return null;
        }
      }
      // ▲▲▲ ここまで ▲▲▲
      
      const sprite = new PIXI.Sprite(texture);

      // ▼▼▼ 修正箇所 ▼▼▼
      // 実際のモンスター表示エリアのサイズに基づいてサイズを決定
      const CONTAINER_WIDTH = this.app.screen.width;
      const CONTAINER_HEIGHT = 200; // FantasyGameScreen.tsxで定義されている固定高さ

      // 3体同時表示を想定して、1体あたりの利用可能幅を計算
      // 各モンスターは画面の25%, 50%, 75%の位置に配置される
      // そのため、利用可能な幅は画面幅の約25%（モンスター間のマージンを考慮）
      const availableWidth = CONTAINER_WIDTH * 0.20; // 20%でマージンを確保
      
      // モンスターの最大サイズを定義
      // 幅: 利用可能幅の80%（十分なマージンを確保）
      const maxWidth = availableWidth * 0.8;
      // 高さ: コンテナ高さの50%（上下のマージンを確保）
      const maxHeight = CONTAINER_HEIGHT * 0.5;

      // アスペクト比を維持しつつ、maxWidthとmaxHeightの両方に収まるようにスケーリング
      const scale = Math.min(maxWidth / sprite.texture.width, maxHeight / sprite.texture.height);
      
      // 最大スケールを制限（小さすぎる画像が拡大されすぎないように）
      const finalScale = Math.min(scale, 0.5);  // 0.8 から 0.5 に変更
      sprite.scale.set(finalScale);
      
      sprite.anchor.set(0.5);
      // ▲▲▲ ここまで ▲▲▲
      
      sprite.anchor.set(0.5);
      // ▲▲▲ ここまで ▲▲▲
      
      return sprite;
    } catch (error) {
      devLog.debug('❌ モンスタースプライト作成エラー:', { id, error });
      return null;
    }
  }
  
  /**
   * 個別のモンスタースプライトを更新
   */
  private updateMonsterSpriteData(monsterData: MonsterSpriteData): void {
    const { sprite, visualState, gameState } = monsterData;
    
    sprite.x = visualState.x + gameState.staggerOffset.x;
    sprite.y = visualState.y + gameState.staggerOffset.y;
    
    // 攻撃中はスケールを直接設定しているので、visualStateからの更新をスキップ
    if (!gameState.isAttacking) {
      sprite.scale.x = visualState.scale;
      sprite.scale.y = visualState.scale;
    }
    
    sprite.rotation = visualState.rotation;
    sprite.tint = gameState.isHit ? gameState.hitColor : visualState.tint;
    sprite.alpha = visualState.alpha;
    sprite.visible = visualState.visible && gameState.state !== 'GONE';
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

  // マルチモンスター用攻撃成功エフェクト
  triggerAttackSuccessOnMonster(monsterId: string, chordName: string | undefined, isSpecial: boolean, damageDealt: number, defeated: boolean): void {
    const monsterData = this.monsterSprites.get(monsterId);
    if (!monsterData || this.isDestroyed) return;
    
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
        this.onShowMagicName(magicName, isSpecial, monsterId);
      }

      monsterData.gameState.isHit = true;
      monsterData.gameState.hitColor = magicColor;

      // よろめきエフェクト
      monsterData.gameState.staggerOffset = {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 10
      };

      // ダメージ数値を表示（モンスターの位置に）
      this.createDamageNumberAt(damageDealt, magicColor, monsterData.visualState.x, monsterData.visualState.y - 50);

      // エフェクトをモンスターの位置に作成
      this.createImageMagicEffectAt(magic.svg, magicColor, isSpecial, monsterData.visualState.x, monsterData.visualState.y);

      // 状態を更新
      monsterData.gameState.hitCount++;

      if (defeated) {
        monsterData.gameState.state = 'FADING_OUT';
        monsterData.gameState.isFadingOut = true;

      }

      // ヒット状態を解除
      setTimeout(() => {
        if (monsterData.gameState) {
          monsterData.gameState.isHit = false;
        }
      }, 300);

    } catch (error) {
      devLog.debug('❌ 攻撃成功エフェクトエラー:', error);
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
        this.onShowMagicName(magicName, isSpecial, 'default');
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

  // 指定位置にPNG画像魔法エフェクトを作成
  private createImageMagicEffectAt(imagePath: string, color: number, isSpecial: boolean, targetX: number, targetY: number): void {
    const texture = this.imageTextures.get(imagePath);
    if (!texture) {
      devLog.debug(`⚠️ 画像テクスチャが見つかりません: ${imagePath}`);
      return;
    }

    const count = isSpecial ? 3 : 1;
    for (let i = 0; i < count; i++) {
      try {
        const magicSprite = new PIXI.Sprite(texture);
        
        if (!magicSprite || !magicSprite.anchor) {
          devLog.debug('⚠️ 魔法スプライト作成失敗');
          continue;
        }
        
        magicSprite.anchor.set(0.5);
        
        // 画面の下から指定位置に向かって飛ぶ
        magicSprite.x = targetX;
        magicSprite.y = targetY;
        
        magicSprite.tint = color;
        magicSprite.alpha = 0.8;
        magicSprite.scale.set(0.3);
        
        if (!this.effectContainer || this.effectContainer.destroyed) {
          magicSprite.destroy();
          return;
        }
        
        this.effectContainer.addChild(magicSprite);

        // アニメーション
        let life = 400;               // 半分の時間でフェード
        const finalTargetX = targetX + (isSpecial ? (Math.random() - 0.5) * 80 : 0);
        const finalTargetY = targetY + (isSpecial ? (Math.random() - 0.5) * 40 : 0);
        
        const animate = () => {
          /* ✨ 追加 ✨ : 破棄済み Sprite が残らないよう必ず removeChild */
          if (this.isDestroyed || !magicSprite) return;

          if (magicSprite.destroyed) {
            if (magicSprite.parent) magicSprite.parent.removeChild(magicSprite);
            return;      // ← ここで終了して OK
          }
          
          if (life > 0) {
            try {
              const progress = 1 - (life / 400);
              // 位置は固定なので移動させない
              magicSprite.alpha = 0.8 * (1 - progress);
              life -= 16;
              requestAnimationFrame(animate);
            } catch (error) {
              devLog.debug('⚠️ 魔法エフェクトアニメーションエラー:', error);
            }
          } else {
            try {
              this.effectContainer.removeChild(magicSprite);
              magicSprite.destroy();
            } catch (error) {
              devLog.debug('⚠️ 魔法スプライト削除エラー:', error);
            }
          }
        };
        
        if (isSpecial) {
          setTimeout(animate, i * 100);
        } else {
          animate();
        }
      } catch (error) {
        devLog.debug('❌ 魔法エフェクト作成エラー:', error);
      }
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
          /* ✨ 追加 ✨ : 破棄済み Sprite が残らないよう必ず removeChild */
          if (this.isDestroyed || !magicSprite) return;

          if (magicSprite.destroyed) {
            if (magicSprite.parent) magicSprite.parent.removeChild(magicSprite);
            return;      // ← ここで終了して OK
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

  // 指定位置にダメージ数値を作成
  private createDamageNumberAt(damage: number, color: number, x: number, y: number): void {
    const id = `damage_${Date.now()}_${Math.random()}`;
    
    const damageText = new PIXI.Text(damage.toString(), {
      fontSize: 36,
      fill: 0xFFFFFF,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 4,
      dropShadow: true,
      dropShadowBlur: 4,
      dropShadowDistance: 2
    });
    
    damageText.anchor.set(0.5);
    damageText.x = x + (Math.random() - 0.5) * 30;
    damageText.y = y;
    damageText.zIndex = 1000;
    
    this.uiContainer.addChild(damageText);
    this.damageNumbers.set(id, damageText);
    this.damageData.set(id, {
      text: damageText,
      startTime: Date.now(),
      startY: damageText.y,
      velocity: 0,
      life: 1500,
      maxLife: 1500
    });
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
      velocity: 0, // ゆっくり上昇
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

  // 画面揺れエフェクト（SPアタック時のみ）
  private triggerSpecialEffects(isSpecial: boolean): void {
    if (isSpecial) {
      this.createScreenShake(10, 500);
    }
  }



  // モンスター攻撃状態更新
  updateMonsterAttacking(isAttacking: boolean): void {
    // 状態ガード
    if (this.isDestroyed || !this.monsterSprite || this.monsterSprite.destroyed) return;

    this.monsterGameState.isAttacking = isAttacking;

    if (isAttacking) {
      this.monsterVisualState.tint = 0xFF6B6B;
      this.monsterVisualState.scale = 0.35; // 少し大きくなる（0.3 から 0.35 に）
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
          this.monsterVisualState.scale = 0.3; // 元の大きさに戻る（0.3 に）
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
      // ▼▼▼ 変更点 ▼▼▼
      // 常に monsterSprites マップをループ処理する
      for (const [id, monsterData] of this.monsterSprites) {
        const { visualState, gameState, sprite } = monsterData;
        
        // よろけ効果の減衰
        gameState.staggerOffset.x *= 0.9;
        gameState.staggerOffset.y *= 0.9;
        
        // アイドル時の軽い浮遊効果（上下動）- 攻撃中は無効
        if (gameState.state === 'IDLE' && !gameState.isAttacking) {
          // IDをシードにして各モンスターの動きを非同期にする
          const baseY = this.app.screen.height / 2;
          visualState.y = baseY + Math.sin(Date.now() * 0.002 + id.charCodeAt(0)) * 6;
        } else if (gameState.isAttacking) {
          // 攻撃中は位置を固定（上下動を止める）
          visualState.y = this.app.screen.height / 2;
        }
        
        // 怒りマークの位置を更新（モンスターに追従）
        if (monsterData.ui?.anger && monsterData.ui.anger.visible) {
          const scaledWidth = sprite.texture.width * sprite.scale.x;
          const scaledHeight = sprite.texture.height * sprite.scale.y;
          monsterData.ui.anger.x = sprite.x + scaledWidth * 0.4;
          monsterData.ui.anger.y = sprite.y - scaledHeight * 0.4;
        }
        
        // フェードアウト処理
        if (gameState.isFadingOut) {
          visualState.alpha -= 0.05;
          if (visualState.alpha <= 0) {
            visualState.alpha = 0;
            visualState.visible = false;
            gameState.state = 'GONE';
            
            if (sprite && !sprite.destroyed) {
              sprite.destroy();
            }
            this.monsterSprites.delete(id);
          }
        }
        
        this.updateMonsterSpriteData(monsterData);
      }
      // ▲▲▲ ここまで ▲▲▲
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
          // 位置は固定
          damageText.y = damageNumberData.startY;
          
          // フェードアウト（最初の500msは不透明、その後フェードアウト）
          if (elapsedTime < 500) {
            damageText.alpha = 1;
          } else {
            damageText.alpha = (damageNumberData.life - 0) / (damageNumberData.maxLife - 500);
          }
          
          // スケール固定
          damageText.scale.set(1);
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
    if (!this.app || !this.app.renderer || this.isDestroyed) return;
    try {
      this.app.renderer.resize(width, height);
      for (const [id, monsterData] of this.monsterSprites) {
        monsterData.visualState.x = this.getPositionX(monsterData.position);
        monsterData.visualState.y = 100; // Y座標を100pxに固定（200px高さの中央）
        // ▼▼▼ 修正箇所 ▼▼▼
        const sprite = monsterData.sprite;

        // 実際のモンスター表示エリアのサイズに基づいてサイズを決定
        const CONTAINER_WIDTH = width;
        const CONTAINER_HEIGHT = 200; // FantasyGameScreen.tsxで定義されている固定高さ

        // 3体同時表示を想定して、1体あたりの利用可能幅を計算
        // 各モンスターは画面の25%, 50%, 75%の位置に配置される
        // そのため、利用可能な幅は画面幅の約25%（モンスター間のマージンを考慮）
        const availableWidth = CONTAINER_WIDTH * 0.20; // 20%でマージンを確保
        
        // モンスターの最大サイズを定義
        // 幅: 利用可能幅の80%（十分なマージンを確保）
        const maxWidth = availableWidth * 0.8;
        // 高さ: コンテナ高さの50%（上下のマージンを確保）
        const maxHeight = CONTAINER_HEIGHT * 0.5;

        // アスペクト比を維持しつつ、maxWidthとmaxHeightの両方に収まるようにスケーリング
        const scale = Math.min(maxWidth / sprite.texture.width, maxHeight / sprite.texture.height);
        
        // 最大スケールを制限（小さすぎる画像が拡大されすぎないように）
        const finalScale = Math.min(scale, 0.5);  // 0.8 から 0.5 に変更
        sprite.scale.set(finalScale);
        // ▲▲▲ ここまで ▲▲▲
        this.updateMonsterSpriteData(monsterData);
      }
      devLog.debug('✅ ファンタジーPIXIリサイズ完了:', { width, height });
    } catch (error) {
      devLog.debug('⚠️ リサイズエラー:', error);
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
    
    // マルチモンスターのクリーンアップ
    this.monsterSprites.forEach(data => data.sprite.destroy());
    this.monsterSprites.clear();
    
    // エフェクトの安全な削除
    try {
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
    
    // ▼▼▼ 追加 ▼▼▼
    // バンドルされたアセットをアンロード
    PIXI.Assets.unloadBundle('monsterTextures').catch(e => devLog.debug("monsterTextures unload error", e));
    PIXI.Assets.unloadBundle('magicTextures').catch(e => devLog.debug("magicTextures unload error", e));
    // ▲▲▲ ここまで ▲▲▲
    
    // テクスチャクリーンアップ
    try {
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

      /* ✨ 追加 ✨ : モンスターが去ったらエフェクトを全部掃除 */
      this.effectContainer.children.forEach(child => {
        if (child.parent) child.parent.removeChild(child);
        if (!child.destroyed && typeof (child as any).destroy === 'function') {
          (child as any).destroy();
        }
      });

      // 親コンポーネント通知の直前で片付け
      this.monsterSprite.visible = false;
      // 二度アクセスしない様に null‑out
      (this.monsterSprite as any) = null;
      (this.monsterGameState as any) = null;
      
      // 親コンポーネントに通知
      // isDestroyedフラグをチェックして、インスタンス破棄後のコールバック呼び出しを防ぐ
      if (!this.isDestroyed) {
        this.onDefeated?.();
      } 
    }
  }
  
  /** これ１行で「壊れていたら return true」 */
  private isSpriteInvalid = (s: PIXI.DisplayObject | null | undefined) =>
    !s || (s as any).destroyed || !(s as any).transform;

  // マルチモンスター用攻撃エフェクト
  updateMonsterAttackingById(monsterId: string, isAttacking: boolean): void {
    const monsterData = this.monsterSprites.get(monsterId);
    if (!monsterData) {
      // スプライトがまだ無ければ1フレーム後に再試行
      requestAnimationFrame(() => this.updateMonsterAttackingById(monsterId, isAttacking));
      return;
    }
    
    if (this.isDestroyed) return;

    console.log(`🎯 updateMonsterAttackingById called: monsterId=${monsterId}, isAttacking=${isAttacking}`);

    // 元のスケールを保存（初回のみ）
    if (!monsterData.gameState.originalScale) {
      monsterData.gameState.originalScale = monsterData.visualState.scale;
    }

    monsterData.gameState.isAttacking = isAttacking;

    if (isAttacking) {
      // 攻撃エフェクト
      monsterData.visualState.tint = 0xFF6B6B;
      // スプライトのscaleを直接変更（visualStateのscaleではなく）
      const BIG_SCALE = 2.2; // より大きく拡大（0.3 → 0.66相当）
      monsterData.sprite.scale.set(monsterData.gameState.originalScale * BIG_SCALE);
      
      // 怒りマーク表示（一度だけ生成・再利用）
      if (!monsterData.ui?.anger) {
        // 絵文字が表示されない環境用のフォールバック
        const angerText = '💢';  // 絵文字が表示されない場合は '!!' を使用することも可能
        const anger = new PIXI.Text(angerText, { 
          fontSize: 56,  // サイズも少し大きく
          fontFamily: 'Arial, "Noto Color Emoji", sans-serif',  // 絵文字フォントを含める
          fill: 0xFF0000  // 赤色のフォールバック
        });
        anger.anchor.set(0.5);
        anger.zIndex = 9999;  // 最前面に表示
        monsterData.ui = { ...monsterData.ui, anger };
        this.uiContainer.addChild(anger);
        this.uiContainer.sortChildren();  // zIndexを反映
      }
      if (monsterData.ui?.anger) {
        monsterData.ui.anger.visible = true;
        // スプライトの実際のサイズとスケールを考慮した位置計算
        const scaledWidth = monsterData.sprite.texture.width * monsterData.sprite.scale.x;
        const scaledHeight = monsterData.sprite.texture.height * monsterData.sprite.scale.y;
        monsterData.ui.anger.x = monsterData.sprite.x + scaledWidth * 0.4;
        monsterData.ui.anger.y = monsterData.sprite.y - scaledHeight * 0.4;
        
        // フェードイン効果
        monsterData.ui.anger.alpha = 0;
        const fadeInInterval = setInterval(() => {
          if (monsterData.ui?.anger) {
            monsterData.ui.anger.alpha += 0.1;
            if (monsterData.ui.anger.alpha >= 1) {
              clearInterval(fadeInInterval);
            }
          }
        }, 30);
      }
      
      // スプライトの色を即座に適用
      monsterData.sprite.tint = monsterData.visualState.tint;

      // 画面を軽く震わせる（オプション）
      this.createScreenShake(8, 400);

      // エフェクトを戻す
      setTimeout(() => {
        if (!this.isDestroyed && this.monsterSprites.has(monsterId)) {
          monsterData.visualState.tint = 0xFFFFFF;
          monsterData.sprite.scale.set(monsterData.gameState.originalScale);
          monsterData.sprite.tint = monsterData.visualState.tint;
          
          if (monsterData.ui?.anger) {
            monsterData.ui.anger.visible = false;
          }
          
          // 攻撃状態をリセット
          monsterData.gameState.isAttacking = false;
        }
      }, 600);
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
  className,
  activeMonsters
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
      // マルチモンスター対応がある場合はそちらを優先
      if (activeMonsters && activeMonsters.length > 0) {
        pixiInstance.updateActiveMonsters(activeMonsters);
      } else {
        // 互換性のため従来の単体モンスター表示
        // 状態機械のガード処理により、適切なタイミングでのみモンスターが生成される
        pixiInstance.createMonsterSprite(monsterIcon);
      }
    }
  }, [pixiInstance, monsterIcon, activeMonsters]);

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