/**
 * Phase 3: PIXI.js ノーツレンダリングシステム
 * 高性能なノーツ降下アニメーション - ParticleContainer + テクスチャ最適化版
 */

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import type { ActiveNote } from '@/types';
import { unifiedFrameController, renderOptimizer, performanceMonitor } from '@/utils/performanceOptimizer';
import { log, perfLog, devLog } from '@/utils/logger';

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
  noteAccidentalStyle: 'sharp' | 'flat';
  /** ストアの transpose 値（±6） */
  transpose: number;
  /** 練習モードガイド設定 */
  practiceGuide?: 'off' | 'key' | 'key_auto';
}

// ===== テクスチャキャッシュ =====
interface NoteTextures {
  whiteVisible: PIXI.Texture;
  blackVisible: PIXI.Texture;
  hit: PIXI.Texture;
  missed: PIXI.Texture;
}

interface LabelTextures {
  abc_sharp: Map<string, PIXI.Texture>;
  abc_flat: Map<string, PIXI.Texture>;
  solfege_sharp: Map<string, PIXI.Texture>;
  solfege_flat: Map<string, PIXI.Texture>;
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
  private particles!: PIXI.Container;
  private pianoSprites: Map<number, PIXI.Graphics> = new Map();
  private highlightedKeys: Set<number> = new Set(); // ハイライト状態のキーを追跡
  
  // ★ ガイドライン管理用プロパティを追加
  private guidelines?: PIXI.Graphics;
  
  // ===== テクスチャキャッシュ =====
  private noteTextures!: NoteTextures;
  private labelTextures!: LabelTextures;
  
  // キーボード入力コールバック
  private onKeyPress?: (note: number) => void;
  private onKeyRelease?: (note: number) => void;
  
  // パフォーマンス監視
  private fpsCounter = 0;
  private lastFpsTime = 0;
  

  
  // リアルタイムアニメーション用
  /* eslint-disable @typescript-eslint/no-unused-vars */
  private _currentTime: number = 0;
  private _animationSpeed: number = 1.0;
  /* eslint-enable */
  private lastFrameTime: number = performance.now();
  private effectsElapsed: number = 0; // エフェクト更新用の経過時間カウンター
  
  private settings: RendererSettings = {
    noteWidth: 0,          // ★ 後で決定
    noteHeight: 8,
    hitLineY: 0,
    pianoHeight: 160,
    noteSpeed: 1.0,
    colors: {
      visible: 0x3B82F6,       // blue-500（白鍵ノーツ）
      visibleBlack: 0x8B5CF6,  // violet-500（黒鍵ノーツ）
      hit: 0x10B981,           // emerald-500
      missed: 0xEF4444,        // red-500
      perfect: 0xF59E0B,       // amber-500
      good: 0x8B5CF6,          // violet-500
      whiteKey: 0xFFFFFF,      // white
      blackKey: 0x000000,      // pure black
      activeKey: 0xFBBF24,     // amber-400
    },
    effects: {
      glow: false,             // グロー効果を完全無効化
      particles: false,        // パーティクル効果を完全無効化
      trails: false            // トレイル効果を完全無効化
    },
    noteNameStyle: 'abc',
    noteAccidentalStyle: 'sharp',
    transpose: 0,
    practiceGuide: 'key'
  };
  
  private onDragActive: boolean = false;
  private currentDragNote: number | null = null;
  
  constructor(width: number, height: number) {
    devLog.info(`🎯 PIXINotesRenderer constructor: ${width}x${height}`);
    
    // ★ まず白鍵幅を求めてnoteWidthを設定
    const totalWhite = this.calculateTotalWhiteKeys();
    const whiteKeyWidth = width / totalWhite;
    this.settings.noteWidth = whiteKeyWidth - 2;   // 1px ずつ余白
    devLog.info(`🎹 White key width: ${whiteKeyWidth.toFixed(2)}px, Note width: ${this.settings.noteWidth.toFixed(2)}px`);
    
    // PIXI.js アプリケーション初期化（統合レンダリングループ版）
    this.app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x0A0A0F, // より暗い宇宙的な背景
      antialias: true,
      resolution: 1, // 解像度を固定して一貫性を保つ
      autoDensity: false, // 自動密度調整を無効化
      resizeTo: undefined, // 自動リサイズを無効化
      powerPreference: 'high-performance', // 高性能GPU使用
      backgroundAlpha: 1,
      clearBeforeRender: true,
      preserveDrawingBuffer: false // パフォーマンス向上
    });
    
    // 強制的にCanvasサイズを設定
    this.app.renderer.resize(width, height);
    
    devLog.debug(`🎯 PIXI.js App created - Canvas: ${this.app.view.width}x${this.app.view.height}`);
    
    // インタラクションを有効化（重要）
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
      devLog.debug('✅ Texture generation completed');
    } catch (error) {
      log.error('❌ Texture generation failed:', error);
    }
    
    // セットアップシーケンス
    try {
      this.setupContainers();
      this.createTestVisual();
      this.createNotesAreaBackground();
      this.setupPiano();
      this.setupHitLine();
      this.setupParticles();
      devLog.debug('✅ PIXI setup sequence completed');
    } catch (error) {
      log.error('❌ PIXI setup failed:', error);
    }
    
    // ★ エフェクト更新をTickerに統合
    this.effectsElapsed = 0;
    this.app.ticker.add((tickerDelta) => {
      // パーティクルなど低頻度エフェクト
      this.effectsElapsed += this.app.ticker.deltaMS;
      if (this.effectsElapsed >= 33) { // ≒ 30 FPS
        this.updateParticleEffects(this.effectsElapsed / 1000);
        this.effectsElapsed = 0;
      }
    });
    
    log.info('✅ PIXI.js renderer initialized successfully');
  }

  /**
   * デバッグ用テスト図形（PIXI.js表示確認）
   */
  private createTestVisual(): void {
    devLog.debug('🧪 Creating test visual to verify PIXI.js canvas...');
    
    try {
      // 赤い矩形をテスト描画
      const testRect = new PIXI.Graphics();
      testRect.beginFill(0xFF0000); // 赤色
      testRect.drawRect(0, 0, 100, 50);
      testRect.endFill();
      testRect.x = 50;
      testRect.y = 50;
      
      this.container.addChild(testRect);
      devLog.debug('✅ Test rectangle added to main container');
      
      // 青い円もテスト描画
      const testCircle = new PIXI.Graphics();
      testCircle.beginFill(0x0000FF); // 青色
      testCircle.drawCircle(0, 0, 25);
      testCircle.endFill();
      testCircle.x = 200;
      testCircle.y = 100;
      
      this.container.addChild(testCircle);
      devLog.debug('✅ Test circle added to main container');
      
    } catch (error) {
      log.error('❌ Failed to create test visual:', error);
    }
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
      console.warn(`⚠️ Note height too small (${noteHeight}), using minimum 6px`);
      noteHeight = 6;
    }
    if (noteWidth < 8) {
      console.warn(`⚠️ Note width too small (${noteWidth}), using minimum 8px`);
      noteWidth = 8;
    }
    
    console.log(`🎯 Generating note textures with size: ${noteWidth}x${noteHeight}`);
    
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
    console.log('🎯 Starting label texture generation...');
    
    try {
      // 全ての音名パターンを定義
      const sharpNamesABC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const flatNamesABC = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
      const sharpNamesSolfege = ['ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ'];
      const flatNamesSolfege = ['ド', 'レ♭', 'レ', 'ミ♭', 'ミ', 'ファ', 'ソ♭', 'ソ', 'ラ♭', 'ラ', 'シ♭', 'シ'];

      // ラベルスタイル設定
      const labelStyle = new PIXI.TextStyle({
        fontSize: 10,
        fill: 0xFFFFFF,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        align: 'center',
        stroke: 0x000000,
        strokeThickness: 2
      });

      this.labelTextures = {
        abc_sharp: new Map(),
        abc_flat: new Map(), 
        solfege_sharp: new Map(),
        solfege_flat: new Map()
      };

      // ABC Sharp テクスチャ生成
      sharpNamesABC.forEach(name => {
        try {
          const text = new PIXI.Text(name, labelStyle);
          const texture = this.app.renderer.generateTexture(text);
          
          if (!texture || texture === PIXI.Texture.EMPTY) {
            console.warn(`⚠️ Failed to generate texture for ABC sharp: ${name}`);
            return;
          }
          
          this.labelTextures.abc_sharp.set(name, texture);
          text.destroy();
          console.log(`✅ Generated ABC sharp texture: ${name}`);
        } catch (error) {
          console.error(`❌ Error generating ABC sharp texture for ${name}:`, error);
        }
      });

      // ABC Flat テクスチャ生成
      flatNamesABC.forEach(name => {
        try {
          const text = new PIXI.Text(name, labelStyle);
          const texture = this.app.renderer.generateTexture(text);
          
          if (!texture || texture === PIXI.Texture.EMPTY) {
            console.warn(`⚠️ Failed to generate texture for ABC flat: ${name}`);
            return;
          }
          
          this.labelTextures.abc_flat.set(name, texture);
          text.destroy();
          console.log(`✅ Generated ABC flat texture: ${name}`);
        } catch (error) {
          console.error(`❌ Error generating ABC flat texture for ${name}:`, error);
        }
      });

      // Solfege Sharp テクスチャ生成
      sharpNamesSolfege.forEach(name => {
        try {
          const text = new PIXI.Text(name, labelStyle);
          const texture = this.app.renderer.generateTexture(text);
          
          if (!texture || texture === PIXI.Texture.EMPTY) {
            console.warn(`⚠️ Failed to generate texture for Solfege sharp: ${name}`);
            return;
          }
          
          this.labelTextures.solfege_sharp.set(name, texture);
          text.destroy();
          console.log(`✅ Generated Solfege sharp texture: ${name}`);
        } catch (error) {
          console.error(`❌ Error generating Solfege sharp texture for ${name}:`, error);
        }
      });

      // Solfege Flat テクスチャ生成
      flatNamesSolfege.forEach(name => {
        try {
          const text = new PIXI.Text(name, labelStyle);
          const texture = this.app.renderer.generateTexture(text);
          
          if (!texture || texture === PIXI.Texture.EMPTY) {
            console.warn(`⚠️ Failed to generate texture for Solfege flat: ${name}`);
            return;
          }
          
          this.labelTextures.solfege_flat.set(name, texture);
          text.destroy();
          console.log(`✅ Generated Solfege flat texture: ${name}`);
        } catch (error) {
          console.error(`❌ Error generating Solfege flat texture for ${name}:`, error);
        }
      });
      
      console.log(`🎯 Label texture generation completed! Total textures: ${
        this.labelTextures.abc_sharp.size + 
        this.labelTextures.abc_flat.size + 
        this.labelTextures.solfege_sharp.size + 
        this.labelTextures.solfege_flat.size
      }`);
      
    } catch (error) {
      console.error('❌ Critical error in generateLabelTextures:', error);
      // フォールバック: 空のテクスチャマップを作成
      this.labelTextures = {
        abc_sharp: new Map(),
        abc_flat: new Map(), 
        solfege_sharp: new Map(),
        solfege_flat: new Map()
      };
    }
  }

  /**
   * 音名に対応するラベルテクスチャを取得
   */
  private getLabelTexture(noteName: string): PIXI.Texture | null {
    if (!noteName || this.settings.noteNameStyle === 'off') {
      console.log(`🔍 getLabelTexture: Skipping empty note name or style is off`);
      return null;
    }

    // ラベルテクスチャが初期化されているかチェック
    if (!this.labelTextures) {
      console.error('❌ getLabelTexture: labelTextures not initialized!');
      return null;
    }

    const style = this.settings.noteNameStyle;
    const accidental = this.settings.noteAccidentalStyle;

    let textureMap: Map<string, PIXI.Texture>;

    if (style === 'abc') {
      textureMap = accidental === 'flat' ? this.labelTextures.abc_flat : this.labelTextures.abc_sharp;
    } else if (style === 'solfege') {
      textureMap = accidental === 'flat' ? this.labelTextures.solfege_flat : this.labelTextures.solfege_sharp;
    } else {
      textureMap = this.labelTextures.abc_sharp; // fallback
    }

    const texture = textureMap.get(noteName);
    
    if (!texture) {
      console.warn(`⚠️ getLabelTexture: No texture found for "${noteName}" (style: ${style}, accidental: ${accidental})`);
      console.log(`Available textures in map:`, Array.from(textureMap.keys()));
      return null;
    }

    if (texture === PIXI.Texture.EMPTY) {
      console.warn(`⚠️ getLabelTexture: Found empty texture for "${noteName}"`);
      return null;
    }

    log.debug(`✅ getLabelTexture: Found texture for "${noteName}" (${texture.width}x${texture.height})`);
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
    // メインコンテナを生成
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // Z順: 背面 → 前面

    // 1. ピアノコンテナ（最背面）
    this.pianoContainer = new PIXI.Container();
    this.container.addChild(this.pianoContainer);

    // 2-a. 白鍵ノーツ専用コンテナ
    this.whiteNotes = new PIXI.ParticleContainer(
      3000, // 最大3000個の白鍵ノーツをサポート
      { 
        position: true, 
        alpha: true,
        uvs: true,   // 👈 複数テクスチャ対応に必須
        tint: true
      }
    );
    this.container.addChild(this.whiteNotes);

    // 2-b. 黒鍵ノーツ専用コンテナ
    this.blackNotes = new PIXI.ParticleContainer(
      2000, // 最大2000個の黒鍵ノーツをサポート
      { 
        position: true, 
        alpha: true,
        uvs: true,   // 👈 複数テクスチャ対応に必須
        tint: true
      }
    );
    this.container.addChild(this.blackNotes);

    // 3. ラベル専用コンテナ（普通のContainerに変更で安定性向上）
    this.labelsContainer = new PIXI.Container() as any;
    this.container.addChild(this.labelsContainer);

    // 4. ヒットラインコンテナ（ノーツ上、エフェクト下）
    this.hitLineContainer = new PIXI.Container();
    this.container.addChild(this.hitLineContainer);

    // 5. エフェクトコンテナ（最前面）
    this.effectsContainer = new PIXI.Container();
    this.container.addChild(this.effectsContainer);
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
    
    const whiteKeyWidth = this.app.screen.width / totalWhiteKeys;
    
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
    
    // ===== グリッサンド用ドラッグハンドラ =====
    this.pianoContainer.eventMode = 'static';
    this.pianoContainer.on('pointerdown', this.handleDragStart.bind(this));
    this.pianoContainer.on('pointermove', this.handleDragMove.bind(this));
    this.pianoContainer.on('pointerup', this.handleDragEnd.bind(this));
    this.pianoContainer.on('pointerupoutside', this.handleDragEnd.bind(this));
    this.pianoContainer.on('pointercancel', this.handleDragEnd.bind(this));
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
    
    this.pianoContainer.addChild(background);
  }
  
  private setupParticles(): void {
    // 通常のコンテナを使用（PIXI.Graphicsとの互換性のため）
    this.particles = new PIXI.Container();
    this.effectsContainer.addChild(this.particles);
  }
  
  private setupLightweightEffectsTicker(): void {
    // 統合済みのため空実装（エフェクト更新はPIXIのTickerに統合済み）
  }
  
  private updateParticleEffects(deltaTime: number): void {
    const childrenToRemove: PIXI.DisplayObject[] = [];
    const maxProcessPerFrame = 10; // 1フレームあたりの最大処理数
    let processed = 0;
    
    for (const child of this.effectsContainer.children) {
      if (processed >= maxProcessPerFrame) break;
      
      if (child.alpha > 0) {
        child.alpha -= deltaTime * 2; // フェードアウト
        if (child.alpha <= 0) {
          childrenToRemove.push(child);
        }
      }
      processed++;
    }
    
    // 安全に削除（バッチ処理）
    for (const child of childrenToRemove) {
      try {
        if (child.parent) {
          child.parent.removeChild(child);
        }
        if (!child.destroyed) {
          child.destroy({ children: true, texture: false, baseTexture: false });
        }
      } catch (error) {
        console.warn('⚠️ Particle cleanup error:', error);
      }
    }
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
        fontSize: Math.min(width * 0.25, 12),
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
      
      // より確実なイベント処理
      key.on('pointerdown', (event) => {
        event.stopPropagation();
        this.handleKeyPress(midiNote);
      });
      
      key.on('pointerup', (event) => {
        event.stopPropagation();
        this.handleKeyRelease(midiNote);
      });
      
      // タッチデバイス対応
      key.on('touchstart', (event) => {
        event.stopPropagation();
        this.handleKeyPress(midiNote);
      });
      
      key.on('touchend', (event) => {
        event.stopPropagation();
        this.handleKeyRelease(midiNote);
      });
      
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
      
              // より確実なイベント処理
        key.on('pointerdown', (event) => {
          event.stopPropagation();
          this.handleKeyPress(midiNote);
        });
      
      key.on('pointerup', (event) => {
        event.stopPropagation();
        this.handleKeyRelease(midiNote);
      });
      
      // タッチデバイス対応
      key.on('touchstart', (event) => {
        event.stopPropagation();
        this.handleKeyPress(midiNote);
      });
      
      key.on('touchend', (event) => {
        event.stopPropagation();
        this.handleKeyRelease(midiNote);
      });
      
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
    const accidental = this.settings.noteAccidentalStyle;

    if (style === 'off') return '';

    // 12音階の名前テーブル
    const sharpNamesABC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatNamesABC  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

    const sharpNamesSolfege = ['ド', 'ド#', 'レ', 'レ#', 'ミ', 'ファ', 'ファ#', 'ソ', 'ソ#', 'ラ', 'ラ#', 'シ'];
    const flatNamesSolfege  = ['ド', 'レ♭', 'レ', 'ミ♭', 'ミ', 'ファ', 'ソ♭', 'ソ', 'ラ♭', 'ラ', 'シ♭', 'シ'];

    const index = midiNote % 12;

    if (style === 'abc') {
      return accidental === 'flat' ? flatNamesABC[index] : sharpNamesABC[index];
    }
    if (style === 'solfege') {
      return accidental === 'flat' ? flatNamesSolfege[index] : sharpNamesSolfege[index];
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
        console.error(`❌ Invalid black key note: ${note}`);
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
      console.warn(`⚠️ Key sprite not found for note: ${midiNote}`);
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
   * ノーツ表示の更新 - 超高速化版
   * 降下計算は矩形あたり1行、絶対時刻から直接Y座標を計算
   */
  updateNotes(activeNotes: ActiveNote[], currentTime?: number): void {
    if (!currentTime) return; // 絶対時刻が必要
    
    const currentNoteIds = new Set(activeNotes.map(note => note.id));
    
    // GameEngineと同じ計算式を使用（統一化）
    const baseFallDuration = 5.0; // LOOKAHEAD_TIME
    const visualSpeedMultiplier = this.settings.noteSpeed;
    const totalDistance = this.settings.hitLineY - (-5); // 画面上端から判定ラインまで
    const speedPxPerSec = (totalDistance / baseFallDuration) * visualSpeedMultiplier;
    
    // FPS監視（デバッグ用）
    this.fpsCounter++;
    if (currentTime - this.lastFpsTime >= 1000) {
      perfLog.info(`🚀 PIXI FPS: ${this.fpsCounter} | Notes: ${activeNotes.length} | Sprites: ${this.noteSprites.size} | hitLineY: ${this.settings.hitLineY} | speedPxPerSec: ${speedPxPerSec.toFixed(1)}`);
      this.fpsCounter = 0;
      this.lastFpsTime = currentTime;
    }
    
    // 古いノーツを削除（高速バッチ処理）
    for (const [noteId] of this.noteSprites) {
      if (!currentNoteIds.has(noteId)) {
      this.removeNoteSprite(noteId);
      }
    }
    
    // ===== 超高速位置計算ループ =====
    // 分岐なし、計算のみ、1ノーツあたり1行で実行
    for (const note of activeNotes) {
      let sprite = this.noteSprites.get(note.id);
      
      if (!sprite) {
        // 新規ノーツ作成（状態管理のみ、位置は後で設定）
        sprite = this.createNoteSprite(note);
      }
      
      // ▼ updateNotes() の Y 座標更新ロジック頭だけ置換
      const suppliedY = note.y;               // Engine がくれた絶対座標
      let newY: number;

      if (suppliedY !== undefined) {
        newY = suppliedY;                     // ★ これを最優先
      } else {
        // フォールバック: 従来の自前計算
        const newYcalc = this.settings.hitLineY -
                         (note.time - currentTime) * speedPxPerSec;
        newY = newYcalc;
      }

      sprite.sprite.y = newY;
      
      // 詳細位置デバッグ（初回のみ）
      if (activeNotes.length > 0 && this.fpsCounter === 1) {
        devLog.debug(`🎯 Position calculation: note.time=${note.time}, currentTime=${currentTime}, timeToHit=${note.time - currentTime}, newY=${newY}, hitLineY=${this.settings.hitLineY}, speedPxPerSec=${speedPxPerSec.toFixed(1)}`);
      }
      
      // ラベルとグローも同じY座標に同期
      if (sprite.label) sprite.label.y = newY - 8;
      if (sprite.glowSprite) sprite.glowSprite.y = newY;
      
      // X座標はピッチ変更時のみ更新（頻度が低い）
      if (sprite.noteData.pitch !== note.pitch) {
        const x = this.pitchToX(note.pitch);
        sprite.sprite.x = x;
        if (sprite.label) sprite.label.x = x;
        if (sprite.glowSprite) sprite.glowSprite.x = x;
        }
      
      // 状態変更チェック（頻度が低い処理のみ）
      if (sprite.noteData.state !== note.state) {
        this.updateNoteState(sprite, note);
      }
      
      sprite.noteData = note;
    }
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
    
    log.debug(`🎵 Creating main note sprite: texture=${texture.width}x${texture.height}, x=${x}, y=0, pitch=${effectivePitch}`);
    
    // 音名ラベル（テクスチャアトラスから取得して labelsContainer に配置）
    let label: PIXI.Sprite | undefined;
    const _noteNameForLabel = this.getMidiNoteName(effectivePitch);
    if (_noteNameForLabel) {
      log.debug(`🏷️ Creating label for note: ${_noteNameForLabel} (pitch: ${effectivePitch})`);
      
      try {
        const labelTexture = this.getLabelTexture(_noteNameForLabel);
        if (labelTexture) {
          label = new PIXI.Sprite(labelTexture);
          label.anchor.set(0.5, 1);
          label.x = x;
          label.y = 0; // 後で設定
          
          // 通常のContainerへ追加
          try {
            this.labelsContainer.addChild(label);
            log.debug(`✅ Successfully added label sprite to container for "${_noteNameForLabel}"`);
          } catch (containerError) {
            log.error(`❌ Failed to add label to container for "${_noteNameForLabel}":`, containerError);
            label.destroy();
            label = undefined;
          }
        } else {
          log.warn(`⚠️ No texture available for label "${_noteNameForLabel}"`);
        }
      } catch (error) {
        log.error(`❌ Error creating label sprite for "${_noteNameForLabel}":`, error);
        label = undefined;
      }
    } else {
      devLog.debug(`🔍 No label name generated for pitch ${effectivePitch}`);
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
      label
    };
    
    this.noteSprites.set(note.id, noteSprite);
    return noteSprite;
  }
  
  /**
   * ノーツ状態変更処理（頻度が低い処理のみ）
   */
  private updateNoteState(noteSprite: NoteSprite, note: ActiveNote): void {
    const effectivePitch = note.pitch + this.settings.transpose;

    // ==== 判定ライン通過時のピアノキー点灯 ====
    if (note.crossingLogged && !noteSprite.noteData.crossingLogged && this.settings.practiceGuide !== 'off') {
      this.highlightKey(effectivePitch, true);
      setTimeout(() => this.highlightKey(effectivePitch, false), 150);
    }

    // ===== ヒット時はテクスチャを触らずαだけを落とす =====
    if (note.state === 'hit') {
      noteSprite.sprite.alpha = 0;          // 本体ごと即非表示
    } else {
      noteSprite.sprite.alpha = 1;
      const isBlackNote = this.isBlackKey(effectivePitch);
      noteSprite.sprite.texture = isBlackNote
        ? this.noteTextures.blackVisible
        : this.noteTextures.whiteVisible;
    }
    
    // グロー効果の更新
      if (noteSprite.glowSprite) {
        this.drawGlowShape(noteSprite.glowSprite, note.state, note.pitch);
      }
      
        // ラベルもαで同期させる（visibleだとGCがズレる）
    if (noteSprite.label) {
      noteSprite.label.alpha = note.state === 'hit' ? 0 : 1;
    }
      
      // ヒット時のエフェクトのみ（ミス時は無し）
      if (note.state === 'hit') {
        const judgmentLabel = 'good';
        this.createHitEffect(noteSprite.sprite.x, noteSprite.sprite.y, note.state, judgmentLabel);
      }
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
      console.warn(`⚠️ Note sprite cleanup error for ${noteId}:`, error);
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
  
  private createHitEffect(x: number, y: number, state: 'hit' | 'missed', judgment?: string): void {
    // ヒット時のエフェクトのみ（ミス時のエフェクトは削除）
    const isGoodHit = state === 'hit' && judgment === 'good';
    
    if (isGoodHit) {
      // シンプルな円形エフェクト
      const effect = new PIXI.Graphics();
      effect.beginFill(this.settings.colors.good, 0.8);
      effect.drawCircle(0, 0, 16);
      effect.endFill();
      effect.x = x;
      effect.y = y;
      this.effectsContainer.addChild(effect);

      // 短時間で消去
      setTimeout(() => {
        try {
          if (effect && !effect.destroyed && this.effectsContainer.children.includes(effect)) {
            this.effectsContainer.removeChild(effect);
            effect.destroy();
          }
        } catch (err) {
          console.warn('エフェクト削除エラー:', err);
        }
      }, 300);
    }
    
    // ミス時のパーティクルエフェクトは削除
  }
  
  private getStateColor(state: ActiveNote['state'], pitch?: number): number {
    switch (state) {
      case 'visible': 
        if (pitch !== undefined && this.isBlackKey(pitch + this.settings.transpose)) {
          return this.settings.colors.visibleBlack;
        }
        return this.settings.colors.visible;
      case 'hit': return this.settings.colors.hit;
      case 'missed': return this.settings.colors.missed;
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
    console.warn(`⚠️ ノーツY座標がGameEngineから提供されませんでした: ${note.id}`);
    return this.settings.hitLineY + 100;
  }
  
  /**
   * 設定更新
   */
  updateSettings(newSettings: Partial<RendererSettings>): void {
    console.log(`🔧 updateSettings called`);
    
    // 破棄後に呼ばれた場合の安全ガード
    // this.app.renderer は destroy() 後にプロパティが undefined になるためチェック
    if (!this.app || (this.app as any)._destroyed || !this.app.screen) {
      console.warn('PIXINotesRendererInstance.updateSettings: renderer already destroyed, skipping');
      return;
    }

    const prevPianoHeight = this.settings.pianoHeight;
    const prevTranspose = this.settings.transpose;
    const prevNoteNameStyle = this.settings.noteNameStyle;
    this.settings = { ...this.settings, ...newSettings };

    // ピアノ高さが変更された場合、判定ラインと背景を再配置
    if (newSettings.pianoHeight !== undefined && newSettings.pianoHeight !== prevPianoHeight) {
      // 新しい判定ラインYを計算
      // 修正: app.view.height を使用
      this.settings.hitLineY = this.app.view.height - this.settings.pianoHeight;
      console.log(`🔧 Updated hitLineY: ${this.settings.hitLineY}`);

      // 既存のヒットラインを削除して再描画
      this.hitLineContainer.removeChildren();
      this.setupHitLine();

      // ==== 背景／ガイドラインを再生成 ====
      try {
        // 背景 (container の先頭)
        if (this.container.children.length > 0) {
          this.container.removeChildAt(0);
        }
        
        // ガイドラインは createNotesAreaBackground() で新しく作成される
      } catch (err) {
        console.warn('背景再生成時にエラーが発生しました', err);
      }

      // 新しい背景とガイドラインを再作成
      this.createNotesAreaBackground();
    }

    // === noteNameStyle が変化した場合、鍵盤とノートの音名表示を更新 ===
    if (newSettings.noteNameStyle !== undefined && newSettings.noteNameStyle !== prevNoteNameStyle) {
      // 鍵盤の音名表示を更新（鍵盤を再描画）
      this.pianoContainer.removeChildren();
      this.pianoSprites.clear();
      this.setupPiano();

      // 既存ノートのラベルを更新
      this.noteSprites.forEach((noteSprite) => {
        const pitch = noteSprite.noteData.pitch;
        const effectivePitch = pitch + this.settings.transpose;
        const noteName = this.getMidiNoteName(effectivePitch);

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

    // === transpose が変化した場合、既存ノートのラベル / カラーを更新 ===
    if (newSettings.transpose !== undefined && newSettings.transpose !== prevTranspose) {
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
        if (noteSprite.label && noteName) {
          const newTexture = this.getLabelTexture(noteName);
          if (newTexture) {
            noteSprite.label.texture = newTexture;
          }
        } else if (!noteSprite.label && noteName) {
          const labelTexture = this.getLabelTexture(noteName);
          if (labelTexture) {
            const label = new PIXI.Sprite(labelTexture);
            label.anchor.set(0.5, 1);
            label.x = newX;
            label.y = 0; // 後で設定
            this.labelsContainer.addChild(label);
            noteSprite.label = label;
          }
        } else if (noteSprite.label && !noteName) {
          if (this.labelsContainer.children.includes(noteSprite.label)) {
            this.labelsContainer.removeChild(noteSprite.label);
          }
          noteSprite.label.destroy();
          noteSprite.label = undefined;
        }

        // 3) カラー・形状更新（Sprite用のテクスチャ交換）
        const noteData = noteSprite.noteData;
        const isBlackNote = this.isBlackKey(noteData.pitch + this.settings.transpose);
        let newTexture: PIXI.Texture;

        switch (noteData.state) {
          case 'hit':
            newTexture = this.noteTextures.hit;
            break;
          case 'missed':
            newTexture = this.noteTextures.missed;
            break;
          case 'visible':
          default:
            newTexture = isBlackNote ? this.noteTextures.blackVisible : this.noteTextures.whiteVisible;
            break;
        }

        noteSprite.sprite.texture = newTexture;

        if (noteSprite.glowSprite) {
          this.drawGlowShape(noteSprite.glowSprite, noteData.state, noteData.pitch);
        }
      });
    }
  }
  
  /**
   * リサイズ対応
   */
  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
    
    // 修正: app.view.height を使用
    this.settings.hitLineY = this.app.view.height - this.settings.pianoHeight;
    console.log(`🔧 Resize hitLineY: ${this.settings.hitLineY}`);
    
    // ピアノとヒットラインの再描画
    this.pianoContainer.removeChildren();
    this.pianoSprites.clear();
    this.hitLineContainer.removeChildren();
    
    this.setupPiano();
    this.setupHitLine();

    // ===== 背景とガイドラインを再生成 =====
    try {
      if (this.container.children.length > 0) {
        this.container.removeChildAt(0);
      }
      // ガイドラインクリーンアップは createNotesAreaBackground() で自動処理
    } catch (err) {
      console.warn('resize 時の背景クリアに失敗', err);
    }

    this.createNotesAreaBackground();
    
    // ★ 白鍵幅が変わった場合はテクスチャを再生成
    const newWhiteKeyWidth = this.getWhiteKeyWidth();
    const newNoteWidth = newWhiteKeyWidth - 2;
    if (Math.abs(newNoteWidth - this.settings.noteWidth) > 0.1) { // 誤差を考慮
      this.settings.noteWidth = newNoteWidth;
      devLog.info(`🔄 Regenerating note textures with new width: ${newNoteWidth.toFixed(2)}px`);
      
      // 新しい幅でテクスチャを作り直し
      this.generateNoteTextures();
      
      // 既存ノートに新テクスチャを反映
      this.noteSprites.forEach(ns => {
        const isBlack = this.isBlackKey(ns.noteData.pitch + this.settings.transpose);
        switch (ns.noteData.state) {
          case 'hit':
            ns.sprite.texture = this.noteTextures.hit;
            break;
          case 'missed':
            ns.sprite.texture = this.noteTextures.missed;
            break;
          case 'visible':
          default:
            ns.sprite.texture = isBlack ? this.noteTextures.blackVisible : this.noteTextures.whiteVisible;
            break;
        }
      });
    }
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    try {
      // ノートスプライトを安全に削除
      const noteIds = Array.from(this.noteSprites.keys());
      for (const noteId of noteIds) {
        this.removeNoteSprite(noteId);
      }
      this.noteSprites.clear();

      // ピアノスプライトをクリア
      this.pianoSprites.clear();
      this.highlightedKeys.clear();

      // ★ ガイドラインも破棄
      if (this.guidelines) {
        this.guidelines.destroy();
        this.guidelines = undefined;
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
      console.warn('⚠️ PIXI renderer destroy error:', error);
    }
  }
  
  /**
   * ピアノキー入力コールバックの設定
   */
  setKeyCallbacks(onKeyPress: (note: number) => void, onKeyRelease: (note: number) => void): void {
    this.onKeyPress = onKeyPress;
    this.onKeyRelease = onKeyRelease;
  }

  /**
   * 内部キープレスハンドラー
   */
  private handleKeyPress(midiNote: number): void {
    // ビジュアルフィードバック
    this.highlightKey(midiNote, true);
    
    // 外部コールバック呼び出し
    if (this.onKeyPress) {
      this.onKeyPress(midiNote);
    } else {
      console.warn(`⚠️ No onKeyPress callback set! Note: ${midiNote}`);
    }
  }
  
  /**
   * 内部キーリリースハンドラー
   */
  private handleKeyRelease(midiNote: number): void {
    // 黒鍵は少し長めにハイライトを維持
    const isBlackKey = this.isBlackKey(midiNote);
    const highlightDuration = isBlackKey ? 200 : 150;
    
    setTimeout(() => {
      this.highlightKey(midiNote, false);
    }, highlightDuration);
    
    // 外部コールバック呼び出し
    if (this.onKeyRelease) {
      this.onKeyRelease(midiNote);
    } else {
      console.warn(`⚠️ No onKeyRelease callback set! Note: ${midiNote}`);
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
  
  // ===== PIXI.js レンダラー初期化 (一度だけ) =====
  useEffect(() => {
    if (!containerRef.current || rendererRef.current) return;

    // 初期ローディング時にフェードイン
    // 一時的にコメントアウト（デバッグ用）
    // containerRef.current.style.opacity = '0';
    // containerRef.current.style.visibility = 'hidden';
    
    console.log('🎯 Skipping initial hide for debugging...');

    const renderer = new PIXINotesRendererInstance(width, height);
    rendererRef.current = renderer;
    
    // ===== 簡略デバッグ（パフォーマンス重視） =====
    console.log('🔍 Basic check: Canvas size:', renderer.view.width, 'x', renderer.view.height);
    
    try {
      containerRef.current.appendChild(renderer.view);
      console.log('✅ Canvas added to DOM');
    } catch (error) {
      console.error('❌ appendChild failed:', error);
    }

    console.log('🎯 PIXI Container initially hidden, scheduling fade-in...');
    
    requestAnimationFrame(() => {
      console.log('🎯 Fade-in animation frame executing...');
      if (containerRef.current) {
        containerRef.current.style.opacity = '1';
        containerRef.current.style.visibility = 'visible';
        containerRef.current.style.transition = 'opacity 0.2s ease-in-out';
        console.log('✅ PIXI Container made visible');
      } else {
        console.error('❌ containerRef.current is null during fade-in');
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
      rendererRef.current.resize(width, height);
    }
  }, [width, height]);
  
  return (
    <div
      ref={containerRef}
      className={className}
      style={{ 
        width, 
        height,
        // 初期化時のサイズ変更を防ぐため明示的にサイズを設定
        minWidth: width,
        minHeight: height,
        overflow: 'hidden',
        backgroundColor: '#111827' // ロード中の背景色
      }}
    />
  );
};

export default PIXINotesRenderer; 