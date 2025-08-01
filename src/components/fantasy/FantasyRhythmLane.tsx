/**
 * ファンタジーリズムレーン
 * 太鼓の達人風のノーツレーン表示
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';
import { RhythmLaneNote } from './FantasyRhythmGameEngine';

interface FantasyRhythmLaneProps {
  notes: RhythmLaneNote[];
  width: number;
  height: number;
  className?: string;
}

export const FantasyRhythmLane: React.FC<FantasyRhythmLaneProps> = ({
  notes,
  width,
  height,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // キャンバスサイズ設定
    canvas.width = width;
    canvas.height = height;
    
    // クリア
    ctx.clearRect(0, 0, width, height);
    
    // レーン背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // 判定ライン
    const judgeLineX = width * 0.2; // 左から20%の位置
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(judgeLineX, 0);
    ctx.lineTo(judgeLineX, height);
    ctx.stroke();
    
    // 判定エリア
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(judgeLineX - 50, 0, 100, height);
    
    // ノーツの描画
    notes.forEach(note => {
      const x = judgeLineX + (width - judgeLineX) * note.position;
      const y = height / 2;
      const radius = 30;
      
      // ノーツの円
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      
      if (note.isHit) {
        // ヒット時のエフェクト
        ctx.fillStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (note.isMissed) {
        // ミス時の表示
        ctx.fillStyle = 'rgba(128, 128, 128, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#808080';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // 通常のノーツ
        ctx.fillStyle = '#4a90e2';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // コード名
      if (!note.isHit && !note.isMissed) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(note.chord, x, y);
      }
    });
  }, [notes, width, height]);
  
  return (
    <div className={cn('relative', className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
      
      {/* 判定表示エリア */}
      <div className="absolute left-[20%] top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="text-white text-xl font-bold bg-black/50 px-4 py-2 rounded">
          判定
        </div>
      </div>
    </div>
  );
};