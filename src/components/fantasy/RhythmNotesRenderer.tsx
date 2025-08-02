import * as PIXI from 'pixi.js';
import { RhythmNote } from '@/types';

export class RhythmNotesRenderer {
  private app: PIXI.Application;
  private notesContainer: PIXI.Container;
  private judgmentLine: PIXI.Graphics;
  private effectsContainer: PIXI.Container;
  private noteSprites: Map<string, PIXI.Container>;
  
  // 設定値
  private readonly LANE_HEIGHT = 120;
  private readonly JUDGMENT_LINE_X = 100; // 判定ライン位置
  private readonly NOTES_SPEED_PX_PER_SEC = 300; // ノーツ速度
  private readonly LOOKAHEAD_SECONDS = 3; // 先読み時間
  
  constructor(width: number, height: number) {
    this.app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    this.noteSprites = new Map();
    this.setupContainers();
    this.setupJudgmentLine();
  }
  
  private setupContainers(): void {
    // ノーツコンテナ
    this.notesContainer = new PIXI.Container();
    this.notesContainer.sortableChildren = true;
    this.app.stage.addChild(this.notesContainer);
    
    // エフェクトコンテナ（最前面）
    this.effectsContainer = new PIXI.Container();
    this.app.stage.addChild(this.effectsContainer);
  }
  
  private setupJudgmentLine(): void {
    this.judgmentLine = new PIXI.Graphics();
    
    // 判定エリアのハイライト
    this.judgmentLine.beginFill(0xff4757, 0.2);
    this.judgmentLine.drawRect(this.JUDGMENT_LINE_X - 30, 0, 60, this.LANE_HEIGHT);
    this.judgmentLine.endFill();
    
    // 判定ライン本体
    this.judgmentLine.lineStyle(4, 0xff4757);
    this.judgmentLine.moveTo(this.JUDGMENT_LINE_X, 0);
    this.judgmentLine.lineTo(this.JUDGMENT_LINE_X, this.LANE_HEIGHT);
    
    this.app.stage.addChild(this.judgmentLine);
  }
  
  updateNotes(notes: RhythmNote[], currentTime: number): void {
    // 表示対象ノーツをフィルタリング
    const visibleNotes = notes.filter(note => 
      this.shouldDisplayNote(note, currentTime)
    );
    
    // 既存の非表示ノーツを削除
    const visibleIds = new Set(visibleNotes.map(n => n.id));
    this.noteSprites.forEach((sprite, id) => {
      if (!visibleIds.has(id)) {
        this.notesContainer.removeChild(sprite);
        sprite.destroy();
        this.noteSprites.delete(id);
      }
    });
    
    // ノーツの更新・作成
    visibleNotes.forEach(note => {
      let noteSprite = this.noteSprites.get(note.id);
      
      if (!noteSprite) {
        // 新規ノーツ作成
        noteSprite = this.createNoteSprite(note);
        this.notesContainer.addChild(noteSprite);
        this.noteSprites.set(note.id, noteSprite);
      }
      
      // 位置更新
      const x = this.calculateNoteX(note, currentTime);
      noteSprite.x = x;
      noteSprite.y = this.LANE_HEIGHT / 2;
      
      // ノーツの状態に応じてエフェクト適用
      this.applyNoteEffects(noteSprite, note, currentTime);
    });
  }
  
  private createNoteSprite(note: RhythmNote): PIXI.Container {
    const container = new PIXI.Container();
    
    // ノーツ円形ベース
    const circle = new PIXI.Graphics();
    const color = this.getChordColor(note.chord);
    
    circle.beginFill(color);
    circle.drawCircle(0, 0, 25);
    circle.endFill();
    
    // 外枠
    circle.lineStyle(3, 0xffffff, 0.8);
    circle.drawCircle(0, 0, 25);
    
    container.addChild(circle);
    
    // コード名テキスト
    const text = new PIXI.Text(note.chord, {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff,
      fontWeight: 'bold'
    });
    text.anchor.set(0.5);
    container.addChild(text);
    
    return container;
  }
  
  private calculateNoteX(note: RhythmNote, currentTime: number): number {
    const timeToTarget = note.targetTime - currentTime;
    return this.JUDGMENT_LINE_X + (timeToTarget * this.NOTES_SPEED_PX_PER_SEC);
  }
  
  private shouldDisplayNote(note: RhythmNote, currentTime: number): boolean {
    if (note.status === 'hit' || note.status === 'missed') {
      return false;
    }
    
    const timeToTarget = note.targetTime - currentTime;
    return timeToTarget >= -0.5 && timeToTarget <= this.LOOKAHEAD_SECONDS;
  }
  
  private getChordColor(chord: string): number {
    // メジャーコード: 赤
    if (chord.match(/^[A-G](?!m|dim|aug|sus|7|9|11|13)/)) {
      return 0xff6b6b;
    }
    // マイナーコード: 青
    if (chord.includes('m') && !chord.includes('maj')) {
      return 0x4ecdc4;
    }
    // セブンスコード: 黄
    if (chord.includes('7')) {
      return 0xffe66d;
    }
    // その他: 緑
    return 0x95e1d3;
  }
  
  private applyNoteEffects(noteSprite: PIXI.Container, note: RhythmNote, currentTime: number): void {
    const timeToTarget = note.targetTime - currentTime;
    
    // 判定ライン接近時のパルスエフェクト
    if (Math.abs(timeToTarget) < 0.5 && note.status === 'active') {
      const scale = 1 + Math.sin(currentTime * 10) * 0.1;
      noteSprite.scale.set(scale);
    } else {
      noteSprite.scale.set(1);
    }
    
    // 透明度調整
    if (timeToTarget > 2) {
      noteSprite.alpha = 0.5 + (3 - timeToTarget) * 0.5;
    } else {
      noteSprite.alpha = 1;
    }
  }
  
  // ヒットエフェクト
  triggerHitEffect(x: number, y: number, rank: 'perfect' | 'good'): void {
    // エフェクトコンテナ
    const effectContainer = new PIXI.Container();
    effectContainer.x = x || this.JUDGMENT_LINE_X;
    effectContainer.y = y || this.LANE_HEIGHT / 2;
    
    // リング状のエフェクト
    const ring = new PIXI.Graphics();
    const color = rank === 'perfect' ? 0xffd700 : 0x00ff00;
    
    ring.lineStyle(4, color, 0.8);
    ring.drawCircle(0, 0, 25);
    effectContainer.addChild(ring);
    
    // テキスト表示
    const text = new PIXI.Text(rank.toUpperCase(), {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: color,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 4
    });
    text.anchor.set(0.5);
    text.y = -50;
    effectContainer.addChild(text);
    
    this.effectsContainer.addChild(effectContainer);
    
    // アニメーション
    let scale = 1;
    let textY = -50;
    const animate = () => {
      scale += 0.1;
      ring.scale.set(scale);
      ring.alpha -= 0.05;
      
      textY -= 2;
      text.y = textY;
      text.alpha -= 0.03;
      
      if (ring.alpha > 0) {
        requestAnimationFrame(animate);
      } else {
        this.effectsContainer.removeChild(effectContainer);
        effectContainer.destroy();
      }
    };
    animate();
  }
  
  // ミスエフェクト
  triggerMissEffect(x: number, y: number): void {
    const effectContainer = new PIXI.Container();
    effectContainer.x = x || this.JUDGMENT_LINE_X;
    effectContainer.y = y || this.LANE_HEIGHT / 2;
    
    // ✕マーク
    const cross = new PIXI.Graphics();
    cross.lineStyle(4, 0xff4444, 0.8);
    cross.moveTo(-15, -15);
    cross.lineTo(15, 15);
    cross.moveTo(15, -15);
    cross.lineTo(-15, 15);
    effectContainer.addChild(cross);
    
    // MISS テキスト
    const text = new PIXI.Text('MISS', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0xff4444,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 4
    });
    text.anchor.set(0.5);
    text.y = -40;
    effectContainer.addChild(text);
    
    this.effectsContainer.addChild(effectContainer);
    
    // アニメーション
    let alpha = 1;
    const animate = () => {
      alpha -= 0.03;
      effectContainer.alpha = alpha;
      effectContainer.y += 0.5;
      
      if (alpha > 0) {
        requestAnimationFrame(animate);
      } else {
        this.effectsContainer.removeChild(effectContainer);
        effectContainer.destroy();
      }
    };
    animate();
  }
  
  getCanvas(): HTMLCanvasElement {
    return this.app.view as HTMLCanvasElement;
  }
  
  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }
  
  destroy(): void {
    this.noteSprites.forEach(sprite => sprite.destroy());
    this.noteSprites.clear();
    this.app.destroy();
  }
}