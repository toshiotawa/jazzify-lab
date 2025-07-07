import React, { useEffect, useState } from 'react';
import { useChords, useGameStore } from '@/stores/gameStore';

const ChordOverlay: React.FC = () => {
  const chords = useChords();
  const [currentChord, setCurrentChord] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const time = useGameStore.getState().currentTime;
      const chord = chords.find(
        (c) => time >= c.startTime && (c.endTime === undefined || time < c.endTime)
      );
      setCurrentChord(chord ? chord.symbol.displayText : '');
    }, 100);
    return () => clearInterval(interval);
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
