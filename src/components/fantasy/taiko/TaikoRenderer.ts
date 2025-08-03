/**
 * TaikoRenderer
 * 太鼓の達人風UIのレンダリング
 */

import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import type { TaikoNote } from '@/types/taiko';
import { devLog } from '@/utils/logger';

interface NoteSprite {
  container: PIXI.Container;
  circle: PIXI.Graphics;
  text: PIXI.Text;
  note: TaikoNote;
  tween?: gsap.core.Tween;
}

export class TaikoRenderer {
  private container: PIXI.Container;
  private taikoLayer: PIXI.Container;
  private judgeLine: PIXI.Graphics;
  private notePool: NoteSprite[] = [];
  private activeNotes: Map<string, NoteSprite> = new Map();
  private judgeLineX = 80; // 判定ラインのX座標
  private noteRadius = 40; // ノーツの半径
  private noteSpeed = 400; // ピクセル/秒
  private stageWidth = 800;
  private startTimeMs: number = 0;

  constructor(parentContainer: PIXI.Container, stageWidth: number) {
    this.container = parentContainer;
    this.stageWidth = stageWidth;
    
    // 太鼓レイヤーを作成（モンスターの手前に表示）
    this.taikoLayer = new PIXI.Container();
    this.taikoLayer.zIndex = 10; // モンスターより前
    this.container.addChild(this.taikoLayer);

    // 判定ラインを作成
    this.judgeLine = this.createJudgeLine();
    this.taikoLayer.addChild(this.judgeLine);
  }

  /**
   * 判定ラインの作成
   */
  private createJudgeLine(): PIXI.Graphics {
    const graphics = new PIXI.Graphics();
    
    // 外側の円（白）
    graphics.beginFill(0xffffff, 0.8);
    graphics.drawCircle(0, 0, this.noteRadius + 5);
    graphics.endFill();
    
    // 内側の円（赤）
    graphics.beginFill(0xff0000, 0.9);
    graphics.drawCircle(0, 0, this.noteRadius);
    graphics.endFill();
    
    // 中心の十字
    graphics.lineStyle(3, 0xffffff);
    graphics.moveTo(-20, 0);
    graphics.lineTo(20, 0);
    graphics.moveTo(0, -20);
    graphics.lineTo(0, 20);
    
    graphics.position.set(this.judgeLineX, 300); // 画面中央の高さ
    
    return graphics;
  }

  /**
   * ノーツスプライトの作成（オブジェクトプール用）
   */
  private createNoteSprite(): NoteSprite {
    const container = new PIXI.Container();
    
    // ノーツの円
    const circle = new PIXI.Graphics();
    circle.beginFill(0x4169e1, 0.7); // 青色、半透明
    circle.lineStyle(3, 0xffffff);
    circle.drawCircle(0, 0, this.noteRadius);
    circle.endFill();
    
    // コード名のテキスト
    const text = new PIXI.Text('', {
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold' as any,
      fill: 0xffffff,
      align: 'center'
    });
    text.anchor.set(0.5);
    
    container.addChild(circle);
    container.addChild(text);
    container.position.y = 300; // 判定ラインと同じ高さ
    
    return {
      container,
      circle,
      text,
      note: null as any
    };
  }

  /**
   * オブジェクトプールからノーツを取得
   */
  private getNoteFromPool(): NoteSprite {
    let noteSprite = this.notePool.pop();
    if (!noteSprite) {
      noteSprite = this.createNoteSprite();
    }
    return noteSprite;
  }

  /**
   * ノーツをプールに返却
   */
  private returnToPool(noteSprite: NoteSprite) {
    if (noteSprite.tween) {
      noteSprite.tween.kill();
      noteSprite.tween = undefined;
    }
    noteSprite.container.visible = false;
    this.notePool.push(noteSprite);
  }

  /**
   * ゲーム開始時刻を設定
   */
  setStartTime(startTimeMs: number) {
    this.startTimeMs = startTimeMs;
  }

  /**
   * ノーツをスケジュール
   */
  scheduleNote(note: TaikoNote, currentTimeMs: number) {
    // すでにアクティブな場合はスキップ
    if (this.activeNotes.has(note.id)) {
      return;
    }

    const noteSprite = this.getNoteFromPool();
    noteSprite.note = note;
    noteSprite.text.text = note.displayName;
    
    // 初期位置を画面右端外に設定
    const startX = this.stageWidth + 100;
    noteSprite.container.position.x = startX;
    noteSprite.container.visible = true;
    
    // 判定タイミングまでの時間を計算
    const timeUntilJudge = note.absTimeMs - currentTimeMs;
    const duration = timeUntilJudge / 1000; // 秒に変換
    
    // アニメーション設定
    noteSprite.tween = gsap.to(noteSprite.container, {
      x: this.judgeLineX,
      duration: duration,
      ease: 'none',
      onComplete: () => {
        // 判定ラインに到達
        this.onNoteReachJudgeLine(noteSprite);
      }
    });
    
    this.taikoLayer.addChild(noteSprite.container);
    this.activeNotes.set(note.id, noteSprite);
    
    devLog.debug('Scheduled note:', {
      id: note.id,
      chord: note.displayName,
      timeUntilJudge,
      duration
    });
  }

  /**
   * ノーツが判定ラインに到達した時の処理
   */
  private onNoteReachJudgeLine(noteSprite: NoteSprite) {
    // 判定ウィンドウを過ぎたら自動的に削除
    setTimeout(() => {
      this.removeNote(noteSprite.note.id);
    }, 300); // +300ms後に削除
  }

  /**
   * ノーツを削除
   */
  removeNote(noteId: string) {
    const noteSprite = this.activeNotes.get(noteId);
    if (!noteSprite) return;

    this.taikoLayer.removeChild(noteSprite.container);
    this.activeNotes.delete(noteId);
    this.returnToPool(noteSprite);
  }

  /**
   * 判定エフェクトを表示
   */
  showJudgeEffect(type: 'good' | 'bad') {
    const effect = new PIXI.Text(
      type === 'good' ? 'GOOD!' : 'BAD',
      {
        fontFamily: 'Arial',
        fontSize: 48,
        fontWeight: 'bold' as any,
        fill: type === 'good' ? 0x00ff00 : 0xff0000,
        stroke: 0xffffff,
        strokeThickness: 4
      }
    );
    
    effect.anchor.set(0.5);
    effect.position.set(this.judgeLineX, 200);
    this.taikoLayer.addChild(effect);
    
    // エフェクトアニメーション
    gsap.to(effect, {
      y: 150,
      alpha: 0,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => {
        this.taikoLayer.removeChild(effect);
        effect.destroy();
      }
    });
  }

  /**
   * 現在の時刻を更新してノーツを管理
   */
  update(currentTimeMs: number) {
    // 画面外に出たノーツを削除
    this.activeNotes.forEach((noteSprite, noteId) => {
      if (noteSprite.container.x < -100) {
        this.removeNote(noteId);
      }
    });
  }

  /**
   * クリーンアップ
   */
  destroy() {
    // すべてのアクティブノーツを削除
    this.activeNotes.forEach((_, noteId) => {
      this.removeNote(noteId);
    });
    
    // 判定ラインを削除
    if (this.judgeLine) {
      this.taikoLayer.removeChild(this.judgeLine);
      this.judgeLine.destroy();
    }
    
    // レイヤーを削除
    if (this.container && this.taikoLayer) {
      this.container.removeChild(this.taikoLayer);
      this.taikoLayer.destroy();
    }
    
    // オブジェクトプールをクリア
    this.notePool.forEach(noteSprite => {
      noteSprite.container.destroy();
    });
    this.notePool = [];
  }
}