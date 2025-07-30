import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import DrumPads from './DrumPads';
import RhythmNotesRenderer from './RhythmNotesRenderer';
import RhythmControlBar from './RhythmControlBar';
import RhythmScoreDisplay from './RhythmScoreDisplay';
import RhythmPatternSelector from './RhythmPatternSelector';
import { motion } from 'framer-motion';

/**
 * リズムモードのメイン画面コンポーネント
 */
const RhythmModeScreen: React.FC = () => {
  const { isPlaying, currentTab } = useGameStore((state) => ({
    isPlaying: state.isPlaying,
    currentTab: state.currentTab,
  }));
  
  const rhythmState = useGameStore((state) => state.rhythmState);
  const [showPatternSelector, setShowPatternSelector] = useState(!rhythmState.pattern);

  // タブが切り替わったらパターンセレクターを表示
  useEffect(() => {
    if (currentTab === 'songs') {
      setShowPatternSelector(true);
    }
  }, [currentTab]);

  return (
    <div className="rhythm-mode-screen h-full flex flex-col bg-gradient-to-b from-gray-900 to-black">
      {/* ヘッダー部分 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl">🥁</span>
            リズムモード
          </h2>
          <RhythmScoreDisplay />
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showPatternSelector || !rhythmState.pattern ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 p-4"
          >
            <RhythmPatternSelector
              onSelectPattern={() => setShowPatternSelector(false)}
            />
          </motion.div>
        ) : (
          <>
            {/* ゲームエリア */}
            <div className="flex-1 relative">
              {/* ノーツ降下エリア */}
              <div className="absolute inset-0">
                <RhythmNotesRenderer />
              </div>
              
              {/* ドラムパッド（下部に配置） */}
              <div className="absolute bottom-0 left-0 right-0 z-10">
                <DrumPads />
              </div>
            </div>

            {/* コントロールバー */}
            <div className="flex-shrink-0 border-t border-gray-800">
              <RhythmControlBar
                onOpenPatternSelector={() => setShowPatternSelector(true)}
              />
            </div>
          </>
        )}
      </div>

      {/* メトロノーム表示（オプション） */}
      {rhythmState.isMetronomeOn && rhythmState.settings.visualMetronome && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
          <MetronomeIndicator
            beat={rhythmState.currentBeat}
            timeSignature={rhythmState.pattern?.timeSignature}
          />
        </div>
      )}
    </div>
  );
};

/**
 * メトロノーム表示コンポーネント
 */
const MetronomeIndicator: React.FC<{
  beat: number;
  timeSignature?: { numerator: number; denominator: number };
}> = ({ beat, timeSignature }) => {
  const beatsPerMeasure = timeSignature?.numerator || 4;
  const currentBeatInMeasure = beat % beatsPerMeasure;

  return (
    <div className="flex gap-2 p-2 bg-black/50 rounded-lg backdrop-blur">
      {Array.from({ length: beatsPerMeasure }).map((_, index) => (
        <motion.div
          key={index}
          className={`w-3 h-3 rounded-full ${
            index === 0 ? 'bg-red-500' : 'bg-gray-500'
          }`}
          animate={{
            scale: index === currentBeatInMeasure ? 1.5 : 1,
            opacity: index === currentBeatInMeasure ? 1 : 0.5,
          }}
          transition={{ duration: 0.1 }}
        />
      ))}
    </div>
  );
};

export default RhythmModeScreen;