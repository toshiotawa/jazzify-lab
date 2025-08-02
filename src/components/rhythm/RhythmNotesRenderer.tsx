import React, {
  useEffect, useRef, useState,
} from 'react';
import * as PIXI from 'pixi.js';
import { useRhythmStore } from '@/stores/rhythmStore';

interface Props { width: number; height: number }

/** 1小節を何 px で流すか (スクロール速度) */
const PX_PER_MEASURE = 600;

const RhythmNotesRenderer: React.FC<Props> = ({ width, height }) => {
  const ref = useRef<HTMLDivElement>(null);
  const notes = useRhythmStore((s) => s.notes);
  const currentTime = useRhythmStore((s) => s.currentTime);

  const [app, setApp] = useState<PIXI.Application>();

  /** 初回 mount → PIXI Application 生成 */
  useEffect(() => {
    if (!ref.current) return undefined;
    const pixi = new PIXI.Application({
      width, height, backgroundAlpha: 0, antialias: true,
      resolution: window.devicePixelRatio ?? 1,
      autoDensity: true,
    });
    ref.current.appendChild(pixi.view as unknown as Node);
    setApp(pixi);
    return () => { pixi.destroy(true, { children: true }); };
  }, [width, height]);

  /** ノートスプライト生成 & 更新 */
  useEffect(() => {
    if (!app) return;
    const container = new PIXI.Container();
    app.stage.removeChildren();
    app.stage.addChild(container);

    const tex = new PIXI.Graphics();
    tex.beginFill(0xffc107);
    tex.drawRect(0, 0, 28, 14);
    tex.endFill();
    const baseTexture = app.renderer.generateTexture(tex);

    const sprites = notes.map((n) => {
      const s = new PIXI.Sprite(baseTexture);
      s.anchor.set(0, 0.5);
      s.y = height / 2;
      s.zIndex = n.spawnAt;
      container.addChild(s);
      return { note: n, sprite: s };
    });
    container.sortableChildren = true;

    const raf = () => {
      sprites.forEach(({ note, sprite }) => {
        const dt = note.spawnAt - currentTime;
        // x = 判定ライン + dt * speed (負で左へ)
        sprite.x = 48 + (dt * PX_PER_MEASURE / (60 / (note.beat === 1 ? 1 : 1))); // 4/4 固定
        sprite.visible = sprite.x + 28 > 0 && sprite.x < width;
      });
      app.render();
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    return () => {
      container.destroy({ children: true });
    };
  }, [app, notes, currentTime, width, height]);

  return <div ref={ref} className="w-full h-full" />;
};

export default RhythmNotesRenderer;