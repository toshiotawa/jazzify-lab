import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { RhythmNote } from '@/stores/rhythmStore';
import { DisplayOpts, toDisplayChordName } from '@/utils/display-note';
import { devLog } from '@/utils/logger';

interface RhythmPIXIRendererProps {
  notes: RhythmNote[];
  currentTime: number;
  width: number;
  height: number;
  displayOpts: {
    lang: DisplayOpts['lang'];
    simpleNoteName?: boolean;
  };
}

const RhythmPIXIRenderer: React.FC<RhythmPIXIRendererProps> = ({
  notes,
  currentTime,
  width,
  height,
  displayOpts
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const notesContainerRef = useRef<PIXI.Container | null>(null);
  const noteSpritesRef = useRef<Map<string, PIXI.Container>>(new Map());
  
  // 定数
  const JUDGE_LINE_X = 150; // 判定ラインのX座標
  const NOTE_SPEED = 300; // ピクセル/秒
  const NOTE_WIDTH = 100;
  const NOTE_HEIGHT = 60;
  const JUDGMENT_WINDOW_VISUAL = 0.2; // 判定ウィンドウの視覚表示（±200ms）
  
  // PIXI初期化
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 既存のcanvasをクリア
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    
    // PIXIアプリケーション作成
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0xf0f0f0,
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
    
    // 判定ライン描画
    const judgeLine = new PIXI.Graphics();
    judgeLine.lineStyle(4, 0xff0000);
    judgeLine.moveTo(JUDGE_LINE_X, 0);
    judgeLine.lineTo(JUDGE_LINE_X, height);
    app.stage.addChild(judgeLine);
    
    // 判定ウィンドウ表示（デバッグ用）
    const windowGraphics = new PIXI.Graphics();
    windowGraphics.beginFill(0x00ff00, 0.1);
    windowGraphics.drawRect(
      JUDGE_LINE_X - JUDGMENT_WINDOW_VISUAL * NOTE_SPEED,
      0,
      JUDGMENT_WINDOW_VISUAL * NOTE_SPEED * 2,
      height
    );
    windowGraphics.endFill();
    app.stage.addChild(windowGraphics);
    
    // レーン線
    const laneGraphics = new PIXI.Graphics();
    laneGraphics.lineStyle(1, 0xcccccc);
    laneGraphics.moveTo(0, height / 2);
    laneGraphics.lineTo(width, height / 2);
    app.stage.addChild(laneGraphics);
    
    devLog.debug('🎨 RhythmPIXIRenderer initialized');
    
    return () => {
      app.destroy(true, { children: true, texture: true, baseTexture: true });
      appRef.current = null;
      notesContainerRef.current = null;
      noteSpritesRef.current.clear();
    };
  }, [width, height]);
  
  // ノーツ更新
  useEffect(() => {
    if (!appRef.current || !notesContainerRef.current) return;
    
    const app = appRef.current;
    const notesContainer = notesContainerRef.current;
    const noteSprites = noteSpritesRef.current;
    
    // 現在のノーツIDセット
    const currentNoteIds = new Set(notes.map(note => note.id));
    
    // 削除されたノーツを除去
    for (const [id, sprite] of noteSprites.entries()) {
      if (!currentNoteIds.has(id)) {
        notesContainer.removeChild(sprite);
        sprite.destroy();
        noteSprites.delete(id);
      }
    }
    
    // ノーツを更新・作成
    notes.forEach(note => {
      let noteContainer = noteSprites.get(note.id);
      
      if (!noteContainer) {
        // 新規ノーツ作成
        noteContainer = new PIXI.Container();
        
        // ノート背景
        const bg = new PIXI.Graphics();
        const color = note.judgmentResult === 'perfect' ? 0x00ff00 : 
                     note.judgmentResult === 'miss' ? 0xff0000 : 
                     0x3b82f6;
        bg.beginFill(color, note.judged ? 0.5 : 1);
        bg.drawRoundedRect(0, 0, NOTE_WIDTH, NOTE_HEIGHT, 10);
        bg.endFill();
        noteContainer.addChild(bg);
        
        // コード名テキスト
        const text = new PIXI.Text(
          toDisplayChordName(note.chord, { 
            lang: displayOpts.lang, 
            simple: displayOpts.simpleNoteName || false 
          }),
          {
            fontFamily: 'Arial',
            fontSize: 24,
            fontWeight: 'bold',
            fill: 0xffffff,
            align: 'center'
          }
        );
        text.anchor.set(0.5);
        text.x = NOTE_WIDTH / 2;
        text.y = NOTE_HEIGHT / 2;
        noteContainer.addChild(text);
        
        // 判定結果テキスト
        if (note.judged && note.judgmentResult) {
          const resultText = new PIXI.Text(
            note.judgmentResult.toUpperCase(),
            {
              fontFamily: 'Arial',
              fontSize: 16,
              fontWeight: 'bold',
              fill: note.judgmentResult === 'perfect' ? 0x00ff00 : 0xff0000,
              stroke: 0xffffff,
              strokeThickness: 2
            }
          );
          resultText.anchor.set(0.5);
          resultText.x = NOTE_WIDTH / 2;
          resultText.y = -10;
          noteContainer.addChild(resultText);
        }
        
        notesContainer.addChild(noteContainer);
        noteSprites.set(note.id, noteContainer);
      }
      
      // 位置更新
      const timeDiff = note.time - currentTime;
      const x = JUDGE_LINE_X + timeDiff * NOTE_SPEED;
      noteContainer.x = x - NOTE_WIDTH / 2;
      noteContainer.y = (height - NOTE_HEIGHT) / 2;
      
      // 画面外のノーツは非表示
      noteContainer.visible = x > -NOTE_WIDTH && x < width + NOTE_WIDTH;
      
      // 判定済みノーツは透明度を下げる
      if (note.judged) {
        noteContainer.alpha = 0.5;
      }
    });
    
    // レンダリング
    app.render();
  }, [notes, currentTime, displayOpts]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ width, height }}
      className="rhythm-pixi-renderer"
    />
  );
};

export default RhythmPIXIRenderer;