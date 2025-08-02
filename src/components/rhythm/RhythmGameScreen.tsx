/* 極小 UI – 太鼓風譜面は未実装で Placeholder */
import React from 'react';
import RhythmEngine from './RhythmEngine';
import PIXIRhythmRenderer from './PIXIRhythmRenderer';
import { useRhythmStore } from '@/stores/rhythmStore';
import { useTimeStore } from '@/stores/timeStore';
import type { FantasyStage } from '@/types';

interface Props {
  stage: FantasyStage;
  onBack: () => void;
}

const RhythmGameScreen = ({ stage, onBack }: Props) => {
  const { currentBeat, currentMeasure, isCountIn } = useTimeStore();
  const { questions } = useRhythmStore();
  const [now, setNow] = React.useState(performance.now());

  // Update current time for animation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(performance.now());
    }, 16); // ~60fps
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <header className="text-center py-1 text-sm">
        {isCountIn
          ? `M / - B ${currentBeat}`
          : `M ${currentMeasure} - B ${currentBeat}`}
      </header>

      {/* ノーツエリア */}
      <div className="flex-1 relative overflow-hidden">
        <PIXIRhythmRenderer
          width={window.innerWidth}
          height={120}
          questions={questions}
          now={now}
        />
      </div>

      <footer className="flex justify-between p-2">
        <button onClick={onBack} className="bg-gray-700 px-3 py-1 rounded">
          戻る
        </button>
        <span className="text-xs opacity-60">
          Notes: {questions.length}
        </span>
      </footer>

      <RhythmEngine
        stage={stage}
        onSuccess={() => {/* TODO: Handle success */}}
        onMiss={() => {/* TODO: Handle miss */}}
      />
    </div>
  );
};

export default RhythmGameScreen;