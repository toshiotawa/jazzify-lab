/**
 * BeatMarker - 拍を視覚的に表示するメトロノーム的なコンポーネント
 */

import React from 'react';

interface BeatMarkerProps {
  currentBeat: number;
  timeSignature: number;
  bpm: number;
  className?: string;
}

export const BeatMarker: React.FC<BeatMarkerProps> = ({
  currentBeat,
  timeSignature,
  bpm,
  className = '',
}) => {
  const beatIndex = Math.floor(currentBeat);
  const beatProgress = currentBeat - beatIndex;
  
  return (
    <div className={`beat-marker-container ${className}`}>
      {/* BPM表示 */}
      <div className="text-center mb-2">
        <span className="text-lg font-bold text-blue-600">♩ = {bpm}</span>
      </div>
      
      {/* 拍表示 */}
      <div className="flex justify-center space-x-2">
        {Array.from({ length: timeSignature }, (_, i) => (
          <div
            key={i}
            className={`beat-indicator w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-100 ${
              i === beatIndex
                ? 'bg-red-500 border-red-600 text-white scale-110'
                : i < beatIndex
                ? 'bg-green-200 border-green-400 text-green-800'
                : 'bg-gray-200 border-gray-300 text-gray-600'
            }`}
          >
            {i + 1}
            
            {/* 現在の拍の進行状況 */}
            {i === beatIndex && (
              <div 
                className="absolute inset-0 rounded-full border-2 border-yellow-400"
                style={{
                  background: `conic-gradient(yellow ${beatProgress * 360}deg, transparent ${beatProgress * 360}deg)`
                }}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* 拍子表示 */}
      <div className="text-center mt-2">
        <span className="text-sm text-gray-600">{timeSignature}/4</span>
      </div>
      
      {/* プログレスバー（オプション） */}
      <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-blue-500 h-full transition-all duration-100"
          style={{ width: `${(beatProgress * 100)}%` }}
        />
      </div>
    </div>
  );
};

export default BeatMarker;