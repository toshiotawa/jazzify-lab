/**
 * リズムモード専用ノーツレンダラー
 * 太鼓の達人風の右から左に流れるノーツ表示
 */

import React, { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { RhythmNote } from '@/stores/rhythmStore';
import { devLog } from '@/utils/logger';

interface RhythmNotesRendererProps {
  width: number;
  height: number;
  notes: RhythmNote[];
  onReady?: () => void;
  className?: string;
}

// 定数
const HIT_LINE_X = 200; // ヒットラインのX座標（左から200px）
const NOTE_SPEED = 0.4; // ノーツの速度（px/ms）
const NOTE_RADIUS = 40; // ノーツの半径
const NOTE_HEIGHT = 100; // ノーツの表示Y座標

const RhythmNotesRenderer: React.FC<RhythmNotesRendererProps> = ({
  width,
  height,
  notes,
  onReady,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const notesContainerRef = useRef<PIXI.Container | null>(null);
  const noteSpriteMapRef = useRef<Map<string, PIXI.Container>>(new Map());

  // PIXIアプリケーションの初期化
  const initPixi = useCallback(async () => {
    if (!containerRef.current || appRef.current) return;

    try {
      // PIXIアプリケーション作成
      const app = new PIXI.Application({
        width,
        height,
        backgroundColor: 0x1a1a2e, // ダークな背景
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });

      containerRef.current.appendChild(app.view as HTMLCanvasElement);
      appRef.current = app;

      // ノーツコンテナ
      const notesContainer = new PIXI.Container();
      app.stage.addChild(notesContainer);
      notesContainerRef.current = notesContainer;

      // ヒットライン描画
      const hitLine = new PIXI.Graphics();
      hitLine.lineStyle(4, 0xFFFFFF, 0.8);
      hitLine.moveTo(HIT_LINE_X, 0);
      hitLine.lineTo(HIT_LINE_X, height);
      app.stage.addChild(hitLine);

      // 判定エリアの視覚化（デバッグ用）
      const judgmentArea = new PIXI.Graphics();
      judgmentArea.beginFill(0x00FF00, 0.1);
      judgmentArea.drawRect(HIT_LINE_X - 50, 0, 100, height);
      judgmentArea.endFill();
      app.stage.addChild(judgmentArea);

      devLog.debug('✅ リズムノーツレンダラー初期化完了');
      onReady?.();
    } catch (error) {
      console.error('❌ リズムノーツレンダラー初期化エラー:', error);
    }
  }, [width, height, onReady]);

  // ノーツの作成
  const createNoteSprite = useCallback((note: RhythmNote): PIXI.Container => {
    const container = new PIXI.Container();

    // ノーツの背景円
    const circle = new PIXI.Graphics();
    circle.beginFill(0xFF6B6B);
    circle.drawCircle(0, 0, NOTE_RADIUS);
    circle.endFill();
    container.addChild(circle);

    // コード名テキスト
    const text = new PIXI.Text(note.chord.displayName, {
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center'
    });
    text.anchor.set(0.5, 0.5);
    container.addChild(text);

    // 初期位置（画面右外）
    container.x = width + NOTE_RADIUS;
    container.y = NOTE_HEIGHT;

    return container;
  }, [width]);

  // ノーツの更新
  const updateNotes = useCallback(() => {
    if (!notesContainerRef.current || !appRef.current) return;

    const now = performance.now();

    // 新しいノーツの追加
    notes.forEach(note => {
      if (!noteSpriteMapRef.current.has(note.id)) {
        const sprite = createNoteSprite(note);
        notesContainerRef.current!.addChild(sprite);
        noteSpriteMapRef.current.set(note.id, sprite);
      }
    });

    // 削除されたノーツの除去
    const currentNoteIds = new Set(notes.map(n => n.id));
    noteSpriteMapRef.current.forEach((sprite, id) => {
      if (!currentNoteIds.has(id)) {
        notesContainerRef.current!.removeChild(sprite);
        sprite.destroy();
        noteSpriteMapRef.current.delete(id);
      }
    });

    // ノーツの位置更新
    notes.forEach(note => {
      const sprite = noteSpriteMapRef.current.get(note.id);
      if (!sprite) return;

      // ノーツが理想時刻にヒットラインに到達するように位置を計算
      const timeUntilHit = note.hitTime - now;
      const x = HIT_LINE_X + timeUntilHit * NOTE_SPEED;

      sprite.x = x;

      // 判定ウィンドウ内では色を変える
      if (Math.abs(timeUntilHit) <= 200) {
        const circle = sprite.children[0] as PIXI.Graphics;
        circle.clear();
        circle.beginFill(0xFFD93D); // 黄色
        circle.drawCircle(0, 0, NOTE_RADIUS);
        circle.endFill();
      }

      // 画面外に出たノーツは非表示
      sprite.visible = x > -NOTE_RADIUS && x < width + NOTE_RADIUS;
    });
  }, [notes, width, createNoteSprite]);

  // アニメーションループ
  useEffect(() => {
    if (!appRef.current) return;

    const ticker = appRef.current.ticker;
    ticker.add(updateNotes);

    return () => {
      ticker.remove(updateNotes);
    };
  }, [updateNotes]);

  // 初期化
  useEffect(() => {
    initPixi();

    return () => {
      if (appRef.current) {
        // すべてのノーツスプライトを破棄
        noteSpriteMapRef.current.forEach(sprite => {
          sprite.destroy();
        });
        noteSpriteMapRef.current.clear();

        // PIXIアプリケーションの破棄
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
        notesContainerRef.current = null;
      }
    };
  }, [initPixi]);

  // サイズ変更対応
  useEffect(() => {
    if (appRef.current) {
      appRef.current.renderer.resize(width, height);
    }
  }, [width, height]);

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ width, height }}
    />
  );
};

export default RhythmNotesRenderer;