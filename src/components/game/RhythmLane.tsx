import React, { useEffect, useRef } from 'react';
import { useRhythmStore } from '../../stores/rhythmStore';
import { LANE_HEIGHT, SCROLL_DURATION_MS } from '../../constants/rhythm';
import { detectAutoFailNotes } from '../../logic/rhythmJudge';

interface RhythmLaneProps {
  onAutoFail?: (noteId: string) => void;
}

export const RhythmLane: React.FC<RhythmLaneProps> = ({ onAutoFail }) => {
  const { notes, activeNoteIds, registerFail } = useRhythmStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const currentTime = performance.now();
      
      // キャンバスをクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 判定ラインを描画（左から20%の位置）
      const judgeLine = canvas.width * 0.2;
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(judgeLine, 0);
      ctx.lineTo(judgeLine, canvas.height);
      ctx.stroke();

      // 判定ラインのラベル
      ctx.fillStyle = '#ff0000';
      ctx.font = '12px Arial';
      ctx.fillText('判定', judgeLine - 20, 15);

      // レーンの背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 20, canvas.width, LANE_HEIGHT);

      // ノーツを描画
      notes.forEach((note) => {
        if (!activeNoteIds.has(note.id)) return;

        // ノーツの位置を計算（右から左へスクロール）
        const progress = (currentTime - note.spawnTimeMs) / SCROLL_DURATION_MS;
        const x = canvas.width - (progress * (canvas.width - judgeLine));

        // 画面外のノーツはスキップ
        if (x > canvas.width || x < -50) return;

        // ノーツを描画（円形）
        const y = 20 + LANE_HEIGHT / 2;
        const radius = 20;

        // ノーツの背景
        ctx.fillStyle = getChordColor(note.chord);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // ノーツのテキスト
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(note.chord, x, y);
      });

      // 自動失敗チェック
      const autoFailNoteIds = detectAutoFailNotes(notes, currentTime, activeNoteIds);
      autoFailNoteIds.forEach((noteId) => {
        registerFail(noteId);
        if (onAutoFail) {
          onAutoFail(noteId);
        }
      });

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [notes, activeNoteIds, registerFail, onAutoFail]);

  // キャンバスのサイズを設定
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = LANE_HEIGHT + 40; // レーン高さ + マージン
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  return (
    <div className="rhythm-lane-container" style={{ width: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        className="rhythm-lane-canvas"
        style={{
          display: 'block',
          width: '100%',
          height: LANE_HEIGHT + 40,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
        }}
      />
    </div>
  );
};

// コードによって色を変える
function getChordColor(chord: string): string {
  const colors: Record<string, string> = {
    'C': '#ff6b6b',
    'CM7': '#ff8787',
    'C7': '#fa5252',
    'Cm': '#e03131',
    'Cm7': '#c92a2a',
    'D': '#4ecdc4',
    'Dm': '#38d9a9',
    'E': '#ffe66d',
    'Em': '#ffd43b',
    'F': '#a8e6cf',
    'Fm': '#8ce99a',
    'G': '#ff8cc8',
    'Gm': '#f06292',
    'A': '#c7ceea',
    'Am': '#9775fa',
    'B': '#ffd3b6',
    'Bm': '#ffaa94',
  };

  // 基本的なコード名を抽出（例: CM7 → C）
  const baseChord = chord.replace(/[0-9]/g, '');
  return colors[chord] || colors[baseChord] || '#888888';
}