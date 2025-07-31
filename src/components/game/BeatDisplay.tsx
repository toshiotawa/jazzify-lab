import React from 'react';
import { motion } from 'framer-motion';
import { useBgmStore } from '@/stores/bgmStore';

export const BeatDisplay: React.FC = () => {
  const { currentMeasure, currentBeat, beatsPerMeasure, isPlaying } = useBgmStore();
  
  if (!isPlaying) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-black/70 backdrop-blur-sm rounded-lg px-6 py-3"
    >
      <div className="flex items-center gap-4 text-white">
        <div className="text-sm font-medium opacity-80">小節</div>
        <div className="text-2xl font-bold">{currentMeasure}</div>
        <div className="w-px h-6 bg-white/30" />
        <div className="text-sm font-medium opacity-80">拍</div>
        <div className="flex gap-1">
          {Array.from({ length: beatsPerMeasure }, (_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: i + 1 === currentBeat ? 1.2 : 1,
                opacity: i + 1 <= currentBeat ? 1 : 0.3
              }}
              transition={{ duration: 0.1 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                i + 1 === currentBeat
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/20 text-white/60'
              }`}
            >
              {i + 1}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};