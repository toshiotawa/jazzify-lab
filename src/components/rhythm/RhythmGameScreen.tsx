/* Rhythm モード UI 完全版 – 太鼓風譜面 */
import { useEffect, useState, useCallback } from 'react';
import RhythmEngine from './RhythmEngine';
import PIXIRhythmRenderer from './PIXIRhythmRenderer';
import { useRhythmStore } from '@/stores/rhythmStore';
import { useTimeStore } from '@/stores/timeStore';
import type { FantasyStage } from '@/components/fantasy/FantasyGameEngine';

interface Props {
  stage: FantasyStage;
  onBack: () => void;
}

const RhythmGameScreen = ({ stage, onBack }: Props) => {
  const { currentBeat, currentMeasure, isCountIn } = useTimeStore();
  const { questions } = useRhythmStore();
  const [now, setNow] = useState(performance.now());
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: 200 });

  // 画面リサイズ対応
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: 200 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // タイマー更新
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(performance.now());
    }, 16); // 60fps
    return () => clearInterval(timer);
  }, []);

  const handleSuccess = useCallback((chord: string) => {
    // Handle success (chord played correctly)
    void chord; // Avoid unused variable warning
  }, []);

  const handleMiss = useCallback(() => {
    // Handle miss (chord missed)
  }, []);

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <header className="text-center py-2 text-sm border-b border-gray-800">
        <div className="text-lg font-bold">{stage.name} (Rhythm)</div>
        <div>
          {isCountIn
            ? `M / - B ${currentBeat}`
            : `M ${currentMeasure} - B ${currentBeat}`}
        </div>
      </header>

      {/* ノーツエリア */}
      <div className="flex-1 relative overflow-hidden bg-gray-900">
        <div className="absolute inset-0 flex items-center justify-center">
          <PIXIRhythmRenderer
            width={dimensions.width}
            height={dimensions.height}
            questions={questions}
            now={now}
          />
        </div>
      </div>

      <footer className="flex justify-between items-center p-4 border-t border-gray-800">
        <button 
          onClick={onBack} 
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
        >
          戻る
        </button>
        <div className="text-xs opacity-60">
          <span>Pattern: {useRhythmStore.getState().pattern}</span>
          <span className="ml-4">Notes: {questions.length}</span>
        </div>
      </footer>

      <RhythmEngine
        stage={stage}
        onSuccess={handleSuccess}
        onMiss={handleMiss}
      />
    </div>
  );
};

export default RhythmGameScreen;