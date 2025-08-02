/**
 * リズムゲーム用PIXIレンダラー
 * 太鼓の達人風の横スクロール譜面を実装
 */

import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { useRhythmStore, type RhythmQuestion } from '@/stores/rhythmStore';
import { useTimeStore } from '@/stores/timeStore';
import { devLog } from '@/utils/logger';
import { cn } from '@/utils/cn';

export interface PIXIRhythmRendererProps {
  className?: string;
  width?: number;
  height?: number;
}

// レンダラー設定
const LANE_HEIGHT = 100;
const NOTE_SIZE = 60;
const JUDGE_LINE_X = 150; // 判定ライン位置
const SCROLL_SPEED = 0.5; // px/ms
const SPAWN_X = 1200; // ノーツ生成位置

// ノーツスプライトクラス
class RhythmNoteSprite {
  public sprite: PIXI.Container;
  public noteCircle: PIXI.Graphics;
  public chordText: PIXI.Text;
  
  constructor(
    public question: RhythmQuestion,
    private textures: Record<string, PIXI.Texture>
  ) {
    this.sprite = new PIXI.Container();
    
    // ノーツの円
    this.noteCircle = new PIXI.Graphics();
    this.noteCircle.beginFill(0xff6b6b);
    this.noteCircle.drawCircle(0, 0, NOTE_SIZE / 2);
    this.noteCircle.endFill();
    
    // コード名テキスト
    this.chordText = new PIXI.Text(question.chord, {
      fontFamily: 'Arial',
      fontSize: 24,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    this.chordText.anchor.set(0.5);
    
    this.sprite.addChild(this.noteCircle);
    this.sprite.addChild(this.chordText);
    
    // 初期位置
    this.sprite.x = SPAWN_X;
    this.sprite.y = LANE_HEIGHT / 2;
  }
  
  update(nowMs: number): void {
    if (this.sprite.destroyed) return;
    
    // 時間差から位置を計算
    const timeDiff = this.question.targetMs - nowMs;
    this.sprite.x = JUDGE_LINE_X + (timeDiff * SCROLL_SPEED);
    
    // 判定ライン付近で色を変える
    if (Math.abs(timeDiff) < 200) {
      this.noteCircle.tint = 0xffff00; // 黄色
    }
  }
  
  destroy(): void {
    if (!this.sprite.destroyed) {
      this.sprite.destroy({ children: true });
    }
  }
}

/**
 * リズムゲーム譜面レンダラー
 */
export const PIXIRhythmRenderer: React.FC<PIXIRhythmRendererProps> = ({
  className,
  width = 1200,
  height = 200,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const notesContainerRef = useRef<PIXI.Container | null>(null);
  const noteSpritesRef = useRef<Map<string, RhythmNoteSprite>>(new Map());
  const judgeLineRef = useRef<PIXI.Graphics | null>(null);
  
  const { questions, pointer } = useRhythmStore();
  const { startAt } = useTimeStore();
  
  // PIXI初期化
  useEffect(() => {
    if (!containerRef.current) return;
    
    // アプリケーション作成
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;
    
    // レーン背景
    const lane = new PIXI.Graphics();
    lane.beginFill(0x16213e, 0.5);
    lane.drawRect(0, 0, width, LANE_HEIGHT);
    lane.endFill();
    lane.y = (height - LANE_HEIGHT) / 2;
    app.stage.addChild(lane);
    
    // 判定ライン
    const judgeLine = new PIXI.Graphics();
    judgeLine.lineStyle(4, 0xffd93d);
    judgeLine.moveTo(JUDGE_LINE_X, lane.y);
    judgeLine.lineTo(JUDGE_LINE_X, lane.y + LANE_HEIGHT);
    app.stage.addChild(judgeLine);
    judgeLineRef.current = judgeLine;
    
    // ノーツコンテナ
    const notesContainer = new PIXI.Container();
    app.stage.addChild(notesContainer);
    notesContainerRef.current = notesContainer;
    
    devLog.debug('🎨 PIXIRhythmRenderer initialized');
    
    // クリーンアップ
    return () => {
      app.destroy(true, { children: true });
      if (containerRef.current?.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    };
  }, [width, height]);
  
  // ノーツ更新ループ
  useEffect(() => {
    if (!appRef.current || !notesContainerRef.current || !startAt) return;
    
    const app = appRef.current;
    const notesContainer = notesContainerRef.current;
    const noteSprites = noteSpritesRef.current;
    
    const updateNotes = () => {
      const now = Date.now();
      
      // 新しいノーツの生成
      questions.forEach((question) => {
        if (!noteSprites.has(question.id)) {
          const timeDiff = question.targetMs - now;
          // 3秒前から表示
          if (timeDiff < 3000 && timeDiff > -1000) {
            const noteSprite = new RhythmNoteSprite(question, {});
            notesContainer.addChild(noteSprite.sprite);
            noteSprites.set(question.id, noteSprite);
          }
        }
      });
      
      // 既存ノーツの更新と削除
      noteSprites.forEach((noteSprite, id) => {
        noteSprite.update(now);
        
        // 画面外に出たら削除
        if (noteSprite.sprite.x < -100) {
          noteSprite.destroy();
          noteSprites.delete(id);
        }
      });
    };
    
    // Tickerに登録
    app.ticker.add(updateNotes);
    
    return () => {
      app.ticker.remove(updateNotes);
      // 全ノーツクリーンアップ
      noteSprites.forEach(note => note.destroy());
      noteSprites.clear();
    };
  }, [questions, startAt]);
  
  // 判定エフェクト
  useEffect(() => {
    const currentQuestion = questions[pointer];
    if (!currentQuestion || !judgeLineRef.current) return;
    
    // 判定ライン点滅エフェクト
    const judgeLine = judgeLineRef.current;
    judgeLine.alpha = 1;
    const fadeOut = setInterval(() => {
      judgeLine.alpha *= 0.95;
      if (judgeLine.alpha < 0.5) {
        judgeLine.alpha = 0.5;
        clearInterval(fadeOut);
      }
    }, 16);
    
    return () => clearInterval(fadeOut);
  }, [pointer, questions]);
  
  return (
    <div
      ref={containerRef}
      className={cn('rhythm-renderer', className)}
      style={{ width, height }}
    />
  );
};

// 型定義エクスポート
export type PIXIRhythmInstance = {
  destroy: () => void;
};