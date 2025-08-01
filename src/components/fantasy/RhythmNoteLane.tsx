/**
 * リズムモード用ノートレーンコンポーネント
 * 太鼓の達人風の右から左に流れるレーンUI
 */

import React, { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { useTimeStore } from '@/stores/timeStore';
import type { ChordDefinition } from './FantasyGameEngine';

interface RhythmNote {
  chord: ChordDefinition;
  measure: number;
  beat: number;
  timing: number;  // ミリ秒単位のタイミング
  judged: boolean;
  success?: boolean;
}

interface RhythmNoteLaneProps {
  notes: RhythmNote[];
  currentIndex: number;
  judgmentWindows: {
    chordId: string;
    startTime: number;
    endTime: number;
    judged: boolean;
    success: boolean;
  }[];
  className?: string;
  isReady: boolean;
}

const RhythmNoteLane: React.FC<RhythmNoteLaneProps> = ({
  notes,
  currentIndex,
  judgmentWindows,
  className,
  isReady
}) => {
  const { startAt } = useTimeStore();
  const currentTime = startAt ? performance.now() - startAt : 0;
  
  // 表示するノーツ（現在の位置から前後のノーツ）
  const visibleNotes = useMemo(() => {
    if (!notes.length) return [];
    
    // 3秒先まで表示
    const lookAheadTime = 3000;
    const lookBehindTime = 500;
    
    return notes.filter(note => {
      const timeDiff = note.timing - currentTime;
      return timeDiff >= -lookBehindTime && timeDiff <= lookAheadTime;
    });
  }, [notes, currentTime]);
  
  // レーンの幅とスピード
  const laneWidth = 800;
  const noteSpeed = laneWidth / 3000; // 3秒でレーンを横断
  
  return (
    <div className={cn(
      "relative w-full h-32 bg-gray-900/50 border-y-2 border-gray-700 overflow-hidden",
      className
    )}>
      {/* レーン背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800/20 via-transparent to-gray-800/20" />
      
      {/* 判定ライン */}
      <div className="absolute left-24 top-0 bottom-0 w-0.5 bg-white/80 z-10">
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-white/60 bg-white/10" />
      </div>
      
      {/* ノーツ */}
      {visibleNotes.map((note, index) => {
        const timeDiff = note.timing - currentTime;
        const xPosition = 96 + timeDiff * noteSpeed; // 判定ラインの位置 + 時間差 * スピード
        
        // 対応する判定ウィンドウを探す
        const window = judgmentWindows.find(w => w.chordId === note.chord.id && Math.abs(w.startTime - note.timing + 200) < 10);
        const isInWindow = timeDiff >= -200 && timeDiff <= 200;
        const isJudged = window?.judged || false;
        const isSuccess = window?.success || false;
        
        return (
          <div
            key={`${note.measure}-${note.beat}-${index}`}
            className="absolute top-1/2 -translate-y-1/2 transition-opacity duration-150"
            style={{
              left: `${xPosition}px`,
              opacity: isJudged ? (isSuccess ? 0 : 0.3) : 1
            }}
          >
            {/* ノーツ本体 */}
            <div className={cn(
              "relative w-16 h-16 rounded-full flex items-center justify-center font-bold text-sm",
              "border-2 transition-all duration-100",
              isInWindow && !isJudged ? "border-yellow-400 bg-yellow-500/20 scale-110" : 
              isSuccess ? "border-green-400 bg-green-500/20" :
              isJudged ? "border-red-400 bg-red-500/20" :
              "border-blue-400 bg-blue-500/20"
            )}>
              {/* コード名 */}
              <span className={cn(
                "text-white drop-shadow-md",
                isInWindow && !isJudged && "text-yellow-100"
              )}>
                {note.chord.displayName}
              </span>
              
              {/* 判定結果表示 */}
              {isJudged && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {isSuccess ? (
                    <span className="text-green-400 text-2xl font-bold">✓</span>
                  ) : (
                    <span className="text-red-400 text-2xl font-bold">✗</span>
                  )}
                </div>
              )}
            </div>
            
            {/* タイミングガイド（小節・拍表示） */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-400">
              {note.measure}-{note.beat}
            </div>
          </div>
        );
      })}
      
      {/* レーン枠線 */}
      <div className="absolute inset-0 border-2 border-gray-700/50 pointer-events-none" />
      
      {/* Ready表示 */}
      {isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="text-4xl font-bold text-white animate-pulse">READY</div>
        </div>
      )}
    </div>
  );
};

export default RhythmNoteLane;