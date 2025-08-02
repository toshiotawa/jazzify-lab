/**
 * リズムノーツレンダラー
 * 太鼓の達人スタイルのノーツ表示を担当
 */

import React, { useRef, useEffect, useCallback } from 'react';
import * as PIXI from 'pixi.js';

import type { RhythmNote } from '@/stores/rhythmStore';

interface RhythmNotesRendererProps {
  pendingNotes: RhythmNote[];
  containerWidth: number;
  containerHeight: number;
  bpm: number;
  timeSignature: number;
  startAt: number | null;
  isCountIn?: boolean;
  currentChord: { id: string; displayName: string } | null;
  windowStart: number;
  windowEnd: number;
}

const RhythmNotesRenderer: React.FC<RhythmNotesRendererProps> = ({
  pendingNotes,
  containerWidth,
  containerHeight,
  bpm,
  timeSignature,
  startAt,
  isCountIn: _isCountIn,
  currentChord,
  windowStart,
  windowEnd
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const notesContainerRef = useRef<PIXI.Container | null>(null);
  const noteSpritesRef = useRef<Map<string, PIXI.Container>>(new Map());
  
  // 定数
  const HITLINE_X = containerWidth * 0.2; // 左から20%の位置
  const NOTE_SPEED = 300; // pixels per second
  const NOTE_WIDTH = 100;
  const NOTE_HEIGHT = 60;
  const TRACK_Y = containerHeight / 2;
  
  // PIXI初期化
  useEffect(() => {
    if (!containerRef.current) return;
    
    // アプリケーション作成
    const app = new PIXI.Application({
      width: containerWidth,
      height: containerHeight,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;
    
    // コンテナ作成
    const notesContainer = new PIXI.Container();
    app.stage.addChild(notesContainer);
    notesContainerRef.current = notesContainer;
    
    // 背景トラック描画
    const track = new PIXI.Graphics();
    track.beginFill(0x2d2d44, 0.8);
    track.drawRect(0, TRACK_Y - 40, containerWidth, 80);
    track.endFill();
    app.stage.addChild(track);
    
    // ヒットライン描画
    const hitLine = new PIXI.Graphics();
    hitLine.lineStyle(4, 0xff6b6b, 1);
    hitLine.moveTo(HITLINE_X, TRACK_Y - 50);
    hitLine.lineTo(HITLINE_X, TRACK_Y + 50);
    
    // ヒットゾーン（判定ウィンドウの可視化）
    const hitZone = new PIXI.Graphics();
    hitZone.beginFill(0x4ecdc4, 0.2);
    hitZone.drawRect(HITLINE_X - 20, TRACK_Y - 40, 40, 80);
    hitZone.endFill();
    
    app.stage.addChild(hitZone);
    app.stage.addChild(hitLine);
    
    // 判定ライン装飾
    const hitLineDecor = new PIXI.Graphics();
    hitLineDecor.beginFill(0xff6b6b);
    hitLineDecor.drawCircle(HITLINE_X, TRACK_Y - 50, 8);
    hitLineDecor.drawCircle(HITLINE_X, TRACK_Y + 50, 8);
    hitLineDecor.endFill();
    app.stage.addChild(hitLineDecor);
    
    // クリーンアップ
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
      if (containerRef.current && containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    };
  }, [containerWidth, containerHeight]);
  
  // ノーツ作成
  const createNoteSprite = useCallback((note: RhythmNote): PIXI.Container => {
    const container = new PIXI.Container();
    
    // ノーツ本体
    const noteBody = new PIXI.Graphics();
    noteBody.beginFill(0x4ecdc4);
    noteBody.drawRoundedRect(-NOTE_WIDTH/2, -NOTE_HEIGHT/2, NOTE_WIDTH, NOTE_HEIGHT, 15);
    noteBody.endFill();
    
    // ノーツの輪郭
    noteBody.lineStyle(3, 0x45b7b8);
    noteBody.drawRoundedRect(-NOTE_WIDTH/2, -NOTE_HEIGHT/2, NOTE_WIDTH, NOTE_HEIGHT, 15);
    
    container.addChild(noteBody);
    
    // コード名表示
    const text = new PIXI.Text(note.chord.displayName, {
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xffffff,
      align: 'center'
    });
    text.anchor.set(0.5);
    text.position.set(0, 0);
    container.addChild(text);
    
    // 小節・拍情報（デバッグ用）
    if (process.env.NODE_ENV === 'development') {
      const debugText = new PIXI.Text(`${note.measure}:${note.beat}`, {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xcccccc
      });
      debugText.anchor.set(0.5);
      debugText.position.set(0, -35);
      container.addChild(debugText);
    }
    
    return container;
  }, []);
  
  // ノーツ更新
  useEffect(() => {
    if (!appRef.current || !notesContainerRef.current || !startAt) return;
    
    const app = appRef.current;
    const notesContainer = notesContainerRef.current;
    const noteSprites = noteSpritesRef.current;
    
    // アニメーションループ
    const ticker = (_delta: number) => {
      const now = performance.now();
      
      // 既存ノーツの更新
      pendingNotes.forEach(note => {
        let sprite = noteSprites.get(note.id);
        
        // 新規ノーツの作成
        if (!sprite) {
          sprite = createNoteSprite(note);
          sprite.y = TRACK_Y;
          notesContainer.addChild(sprite);
          noteSprites.set(note.id, sprite);
        }
        
        // 位置計算
        const timeToHit = (note.hitTime - now) / 1000; // seconds
        const x = HITLINE_X + (timeToHit * NOTE_SPEED);
        sprite.x = x;
        
        // 画面外に出たノーツを削除
        if (x < -NOTE_WIDTH) {
          notesContainer.removeChild(sprite);
          noteSprites.delete(note.id);
        }
        
        // 判定ウィンドウ内のノーツをハイライト
        if (now >= windowStart && now <= windowEnd && note.chord.id === currentChord?.id) {
          sprite.alpha = 1;
          sprite.scale.set(1.1);
        } else {
          sprite.alpha = 0.8;
          sprite.scale.set(1);
        }
      });
      
      // 削除されたノーツのスプライトを削除
      const pendingIds = new Set(pendingNotes.map(n => n.id));
      noteSprites.forEach((sprite, id) => {
        if (!pendingIds.has(id)) {
          notesContainer.removeChild(sprite);
          noteSprites.delete(id);
        }
      });
    };
    
    app.ticker.add(ticker);
    
    return () => {
      app.ticker.remove(ticker);
    };
  }, [pendingNotes, startAt, createNoteSprite, windowStart, windowEnd, currentChord, HITLINE_X, TRACK_Y]);
  
  // ビートインジケーター
  useEffect(() => {
    if (!appRef.current || !startAt) return;
    
    const app = appRef.current;
    const beatIndicators: PIXI.Graphics[] = [];
    
    // ビートマーカー作成
    const msPerBeat = 60000 / bpm;
    for (let i = 0; i < 4; i++) {
      const indicator = new PIXI.Graphics();
      indicator.beginFill(0xffd93d, 0.6);
      indicator.drawCircle(0, 0, 5);
      indicator.endFill();
      indicator.y = containerHeight - 20;
      app.stage.addChild(indicator);
      beatIndicators.push(indicator);
    }
    
    // ビートアニメーション
    const beatTicker = () => {
      const now = performance.now();
      const elapsed = now - startAt - 2000; // Ready 2秒を考慮
      if (elapsed < 0) return;
      
      const currentBeatTime = elapsed % msPerBeat;
      const beatProgress = currentBeatTime / msPerBeat;
      
      beatIndicators.forEach((indicator, i) => {
        const x = (containerWidth / 4) * (i + 0.5);
        indicator.x = x;
        
        // 現在のビートでパルス
        const currentBeatIndex = Math.floor(elapsed / msPerBeat) % timeSignature;
        if (i === currentBeatIndex) {
          indicator.scale.set(1 + beatProgress * 0.5);
          indicator.alpha = 1 - beatProgress * 0.5;
        } else {
          indicator.scale.set(1);
          indicator.alpha = 0.3;
        }
      });
    };
    
    app.ticker.add(beatTicker);
    
    return () => {
      app.ticker.remove(beatTicker);
      beatIndicators.forEach(indicator => {
        if (indicator.parent) {
          indicator.parent.removeChild(indicator);
        }
      });
    };
  }, [bpm, timeSignature, startAt, containerWidth, containerHeight]);
  
  return (
    <div 
      ref={containerRef} 
      className="rhythm-notes-renderer"
      style={{ 
        width: containerWidth, 
        height: containerHeight,
        position: 'relative'
      }}
    />
  );
};

export default RhythmNotesRenderer;