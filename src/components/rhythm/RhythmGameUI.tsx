/**
 * RhythmGameUI - リズムゲーム用の統合UI
 */

import React from 'react';
import { useRhythmGameState, useRhythmEnemies, useRhythmScore, useRhythmJudgment } from '@/stores/rhythmStore';
import { EnemyGaugeMarker } from './EnemyGaugeMarker';
import { BeatMarker } from './BeatMarker';

interface RhythmGameUIProps {
  stage: {
    name: string;
    stageNumber: string;
    showGuide: boolean;
  };
  playerHp: number;
  maxHp: number;
  onBackToStageSelect: () => void;
  className?: string;
}

export const RhythmGameUI: React.FC<RhythmGameUIProps> = ({
  stage,
  playerHp,
  maxHp,
  onBackToStageSelect,
  className = '',
}) => {
  const rhythmGameState = useRhythmGameState();
  const rhythmEnemies = useRhythmEnemies();
  const rhythmScore = useRhythmScore();
  const rhythmJudgment = useRhythmJudgment();

  return (
    <div className={`rhythm-game-ui min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 text-white ${className}`}>
      {/* ヘッダー */}
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-30">
        <button
          onClick={onBackToStageSelect}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          ← 戻る
        </button>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold">{stage.name}</h1>
          <p className="text-sm text-gray-300">ステージ {stage.stageNumber}</p>
        </div>
        
        <div className="text-right">
          <div className="text-sm">Score: {rhythmScore.score}</div>
          <div className="text-sm">Combo: {rhythmScore.combo}</div>
        </div>
      </div>

      {/* プレイヤーHP */}
      <div className="px-4 py-2 bg-black bg-opacity-20">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm">HP:</span>
          {Array.from({ length: maxHp }, (_, i) => (
            <span
              key={i}
              className={`text-2xl ${i < playerHp ? 'text-red-500' : 'text-gray-600'}`}
            >
              ♥
            </span>
          ))}
        </div>
      </div>

      {/* リズム情報表示 */}
      <div className="px-4 py-4">
        <BeatMarker
          currentBeat={rhythmGameState.currentBeat}
          timeSignature={rhythmGameState.timeSignature}
          bpm={rhythmGameState.bpm}
          className="mb-6"
        />
        
        {/* 現在の期待コード表示 */}
        {rhythmJudgment.currentExpectedChord && (
          <div className="text-center mb-4">
            <div className="inline-block bg-yellow-600 text-black px-6 py-3 rounded-lg text-2xl font-bold">
              {rhythmJudgment.currentExpectedChord}
            </div>
            <div className="text-sm text-gray-300 mt-1">
              演奏してください
            </div>
          </div>
        )}
      </div>

      {/* 敵エリア */}
      <div className="px-4 py-6">
        <h2 className="text-lg font-bold mb-4 text-center">モンスター</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {rhythmEnemies.map((enemy) => (
            <div key={enemy.id} className="bg-black bg-opacity-30 rounded-lg p-4">
              <div className="text-center mb-2">
                <div className="text-lg">👾</div>
                <div className="text-sm font-bold">
                  {String.fromCharCode(65 + enemy.position)}
                </div>
              </div>
              
              <EnemyGaugeMarker
                enemy={enemy}
                className="mb-2"
              />
              
              {enemy.isActive && (
                <div className="text-center">
                  <div className="text-xs text-gray-400">
                    {enemy.assignedChord ? `狙い: ${enemy.assignedChord}` : '待機中'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ガイド表示 */}
      {stage.showGuide && (
        <div className="px-4 py-4 bg-black bg-opacity-20">
          <div className="text-center text-sm text-gray-300">
            <p>🎵 リズムに合わせてコードを演奏しよう！</p>
            <p>⏰ 黄色いマーカーのタイミングで判定されます</p>
            <p>🎯 ±200ms以内で成功です</p>
          </div>
        </div>
      )}

      {/* デバッグ情報（開発時のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 p-2 rounded text-xs">
          <div>Playing: {rhythmGameState.isPlaying ? 'Yes' : 'No'}</div>
          <div>Time: {rhythmGameState.currentTime.toFixed(2)}s</div>
          <div>Measure: {rhythmGameState.currentMeasure}</div>
          <div>Beat: {rhythmGameState.currentBeat.toFixed(2)}</div>
          <div>Pattern: {rhythmGameState.rhythmPattern}</div>
          <div>In Window: {rhythmJudgment.isInJudgmentWindow ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default RhythmGameUI;