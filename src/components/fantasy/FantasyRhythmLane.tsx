/**
 * ファンタジーリズムレーン
 * 太鼓の達人風のノーツ表示UIコンポーネント
 */

import React, { useMemo } from 'react';
import { useTimeStore } from '@/stores/timeStore';

interface ChordNote {
  chord: {
    id: string;
    displayName: string;
  };
  measure: number;
  beat: number;
  timingMs: number;
  status: 'pending' | 'success' | 'miss';
}

interface RhythmLaneProps {
  chordEvents: ChordNote[];
  laneWidth?: number;
  noteSpeed?: number; // ピクセル/秒
  bpm?: number;
  combo?: number;
}

const JUDGMENT_LINE_POSITION = 150; // 判定ラインの位置（左から）
const NOTE_SIZE = 60; // ノーツのサイズ

export const FantasyRhythmLane: React.FC<RhythmLaneProps> = ({
  chordEvents,
  laneWidth = 800,
  noteSpeed = 300,
  bpm = 120,
  combo = 0
}) => {
  const { startAt, readyDuration, isCountIn } = useTimeStore();
  
  // 現在の経過時間を計算
  const currentTime = useMemo(() => {
    if (!startAt || isCountIn) return 0;
    return performance.now() - startAt - readyDuration;
  }, [startAt, readyDuration, isCountIn]);

  // ノーツの位置を計算
  const notePositions = useMemo(() => {
    return chordEvents.map(event => {
      const timeUntilNote = event.timingMs - currentTime;
      const xPosition = JUDGMENT_LINE_POSITION + (timeUntilNote / 1000) * noteSpeed;
      
      return {
        ...event,
        x: xPosition,
        visible: xPosition > -NOTE_SIZE && xPosition < laneWidth
      };
    });
  }, [chordEvents, currentTime, noteSpeed, laneWidth]);

  return (
    <div className="relative w-full h-32 overflow-hidden bg-gray-900 rounded-lg">
      {/* レーン背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-50" />
      
      {/* レーンライン */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-600" />
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-700 -translate-y-1/2" />
      
      {/* 判定ライン */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-yellow-400"
        style={{ left: `${JUDGMENT_LINE_POSITION}px` }}
      >
        {/* 判定エリアの円 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 rounded-full border-4 border-yellow-400 bg-yellow-400/20" />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-yellow-300 animate-pulse" />
        </div>
      </div>
      
      {/* ノーツ */}
      {notePositions.map((note, index) => {
        if (!note.visible) return null;
        
        const noteColor = note.status === 'success' ? 'bg-green-500' : 
                         note.status === 'miss' ? 'bg-red-500' : 
                         'bg-blue-500';
        
        const noteOpacity = note.status === 'success' ? 'opacity-50' :
                           note.status === 'miss' ? 'opacity-30' :
                           'opacity-100';
        
        return (
          <div
            key={`${note.chord.id}-${note.measure}-${note.beat}-${index}`}
            className={`absolute top-1/2 -translate-y-1/2 transition-all duration-100 ${noteOpacity}`}
            style={{
              left: `${note.x - NOTE_SIZE / 2}px`,
              width: `${NOTE_SIZE}px`,
              height: `${NOTE_SIZE}px`
            }}
          >
            {/* ノーツの円 */}
            <div className={`w-full h-full rounded-full ${noteColor} shadow-lg relative`}>
              {/* 内側の円 */}
              <div className="absolute inset-2 rounded-full bg-white/20" />
              
              {/* コード名 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-lg drop-shadow-md">
                  {note.chord.displayName}
                </span>
              </div>
              
              {/* 成功/失敗エフェクト */}
              {note.status === 'success' && (
                <div className="absolute inset-0 rounded-full animate-ping bg-green-400" />
              )}
              {note.status === 'miss' && (
                <div className="absolute inset-0 rounded-full animate-ping bg-red-400" />
              )}
            </div>
          </div>
        );
      })}
      
      {/* スコア表示エリア（左上） */}
      <div className="absolute top-2 left-2 text-white">
        <div className="text-xs opacity-70">COMBO</div>
        <div className="text-xl font-bold">{combo}</div>
      </div>
      
      {/* BPM表示（右上） */}
      <div className="absolute top-2 right-2 text-white text-xs opacity-70">
        BPM {bpm}
      </div>
    </div>
  );
};

export default FantasyRhythmLane;