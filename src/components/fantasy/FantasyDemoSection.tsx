import React, { lazy, Suspense, useMemo, useState, useCallback } from 'react';
import type { FantasyStage as EngineFantasyStage } from './FantasyGameEngine';

const FantasyGameScreen = lazy(() => import('./FantasyGameScreen'));

const FantasyDemoSection: React.FC = () => {
  const [loadDemo, setLoadDemo] = useState(false);

  const stage = useMemo<EngineFantasyStage>(() => ({
    id: 'demo-1-1',
    stageNumber: '1-1',
    name: 'はじまりの森',
    description: '基本的なメジャーコードに挑戦！',
    maxHp: 5,
    enemyGaugeSeconds: 6,
    enemyCount: 1,
    enemyHp: 5,
    minDamage: 1,
    maxDamage: 1,
    mode: 'single',
    allowedChords: ['C', 'F', 'G', 'Am'],
    showSheetMusic: false,
    showGuide: true,
    monsterIcon: 'dragon',
    bgmUrl: '/demo-1.mp3',
    simultaneousMonsterCount: 1,
    bpm: 120,
    measureCount: 8,
    countInMeasures: 0,
    timeSignature: 4,
    playRootOnCorrect: true,
  }), []);

  const handleBack = useCallback(() => {
    setLoadDemo(false);
  }, []);

  return (
    <div className="container mx-auto px-6">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 section-title flex items-center justify-center gap-4">
        <img src="/stage_icons/1.png" alt="ファンタジーモード デモ" className="w-16 h-16" />
        ファンタジーモード デモ (1-1)
      </h2>
      <p className="text-center text-purple-200 mb-6">MIDIキーボード、タッチ、またはクリックでプレイできます。</p>

      {!loadDemo && (
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-slate-900/60 p-6 flex flex-col items-center">
            <div className="w-full h-48 sm:h-56 md:h-64 flex items-center justify-center text-gray-400 bg-slate-800/40 rounded-lg mb-6">
              デモプレビュー
            </div>
            <button
              onClick={() => setLoadDemo(true)}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition text-sm font-bold"
            >
              デモを読み込む
            </button>
          </div>
        </div>
      )}

      {loadDemo && (
        <div className="relative max-w-6xl mx-auto rounded-2xl overflow-hidden border border-purple-500/30 bg-slate-900/60 p-2">
          <Suspense
            fallback={
              <div className="w-full h-[520px] flex items-center justify-center text-gray-400">読み込み中...</div>
            }
          >
            <div className="w-full min-h-[520px]">
              <FantasyGameScreen
                stage={stage}
                autoStart={false}
                onGameComplete={() => { /* no-op for demo */ }}
                onBackToStageSelect={handleBack}
              />
            </div>
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default FantasyDemoSection;