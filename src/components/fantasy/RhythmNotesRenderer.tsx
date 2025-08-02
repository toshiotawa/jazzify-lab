import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { RhythmNote } from '@/types';

interface RhythmNotesRendererProps {
  notes: RhythmNote[];
  currentTime: number;
  bpm: number;
  width: number;
  height: number;
}

// レーンと判定ラインの設定
const JUDGMENT_LINE_X = 100; // 判定ラインのX座標
const NOTE_SPEED_FACTOR = 200; // ノーツの速度係数（大きいほど速い）

const RhythmNotesRenderer: React.FC<RhythmNotesRendererProps> = ({
  notes,
  currentTime,
  bpm: _bpm, // eslint-disable-line @typescript-eslint/no-unused-vars
  width,
  height,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const noteSpritesRef = useRef<Map<string, PIXI.Text>>(new Map());
  const judgmentLineRef = useRef<PIXI.Graphics | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // PIXI Applicationの初期化
    const app = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      antialias: true,
    });
    appRef.current = app;
    containerRef.current.appendChild(app.view as HTMLCanvasElement);

    // 判定ラインの描画
    const line = new PIXI.Graphics();
    line.lineStyle(4, 0xffd700, 1);
    line.moveTo(JUDGMENT_LINE_X, 0);
    line.lineTo(JUDGMENT_LINE_X, height);
    app.stage.addChild(line);
    judgmentLineRef.current = line;

    // Ticker（アニメーションループ）の追加
    app.ticker.add(() => {
      if (!appRef.current) return;
      const stage = appRef.current.stage;
      const noteSprites = noteSpritesRef.current;
      const currentNotesMap = new Map(notes.map(n => [n.id, n]));

      // 既存スプライトの更新と不要なスプライトの削除
      noteSprites.forEach((sprite, noteId) => {
        const note = currentNotesMap.get(noteId);
        if (note && note.status !== 'judged' && note.status !== 'missed') {
          // ノーツのX座標を計算
          const timeDifference = note.targetTime - currentTime;
          sprite.x = JUDGMENT_LINE_X + timeDifference * NOTE_SPEED_FACTOR;
          sprite.y = height / 2; // Y座標は中央に固定

          // 画面外に出たら削除
          if (sprite.x < -sprite.width) {
            stage.removeChild(sprite);
            sprite.destroy();
            noteSprites.delete(noteId);
          }
        } else {
          // 判定済みまたは見逃したノーツ、またはリストから消えたノーツを削除
          stage.removeChild(sprite);
          sprite.destroy();
          noteSprites.delete(noteId);
        }
      });

      // 新しいノーツのスプライトを作成
      notes.forEach(note => {
        if (!noteSprites.has(note.id) && note.status === 'active') {
          const noteText = new PIXI.Text(note.chord.displayName, {
            fontSize: 24,
            fill: 0xffffff,
            stroke: 0x000000,
            strokeThickness: 4,
          });
          noteText.anchor.set(0.5);
          const timeDifference = note.targetTime - currentTime;
          noteText.x = JUDGMENT_LINE_X + timeDifference * NOTE_SPEED_FACTOR;
          noteText.y = height / 2;

          if (noteText.x <= width) { // 画面内に入ってから表示
             stage.addChild(noteText);
             noteSprites.set(note.id, noteText);
          }
        }
      });
    });

    return () => {
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, [width, height, notes, currentTime]); // eslint-disable-line react-hooks/exhaustive-deps
  // currentTimeやnotesの変更はTicker内で処理されるため、依存配列に含めない

  return <div ref={containerRef} style={{ width, height }} />;
};

export default RhythmNotesRenderer;