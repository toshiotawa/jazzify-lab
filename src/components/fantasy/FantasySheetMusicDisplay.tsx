/**
 * ファンタジーモード用楽譜表示コンポーネント
 * Progression_Timing用の軽量な楽譜表示
 * Canvas2Dを使用してパフォーマンスを最適化
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/utils/cn';
import { bgmManager } from '@/utils/BGMManager';
import type { TaikoNote, ChordProgressionDataItem } from './TaikoNoteSystem';

interface FantasySheetMusicDisplayProps {
  width: number;
  height: number;
  taikoNotes: TaikoNote[];
  currentNoteIndex: number;
  bpm: number;
  timeSignature: number;
  measureCount: number;
  /** Harmonyデータ（chord_progression_dataのtext付きアイテム）*/
  harmonyMarkers?: Array<{ time: number; text: string }>;
  className?: string;
}

// 五線譜の音高定義（C4を基準）
const STAFF_LINES = [
  { note: 'F5', midi: 77 },  // 上第1線
  { note: 'D5', midi: 74 },  // 上第1間
  { note: 'B4', midi: 71 },  // 第5線
  { note: 'G4', midi: 67 },  // 第4線
  { note: 'E4', midi: 64 },  // 第3線
  { note: 'C4', midi: 60 },  // 第2線（中央C）
  { note: 'A3', midi: 57 },  // 第1線
];

// 音名からY位置を計算するためのマッピング
const NOTE_TO_Y_OFFSET: { [key: number]: number } = {};
for (let midi = 36; midi <= 96; midi++) {
  // C4(60)を基準に、半音ごとのY位置を計算
  // 白鍵のみ考慮（簡易版）
  const noteInOctave = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  // C=0, D=2, E=4, F=5, G=7, A=9, B=11
  const whiteKeyMap: { [key: number]: number } = {
    0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6
  };
  const blackKeyMap: { [key: number]: number } = {
    1: 0.5, 3: 1.5, 6: 3.5, 8: 4.5, 10: 5.5
  };
  
  const isBlackKey = [1, 3, 6, 8, 10].includes(noteInOctave);
  const posInOctave = isBlackKey ? blackKeyMap[noteInOctave] : whiteKeyMap[noteInOctave];
  // オクターブごとに7音（白鍵）分ずれる
  NOTE_TO_Y_OFFSET[midi] = (4 - octave) * 7 + (6 - posInOctave);
}

const FantasySheetMusicDisplay: React.FC<FantasySheetMusicDisplayProps> = ({
  width,
  height,
  taikoNotes,
  currentNoteIndex,
  bpm,
  timeSignature,
  measureCount,
  harmonyMarkers = [],
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  
  // 🚀 パフォーマンス最適化: フレームレート制御（60fps）
  const MIN_FRAME_INTERVAL = 1000 / 60; // 約16.67ms
  
  // ループ情報を計算
  const loopInfo = useMemo(() => {
    const secPerBeat = 60 / (bpm || 120);
    const secPerMeasure = secPerBeat * (timeSignature || 4);
    const loopDuration = (measureCount || 8) * secPerMeasure;
    return { secPerBeat, secPerMeasure, loopDuration };
  }, [bpm, timeSignature, measureCount]);
  
  // 五線譜の描画パラメータ
  const staffParams = useMemo(() => {
    const staffHeight = height * 0.6;
    const staffTop = height * 0.15;
    const lineSpacing = staffHeight / 4;
    const judgeLineX = width * 0.12; // 判定ラインのX位置
    const noteSpeed = width * 0.3; // ピクセル/秒
    const lookAheadTime = 4; // 4秒先まで表示
    
    return { staffHeight, staffTop, lineSpacing, judgeLineX, noteSpeed, lookAheadTime };
  }, [width, height]);
  
  // MIDIノートからY位置を計算
  const midiToY = useCallback((midi: number): number => {
    const { staffTop, lineSpacing } = staffParams;
    // C4(60)を第2線として基準にする
    const offset = NOTE_TO_Y_OFFSET[midi] ?? 0;
    // 第3線（E4=64）を中央として計算
    const centerOffset = NOTE_TO_Y_OFFSET[64] ?? 0;
    const relativeOffset = offset - centerOffset;
    return staffTop + lineSpacing * 2 + relativeOffset * (lineSpacing / 2);
  }, [staffParams]);
  
  // 描画関数
  const draw = useCallback((timestamp: number = performance.now()) => {
    // 🚀 パフォーマンス最適化: フレームレート制御
    const elapsed = timestamp - lastFrameTimeRef.current;
    if (elapsed < MIN_FRAME_INTERVAL) {
      animationRef.current = requestAnimationFrame(draw);
      return;
    }
    lastFrameTimeRef.current = timestamp;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const currentTime = bgmManager.getCurrentMusicTime();
    const { loopDuration } = loopInfo;
    const { staffTop, lineSpacing, judgeLineX, noteSpeed, lookAheadTime, staffHeight } = staffParams;
    
    // キャンバスをクリア
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    
    // 背景（半透明の暗い色）
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, width, height);
    
    // 五線譜を描画
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = staffTop + i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(width - 20, y);
      ctx.stroke();
    }
    
    // ト音記号（簡易表示）
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = `${lineSpacing * 4}px serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('𝄞', 5, staffTop + lineSpacing * 2);
    
    // 判定ライン
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(judgeLineX, staffTop - lineSpacing);
    ctx.lineTo(judgeLineX, staffTop + staffHeight + lineSpacing);
    ctx.stroke();
    
    // 正規化された時間
    const normalizedTime = ((currentTime % loopDuration) + loopDuration) % loopDuration;
    
    // Harmonyテキストを描画
    if (harmonyMarkers.length > 0) {
      for (const marker of harmonyMarkers) {
        let timeUntilHit = marker.time - normalizedTime;
        
        // ループ境界を考慮
        if (timeUntilHit < -loopDuration / 2) {
          timeUntilHit += loopDuration;
        } else if (timeUntilHit > loopDuration / 2) {
          timeUntilHit -= loopDuration;
        }
        
        // 表示範囲内のみ描画
        if (timeUntilHit >= -0.5 && timeUntilHit <= lookAheadTime) {
          const x = judgeLineX + timeUntilHit * noteSpeed;
          
          // Harmonyテキストを五線譜の上に表示
          ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
          ctx.font = `bold ${Math.max(12, lineSpacing * 0.8)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(marker.text, x, staffTop - 8);
        }
      }
    }
    
    // ノーツを描画
    taikoNotes.forEach((note, index) => {
      let timeUntilHit = note.hitTime - normalizedTime;
      
      // ループ境界を考慮
      if (timeUntilHit < -loopDuration / 2) {
        timeUntilHit += loopDuration;
      } else if (timeUntilHit > loopDuration / 2) {
        timeUntilHit -= loopDuration;
      }
      
      // 表示範囲外はスキップ
      if (timeUntilHit < -0.5 || timeUntilHit > lookAheadTime) return;
      
      const x = judgeLineX + timeUntilHit * noteSpeed;
      const noteRadius = lineSpacing * 0.4;
      
      // ヒット済みノーツは半透明で表示
      const alpha = note.isHit ? 0.3 : (index < currentNoteIndex ? 0.3 : 1);
      
      // 複数音の場合（noteNamesが複数）は縦に並べる
      const noteNames = note.chord.noteNames || [note.chord.root];
      const midiNotes = note.chord.notes || [];
      
      // 各音を描画
      midiNotes.forEach((midi, noteIdx) => {
        const y = midiToY(midi);
        
        // 加線が必要な場合は描画
        const noteInOctave = midi % 12;
        const octave = Math.floor(midi / 12) - 1;
        
        // C4より下の場合
        if (midi < 64) { // E4より下
          const ledgerY = staffTop + 4 * lineSpacing;
          if (midi <= 60) { // C4以下
            ctx.strokeStyle = `rgba(148, 163, 184, ${0.6 * alpha})`;
            ctx.lineWidth = 1;
            for (let ledger = 60; ledger >= midi; ledger -= 2) {
              const ly = midiToY(ledger);
              if (ly > ledgerY) {
                ctx.beginPath();
                ctx.moveTo(x - noteRadius * 1.5, ly);
                ctx.lineTo(x + noteRadius * 1.5, ly);
                ctx.stroke();
              }
            }
          }
        }
        // F5より上の場合も同様に加線を描画
        if (midi > 77) {
          const ledgerY = staffTop;
          ctx.strokeStyle = `rgba(148, 163, 184, ${0.6 * alpha})`;
          ctx.lineWidth = 1;
          for (let ledger = 79; ledger <= midi; ledger += 2) {
            const ly = midiToY(ledger);
            if (ly < ledgerY) {
              ctx.beginPath();
              ctx.moveTo(x - noteRadius * 1.5, ly);
              ctx.lineTo(x + noteRadius * 1.5, ly);
              ctx.stroke();
            }
          }
        }
        
        // 音符の玉を描画（楕円形）
        ctx.fillStyle = index === currentNoteIndex 
          ? `rgba(251, 191, 36, ${alpha})`  // 現在のノーツは黄色
          : `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(x, y, noteRadius, noteRadius * 0.7, -0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // 符幹（棒）を描画
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (midi >= 71) { // B4以上は下向き
          ctx.moveTo(x - noteRadius + 1, y);
          ctx.lineTo(x - noteRadius + 1, y + lineSpacing * 3);
        } else { // それ以外は上向き
          ctx.moveTo(x + noteRadius - 1, y);
          ctx.lineTo(x + noteRadius - 1, y - lineSpacing * 3);
        }
        ctx.stroke();
        
        // シャープ/フラット記号
        const isSharp = [1, 3, 6, 8, 10].includes(noteInOctave);
        if (isSharp) {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.font = `${lineSpacing}px serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText('♯', x - noteRadius - 2, y);
        }
      });
    });
    
    // 次フレームをスケジュール
    animationRef.current = requestAnimationFrame(draw);
  }, [taikoNotes, currentNoteIndex, loopInfo, staffParams, midiToY, width, height, pixelRatio, harmonyMarkers]);
  
  // キャンバスの初期化とアニメーションループ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // キャンバスサイズの設定
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.max(1, Math.floor(width * pixelRatio));
    canvas.height = Math.max(1, Math.floor(height * pixelRatio));
    
    // アニメーションループ開始
    animationRef.current = requestAnimationFrame(draw);
    
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [width, height, pixelRatio, draw]);
  
  return (
    <canvas
      ref={canvasRef}
      className={cn('block', className)}
      style={{ width, height }}
    />
  );
};

export default FantasySheetMusicDisplay;
