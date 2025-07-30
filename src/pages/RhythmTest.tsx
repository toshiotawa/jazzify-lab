import React, { useState } from 'react';
import { rhythmTestStages } from '@/data/rhythmTestStages';
import FantasyGameScreen from '@/components/fantasy/FantasyGameScreen';

const RhythmTest: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  if (selectedStage !== null) {
    const stage = rhythmTestStages[selectedStage];
    console.log('🎵 RhythmTest: Selected stage:', {
      stage_number: stage.stage_number,
      gameMode: stage.gameMode,
      pattern_type: stage.pattern_type,
      music_meta: stage.music_meta,
      audio_url: stage.audio_url
    });
    return (
      <FantasyGameScreen
        stage={stage as any}
        autoStart={false}
        onGameComplete={(result, score, correctAnswers, totalQuestions) => {
          console.log('Game completed:', { result, score, correctAnswers, totalQuestions });
          setSelectedStage(null);
        }}
        onBackToStageSelect={() => {
          setSelectedStage(null);
        }}
        noteNameLang="en"
        simpleNoteName={false}
        lessonMode={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">リズムモード テストステージ</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rhythmTestStages.map((stage, index) => (
          <div
            key={stage.id}
            className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
            onClick={() => setSelectedStage(index)}
          >
            <h2 className="text-xl font-semibold mb-2">{stage.stage_number}</h2>
            <h3 className="text-lg mb-2">{stage.name}</h3>
            <p className="text-gray-400 text-sm mb-4">{stage.description}</p>
            <div className="text-sm space-y-1">
              <p>BPM: {stage.music_meta?.bpm}</p>
              <p>拍子: {stage.music_meta?.timeSig}/4</p>
              <p>小節数: {stage.music_meta?.bars}</p>
              <p>パターン: {stage.pattern_type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RhythmTest;