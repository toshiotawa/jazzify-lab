import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { RhythmQuestion } from '@/stores/rhythmStore';

interface Props {
  width: number;
  height: number;
  questions: RhythmQuestion[];
  now: number;
}

const NOTE_SIZE = 48;
const JUDGE_LINE_X = 100; // 判定ラインの位置

const PIXIRhythmRenderer: React.FC<Props> = ({ width, height, questions, now }) => {
  const ref = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application>();

  /* --- 初期化 --- */
  useEffect(() => {
    if (!ref.current) return;
    const app = new PIXI.Application({
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
    });
    ref.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;
    return () => { app.destroy(true, { children: true }); };
  }, [width, height]);

  /* --- 毎フレーム描画 --- */
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    // 再利用のため一旦全部非表示
    app.stage.removeChildren();

    // 判定ライン
    const judgeLine = new PIXI.Graphics();
    judgeLine.lineStyle(2, 0xFFFFFF, 0.8);
    judgeLine.moveTo(JUDGE_LINE_X, 0);
    judgeLine.lineTo(JUDGE_LINE_X, height);
    app.stage.addChild(judgeLine);

    // ノーツのスクロール速度計算
    const firstQ = questions[0];
    if (!firstQ) return;
    const scrollDuration = firstQ.targetMs - firstQ.spawnMs;
    const speed = (width - JUDGE_LINE_X) / scrollDuration; // px per ms

    questions.forEach(q => {
      if (now < q.spawnMs || now > q.targetMs + 1000) return; // 画面外
      
      const sprite = new PIXI.Graphics();
      sprite.beginFill(0xffd700);
      sprite.drawCircle(0, 0, NOTE_SIZE / 2);
      sprite.endFill();

      const t = (q.targetMs - now);
      sprite.x = JUDGE_LINE_X + t * speed;
      sprite.y = height / 2;

      const style = new PIXI.TextStyle({ fill: '#000', fontSize: 14, align: 'center' });
      const txt = new PIXI.Text(q.chord, style);
      txt.anchor.set(0.5);
      sprite.addChild(txt);

      app.stage.addChild(sprite);
    });
  }, [now, questions, width, height]);

  return <div ref={ref} className="w-full h-full pointer-events-none" />;
};

export default PIXIRhythmRenderer;