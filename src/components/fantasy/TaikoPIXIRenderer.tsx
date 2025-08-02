/**
 * TaikoPIXIRenderer
 * 太鼓の達人風のノーツ表示UIをPIXI.jsで実装
 * プログレッションモード専用
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import { useTimeStore } from '@/stores/timeStore';
import { ChordDefinition } from './FantasyGameEngine';
import { devLog } from '@/utils/logger';

// 定数定義
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 200;
const JUDGMENT_LINE_X = 150; // 判定ラインのX座標
const NOTE_RADIUS = 40; // ノーツの半径
const NOTE_SPEED_BASE = 300; // 基準速度 (pixels per beat)
const NOTE_START_X = CANVAS_WIDTH + NOTE_RADIUS; // ノーツ開始位置
const NOTE_Y = CANVAS_HEIGHT / 2; // ノーツのY座標（中央）
const JUDGMENT_CIRCLE_RADIUS = 50; // 判定円の半径

// ノーツデータ型
interface NoteData {
  id: string;
  chord: ChordDefinition;
  targetBeat: number; // 判定タイミングのビート数
  targetMeasure: number; // 判定タイミングの小節数
  sprite: PIXI.Container;
  isJudged: boolean;
}

export interface TaikoPIXIRendererProps {
  onReady?: (instance: TaikoPIXIInstance) => void;
  currentChord?: ChordDefinition | null;
  nextChordTime?: number | null; // 次の出題時刻
  width?: number;
  height?: number;
}

export interface TaikoPIXIInstance {
  addNote: (chord: ChordDefinition, targetBeat: number, targetMeasure: number) => void;
  removeNote: (noteId: string) => void;
  clearAllNotes: () => void;
  judgeNote: (noteId: string, success: boolean) => void;
}

const TaikoPIXIRenderer: React.FC<TaikoPIXIRendererProps> = ({
  onReady,
  currentChord,
  nextChordTime,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const notesRef = useRef<Map<string, NoteData>>(new Map());
  const noteContainerRef = useRef<PIXI.Container | null>(null);
  const judgmentLineRef = useRef<PIXI.Graphics | null>(null);
  
  // timeStoreから現在の拍情報を取得
  const { bpm, currentBeat, currentMeasure, startAt, readyDuration, timeSignature, isCountIn } = useTimeStore();
  
  // ノーツの位置を計算
  const calculateNotePosition = useCallback((note: NoteData): number => {
    if (!startAt) return NOTE_START_X;
    
    const now = performance.now();
    const msecPerBeat = 60000 / bpm;
    const elapsedTime = now - startAt - readyDuration;
    
    // 現在の総ビート数を計算
    const currentTotalBeats = Math.floor(elapsedTime / msecPerBeat);
    
    // ノーツの目標総ビート数
    const targetTotalBeats = (note.targetMeasure - 1) * timeSignature + (note.targetBeat - 1);
    
    // 残りビート数
    const beatsUntilTarget = targetTotalBeats - currentTotalBeats;
    
    // 位置計算（3拍前から登場）
    const pixelsPerBeat = (NOTE_START_X - JUDGMENT_LINE_X) / 3; // 3拍でちょうど判定ラインに到達
    const x = JUDGMENT_LINE_X + (beatsUntilTarget * pixelsPerBeat);
    
    return x;
  }, [bpm, startAt, readyDuration, timeSignature]);
  
  // PIXI初期化
  useEffect(() => {
    if (!containerRef.current) return;
    
    // PIXIアプリケーション作成
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1
    });
    
    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;
    
    // ノーツコンテナ作成
    const noteContainer = new PIXI.Container();
    app.stage.addChild(noteContainer);
    noteContainerRef.current = noteContainer;
    
    // 背景の線を描画
    const bgLine = new PIXI.Graphics();
    bgLine.lineStyle(4, 0x444444, 1);
    bgLine.moveTo(0, NOTE_Y);
    bgLine.lineTo(width, NOTE_Y);
    app.stage.addChild(bgLine);
    
    // 判定ラインの円を描画
    const judgmentCircle = new PIXI.Graphics();
    judgmentCircle.lineStyle(4, 0xffd700, 1);
    judgmentCircle.drawCircle(JUDGMENT_LINE_X, NOTE_Y, JUDGMENT_CIRCLE_RADIUS);
    judgmentCircle.endFill();
    app.stage.addChild(judgmentCircle);
    judgmentLineRef.current = judgmentCircle;
    
    // 判定ラインテキスト
    const judgmentText = new PIXI.Text('JUST', {
      fontSize: 16,
      fill: 0xffd700,
      fontWeight: 'bold'
    });
    judgmentText.anchor.set(0.5);
    judgmentText.position.set(JUDGMENT_LINE_X, NOTE_Y + JUDGMENT_CIRCLE_RADIUS + 20);
    app.stage.addChild(judgmentText);
    
    // インスタンスメソッドの実装
    const instance: TaikoPIXIInstance = {
      addNote: (chord: ChordDefinition, targetBeat: number, targetMeasure: number) => {
        const noteId = `${chord.id}_${targetMeasure}_${targetBeat}_${Date.now()}`;
        
        // ノーツコンテナ作成
        const noteSprite = new PIXI.Container();
        
        // ノーツの円を描画
        const circle = new PIXI.Graphics();
        circle.beginFill(0xff6b6b, 1);
        circle.drawCircle(0, 0, NOTE_RADIUS);
        circle.endFill();
        noteSprite.addChild(circle);
        
        // コード名テキスト
        const text = new PIXI.Text(chord.displayName, {
          fontSize: 24,
          fill: 0xffffff,
          fontWeight: 'bold'
        });
        text.anchor.set(0.5);
        noteSprite.addChild(text);
        
        // 初期位置設定
        noteSprite.position.set(NOTE_START_X, NOTE_Y);
        noteContainer.addChild(noteSprite);
        
        // ノーツデータ保存
        const noteData: NoteData = {
          id: noteId,
          chord,
          targetBeat,
          targetMeasure,
          sprite: noteSprite,
          isJudged: false
        };
        notesRef.current.set(noteId, noteData);
        
        devLog.debug('🎵 ノーツ追加:', { noteId, chord: chord.displayName, targetBeat, targetMeasure });
      },
      
      removeNote: (noteId: string) => {
        const note = notesRef.current.get(noteId);
        if (note) {
          noteContainer.removeChild(note.sprite);
          notesRef.current.delete(noteId);
        }
      },
      
      clearAllNotes: () => {
        notesRef.current.forEach(note => {
          noteContainer.removeChild(note.sprite);
        });
        notesRef.current.clear();
      },
      
      judgeNote: (noteId: string, success: boolean) => {
        const note = notesRef.current.get(noteId);
        if (note && !note.isJudged) {
          note.isJudged = true;
          
          // 判定エフェクト
          const effect = new PIXI.Text(success ? 'GREAT!' : 'MISS', {
            fontSize: 32,
            fill: success ? 0x00ff00 : 0xff0000,
            fontWeight: 'bold'
          });
          effect.anchor.set(0.5);
          effect.position.set(JUDGMENT_LINE_X, NOTE_Y - 60);
          app.stage.addChild(effect);
          
          // エフェクトをフェードアウト
          let alpha = 1;
          const fadeOut = () => {
            alpha -= 0.05;
            effect.alpha = alpha;
            if (alpha > 0) {
              requestAnimationFrame(fadeOut);
            } else {
              app.stage.removeChild(effect);
            }
          };
          fadeOut();
          
          // ノーツを削除
          instance.removeNote(noteId);
        }
      }
    };
    
    // コールバック呼び出し
    if (onReady) {
      onReady(instance);
    }
    
    // アニメーションループ
    app.ticker.add(() => {
      // 各ノーツの位置を更新
      notesRef.current.forEach((note, noteId) => {
        const x = calculateNotePosition(note);
        note.sprite.position.x = x;
        
        // 画面外に出たノーツを削除
        if (x < -NOTE_RADIUS) {
          instance.removeNote(noteId);
        }
      });
    });
    
    // クリーンアップ
    return () => {
      app.destroy(true, { children: true, texture: true, baseTexture: true });
      if (containerRef.current && app.view) {
        containerRef.current.removeChild(app.view as HTMLCanvasElement);
      }
      appRef.current = null;
      notesRef.current.clear();
    };
  }, [width, height, onReady, calculateNotePosition]);
  
  return (
    <div 
      ref={containerRef} 
      className="taiko-pixi-container"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};

export default TaikoPIXIRenderer;
export type { TaikoPIXIInstance };