/**
 * Phase 3: PIXI.js ノーツレンダリングシステム (Sprites最適化版)
 * 🚀 Graphics → Sprites 変換による超高速レンダリング
 */

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import type { ActiveNote } from '@/types';
import { unifiedFrameController, renderOptimizer, performanceMonitor, ObjectPool } from '@/utils/performanceOptimizer';

// ===== 型定義 =====

interface PIXINotesRendererProps {
  activeNotes: ActiveNote[];
  width: number;
  height: number;
  currentTime: number;
  onReady?: (renderer: PIXINotesRendererInstance | null) => void;
  className?: string;
}

interface NoteSprite {
  sprite: PIXI.Sprite;
  noteData: ActiveNote;
  glowSprite?: PIXI.Sprite;
  label?: PIXI.Text;
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
  noteNameStyle: 'off' | 'abc' | 'solfege';
  noteAccidentalStyle: 'sharp' | 'flat';
  transpose: number;
  practiceGuide?: 'off' | 'key' | 'key_auto';
}

// ===== テクスチャ管理システム =====

class TextureManager {
  private textures: Map<string, PIXI.Texture> = new Map();
  private app: PIXI.Application;
  
  constructor(app: PIXI.Application) {
    this.app = app;
    this.generateNoteTextures();
  }
  
  private generateNoteTextures(): void {
    const noteWidth = 14;
    const noteHeight = 5;
    
    // 各状態のテクスチャを生成
    const states = [
      { key: 'visible', color: 0x3B82F6 },
      { key: 'visibleBlack', color: 0x8B5CF6 },
      { key: 'hit', color: 0x10B981 },
      { key: 'missed', color: 0xEF4444 },
      { key: 'perfect', color: 0xF59E0B },
      { key: 'good', color: 0x8B5CF6 }
    ];
    
    states.forEach(({ key, color }) => {
      // 通常ノーツ
      this.createNoteTexture(`note_${key}`, noteWidth, noteHeight, color, false);
      // グローノーツ
      this.createNoteTexture(`note_${key}_glow`, noteWidth + 4, noteHeight + 2, color, true);
    });
  }
  
  private createNoteTexture(key: string, width: number, height: number, color: number, isGlow: boolean): void {
    const graphics = new PIXI.Graphics();
    
    if (isGlow) {
      // グロー効果
      graphics.beginFill(color, 0.3);
      graphics.drawRoundedRect(0, 0, width, height, 3);
      graphics.endFill();
      
      graphics.beginFill(color, 0.6);
      graphics.drawRoundedRect(2, 1, width - 4, height - 2, 2);
      graphics.endFill();
    } else {
      // 通常ノーツ
      graphics.beginFill(color);
      graphics.drawRoundedRect(0, 0, width, height, 2);
      graphics.endFill();
      
      // ハイライト
      graphics.beginFill(0xFFFFFF, 0.3);
      graphics.drawRoundedRect(1, 1, width - 2, 1, 1);
      graphics.endFill();
    }
    
    const texture = this.app.renderer.generateTexture(graphics);
    this.textures.set(key, texture);
    graphics.destroy();
  }
  
  getTexture(key: string): PIXI.Texture | undefined {
    return this.textures.get(key);
  }
  
  destroy(): void {
    this.textures.forEach(texture => texture.destroy());
    this.textures.clear();
  }
}

// ===== スプライトプールシステム =====

class SpritePool {
  private pool: ObjectPool<PIXI.Sprite>;
  private textureManager: TextureManager;
  
  constructor(textureManager: TextureManager) {
    this.textureManager = textureManager;
    this.pool = new ObjectPool(
      () => new PIXI.Sprite(),
      (sprite) => {
        sprite.visible = false;
        sprite.alpha = 1;
        sprite.tint = 0xFFFFFF;
        sprite.scale.set(1);
        sprite.position.set(0, 0);
      },
      50 // 初期プールサイズ
    );
  }
  
  getSprite(textureKey: string): PIXI.Sprite {
    const sprite = this.pool.get();
    const texture = this.textureManager.getTexture(textureKey);
    if (texture) {
      sprite.texture = texture;
    }
    sprite.visible = true;
    return sprite;
  }
  
  releaseSprite(sprite: PIXI.Sprite): void {
    this.pool.release(sprite);
  }
  
  destroy(): void {
    this.pool.clear();
  }
}

// ===== PIXI.js レンダラークラス (Sprites最適化版) =====

export class PIXINotesRendererInstance {
  private app: PIXI.Application;
  private container!: PIXI.Container;
  private notesContainer!: PIXI.Container;
  private effectsContainer!: PIXI.Container;
  private hitLineContainer!: PIXI.Container;
  private pianoContainer!: PIXI.Container;
  
  // Sprites最適化システム
  private textureManager!: TextureManager;
  private spritePool!: SpritePool;
  private noteSprites: Map<string, NoteSprite> = new Map();
  
  private particles!: PIXI.Container;
  private pianoSprites: Map<number, PIXI.Graphics> = new Map();
  private highlightedKeys: Set<number> = new Set();
  
  // キーボード入力コールバック
  private onKeyPress?: (note: number) => void;
  private onKeyRelease?: (note: number) => void;
  
  // リアルタイムアニメーション用
  private _currentTime: number = 0;
  private _animationSpeed: number = 1.0;
  private lastFrameTime: number = performance.now();
  
  private settings: RendererSettings = {
    noteWidth: 14,
    noteHeight: 5,
    hitLineY: 0,
    pianoHeight: 160,
    noteSpeed: 1.0,
    colors: {
      visible: 0x3B82F6,
      visibleBlack: 0x8B5CF6,
      hit: 0x10B981,
      missed: 0xEF4444,
      perfect: 0xF59E0B,
      good: 0x8B5CF6,
      whiteKey: 0xFFFFFF,
      blackKey: 0x000000,
      activeKey: 0xFBBF24,
    },
    effects: {
      glow: false, // Sprites最適化のため無効
      particles: false,
      trails: false
    },
    noteNameStyle: 'abc',
    noteAccidentalStyle: 'sharp',
    transpose: 0,
    practiceGuide: 'key'
  };
  
  private onDragActive: boolean = false;
  private currentDragNote: number | null = null;
  
  constructor(width: number, height: number) {
    // PIXI.js アプリケーション初期化（最高性能設定）
    this.app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x0A0A0F,
      antialias: false, // アンチエイリアス無効でパフォーマンス向上
      resolution: 1, // 解像度を1に固定
      autoDensity: false,
      powerPreference: 'high-performance',
      backgroundAlpha: 1,
      clearBeforeRender: true,
      preserveDrawingBuffer: false
    });
    
    // フレームレート最適化
    this.app.ticker.maxFPS = unifiedFrameController.getConfig().targetFPS;
    
    // インタラクションを有効化
    this.app.stage.eventMode = 'static';
    
    // 判定ラインをピアノの上端に配置
    this.settings.hitLineY = height - this.settings.pianoHeight;
    
    // Sprites最適化システム初期化
    this.textureManager = new TextureManager(this.app);
    this.spritePool = new SpritePool(this.textureManager);
    
    this.setupContainers();
    this.createNotesAreaBackground();
    this.setupPiano();
    this.setupHitLine();
    this.setupParticles();
    this.setupAnimationTicker();
  }
  
  private setupContainers(): void {
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // Z順: 背面 → 前面
    this.pianoContainer = new PIXI.Container();
    this.container.addChild(this.pianoContainer);

    this.notesContainer = new PIXI.Container();
    this.container.addChild(this.notesContainer);

    this.hitLineContainer = new PIXI.Container();
    this.container.addChild(this.hitLineContainer);

    this.effectsContainer = new PIXI.Container();
    this.container.addChild(this.effectsContainer);
  }
  
  private setupHitLine(): void {
    const hitLine = new PIXI.Graphics();
    hitLine.lineStyle(3, 0xFBBF24);
    hitLine.moveTo(0, this.settings.hitLineY);
    hitLine.lineTo(this.app.screen.width, this.settings.hitLineY);
    
    this.hitLineContainer.addChild(hitLine);
  }
  
  private setupPiano(): void {
    this.createPianoBackground();
    
    const minNote = 21;
    const maxNote = 108;
    
    // 白鍵の総数を計算
    const totalWhiteKeys = this.calculateTotalWhiteKeys();
    const whiteKeyWidth = this.app.screen.width / totalWhiteKeys;
    const blackKeyWidth = whiteKeyWidth * 0.6;
    
    let currentX = 0;
    let whiteKeyIndex = 0;
    
    // 白鍵を先に描画
    for (let note = minNote; note <= maxNote; note++) {
      if (!this.isBlackKey(note)) {
        const keySprite = this.createWhiteKey(currentX, whiteKeyWidth, note);
        this.pianoSprites.set(note, keySprite);
        this.pianoContainer.addChild(keySprite);
        
        currentX += whiteKeyWidth;
        whiteKeyIndex++;
      }
    }
    
    // 黒鍵を後から描画（白鍵の上に重ねる）
    for (let note = minNote; note <= maxNote; note++) {
      if (this.isBlackKey(note)) {
        const blackKeyX = this.calculateBlackKeyPosition(note, minNote, maxNote, totalWhiteKeys);
        const keySprite = this.createBlackKey(blackKeyX, blackKeyWidth, note);
        this.pianoSprites.set(note, keySprite);
        this.pianoContainer.addChild(keySprite);
      }
    }
  }
  
  private createNotesAreaBackground(): void {
    const background = new PIXI.Graphics();
    const areaHeight = this.settings.hitLineY;
    
    // シンプルなグラデーション背景
    background.beginFill(0x0A0A0F);
    background.drawRect(0, 0, this.app.screen.width, areaHeight);
    background.endFill();
    
    // 縦線ガイド（軽量版）
    this.createVerticalGuidelines();
    
    this.container.addChildAt(background, 0);
  }
  
  private createVerticalGuidelines(): void {
    const guidelines = new PIXI.Graphics();
    guidelines.lineStyle(1, 0x1F2937, 0.3);
    
    const totalWhiteKeys = this.calculateTotalWhiteKeys();
    const whiteKeyWidth = this.app.screen.width / totalWhiteKeys;
    
    // 白鍵の境界線のみ描画
    for (let i = 1; i < totalWhiteKeys; i++) {
      const x = i * whiteKeyWidth;
      guidelines.moveTo(x, 0);
      guidelines.lineTo(x, this.settings.hitLineY);
    }
    
    this.container.addChild(guidelines);
  }
  
  private createPianoBackground(): void {
    const pianoBackground = new PIXI.Graphics();
    const startY = this.settings.hitLineY;
    
    pianoBackground.beginFill(0x1F2937);
    pianoBackground.drawRect(0, startY, this.app.screen.width, this.settings.pianoHeight);
    pianoBackground.endFill();
    
    this.pianoContainer.addChild(pianoBackground);
  }
  
  private setupParticles(): void {
    this.particles = new PIXI.Container();
    this.effectsContainer.addChild(this.particles);
  }
  
  private setupAnimationTicker(): void {
    this.app.ticker.add(() => {
      const currentTime = performance.now();
      
      // 統合フレーム制御チェック
      if (unifiedFrameController.shouldSkipFrame(currentTime)) {
        return;
      }
      
      performanceMonitor.startFrame();
      
      // 高速アニメーション更新
      this.updateSpritesAnimation(currentTime);
      
      performanceMonitor.endFrame();
      performanceMonitor.updateFPS();
    });
  }
  
  /**
   * 🚀 Sprites最適化アニメーション更新
   */
  private updateSpritesAnimation(currentTime: number): void {
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    // ノーツスプライトの高速更新
    this.noteSprites.forEach((noteSprite, noteId) => {
      const { sprite, noteData } = noteSprite;
      
      // Y座標の直接更新（計算最小化）
      const newY = this.calculateNoteY(noteData);
      
      // 位置変更チェック（レンダリング最適化）
      if (renderOptimizer.hasPositionChanged(noteId, sprite.x, newY)) {
        sprite.y = newY;
        renderOptimizer.markDirty(noteId);
      }
      
      // 画面外チェック（高速）
      if (newY > this.app.screen.height + 50) {
        this.removeNoteSprite(noteId);
      }
    });
    
    // アクティブなIDセットでクリーンアップ
    const activeIds = new Set(this.noteSprites.keys());
    renderOptimizer.cleanup(activeIds);
  }
  
  // ... 続きの実装 ...
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
    containerRef.current.style.opacity = '0';
    containerRef.current.style.visibility = 'hidden';

    const renderer = new PIXINotesRendererInstance(width, height);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.view);

    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.style.opacity = '1';
        containerRef.current.style.visibility = 'visible';
        containerRef.current.style.transition = 'opacity 0.2s ease-in-out';
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