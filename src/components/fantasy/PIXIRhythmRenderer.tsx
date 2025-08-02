import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { RhythmQuestion } from '@/types';
import { useTimeStore } from '@/stores/timeStore';
import { devLog } from '@/utils/logger';

interface PIXIRhythmRendererProps {
  width: number;
  height: number;
  questions: RhythmQuestion[];
  currentPointer: number;
  isReady: boolean;
}

const PIXIRhythmRenderer: React.FC<PIXIRhythmRendererProps> = ({
  width,
  height,
  questions,
  currentPointer,
  isReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const notesContainerRef = useRef<PIXI.Container | null>(null);
  const noteSpritesRef = useRef<Map<string, PIXI.Container>>(new Map());
  
  const { startAt, readyDuration } = useTimeStore();
  
  // PIXIアプリケーション初期化
  useEffect(() => {
    if (!containerRef.current) return;
    
    // アプリケーション作成
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });
    
    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;
    
    // ノーツコンテナ作成
    const notesContainer = new PIXI.Container();
    app.stage.addChild(notesContainer);
    notesContainerRef.current = notesContainer;
    
    // 判定ライン描画
    const judgeLine = new PIXI.Graphics();
    judgeLine.lineStyle(4, 0xffff00, 1);
    judgeLine.moveTo(100, 0);
    judgeLine.lineTo(100, height);
    app.stage.addChild(judgeLine);
    
    // 判定ライン上の円
    const judgeCircle = new PIXI.Graphics();
    judgeCircle.lineStyle(3, 0xffff00, 1);
    judgeCircle.drawCircle(100, height / 2, 30);
    app.stage.addChild(judgeCircle);
    
    // レーン背景
    const laneBg = new PIXI.Graphics();
    laneBg.beginFill(0x0f0f1e, 0.5);
    laneBg.drawRect(0, height / 2 - 40, width, 80);
    laneBg.endFill();
    app.stage.addChildAt(laneBg, 0);
    
    // アニメーションループ
    let animationId: number;
    const animate = () => {
      updateNotes();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    
    // クリーンアップ
    return () => {
      cancelAnimationFrame(animationId);
      app.destroy(true, { children: true });
      appRef.current = null;
      notesContainerRef.current = null;
      noteSpritesRef.current.clear();
    };
  }, [width, height]);
  
  // ノーツ更新
  const updateNotes = () => {
    if (!notesContainerRef.current || !startAt || isReady) return;
    
    const nowMs = performance.now() - startAt - readyDuration;
    const scrollSpeed = 0.5; // px per ms
    const judgeLineX = 100;
    
    // 既存のノーツを更新・削除
    noteSpritesRef.current.forEach((sprite, id) => {
      const question = questions.find(q => q.id === id);
      if (!question) {
        // 問題が見つからない場合は削除
        notesContainerRef.current?.removeChild(sprite);
        noteSpritesRef.current.delete(id);
        return;
      }
      
      // X座標計算（判定時刻に判定ラインに到達）
      const x = judgeLineX + (question.targetMs - nowMs) * scrollSpeed;
      sprite.x = x;
      
      // 画面外に出たら削除
      if (x < -100 || x > width + 100) {
        notesContainerRef.current?.removeChild(sprite);
        noteSpritesRef.current.delete(id);
      }
    });
    
    // 新しいノーツを生成
    questions.forEach((question, index) => {
      // すでに表示されているか、判定済みならスキップ
      if (noteSpritesRef.current.has(question.id) || index < currentPointer) {
        return;
      }
      
      // 表示範囲内かチェック
      const x = judgeLineX + (question.targetMs - nowMs) * scrollSpeed;
      if (x < -100 || x > width + 100) {
        return;
      }
      
      // ノーツスプライト作成
      const noteContainer = new PIXI.Container();
      noteContainer.x = x;
      noteContainer.y = height / 2;
      
      // ノーツの円
      const circle = new PIXI.Graphics();
      circle.beginFill(0xff6b6b, 1);
      circle.drawCircle(0, 0, 25);
      circle.endFill();
      noteContainer.addChild(circle);
      
      // コードネーム表示
      const text = new PIXI.Text(question.chord, {
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: 'bold',
        fill: 0xffffff,
        align: 'center',
      });
      text.anchor.set(0.5);
      noteContainer.addChild(text);
      
      // 判定済みのノーツは半透明に
      if (index < currentPointer) {
        noteContainer.alpha = 0.3;
      }
      
      notesContainerRef.current?.addChild(noteContainer);
      noteSpritesRef.current.set(question.id, noteContainer);
    });
  };
  
  // questionsが変更されたときの処理
  useEffect(() => {
    // 古いノーツをクリア
    noteSpritesRef.current.forEach(sprite => {
      notesContainerRef.current?.removeChild(sprite);
    });
    noteSpritesRef.current.clear();
    
    devLog.debug('PIXIRhythmRenderer: ノーツ更新', { count: questions.length });
  }, [questions]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ width, height }}
      className="rounded-lg overflow-hidden shadow-lg"
    />
  );
};

export default PIXIRhythmRenderer;