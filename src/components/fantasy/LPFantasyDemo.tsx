import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';

const LPFantasyDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Lazy import FantasyGameScreen only when modal opens
  const FantasyGameScreen = useMemo(() => React.lazy(() => import('./FantasyGameScreen')), []);

  // Fetch 1-1 stage from DB when opening
  const loadStage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { fetchFantasyStageByNumber } = await import('@/platform/supabaseFantasyStages');
      const dbStage = await fetchFantasyStageByNumber('1-1');
      if (!dbStage) {
        throw new Error('ステージ 1-1 が見つかりませんでした');
      }
      // Map DB shape to FantasyGameScreen expected stage shape
      const mapped = {
        id: dbStage.id,
        stageNumber: dbStage.stage_number,
        name: dbStage.name,
        description: dbStage.description,
        maxHp: dbStage.max_hp,
        enemyGaugeSeconds: dbStage.enemy_gauge_seconds,
        enemyCount: dbStage.enemy_count,
        enemyHp: dbStage.enemy_hp,
        minDamage: dbStage.min_damage,
        maxDamage: dbStage.max_damage,
        mode: (dbStage as any).mode,
        allowedChords: (dbStage as any).allowed_chords,
        chordProgression: (dbStage as any).chord_progression,
        chordProgressionData: (dbStage as any).chord_progression_data,
        showSheetMusic: false,
        showGuide: dbStage.show_guide,
        simultaneousMonsterCount: dbStage.simultaneous_monster_count || 1,
        monsterIcon: 'dragon',
        bpm: (dbStage as any).bpm || 120,
        bgmUrl: dbStage.bgm_url || (dbStage as any).mp3_url || '/demo-1.mp3',
        measureCount: (dbStage as any).measure_count,
        countInMeasures: (dbStage as any).count_in_measures,
        timeSignature: (dbStage as any).time_signature,
        noteIntervalBeats: (dbStage as any).note_interval_beats,
        playRootOnCorrect: (dbStage as any).play_root_on_correct ?? true
      } as const;
      setStage(mapped);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'ステージ取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openDemo = useCallback(async () => {
    if (!stage) {
      await loadStage();
    }
    setIsOpen(true);
    // Request fullscreen after state update in next tick
    setTimeout(() => {
      const root = containerRef.current;
      if (!root) return;
      if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
      // vendor prefixes
      (root as any).webkitRequestFullscreen?.();
      (root as any).msRequestFullscreen?.();
      setIsFullscreen(true);
    }, 0);
  }, [loadStage, stage]);

  const closeDemo = useCallback(() => {
    setIsOpen(false);
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
      (document as any).webkitExitFullscreen?.();
      (document as any).msExitFullscreen?.();
    } catch {}
    setIsFullscreen(false);
  }, []);

  // Minimal, low-height teaser with CTA
  return (
    <section className="py-8 bg-slate-900/60 border-t border-b border-purple-500/20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-2xl md:text-3xl font-bold text-purple-300 mb-2">ファンタジーモード デモ（1-1）</h3>
            <p className="text-gray-300 text-sm md:text-base">MIDIキーボード／タッチ／クリックで、そのままの挙動を体験。クリックで全画面表示されます。</p>
          </div>
          <div className="flex-1">
            <div className="relative w-full h-40 md:h-44 rounded-xl overflow-hidden bg-[url('/first-view.png')] bg-cover bg-center border border-purple-500/30 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30" />
              <button
                onClick={openDemo}
                className="absolute inset-0 m-auto h-12 w-44 md:h-14 md:w-56 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-xl"
                aria-label="ファンタジーモード デモを再生"
              >
                体験する（全画面）
              </button>
            </div>
            {error && (
              <div className="text-red-400 text-sm mt-2">{error}</div>
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          ref={containerRef}
          className="fixed inset-0 z-[1000] bg-black"
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute top-3 right-3 z-50">
            <button
              onClick={closeDemo}
              className="px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm text-white border border-white/10"
            >
              全画面を終了
            </button>
          </div>
          <div className="absolute inset-0">
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white">読み込み中...</div>}>
              {stage && (
                <FantasyGameScreen
                  stage={stage}
                  autoStart
                  onGameComplete={() => {}}
                  onBackToStageSelect={closeDemo}
                  noteNameLang="en"
                  simpleNoteName={false}
                  lessonMode={false}
                />
              )}
            </Suspense>
          </div>
        </div>
      )}
    </section>
  );
};

export default LPFantasyDemo;