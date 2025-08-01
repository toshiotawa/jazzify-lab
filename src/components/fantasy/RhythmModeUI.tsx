import React, { useEffect, useRef, useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { useRhythmStore } from '@/stores/rhythmStore';
import { ChordProgressionData } from '@/types';

interface RhythmModeUIProps {
  currentChord: string;
  nextChords: string[];
  allowedChords: string[];
  bpm: number;
  timeSignature: number;
  measureCount: number;
  countInMeasures: number;
  progressionData: ChordProgressionData | null;
}

export const RhythmModeUI: React.FC<RhythmModeUIProps> = ({
  currentChord,
  nextChords,
  allowedChords,
  bpm,
  timeSignature,
  measureCount,
  countInMeasures,
  progressionData
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentBeat, currentMeasure, isCountIn } = useTimeStore();
  const { isRandomMode, judgmentWindows, currentWindowIndex } = useRhythmStore();
  
  // 次に表示するコードを計算
  const upcomingChords = useMemo(() => {
    if (isRandomMode) {
      // ランダムモード: 現在の小節で1つのコードを表示
      return [{
        chord: currentChord,
        measure: currentMeasure,
        beat: 1,
        timing: 0
      }];
    } else if (judgmentWindows.length > 0) {
      // プログレッションモード: 判定ウィンドウから取得
      const upcoming = [];
      const beatTime = 60000 / bpm;
      const currentTime = performance.now();
      
      for (let i = currentWindowIndex; i < Math.min(currentWindowIndex + 5, judgmentWindows.length); i++) {
        const window = judgmentWindows[i];
        const timingMs = (window.startTime + window.endTime) / 2 - currentTime;
        
        upcoming.push({
          chord: window.chord,
          measure: window.measure,
          beat: window.beat,
          timing: timingMs
        });
      }
      
      return upcoming;
    }
    
    return [];
  }, [isRandomMode, currentChord, currentMeasure, judgmentWindows, currentWindowIndex, bpm]);
  
  // Canvas描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const draw = () => {
      // キャンバスクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 背景
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 判定ライン
      const judgeLineX = canvas.width * 0.2;
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(judgeLineX, 0);
      ctx.lineTo(judgeLineX, canvas.height);
      ctx.stroke();
      
      // 判定ライン周辺のエフェクト
      const gradient = ctx.createLinearGradient(judgeLineX - 30, 0, judgeLineX + 30, 0);
      gradient.addColorStop(0, 'rgba(255, 107, 107, 0)');
      gradient.addColorStop(0.5, 'rgba(255, 107, 107, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(judgeLineX - 30, 0, 60, canvas.height);
      
      // レーン
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.3);
      ctx.lineTo(canvas.width, canvas.height * 0.3);
      ctx.moveTo(0, canvas.height * 0.7);
      ctx.lineTo(canvas.width, canvas.height * 0.7);
      ctx.stroke();
      
      // ノーツ（コード）の描画
      const noteWidth = 80;
      const noteHeight = 50;
      const pixelsPerMs = 0.3; // スピード調整可能
      
      upcomingChords.forEach((note, index) => {
        const x = judgeLineX + note.timing * pixelsPerMs;
        
        // 画面内にあるノーツのみ描画
        if (x > -noteWidth && x < canvas.width) {
          // ノーツの背景
          const noteGradient = ctx.createRadialGradient(
            x + noteWidth/2, canvas.height/2, 0,
            x + noteWidth/2, canvas.height/2, noteWidth/2
          );
          
          if (note.timing < 200 && note.timing > -200) {
            // 判定範囲内：赤く光る
            noteGradient.addColorStop(0, '#ff6b6b');
            noteGradient.addColorStop(1, '#cc5555');
          } else {
            // 通常
            noteGradient.addColorStop(0, '#4ecdc4');
            noteGradient.addColorStop(1, '#2a9d8f');
          }
          
          ctx.fillStyle = noteGradient;
          ctx.fillRect(x, canvas.height/2 - noteHeight/2, noteWidth, noteHeight);
          
          // 枠線
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, canvas.height/2 - noteHeight/2, noteWidth, noteHeight);
          
          // コード名
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(note.chord, x + noteWidth/2, canvas.height/2);
        }
      });
      
      requestAnimationFrame(draw);
    };
    
    draw();
  }, [upcomingChords]);
  
  return (
    <div className="rhythm-mode-ui">
      {/* 小節・拍表示 */}
      <div className="absolute top-4 left-4 text-white text-xl font-bold">
        {isCountIn ? (
          <span>M / - B {currentBeat}</span>
        ) : (
          <span>M {currentMeasure} - B {currentBeat}</span>
        )}
      </div>
      
      {/* ノーツキャンバス */}
      <canvas
        ref={canvasRef}
        width={800}
        height={150}
        className="w-full max-w-4xl mx-auto mt-4 rounded-lg shadow-lg"
        style={{ imageRendering: 'crisp-edges' }}
      />
      
      {/* モード表示 */}
      <div className="absolute top-4 right-4 text-white text-sm">
        {isRandomMode ? 'ランダムモード' : 'コード進行モード'}
      </div>
    </div>
  );
};