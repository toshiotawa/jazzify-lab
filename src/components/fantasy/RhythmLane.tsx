import React, { useEffect, useRef } from 'react';
import { ChordDefinition } from './FantasyGameEngine';
import { useTimeStore } from '@/stores/timeStore';

interface RhythmNote {
  chord: ChordDefinition;
  measure: number;
  beat: number;
  timing: number;
  judged: boolean;
  success?: boolean;
}

interface RhythmLaneProps {
  rhythmChords: RhythmNote[];
  judgmentWindows: {
    chordId: string;
    startTime: number;
    endTime: number;
    judged: boolean;
    success: boolean;
  }[];
  startAt: number | null;
  bpm: number;
  timeSignature: number;
  onNoteHit?: (chord: ChordDefinition) => void;
}

export const RhythmLane: React.FC<RhythmLaneProps> = ({
  rhythmChords,
  judgmentWindows,
  startAt,
  bpm: _bpm,
  timeSignature: _timeSignature,
  onNoteHit: _onNoteHit
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const { currentBeat, currentMeasure, isCountIn } = useTimeStore();

  // レーンの設定
  const LANE_HEIGHT = 120;
  const NOTE_SIZE = 80;
  const JUDGMENT_LINE_X = 150; // 判定ラインの位置（左から）
  const LANE_WIDTH = 800;
  const PIXELS_PER_SECOND = 200; // 1秒あたりのピクセル数

  useEffect(() => {
    if (!canvasRef.current || !startAt) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズ設定
    canvas.width = LANE_WIDTH;
    canvas.height = LANE_HEIGHT;

    const draw = () => {
      // クリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 背景
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // レーンライン
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, LANE_HEIGHT / 2);
      ctx.lineTo(LANE_WIDTH, LANE_HEIGHT / 2);
      ctx.stroke();

      // 判定ライン
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(JUDGMENT_LINE_X, 0);
      ctx.lineTo(JUDGMENT_LINE_X, LANE_HEIGHT);
      ctx.stroke();

      // 判定サークル
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(JUDGMENT_LINE_X, LANE_HEIGHT / 2, NOTE_SIZE / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();

      // 現在時刻
      const currentTime = performance.now() - startAt;

      // ノーツの描画
      rhythmChords.forEach((note) => {
        // ノートの位置計算（右から左へ流れる）
        const timeUntilNote = note.timing - currentTime;
        const noteX = JUDGMENT_LINE_X + (timeUntilNote / 1000) * PIXELS_PER_SECOND;

        // 画面外のノーツはスキップ
        if (noteX < -NOTE_SIZE || noteX > LANE_WIDTH + NOTE_SIZE) return;

        // 判定ウィンドウの取得
        const window = judgmentWindows.find(w => w.chordId === note.chord.id && 
          Math.abs(w.startTime - (note.timing - 200)) < 10);

        // ノーツの色設定
        let fillColor = 'rgba(255, 100, 100, 0.9)'; // デフォルト赤
        let strokeColor = 'rgba(255, 150, 150, 1)';
        
        if (window?.judged) {
          if (window.success) {
            fillColor = 'rgba(100, 255, 100, 0.9)'; // 成功：緑
            strokeColor = 'rgba(150, 255, 150, 1)';
          } else {
            fillColor = 'rgba(150, 150, 150, 0.5)'; // 失敗：グレー
            strokeColor = 'rgba(200, 200, 200, 0.7)';
          }
        } else if (Math.abs(timeUntilNote) <= 200) {
          // 判定ウィンドウ内
          fillColor = 'rgba(255, 200, 100, 0.9)'; // オレンジ
          strokeColor = 'rgba(255, 225, 150, 1)';
        }

        // ノーツの描画
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(noteX, LANE_HEIGHT / 2, NOTE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // コード名の描画
        ctx.fillStyle = window?.judged && !window.success ? 'rgba(100, 100, 100, 0.7)' : 'white';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(note.chord.displayName, noteX, LANE_HEIGHT / 2);
      });

      // 小節・拍情報
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '16px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const measureText = isCountIn ? `M / - B ${currentBeat}` : `M ${currentMeasure} - B ${currentBeat}`;
      ctx.fillText(measureText, 10, 10);

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [rhythmChords, judgmentWindows, startAt, currentBeat, currentMeasure, isCountIn]);

  return (
    <div className="rhythm-lane-container">
      <canvas 
        ref={canvasRef}
        className="rhythm-lane"
        style={{
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          width: '100%',
          maxWidth: `${LANE_WIDTH}px`,
          height: `${LANE_HEIGHT}px`
        }}
      />
    </div>
  );
};