/**
 * Phase 3: PIXI.js ノーツレンダリングシステム
 * 高性能なノーツ降下アニメーション - ParticleContainer + テクスチャ最適化版
 * 
 * 🚀 改良版: "Cannot set properties of null" を根本的に防ぐ設計
 */

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import type { ActiveNote } from '@/types';
import { performanceMonitor } from '@/utils/performanceOptimizer';
import { log, perfLog } from '@/utils/logger';
import { cn } from '@/utils/cn';

// ===== 破棄管理システム =====
/**
 * 1. 破棄を1か所に集約 - "Dispose Manager"
 * バラバラのdestroy()呼び出しは漏れや二重実行が起こりがちなので一元管理する
 */
class DisposeManager {
  private disposables: (() => void)[] = [];
  private isDisposed: boolean = false;

  add(fn: () => void): void {
    if (this.isDisposed) {
      log.warn('⚠️ DisposeManager already disposed, ignoring new disposable');
      return;
    }
    this.disposables.push(fn);
  }

  flush(): void {
    if (this.isDisposed) return;
    
    log.debug(`🗑️ Disposing ${this.disposables.length} resources`);
    for (const fn of this.disposables) {
      try {
        fn();
      } catch (error) {
        log.error('⚠️ Dispose error:', error);
      }
    }
    this.disposables.length = 0;
    this.isDisposed = true;
  }

  get disposed(): boolean {
    return this.isDisposed;
  }
}

// ===== アップデータシステム =====
/**
 * 2. "更新ループ ⇔ オブジェクト" の結び付けを外せる構造
 * 各オブジェクトの更新処理を独立したクラスに分離し、
 * Tickerに登録/解除することで破棄されたオブジェクトを触らない仕組みを作る
 */

/**
 * ノートスプライト用アップデータ
 */
class NoteUpdater {
  private isActive: boolean = true;

  constructor(
    private noteSprite: NoteSprite,
    private settings: RendererSettings,
    private disposeManager: DisposeManager
  ) {
    // 破棄処理を自動登録
    disposeManager.add(() => this.dispose());
  }

  update = (delta: number): void => {
    // ★ホットスポット: ここだけで破棄チェック
    if (!this.isActive || this.noteSprite.sprite.destroyed) {
      return;
    }

    try {
      // 安全にスプライト更新
      const sprite = this.noteSprite.sprite;
      const noteData = this.noteSprite.noteData;
      
      // 位置更新（例）
      if (sprite.parent && !sprite.destroyed) {
        sprite.y += this.settings.noteSpeed * delta * 0.016; // 60FPS基準
        
        // 画面外判定
        if (sprite.y > this.settings.viewportHeight + 100) {
          this.dispose();
        }
      }
    } catch (error) {
      log.warn('⚠️ NoteUpdater error, disposing:', error);
      this.dispose();
    }
  };

  dispose(): void {
    this.isActive = false;
  }

  get active(): boolean {
    return this.isActive;
  }
}

/**
 * エフェクト用アップデータ
 */
class EffectUpdater {
  private isActive: boolean = true;
  private elapsed: number = 0;

  constructor(
    private effectContainer: PIXI.Container,
    private duration: number,
    private disposeManager: DisposeManager
  ) {
    disposeManager.add(() => this.dispose());
  }

  update = (delta: number): void => {
    if (!this.isActive || this.effectContainer.destroyed) {
      return;
    }

    try {
      this.elapsed += delta * 16; // deltaTimeをミリ秒に変換
      
      if (this.elapsed >= this.duration) {
        this.dispose();
        return;
      }

      // エフェクト更新処理
      const progress = this.elapsed / this.duration;
      this.effectContainer.alpha = 1 - progress;
      
    } catch (error) {
      log.warn('⚠️ EffectUpdater error, disposing:', error);
      this.dispose();
    }
  };

  dispose(): void {
    this.isActive = false;
    if (this.effectContainer && !this.effectContainer.destroyed) {
      this.effectContainer.visible = false; // 即座に非表示
    }
  }

  get active(): boolean {
    return this.isActive;
  }
}

// ===== ノート状態判定ヘルパー =====
// Renderer 側では "good" / "perfect" / "hit" をすべて "当たり" とみなす
const isHitState = (state: ActiveNote['state']) =>
  state === 'good' || state === 'perfect' || state === 'hit';

// ===== 型定義 =====

interface PIXINotesRendererProps {
  activeNotes: ActiveNote[];
  width: number;
  height: number;
  currentTime: number; // 現在時刻を追加（アニメーション同期用）
  /** レンダラー準備完了・破棄通知。null で破棄を示す */
  onReady?: (renderer: PIXINotesRendererInstance | null) => void;
  className?: string;
}

interface NoteSprite {
  sprite: PIXI.Sprite; // Graphics から Sprite に変更
  noteData: ActiveNote;
  glowSprite?: PIXI.Graphics;
  label?: PIXI.Sprite; // Text から Sprite に変更（テクスチャアトラス用）
  effectPlayed?: boolean; // エフェクト重複生成防止
  transposeAtCreation?: number; // 作成時のトランスポーズ値を記録
}

interface RendererSettings {
  noteWidth: number;
  noteHeight: number;
  hitLineY: number;
  pianoHeight: number;
  noteSpeed: number;
  colors: {
    visible: number;
    visibleBlack: number;
    hit: number;
    missed: number;
    perfect: number;
    good: number;
    whiteKey: number;
    blackKey: number;
    activeKey: number;
  };
  effects: {
    glow: boolean;
    particles: boolean;
    trails: boolean;
  };
  /** 統一された音名表示モード（鍵盤・ノーツ共通）*/
  noteNameStyle: 'off' | 'abc' | 'solfege';
  /** 簡易表示モード: 複雑な音名を基本音名に変換 */
  simpleDisplayMode: boolean;
  /** ストアの transpose 値（±6） */
  transpose: number;
  /** 移調楽器設定 */
  transposingInstrument: string;
  /** 練習モードガイド設定 */
  practiceGuide?: 'off' | 'key' | 'key_auto';
  showHitLine: boolean;
  viewportHeight: number;
  timingAdjustment: number;
}

// ===== テクスチャキャッシュ =====
interface NoteTextures {
  whiteVisible: PIXI.Texture;
  blackVisible: PIXI.Texture;
  hit: PIXI.Texture;
  missed: PIXI.Texture;
}

interface LabelTextures {
  abc: Map<string, PIXI.Texture>;
  solfege: Map<string, PIXI.Texture>;
}


// ===== PIXI.js レンダラークラス =====

export class PIXINotesRendererInstance {
  private app: PIXI.Application;
  private container!: PIXI.Container;
  private whiteNotes!: PIXI.ParticleContainer; // 白鍵ノーツ専用コンテナ
  private blackNotes!: PIXI.ParticleContainer; // 黒鍵ノーツ専用コンテナ
  private labelsContainer!: PIXI.Container; // ラベル専用コンテナ
  private effectsContainer!: PIXI.Container;
  private hitLineContainer!: PIXI.Container;
  private pianoContainer!: PIXI.Container;
  
  private noteSprites: Map<string, NoteSprite> = new Map();

  private pianoSprites: Map<number, PIXI.Graphics> = new Map();
  private highlightedKeys: Set<number> = new Set(); // ハイライト状態のキーを追跡
  
  // ★ ガイドライン管理用プロパティを追加
  private guidelines?: PIXI.Graphics;
  
  // ★ パフォーマンス最適化: nextNoteIndex ポインタシステム
  private allNotes: ActiveNote[] = []; // 全ノートのソート済みリスト
  private nextNoteIndex: number = 0;   // 次に表示するノートのインデックス
  private lastUpdateTime: number = 0;  // 前回の更新時刻（巻き戻し検出用）
  
  // ===== テクスチャキャッシュ =====
  private noteTextures!: NoteTextures;
  private labelTextures!: LabelTextures;
  
  // キーボード入力コールバック
  private onKeyPress?: (note: number) => void;
  private onKeyRelease?: (note: number) => void;
  
  // パフォーマンス監視
  private fpsCounter = 0;
  private lastFpsTime = 0;
  
  // ===== 新しい設計: 破棄管理＆アップデータシステム =====
  private disposeManager: DisposeManager = new DisposeManager();
  private noteUpdaters: Map<string, NoteUpdater> = new Map();
  private effectUpdaters: Set<EffectUpdater> = new Set();

  
  // Ticker関数への参照（削除用）
  private mainUpdateFunction?: (delta: number) => void;
  private effectUpdateFunction?: (delta: number) => void;
  
  // リアルタイムアニメーション用
  // リアルタイムアニメーション用（将来の拡張用）
  private _currentTime: number = 0;
  private _animationSpeed: number = 1.0;
  private lastFrameTime: number = performance.now();
  private effectsElapsed: number = 0; // エフェクト更新用の経過時間カウンター
  
  // パフォーマンス監視フラグ
  private performanceEnabled: boolean = true;
  
  // 破棄状態の追跡
  private isDestroyed: boolean = false;
  
  
  // settingsを読み取り専用で公開（readonlyで変更を防ぐ）
  public readonly settings: RendererSettings = {
    noteWidth: 28,
    noteHeight: 20,
    hitLineY: 0,
    pianoHeight: 200, // viewportHeightと同じ値に設定
    noteSpeed: 400,
    colors: {
      visible: 0x4A90E2,
      visibleBlack: 0x2C5282,
      hit: 0x48BB78,
      missed: 0xE53E3E,
      perfect: 0xF6E05E,
      good: 0x48BB78,
      whiteKey: 0xFFFFFF,
      blackKey: 0x2D2D2D,
      activeKey: 0x4A90E2
    },
            effects: {
          glow: true,
          particles: false,
          trails: false
        },
    noteNameStyle: 'off',
    simpleDisplayMode: false,
    transpose: 0,
    transposingInstrument: 'concert_pitch',
    practiceGuide: 'off',
    showHitLine: true,
    viewportHeight: 200, // pianoHeightと同じ値に設定
    timingAdjustment: 0
  };
  
  private onDragActive: boolean = false;
  private currentDragNote: number | null = null;
  
  // キープレス状態追跡（音が伸び続けるバグ防止の保険）
  private activeKeyPresses: Set<number> = new Set();
  
  
  constructor(width: number, height: number) {
    log.info(`🎯 PIXINotesRenderer constructor: ${width}x${height}`);
    
    // 指定された高さをそのまま使用
    const adjustedHeight = height;
    
    // ★ まず白鍵幅を求めてnoteWidthを設定
    const totalWhite = this.calculateTotalWhiteKeys();
    const whiteKeyWidth = width / totalWhite;
    this.settings.noteWidth = whiteKeyWidth - 2;   // 1px ずつ余白
    log.info(`🎹 White key width: ${whiteKeyWidth.toFixed(2)}px, Note width: ${this.settings.noteWidth.toFixed(2)}px`);
    
    // PIXI.js アプリケーション初期化（統合レンダリングループ版）
    this.app = new PIXI.Application({
      width,
      height: adjustedHeight, // ★ 最小高さを保証した高さを使用
      // 🎯 統合フレーム制御を使用して競合ループを回避
      autoStart: false, // 自動開始を無効化
      backgroundColor: 0x0A0A0F, // より暗い宇宙的な背景
      antialias: true,
      resolution: 1, // 解像度を固定して一貫性を保つ
      autoDensity: false, // 自動密度調整を無効化
      resizeTo: undefined, // 自動リサイズを無効化
      powerPreference: 'high-performance', // 高性能GPU使用
      backgroundAlpha: 1,
      clearBeforeRender: true,
      preserveDrawingBuffer: false, // パフォーマンス向上
      // 統一フレーム制御: SharedTicker を使用して GameEngine と同期
      sharedTicker: true
    });
    
    // 強制的にCanvasサイズを設定
    this.app.renderer.resize(width, adjustedHeight);
    
    log.debug(`🎯 PIXI.js App created - Canvas: ${this.app.view.width}x${this.app.view.height}`);
    
    // インタラクションを有効化（重要）
    // モバイルスクロールのため、ステージレベルでは`static`に設定
    // 背景エリアは`none`で、ピアノキーのみ`static`で個別に制御
    this.app.stage.eventMode = 'static';
    
    // 判定ラインをピアノの上端に正確に配置
    const actualHeight = this.app.view.height;
    this.settings.hitLineY = actualHeight - this.settings.pianoHeight;
    
    // サイズ不整合がある場合のみ警告
    if (width !== this.app.view.width || height !== this.app.view.height) {
      log.warn(`🚨 Canvas size mismatch - Expected: ${width}x${height}, Actual: ${this.app.view.width}x${this.app.view.height}`);
    }
    
    // テクスチャを事前生成
    try {
      this.generateNoteTextures();
      this.generateLabelTextures();
      log.debug('✅ Texture generation completed');
    } catch (error) {
      log.error('❌ Texture generation failed:', error);
    }
    
    // セットアップシーケンス
    try {
      this.setupContainers();
      this.createNotesAreaBackground();
      this.setupPiano();
      this.setupHitLine();
      log.debug('✅ PIXI setup sequence completed');
    } catch (error) {
      log.error('❌ PIXI setup failed:', error);
    }
    
    // ===== 新設計: Ticker管理を一元化 =====
    this.setupTickerSystem();
    
    // グローバルpointerupイベントで保険を掛ける（音が伸び続けるバグの最終防止）
    this.app.stage.on('globalpointerup', () => {
      // アクティブなキープレスを全て解除
      for (const midiNote of this.activeKeyPresses) {
        this.handleKeyRelease(midiNote);
      }
      this.activeKeyPresses.clear();
    });
    
    // 🎯 統合フレーム制御でPIXIアプリケーションを開始
    this.startUnifiedRendering();
    
    log.info('✅ PIXI.js renderer initialized successfully');
  }


  
  /**
   * ===== 新設計: Tickerシステムのセットアップ =====
   * 1. 更新ループとオブジェクトの結び付きを外せる構造
   * 2. 破棄時に適切にTicker関数を削除
   */
  private setupTickerSystem(): void {
    // メイン更新関数（ノートUpdater管理）
    this.mainUpdateFunction = (delta: number) => {
      if (this.isDestroyed || this.disposeManager.disposed) return;
      
      // パフォーマンス監視開始
      if (this.performanceEnabled) {
        performanceMonitor.startFrame();
      }

      // 全ノートUpdaterを更新
      for (const [noteId, updater] of this.noteUpdaters) {
        if (!updater.active) {
          this.noteUpdaters.delete(noteId);
          continue;
        }
        updater.update(delta);
      }

      // パフォーマンス監視終了
      if (this.performanceEnabled) {
        performanceMonitor.endFrame();
      }
    };

    // エフェクト更新関数（低頻度実行）
    this.effectUpdateFunction = (delta: number) => {
      if (this.isDestroyed || this.disposeManager.disposed) return;

      this.effectsElapsed += PIXI.Ticker.shared.deltaMS;
      if (this.effectsElapsed >= 33) { // ≒ 30 FPS
        // エフェクトUpdaterを更新
        for (const updater of this.effectUpdaters) {
          if (!updater.active) {
            this.effectUpdaters.delete(updater);
            continue;
          }
          updater.update(this.effectsElapsed / 1000);
        }

  
        this.effectsElapsed = 0;
      }
    };

    // Tickerに登録
    PIXI.Ticker.shared.add(this.mainUpdateFunction);
    PIXI.Ticker.shared.add(this.effectUpdateFunction);

    // 破棄時にTicker関数を削除するよう登録
    this.disposeManager.add(() => {
      if (this.mainUpdateFunction) {
        PIXI.Ticker.shared.remove(this.mainUpdateFunction);
        this.mainUpdateFunction = undefined;
      }
      if (this.effectUpdateFunction) {
        PIXI.Ticker.shared.remove(this.effectUpdateFunction);
        this.effectUpdateFunction = undefined;
      }
    });



    log.debug('✅ Ticker system setup completed');
  }

  /**
   * 🎯 統合フレーム制御でPIXIアプリケーションを開始
   */
  // GameEngineと同じunifiedFrameControllerを利用して描画ループを統合
  private startUnifiedRendering(): void {
    if (!window.unifiedFrameController) {
      log.warn('⚠️ unifiedFrameController not available, using default PIXI ticker');
      this.app.start();
      return;
    }
    
    // 統合フレーム制御を使用してPIXIアプリケーションを制御
    const renderFrame = () => {
      const currentTime = performance.now();
      
      // 統合フレーム制御でフレームスキップ判定
      if (window.unifiedFrameController.shouldSkipFrame(currentTime)) {
        // フレームをスキップ
        requestAnimationFrame(renderFrame);
        return;
      }
      
      // PIXIアプリケーションを手動でレンダリング（安全ガード付き）
      if (this.isDestroyed) {
        // 破棄済みの場合はレンダリングループを停止
        return;
      }
      
      try {
        if (this.app && this.app.renderer) {
          this.app.render();
        }
      } catch (error) {
        log.warn('⚠️ PIXI render error (likely destroyed):', error);
        // レンダリングループを停止
        return;
      }
      
      // 次のフレームをスケジュール
      requestAnimationFrame(renderFrame);
    };
    
    // レンダリングループを開始
    renderFrame();
    
    log.info('🎯 PIXI.js unified frame control started');
  }
  
  /**
   * ノーツテクスチャを事前生成
   */
  private generateNoteTextures(): void {
    // ★ 既存のテクスチャを破棄（再生成時）
    if (this.noteTextures) {
      Object.values(this.noteTextures).forEach(texture => {
        if (texture && texture !== PIXI.Texture.EMPTY && !texture.destroyed) {
          texture.destroy();
        }
      });
    }
    let { noteWidth, noteHeight } = this.settings;
    
    // 最小サイズを保証（平らなノーツ対応）
    if (noteHeight < 6) {
      log.warn(`⚠️ Note height too small (${noteHeight}), using minimum 6px`);
      noteHeight = 6;
    }
    if (noteWidth < 8) {
      log.warn(`⚠️ Note width too small (${noteWidth}), using minimum 8px`);
      noteWidth = 8;
    }
    
    log.info(`🎯 Generating note textures with size: ${noteWidth}x${noteHeight}`);
    
    // 白鍵ノーツテクスチャ
    const whiteGraphics = new PIXI.Graphics();
    this.drawNoteShapeToGraphics(whiteGraphics, 'visible', false, noteWidth, noteHeight);
    this.noteTextures = {
      whiteVisible: this.app.renderer.generateTexture(whiteGraphics),
      blackVisible: PIXI.Texture.EMPTY,
      hit: PIXI.Texture.EMPTY,
      missed: PIXI.Texture.EMPTY
    };
    
    // 黒鍵ノーツテクスチャ（白鍵の0.6倍の幅）
    const blackGraphics = new PIXI.Graphics();
    const blackRatio = 0.6;
    const blackWidth = noteWidth * blackRatio;
    this.drawNoteShapeToGraphics(blackGraphics, 'visible', true, blackWidth, noteHeight);
    this.noteTextures.blackVisible = this.app.renderer.generateTexture(blackGraphics);
    
    // ヒット状態テクスチャ（透明）
    const hitGraphics = new PIXI.Graphics();
    this.drawNoteShapeToGraphics(hitGraphics, 'hit', false, noteWidth, noteHeight);
    this.noteTextures.hit = this.app.renderer.generateTexture(hitGraphics);
    
    // ミス状態テクスチャ
    const missedGraphics = new PIXI.Graphics();
    this.drawNoteShapeToGraphics(missedGraphics, 'missed', false, noteWidth, noteHeight);
    this.noteTextures.missed = this.app.renderer.generateTexture(missedGraphics);
    
    // Graphics オブジェクトをクリーンアップ
    whiteGraphics.destroy();
    blackGraphics.destroy();
    hitGraphics.destroy();
    missedGraphics.destroy();
  }

  /**
   * ラベル用テクスチャアトラスを生成
   */
  private generateLabelTextures(): void {
    log.info('🎯 Starting comprehensive label texture generation...');

    // 既存のテクスチャを破棄
    if (this.labelTextures) {
      this.labelTextures.abc?.forEach(t => t.destroy());
      this.labelTextures.solfege?.forEach(t => t.destroy());
    }

    // ABC表記とソルフェージュ表記の包括的なマッピング
    // ダブルシャープ、ダブルフラット、白鍵の異名同音を含む
    const noteNameMapping: { [abc: string]: string } = {
      // Naturals
      'A': 'ラ', 'B': 'シ', 'C': 'ド', 'D': 'レ', 'E': 'ミ', 'F': 'ファ', 'G': 'ソ',
      // Sharps
      'A#': 'ラ#', 'C#': 'ド#', 'D#': 'レ#', 'F#': 'ファ#', 'G#': 'ソ#',
      // Flats
      'Ab': 'ラ♭', 'Bb': 'シ♭', 'Db': 'レ♭', 'Eb': 'ミ♭', 'Gb': 'ソ♭',
      // Enharmonic White Keys
      'B#': 'シ#', 'E#': 'ミ#',
      'Cb': 'ド♭', 'Fb': 'ファ♭',
      // Double Sharps
      'Ax': 'ラx', 'Bx': 'シx', 'Cx': 'ドx', 'Dx': 'レx', 'Ex': 'ミx', 'Fx': 'ファx', 'Gx': 'ソx',
      // Double Flats
      'Abb': 'ラ♭♭', 'Bbb': 'シ♭♭', 'Cbb': 'ド♭♭', 'Dbb': 'レ♭♭', 'Ebb': 'ミ♭♭', 'Fbb': 'ファ♭♭', 'Gbb': 'ソ♭♭',
    };

    // ラベルスタイル設定
    const labelStyle = new PIXI.TextStyle({
        fontSize: 14,
        fill: 0xFFFFFF,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        align: 'center',
        stroke: 0x000000,
        strokeThickness: 2
    });

    this.labelTextures = {
      abc: new Map(),
      solfege: new Map()
    };

    for (const abcName in noteNameMapping) {
      try {
        // ABC
        const abcText = new PIXI.Text(abcName, labelStyle);
        const abcTexture = this.app.renderer.generateTexture(abcText);
        if (abcTexture && abcTexture !== PIXI.Texture.EMPTY) {
          this.labelTextures.abc.set(abcName, abcTexture);
        }
        abcText.destroy();

        // Solfege
        const solfegeName = noteNameMapping[abcName];
        const solfegeText = new PIXI.Text(solfegeName, labelStyle);
        const solfegeTexture = this.app.renderer.generateTexture(solfegeText);
        if (solfegeTexture && solfegeTexture !== PIXI.Texture.EMPTY) {
          this.labelTextures.solfege.set(abcName, solfegeTexture); // キーはABC表記で統一
        }
        solfegeText.destroy();

            } catch (error) {
        log.error(`❌ Error generating texture for ${abcName}:`, error);
      }
    }

    log.info(`🎯 Label texture generation completed! Total ABC textures: ${this.labelTextures.abc.size}`);
  }

  /**
   * 複雑な音名を基本的な音名に変換（簡易表示モード用）
   */
  private getSimplifiedNoteName(noteName: string): string {
    // 複雑な音名を基本的な12音階に変換するマッピング
    const noteToMidiMap: { [key: string]: number } = {
      // 白鍵
      'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
      // 黒鍵（シャープ）
      'C#': 1, 'D#': 3, 'F#': 6, 'G#': 8, 'A#': 10,
      // 黒鍵（フラット）
      'Db': 1, 'Eb': 3, 'Gb': 6, 'Ab': 8, 'Bb': 10,
      // 異名同音（白鍵）
      'B#': 0, 'E#': 5, 'Cb': 11, 'Fb': 4,
      // ダブルシャープ
      'Ax': 11, 'Bx': 1, 'Cx': 1, 'Dx': 4, 'Ex': 6, 'Fx': 7, 'Gx': 9,
      // ダブルフラット
      'Abb': 7, 'Bbb': 9, 'Cbb': 10, 'Dbb': 0, 'Ebb': 2, 'Fbb': 3, 'Gbb': 5,
    };

    // 基本的な12音階の音名（シャープ記号使用）
    const basicNoteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // 音名をMIDIノート番号に変換
    const midiNote = noteToMidiMap[noteName];
    if (midiNote === undefined) {
      log.warn(`⚠️ Unknown note name for simplification: ${noteName}`);
      return noteName; // 変換できない場合は元の音名を返す
    }

    // 基本的な音名に変換
    return basicNoteNames[midiNote];
  }

  /**
   * 簡易表示用の音名変換（複雑な音名のみを基本音名に変換）
   */
  private getSimplifiedDisplayName(noteName: string): string {
    // オクターブ番号を除去
    const noteNameWithoutOctave = noteName.replace(/\d+$/, '');
    
    // 複雑な音名（ダブルシャープ、ダブルフラット、異名同音）の変換マッピング
    const complexToSimpleMap: { [key: string]: string } = {
      // 異名同音（白鍵）
      'B#': 'C', 'E#': 'F', 'Cb': 'B', 'Fb': 'E',
      // ダブルシャープ → 基本的な音名
      'Ax': 'B', 'Bx': 'C#', 'Cx': 'D', 'Dx': 'Eb', 'Ex': 'F#', 'Fx': 'G', 'Gx': 'A',
      // ダブルフラット → 基本的な音名
      'Abb': 'G', 'Bbb': 'A', 'Cbb': 'Bb', 'Dbb': 'C', 'Ebb': 'D', 'Fbb': 'Eb', 'Gbb': 'F',
    };
    
    // 複雑な音名の場合は変換、シンプルな音名（基本音名、シングル#、シングル♭）はそのまま
    const simplifiedEnglishName = complexToSimpleMap[noteNameWithoutOctave] || noteNameWithoutOctave;
    
    // 英語音名を日本語音名に変換
    const englishToJapaneseMap: { [key: string]: string } = {
      // 基本音名
      'C': 'ド', 'D': 'レ', 'E': 'ミ', 'F': 'ファ', 'G': 'ソ', 'A': 'ラ', 'B': 'シ',
      // シャープ
      'C#': 'ド#', 'D#': 'レ#', 'F#': 'ファ#', 'G#': 'ソ#', 'A#': 'ラ#',
      // フラット
      'Db': 'レ♭', 'Eb': 'ミ♭', 'Gb': 'ソ♭', 'Ab': 'ラ♭', 'Bb': 'シ♭',
    };
    
    return englishToJapaneseMap[simplifiedEnglishName] || simplifiedEnglishName;
  }

  /**
   * 英語音名簡易表示用の音名変換（複雑な音名のみを基本音名に変換）
   */
  private getEnglishSimplifiedDisplayName(noteName: string): string {
    // オクターブ番号を除去
    const noteNameWithoutOctave = noteName.replace(/\d+$/, '');
    
    // 複雑な音名（ダブルシャープ、ダブルフラット、異名同音）の変換マッピング
    const complexToSimpleMap: { [key: string]: string } = {
      // 異名同音（白鍵）
      'B#': 'C', 'E#': 'F', 'Cb': 'B', 'Fb': 'E',
      // ダブルシャープ → 基本的な音名
      'Ax': 'B', 'Bx': 'C#', 'Cx': 'D', 'Dx': 'Eb', 'Ex': 'F#', 'Fx': 'G', 'Gx': 'A',
      // ダブルフラット → 基本的な音名
      'Abb': 'G', 'Bbb': 'A', 'Cbb': 'Bb', 'Dbb': 'C', 'Ebb': 'D', 'Fbb': 'Eb', 'Gbb': 'F',
    };
    
    // 複雑な音名の場合は変換、シンプルな音名（基本音名、シングル#、シングル♭）はそのまま
    return complexToSimpleMap[noteNameWithoutOctave] || noteNameWithoutOctave;
  }

  /**
   * 日本語音名から英語音名に変換（テクスチャキー用）
   */
  private convertJapaneseToEnglishNoteName(japaneseName: string): string {
    // 日本語音名から英語音名への逆変換マッピング
    const japaneseToEnglishMap: { [key: string]: string } = {
      // 基本音名
      'ド': 'C', 'レ': 'D', 'ミ': 'E', 'ファ': 'F', 'ソ': 'G', 'ラ': 'A', 'シ': 'B',
      // シャープ
      'ド#': 'C#', 'レ#': 'D#', 'ファ#': 'F#', 'ソ#': 'G#', 'ラ#': 'A#',
      // フラット
      'レ♭': 'Db', 'ミ♭': 'Eb', 'ソ♭': 'Gb', 'ラ♭': 'Ab', 'シ♭': 'Bb',
      // 異名同音
      'シ#': 'B#', 'ミ#': 'E#', 'ド♭': 'Cb', 'ファ♭': 'Fb',
      // ダブルシャープ
      'ドx': 'Cx', 'レx': 'Dx', 'ミx': 'Ex', 'ファx': 'Fx', 'ソx': 'Gx', 'ラx': 'Ax', 'シx': 'Bx',
      // ダブルフラット
      'ド♭♭': 'Cbb', 'レ♭♭': 'Dbb', 'ミ♭♭': 'Ebb', 'ファ♭♭': 'Fbb', 'ソ♭♭': 'Gbb', 'ラ♭♭': 'Abb', 'シ♭♭': 'Bbb',
    };

    return japaneseToEnglishMap[japaneseName] || japaneseName;
  }

  /**
   * 音名に対応するラベルテクスチャを取得
   */
  private getLabelTexture(noteName: string): PIXI.Texture | null {
    if (!noteName || this.settings.noteNameStyle === 'off') {
      return null;
    }

    if (!this.labelTextures) {
      log.error('❌ getLabelTexture: labelTextures not initialized!');
      return null;
    }

    const style = this.settings.noteNameStyle;
    const noteNameWithoutOctave = noteName.replace(/\d+$/, '');

    let texture: PIXI.Texture | undefined;

    if (style === 'abc') {
      texture = this.labelTextures.abc.get(noteNameWithoutOctave);
    } else if (style === 'solfege') {
      if (/^[A-G]/.test(noteNameWithoutOctave)) {
        // 英語音名の場合：通常通り
        texture = this.labelTextures.solfege.get(noteNameWithoutOctave);
      } else {
        // 日本語音名の場合：英語音名に逆変換してからテクスチャを取得
        const englishName = this.convertJapaneseToEnglishNoteName(noteNameWithoutOctave);
        texture = this.labelTextures.solfege.get(englishName);
      }
    }

    if (!texture || texture === PIXI.Texture.EMPTY) {
      log.warn(`⚠️ getLabelTexture: No texture found for "${noteNameWithoutOctave}" (style: ${style})`);
      return null;
    }

    return texture;
  }


  
  /**
   * Graphics に描画（テクスチャ生成用）
   */
  private drawNoteShapeToGraphics(graphics: PIXI.Graphics, state: ActiveNote['state'], isBlackKey: boolean, noteWidth?: number, noteHeight?: number): void {
    graphics.clear();
    
    // サイズのパラメータが指定されていない場合はsettingsから取得
    const width = noteWidth ?? this.settings.noteWidth;
    const height = noteHeight ?? this.settings.noteHeight;
    
    // GOOD 判定（state === 'hit') ではノーツを透明にする
    if (state === 'hit') {
      // 透明化してスペースを残す（クリック判定など影響させない）
      graphics.beginFill(0x000000, 0);
      graphics.drawRect(-width / 2, -height / 2, width, height);
      graphics.endFill();
      return;
    }

    // より美しいグラデーション効果を再現（平らなノーツ対応）
    if (state === 'visible') {
      if (isBlackKey) {
        // 黒鍵ノーツ（紫系のグラデーション）- 平らなノーツ用に調整
        const steps = Math.max(2, Math.min(4, Math.floor(height / 2))); // 高さに応じて段数を調整
        const stepHeight = height / steps;
        
        for (let i = 0; i < steps; i++) {
          const progress = i / (steps - 1);
          
          // 紫系のグラデーション
          const r1 = 0x4C, g1 = 0x1D, b1 = 0x95; // purple-800
          const r2 = 0x7C, g2 = 0x3A, b2 = 0xED; // purple-600
          
          const r = Math.round(r1 + (r2 - r1) * progress);
          const g = Math.round(g1 + (g2 - g1) * progress);
          const b = Math.round(b1 + (b2 - b1) * progress);
          
          const color = (r << 16) | (g << 8) | b;
          const alpha = 0.9 + 0.05 * progress;
          
          graphics.beginFill(color, alpha);
          graphics.drawRoundedRect(
            -width / 2,
            -height / 2 + i * stepHeight,
            width,
            stepHeight + 1,
            i === 0 ? Math.min(3, height / 2) : 0 // 高さに応じて角丸を調整
          );
          graphics.endFill();
        }
        
        // 紫のハイライト効果
        graphics.beginFill(0x9333EA, 0.4);
        graphics.drawRoundedRect(
          -width / 2,
          -height / 2,
          width,
          height / 3,
          Math.min(3, height / 2) // 高さに応じて角丸を調整
        );
        graphics.endFill();
        
        // 紫の輪郭線
        graphics.lineStyle(1, 0x8B5CF6, 0.8);
        graphics.drawRoundedRect(-width / 2, -height / 2, width, height, Math.min(3, height / 2)); // 高さに応じて角丸を調整
      } else {
        // 白鍵ノーツ（青系のグラデーション）- 平らなノーツ用に調整
        const steps = Math.max(2, Math.min(4, Math.floor(height / 2))); // 高さに応じて段数を調整
        const stepHeight = height / steps;
        
        for (let i = 0; i < steps; i++) {
          const progress = i / (steps - 1);
          
          // 青系のグラデーション
          const r1 = 0x16, g1 = 0x21, b1 = 0x3E; // topColor RGB
          const r2 = 0x0F, g2 = 0x34, b2 = 0x60; // bottomColor RGB
          
          const r = Math.round(r1 + (r2 - r1) * progress);
          const g = Math.round(g1 + (g2 - g1) * progress);
          const b = Math.round(b1 + (b2 - b1) * progress);
          
          const color = (r << 16) | (g << 8) | b;
          const alpha = 0.9 + 0.05 * progress;
          
          graphics.beginFill(color, alpha);
          graphics.drawRoundedRect(
            -width / 2,
            -height / 2 + i * stepHeight,
            width,
            stepHeight + 1,
            i === 0 ? Math.min(3, height / 2) : 0 // 高さに応じて角丸を調整
          );
          graphics.endFill();
        }
        
        // 青のハイライト効果
        graphics.beginFill(0x667EEA, 0.3);
        graphics.drawRoundedRect(
          -width / 2,
          -height / 2,
          width,
          height / 3,
          Math.min(3, height / 2) // 高さに応じて角丸を調整
        );
        graphics.endFill();
        
        // 青の輪郭線
        graphics.lineStyle(1, 0x4F46E5, 0.8);
        graphics.drawRoundedRect(-width / 2, -height / 2, width, height, Math.min(3, height / 2)); // 高さに応じて角丸を調整
      }
    } else {
      const color = this.getStateColor(state);
      graphics.beginFill(color);
      graphics.drawRoundedRect(-width / 2, -height / 2, width, height, Math.min(3, height / 2)); // 高さに応じて角丸を調整
      graphics.endFill();
      
      // 輪郭線
      graphics.lineStyle(1, color, 0.8);
      graphics.drawRoundedRect(-width / 2, -height / 2, width, height, Math.min(3, height / 2)); // 高さに応じて角丸を調整
    }
  }
  
  private setupContainers(): void {
    // メインコンテナ
    this.container = new PIXI.Container();
    this.container.sortableChildren = true;
    this.app.stage.addChild(this.container);

    // ノーツ専用コンテナ（ParticleContainer使用でパフォーマンス向上）
    this.whiteNotes = new PIXI.ParticleContainer(1000, {
      scale: true,
      position: true,
      rotation: false,
      uvs: false,
      alpha: true
    });
    this.whiteNotes.zIndex = 5;
    this.container.addChild(this.whiteNotes);

    this.blackNotes = new PIXI.ParticleContainer(1000, {
      scale: true,
      position: true,
      rotation: false,
      uvs: false,
      alpha: true
    });
    this.blackNotes.zIndex = 6;
    this.container.addChild(this.blackNotes);

    // ラベル専用コンテナ（通常のContainer）
    this.labelsContainer = new PIXI.Container();
    this.labelsContainer.zIndex = 7;
    this.container.addChild(this.labelsContainer);

    // エフェクト用コンテナ
    this.effectsContainer = new PIXI.Container();
    this.effectsContainer.zIndex = 8;
    this.container.addChild(this.effectsContainer);

    // ヒットライン用コンテナ
    this.hitLineContainer = new PIXI.Container();
    this.hitLineContainer.zIndex = 9;
    this.container.addChild(this.hitLineContainer);

    // ピアノコンテナ（最上層）- 横スクロール機能を追加
    this.pianoContainer = new PIXI.Container();
    this.pianoContainer.zIndex = 10;
    this.pianoContainer.interactive = true;
    this.pianoContainer.cursor = 'pointer';
    
    // ピアノコンテナの横スクロール設定
    this.pianoContainer.on('wheel', (e: PIXI.FederatedWheelEvent) => {
      // Shiftキー押下時または横スクロールイベント時に横スクロール
      if (e.deltaX !== 0 || e.shiftKey) {
        e.preventDefault();
        const deltaX = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        this.pianoContainer.x = Math.max(
          Math.min(this.pianoContainer.x - deltaX, 0),
          -(this.pianoContainer.width - this.app.screen.width)
        );
      }
    });
    
    // ドラッグによる横スクロール
    let isDragging = false;
    let dragStartX = 0;
    let containerStartX = 0;
    
    this.pianoContainer.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
      if (e.button === 1) { // 中ボタンでドラッグスクロール
        isDragging = true;
        dragStartX = e.globalX;
        containerStartX = this.pianoContainer.x;
        this.pianoContainer.cursor = 'grabbing';
        e.stopPropagation();
      }
    });
    
    this.pianoContainer.on('pointerup', () => {
      if (isDragging) {
        isDragging = false;
        this.pianoContainer.cursor = 'pointer';
      }
    });
    
    this.pianoContainer.on('pointermove', (e: PIXI.FederatedPointerEvent) => {
      if (isDragging) {
        const deltaX = e.globalX - dragStartX;
        this.pianoContainer.x = Math.max(
          Math.min(containerStartX + deltaX, 0),
          -(this.pianoContainer.width - this.app.screen.width)
        );
        e.stopPropagation();
      }
    });
    
    this.container.addChild(this.pianoContainer);

    // パーティクル用コンテナ
    this.particles = new PIXI.Container();
    this.particles.zIndex = 15;
    this.container.addChild(this.particles);

    // ヒットライン表示
    this.setupHitLine();

    // ピアノ鍵盤の設定
    this.setupPiano();



    // 背景とガイドライン（全コンテナ作成後に実行）
    this.createNotesAreaBackground();
    this.createVerticalGuidelines();

    log.debug('✅ PIXI.js コンテナセットアップ完了');
  }
  
  private setupHitLine(): void {
    const hitLine = new PIXI.Graphics();
    hitLine.lineStyle(3, 0xFBBF24); // amber-400
    hitLine.moveTo(0, this.settings.hitLineY);
    hitLine.lineTo(this.app.screen.width, this.settings.hitLineY);
    
    // グロー効果
    const glowLine = new PIXI.Graphics();
    glowLine.lineStyle(6, 0xFBBF24, 0.5);
    glowLine.moveTo(0, this.settings.hitLineY);
    glowLine.lineTo(this.app.screen.width, this.settings.hitLineY);
    
    this.hitLineContainer.addChild(glowLine);
    this.hitLineContainer.addChild(hitLine);
  }
  
  private setupPiano(): void {
    // ピアノ背景のグラデーション効果を追加
    this.createPianoBackground();
    
    // 88鍵ピアノの描画（A0=21 to C8=108）
    const minNote = 21;
    const maxNote = 108;
    
    // 白鍵の総数を計算
    let totalWhiteKeys = 0;
    for (let note = minNote; note <= maxNote; note++) {
      if (!this.isBlackKey(note)) {
        totalWhiteKeys++;
      }
    }
    
    // 画面幅に合わせて白鍵幅を動的計算（最小12px確保）
    const whiteKeyWidth = Math.max(this.app.screen.width / totalWhiteKeys, 12);
    
    // 白鍵コンテナと黒鍵コンテナを分離して Z-index を確実に制御
    const whiteKeysContainer = new PIXI.Container();
    const blackKeysContainer = new PIXI.Container();
    
    // 白鍵を描画
    let whiteKeyIndex = 0;
    for (let note = minNote; note <= maxNote; note++) {
      if (!this.isBlackKey(note)) {
        const whiteKey = this.createWhiteKey(whiteKeyIndex * whiteKeyWidth, whiteKeyWidth, note);
        whiteKeysContainer.addChild(whiteKey);
        this.pianoSprites.set(note, whiteKey);
        whiteKeyIndex++;
      }
    }
    
    // 黒鍵を描画（白鍵の上、正確な位置計算）
    for (let note = minNote; note <= maxNote; note++) {
      if (this.isBlackKey(note)) {
        const position = this.calculateBlackKeyPosition(note, minNote, maxNote, totalWhiteKeys);
        const blackKey = this.createBlackKey(
          position, 
          whiteKeyWidth, // 白鍵の幅を渡し、createBlackKey内で比率計算
          note
        );
        blackKeysContainer.addChild(blackKey);
        this.pianoSprites.set(note, blackKey);
      }
    }
    
    // コンテナを順序付けて追加（白鍵が背面、黒鍵が前面）
    this.pianoContainer.addChild(whiteKeysContainer);
    this.pianoContainer.addChild(blackKeysContainer);
    
    // ピアノコンテナ全体のサイズを画面に合わせて設定
    this.pianoContainer.width = this.app.screen.width;
    this.pianoContainer.height = this.settings.pianoHeight;
    
    log.debug('🎹 ピアノコンテナサイズ設定:', {
      width: this.pianoContainer.width,
      height: this.pianoContainer.height,
      screenWidth: this.app.screen.width,
      settingsPianoHeight: this.settings.pianoHeight
    });
    
    // ===== グリッサンド用ドラッグハンドラ =====
    // 安定性向上のためグリッサンド機能を無効化。
    // マウス／タッチ操作によるキーのドラッグ移動での連続発音を行わない。
    // 個別鍵盤の pointerdown / pointerup はそれぞれの鍵盤に実装済み。
    // this.pianoContainer.eventMode = 'static';
    // this.pianoContainer.on('pointerdown', this.handleDragStart.bind(this));
    // this.pianoContainer.on('pointermove', this.handleDragMove.bind(this));
    // this.pianoContainer.on('pointerup', this.handleDragEnd.bind(this));
    // this.pianoContainer.on('pointerupoutside', this.handleDragEnd.bind(this));
    // this.pianoContainer.on('pointercancel', this.handleDragEnd.bind(this));
  }
  
  /**
   * ノーツ降下エリアの宇宙的背景とガイドラインを作成
   */
  private createNotesAreaBackground(): void {
    // === 宇宙的ホライズングラデーション背景 ===
    const background = new PIXI.Graphics();
    const steps = 50; // より滑らかなグラデーション
    const stepHeight = this.settings.hitLineY / steps;
    
    for (let i = 0; i < steps; i++) {
      const progress = i / (steps - 1);
      
      // 宇宙的な色の遷移: 深い紫から星空の青、そして地平線の赤紫へ
      // 上部: 深い宇宙の紫 (深い紺)
      // 中央: 星雲の青紫
      // 下部: 地平線の暖かい紫
      const r1 = 10, g1 = 5, b1 = 25;    // 深い宇宙の紫（上部）
      const r2 = 25, g2 = 15, b2 = 45;   // 中間の青紫
      const r3 = 45, g3 = 20, b3 = 35;   // 地平線の暖かい紫（下部）
      
      let r, g, b;
      if (progress < 0.5) {
        // 上半分: 深い宇宙から中間色へ
        const localProgress = progress * 2;
        r = Math.round(r1 + (r2 - r1) * localProgress);
        g = Math.round(g1 + (g2 - g1) * localProgress);
        b = Math.round(b1 + (b2 - b1) * localProgress);
      } else {
        // 下半分: 中間色から地平線へ
        const localProgress = (progress - 0.5) * 2;
        r = Math.round(r2 + (r3 - r2) * localProgress);
        g = Math.round(g2 + (g3 - g2) * localProgress);
        b = Math.round(b2 + (b3 - b2) * localProgress);
      }
      
      const color = (r << 16) | (g << 8) | b;
      const alpha = 0.9 + 0.1 * progress; // 下部に向かって少し濃く
      
      background.beginFill(color, alpha);
      background.drawRect(0, i * stepHeight, this.app.screen.width, stepHeight + 1);
      background.endFill();
    }
    
    // 星のエフェクトを追加
    this.createStarField(background);
    
    // 背景エリアのイベントを透過（スクロール可能に）
    background.eventMode = 'none';
    
    this.container.addChildAt(background, 0); // 最背面に配置
    
    // === 縦ガイドライン（白鍵レーン）===
    this.createVerticalGuidelines();
  }
  
  /**
   * 星空エフェクトを作成
   */
  private createStarField(background: PIXI.Graphics): void {
    const starCount = 80;
    
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * this.app.screen.width;
      const y = Math.random() * this.settings.hitLineY;
      const size = Math.random() * 2 + 0.5;
      const brightness = Math.random() * 0.8 + 0.2;
      
      // 星の色をランダムに（青白、白、薄紫）
      const starColors = [0xFFFFFF, 0xE0E7FF, 0xDDD6FE, 0xFAF5FF];
      const color = starColors[Math.floor(Math.random() * starColors.length)];
      
      background.beginFill(color, brightness);
      background.drawCircle(x, y, size);
      background.endFill();
      
      // 輝く星（大きめ）
      if (Math.random() < 0.1) {
        background.beginFill(color, brightness * 0.3);
        background.drawCircle(x, y, size * 3);
        background.endFill();
      }
    }
  }
  
  /**
   * 白鍵に合わせた縦ガイドラインを作成（簡素化版）
   */
  private createVerticalGuidelines(): void {
    // ★ 再生成時に古いものを破棄
    if (this.guidelines) {
      this.guidelines.destroy();
      this.guidelines = undefined;
    }
    
    const guidelines = new PIXI.Graphics();
    this.guidelines = guidelines; // ★ 保持しておく
    
    // ガイドラインのイベントを透過（スクロール可能に）
    guidelines.eventMode = 'none';
    
    // 88鍵ピアノの設定
    const minNote = 21; // A0
    const maxNote = 108; // C8
    
    // 白鍵の総数を計算
    let totalWhiteKeys = 0;
    for (let note = minNote; note <= maxNote; note++) {
      if (!this.isBlackKey(note)) {
        totalWhiteKeys++;
      }
    }
    
    const whiteKeyWidth = this.app.screen.width / totalWhiteKeys;
    
    // オクターブのCノートのみにガイドラインを描画（視覚的な目安）
    let whiteKeyIndex = 0;
    for (let note = minNote; note <= maxNote; note++) {
      if (!this.isBlackKey(note)) {
        // ★ ピクセル中央に合わせるため 0.5px シフト
        const x = Math.round(whiteKeyIndex * whiteKeyWidth) + 0.5;
        
        // 全ての白鍵に境界線を描画
        const noteName = this.getMidiNoteName(note);
        const isOctaveMarker = noteName === 'C';
        
        // Cノートは少し濃く、他も見やすい濃さに調整
        const lineWidth = isOctaveMarker ? 2 : 1;
        const alpha = isOctaveMarker ? 0.4 : 0.35; // ★ 0.25 → 0.35 に変更
        const color = isOctaveMarker ? 0x8B5CF6 : 0x6B7280;
        
        guidelines.lineStyle(lineWidth, color, alpha);
        guidelines.moveTo(x, 0);
        // ★ ヒットラインの1px上で止める
        guidelines.lineTo(x, this.settings.hitLineY - 1);
        
        whiteKeyIndex++;
      }
    }
    
    // ガイドラインは Graphics なので ParticleContainer ではなく通常のコンテナに追加
    // 白鍵ノーツの後ろに配置するため、whiteNotes の直前に挿入
    const whiteNotesIndex = this.container.getChildIndex(this.whiteNotes);
    this.container.addChildAt(guidelines, whiteNotesIndex);
  }
  
  /**
   * ピアノ背景のグラデーション効果を作成
   */
  private createPianoBackground(): void {
    const background = new PIXI.Graphics();
    
    // より滑らかなグラデーション効果を作成
    const steps = 10;
    const stepHeight = this.settings.pianoHeight / steps;
    
    for (let i = 0; i < steps; i++) {
      const progress = i / (steps - 1);
      
      // ピアノ部分は暖かい色調で背景と調和
      const r1 = 30, g1 = 25, b1 = 50;   // 上部：深い紫
      const r2 = 20, g2 = 30, b2 = 60;   // 下部：濃い青紫
      
      const r = Math.round(r1 + (r2 - r1) * progress);
      const g = Math.round(g1 + (g2 - g1) * progress);
      const b = Math.round(b1 + (b2 - b1) * progress);
      
      const color = (r << 16) | (g << 8) | b;
      const alpha = 0.8 + 0.1 * progress; // 透明度を下げて判定ラインを見やすく
      
      background.beginFill(color, alpha);
      background.drawRect(0, i * stepHeight, this.app.screen.width, stepHeight + 1);
      background.endFill();
    }
    
    // ピアノ背景の位置設定 - 画面底部に固定
    background.x = 0;
    background.y = this.settings.hitLineY;
    
    // ピアノ背景のイベントを透過
    background.eventMode = 'none';
    
    this.pianoContainer.addChild(background);
  }
  

  
  private setupLightweightEffectsTicker(): void {
    // 統合済みのため空実装（エフェクト更新はPIXIのTickerに統合済み）
  }
  

  
  private createWhiteKey(x: number, width: number, midiNote?: number): PIXI.Graphics {
    const key = new PIXI.Graphics();
    key.beginFill(this.settings.colors.whiteKey);
    key.lineStyle(1, 0x000000, 0.3);
    key.drawRect(0, 0, width - 1, this.settings.pianoHeight);
    key.endFill();
    key.x = x;
    key.y = this.settings.hitLineY; // 判定ライン位置から開始
    
    // 音名表示を追加（白鍵のみ）
    if (midiNote !== undefined && !this.isBlackKey(midiNote)) {
      const _noteName = this.getMidiNoteName(midiNote);
      const text = new PIXI.Text(_noteName, {
        fontSize: Math.min(width * 0.4, 16),
        fill: 0x666666,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        align: 'center'
      });
      
      // テキストを中央に配置
      text.anchor.set(0.5, 1);
      text.x = width / 2;
      text.y = this.settings.pianoHeight - 8;
      key.addChild(text);
    }
    
          // インタラクション設定を強化
      if (midiNote !== undefined) {
        key.eventMode = 'static';
        key.cursor = 'pointer';
      
      // リリース処理の共通関数
      const releaseKey = (event?: PIXI.FederatedPointerEvent) => {
        this.handleKeyRelease(midiNote);
        if (event) {
          try {
            (event.currentTarget as any).releasePointer?.(event.pointerId);
          } catch (err) {
            // Safari等未対応ブラウザでは無視
          }
        }
      };
      
      // ポインタキャプチャ対応の確実なイベント処理
      key.on('pointerdown', (event) => {
        event.stopPropagation();
        // ポインタキャプチャで押したまま外に出ても確実にpointerupを受信
        try {
          (event.currentTarget as any).capturePointer?.(event.pointerId);
        } catch (err) {
          // Safari等未対応ブラウザでは無視
        }
        this.handleKeyPress(midiNote);
      });
      
      // 複数のリリースイベントに対応
      key.on('pointerup', (event) => {
        event.stopPropagation();
        releaseKey(event);
      });
      
      // 鍵盤外でリリースした場合（重要: 音が伸び続けるバグの修正）
      key.on('pointerupoutside', (event) => {
        event.stopPropagation();
        releaseKey(event);
      });
      
      // ポインタキャンセル時も確実に解除
      key.on('pointercancel', (event) => {
        event.stopPropagation();
        releaseKey(event);
      });
      
      // ポインタが鍵盤から離れた場合も解除（スクロール対応）
      key.on('pointerleave', (event) => {
        event.stopPropagation();
        releaseKey(event);
      });
      
      // タッチデバイス対応
      // pointerイベントがタッチとマウスの両方を処理するため、touchイベントは不要
      // （touchイベントとpointerイベントの両方が発火して2重になるのを防ぐ）
      
      // ホバー効果を追加
      key.on('pointerover', () => {
        key.tint = 0xF3F4F6; // light gray hover
      });
      
      key.on('pointerout', () => {
        key.tint = 0xFFFFFF; // white
      });
    }
    
    return key;
  }
  
  private createBlackKey(x: number, width: number, midiNote?: number): PIXI.Graphics {
    const key = new PIXI.Graphics();
    
    // 黒鍵の幅を拡大してクリックしやすくする（白鍵の80%）
    const blackKeyWidthRatio = 0.8;
    const adjustedWidth = width * blackKeyWidthRatio;
    const blackKeyHeight = this.settings.pianoHeight * 0.65; // 高さも若干拡大
    
    // 黒鍵の影（背面）
    key.beginFill(0x000000, 0.3); // 薄い黒の影
    key.drawRect(-adjustedWidth * 0.75 / 2 + 1, 1, adjustedWidth * 0.75, blackKeyHeight); // 少しオフセット
    key.endFill();
    
    // 視覚的な黒鍵（メイン）- 純粋な黒色
    key.beginFill(this.settings.colors.blackKey); // 純粋な黒色
    key.drawRect(-adjustedWidth * 0.75 / 2, 0, adjustedWidth * 0.75, blackKeyHeight);
    key.endFill();
    
    // 黒鍵の上端ハイライト（微妙な光沢効果）
    key.beginFill(0x333333, 0.6); // 薄いグレー
    key.drawRect(-adjustedWidth * 0.75 / 2, 0, adjustedWidth * 0.75, 2);
    key.endFill();
    
    // クリック領域（完全透明、視覚的影響なし）
    key.beginFill(0x000000, 0.0); // 完全透明
    key.drawRect(-adjustedWidth / 2, 0, adjustedWidth, blackKeyHeight);
    key.endFill();
    
    key.x = x;
    key.y = this.settings.hitLineY; // 判定ライン位置から開始
    
          // インタラクション設定を強化
      if (midiNote !== undefined) {
        key.eventMode = 'static';
        key.cursor = 'pointer';
      
      // リリース処理の共通関数
      const releaseKey = (event?: PIXI.FederatedPointerEvent) => {
        this.handleKeyRelease(midiNote);
        if (event) {
          try {
            (event.currentTarget as any).releasePointer?.(event.pointerId);
          } catch (err) {
            // Safari等未対応ブラウザでは無視
          }
        }
      };
      
      // ポインタキャプチャ対応の確実なイベント処理
      key.on('pointerdown', (event) => {
        event.stopPropagation();
        // ポインタキャプチャで押したまま外に出ても確実にpointerupを受信
        try {
          (event.currentTarget as any).capturePointer?.(event.pointerId);
        } catch (err) {
          // Safari等未対応ブラウザでは無視
        }
        this.handleKeyPress(midiNote);
      });
      
      // 複数のリリースイベントに対応
      key.on('pointerup', (event) => {
        event.stopPropagation();
        releaseKey(event);
      });
      
      // 鍵盤外でリリースした場合（重要: 音が伸び続けるバグの修正）
      key.on('pointerupoutside', (event) => {
        event.stopPropagation();
        releaseKey(event);
      });
      
      // ポインタキャンセル時も確実に解除
      key.on('pointercancel', (event) => {
        event.stopPropagation();
        releaseKey(event);
      });
      
      // ポインタが鍵盤から離れた場合も解除（スクロール対応）
      key.on('pointerleave', (event) => {
        event.stopPropagation();
        releaseKey(event);
      });
      
      // タッチデバイス対応
      // pointerイベントがタッチとマウスの両方を処理するため、touchイベントは不要
      // （touchイベントとpointerイベントの両方が発火して2重になるのを防ぐ）
      
      // ホバー効果を追加（黒鍵専用、tintではなく軽微な視覚効果のみ）
      key.on('pointerover', () => {
        // 黒鍵のホバー効果は微妙にして、ハイライト状態を阻害しない
        if (!this.isKeyHighlighted(midiNote)) {
          key.alpha = 0.8; // 少し透明にしてホバー感を演出
        }
      });
      
      key.on('pointerout', () => {
        // ハイライト状態でない場合のみリセット
        if (!this.isKeyHighlighted(midiNote)) {
          key.alpha = 1.0; // 通常状態に戻す
        }
      });
    }
    
    return key;
  }
  
  /**
   * MIDIノート番号から音名を取得（統一された設定を使用）
   */
  private getMidiNoteName(midiNote: number): string {
    // 統一された表示スタイルを取得
    const style = this.settings.noteNameStyle;

    if (style === 'off') return '';

    // 移調楽器の設定を考慮した音名計算
    let displayNote = midiNote;
    
    // 移調楽器の移調量を取得（音名表示用）
    if (this.settings.transposingInstrument !== 'concert_pitch') {
      // 移調楽器の移調量をハードコードで計算（musicXmlTransposer.tsと同じロジック）
      let transposingInstrumentSemitones = 0;
      switch (this.settings.transposingInstrument) {
        case 'bb_major_2nd':
          transposingInstrumentSemitones = 2; // in Bb (長2度上) - 実音より2半音低く聞こえる → 楽譜は2半音上に書く
          break;
        case 'bb_major_9th':
          transposingInstrumentSemitones = 14; // in Bb (1オクターブ+長2度上) - 実音より14半音低く聞こえる → 楽譜は14半音上に書く
          break;
        case 'eb_major_6th':
          transposingInstrumentSemitones = 9; // in Eb (長6度上) - 実音より9半音低く聞こえる → 楽譜は9半音上に書く
          break;
        case 'eb_major_13th':
          transposingInstrumentSemitones = 21; // in Eb (1オクターブ+長6度上) - 実音より21半音低く聞こえる → 楽譜は21半音上に書く
          break;
      }
      displayNote = midiNote + transposingInstrumentSemitones;
    }

    // 12音階の名前テーブル（デフォルトはシャープ）
    const sharpNamesABC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const sharpNamesSolfege = ['ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ'];

    const index = displayNote % 12;

    if (style === 'abc') {
      return sharpNamesABC[index];
    }
    if (style === 'solfege') {
      return sharpNamesSolfege[index];
    }

    // fallback
    return sharpNamesABC[index];
  }
  
  private isBlackKey(midiNote: number): boolean {
    const noteInOctave = midiNote % 12;
    return [1, 3, 6, 8, 10].includes(noteInOctave);
  }
  
  /**
   * キーがハイライト状態かどうかを確認
   */
  private isKeyHighlighted(midiNote: number): boolean {
    return this.highlightedKeys.has(midiNote);
  }
  
  private calculateBlackKeyPosition(note: number, minNote: number, _maxNote: number, totalWhiteKeys: number): number {
    const noteInOctave = note % 12;
    
    // 隣接する白鍵のMIDIノート番号を特定
    let prevWhiteNote: number, nextWhiteNote: number;
    
    switch (noteInOctave) {
      case 1:  // C#
        prevWhiteNote = note - 1;  // C
        nextWhiteNote = note + 1;  // D
        break;
      case 3:  // D#
        prevWhiteNote = note - 1;  // D
        nextWhiteNote = note + 1;  // E
        break;
      case 6:  // F#
        prevWhiteNote = note - 1;  // F
        nextWhiteNote = note + 1;  // G
        break;
      case 8:  // G#
        prevWhiteNote = note - 1;  // G
        nextWhiteNote = note + 1;  // A
        break;
      case 10: // A#
        prevWhiteNote = note - 1;  // A
        nextWhiteNote = note + 1;  // B
        break;
      default:
        log.error(`❌ Invalid black key note: ${note}`);
        return 0; // 無効な黒鍵
    }
    
    // Piano.tsと同じロジックで白鍵インデックスを計算
    let prevWhiteKeyIndex = 0;
    for (let n = minNote; n < prevWhiteNote; n++) {
      if (!this.isBlackKey(n)) {
        prevWhiteKeyIndex++;
      }
    }
    
    let nextWhiteKeyIndex = 0;
    for (let n = minNote; n < nextWhiteNote; n++) {
      if (!this.isBlackKey(n)) {
        nextWhiteKeyIndex++;
      }
    }
    
    // 白鍵の幅を計算
    const whiteKeyWidth = this.app.screen.width / totalWhiteKeys;
    
    // より正確な位置計算
    // 左の白鍵の中央位置
    const prevKeyCenter = (prevWhiteKeyIndex + 0.5) * whiteKeyWidth;
    
    // 右の白鍵の中央位置
    const nextKeyCenter = (nextWhiteKeyIndex + 0.5) * whiteKeyWidth;
    
    // 2つの白鍵の中央位置の中点を計算
    const centerPosition = (prevKeyCenter + nextKeyCenter) / 2;
    
    return centerPosition;
  }
  
  /**
   * ピアノキーの状態更新（演奏時のハイライト）
   */
  highlightKey(midiNote: number, active: boolean): void {
    const keySprite = this.pianoSprites.get(midiNote);
    if (!keySprite) {
      log.warn(`⚠️ Key sprite not found for note: ${midiNote}`);
      return;
    }
    
    const isBlackKey = this.isBlackKey(midiNote);
    
    if (active) {
      // ハイライト状態に追加
      this.highlightedKeys.add(midiNote);
      
      if (isBlackKey) {
        // 黒鍵のハイライト：オレンジ色で再描画
        this.redrawBlackKeyHighlight(keySprite, true);
      } else {
        // 白鍵のハイライト：tintを使用
        keySprite.tint = this.settings.colors.activeKey;
      }
    } else {
      // ハイライト状態から削除
      this.highlightedKeys.delete(midiNote);
      
      if (isBlackKey) {
        // 黒鍵の通常状態：元の色で再描画
        this.redrawBlackKeyHighlight(keySprite, false);
        // アルファ値もリセット
        keySprite.alpha = 1.0;
      } else {
        // 白鍵の通常状態：tintをリセット
        keySprite.tint = 0xFFFFFF;
      }
    }
  }
  
  /**
   * 黒鍵のハイライト状態を再描画
   */
  private redrawBlackKeyHighlight(keySprite: PIXI.Graphics, highlighted: boolean): void {
    keySprite.clear();
    
    // 基本的な寸法を再計算（createBlackKeyと同じ値）
    const whiteKeyWidth = this.app.screen.width / this.calculateTotalWhiteKeys();
    const blackKeyWidthRatio = 0.8;
    const adjustedWidth = whiteKeyWidth * blackKeyWidthRatio;
    const blackKeyHeight = this.settings.pianoHeight * 0.65;
    
    if (highlighted) {
      // より鮮やかなオレンジ色のグロー効果（外側）
      keySprite.beginFill(0xFF8C00, 0.6); // より鮮やかなオレンジ
      keySprite.drawRect(-adjustedWidth * 0.9 / 2, -2, adjustedWidth * 0.9, blackKeyHeight + 4);
      keySprite.endFill();
      
      // ハイライト状態：鮮やかなオレンジ色で描画
      keySprite.beginFill(0xFF8C00); // より鮮やかなオレンジ色 (DarkOrange)
      keySprite.drawRect(-adjustedWidth * 0.75 / 2, 0, adjustedWidth * 0.75, blackKeyHeight);
      keySprite.endFill();
      
      // 上部のハイライト効果（より明るいオレンジ）
      keySprite.beginFill(0xFFB347, 0.9); // 明るいオレンジ
      keySprite.drawRect(-adjustedWidth * 0.75 / 2, 0, adjustedWidth * 0.75, blackKeyHeight * 0.3);
      keySprite.endFill();
      
      // クリック領域（ハイライト時は薄いオレンジ）
      keySprite.beginFill(0xFF8C00, 0.3);
      keySprite.drawRect(-adjustedWidth / 2, 0, adjustedWidth, blackKeyHeight);
      keySprite.endFill();
    } else {
      // 黒鍵の影（背面）
      keySprite.beginFill(0x000000, 0.3); // 薄い黒の影
      keySprite.drawRect(-adjustedWidth * 0.75 / 2 + 1, 1, adjustedWidth * 0.75, blackKeyHeight);
      keySprite.endFill();
      
      // 通常状態：純粋な黒色で描画
      keySprite.beginFill(this.settings.colors.blackKey); // 純粋な黒色
      keySprite.drawRect(-adjustedWidth * 0.75 / 2, 0, adjustedWidth * 0.75, blackKeyHeight);
      keySprite.endFill();
      
      // 黒鍵の上端ハイライト（微妙な光沢効果）
      keySprite.beginFill(0x333333, 0.6); // 薄いグレー
      keySprite.drawRect(-adjustedWidth * 0.75 / 2, 0, adjustedWidth * 0.75, 2);
      keySprite.endFill();
      
      // クリック領域（透明、視覚的な影響なし）
      keySprite.beginFill(0x000000, 0.0); // 完全透明
      keySprite.drawRect(-adjustedWidth / 2, 0, adjustedWidth, blackKeyHeight);
      keySprite.endFill();
    }
  }
  
  /**
   * 白鍵の総数を計算（ヘルパーメソッド）
   */
  private calculateTotalWhiteKeys(): number {
    const minNote = 21;
    const maxNote = 108;
    let count = 0;
    for (let note = minNote; note <= maxNote; note++) {
      if (!this.isBlackKey(note)) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * 88鍵中の白鍵幅（ピクセル）を返す
   */
  private getWhiteKeyWidth(): number {
    const totalWhite = this.calculateTotalWhiteKeys();   // 52鍵
    return this.app.screen.width / totalWhite;
  }
  
  /**
   * ノーツ表示の更新 - ループ分離最適化版
   * 位置更新と状態更新を分離してCPU使用量を30-50%削減
   */
  updateNotes(activeNotes: ActiveNote[], currentTime?: number): void {
    if (!currentTime) return; // 絶対時刻が必要
    
    // ノーツ更新のパフォーマンス測定開始
    const notesUpdateStartTime = performance.now();
    
    // ===== 巻き戻し検出とノートリスト更新 =====
    const timeMovedBackward = currentTime < this.lastUpdateTime;
    
    // ===== シーク検出: activeNotesの数が大幅に変化した場合 =====
    const notesCountChanged = Math.abs(activeNotes.length - this.allNotes.length) > 10;
    const seekDetected = timeMovedBackward || notesCountChanged;
    
    // シーク時は既存のスプライトをクリア（ノート数変化に関係なく実施）
    if (seekDetected) {
      log.info(`🔄 Seek detected: clearing all note sprites (old: ${this.allNotes.length}, new: ${activeNotes.length})`);
      // 全てのノートスプライトを削除
      const noteIds = Array.from(this.noteSprites.keys());
      for (const noteId of noteIds) {
        this.removeNoteSprite(noteId);
      }
      this.noteSprites.clear();
    }
    
    // ノートリストが変更された場合、または巻き戻しが発生した場合
    if (activeNotes !== this.allNotes || seekDetected) {
      this.allNotes = [...activeNotes].sort((a, b) => a.time - b.time); // 時刻順ソート
      
      // 巻き戻し時は適切な nextNoteIndex を二分探索で復帰
      if (seekDetected) {
        this.nextNoteIndex = this.findNoteIndexByTime(currentTime);
        log.info(`🔄 Time moved backward: ${this.lastUpdateTime.toFixed(2)} -> ${currentTime.toFixed(2)}, reset nextNoteIndex: ${this.nextNoteIndex}`);
      } else {
        this.nextNoteIndex = 0; // 新しいノートリストの場合は最初から
      }
    }
    
    this.lastUpdateTime = currentTime;
    
    // GameEngineと同じ計算式を使用（統一化）
    const baseFallDuration = 15.0 //LOOKAHEAD_TIME
    const visualSpeedMultiplier = this.settings.noteSpeed;
    const totalDistance = this.settings.hitLineY - (-5); // 画面上端から判定ラインまで
    const speedPxPerSec = (totalDistance / baseFallDuration) * visualSpeedMultiplier;
    
    // FPS監視（デバッグ用）
    this.fpsCounter++;
    if (currentTime - this.lastFpsTime >= 1000) {
      const processedNotes = this.allNotes.length - this.nextNoteIndex;
      perfLog.info(`🚀 PIXI FPS: ${this.fpsCounter} | Total Notes: ${this.allNotes.length} | Processed: ${processedNotes} | Next Index: ${this.nextNoteIndex} | Sprites: ${this.noteSprites.size} | speedPxPerSec: ${speedPxPerSec.toFixed(1)}`);
      this.fpsCounter = 0;
      this.lastFpsTime = currentTime;
    }
    
    // ===== 📈 CPU最適化: 新規表示ノートのみ処理 =====
    // まだ表示していないノートで、表示時刻になったもののみ処理
    const appearanceTime = currentTime + baseFallDuration; // 画面上端に現れる時刻
    
    while (this.nextNoteIndex < this.allNotes.length &&
           this.allNotes[this.nextNoteIndex].time <= appearanceTime) {
      const note = this.allNotes[this.nextNoteIndex];
      
      // 新規ノーツスプライト作成（初回のみ）
      if (!this.noteSprites.has(note.id)) {
        this.createNoteSprite(note);
      }
      
      this.nextNoteIndex++;
    }
    
    // ===== 🚀 CPU最適化: ループ分離による高速化 =====
    // Loop 1: 位置更新専用（毎フレーム実行、軽量処理のみ）
    this.updateSpritePositions(activeNotes, currentTime, speedPxPerSec);
    
    // Loop 2: 判定・状態更新専用（フレーム間引き、重い処理）
    // const frameStartTime = performance.now(); // パフォーマンス監視用（現在未使用）
    
    // 状態・削除処理ループ（フレーム間引き無効化）
    this.updateSpriteStates(activeNotes);
    
    
    
    // ノーツ更新のパフォーマンス測定終了
    const notesUpdateDuration = performance.now() - notesUpdateStartTime;
    
    // 重い更新処理の場合のみログ出力（5ms以上またはノート数が多い場合）
    if (notesUpdateDuration > 5 || activeNotes.length > 100) {
      perfLog.info(`🎯 PIXI updateNotes: ${notesUpdateDuration.toFixed(2)}ms | Notes: ${activeNotes.length} | Sprites: ${this.noteSprites.size}`);
    }
  }

  /**
   * 🚀 位置更新専用ループ（毎フレーム実行）
   * Y座標・X座標更新のみの軽量処理
   */
  private updateSpritePositions(activeNotes: ActiveNote[], currentTime: number, speedPxPerSec: number): void {
    const currentNoteIds = new Set(activeNotes.map(note => note.id));
    
    for (const [noteId, sprite] of this.noteSprites) {
      if (!currentNoteIds.has(noteId)) {
        continue; // 削除対象は状態更新ループで処理
      }
      
      const note = activeNotes.find(n => n.id === noteId);
      if (!note) continue;
      
      // ===== Y座標更新（毎フレーム、軽量処理） =====
      const suppliedY = note.y;
      let newY: number;

      if (suppliedY !== undefined) {
        newY = suppliedY; // Engine提供の絶対座標を最優先
      } else {
        // フォールバック: 自前計算
        newY = this.settings.hitLineY - (note.time - currentTime) * speedPxPerSec;
      }

      sprite.sprite.y = newY;
      if (sprite.label) sprite.label.y = newY - 8;
      if (sprite.glowSprite) sprite.glowSprite.y = newY;
      
      // ===== X座標更新（ピッチ変更時のみ） =====
      if (sprite.noteData.pitch !== note.pitch) {
        const x = this.pitchToX(note.pitch);
        sprite.sprite.x = x;
        if (sprite.label) sprite.label.x = x;
        if (sprite.glowSprite) sprite.glowSprite.x = x;
      }
      
      // ===== トランスポーズ変更検出 =====
      if (sprite.transposeAtCreation !== this.settings.transpose) {
        const effectivePitch = note.pitch + this.settings.transpose;
        const isBlackNote = this.isBlackKey(effectivePitch);
        
        // テクスチャを即座に更新
        if (note.state === 'visible' || note.state === 'missed') {
          const newTexture = isBlackNote ? this.noteTextures.blackVisible : this.noteTextures.whiteVisible;
          sprite.sprite.texture = newTexture;
        }
        
        // 適切なコンテナに移動
        const currentContainer = sprite.sprite.parent;
        const targetContainer = isBlackNote ? this.blackNotes : this.whiteNotes;
        
        if (currentContainer !== targetContainer) {
          if (currentContainer) {
            currentContainer.removeChild(sprite.sprite);
          }
          targetContainer.addChild(sprite.sprite);
        }
        
        // ===== 音名ラベルを即座に更新 =====
        if (sprite.label) {
          // 既存ラベルを削除
          if (sprite.label.parent) {
            sprite.label.parent.removeChild(sprite.label);
          }
          sprite.label.destroy();
          sprite.label = undefined;
        }
        
        // 新しい音名でラベルを再生成
        if (this.settings.noteNameStyle !== 'off') {
          let newNoteName: string | undefined;
          
          // 音名決定ロジック（MECE構造）
          if (this.settings.simpleDisplayMode) {
            // 簡易表示モード: 複雑な音名を基本音名に変換
            if (note.noteName) {
              if (this.settings.noteNameStyle === 'solfege') {
                // ドレミ簡易表示
                newNoteName = this.getSimplifiedDisplayName(note.noteName);
              } else {
                // 英語簡易表示
                newNoteName = this.getEnglishSimplifiedDisplayName(note.noteName);
              }
            } else {
              // フォールバック: 基本的な音名を生成
              newNoteName = this.getMidiNoteName(effectivePitch);
            }
          } else {
            // 通常モード：MusicXMLの音名を使用、なければMIDI音名を生成
            newNoteName = note.noteName || this.getMidiNoteName(effectivePitch);
          }
          
          if (newNoteName) {
            const newTexture = this.getLabelTexture(newNoteName);
            if (newTexture) {
              const newLabel = new PIXI.Sprite(newTexture);
              newLabel.anchor.set(0.5, 1);
              newLabel.x = sprite.sprite.x;
              newLabel.y = sprite.sprite.y - 8;
              sprite.label = newLabel;
              this.labelsContainer.addChild(newLabel);
            }
          }
        }
        
        // トランスポーズ値を更新
        sprite.transposeAtCreation = this.settings.transpose;
      }
      
      // ===== 🚀 位置関連プロパティのみ部分更新（state保持） =====
      // 新しいオブジェクトを作成し、座標のみ更新、状態は元のまま保持
      sprite.noteData = {
        ...sprite.noteData,  // state は保持
        y: note.y,
        previousY: note.previousY,
        time: note.time,
        pitch: note.pitch,
        crossingLogged: note.crossingLogged // crossingLogged を同期してハイライト多重発火を防止
      };
    }
  }

  /**
   * 🎯 状態・削除処理専用ループ（フレーム間引き実行）
   * 重い処理（判定、状態変更、削除）のみ
   */
  private updateSpriteStates(activeNotes: ActiveNote[]): void {
    const stateStartTime = performance.now();
    const currentNoteIds = new Set(activeNotes.map(note => note.id));
    const spritesToRemove: string[] = [];
    let stateChanges = 0;
    
    for (const [noteId, sprite] of this.noteSprites) {
      if (!currentNoteIds.has(noteId)) {
        // 画面外に出たノーツをマーク（後でバッチ削除）
        spritesToRemove.push(noteId);
        continue;
      }
      
      const note = activeNotes.find(n => n.id === noteId);
      if (!note) continue;
      
      // ===== 状態 or 音名 変更チェック（変更時のみ、重い処理） =====
      if (sprite.noteData.state !== note.state || sprite.noteData.noteName !== note.noteName) {
        // 🚀 ヒット系判定時は即座処理
        if (isHitState(note.state)) {
          // エフェクトは updateNoteState 内で生成するためここでは作成しない
          // 2. ノートステータスを更新（α=0にする）
          this.updateNoteState(sprite, note);
          
          // 3. 即座に削除マーク（0.3秒待機なし）
          spritesToRemove.push(noteId);
                      // ログ削除: FPS最適化のため
            // log.debug(`🎯 Hit即座削除: ${noteId}`);
        } else {
          // Hit以外の通常の状態更新
          this.updateNoteState(sprite, note);
        }
        stateChanges++;
      }
    }
    
    // ===== 不要なスプライトをバッチ削除 =====
    for (const noteId of spritesToRemove) {
      this.removeNoteSprite(noteId);
    }
    
    // パフォーマンス監視（条件付きログ）
    const stateDuration = performance.now() - stateStartTime;
    if (stateDuration > 5 || this.noteSprites.size > 50) { // 5ms超過または50スプライト超過時のみ
      perfLog.info(`🎯 PIXI状態ループ: ${stateDuration.toFixed(2)}ms | Sprites: ${this.noteSprites.size} | StateChanges: ${stateChanges} | Deleted: ${spritesToRemove.length}`);
    }
  }
  
  /**
   * 二分探索で指定時刻に対応するノートインデックスを取得
   */
  private findNoteIndexByTime(targetTime: number): number {
    if (this.allNotes.length === 0) return 0;
    
    const baseFallDuration = 5.0;
    const appearanceTime = targetTime + baseFallDuration;
    
    let left = 0;
    let right = this.allNotes.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const noteTime = this.allNotes[mid].time;
      
      if (noteTime <= appearanceTime) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return left; // 最初の「まだ表示していない」ノートのインデックス
  }
  
  private createNoteSprite(note: ActiveNote): NoteSprite {
    const effectivePitch = note.pitch + this.settings.transpose;
    const x = this.pitchToX(note.pitch);
    
    // ===== 適切なテクスチャを選択 =====
    const isBlackNote = this.isBlackKey(effectivePitch);
    const texture = isBlackNote ? this.noteTextures.blackVisible : this.noteTextures.whiteVisible;
    
    // メインノートスプライト（位置は後でupdateNotesで設定）
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5, 0.5);
    sprite.x = x;
    sprite.y = 0; // 後で設定
    
    // 音名ラベル（MusicXMLから取得した音名を優先）
    let label: PIXI.Sprite | undefined;
    let noteNameForLabel: string | undefined;
    
    // 音名決定ロジック（MECE構造）
    if (this.settings.simpleDisplayMode) {
      // 簡易表示モード: 複雑な音名を基本音名に変換
      if (note.noteName) {
        if (this.settings.noteNameStyle === 'solfege') {
          // ドレミ簡易表示
          noteNameForLabel = this.getSimplifiedDisplayName(note.noteName);
        } else {
          // 英語簡易表示
          noteNameForLabel = this.getEnglishSimplifiedDisplayName(note.noteName);
        }
      } else {
        // フォールバック: 基本的な音名を生成
        noteNameForLabel = this.getMidiNoteName(effectivePitch);
      }
    } else {
      // 通常モード：MusicXMLから取得した音名を優先
      if (note.noteName) {
        noteNameForLabel = note.noteName;
      } else {
        // フォールバック: 従来のロジックで音名を生成
        noteNameForLabel = this.getMidiNoteName(effectivePitch);
      }
    }
    
    if (noteNameForLabel && this.settings.noteNameStyle !== 'off') {
      try {
        const labelTexture = this.getLabelTexture(noteNameForLabel);
        if (labelTexture) {
          label = new PIXI.Sprite(labelTexture);
          label.anchor.set(0.5, 1);
          label.x = x;
          label.y = 0; // 後で設定
          
          // 通常のContainerへ追加
          try {
            this.labelsContainer.addChild(label);
          } catch (containerError) {
            log.error(`❌ Failed to add label to container for "${noteNameForLabel}":`, containerError);
            label.destroy();
            label = undefined;
          }
        }
      } catch (error) {
        log.error(`❌ Error creating label sprite for "${noteNameForLabel}":`, error);
        label = undefined;
      }
    }
    
    // グロー効果スプライト（デフォルトOFF、必要時のみ）
    let glowSprite: PIXI.Graphics | undefined;
    if (this.settings.effects.glow) {
      glowSprite = new PIXI.Graphics();
      glowSprite.x = x;
      glowSprite.y = 0; // 後で設定
      this.effectsContainer.addChild(glowSprite);
    }
    
    try {
      // 適切なコンテナにノーツを追加（白鍵 or 黒鍵）
      const targetContainer = isBlackNote ? this.blackNotes : this.whiteNotes;
      targetContainer.addChild(sprite);
      // 頻繁に実行されるため、成功ログは削除
    } catch (error) {
      log.error(`❌ Failed to add note sprite to container:`, error);
    }
    
    const noteSprite: NoteSprite = {
      sprite,
      glowSprite,
      noteData: note,
      label,
      effectPlayed: false,
      transposeAtCreation: this.settings.transpose
    };
    
    this.noteSprites.set(note.id, noteSprite);
    
    // ===== 新設計: NoteUpdaterを作成してTicker管理 =====
    const noteUpdater = new NoteUpdater(noteSprite, this.settings, this.disposeManager);
    this.noteUpdaters.set(note.id, noteUpdater);
    
    return noteSprite;
  }
  
  /**
   * ノーツ状態変更処理（頻度が低い処理のみ）
   */
  private updateNoteState(noteSprite: NoteSprite, note: ActiveNote): void {
    const effectivePitch = note.pitch + this.settings.transpose;
    const oldNoteName = noteSprite.noteData.noteName;

    // ==== ラベル更新ロジック ====
    // 音名が変更された場合、ラベルを再生成する
    if (oldNoteName !== note.noteName) {
      // 既存ラベルを破棄
      if (noteSprite.label) {
        if (noteSprite.label.parent) {
          noteSprite.label.parent.removeChild(noteSprite.label);
        }
        noteSprite.label.destroy();
        noteSprite.label = undefined;
      }
      
      // 新しい音名でラベルを生成
      if (this.settings.noteNameStyle !== 'off') {
        let newNoteName: string | undefined;
        
        // 音名決定ロジック（MECE構造）
        if (this.settings.simpleDisplayMode) {
          // 簡易表示モード: 複雑な音名を基本音名に変換
          if (note.noteName) {
            if (this.settings.noteNameStyle === 'solfege') {
              // ドレミ簡易表示
              newNoteName = this.getSimplifiedDisplayName(note.noteName);
            } else {
              // 英語簡易表示
              newNoteName = this.getEnglishSimplifiedDisplayName(note.noteName);
            }
          } else {
            // フォールバック: 基本的な音名を生成
            newNoteName = this.getMidiNoteName(effectivePitch);
          }
        } else {
          // 通常モード：MusicXMLの音名を使用
          newNoteName = note.noteName;
        }
        
        if (newNoteName) {
          const newTexture = this.getLabelTexture(newNoteName);
          if (newTexture) {
            const newLabel = new PIXI.Sprite(newTexture);
            newLabel.anchor.set(0.5, 1);
            newLabel.x = noteSprite.sprite.x;
            newLabel.y = noteSprite.sprite.y - 8; // 位置は別途positionループで更新される
            noteSprite.label = newLabel;
            this.labelsContainer.addChild(newLabel);
          }
        }
      }
    }

    // ==== 判定ライン通過時のピアノキー点灯 ====
    if (note.crossingLogged && !noteSprite.noteData.crossingLogged && this.settings.practiceGuide !== 'off') {
      // マウス操作中でない場合のみ練習モード用ハイライトを実行
      if (!this.activeKeyPresses.has(effectivePitch)) {
        this.highlightKey(effectivePitch, true);
        setTimeout(() => {
          // タイマー実行時にもマウス操作チェック（競合防止）
          if (!this.activeKeyPresses.has(effectivePitch)) {
            this.highlightKey(effectivePitch, false);
          }
        }, 150);
      }
    }

    // ===== ヒット系判定時はエフェクトを生成してから削除 =====
    if (isHitState(note.state)) {
      if (!noteSprite.effectPlayed) {
        // エフェクトを生成（state に依存しない）
        this.createHitEffect(noteSprite.sprite.x, noteSprite.sprite.y);
        noteSprite.effectPlayed = true;
      }

      // ノーツを透明にする
      noteSprite.sprite.alpha = 0;
      // ラベルも即非表示
      if (noteSprite.label) noteSprite.label.alpha = 0;

      // ノーツデータを更新してから削除しない（削除はupdateSpriteStatesで行う）
      noteSprite.noteData = note;
      return;
    } else {
      // ノーツの状態が変わった時のみテクスチャを更新
      // （トランスポーズ変更時はupdateSettingsで一括更新されるため、ここでは更新しない）
      if (noteSprite.noteData.state !== note.state) {
        noteSprite.sprite.alpha = 1;
        const isBlackNote = this.isBlackKey(effectivePitch);
        noteSprite.sprite.texture = isBlackNote
          ? this.noteTextures.blackVisible
          : this.noteTextures.whiteVisible;
      }
    }
    
    // グロー効果の更新
      if (noteSprite.glowSprite) {
        this.drawGlowShape(noteSprite.glowSprite, note.state, note.pitch);
      }
      
        // ラベルもαで同期させる（visibleだとGCがズレる）
    if (noteSprite.label) {
      noteSprite.label.alpha = (note.state as any) === 'hit' ? 0 : 1;
    }
      
      // ミス時のエフェクトは無し
      // Hit 時のエフェクトは上で生成済み
      
    // ノーツデータを更新
    noteSprite.noteData = note;
  }
  
  private removeNoteSprite(noteId: string): void {
    const noteSprite = this.noteSprites.get(noteId);
    if (!noteSprite) return;
    
    // 安全な削除処理
    try {
      // ラベルを先に削除（labelsContainer から削除）
      if (noteSprite.label) {
        if (this.labelsContainer.children.includes(noteSprite.label)) {
          this.labelsContainer.removeChild(noteSprite.label);
        }
        noteSprite.label.destroy({ children: true, texture: false, baseTexture: false });
      }

      // メインスプライト削除
      if (noteSprite.sprite && noteSprite.sprite.parent) {
        noteSprite.sprite.parent.removeChild(noteSprite.sprite);
      }
      if (noteSprite.sprite && !noteSprite.sprite.destroyed) {
        noteSprite.sprite.destroy({ children: true, texture: false, baseTexture: false });
      }
      
      // グロースプライト削除
      if (noteSprite.glowSprite) {
        if (noteSprite.glowSprite.parent) {
          noteSprite.glowSprite.parent.removeChild(noteSprite.glowSprite);
        }
        if (!noteSprite.glowSprite.destroyed) {
          noteSprite.glowSprite.destroy({ children: true, texture: false, baseTexture: false });
        }
      }
          } catch (error) {
        log.warn(`⚠️ Note sprite cleanup error for ${noteId}:`, error);
      }
    
    this.noteSprites.delete(noteId);
  }
  
  private drawGlowShape(graphics: PIXI.Graphics, state: ActiveNote['state'], pitch?: number): void {
    graphics.clear();
    
    // GOOD 判定後のノーツは透明のためグローを描画しない
    if (state === 'hit') {
      return;
    }

    const color = this.getStateColor(state, pitch);
    const { noteWidth, noteHeight } = this.settings;
    
    // グロー効果（半透明の大きな矩形）
    graphics.beginFill(color, 0.3);
    graphics.drawRoundedRect(
      -noteWidth / 2 - 4,
      -noteHeight / 2 - 4,
      noteWidth + 8,
      noteHeight + 8,
      Math.min(4, noteHeight / 2) // 高さに応じて角丸を調整
    );
    graphics.endFill();
  }
  
  private createHitEffect(x: number, y: number): void {
    // 同じ位置に既存のエフェクトがあるかチェック
    const threshold = 5; // 5ピクセル以内は同じ位置とみなす
    for (const child of this.effectsContainer.children) {
      if (child instanceof PIXI.Container && child.name === 'HitEffect') {
        const existingX = (child as any).x || 0;
        const existingY = (child as any).y || 0;
        if (Math.abs(existingX - x) < threshold && Math.abs(existingY - y) < threshold) {
          log.info(`⚡ Effect already exists at similar position, skipping creation`);
          return;
        }
      }
    }
    
    // 常にヒットエフェクトを生成（呼び出し側で判定済み）
    log.info(`⚡ Generating hit effect at (${x.toFixed(1)}, ${y.toFixed(1)})`);
    
    // メインエフェクトコンテナ
    const effectContainer = new PIXI.Container();
    effectContainer.name = 'HitEffect'; // デバッグ用名前付け
    (effectContainer as any).x = x; // 位置情報を保存
    (effectContainer as any).y = y;
    
    // === ポインターイベントを完全無効化 ===
    (effectContainer as any).eventMode = 'none';
    effectContainer.interactive = false;
    
    // ===== 1. 縦レーンライト（新機能） =====
    const laneLight = new PIXI.Graphics();
    
    // レーンライトの幅とグラデーション
    const laneWidth = 8; // レーンライト幅
    const laneHeight = this.settings.hitLineY; // 画面上端からピアノまで
    
    // グラデーション風の複数ライン（中央が明るく、外側に向かって暗く）
    for (let i = 0; i < 3; i++) {
      const lineWidth = laneWidth - (i * 2);
      const alpha = 0.8 - (i * 0.2); // 中央ほど明るく
      const color = i === 0 ? 0xFFFFFF : this.settings.colors.good; // 中央は白、外側は緑
      
      laneLight.lineStyle(lineWidth, color, alpha);
      laneLight.moveTo(0, 0);
      laneLight.lineTo(0, laneHeight);
    }
    
    laneLight.x = x;
    laneLight.y = 0; // 画面上端から開始
    effectContainer.addChild(laneLight);
    
    // ===== 2. 既存の円形エフェクト =====
    // 外側の円（小さく）
    const outerCircle = new PIXI.Graphics();
    outerCircle.beginFill(this.settings.colors.good, 0.6);
    outerCircle.drawCircle(0, 0, 15);
    outerCircle.endFill();
    
    // 中間の円
    const middleCircle = new PIXI.Graphics();
    middleCircle.beginFill(this.settings.colors.good, 0.8);
    middleCircle.drawCircle(0, 0, 10);
    middleCircle.endFill();
    
    // 内側の明るい円
    const innerCircle = new PIXI.Graphics();
    innerCircle.beginFill(0xFFFFFF, 1.0);
    innerCircle.drawCircle(0, 0, 6);
    innerCircle.endFill();
    
    // 円形エフェクトコンテナ
    const circleContainer = new PIXI.Container();
    circleContainer.addChild(outerCircle);
    circleContainer.addChild(middleCircle);
    circleContainer.addChild(innerCircle);
    circleContainer.x = x;
    circleContainer.y = y;
    effectContainer.addChild(circleContainer);
    
    effectContainer.alpha = 1.0;
    
    // エフェクトコンテナを最前面に強制配置
    this.effectsContainer.addChild(effectContainer);
    this.container.setChildIndex(this.effectsContainer, this.container.children.length - 1);
    
    log.info(`⚡ Effect with lane light added. Children count: ${this.effectsContainer.children.length}`);
    
    // ===== 3. アニメーション =====
    const duration = 0.15; // 持続時間を短縮（0.3 → 0.15秒）
    let elapsed = 0;
    
    // 初期状態で最大サイズ・最大明度に設定（瞬時に光る）
    circleContainer.scale.set(1.0); // スケールアニメーション削除、最初から最大サイズ
    laneLight.alpha = 1.0;
    circleContainer.alpha = 1.0;
    
    const animateTicker = (delta: number) => {
      elapsed += delta * (1 / 60);
      const progress = Math.min(elapsed / duration, 1);
      
      // 両方のエフェクトを同時に急速フェードアウト
      const fadeAlpha = 1 - progress;
      
      laneLight.alpha = fadeAlpha;
      circleContainer.alpha = fadeAlpha;
      
      if (progress >= 1) {
        log.info(`⚡ Flash effect completed, removing from container. Current children: ${this.effectsContainer.children.length}`);
        this.app.ticker.remove(animateTicker);
        if (effectContainer.parent) {
          log.info(`⚡ Removing effect from parent container`);
          this.effectsContainer.removeChild(effectContainer);
        } else {
          log.warn(`⚠️ Effect container has no parent, may already be removed`);
        }
        effectContainer.destroy({ children: true });
        log.info(`⚡ Effect destroyed. Remaining children: ${this.effectsContainer.children.length}`);
      }
    };
    
    this.app.ticker.add(animateTicker);
  }
  
  private getStateColor(state: ActiveNote['state'], pitch?: number): number {
    switch (state) {
      case 'visible': 
        if (pitch !== undefined && this.isBlackKey(pitch + this.settings.transpose)) {
          return this.settings.colors.visibleBlack;
        }
        return this.settings.colors.visible;
      case 'hit':
      case 'good':
      case 'perfect':
        return this.settings.colors.hit;
      case 'missed':
        return this.settings.colors.missed;
      default: return this.settings.colors.visible;
    }
  }
  
  private pitchToX(pitch: number): number {
    // 88鍵ピアノのマッピング (A0=21 to C8=108)
    const minNote = 21;
    const maxNote = 108;
    
    // 白鍵の総数を計算
    let totalWhiteKeys = 0;
    for (let note = minNote; note <= maxNote; note++) {
      if (!this.isBlackKey(note)) {
        totalWhiteKeys++;
      }
    }
    
    const effectivePitch = pitch + this.settings.transpose;

    if (this.isBlackKey(effectivePitch)) {
      // 黒鍵の場合は正確な位置計算（隣接する白鍵の中央）
      return this.calculateBlackKeyPosition(effectivePitch, minNote, maxNote, totalWhiteKeys);
    } else {
      // 白鍵の場合
      let whiteKeyIndex = 0;
      for (let note = minNote; note < effectivePitch; note++) {
        if (!this.isBlackKey(note)) {
          whiteKeyIndex++;
        }
      }
      const whiteKeyWidth = this.app.screen.width / totalWhiteKeys;
      return whiteKeyIndex * whiteKeyWidth + whiteKeyWidth / 2; // 白鍵の中央
    }
  }
  
  private calculateNoteY(note: ActiveNote): number {
    // **GameEngineから計算された精密なy座標を優先使用**
    if (note.y !== undefined) {
      return note.y;
    }
    
    // フォールバック: 画面外に配置（通常は使用されない）
    log.warn(`⚠️ ノーツY座標がGameEngineから提供されませんでした: ${note.id}`);
    return this.settings.hitLineY + 100;
  }
  
  /**
   * 設定更新
   */
  updateSettings(newSettings: Partial<RendererSettings>): void {
    log.info(`🔧 updateSettings called`);
    
    // 破棄後に呼ばれた場合の安全ガード
    // this.app.renderer は destroy() 後にプロパティが undefined になるためチェック
    if (!this.app || (this.app as any)._destroyed || !this.app.screen) {
      log.warn('PIXINotesRendererInstance.updateSettings: renderer already destroyed, skipping');
      return;
    }

    const prevPianoHeight = this.settings.pianoHeight;
    const prevTranspose = this.settings.transpose;
    const prevNoteNameStyle = this.settings.noteNameStyle;
    const prevSimpleDisplayMode = this.settings.simpleDisplayMode;
    const prevTransposingInstrument = this.settings.transposingInstrument;
    
          // ★ ピアノ高さの最小値を保証
      if (newSettings.pianoHeight !== undefined) {
        newSettings.pianoHeight = Math.max(70, newSettings.pianoHeight); // 最小70px
      }
    
    Object.assign(this.settings, newSettings);

    // ピアノ高さが変更された場合、判定ラインと背景を再配置
    if (newSettings.pianoHeight !== undefined && newSettings.pianoHeight !== prevPianoHeight) {
      // 新しい判定ラインYを計算
      // 修正: app.view.height を使用
      this.settings.hitLineY = this.app.view.height - this.settings.pianoHeight;
      log.info(`🔧 Updated hitLineY: ${this.settings.hitLineY}`);

      // 既存のヒットラインを削除して再描画
      if (this.hitLineContainer) {
        this.hitLineContainer.removeChildren();
        this.setupHitLine();
      }

      // ==== 背景／ガイドラインを再生成 ====
      try {
        // 背景 (container の先頭)
        if (this.container && this.container.children && this.container.children.length > 0) {
          this.container.removeChildAt(0);
        }
        
        // ガイドラインは createNotesAreaBackground() で新しく作成される
      } catch (err) {
        log.error('背景再生成時にエラーが発生しました', err);
      }

      // 新しい背景とガイドラインを再作成
      this.createNotesAreaBackground();
    }

    // === noteNameStyle または simpleDisplayMode が変化した場合、鍵盤とノートの音名表示を更新 ===
    if ((newSettings.noteNameStyle !== undefined && newSettings.noteNameStyle !== prevNoteNameStyle) ||
        (newSettings.simpleDisplayMode !== undefined && newSettings.simpleDisplayMode !== prevSimpleDisplayMode)) {
      // 鍵盤の音名表示を更新（鍵盤を再描画）
      this.pianoContainer.removeChildren();
      this.pianoSprites.clear();
      this.setupPiano();

      // 既存ノートのラベルを更新
      this.noteSprites.forEach((noteSprite) => {
        const pitch = noteSprite.noteData.pitch;
        const effectivePitch = pitch + this.settings.transpose;
        
        // 音名決定ロジック（MECE構造）
        let noteName: string | undefined;
        if (this.settings.simpleDisplayMode) {
          // 簡易表示モード: 複雑な音名を基本音名に変換
          if (noteSprite.noteData.noteName) {
            if (this.settings.noteNameStyle === 'solfege') {
              // ドレミ簡易表示
              noteName = this.getSimplifiedDisplayName(noteSprite.noteData.noteName);
            } else {
              // 英語簡易表示
              noteName = this.getEnglishSimplifiedDisplayName(noteSprite.noteData.noteName);
            }
          } else {
            // フォールバック: 基本的な音名を生成
            noteName = this.getMidiNoteName(effectivePitch);
          }
        } else {
          // 通常モード：MusicXMLの音名を優先
          noteName = noteSprite.noteData.noteName || this.getMidiNoteName(effectivePitch);
        }

        // 古いラベルを削除
        if (noteSprite.label) {
          if (this.labelsContainer.children.includes(noteSprite.label)) {
            this.labelsContainer.removeChild(noteSprite.label);
          }
          noteSprite.label.destroy();
          noteSprite.label = undefined;
        }

        // 新しいラベルを生成（noteNameStyleがoffでなければ）
        if (noteName) {
          const labelTexture = this.getLabelTexture(noteName);
          if (labelTexture) {
            const label = new PIXI.Sprite(labelTexture);
            label.anchor.set(0.5, 1);
            label.x = noteSprite.sprite.x;
            label.y = 0; // 後で設定
            this.labelsContainer.addChild(label);
            noteSprite.label = label;
          }
        }
      });
    }

    // === transposingInstrument が変化した場合、音名表示を更新 ===
    if (newSettings.transposingInstrument !== undefined && newSettings.transposingInstrument !== prevTransposingInstrument) {
      // 鍵盤の音名表示を更新（鍵盤を再描画）
      if (this.pianoContainer) {
        this.pianoContainer.removeChildren();
        this.pianoSprites.clear();
        this.setupPiano();
      }

      // 既存ノートのラベルを更新
      this.noteSprites.forEach((noteSprite) => {
        const pitch = noteSprite.noteData.pitch;
        const effectivePitch = pitch + this.settings.transpose;
        
        // 音名決定ロジック（MECE構造）
        let noteName: string | undefined;
        if (this.settings.simpleDisplayMode) {
          // 簡易表示モード: 複雑な音名を基本音名に変換
          if (noteSprite.noteData.noteName) {
            if (this.settings.noteNameStyle === 'solfege') {
              // ドレミ簡易表示
              noteName = this.getSimplifiedDisplayName(noteSprite.noteData.noteName);
            } else {
              // 英語簡易表示
              noteName = this.getEnglishSimplifiedDisplayName(noteSprite.noteData.noteName);
            }
          } else {
            // フォールバック: 基本的な音名を生成
            noteName = this.getMidiNoteName(effectivePitch);
          }
        } else {
          // 通常モード：MusicXMLの音名を優先
          noteName = noteSprite.noteData.noteName || this.getMidiNoteName(effectivePitch);
        }

        // 古いラベルを削除
        if (noteSprite.label) {
          if (this.labelsContainer.children.includes(noteSprite.label)) {
            this.labelsContainer.removeChild(noteSprite.label);
          }
          noteSprite.label.destroy();
          noteSprite.label = undefined;
        }

        // 新しいラベルを生成（noteNameStyleがoffでなければ）
        if (noteName && this.settings.noteNameStyle !== 'off') {
          const labelTexture = this.getLabelTexture(noteName);
          if (labelTexture) {
            const label = new PIXI.Sprite(labelTexture);
            label.anchor.set(0.5, 1);
            label.x = noteSprite.sprite.x;
            label.y = 0; // 後で設定
            this.labelsContainer.addChild(label);
            noteSprite.label = label;
          }
        }
      });
    }

    // === transpose が変化した場合、既存ノートのラベル / カラーを更新 ===
    if (newSettings.transpose !== undefined && newSettings.transpose !== prevTranspose) {
      // 全てのノートスプライトを即座に更新
      this.noteSprites.forEach((noteSprite) => {
        const pitch = noteSprite.noteData.pitch;
        const effectivePitch = pitch + this.settings.transpose;
        const noteName = this.getMidiNoteName(effectivePitch);

        // 1) X 座標を再計算してノーツ位置を更新
        const newX = this.pitchToX(pitch); // transpose を内部で考慮
        noteSprite.sprite.x = newX;
        if (noteSprite.label) noteSprite.label.x = newX;
        if (noteSprite.glowSprite) noteSprite.glowSprite.x = newX;

        // 2) ラベル更新（テクスチャアトラス使用）
        // 音名決定ロジック（MECE構造）
        let displayNoteName: string | undefined;
        if (this.settings.simpleDisplayMode) {
          // 簡易表示モード: 複雑な音名を基本音名に変換
          if (noteSprite.noteData.noteName) {
            if (this.settings.noteNameStyle === 'solfege') {
              // ドレミ簡易表示
              displayNoteName = this.getSimplifiedDisplayName(noteSprite.noteData.noteName);
            } else {
              // 英語簡易表示
              displayNoteName = this.getEnglishSimplifiedDisplayName(noteSprite.noteData.noteName);
            }
          } else {
            // フォールバック: 基本的な音名を生成
            displayNoteName = this.getMidiNoteName(effectivePitch);
          }
        } else {
          // 通常モード：MusicXMLの音名を優先
          displayNoteName = noteSprite.noteData.noteName || this.getMidiNoteName(effectivePitch);
        }
        
        if (noteSprite.label && displayNoteName) {
          const newTexture = this.getLabelTexture(displayNoteName);
          if (newTexture) {
            noteSprite.label.texture = newTexture;
          }
        } else if (!noteSprite.label && displayNoteName) {
          const labelTexture = this.getLabelTexture(displayNoteName);
          if (labelTexture) {
            const label = new PIXI.Sprite(labelTexture);
            label.anchor.set(0.5, 1);
            label.x = newX;
            label.y = 0; // 後で設定
            this.labelsContainer.addChild(label);
            noteSprite.label = label;
          }
        } else if (noteSprite.label && !displayNoteName) {
          if (this.labelsContainer.children.includes(noteSprite.label)) {
            this.labelsContainer.removeChild(noteSprite.label);
          }
          noteSprite.label.destroy();
          noteSprite.label = undefined;
        }

        // 3) カラー・形状更新（Sprite用のテクスチャ交換）- 即座に反映
        const noteData = noteSprite.noteData;
        const isBlackNote = this.isBlackKey(noteData.pitch + this.settings.transpose);
        let newTexture: PIXI.Texture;

        // 状態に関わらず、白鍵・黒鍵の判定を最新のトランスポーズ値で更新
        switch (noteData.state) {
          case 'hit':
          case 'good':
          case 'perfect':
            newTexture = this.noteTextures.hit;
            break;
          case 'missed':
          case 'visible':
          default:
            newTexture = isBlackNote ? this.noteTextures.blackVisible : this.noteTextures.whiteVisible;
            break;
        }

        // テクスチャを即座に更新（PIXIの描画を強制）
        noteSprite.sprite.texture = newTexture;

        // 黒鍵・白鍵で異なるコンテナに配置されているため、必要に応じてコンテナも変更
        const currentContainer = noteSprite.sprite.parent;
        const targetContainer = isBlackNote ? this.blackNotes : this.whiteNotes;
        
        if (currentContainer !== targetContainer) {
          // 現在のコンテナから削除
          if (currentContainer) {
            currentContainer.removeChild(noteSprite.sprite);
          }
          // 新しいコンテナに追加
          targetContainer.addChild(noteSprite.sprite);
        }

        if (noteSprite.glowSprite) {
          this.drawGlowShape(noteSprite.glowSprite, noteData.state, noteData.pitch);
        }
      });

      // PIXIレンダラーに即座に描画を強制
      this.app.renderer.render(this.app.stage);
    }
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    // 破棄状態フラグを設定（レンダリングループを停止）
    this.isDestroyed = true;
    
    try {
      // 🎯 統合フレーム制御を停止
      if (window.performanceMonitor) {
        window.performanceMonitor.stopMonitoring();
      }
      
      // アクティブキープレス状態をクリア（音が伸び続けるバグ防止）
      for (const midiNote of this.activeKeyPresses) {
        this.handleKeyRelease(midiNote);
      }
      this.activeKeyPresses.clear();

      // ノートスプライトを安全に削除
      const noteIds = Array.from(this.noteSprites.keys());
      for (const noteId of noteIds) {
        this.removeNoteSprite(noteId);
      }
      this.noteSprites.clear();

      // ピアノスプライトをクリア
      this.pianoSprites.clear();
      this.highlightedKeys.clear();

      // エフェクトコンテナのクリーンアップ
      if (this.effectsContainer && this.effectsContainer.children.length > 0) {
        log.info(`🧹 Cleaning up ${this.effectsContainer.children.length} remaining effects`);
        this.effectsContainer.removeChildren();
      }

      // ★ ガイドラインも破棄
      if (this.guidelines) {
        this.guidelines.destroy();
        this.guidelines = undefined;
      }

      // ===== ラベルテクスチャの破棄 =====
      try {
        if (this.labelTextures) {
          this.labelTextures.abc?.forEach(texture => {
            if (texture && texture !== PIXI.Texture.EMPTY && !texture.destroyed) {
              texture.destroy();
            }
          });
          this.labelTextures.solfege?.forEach(texture => {
            if (texture && texture !== PIXI.Texture.EMPTY && !texture.destroyed) {
              texture.destroy();
            }
          });
          this.labelTextures.abc.clear();
          this.labelTextures.solfege.clear();
        }
      } catch (error) {
        log.error('⚠️ Label textures cleanup error:', error);
      }
      

      // PIXI.jsアプリケーションを破棄
      if (this.app && (this.app as any)._destroyed !== true) {
        this.app.destroy(true, { 
          children: true, 
          texture: false,  // テクスチャは共有されている可能性があるのでfalse
          baseTexture: false 
        });
      }
    } catch (error) {
      log.error('⚠️ PIXI renderer destroy error:', error);
    }
  }
  
  /**
   * ピアノキー入力コールバックの設定
   */
  setKeyCallbacks(onKeyPress: (note: number) => void, onKeyRelease: (note: number) => void): void {
    log.info('🎹 setKeyCallbacks called', {
      hasOnKeyPress: !!onKeyPress,
      hasOnKeyRelease: !!onKeyRelease
    });
    this.onKeyPress = onKeyPress;
    this.onKeyRelease = onKeyRelease;
  }

  /**
   * 内部キープレスハンドラー
   */
  private handleKeyPress(midiNote: number): void {
    log.info('🎹 handleKeyPress called', { 
      midiNote, 
      hasOnKeyPress: !!this.onKeyPress,
      destroyed: this.destroyed
    });
    
    // アクティブキープレス状態に追加
    this.activeKeyPresses.add(midiNote);

    // 直感的なユーザーフィードバックとして即時ハイライト
    this.highlightKey(midiNote, true);

    // === 追加: キー押下エフェクトを即座に表示 ===
    this.triggerKeyPressEffect(midiNote);

    // 外部コールバック呼び出し（GameEngine経由で状態更新）
    if (this.onKeyPress) {
      this.onKeyPress(midiNote);
    } else {
      log.warn(`⚠️ No onKeyPress callback set! Note: ${midiNote}`);
    }
  }
  
  /**
   * 内部キーリリースハンドラー
   */
  private handleKeyRelease(midiNote: number): void {
    // アクティブキープレス状態から削除
    this.activeKeyPresses.delete(midiNote);

    // ハイライト解除
    this.highlightKey(midiNote, false);

    // 外部コールバック呼び出し（GameEngine経由で状態更新）
    if (this.onKeyRelease) {
      this.onKeyRelease(midiNote);
    } else {
      log.warn(`⚠️ No onKeyRelease callback set! Note: ${midiNote}`);
    }
  }

  /**
   * キャンバス要素の取得
   */
  get view(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement;
  }

  // === グリッサンド処理 ===
  private handleDragStart(e: PIXI.FederatedPointerEvent): void {
    this.onDragActive = true;
    this.handleDragMove(e);
  }

  private handleDragMove(e: PIXI.FederatedPointerEvent): void {
    if (!this.onDragActive) return;
    const globalPos = e.data.global;
    const note = this.getNoteFromPosition(globalPos.x, globalPos.y);
    if (note !== null && note !== this.currentDragNote) {
      if (this.currentDragNote !== null) {
        // release previous
        this.handleKeyRelease(this.currentDragNote);
      }
      this.currentDragNote = note;
      this.handleKeyPress(note);
    }
  }

  private handleDragEnd(): void {
    if (this.currentDragNote !== null) {
      this.handleKeyRelease(this.currentDragNote);
      this.currentDragNote = null;
    }
    this.onDragActive = false;
  }

  /**
   * 座標から最も近い MIDI ノート番号を取得する（ピアノキー内のみ）
   */
  private getNoteFromPosition(x: number, y: number): number | null {
    // hitLineY 以降が鍵盤エリア
    if (y < this.settings.hitLineY) return null;
    for (const [midi, sprite] of this.pianoSprites) {
      const bounds = sprite.getBounds();
      if (x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
        return midi;
      }
    }
    return null;
  }

  /**
   * 汎用フェードアウトヘルパー
   * 指定秒数かけて alpha を 0 にし、完了したら onComplete を呼ぶ。
   */
  private fadeOutLater(display: PIXI.DisplayObject & { alpha: number }, duration: number, onComplete?: () => void): void {
    const total = Math.max(0.01, duration);
    let elapsed = 0;
    const tickerFunc = () => {
      // deltaMS は毎フレーム呼ばれるので秒単位へ変換
      const dt = this.app.ticker.deltaMS / 1000;
      elapsed += dt;
      const progress = Math.min(1, elapsed / total);
      display.alpha = 1 - progress;
      if (progress >= 1) {
        this.app.ticker.remove(tickerFunc);
        if (onComplete) onComplete();
      }
    };
    this.app.ticker.add(tickerFunc);
  }

  /**
   * キー押下に応じた即時ヒットエフェクトを発火
   * GameEngine の判定を待たずに視覚フィードバックを返すための補助メソッド。
   */
  public triggerKeyPressEffect(midiNote: number): void {
    /*
     * ユーザーが鍵盤を押下した際に発火する即時ヒットエフェクト。
     * ------------------------------------------------------------
     * 変更点 :
     *   1. トランスポーズ値が二重に適用される問題を回避するため、
     *      pitchToX ではなく現在描画中のノートスプライトの座標を利用する。
     *   2. 画面上に対応するノートが存在しない場合（＝演奏すべきノートが無い場合）は
     *      エフェクトを生成しない。
     */

    // 1. 現在表示中のノートスプライトから一致するものを探す
    //    rawMidi = noteSprite.pitch + transpose が実際に押される MIDI ノートになる。
    const targetSprite = Array.from(this.noteSprites.values()).find((ns) => {
      const rawMidi = ns.noteData.pitch + this.settings.transpose;
      return rawMidi === midiNote && ns.noteData.state === 'visible';
    });

    // 2. 一致するノートが無い場合はエフェクトを出さない（不要表示防止）
    if (!targetSprite) {
      return;
    }

    // 3. ノートが判定ライン近くにあるかを確認（早押し時の誤エフェクト防止）
    const distanceToHitLine = Math.abs(targetSprite.sprite.y - this.settings.hitLineY);
    const threshold = this.settings.noteHeight * 1.5; // ノート高さの約1.5倍以内
    if (distanceToHitLine > threshold) {
      // まだ判定ラインに到達していないためエフェクトを生成しない
      return;
    }

    // 4. 見つかったノートの現在位置を使用してエフェクトを生成
    const x = targetSprite.sprite.x;
    this.createHitEffect(x, targetSprite.sprite.y);
  }

  /**
   * リサイズ対応
   */
  resize(width: number, height: number): void {
    // 指定されたサイズでそのままリサイズ
    this.app.renderer.resize(width, height);
    
    // 修正: リサイズ後の高さを使用
    this.settings.hitLineY = height - this.settings.pianoHeight;
    log.info(`🔧 Resize hitLineY: ${this.settings.hitLineY}`);
    
    // ピアノとヒットラインの再描画
    if (this.pianoContainer) {
      this.pianoContainer.removeChildren();
      this.pianoSprites.clear();
      this.setupPiano();
    }
    if (this.hitLineContainer) {
      this.hitLineContainer.removeChildren();
      this.setupHitLine();
    }

    // ===== 背景とガイドラインを再生成 =====
    try {
      if (this.container && this.container.children && this.container.children.length > 0) {
        this.container.removeChildAt(0);
      }
      // ガイドラインクリーンアップは createNotesAreaBackground() で自動処理
    } catch (err) {
      log.error('resize 時の背景クリアに失敗', err);
    }

    this.createNotesAreaBackground();
    
    // ★ 白鍵幅が変わった場合はテクスチャを再生成
    const newWhiteKeyWidth = this.getWhiteKeyWidth();
    const newNoteWidth = newWhiteKeyWidth - 2;
    if (Math.abs(newNoteWidth - this.settings.noteWidth) > 0.1) { // 誤差を考慮
      this.settings.noteWidth = newNoteWidth;
      log.info(`🔄 Regenerating note textures with new width: ${newNoteWidth.toFixed(2)}px`);
      
      // 新しい幅でテクスチャを作り直し
      this.generateNoteTextures();
      
      // 既存ノートに新テクスチャを反映
      this.noteSprites.forEach(ns => {
        const isBlack = this.isBlackKey(ns.noteData.pitch + this.settings.transpose);
        switch (ns.noteData.state) {
          case 'hit':
          case 'good':
          case 'perfect':
            ns.sprite.texture = this.noteTextures.hit;
            break;
          case 'missed':
          case 'visible':
          default:
            ns.sprite.texture = isBlack ? this.noteTextures.blackVisible : this.noteTextures.whiteVisible;
            break;
        }
      });
    }
  }

}

// ===== React コンポーネント =====

export const PIXINotesRenderer: React.FC<PIXINotesRendererProps> = ({
  activeNotes,
  width,
  height,
  currentTime,
  onReady,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PIXINotesRendererInstance | null>(null);
  
  // 指定された高さをそのまま使用（制限なし）
  const actualHeight = height;
  
  // ===== PIXI.js レンダラー初期化 (一度だけ) =====
  useEffect(() => {
    if (!containerRef.current || rendererRef.current) return;

    // 初期ローディング時にフェードイン
    // 一時的にコメントアウト（デバッグ用）
    // containerRef.current.style.opacity = '0';
    // containerRef.current.style.visibility = 'hidden';
    
    log.info('🎯 Skipping initial hide for debugging...');

    const renderer = new PIXINotesRendererInstance(width, actualHeight);
    rendererRef.current = renderer;
    
    // ===== 簡略デバッグ（パフォーマンス重視） =====
    log.info('🔍 Basic check: Canvas size:', renderer.view.width, 'x', renderer.view.height);
    
    try {
      containerRef.current.appendChild(renderer.view);
      log.info('✅ Canvas added to DOM');
      
      // キャンバスにタッチ/スクロール設定を追加
      const canvas = renderer.view as HTMLCanvasElement;
      
      // デフォルトで横スクロールを許可
      canvas.style.touchAction = 'pan-x';
      
      // canvasのスタイルを調整してモバイルスクロールを改善
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      
      // キャンバス全体で横スクロールを許可
      canvas.style.touchAction = 'pan-x';
      
    } catch (error) {
      log.error('❌ appendChild failed:', error);
    }

    log.info('🎯 PIXI Container initially hidden, scheduling fade-in...');
    
    requestAnimationFrame(() => {
      log.info('🎯 Fade-in animation frame executing...');
      if (containerRef.current) {
        containerRef.current.style.opacity = '1';
        containerRef.current.style.visibility = 'visible';
        containerRef.current.style.transition = 'opacity 0.2s ease-in-out';
        log.info('✅ PIXI Container made visible');
      } else {
        log.error('❌ containerRef.current is null during fade-in');
      }
    });

    onReady?.(renderer);

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
      onReady?.(null);
    };
  }, []); // 初回のみ

  // onReady が変更された場合にも現在の renderer を通知
  useEffect(() => {
    if (rendererRef.current) {
      onReady?.(rendererRef.current);
    }
  }, [onReady]);
  
  // ノーツ更新
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateNotes(activeNotes, currentTime);
    }
  }, [activeNotes, currentTime]);
  
  
  // リサイズ対応
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.resize(width, actualHeight);
    }
  }, [width, actualHeight]);
  
  return (
    <div
      ref={containerRef}
      className={cn(
        "custom-pixi-scrollbar",
        className
      )}
      style={{ 
        width, 
        height: actualHeight,
        // 初期化時のサイズ変更を防ぐため明示的にサイズを設定
        minWidth: width,
        minHeight: actualHeight,
        overflow: 'hidden',
        backgroundColor: '#111827', // ロード中の背景色
        // タッチイベントの伝播を調整
        position: 'relative'
      }}
    >
      {/* カスタムスクロールバー用のスタイル */}
      <style>
        {`
          .custom-pixi-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .custom-pixi-scrollbar::-webkit-scrollbar-track {
            background-color: #1f2937;
            border-radius: 4px;
            border: 1px solid #374151;
          }
          
          .custom-pixi-scrollbar::-webkit-scrollbar-thumb {
            background-color: #6b7280;
            border-radius: 4px;
            border: 1px solid #374151;
          }
          
          .custom-pixi-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: #9ca3af;
          }
          
          .custom-pixi-scrollbar::-webkit-scrollbar-corner {
            background-color: #1f2937;
          }
          
          /* スクロールバーの矢印を完全に削除 */
          .custom-pixi-scrollbar::-webkit-scrollbar-button {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          
          .custom-pixi-scrollbar::-webkit-scrollbar-button:single-button {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          
          .custom-pixi-scrollbar::-webkit-scrollbar-button:double-button {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          
          .custom-pixi-scrollbar::-webkit-scrollbar-button:horizontal {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          
          .custom-pixi-scrollbar::-webkit-scrollbar-button:vertical {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          
          /* Firefox用 */
          .custom-pixi-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #6b7280 #1f2937;
          }
          
          /* ピアノエリアのcanvas要素にもスクロールバーを適用 */
          .custom-pixi-scrollbar canvas {
            max-width: none;
            max-height: none;
          }
        `}
      </style>
    </div>
  );
};

export default PIXINotesRenderer; 