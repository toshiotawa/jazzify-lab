import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { useTimeStore } from '@/stores/timeStore';

interface Question {
  id: string;
  measure: number;
  beat: number;
  chord: string;
  targetMs: number;
}

interface PIXIRhythmRendererProps {
  width: number;
  height: number;
  questions: Question[];
  pointer: number;
  enemyHp: number;
  maxEnemyHp: number;
}

const PIXIRhythmRenderer: React.FC<PIXIRhythmRendererProps> = ({ 
  width, 
  height, 
  questions,
  pointer,
  enemyHp,
  maxEnemyHp
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const notesRef = useRef<Map<string, PIXI.Container>>(new Map());
  const enemySpriteRef = useRef<PIXI.Sprite | null>(null);

  // PIXI初期化
  useEffect(() => {
    if (!containerRef.current) return;

    appRef.current = new PIXI.Application({
      width,
      height,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    });

    containerRef.current.appendChild(appRef.current.view as HTMLCanvasElement);

    // 判定ライン
    const judgeLine = new PIXI.Graphics();
    judgeLine.lineStyle(4, 0xffffff, 1);
    judgeLine.moveTo(width * 0.2, 0);
    judgeLine.lineTo(width * 0.2, height);
    appRef.current.stage.addChild(judgeLine);

    // レーン背景
    const lane = new PIXI.Graphics();
    lane.beginFill(0x16213e, 0.5);
    lane.drawRect(0, height * 0.4, width, height * 0.2);
    lane.endFill();
    appRef.current.stage.addChild(lane);

    // 敵モンスター
    const enemySprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    enemySprite.width = 80;
    enemySprite.height = 80;
    enemySprite.tint = 0xff6b6b;
    enemySprite.position.set(width * 0.8, height * 0.2);
    appRef.current.stage.addChild(enemySprite);
    enemySpriteRef.current = enemySprite;

    // アニメーションループ
    appRef.current.ticker.add(() => {
      updateNotes();
    });

    return () => {
      appRef.current?.destroy(true);
    };
  }, [width, height]);

  // ノーツ更新
  const updateNotes = () => {
    if (!appRef.current) return;

    const timeStore = useTimeStore.getState();
    if (!timeStore.startAt) return;

    const now = performance.now();
    const elapsedMs = now - timeStore.startAt;

    // 表示範囲のノーツのみ処理
    const visibleRange = 3000; // 3秒先まで表示
    const scrollSpeed = width / visibleRange; // px/ms

    questions.forEach((q, index) => {
      const timeToHit = q.targetMs - elapsedMs;
      
      // 表示範囲外はスキップ
      if (timeToHit < -1000 || timeToHit > visibleRange) {
        if (notesRef.current.has(q.id)) {
          const note = notesRef.current.get(q.id);
          if (note) {
            appRef.current!.stage.removeChild(note);
            notesRef.current.delete(q.id);
          }
        }
        return;
      }

      // ノーツ作成または更新
      let noteContainer = notesRef.current.get(q.id);
      if (!noteContainer) {
        noteContainer = new PIXI.Container();
        
        // ノーツ本体
        const note = new PIXI.Graphics();
        note.beginFill(index < pointer ? 0x666666 : 0xffd93d, 1);
        note.drawCircle(0, 0, 30);
        note.endFill();
        noteContainer.addChild(note);

        // コード名
        const text = new PIXI.Text(q.chord, {
          fontFamily: 'Arial',
          fontSize: 24,
          fill: 0x000000,
          align: 'center',
        });
        text.anchor.set(0.5);
        noteContainer.addChild(text);

        appRef.current!.stage.addChild(noteContainer);
        notesRef.current.set(q.id, noteContainer);
      }

      // 位置更新
      const x = width * 0.2 + timeToHit * scrollSpeed;
      noteContainer.position.set(x, height * 0.5);

      // ヒット済みは色を暗く
      if (index < pointer) {
        noteContainer.alpha = 0.3;
      }
    });
  };

  // 敵HP更新
  useEffect(() => {
    if (enemySpriteRef.current) {
      // HP減少でサイズ縮小
      const scale = enemyHp / maxEnemyHp;
      enemySpriteRef.current.scale.set(scale);
      
      // HP0で非表示
      enemySpriteRef.current.visible = enemyHp > 0;
    }
  }, [enemyHp, maxEnemyHp]);

  // リサイズ対応
  useEffect(() => {
    if (appRef.current) {
      appRef.current.renderer.resize(width, height);
    }
  }, [width, height]);

  return <div ref={containerRef} />;
};

export default PIXIRhythmRenderer;