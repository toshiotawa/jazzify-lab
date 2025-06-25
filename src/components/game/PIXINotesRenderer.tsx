/**
 * Phase 3: PIXI.js ノーツレンダリングシステム
 * 高性能なノーツ降下アニメーション
 */

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import type { ActiveNote } from '@/types';

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
  sprite: PIXI.Graphics;
  noteData: ActiveNote;
  glowSprite?: PIXI.Graphics;
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
  keyboardNoteNameStyle: 'off' | 'abc' | 'solfege';
  noteNoteNameStyle: 'off' | 'abc' | 'solfege';
  noteAccidentalStyle: 'sharp' | 'flat';
  /** ストアの transpose 値（±6） */
  transpose: number;
}

// ===== PIXI.js レンダラークラス =====

export class PIXINotesRendererInstance {
  private app: PIXI.Application;
  private container!: PIXI.Container;
  private notesContainer!: PIXI.Container;
  private effectsContainer!: PIXI.Container;
  private hitLineContainer!: PIXI.Container;
  private pianoContainer!: PIXI.Container;
  
  private noteSprites: Map<string, NoteSprite> = new Map();
  private particles!: PIXI.Container;
  private pianoSprites: Map<number, PIXI.Graphics> = new Map();
  private highlightedKeys: Set<number> = new Set(); // ハイライト状態のキーを追跡
  
  // キーボード入力コールバック
  private onKeyPress?: (note: number) => void;
  private onKeyRelease?: (note: number) => void;
  
  // リアルタイムアニメーション用
  private currentTime: number = 0;
  private animationSpeed: number = 1.0;
  private lastFrameTime: number = performance.now();
  
  private settings: RendererSettings = {
    noteWidth: 14,
    noteHeight: 5,
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
      glow: true,
      particles: true,
      trails: false
    },
    keyboardNoteNameStyle: 'abc',
    noteNoteNameStyle: 'abc',
    noteAccidentalStyle: 'sharp',
    transpose: 0
  };
  
  private onDragActive: boolean = false;
  private currentDragNote: number | null = null;
  
  constructor(width: number, height: number) {
    // PIXI.js アプリケーション初期化
    this.app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x0A0A0F, // より暗い宇宙的な背景
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    // インタラクションを有効化（重要）
    this.app.stage.interactive = true;
    this.app.stage.interactiveChildren = true;
    
    // 判定ラインをピアノの上端に正確に配置
    this.settings.hitLineY = height - this.settings.pianoHeight;
    
    this.setupContainers();
    this.createNotesAreaBackground(); // 新しい背景システム
    this.setupPiano();
    this.setupHitLine();
    this.setupParticles();
    this.setupAnimationTicker();
    
    // デバッグ情報をコンソールに出力
    console.log('🎹 PIXI.js Piano Renderer initialized:', {
      width,
      height,
      hitLineY: this.settings.hitLineY,
      pianoHeight: this.settings.pianoHeight,
      interactive: this.app.stage.interactive
    });
  }
  
  private setupContainers(): void {
    // メインコンテナを生成
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // Z順: 背面 → 前面

    // 1. ピアノコンテナ（最背面）
    this.pianoContainer = new PIXI.Container();
    this.container.addChild(this.pianoContainer);

    // 2. ノーツコンテナ（ピアノの上に重ねる）
    this.notesContainer = new PIXI.Container();
    this.container.addChild(this.notesContainer);

    // 3. ヒットラインコンテナ（ノーツ上、エフェクト下）
    this.hitLineContainer = new PIXI.Container();
    this.container.addChild(this.hitLineContainer);

    // 4. エフェクトコンテナ（最前面）
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
    console.log('🎹 Creating white keys...');
    for (let note = minNote; note <= maxNote; note++) {
      if (!this.isBlackKey(note)) {
        const whiteKey = this.createWhiteKey(whiteKeyIndex * whiteKeyWidth, whiteKeyWidth, note);
        whiteKeysContainer.addChild(whiteKey);
        this.pianoSprites.set(note, whiteKey);
        whiteKeyIndex++;
      }
    }
    
    // 黒鍵を描画（白鍵の上、正確な位置計算）
    console.log('🎹 Creating black keys...');
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
    this.pianoContainer.interactive = true;
    this.pianoContainer.on('pointerdown', this.handleDragStart.bind(this));
    this.pianoContainer.on('pointermove', this.handleDragMove.bind(this));
    this.pianoContainer.on('pointerup', this.handleDragEnd.bind(this));
    this.pianoContainer.on('pointerupoutside', this.handleDragEnd.bind(this));
    this.pianoContainer.on('pointercancel', this.handleDragEnd.bind(this));
    
    console.log(`🎹 Piano setup completed: ${whiteKeyIndex} white keys, ${blackKeysContainer.children.length} black keys`);
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
   * 白鍵に合わせた縦ガイドラインを作成
   */
  private createVerticalGuidelines(): void {
    const guidelines = new PIXI.Graphics();
    
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
    
    // 各白鍵の境界線を描画
    let whiteKeyIndex = 0;
    for (let note = minNote; note <= maxNote; note++) {
      if (!this.isBlackKey(note)) {
        const x = whiteKeyIndex * whiteKeyWidth;
        
        // B-C間とE-F間は濃いガイドライン
        const noteName = this.getMidiNoteName(note, false);
        const isSpecialTransition = noteName === 'C' || noteName === 'F';
        
        const lineWidth = isSpecialTransition ? 2 : 1;
        const alpha = isSpecialTransition ? 0.6 : 0.25;
        const color = isSpecialTransition ? 0x8B5CF6 : 0x6B7280; // 特別な位置は紫、通常はグレー
        
        guidelines.lineStyle(lineWidth, color, alpha);
        guidelines.moveTo(x, 0);
        guidelines.lineTo(x, this.settings.hitLineY);
        
        whiteKeyIndex++;
      }
    }
    
    // 右端のガイドライン
    guidelines.lineStyle(1, 0x6B7280, 0.25);
    guidelines.moveTo(this.app.screen.width - 1, 0);
    guidelines.lineTo(this.app.screen.width - 1, this.settings.hitLineY);
    
    this.notesContainer.addChildAt(guidelines, 0); // ノーツの背後に配置
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
  
  private setupAnimationTicker(): void {
    // **完璧な同期のためのアニメーションティッカー**
    // 補間を排除し、ダイレクト更新のみ実行
    this.app.ticker.add(() => {
      const currentFrameTime = performance.now();
      const deltaTime = (currentFrameTime - this.lastFrameTime) / 1000;
      this.lastFrameTime = currentFrameTime;
      
      // フレームレート制御（60FPS目標）
      if (deltaTime > 1/30) return;
      
      // **パフォーマンス向上のみを目的とした軽量処理**
      // ノーツの位置更新は updateNoteSprite で行われるため、
      // ここではパーティクルエフェクトなどの補助的アニメーションのみ実行
      
      // パーティクルアニメーション（もしあれば）
      for (const child of this.effectsContainer.children) {
        if (child.alpha > 0) {
          child.alpha -= deltaTime * 2; // フェードアウト
          if (child.alpha <= 0) {
            this.effectsContainer.removeChild(child);
            child.destroy();
          }
        }
      }
    });
    
    console.log('🎬 PIXI.js 精密同期ティッカー開始 - 補間無効化済み');
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
      const noteName = this.getMidiNoteName(midiNote, false);
      const text = new PIXI.Text(noteName, {
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
        key.interactive = true;
        key.cursor = 'pointer';
      
      // より確実なイベント処理
      key.on('pointerdown', (event) => {
        // console.log(`🎹 White key pressed: ${midiNote} (${this.getMidiNoteName(midiNote)})`);
        event.stopPropagation();
        this.handleKeyPress(midiNote);
      });
      
      key.on('pointerup', (event) => {
        // console.log(`🎹 White key released: ${midiNote}`);
        event.stopPropagation();
        this.handleKeyRelease(midiNote);
      });
      
      // タッチデバイス対応
      key.on('touchstart', (event) => {
        // console.log(`📱 White key touch: ${midiNote}`);
        event.stopPropagation();
        this.handleKeyPress(midiNote);
      });
      
      key.on('touchend', (event) => {
        // console.log(`📱 White key touch end: ${midiNote}`);
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
    
    // デバッグ情報（コメントアウト済み）
    // if (midiNote !== undefined) {
    //   console.log(`🎹 Creating black key: Note=${midiNote}, X=${x}, Width=${adjustedWidth}, VisibleWidth=${adjustedWidth * 0.75}`);
    // }
    
          // インタラクション設定を強化
      if (midiNote !== undefined) {
        key.interactive = true;
        key.cursor = 'pointer';
      
              // より確実なイベント処理
        key.on('pointerdown', (event) => {
          // console.log(`🎹 BLACK KEY PRESSED: ${midiNote} (${this.getMidiNoteName(midiNote)})`, {
          //   eventType: event.type,
          //   position: { x: event.global.x, y: event.global.y },
          //   keyPosition: { x: key.x, y: key.y },
          //   keyBounds: key.getBounds()
          // });
          event.stopPropagation();
          this.handleKeyPress(midiNote);
        });
      
      key.on('pointerup', (event) => {
        // console.log(`🎹 Black key released: ${midiNote}`);
        event.stopPropagation();
        this.handleKeyRelease(midiNote);
      });
      
      // タッチデバイス対応
      key.on('touchstart', (event) => {
        // console.log(`📱 Black key touch: ${midiNote}`);
        event.stopPropagation();
        this.handleKeyPress(midiNote);
      });
      
      key.on('touchend', (event) => {
        // console.log(`📱 Black key touch end: ${midiNote}`);
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
   * MIDIノート番号から音名を取得（白鍵のみ、オクターブ番号なし）
   */
  private getMidiNoteName(midiNote: number, forNoteSprite: boolean = false): string {
    // 選択された表示スタイルを取得
    const style = forNoteSprite ? this.settings.noteNoteNameStyle : this.settings.keyboardNoteNameStyle;
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
    
    // デバッグ情報（コメントアウト済み）
    // console.log(`🎹 Black key position calculated:`, {
    //   note,
    //   noteName: this.getMidiNoteName(note),
    //   prevWhiteNote,
    //   nextWhiteNote,
    //   prevWhiteKeyIndex,
    //   nextWhiteKeyIndex,
    //   whiteKeyWidth,
    //   prevKeyCenter,
    //   nextKeyCenter,
    //   finalPosition: centerPosition
    // });
    
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
    const noteName = this.getMidiNoteName(midiNote, true);
    
    // console.log(`🎨 Highlighting ${isBlackKey ? 'BLACK' : 'WHITE'} key: ${midiNote} (${noteName}) - ${active ? 'ON' : 'OFF'}`, {
    //   keySprite: keySprite,
    //   isBlackKey,
    //   activeKeyColor: `0x${this.settings.colors.activeKey.toString(16)}`,
    //   highlightedKeys: Array.from(this.highlightedKeys)
    // });
    
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
      // console.log(`🎨 Drawing highlighted black key with color: 0x${this.settings.colors.activeKey.toString(16)}`);
      
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
   * ノーツ表示の更新
   */
  updateNotes(activeNotes: ActiveNote[], currentTime?: number): void {
    const currentNoteIds = new Set(activeNotes.map(note => note.id));
    
    // 古いノーツを削除
    for (const [noteId] of this.noteSprites) {
      if (!currentNoteIds.has(noteId)) {
        this.removeNoteSprite(noteId);
      }
    }
    
    // ノーツを更新または作成
    for (const note of activeNotes) {
      const existingSprite = this.noteSprites.get(note.id);
      
      if (existingSprite) {
        this.updateNoteSprite(existingSprite, note, currentTime);
      } else {
        this.createNoteSprite(note);
      }
    }
  }
  
  private createNoteSprite(note: ActiveNote): void {
    const effectivePitch = note.pitch + this.settings.transpose;
    const x = this.pitchToX(note.pitch);
    const y = this.calculateNoteY(note);
    
    // メインノートスプライト
    const sprite = new PIXI.Graphics();
    this.drawNoteShape(sprite, note.state, note.pitch);
    sprite.x = x;
    sprite.y = y;
    
    // 音名ラベル
    let label: PIXI.Text | undefined;
    const noteNameForLabel = this.getMidiNoteName(effectivePitch, true);
    if (noteNameForLabel) {
      label = new PIXI.Text(noteNameForLabel, {
        fontSize: 10,
        fill: 0xFFFFFF,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        align: 'center',
        stroke: 0x000000,
        strokeThickness: 2
      });
      label.anchor.set(0.5, 1);
      label.x = 0; // relative to sprite
      label.y = -8; // fixed offset above thin note
      sprite.addChild(label);
    }
    
    // グロー効果スプライト
    let glowSprite: PIXI.Graphics | undefined;
    if (this.settings.effects.glow) {
      glowSprite = new PIXI.Graphics();
      this.drawGlowShape(glowSprite, note.state, note.pitch);
      glowSprite.x = x;
      glowSprite.y = y;
      this.notesContainer.addChild(glowSprite);
    }
    
    this.notesContainer.addChild(sprite);
    
    const noteSprite: NoteSprite = {
      sprite,
      glowSprite,
      noteData: note,
      label
    };
    
    this.noteSprites.set(note.id, noteSprite);
  }
  
  private updateNoteSprite(noteSprite: NoteSprite, note: ActiveNote, currentTime?: number): void {
    const effectivePitch = note.pitch + this.settings.transpose;
    const x = this.pitchToX(note.pitch);
    const y = this.calculateNoteY(note);
    
    // **完璧な同期のために線形補間を無効化**
    // ダイレクトな位置更新でフレーム遅延を排除
    noteSprite.sprite.x = x;
    noteSprite.sprite.y = y;
    
    if (noteSprite.glowSprite) {
      noteSprite.glowSprite.x = x;
      noteSprite.glowSprite.y = y;
    }

    // ラベル位置更新
    if (noteSprite.label) {
      noteSprite.label.x = 0;
      noteSprite.label.y = -8;
    }

    // ==== 判定ライン通過時のピアノキー点灯（デバッグ用） ====
    // GameEngine 側で crossingLogged が true になったフレームでハイライトを発火
    if (note.crossingLogged && !noteSprite.noteData.crossingLogged) {
      // ピアノキーを短時間ハイライト
      this.highlightKey(effectivePitch, true);
      setTimeout(() => {
        this.highlightKey(effectivePitch, false);
      }, 150);
    }

    // タイミング同期デバッグ（判定ライン付近のみ）
    if (currentTime !== undefined && note.time !== undefined) {
      const timeToHit = note.time - currentTime;
      const hitLineY = this.settings.hitLineY;
      
      if (Math.abs(y - hitLineY) < 20 && Math.abs(timeToHit) < 0.1) {
        console.log(`🎯 ノーツ同期: pitch=${note.pitch}, timeToHit=${timeToHit.toFixed(3)}s, y=${y.toFixed(1)}px, hitLineY=${hitLineY}px`);
      }
    }
    
    // 状態変更チェック
    if (noteSprite.noteData.state !== note.state) {
      this.drawNoteShape(noteSprite.sprite, note.state, note.pitch);
      if (noteSprite.glowSprite) {
        this.drawGlowShape(noteSprite.glowSprite, note.state, note.pitch);
      }
      
      // ヒット/ミス時のエフェクト
      if (note.state === 'hit' || note.state === 'missed') {
        this.createHitEffect(x, noteSprite.sprite.y, note.state, note.timingError ? 'good' : 'perfect');
      }
    }
    
    noteSprite.noteData = note;
  }
  
  private removeNoteSprite(noteId: string): void {
    const noteSprite = this.noteSprites.get(noteId);
    if (!noteSprite) return;
    
    this.notesContainer.removeChild(noteSprite.sprite);
    noteSprite.sprite.destroy();
    
    if (noteSprite.glowSprite) {
      this.notesContainer.removeChild(noteSprite.glowSprite);
      noteSprite.glowSprite.destroy();
    }

    if (noteSprite.label) {
      noteSprite.label.destroy();
    }
    
    this.noteSprites.delete(noteId);
  }
  
  private drawNoteShape(graphics: PIXI.Graphics, state: ActiveNote['state'], pitch?: number): void {
    graphics.clear();
    
    const { noteWidth, noteHeight } = this.settings;
    
    // より美しいグラデーション効果を再現
    if (state === 'visible') {
      // 黒鍵判定
      const isBlackNote = pitch !== undefined && this.isBlackKey(pitch + this.settings.transpose);
      
      if (isBlackNote) {
        // 黒鍵ノーツ（紫系のグラデーション）
        const steps = 8;
        const stepHeight = noteHeight / steps;
        
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
            -noteWidth / 2,
            -noteHeight / 2 + i * stepHeight,
            noteWidth,
            stepHeight + 1,
            i === 0 ? 4 : 0
          );
          graphics.endFill();
        }
        
        // 紫のハイライト効果
        graphics.beginFill(0x9333EA, 0.4);
        graphics.drawRoundedRect(
          -noteWidth / 2,
          -noteHeight / 2,
          noteWidth,
          noteHeight / 3,
          4
        );
        graphics.endFill();
        
        // 紫の輪郭線
        graphics.lineStyle(1, 0x8B5CF6, 0.8);
        graphics.drawRoundedRect(-noteWidth / 2, -noteHeight / 2, noteWidth, noteHeight, 4);
      } else {
        // 白鍵ノーツ（青系のグラデーション）
        const steps = 8;
        const stepHeight = noteHeight / steps;
        
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
            -noteWidth / 2,
            -noteHeight / 2 + i * stepHeight,
            noteWidth,
            stepHeight + 1,
            i === 0 ? 4 : 0
          );
          graphics.endFill();
        }
        
        // 青のハイライト効果
        graphics.beginFill(0x667EEA, 0.3);
        graphics.drawRoundedRect(
          -noteWidth / 2,
          -noteHeight / 2,
          noteWidth,
          noteHeight / 3,
          4
        );
        graphics.endFill();
        
        // 青の輪郭線
        graphics.lineStyle(1, 0x4F46E5, 0.8);
        graphics.drawRoundedRect(-noteWidth / 2, -noteHeight / 2, noteWidth, noteHeight, 4);
      }
    } else {
      const color = this.getStateColor(state);
      graphics.beginFill(color);
      graphics.drawRoundedRect(-noteWidth / 2, -noteHeight / 2, noteWidth, noteHeight, 4);
      graphics.endFill();
      
      // 輪郭線
      graphics.lineStyle(1, color, 0.8);
      graphics.drawRoundedRect(-noteWidth / 2, -noteHeight / 2, noteWidth, noteHeight, 4);
    }
  }
  
  private drawGlowShape(graphics: PIXI.Graphics, state: ActiveNote['state'], pitch?: number): void {
    graphics.clear();
    
    const color = this.getStateColor(state, pitch);
    const { noteWidth, noteHeight } = this.settings;
    
    // グロー効果（半透明の大きな矩形）
    graphics.beginFill(color, 0.3);
    graphics.drawRoundedRect(
      -noteWidth / 2 - 4,
      -noteHeight / 2 - 4,
      noteWidth + 8,
      noteHeight + 8,
      6
    );
    graphics.endFill();
  }
  
  private createHitEffect(x: number, y: number, state: 'hit' | 'missed', judgment?: string): void {
    if (!this.settings.effects.particles) return;
    
    const isHit = state === 'hit';
    const particleCount = isHit ? 20 : 10;
    const baseColor = isHit ? this.settings.colors.hit : this.settings.colors.missed;
    
    // パーティクル生成
    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics();
      
      // パーティクルの色（判定に応じて）
      let particleColor = baseColor;
      if (judgment === 'perfect') particleColor = this.settings.colors.perfect;
      else if (judgment === 'good') particleColor = this.settings.colors.good;
      
      particle.beginFill(particleColor);
      particle.drawCircle(0, 0, Math.random() * 3 + 1);
      particle.endFill();
      
      particle.x = x + (Math.random() - 0.5) * 20;
      particle.y = y + (Math.random() - 0.5) * 20;
      
      // アニメーション
      const velocity = {
        x: (Math.random() - 0.5) * 100,
        y: Math.random() * -50 - 25
      };
      
      this.particles.addChild(particle);
      
      // フェードアウトアニメーション
      const startTime = Date.now();
      const animateParticle = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / 1000; // 1秒間
        
        if (progress >= 1) {
          this.particles.removeChild(particle);
          particle.destroy();
          return;
        }
        
        particle.x += velocity.x * 0.016; // 60fps想定
        particle.y += velocity.y * 0.016;
        particle.alpha = 1 - progress;
        velocity.y += 200 * 0.016; // 重力
        
        requestAnimationFrame(animateParticle);
      };
      
      requestAnimationFrame(animateParticle);
    }
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
    // 破棄後に呼ばれた場合の安全ガード
    // this.app.renderer は destroy() 後にプロパティが undefined になるためチェック
    if (!this.app || (this.app as any)._destroyed || !this.app.screen) {
      console.warn('PIXINotesRendererInstance.updateSettings: renderer already destroyed, skipping');
      return;
    }

    const prevPianoHeight = this.settings.pianoHeight;
    const prevTranspose = this.settings.transpose;
    this.settings = { ...this.settings, ...newSettings };

    // ピアノ高さが変更された場合、判定ラインと背景を再配置
    if (newSettings.pianoHeight !== undefined && newSettings.pianoHeight !== prevPianoHeight) {
      // 新しい判定ラインYを計算
      this.settings.hitLineY = this.app.screen.height - this.settings.pianoHeight;

      // 既存のヒットラインを削除して再描画
      this.hitLineContainer.removeChildren();
      this.setupHitLine();

      // ==== 背景／ガイドラインを再生成 ====
      try {
        // 背景 (container の先頭)
        if (this.container.children.length > 0) {
          this.container.removeChildAt(0);
        }

        // ガイドライン (notesContainer の先頭)
        if (this.notesContainer.children.length > 0) {
          const first = this.notesContainer.getChildAt(0);
          if (first) {
            this.notesContainer.removeChild(first);
          }
        }
      } catch (err) {
        console.warn('背景再生成時にエラーが発生しました', err);
      }

      // 新しい背景とガイドラインを再作成
      this.createNotesAreaBackground();
    }

    // === transpose が変化した場合、既存ノートのラベル / カラーを更新 ===
    if (newSettings.transpose !== undefined && newSettings.transpose !== prevTranspose) {
      this.noteSprites.forEach((noteSprite) => {
        const pitch = noteSprite.noteData.pitch;
        const effectivePitch = pitch + this.settings.transpose;
        const noteName = this.getMidiNoteName(effectivePitch, true);

        // ----- ラベル更新 -----
        if (noteName) {
          if (noteSprite.label) {
            noteSprite.label.text = noteName;
          } else {
            // ラベルが無い場合は生成
            const label = new PIXI.Text(noteName, {
              fontSize: 10,
              fill: 0xFFFFFF,
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'bold',
              align: 'center',
              stroke: 0x000000,
              strokeThickness: 2
            });
            label.anchor.set(0.5, 1);
            label.x = 0;
            label.y = -8;
            noteSprite.sprite.addChild(label);
            noteSprite.label = label;
          }
        } else if (noteSprite.label) {
          // 表示スタイルが off の場合ラベルを削除
          noteSprite.sprite.removeChild(noteSprite.label);
          noteSprite.label.destroy();
          noteSprite.label = undefined;
        }

        // ----- カラー・形状更新 -----
        this.drawNoteShape(noteSprite.sprite, noteSprite.noteData.state, pitch);
        if (noteSprite.glowSprite) {
          this.drawGlowShape(noteSprite.glowSprite, noteSprite.noteData.state, pitch);
        }
      });
    }
  }
  
  /**
   * リサイズ対応
   */
  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
    this.settings.hitLineY = height - this.settings.pianoHeight;
    
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
      if (this.notesContainer.children.length > 0) {
        const first = this.notesContainer.getChildAt(0);
        if (first) {
          this.notesContainer.removeChild(first);
        }
      }
    } catch (err) {
      console.warn('resize 時の背景クリアに失敗', err);
    }

    this.createNotesAreaBackground();
  }
  
  /**
   * リソース解放
   */
  destroy(): void {
    this.noteSprites.clear();
    this.app.destroy(true, { children: true, texture: true, baseTexture: true });
  }
  
  /**
   * ピアノキー入力コールバックの設定
   */
  setKeyCallbacks(onKeyPress: (note: number) => void, onKeyRelease: (note: number) => void): void {
    console.log('🎹 Setting piano key callbacks');
    this.onKeyPress = onKeyPress;
    this.onKeyRelease = onKeyRelease;
    
    // コールバック設定の確認
    console.log('✅ Piano callbacks set:', {
      onKeyPress: typeof onKeyPress,
      onKeyRelease: typeof onKeyRelease
    });
  }

  /**
   * 内部キープレスハンドラー
   */
  private handleKeyPress(midiNote: number): void {
    // console.log(`🎵 Key press handled internally: ${midiNote}`);
    
    // ビジュアルフィードバック
    this.highlightKey(midiNote, true);
    
    // 外部コールバック呼び出し
    if (this.onKeyPress) {
      // console.log(`🔄 Calling external onKeyPress callback for note: ${midiNote}`);
      this.onKeyPress(midiNote);
    } else {
      console.warn(`⚠️ No onKeyPress callback set! Note: ${midiNote}`);
    }
  }
  
  /**
   * 内部キーリリースハンドラー
   */
  private handleKeyRelease(midiNote: number): void {
    // console.log(`🎵 Key release handled internally: ${midiNote}`);
    
    // 黒鍵は少し長めにハイライトを維持
    const isBlackKey = this.isBlackKey(midiNote);
    const highlightDuration = isBlackKey ? 200 : 150;
    
    setTimeout(() => {
      this.highlightKey(midiNote, false);
    }, highlightDuration);
    
    // 外部コールバック呼び出し
    if (this.onKeyRelease) {
      // console.log(`🔄 Calling external onKeyRelease callback for note: ${midiNote}`);
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