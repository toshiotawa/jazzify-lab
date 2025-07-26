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



// ===== テクスチャキャッシュ =====
// インメモリキャッシュ - 一度ロードしたテクスチャを保持
const textureCache: Record<string, Promise<PIXI.Texture>> = {};

// 音符吹き出しテクスチャをロード
textureCache['noteBubble'] = PIXI.Assets.load(
  `${import.meta.env.BASE_URL}attack_icons/fukidashi_onpu_white.png`
);

// Swing! Swing! Swing! カットインテクスチャをロード
textureCache['swingCutin'] = PIXI.Assets.load(
  `${import.meta.env.BASE_URL}attack_icons/swingswingswing.png`
);

// 1枚だけロードするユーティリティ関数
const loadMonsterTexture = async (icon: string): Promise<PIXI.Texture> => {
  if (!textureCache[icon]) {
    // 複数のパスを試す（WebP優先、PNG、旧PNGの順）
    const tryPaths = [
      `${import.meta.env.BASE_URL}monster_icons/${icon}.webp`,  // WebP (軽量)
      `${import.meta.env.BASE_URL}monster_icons/${icon}.png`,   // PNG
    ];

    textureCache[icon] = (async () => {
      for (const path of tryPaths) {
        try {
          const texture = await PIXI.Assets.load(path);
          devLog.debug(`✅ モンスターテクスチャ遅延ロード完了: ${icon}`);
          return texture;
        } catch (error) {
          // このパスでは見つからなかった
          continue;
        }
      }
      // すべて失敗したら白テクスチャを返す
      devLog.debug(`❌ モンスターテクスチャロード失敗: ${icon}`);
      return PIXI.Texture.WHITE;
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

  private effectContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  private backgroundContainer: PIXI.Container;
  private onDefeated?: () => void;
  private onMonsterDefeated?: () => void;
  
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
  private monsterSprite: PIXI.Sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
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




  constructor(width: number, height: number, onMonsterDefeated?: () => void) {
    // コールバックの保存
    this.onDefeated = onMonsterDefeated;
    this.onMonsterDefeated = onMonsterDefeated; // 状態機械用コールバック
    
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
    // this.loadMonsterTextures(); // ★★★ 遅延ロードに変更したためコメントアウト ★★★
    
    // ★★★ 修正点(1): 魔法エフェクトのテクスチャ読み込みを追加 ★★★
    this.loadImageTextures(); // この行を追加して魔法画像をロードします
    
    // アニメーションループ開始
    this.startAnimationLoop();
    
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
      
      // 怒りマークSVGのみを追加
      magicAssets['angerMark'] = `${import.meta.env.BASE_URL}data/anger.svg`;

      // バンドルとして一括ロード
      await PIXI.Assets.addBundle('magicTextures', magicAssets);
      await PIXI.Assets.loadBundle('magicTextures');
      
      // 怒りマークテクスチャを保存
      const angerTexture = PIXI.Assets.get('angerMark');
      if (angerTexture) {
        this.imageTextures.set('angerMark', angerTexture);
        devLog.debug('✅ 怒りマークテクスチャ読み込み: anger.svg');
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
        scale: 0.2  // 0.3 から 0.2 に変更（より小さく）
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
        scale: 0.2  // 0.3 から 0.2 に変更（より小さく）
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
          scale: 0.2,  // 0.3 から 0.2 に変更（より小さく）
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
      // ▼▼▼ 変更点：プレースホルダーで即座に表示 ▼▼▼
      // まずプレースホルダーを作成（グレーの四角形）
      const placeholder = new PIXI.Sprite(PIXI.Texture.WHITE);
      placeholder.width = 64;
      placeholder.height = 64;
      placeholder.tint = 0x888888; // グレー色
      placeholder.anchor.set(0.5);
      
      // 非同期で本物のテクスチャをロードして差し替える
      loadMonsterTexture(icon).then(texture => {
        if (!placeholder.destroyed) {
          placeholder.texture = texture;
          // テクスチャが読み込まれたら色を元に戻す
          placeholder.tint = 0xFFFFFF;
          devLog.debug(`✅ モンスタープレースホルダーを実画像に差し替え: ${icon}`);
        }
      }).catch(error => {
        devLog.debug(`❌ モンスターテクスチャ差し替え失敗: ${icon}`, error);
      });
      
      const sprite = placeholder;
      // ▲▲▲ ここまで ▲▲▲

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
        // モバイルの場合
        if (currentMonsterCount <= 3) {
          availableWidthRatio = 0.25;
        } else if (currentMonsterCount <= 5) {
          availableWidthRatio = 0.15;
        } else {
          // 6体以上
          availableWidthRatio = 0.10;
        }
      } else {
        // デスクトップの場合
        if (currentMonsterCount <= 3) {
          availableWidthRatio = 0.20;
        } else if (currentMonsterCount <= 5) {
          availableWidthRatio = 0.15;
        } else {
          // 6体以上
          availableWidthRatio = 0.10;
        }
      }
      
      const availableWidth = CONTAINER_WIDTH * availableWidthRatio;
      
      // モンスターの最大サイズを定義
      // 幅: 利用可能幅の80%（十分なマージンを確保）
      const maxWidth = availableWidth * 0.8;
      // 高さ: コンテナ高さの50%（上下のマージンを確保）
      const maxHeight = CONTAINER_HEIGHT * 0.5;

      // アスペクト比を維持しつつ、maxWidthとmaxHeightの両方に収まるようにスケーリング
      const scale = Math.min(maxWidth / sprite.texture.width, maxHeight / sprite.texture.height);
      
      // コンテナサイズに応じて動的にスケール調整
      if (isMobile) {
        // モバイル: コンテナ高さの70%まで使用
        const mobileMaxHeight = CONTAINER_HEIGHT * 0.7;
        const mobileScale = Math.min(
          (availableWidth * 0.9) / sprite.texture.width,
          mobileMaxHeight / sprite.texture.height
        );
        sprite.scale.set(Math.min(mobileScale, 0.5)); // 最大50%に制限
      } else {
        // PC: コンテナ高さの90%まで使用、より大きく表示
        const pcMaxHeight = CONTAINER_HEIGHT * 0.9;
        const pcScale = Math.min(
          (availableWidth * 1.2) / sprite.texture.width,
          pcMaxHeight / sprite.texture.height
        );
        sprite.scale.set(Math.min(pcScale, 1.5)); // 最大150%まで許可
      }
      
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
  async triggerAttackSuccessOnMonster(monsterId: string, chordName: string | undefined, isSpecial: boolean, damageDealt: number, defeated: boolean): Promise<void> {
    const monsterData = this.monsterSprites.get(monsterId);
    if (!monsterData || this.isDestroyed) return;
    
    try {
      const magicColor = 0xFFD700;              // サンダーと同じ黄色
      FantasySoundManager.playMagic();          // 分岐不要
      devLog.debug('🔊 魔法効果音再生(triggerAttackSuccessOnMonster)');

      monsterData.gameState.isHit = true;
      monsterData.gameState.hitColor = magicColor;

      // よろめきエフェクト
      monsterData.gameState.staggerOffset = {
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 10
      };

      // ダメージ数値を表示（モンスターの位置に）
      this.createDamageNumberAt(damageDealt, magicColor, monsterData.visualState.x, monsterData.visualState.y - 50);

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

      // —— 音符吹き出しを 1.2 秒間だけ表示 ———————————————
      const bubbleTex = await textureCache['noteBubble'];
      const bubble = new PIXI.Sprite(bubbleTex);
      bubble.anchor.set(0.5, 1);
      bubble.scale.set(0.3);  // サイズを30%に縮小
      bubble.x = monsterData.sprite.width * 0.6;   // 右上
      bubble.y = -monsterData.sprite.height * 0.1;
      monsterData.sprite.addChild(bubble);
      setTimeout(() => {
        if (!bubble.destroyed) monsterData.sprite.removeChild(bubble);
        bubble.destroy();
      }, 1200);

      // SPアタック時のカットイン表示
      if (isSpecial) {
        const tex = await textureCache['swingCutin'];
        const cutin = new PIXI.Sprite(tex);
        cutin.anchor.set(0.5);
        cutin.x = this.app.screen.width / 2;
        cutin.y = this.app.screen.height / 2;
        
        // 画面サイズに応じてカットインをリサイズ
        const screenWidth = this.app.screen.width;
        const screenHeight = this.app.screen.height;
        const maxCutinWidth = screenWidth * 0.8; // 画面幅の80%まで
        const maxCutinHeight = screenHeight * 0.6; // 画面高さの60%まで
        
        const cutinScale = Math.min(
          maxCutinWidth / tex.width,
          maxCutinHeight / tex.height,
          1.0 // 最大でも元のサイズまで
        );
        cutin.scale.set(cutinScale);
        cutin.alpha = 0;
        this.uiContainer.addChild(cutin);

        // シンプルなフェードイン・アウト
        let fadePhase = 'in';
        let alpha = 0;
        const animate = () => {
          if (this.isDestroyed || !cutin || cutin.destroyed) return;
          
          if (fadePhase === 'in') {
            alpha += 0.05;
            if (alpha >= 1) {
              alpha = 1;
              fadePhase = 'hold';
              setTimeout(() => { fadePhase = 'out'; }, 800);
            }
          } else if (fadePhase === 'out') {
            alpha -= 0.05;
            if (alpha <= 0) {
              alpha = 0;
              if (!cutin.destroyed) {
                this.uiContainer.removeChild(cutin);
                cutin.destroy();
              }
              return;
            }
          }
          
          cutin.alpha = alpha;
          if (fadePhase !== 'done') {
            requestAnimationFrame(animate);
          }
        };
        animate();
      }

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
      const magicColor = 0xFFD700;              // サンダーと同じ黄色
      FantasySoundManager.playMagic();          // 分岐不要
      devLog.debug('🔊 魔法効果音再生(triggerAttackSuccess)');

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
          visualState.scale = 0.6; // ★ 怒り時も比例拡大（通常の1.5倍）
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
          visualState.scale = 0.4;  // ★ 通常時も 2 倍へ
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
        const sprite = monsterData.sprite;

        // 実際のモンスター表示エリアのサイズに基づいてサイズを決定
        const CONTAINER_WIDTH = width;
        const CONTAINER_HEIGHT = 200; // FantasyGameScreen.tsxで定義されている固定高さ
        const isMobile = CONTAINER_WIDTH < 768;

        // モンスター数に応じて利用可能幅を計算
        const currentMonsterCount = sortedEntries.length;
        let availableWidthRatio: number;
        
        if (isMobile) {
          if (currentMonsterCount <= 3) {
            availableWidthRatio = 0.25;
          } else if (currentMonsterCount <= 5) {
            availableWidthRatio = 0.15;
          } else {
            availableWidthRatio = 0.10;
          }
        } else {
          if (currentMonsterCount <= 3) {
            availableWidthRatio = 0.20;
          } else if (currentMonsterCount <= 5) {
            availableWidthRatio = 0.15;
          } else {
            availableWidthRatio = 0.10;
          }
        }
        
        const availableWidth = CONTAINER_WIDTH * availableWidthRatio;
        
        // コンテナサイズに応じて動的にスケール調整
        if (isMobile) {
          // モバイル: コンテナ高さの70%まで使用
          const mobileMaxHeight = CONTAINER_HEIGHT * 0.7;
          const mobileScale = Math.min(
            (availableWidth * 0.9) / sprite.texture.width,
            mobileMaxHeight / sprite.texture.height
          );
          sprite.scale.set(Math.min(mobileScale, 0.5)); // 最大50%に制限
        } else {
          // PC: コンテナ高さの90%まで使用、より大きく表示
          const pcMaxHeight = CONTAINER_HEIGHT * 0.9;
          const pcScale = Math.min(
            (availableWidth * 1.2) / sprite.texture.width,
            pcMaxHeight / sprite.texture.height
          );
          sprite.scale.set(Math.min(pcScale, 1.5)); // 最大150%まで許可
        }
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
  className,
  activeMonsters
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pixiInstance, setPixiInstance] = useState<FantasyPIXIInstance | null>(null);

  // PIXI初期化
  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new FantasyPIXIInstance(width, height, onMonsterDefeated);
    containerRef.current.appendChild(instance.getCanvas());
    
    setPixiInstance(instance);
    onReady?.(instance);

    return () => {
      instance.destroy();
    };
  }, [width, height, onReady, onMonsterDefeated]);

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