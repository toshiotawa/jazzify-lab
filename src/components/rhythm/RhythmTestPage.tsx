/**
 * RhythmTestPage - リズムモードの動作テスト用ページ
 */

import React, { useState } from 'react';
import { FantasyGameMode } from '../fantasy/FantasyGameMode';
import { sampleRhythmStageRandom, sampleRhythmStageProgression, sampleQuizStage } from '@/data/sampleRhythmStage';

export const RhythmTestPage: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<'random' | 'progression' | 'quiz' | null>(null);

  const handleGameComplete = (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => {
    alert(`ゲーム終了: ${result}\nスコア: ${score}\n正解数: ${correctAnswers}/${totalQuestions}`);
    setSelectedStage(null);
  };

  const handleBackToStageSelect = () => {
    setSelectedStage(null);
  };

  if (selectedStage) {
    const stage = selectedStage === 'random' ? sampleRhythmStageRandom :
                  selectedStage === 'progression' ? sampleRhythmStageProgression :
                  sampleQuizStage;

    return (
      <FantasyGameMode
        stage={stage}
        autoStart={false}
        onGameComplete={handleGameComplete}
        onBackToStageSelect={handleBackToStageSelect}
        noteNameLang="en"
        simpleNoteName={false}
        lessonMode={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          リズムゲーム テストページ
        </h1>
        
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {/* ランダムパターン */}
          <div className="bg-black bg-opacity-30 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">
              リズムモード
            </h2>
            <div className="text-center mb-4">
              <span className="text-4xl">🥁</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">ランダムパターン</h3>
            <p className="text-sm text-gray-300 mb-4">
              1小節に1回、ランダムにコードが出題されます
            </p>
            <ul className="text-sm text-gray-300 mb-6 space-y-1">
              <li>• BPM: 120</li>
              <li>• 拍子: 4/4</li>
              <li>• 敵数: 20体</li>
              <li>• 同時出現: 4体</li>
            </ul>
            <button
              onClick={() => setSelectedStage('random')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              開始
            </button>
          </div>

          {/* プログレッションパターン */}
          <div className="bg-black bg-opacity-30 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">
              リズムモード
            </h2>
            <div className="text-center mb-4">
              <span className="text-4xl">🎵</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">プログレッションパターン</h3>
            <p className="text-sm text-gray-300 mb-4">
              指定されたタイミングで順番にコードが出題されます
            </p>
            <ul className="text-sm text-gray-300 mb-6 space-y-1">
              <li>• BPM: 100</li>
              <li>• 拍子: 4/4</li>
              <li>• 敵数: 16体</li>
              <li>• パターン: C-G-Am-F</li>
            </ul>
            <button
              onClick={() => setSelectedStage('progression')}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              開始
            </button>
          </div>

          {/* クイズモード */}
          <div className="bg-black bg-opacity-30 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">
              クイズモード
            </h2>
            <div className="text-center mb-4">
              <span className="text-4xl">🐉</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">従来のモード</h3>
            <p className="text-sm text-gray-300 mb-4">
              既存のクイズタイプでの動作確認
            </p>
            <ul className="text-sm text-gray-300 mb-6 space-y-1">
              <li>• リアルタイム判定</li>
              <li>• 敵数: 10体</li>
              <li>• 同時出現: 1体</li>
              <li>• 音楽なし</li>
            </ul>
            <button
              onClick={() => setSelectedStage('quiz')}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
            >
              開始
            </button>
          </div>
        </div>

        <div className="mt-12 max-w-2xl mx-auto bg-black bg-opacity-20 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">操作方法</h2>
          <div className="space-y-2 text-sm">
            <p><strong>MIDI接続:</strong> MIDIキーボードが接続されていれば自動認識されます</p>
            <p><strong>リズムモード:</strong> 音楽に合わせて表示されたコードを演奏してください</p>
            <p><strong>判定タイミング:</strong> 黄色いマーカーが判定ポイントです（±200ms）</p>
            <p><strong>HP:</strong> 失敗するとHPが減少し、0になるとゲームオーバーです</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RhythmTestPage;