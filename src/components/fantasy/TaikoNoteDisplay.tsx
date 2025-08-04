import React, { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { TaikoNote, getVisibleNotesWithLoop, calculateNotePosition } from './TaikoNoteSystem';
import { bgmManager } from '@/utils/BGMManager';
import { FantasyGameState } from './FantasyGameEngine';
import { devLog } from '@/utils/devLog';
import gsap from 'gsap';

interface TaikoNoteDisplayProps {
  gameState: FantasyGameState;
  width: number;
  height: number;
  onReady?: () => void;
}

export const TaikoNoteDisplay: React.FC<TaikoNoteDisplayProps> = ({
  gameState,
  width,
  height,
  onReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiAppRef = useRef<PIXI.Application | null>(null);
  const notesContainerRef = useRef<PIXI.Container | null>(null);
  const noteSpritesRef = useRef<Map<string, PIXI.Container>>(new Map());
  const judgeLineRef = useRef<PIXI.Graphics | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const effectsContainerRef = useRef<PIXI.Container | null>(null);
  
  // 定数
  const JUDGE_LINE_X = 100; // 判定ラインの位置（左端から）
  const NOTE_RADIUS = 35; // ノーツの半径
  const NOTE_SPEED = 400; // ノーツの移動速度（ピクセル/秒）
  const LOOK_AHEAD_TIME = 3; // 先読み時間（秒）
  
  // エフェクトの作成
  const createHitEffect = useCallback((x: number, y: number, type: 'perfect' | 'good' | 'miss') => {
    if (!effectsContainerRef.current) return;
    
    const text = new PIXI.Text(
      type === 'perfect' ? 'PERFECT!' : type === 'good' ? 'GOOD!' : 'MISS',
      {
        fontFamily: 'Arial',
        fontSize: type === 'perfect' ? 36 : 30,
        fontWeight: 'bold',
        fill: type === 'perfect' ? 0xFFD700 : type === 'good' ? 0x00FF00 : 0xFF0000,
        stroke: 0x000000,
        strokeThickness: 4,
        align: 'center'
      }
    );
    
    text.anchor.set(0.5);
    text.position.set(x, y);
    text.scale.set(0.5);
    
    effectsContainerRef.current.addChild(text);
    
    // アニメーション
    gsap.to(text, {
      y: y - 50,
      alpha: 0,
      duration: 1,
      ease: 'power2.out',
      onComplete: () => {
        text.destroy();
      }
    });
    
    gsap.to(text.scale, {
      x: 1.2,
      y: 1.2,
      duration: 0.2,
      ease: 'back.out(2)',
      yoyo: true,
      repeat: 1
    });
  }, []);
  
  // 判定ラインのフラッシュエフェクト
  const flashJudgeLine = useCallback((success: boolean) => {
    if (!judgeLineRef.current) return;
    
    const flashCircle = new PIXI.Graphics();
    flashCircle.lineStyle(6, success ? 0x00FF00 : 0xFF0000, 1);
    flashCircle.drawCircle(JUDGE_LINE_X, height / 2, NOTE_RADIUS);
    flashCircle.endFill();
    
    if (!effectsContainerRef.current) return;
    effectsContainerRef.current.addChild(flashCircle);
    
    gsap.to(flashCircle, {
      alpha: 0,
      duration: 0.3,
      onComplete: () => {
        flashCircle.destroy();
      }
    });
  }, [height]);
  
  // PIXIアプリケーションの初期化
  useEffect(() => {
    if (!containerRef.current) return;
    
    // PIXI アプリケーション作成
    const app = new PIXI.Application();
    
    app.init({
      width,
      height,
      backgroundColor: 0x000000,
      backgroundAlpha: 0.3,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    }).then(() => {
      if (!containerRef.current || !app.stage) return;
      
      // canvas をコンテナに追加
      containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
      
      // ノーツ用コンテナ
      const notesContainer = new PIXI.Container();
      app.stage.addChild(notesContainer);
      notesContainerRef.current = notesContainer;
      
      // エフェクト用コンテナ（ノーツより前面）
      const effectsContainer = new PIXI.Container();
      app.stage.addChild(effectsContainer);
      effectsContainerRef.current = effectsContainer;
      
      // 判定ライン（円形）を描画
      const judgeLine = new PIXI.Graphics();
      judgeLine.lineStyle(3, 0xFFFFFF, 0.8);
      judgeLine.drawCircle(JUDGE_LINE_X, height / 2, NOTE_RADIUS);
      judgeLine.endFill();
      app.stage.addChild(judgeLine);
      judgeLineRef.current = judgeLine;
      
      // レディコールバック
      if (onReady) {
        onReady();
      }
      
      pixiAppRef.current = app;
    });
    
    // クリーンアップ
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy(true, { children: true });
        pixiAppRef.current = null;
      }
      
      noteSpritesRef.current.clear();
    };
  }, [width, height, onReady]);
  
  // ノーツスプライトの作成
  const createNoteSprite = useCallback((note: TaikoNote): PIXI.Container => {
    const container = new PIXI.Container();
    
    // 外円（白い円）
    const outerCircle = new PIXI.Graphics();
    outerCircle.beginFill(0xFFFFFF);
    outerCircle.drawCircle(0, 0, NOTE_RADIUS);
    outerCircle.endFill();
    container.addChild(outerCircle);
    
    // 内円（色付き）
    const innerCircle = new PIXI.Graphics();
    const chordColor = note.chord.color || 0x4A90E2;
    innerCircle.beginFill(chordColor);
    innerCircle.drawCircle(0, 0, NOTE_RADIUS - 5);
    innerCircle.endFill();
    container.addChild(innerCircle);
    
    // コードネームテキスト
    const text = new PIXI.Text(note.chord.displayName, {
      fontFamily: 'Arial',
      fontSize: 20,
      fontWeight: 'bold',
      fill: 0xFFFFFF,
      align: 'center'
    });
    text.anchor.set(0.5);
    container.addChild(text);
    
    // 判定済みの場合は半透明に
    if (note.isHit || note.isMissed) {
      container.alpha = 0.3;
    }
    
    return container;
  }, []);
  
  // アニメーションループ
  const animate = useCallback(() => {
    if (!gameState.isGameActive || !gameState.isTaikoMode) return;
    if (!notesContainerRef.current) return;
    
    const currentTime = bgmManager.getCurrentMusicTime();
    const loopDuration = bgmManager.getLoopDuration();
    const loopCount = bgmManager.getLoopCount();
    
    // 表示すべきノーツを取得
    const visibleNotes = getVisibleNotesWithLoop(
      gameState.taikoNotes,
      currentTime,
      LOOK_AHEAD_TIME,
      loopDuration
    );
    
    // 現在のノーツスプライトを管理
    const currentNoteIds = new Set(visibleNotes.map(n => n.id));
    
    // 不要なノーツを削除
    noteSpritesRef.current.forEach((sprite, noteId) => {
      if (!currentNoteIds.has(noteId)) {
        notesContainerRef.current!.removeChild(sprite);
        sprite.destroy();
        noteSpritesRef.current.delete(noteId);
      }
    });
    
    // ノーツの位置を更新または新規作成
    visibleNotes.forEach(note => {
      let sprite = noteSpritesRef.current.get(note.id);
      
      if (!sprite) {
        // 新規作成
        sprite = createNoteSprite(note);
        sprite.y = height / 2;
        notesContainerRef.current!.addChild(sprite);
        noteSpritesRef.current.set(note.id, sprite);
      }
      
      // 位置を計算（ループを考慮）
      let noteTime = note.hitTime;
      
      // 現在のループ内でのノーツか、次のループのノーツかを判定
      if (loopCount > 0) {
        const timeInCurrentLoop = currentTime % loopDuration;
        const noteTimeInLoop = note.hitTime % loopDuration;
        
        // ノーツが既に過ぎている場合、次のループとして扱う
        if (noteTimeInLoop < timeInCurrentLoop - 0.5) {
          noteTime = note.hitTime + loopDuration * (Math.floor(currentTime / loopDuration) + 1);
        } else {
          noteTime = note.hitTime + loopDuration * Math.floor(currentTime / loopDuration);
        }
      }
      
      const x = calculateNotePosition(
        { ...note, hitTime: noteTime },
        currentTime,
        JUDGE_LINE_X,
        NOTE_SPEED
      );
      
      sprite.x = x;
      
      // 画面外のノーツは非表示
      sprite.visible = x > -NOTE_RADIUS && x < width + NOTE_RADIUS;
      
      // 現在のノーツをハイライト
      const actualNoteIndex = gameState.currentNoteIndex % gameState.taikoNotes.length;
      if (gameState.taikoNotes[actualNoteIndex]?.id === note.id) {
        sprite.scale.set(1.1); // 少し大きく
        sprite.alpha = 1;
      } else {
        sprite.scale.set(1);
        sprite.alpha = note.isHit || note.isMissed ? 0.3 : 0.8;
      }
    });
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [gameState, height, width, createNoteSprite]);
  
  // アニメーション開始
  useEffect(() => {
    if (gameState.isGameActive && gameState.isTaikoMode) {
      animate();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isGameActive, gameState.isTaikoMode, animate]);

  // ノーツのヒット状態を監視
  useEffect(() => {
    if (!gameState.isGameActive || !gameState.isTaikoMode) return;
    
    // 現在のノーツを監視
    const checkInterval = setInterval(() => {
      const actualNoteIndex = gameState.currentNoteIndex % gameState.taikoNotes.length;
      const currentNote = gameState.taikoNotes[actualNoteIndex];
      
      if (currentNote && gameState.activeMonsters.length > 0) {
        const currentMonster = gameState.activeMonsters[0];
        const targetNotes = [...new Set(currentNote.chord.notes.map(n => n % 12))];
        
        // コード完成をチェック
        if (currentMonster.correctNotes.length === targetNotes.length &&
            targetNotes.every(n => currentMonster.correctNotes.includes(n))) {
          // ヒット！
          const currentTime = bgmManager.getCurrentMusicTime();
          const timeDiff = Math.abs((currentTime - currentNote.hitTime) * 1000);
          const hitType = timeDiff <= 50 ? 'perfect' : 'good';
          
          createHitEffect(JUDGE_LINE_X, height / 2, hitType);
          flashJudgeLine(true);
        }
      }
    }, 16); // 60FPS
    
    return () => clearInterval(checkInterval);
  }, [gameState, height, createHitEffect, flashJudgeLine]);
  
  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: `${width}px`,
        height: `${height}px`
      }}
    />
  );
};