/**
 * リズムレーンコンポーネント
 * 太鼓の達人のような右から左に流れるレーンUIを実装
 */

import React, { useMemo } from 'react';
import type { ChordDefinition } from './FantasyGameEngine';

interface RhythmNote {
  chord: ChordDefinition;
  measure: number;
  beat: number;
  timing: number; // ミリ秒単位のタイミング
  judged: boolean;
}

interface RhythmLaneProps {
  rhythmChords: RhythmNote[];
  currentTime: number;
  laneWidth: number;
  laneHeight: number;
  noteSpeed?: number; // ノートが流れる速度（ピクセル/秒）
  judgmentLinePosition?: number; // 判定ラインの位置（左からの%）
}

export const RhythmLane: React.FC<RhythmLaneProps> = ({
  rhythmChords,
  currentTime,
  laneWidth,
  laneHeight,
  noteSpeed = 200, // デフォルト: 200px/秒（ゆっくり）
  judgmentLinePosition = 20 // デフォルト: 左から20%の位置
}) => {

  // 表示するノートを計算（現在時刻から前後3秒の範囲）
  const visibleNotes = useMemo(() => {
    const visibleRange = 3000; // 3秒先まで表示
    const pastRange = 1000; // 1秒前まで表示
    
    return rhythmChords.filter(note => {
      const timeDiff = note.timing - currentTime;
      return timeDiff >= -pastRange && timeDiff <= visibleRange;
    });
  }, [rhythmChords, currentTime]);

  // 判定ラインの位置（ピクセル）
  const judgmentLineX = (laneWidth * judgmentLinePosition) / 100;

  return (
    <div className="relative overflow-hidden bg-gray-900/50 rounded-lg border border-gray-700" 
         style={{ width: laneWidth, height: laneHeight }}>
      
      {/* レーン背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800/30 via-gray-700/20 to-gray-800/30" />
      
      {/* 判定ライン */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
        style={{ left: `${judgmentLinePosition}%` }}
      >
        {/* 判定エリアの視覚的表示 */}
        <div 
          className="absolute top-0 bottom-0 bg-green-400/20 -translate-x-1/2"
          style={{ 
            left: '50%',
            width: '80px' // 判定ウィンドウ400ms = 左右200ms
          }}
        />
      </div>
      
      {/* ノート */}
      {visibleNotes.map((note, index) => {
        const timeDiff = note.timing - currentTime;
        const xPosition = judgmentLineX + (timeDiff / 1000) * noteSpeed;
        
        // 判定ウィンドウ内かどうか
        const inJudgmentWindow = Math.abs(timeDiff) <= 200;
        
        return (
          <div
            key={`${note.measure}-${note.beat}-${index}`}
            className={`
              absolute 
              ${note.judged ? 'opacity-30' : 'opacity-100'}
            `}
            style={{ 
              left: `${xPosition}px`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              transition: 'none' // スムーズな動きのためtransitionを削除
            }}
          >
            {/* ノートの円 */}
            <div 
              className={`
                relative rounded-full border-4 
                ${inJudgmentWindow 
                  ? 'border-green-400 bg-green-400/30 shadow-[0_0_20px_rgba(74,222,128,0.8)]' 
                  : 'border-blue-400 bg-blue-900/50'
                }
                transition-all duration-200
              `}
              style={{ 
                width: '60px', 
                height: '60px',
                animation: inJudgmentWindow ? 'pulse 0.3s ease-in-out' : 'none'
              }}
            >
              {/* コード名 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`
                  font-bold text-white
                  ${note.chord.displayName.length > 3 ? 'text-xs' : 'text-sm'}
                `}>
                  {note.chord.displayName}
                </span>
              </div>
            </div>
            
            {/* 小節・拍情報（デバッグ用、本番では非表示にできる） */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 whitespace-nowrap">
              M{note.measure} B{note.beat}
            </div>
          </div>
        );
      })}
      
      {/* レーン上部の小節線 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gray-600" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-600" />
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1) translateX(-50%) translateY(-50%); }
          50% { transform: scale(1.1) translateX(-50%) translateY(-50%); }
          100% { transform: scale(1) translateX(-50%) translateY(-50%); }
        }
      `}</style>
    </div>
  );
};