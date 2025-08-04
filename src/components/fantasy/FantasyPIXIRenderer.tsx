/**
 * ファンタジーモード専用PIXI描画コンポーネント
 * SVGベースの敵キャラとエフェクトを統合管理
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { MonsterState as GameMonsterState } from './FantasyGameEngine';
import { useEnemyStore } from '@/stores/enemyStore';
import FantasySoundManager from '@/utils/FantasySoundManager';

// ===== 型定義 =====

// 状態機械の型定義
type MonsterState = 'IDLE' | 'HITTING' | 'DEFEATED' | 'FADING_OUT' | 'GONE';

interface FantasyPIXIRendererProps {
  width: number;
  height: number;
  monsterIcon: string;
  enemyGauge: number;
  onReady?: (instance: FantasyPIXIInstance) => void;
  onMonsterDefeated?: () => void; // 状態機械用コールバック
  onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void; // 魔法名表示コールバック
  className?: string;
  activeMonsters?: GameMonsterState[]; // マルチモンスター対応
  imageTexturesRef?: React.MutableRefObject<Map<string, PIXI.Texture>>; // プリロードされたテクスチャへの参照
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
  isHit: boolean;
  hitColor: number;
  originalColor: number;
  staggerOffset: { x: number; y: number };
  hitCount: number;
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
  thunder: { // スパーク -> サンダー・ストライク
    name: 'スパーク',
    color: 0xFFD700, // ゴールド
    particleColor: 0xFFF700,
    svg: 'thunder.png',
    tier2Name: 'サンダー・ストライク',
    tier2Color: 0xFFF8DC, // オフホワイト
    particleCount: 15,
  },
};

// ★ Attack icon path
const ATTACK_ICON_PATH = 'attack_icons/fukidashi_onpu_white.png';
const ATTACK_ICON_KEY = 'attackIcon'; // ←論理キー

// ===== テクスチャキャッシュ =====
// インメモリキャッシュ - 一度ロードしたテクスチャを保持
const textureCache: Record<string, Promise<PIXI.Texture>> = {};

// 1枚だけロードするユーティリティ関数
const loadMonsterTexture = async (icon: string): Promise<PIXI.Texture> => {
  if (!textureCache[icon]) {
    const tryPaths = [
      `${import.meta.env.BASE_URL}monster_icons/${icon}.webp`,
      `${import.meta.env.BASE_URL}monster_icons/${icon}.png`,
    ];

    textureCache[icon] = (async () => {
      for (const path of tryPaths) {
        try {
          const texture = await PIXI.Assets.load(path);
          devLog.debug(`✅ モンスターテクスチャ遅延ロード完了: ${icon}`);
          return texture;
        } catch (error) {
          continue;
        }
      }
      // 失敗したら透明テクスチャを返す
      devLog.debug(`❌ モンスターテクスチャロード失敗: ${icon}`);
      return PIXI.Texture.EMPTY;
    })();
  }
  return textureCache[icon];
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
  position: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  gauge: number; // 追加：ゲージ値を保持
  angerMark?: PIXI.Sprite | PIXI.Text; // 追加：怒りマーク（SVGスプライトまたはテキスト）
  outline?: PIXI.Graphics; // 追加：赤い輪郭
  lastAttackTime?: number; // 追加：最後に攻撃した時刻
}

export class FantasyPIXIInstance {
  private app: PIXI.Application;
  private monsterContainer: PIXI.Container;
  private notesContainer: PIXI.Container; // 太鼓の達人風ノーツ用
  private judgeLineContainer: PIXI.Container; // 判定ライン用
  private effectContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  private backgroundContainer: PIXI.Container;
  private onDefeated?: () => void;
  private onMonsterDefeated?: () => void;
  private onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void; // 魔法名表示コールバック
  
  // プリロードされたテクスチャへの参照を追加
  private imageTexturesRef?: React.MutableRefObject<Map<string, PIXI.Texture>>;
  
  /** ────────────────────────────────────
   *  safe‑default で初期化しておく
   * ─────────────────────────────────── */
  private monsterGameState: MonsterGameState = {
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
  private monsterSprite: PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
  private monsterVisualState: MonsterVisualState = {
    x: 0, y: 0, scale: 0.2, rotation: 0, tint: 0xffffff, alpha: 1, visible: false  // scale を 0.3 から 0.2 に変更（より小さく）
  };
  
  // マルチモンスター対応
  private monsterSprites: Map<string, MonsterSpriteData> = new Map();

  private magicCircles: Map<string, PIXI.Graphics> = new Map();
  private magicCircleData: Map<string, MagicCircle> = new Map();
  private damageNumbers: Map<string, PIXI.Text> = new Map();
  private damageData: Map<string, DamageNumberData> = new Map();
  private chordNameText: PIXI.Text | null = null;

  
  private currentMagicType: string = 'fire';
  // ★★★ MONSTER_EMOJI と loadEmojiTextures を削除、またはコメントアウト ★★★
  /*
  private emojiTextures: Map<string, PIXI.Texture> = new Map();
  */
  private imageTextures: Map<string, PIXI.Texture> = new Map(); // ★ imageTextures は残す
  private fukidashiTexture: PIXI.Texture | null = null;  // 吹き出しテクスチャを追加
  private activeFukidashi: Map<string, PIXI.Sprite> = new Map();  // アクティブな吹き出しを管理
  
  // 太鼓の達人風ノーツ関連
  private activeNotes: Map<string, PIXI.Container> = new Map(); // 表示中のノーツ
  private judgeLineGraphics: PIXI.Graphics | null = null; // 判定ライン
  private judgeLineX: number = 100; // 判定ラインのX座標
  
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

  constructor(
    width: number, 
    height: number, 
    onMonsterDefeated?: () => void, 
    onShowMagicName?: (magicName: string, isSpecial: boolean, monsterId: string) => void,
    imageTexturesRef?: React.MutableRefObject<Map<string, PIXI.Texture>>
  ) {
    // コールバックの保存
    this.onDefeated = onMonsterDefeated;
    this.onMonsterDefeated = onMonsterDefeated; // 状態機械用コールバック
    this.onShowMagicName = onShowMagicName; // 魔法名表示コールバック
    this.imageTexturesRef = imageTexturesRef; // プリロードされたテクスチャへの参照を保存
    
    // PIXIの最適化設定
    PIXI.settings.ROUND_PIXELS = true; // transform演算コスト最小化&にじみ防止
    
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
    this.notesContainer = new PIXI.Container(); // 太鼓の達人風ノーツ
    this.judgeLineContainer = new PIXI.Container(); // 判定ライン
    this.effectContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();
    
    // ソート可能にする
    this.uiContainer.sortableChildren = true;
    this.notesContainer.sortableChildren = true;
    
    // z-indexの設定（背景→モンスター→ノーツ→判定ライン→エフェクト→UI）
    this.app.stage.addChild(this.backgroundContainer);
    this.app.stage.addChild(this.monsterContainer);
    this.app.stage.addChild(this.notesContainer);
    this.app.stage.addChild(this.judgeLineContainer);
    this.app.stage.addChild(this.effectContainer);
    this.app.stage.addChild(this.uiContainer);
    
    // 絵文字テクスチャの事前読み込み
    // this.loadEmojiTextures(); // ★ 削除
    // this.loadMonsterTextures(); // ★★★ 遅延ロードに変更したためコメントアウト ★★★
    
    // ★★★ 修正点(1): 魔法エフェクトのテクスチャ読み込みを追加 ★★★
    this.loadImageTextures(); // この行を追加して魔法画像をロードします
    
    // よく使われるモンスターアイコンのプリロード（非同期で実行）
    this.preloadCommonMonsters();
    
    // アニメーションループ開始
    this.startAnimationLoop();
    
    // 判定ラインを初期化
    this.initializeJudgeLine();
    
    devLog.debug('✅ ファンタジーPIXI初期化完了（状態機械対応）');
  }

  // ★★★ 遅延ロードに変更したため、この関数は使用しない ★★★
  // private async loadMonsterTextures(): Promise<void> {
  //   try {
  //     // ▼▼▼ 変更点 ▼▼▼
  //     // public/monster_icons/monster_01.png 〜 63.png を全部読む
  //     const monsterIcons = Array.from({ length: 63 }, (_, i) =>
  //       `monster_${String(i + 1).padStart(2, '0')}`
  //     );
  //     
  //     // 画像フォルダにそのまま置いてあるのでマップ不要
  //     const iconMap: Record<string, string> = {};
  //     monsterIcons.forEach((name) => {
  //       iconMap[name] = `monster_icons/${name}.png`;
  //     });

  //     // プリロード用のアセット定義
  //     const monsterAssets: Record<string, string> = {};
  //     for (const icon of monsterIcons) {
  //       const path = `${import.meta.env.BASE_URL}${iconMap[icon]}`;
  //       monsterAssets[icon] = path;
  //     }

  //     // バンドルとして一括ロード
  //     await PIXI.Assets.addBundle('monsterTextures', monsterAssets);
  //     await PIXI.Assets.loadBundle('monsterTextures');

  //     // ロードされたテクスチャを保存
  //     for (const icon of monsterIcons) {
  //       const texture = PIXI.Assets.get(icon);
  //       if (texture) {
  //         this.imageTextures.set(icon, texture);
  //         devLog.debug(`✅ モンスターテクスチャ読み込み完了: ${icon}`);
  //       } else {
  //         devLog.debug(`❌ モンスターテクスチャ読み込み失敗: ${icon}`);
  //       }
  //     }
  //     // ▲▲▲ ここまで ▲▲▲
  //   } catch (error) {
  //     devLog.debug('❌ モンスターテクスチャの読み込みエラー:', error);
  //   }
  // }

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
        // 一時的にPNGファイルを直接使用（WebP変換ツールが利用できないため）
        const path = `${import.meta.env.BASE_URL}data/${magic.svg}`;
        magicAssets[key] = path;
      }
      
      // 怒りマークSVGを追加
      magicAssets['angerMark'] = `${import.meta.env.BASE_URL}data/anger.svg`;
      
      // 音符吹き出しを追加
      magicAssets['fukidashi'] = `${import.meta.env.BASE_URL}attack_icons/fukidashi_onpu_white.png`;
      
      // 攻撃アイコンを追加
      magicAssets['attackIcon'] = `${import.meta.env.BASE_URL}${ATTACK_ICON_PATH}`;

      // バンドルとして一括ロード
      await PIXI.Assets.addBundle('magicTextures', magicAssets);
      await PIXI.Assets.loadBundle('magicTextures');

      // ロードされたテクスチャを保存
      for (const [key, magic] of Object.entries(MAGIC_TYPES)) {
        const texture = PIXI.Assets.get(key);
        if (texture) {
          this.imageTextures.set(magic.svg, texture as PIXI.Texture);
          devLog.debug(`✅ 画像テクスチャ読み込み: ${magic.svg}`);
        }
      }
      
      // 怒りマークテクスチャを保存
      const angerTexture = PIXI.Assets.get('angerMark');
      if (angerTexture) {
        this.imageTextures.set('angerMark', angerTexture as PIXI.Texture);
        devLog.debug('✅ 怒りマークテクスチャ読み込み: anger.svg');
      }
      
      // 吹き出しテクスチャを保存
      const fukidashiTexture = PIXI.Assets.get('fukidashi');
      if (fukidashiTexture) {
        this.fukidashiTexture = fukidashiTexture as PIXI.Texture;
        devLog.debug('✅ 吹き出しテクスチャ読み込み: fukidashi_onpu_white.png');
      }
      
      // 攻撃アイコンテクスチャを保存
      const attackIconTex = PIXI.Assets.get('attackIcon');
      if (attackIconTex) {
        this.imageTextures.set(ATTACK_ICON_KEY, attackIconTex as PIXI.Texture); // "論理キー" で保存　★ここがポイント
        devLog.debug('✅ attack icon loaded');
      }
      
      devLog.debug('✅ 全画像テクスチャ読み込み完了');
    } catch (error) {
      devLog.debug('❌ 画像テクスチャ読み込みエラー:', error);
    }
  }

  // よく使われるモンスターアイコンを事前にロード
  private async preloadCommonMonsters(): Promise<void> {
    // よく使われるモンスターアイコンを事前にロード
    const commonMonsters = [
      'monster_01', 'monster_02', 'monster_03', 'monster_04', 'monster_05',
      'monster_06', 'monster_07', 'monster_08', 'monster_09', 'monster_10'
    ];
    
    const promises = commonMonsters.map(icon => loadMonsterTexture(icon));
    await Promise.all(promises);
    devLog.debug('✅ 一般的なモンスターアイコンのプリロード完了');
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
      if (this.monsterSprite.texture && this.monsterSprite.texture !== PIXI.Texture.EMPTY) {
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
        scale: this.calcSpriteScale(this.monsterSprite.texture, this.app.screen.width, 200, 1) // 動的スケール計算
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
        scale: this.calcSpriteScale(texture, this.app.screen.width, 200, 1) // 動的スケール計算
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
    
    // ★★★ 修正点: ソートしてから位置を計算 ★★★
    const sortedMonsters = [...monsters].sort((a, b) => a.position.localeCompare(b.position));

    // 各モンスターのスプライトを作成または更新
    for (let i = 0; i < sortedMonsters.length; i++) {
      const monster = sortedMonsters[i];
      let monsterData = this.monsterSprites.get(monster.id);
      
      if (!monsterData) {
        // 新しいモンスターのスプライトを作成
        const sprite = await this.createMonsterSpriteForId(monster.id, monster.icon);
        if (!sprite) continue;
        
        const visualState: MonsterVisualState = {
          x: this.getPositionX(i, sortedMonsters.length),
          y: 100, // Y座標を100pxに固定（200px高さの中央）
          scale: this.calcSpriteScale(sprite.texture, this.app.screen.width, 200, sortedMonsters.length),
          rotation: 0,
          tint: 0xFFFFFF,
          alpha: 1.0,
          visible: true
        };
        
        const gameState: MonsterGameState = {
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
          position: monster.position,
          gauge: monster.gauge // 追加
        };
        
        this.monsterSprites.set(monster.id, monsterData);
        this.monsterContainer.addChild(sprite);
      }
      
      // ゲージ値を更新
      const prevGauge = monsterData.gauge;
      monsterData.gauge = monster.gauge;
      
      // ゲージが100から0になった場合は攻撃したと判定
      if (prevGauge >= 100 && monster.gauge === 0) {
        monsterData.lastAttackTime = Date.now();
      }
      
      // 位置を更新
      monsterData.visualState.x = this.getPositionX(i, sortedMonsters.length);
      
      this.updateMonsterSpriteData(monsterData);
    }
  }
  
  /** UI 側とほぼ同じレイアウトになるよう、スロット幅を基準に中央配置 */
  private getPositionX(positionIndex: number, totalMonsters: number): number {
    const w = this.app.screen.width;
    
    // モバイル判定（横幅768px未満）
    const isMobile = w < 768;
    
    // 1体あたりのスロット幅を動的に計算
    let monsterSlotWidth: number;
    
    if (isMobile) {
      // モバイルの場合：モンスター数に応じてスロット幅を調整
      if (totalMonsters <= 3) {
        monsterSlotWidth = Math.min(w * 0.30, 120);
      } else if (totalMonsters <= 5) {
        monsterSlotWidth = Math.min(w * 0.18, 80);
      } else {
        // 6体以上の場合はさらに小さく
        monsterSlotWidth = Math.min(w * 0.12, 60);
      }
    } else {
      // デスクトップの場合：モンスター数に応じてスロット幅を調整
      if (totalMonsters <= 3) {
        monsterSlotWidth = Math.min(w * 0.30, 220);
      } else if (totalMonsters <= 5) {
        monsterSlotWidth = Math.min(w * 0.18, 150);
      } else {
        // 6体以上の場合
        monsterSlotWidth = Math.min(w * 0.12, 120);
      }
    }

    // 全モンスターが表示される領域の合計幅
    const totalGroupWidth = monsterSlotWidth * totalMonsters;
    // モンスター群の開始X座標（画面中央に配置するため）
    const groupStartX = (w - totalGroupWidth) / 2;

    // このモンスターの中心X座標を計算
    const monsterX = groupStartX + (monsterSlotWidth * positionIndex) + (monsterSlotWidth / 2);
    return monsterX;
  }
  
  /**
   * 特定のIDのモンスタースプライトを作成
   */
  private async createMonsterSpriteForId(id: string, icon: string): Promise<PIXI.Sprite | null> {
    try {
      // まずプリロードされたテクスチャをチェック
      let texture: PIXI.Texture | null = null;
      
      if (this.imageTexturesRef?.current.has(icon)) {
        // プリロードされたテクスチャが存在する場合は即座に使用
        texture = this.imageTexturesRef.current.get(icon)!;
        devLog.debug(`✅ プリロードされたテクスチャを使用: ${icon}`);
      } else {
        // プリロードされていない場合は従来の非同期ロード
        // ▼▼▼ 変更点：完全に透明なプレースホルダーで即座に表示 ▼▼▼
        // 完全に透明なテクスチャを作成
        const transparentGraphics = new PIXI.Graphics();
        transparentGraphics.beginFill(0xFFFFFF, 0); // 完全に透明
        transparentGraphics.drawRect(0, 0, 64, 64);
        transparentGraphics.endFill();
        const transparentTexture = this.app.renderer.generateTexture(transparentGraphics);
        transparentGraphics.destroy();
        
        // プレースホルダーを作成（完全に透明）
        const placeholder = new PIXI.Sprite(transparentTexture);
        placeholder.anchor.set(0.5);
        placeholder.alpha = 0;          // まずは見えない状態で挿入
        
        // 非同期で本物のテクスチャをロードして差し替える
        loadMonsterTexture(icon).then(loadedTexture => {
          if (!placeholder.destroyed) {
            placeholder.texture = loadedTexture;
            placeholder.tint = 0xFFFFFF;
            
            // αを滑らかに 0→1 にする
            const targetScale = this.calcSpriteScale(
              loadedTexture,
              this.app.screen.width,
              200,
              this.monsterSprites.size || 1
            );

            placeholder.scale.set(targetScale);

            // フェードイン
            let a = 0;
            const fade = () => {
              if (placeholder.destroyed) return;
              a += 0.1;
              placeholder.alpha = Math.min(1, a);
              if (a < 1) requestAnimationFrame(fade);
            };
            fade();
            
            devLog.debug(`✅ モンスタープレースホルダーを実画像に差し替え: ${icon}`);
          }
        }).catch(error => {
          devLog.debug(`❌ モンスターテクスチャ差し替え失敗: ${icon}`, error);
        });
        
        return placeholder;
      }
      
      // プリロードされたテクスチャを使用してスプライトを作成
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5);
      
      // ▼▼▼ 修正箇所 ▼▼▼
      // 実際のモンスター表示エリアのサイズに基づいてサイズを決定
      const CONTAINER_WIDTH = this.app.screen.width;
      const CONTAINER_HEIGHT = 200; // FantasyGameScreen.tsxで定義されている固定高さ

      // モバイル判定
      const isMobile = CONTAINER_WIDTH < 768;
      
      // 現在のモンスター数を取得（デフォルトは3）
      const currentMonsterCount = this.monsterSprites.size || 3;
      
      // モンスター数とデバイスに応じて利用可能幅を計算
      let availableWidthRatio: number;
      
      if (isMobile) {
        // モバイルの場合（3倍に拡大）
        if (currentMonsterCount <= 3) {
          availableWidthRatio = 0.75;  // 0.25から0.75へ（3倍）
        } else if (currentMonsterCount <= 5) {
          availableWidthRatio = 0.45;  // 0.15から0.45へ（3倍）
        } else {
          // 6体以上
          availableWidthRatio = 0.30;  // 0.10から0.30へ（3倍）
        }
      } else {
        // デスクトップの場合（3倍に拡大）
        if (currentMonsterCount <= 3) {
          availableWidthRatio = 0.60;  // 0.20から0.60へ（3倍）
        } else if (currentMonsterCount <= 5) {
          availableWidthRatio = 0.45;  // 0.15から0.45へ（3倍）
        } else {
          // 6体以上
          availableWidthRatio = 0.30;  // 0.10から0.30へ（3倍）
        }
      }
      
      // 動的スケール計算を使用
      const dynamicScale = this.calcSpriteScale(
        sprite.texture,
        CONTAINER_WIDTH,
        CONTAINER_HEIGHT,
        currentMonsterCount
      );
      
      sprite.scale.set(dynamicScale);
      
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
   * Calculate dynamic sprite scale based on available space
   */
  private calcSpriteScale(
    texture: PIXI.Texture,
    containerWidth: number,
    containerHeight: number,
    simultaneousCount: number
  ): number {
    // Calculate slot size with margin
    const slotWidth = (containerWidth / simultaneousCount) * 0.8; // 20% horizontal margin
    const slotHeight = containerHeight * 0.6; // 40% vertical margin (60% of container height)
    
    // Calculate scale to fit in slot
    const scaleX = slotWidth / texture.width;
    const scaleY = slotHeight / texture.height;
    
    // Use the smaller scale to maintain aspect ratio
    // Remove the 1.0 limit to allow scaling beyond original size
    return Math.min(scaleX, scaleY);
  }

  /**
   * モンスターデータのビジュアル更新
   */
  private updateMonsterSpriteData(monsterData: MonsterSpriteData): void {
    const { sprite, visualState, gameState } = monsterData;
    
    // transform nullチェックを追加
    if (sprite.destroyed || !(sprite as any).transform) {
      return;
    }
    
    sprite.x = visualState.x + gameState.staggerOffset.x;
    sprite.y = visualState.y + gameState.staggerOffset.y;
    
    sprite.scale.x = visualState.scale;
    sprite.scale.y = visualState.scale;
    
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
      // 魔法効果音を再生（統一）
      try {
        FantasySoundManager.playMyAttack();
        devLog.debug('🔊 攻撃効果音再生(triggerAttackSuccessOnMonster)');
      } catch (error) {
        console.error('攻撃効果音再生エラー:', error);
      }

      // 常に黄色（サンダーの色）を使用
      const magicColor = 0xFFD700; // 黄色（ゴールド）
      
      // HTMLでの表示のためコールバックを呼び出す（無効化）
      // if (this.onShowMagicName) {
      //   this.onShowMagicName(magicName, isSpecial, monsterId);
      // }

      monsterData.gameState.isHit = true;
      monsterData.gameState.hitColor = magicColor;

      // よろめきエフェクト
      monsterData.gameState.staggerOffset = {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 10
      };

      // ダメージ数値を表示（モンスターの位置に）
      this.createDamageNumberAt(damageDealt, magicColor, monsterData.visualState.x, monsterData.visualState.y - 50);

      // エフェクトをモンスターの位置に作成（サンダーのエフェクトを使用）
      // this.createImageMagicEffectAt('thunder.png', magicColor, isSpecial, monsterData.visualState.x, monsterData.visualState.y);

      // 音符吹き出しを表示
      // this.showMusicNoteFukidashi(monsterId, monsterData.visualState.x, monsterData.visualState.y);
      
      // 攻撃成功時の音符アイコンを表示
      this.showAttackIcon(monsterData);

      // SPアタック時の特殊エフェクト
      this.triggerSpecialEffects(isSpecial);

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
      // 魔法効果音を再生（統一）
      try {
        FantasySoundManager.playMyAttack();
        devLog.debug('🔊 攻撃効果音再生(triggerAttackSuccess)');
      } catch (error) {
        console.error('攻撃効果音再生エラー:', error);
      }

      // 常に黄色（サンダーの色）を使用
      const magicColor = 0xFFD700; // 黄色（ゴールド）
      
      // HTMLでの表示のためコールバックを呼び出す（無効化）
      // if (this.onShowMagicName) {
      //   this.onShowMagicName(magicName, isSpecial, 'default');
      // }

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

      // this.createImageMagicEffect('thunder.png', magicColor, isSpecial);

      // 音符吹き出しを表示（シングルモンスター用）
      // this.showMusicNoteFukidashi('default', this.monsterVisualState.x, this.monsterVisualState.y);

      // SPアタック時の特殊エフェクト
      this.triggerSpecialEffects(isSpecial);

      // 状態を更新
      this.monsterGameState.hitCount++;

      // ★ 修正点: 内部のHP判定を削除し、引数の defeated を使う
      if (defeated) {
        this.setMonsterState('FADING_OUT');
      }

      devLog.debug('⚔️ 攻撃成功:', {
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
      this.showSwingSwingSwingCutIn();
    }
  }

  // Swing! Swing! Swing!カットイン演出
  private showSwingSwingSwingCutIn(): void {
    if (this.isDestroyed) return;

    // カットイン用のコンテナを作成
    const cutInContainer = new PIXI.Container();
    cutInContainer.zIndex = 2000; // 最前面に表示

    // 背景（左から右への一閃）
    const flash = new PIXI.Graphics();
    flash.beginFill(0xFFFFFF, 0.8);
    flash.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    flash.endFill();
    flash.x = -this.app.screen.width;
    cutInContainer.addChild(flash);

    // テキスト
    const text = new PIXI.Text('Swing! Swing! Swing!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: 72,
      fontWeight: 'bold',
      fill: 0xFFD700, // 黄色
      stroke: 0x000000,
      strokeThickness: 8,
      align: 'center',
      dropShadow: true,
      dropShadowBlur: 4,
      dropShadowDistance: 4
    });
    text.anchor.set(0.5);
    text.x = this.app.screen.width / 2;
    text.y = this.app.screen.height / 2;
    text.alpha = 0;
    cutInContainer.addChild(text);

    this.uiContainer.addChild(cutInContainer);

    // アニメーション
    let flashProgress = 0;
    let textProgress = 0;
    let fadeOutProgress = 0;
    let phase = 'flash'; // 'flash', 'text', 'fadeout'

    const animate = () => {
      if (this.isDestroyed || !cutInContainer) return;

      if (phase === 'flash') {
        // 白い一閃が左から右へ
        flashProgress += 0.1;
        flash.x = -this.app.screen.width + (this.app.screen.width * 2 * flashProgress);
        
        if (flashProgress >= 1) {
          phase = 'text';
          cutInContainer.removeChild(flash);
        }
      } else if (phase === 'text') {
        // テキストがフェードイン
        textProgress += 0.05;
        text.alpha = Math.min(textProgress, 1);
        
        if (textProgress >= 1.5) { // 少し待機
          phase = 'fadeout';
        }
      } else if (phase === 'fadeout') {
        // 全体がフェードアウト
        fadeOutProgress += 0.05;
        cutInContainer.alpha = 1 - fadeOutProgress;
        
        if (fadeOutProgress >= 1) {
          // 演出終了
          this.uiContainer.removeChild(cutInContainer);
          cutInContainer.destroy({ children: true });
          return;
        }
      }

      requestAnimationFrame(animate);
    };

    animate();
  }

  // 音符吹き出し表示
  private showMusicNoteFukidashi(monsterId: string, x: number, y: number): void {
    if (!this.fukidashiTexture || this.isDestroyed) return;

    // 既存の吹き出しがあれば削除
    const existingFukidashi = this.activeFukidashi.get(monsterId);
    if (existingFukidashi && !existingFukidashi.destroyed) {
      this.effectContainer.removeChild(existingFukidashi);
      existingFukidashi.destroy();
    }

    // 新しい吹き出しを作成
    const fukidashi = new PIXI.Sprite(this.fukidashiTexture);
    fukidashi.anchor.set(0.5, 1); // 下部中央をアンカーポイントに
    fukidashi.x = x + 60; // モンスターの右側に配置
    fukidashi.y = y - 30; // モンスターの上に配置
    fukidashi.scale.set(0.5); // サイズ調整

    this.effectContainer.addChild(fukidashi);
    this.activeFukidashi.set(monsterId, fukidashi);

    // 2秒後に自動で削除
    setTimeout(() => {
      if (!this.isDestroyed && fukidashi && !fukidashi.destroyed) {
        this.effectContainer.removeChild(fukidashi);
        fukidashi.destroy();
        this.activeFukidashi.delete(monsterId);
      }
    }, 2000);
  }

  /** 攻撃アイコンを敵スプライト右上に固定で出す */
  private async showAttackIcon(monsterData: MonsterSpriteData): Promise<void> {
    let tex = this.imageTextures.get(ATTACK_ICON_KEY);
    if (!tex) {
      try {
        tex = await PIXI.Assets.load(`${import.meta.env.BASE_URL}${ATTACK_ICON_PATH}`);
        this.imageTextures.set(ATTACK_ICON_KEY, tex as PIXI.Texture);
        devLog.debug('✅ attack icon lazy-loaded');
      } catch (error) {
        devLog.debug('⚠️ attackIcon texture missing');
        return;
      }
    }

    if (!tex) return;

    // 既に付いているアイコンがあれば一旦消す
    if ((monsterData as any).attackIcon && !(monsterData as any).attackIcon.destroyed) {
      monsterData.sprite.removeChild((monsterData as any).attackIcon);
      (monsterData as any).attackIcon.destroy();
    }

    const texture = tex as PIXI.Texture;
    const icon = new PIXI.Sprite(texture);
    icon.anchor.set(0.5);
    icon.scale.set(0.35); // お好みで
    icon.x = monsterData.sprite.width * 0.45; // 右上へオフセット
    icon.y = -monsterData.sprite.height * 0.45;
    monsterData.sprite.addChild(icon);

    // 1 秒後に自動削除（ずっと残すなら setTimeout を外す）
    setTimeout(() => {
      if (!icon.destroyed && icon.parent) icon.parent.removeChild(icon);
      icon.destroy();
    }, 1000);

    (monsterData as any).attackIcon = icon; // 再利用できるよう保持
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
        
        // ストアから怒り状態を取得
        const enragedTable = useEnemyStore.getState().enraged;
        
        // 怒りマークの相対位置（スプライト中心基準）
        const ANGER_OFFSET = { x: 80, y: -80 }; // さらに右上へ（アイコンに重ならないように）
        
        if (enragedTable[id]) {
          // ---- 怒り演出 ----
          const baseScale = this.calcSpriteScale(sprite.texture, this.app.screen.width, 200, this.monsterSprites.size);
          visualState.scale = baseScale * 1.25; // 巨大化（25%増し）
          sprite.tint = 0xFFCCCC;
          
          // 怒りマークを追加（まだない場合）
          if (!monsterData.angerMark) {
            const angerTexture = this.imageTextures.get('angerMark');
            if (angerTexture) {
              const angerMark = new PIXI.Sprite(angerTexture);
              angerMark.anchor.set(0.5);
              angerMark.width = 72;  // サイズ調整（もっと大きく）
              angerMark.height = 72;
              angerMark.position.set(
                ANGER_OFFSET.x,
                ANGER_OFFSET.y
              );
              sprite.addChild(angerMark);
              monsterData.angerMark = angerMark;
            } else {
              // テクスチャが無い場合は絵文字でフォールバック
              const angerMark = new PIXI.Text('💢', {
                fontFamily: 'DotGothic16',
                fontSize: 54,  // もっと大きく
                fill: 0xFF0000,
                stroke: 0x000000,
                strokeThickness: 4,
              });
              angerMark.anchor.set(0.5);
              angerMark.position.set(
                ANGER_OFFSET.x,
                ANGER_OFFSET.y
              );
              sprite.addChild(angerMark);
              monsterData.angerMark = angerMark;
            }
          }
          
          // パルスアニメーション（怒りの脈動）
          const pulse = Math.sin(Date.now() * 0.005) * 0.05 + 1;
          sprite.scale.set(visualState.scale * pulse);
          
          // 攻撃直後のモンスター赤フラッシュ
          if (monsterData.lastAttackTime && Date.now() - monsterData.lastAttackTime < 150) {
            sprite.tint = 0xFF4444; // 真紅
          }
          
        } else {
          // ---- 通常状態 ----
          const baseScale = this.calcSpriteScale(sprite.texture, this.app.screen.width, 200, this.monsterSprites.size);
          visualState.scale = baseScale;
          sprite.tint = gameState.isHit ? gameState.hitColor : 0xFFFFFF;
          
          // 怒りエフェクトを削除
          if (monsterData.angerMark) {
            sprite.removeChild(monsterData.angerMark);
            monsterData.angerMark.destroy();
            monsterData.angerMark = undefined;
          }
        }
        
        // よろけ効果の減衰
        gameState.staggerOffset.x *= 0.9;
        gameState.staggerOffset.y *= 0.9;
        
        // アイドル時の軽い浮遊効果（上下動）
        if (gameState.state === 'IDLE') {
          // IDをシードにして各モンスターの動きを非同期にする
          const baseY = this.app.screen.height / 2;
          visualState.y = baseY + Math.sin(Date.now() * 0.002 + id.charCodeAt(0)) * 6;
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
      // positionでソートしてインデックスを計算
      const sortedEntries = Array.from(this.monsterSprites.entries())
        .sort(([,a], [,b]) => a.position.localeCompare(b.position));
      
      for (let i = 0; i < sortedEntries.length; i++) {
        const [id, monsterData] = sortedEntries[i];
        monsterData.visualState.x = this.getPositionX(i, sortedEntries.length);
        monsterData.visualState.y = 100; // Y座標を100pxに固定（200px高さの中央）
        // ▼▼▼ 修正箇所 ▼▼▼
        // 動的スケール計算を使用
        const dynamicScale = this.calcSpriteScale(
          monsterData.sprite.texture,
          width,
          200, // FantasyGameScreen.tsxで定義されている固定高さ
          sortedEntries.length
        );
        
        monsterData.visualState.scale = dynamicScale;
        // ▲▲▲ ここまで ▲▲▲
        this.updateMonsterSpriteData(monsterData);
      }
      devLog.debug('✅ ファンタジーPIXIリサイズ完了:', { width, height });
    } catch (error) {
      devLog.debug('⚠️ リサイズエラー:', error);
    }
  }

  // 判定ラインの初期化
  private initializeJudgeLine(): void {
    if (this.judgeLineGraphics) {
      this.judgeLineGraphics.destroy();
    }
    
    const graphics = new PIXI.Graphics();
    const centerY = this.app.screen.height / 2;
    
    // 外側の円（判定エリア）
    graphics.lineStyle(3, 0xFFD700, 0.8);
    graphics.drawCircle(this.judgeLineX, centerY, 40);
    
    // 内側の円（中心）
    graphics.lineStyle(0);
    graphics.beginFill(0xFFD700, 0.6);
    graphics.drawCircle(this.judgeLineX, centerY, 10);
    graphics.endFill();
    
    this.judgeLineGraphics = graphics;
    this.judgeLineContainer.addChild(graphics);
  }
  
  // 太鼓の達人風ノーツを作成
  createTaikoNote(noteId: string, chordName: string, x: number): PIXI.Container {
    const noteContainer = new PIXI.Container();
    
    // ノーツの円を作成
    const noteCircle = new PIXI.Graphics();
    noteCircle.lineStyle(3, 0xFFFFFF, 1);
    noteCircle.beginFill(0xFF6B6B, 0.8);
    noteCircle.drawCircle(0, 0, 35);
    noteCircle.endFill();
    
    // コード名のテキスト
    const chordText = new PIXI.Text(chordName, {
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center'
    });
    chordText.anchor.set(0.5);
    
    noteContainer.addChild(noteCircle);
    noteContainer.addChild(chordText);
    noteContainer.x = x;
    noteContainer.y = this.app.screen.height / 2;
    
    // 半透明にする
    noteContainer.alpha = 0.85;
    
    return noteContainer;
  }
  
  // ノーツを更新（太鼓の達人風）
  updateTaikoNotes(notes: Array<{id: string, chord: string, x: number}>): void {
    // 既存のノーツをクリア
    this.activeNotes.forEach((note, id) => {
      if (!notes.find(n => n.id === id)) {
        note.destroy();
        this.activeNotes.delete(id);
      }
    });
    
    // 新しいノーツを追加・更新
    notes.forEach(noteData => {
      let note = this.activeNotes.get(noteData.id);
      
      if (!note) {
        // 新しいノーツを作成
        note = this.createTaikoNote(noteData.id, noteData.chord, noteData.x);
        this.notesContainer.addChild(note);
        this.activeNotes.set(noteData.id, note);
      } else {
        // 既存のノーツの位置を更新
        note.x = noteData.x;
      }
    });
  }
  
  // ノーツヒット時のエフェクト
  createNoteHitEffect(x: number, y: number, isSuccess: boolean): void {
    const effectGraphics = new PIXI.Graphics();
    
    if (isSuccess) {
      // 成功時：金色の爆発エフェクト
      effectGraphics.lineStyle(4, 0xFFD700, 1);
      effectGraphics.drawCircle(0, 0, 40);
    } else {
      // 失敗時：赤い×マーク
      effectGraphics.lineStyle(4, 0xFF0000, 1);
      effectGraphics.moveTo(-20, -20);
      effectGraphics.lineTo(20, 20);
      effectGraphics.moveTo(20, -20);
      effectGraphics.lineTo(-20, 20);
    }
    
    effectGraphics.x = x;
    effectGraphics.y = y;
    
    this.effectContainer.addChild(effectGraphics);
    
    // フェードアウトアニメーション
    const fadeOut = () => {
      effectGraphics.alpha -= 0.05;
      effectGraphics.scale.x += 0.05;
      effectGraphics.scale.y += 0.05;
      
      if (effectGraphics.alpha <= 0) {
        effectGraphics.destroy();
      } else {
        requestAnimationFrame(fadeOut);
      }
    };
    
    requestAnimationFrame(fadeOut);
  }
  
  // 判定ラインの位置を取得
  getJudgeLinePosition(): { x: number, y: number } {
    return {
      x: this.judgeLineX,
      y: this.app.screen.height / 2
    };
  }
  
  // Canvas要素取得
  getCanvas(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement;
  }
  
  // ループ時のノーツクリア
  clearNotes(): void {
    if (this.notesContainer) {
      this.notesContainer.removeChildren().forEach(child => {
        if (child && typeof child.destroy === 'function') {
          child.destroy();
        }
      });
    }
    this.activeNotes.clear();
  }

  // 破棄
  destroy(): void {
    this.isDestroyed = true;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // ノーツコンテナのクリーンアップ
    if (this.notesContainer) {
      this.notesContainer.removeChildren().forEach(child => {
        if (child && typeof child.destroy === 'function') {
          child.destroy();
        }
      });
    }
    
    // マルチモンスターのクリーンアップ時に怒りエフェクトも削除
    this.monsterSprites.forEach(data => {
      if (data.outline) data.outline.destroy();
      if (data.angerMark) data.angerMark.destroy();
      data.sprite.destroy();
    });
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


}

// ===== Reactコンポーネント =====

export const FantasyPIXIRenderer: React.FC<FantasyPIXIRendererProps> = ({
  width,
  height,
  monsterIcon,
  enemyGauge,
  onReady,
  onMonsterDefeated,
  onShowMagicName,
  className,
  activeMonsters,
  imageTexturesRef
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pixiInstance, setPixiInstance] = useState<FantasyPIXIInstance | null>(null);

  // PIXI初期化
  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new FantasyPIXIInstance(width, height, onMonsterDefeated, onShowMagicName, imageTexturesRef);
    containerRef.current.appendChild(instance.getCanvas());
    
    setPixiInstance(instance);
    onReady?.(instance);

    return () => {
      instance.destroy();
    };
  }, [width, height, onReady, onMonsterDefeated, onShowMagicName, imageTexturesRef]);

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