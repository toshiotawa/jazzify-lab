import React, { useEffect, useState, useRef } from 'react';
import { useChords, useGameStore } from '@/stores/gameStore';

const ChordOverlay: React.FC = () => {
  const chords = useChords();
  const [currentChord, setCurrentChord] = useState('');
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const updateChord = () => {
      const time = useGameStore.getState().currentTime;
      const chord = chords.find(
        (c) => time >= c.startTime && (c.endTime === undefined || time < c.endTime)
      );
      setCurrentChord(chord ? chord.symbol.displayText : '');
      
      // 次のフレームをスケジュール
      rafRef.current = requestAnimationFrame(updateChord);
    };
    
    // ループ開始
    rafRef.current = requestAnimationFrame(updateChord);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [chords]);

  // 楽曲が切り替わったら即座にクリア
  useEffect(() => {
    setCurrentChord('');
  }, [chords]);

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-start justify-center"
      style={{ top: '40%' }}
    >
      <div className="text-white text-4xl font-bold bg-black bg-opacity-40 px-4 rounded">
        {currentChord}
      </div>
    </div>
  );
};

export default ChordOverlay;
