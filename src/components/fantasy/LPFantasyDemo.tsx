import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { MidiDeviceSelector } from '@/components/ui/MidiDeviceManager';
import { useGameStore } from '@/stores/gameStore';

const OnScreenPiano = React.lazy(() => import('./OnScreenPiano'));
const LPPIXIPiano = React.lazy(() => import('./LPPIXIPiano'));

const LPFantasyDemo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { settings, updateSettings } = useGameStore();
  const [selectedStageNumber, setSelectedStageNumber] = useState<'1-1' | '1-2' | '1-3' | '1-4'>('1-1');
  const [isPortrait, setIsPortrait] = useState(true);
  // 常に横向きiPhone風フレームを使用
  const useLandscapeFrame = true;

  // ピアノの遅延マウント制御
  const [pianoVisible, setPianoVisible] = useState(false);
  const pianoSentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    try {
      const observer = new IntersectionObserver((entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          setPianoVisible(true);
          observer.disconnect();
        }
      }, { root: null, rootMargin: '200px' });
      if (pianoSentinelRef.current) observer.observe(pianoSentinelRef.current);
      return () => observer.disconnect();
    } catch {}
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const update = () => setIsPortrait(mq.matches);
    try {
      mq.addEventListener('change', update);
    } catch {
      mq.addListener(update);
    }
    update();
    return () => {
      try { mq.removeEventListener('change', update); } catch { mq.removeListener(update); }
    };
  }, []);

  // Lazy import FantasyGameScreen only when modal opens
  const FantasyGameScreen = useMemo(() => React.lazy(() => import('./FantasyGameScreen')), []);

  // 指定ステージ番号のステージをDBから取得
  const loadStage = useCallback(async (stageNum: '1-1' | '1-2' | '1-3' | '1-4') => {
    setIsLoading(true);
    setError(null);
    try {
      const { fetchFantasyStageByNumber } = await import('@/platform/supabaseFantasyStages');
      const dbStage = await fetchFantasyStageByNumber(stageNum);
      if (!dbStage) {
        throw new Error(`ステージ ${stageNum} が見つかりませんでした`);
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
    if (!stage || stage.stageNumber !== selectedStageNumber) {
      // 非同期で最新選択のステージを読み込む
      loadStage(selectedStageNumber);
    }
    setIsOpen(true);
    // dvh フォールバック変数を設定
    try {
      const setDvh = () => {
        const dvh = Math.max(window.innerHeight, document.documentElement.clientHeight);
        document.documentElement.style.setProperty('--dvh', dvh + 'px');
      };
      setDvh();
      window.addEventListener('resize', setDvh, { passive: true });
      // 一度だけのタイマーで再計測（ソフトキーボード対策）
      setTimeout(setDvh, 200);
      setTimeout(setDvh, 500);
    } catch {}
    // Request fullscreen after state update in next tick
    setTimeout(() => {
      const root = containerRef.current;
      if (!root) return;
      if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
      // vendor prefixes
      (root as any).webkitRequestFullscreen?.();
      (root as any).msRequestFullscreen?.();
      setIsFullscreen(true);
      // レイアウト確定後にresizeを明示発火（dvh反映とResizeObserver起動用）
      try { window.dispatchEvent(new Event('resize')); } catch {}
    }, 0);
  }, [loadStage, stage, selectedStageNumber]);

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
    // dvh 変数のクリア
    try {
      document.documentElement.style.removeProperty('--dvh');
    } catch {}
  }, []);

  const handleDemoGameComplete = useCallback((
    _result: 'clear' | 'gameover',
    _score: number,
    _correctAnswers: number,
    _totalQuestions: number
  ) => {
    // ゲーム内で2秒後にこのコールバックが呼ばれるため、ここでは即時に全画面を終了
    closeDemo();
  }, [closeDemo]);

  return (
    <section className="py-10">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-8 section-title flex items-center justify-center gap-4"><img src="/stage_icons/9.png" alt="デモプレイ" className="w-16 h-16" />デモプレイ</h2>
        <div className="rounded-2xl border border-purple-500/30 bg-slate-900/60 shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Visual (iPhone風フレーム: 中はピアノのみ) */}
            <div className={`iphone-frame ${useLandscapeFrame ? 'iphone-landscape' : 'iphone-portrait'} mx-auto`}>
              <div className="device-screen relative">
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
                <div ref={pianoSentinelRef} className="absolute inset-0 flex items-end justify-center p-4">
                  <div className="w-full max-w-[640px]">
                    {pianoVisible ? (
                      <Suspense fallback={<div className="text-center text-gray-300 text-sm">PIXIを読み込み中...</div>}>
                        {!isOpen && (
                          <LPPIXIPiano midiDeviceId={settings.selectedMidiDevice} height={isPortrait ? 120 : 150} />
                        )}
                      </Suspense>
                    ) : (
                      <div className="w-full h-[120px] md:h-[150px] bg-black/40 rounded-md border border-white/10" />
                    )}
                  </div>
                </div>
              </div>
              <div className={`iphone-notch ${useLandscapeFrame ? 'landscape' : 'portrait'}`} aria-hidden="true" />
              <div className={`iphone-home ${useLandscapeFrame ? 'landscape' : 'portrait'}`} aria-hidden="true" />
            </div>

            {/* 右カラム: ステージ選択 + 開始ボタン + MIDI選択 */}
            <div className="p-4 md:p-6 flex flex-col justify-center gap-4">
              {/* ステージ選択 */}
              <div>
                <div className="text-sm text-purple-200 font-semibold mb-2">ステージ選択</div>
                <div className="w-full flex items-center justify-center">
                  {isPortrait ? (
                    <div role="group" aria-label="ステージを選択" className="grid grid-cols-4 gap-2 w-64">
                      {(['1-1','1-2','1-3','1-4'] as const).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => { setSelectedStageNumber(num); setStage(null); setError(null); }}
                          aria-pressed={selectedStageNumber === num}
                          className={`h-11 rounded-full font-semibold text-sm transition-colors ${selectedStageNumber === num ? 'bg-purple-600 text-white' : 'bg-black/50 text-white border border-white/20'}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <select
                      value={selectedStageNumber}
                      onChange={(e) => { setSelectedStageNumber(e.target.value as '1-1' | '1-2' | '1-3' | '1-4'); setStage(null); setError(null); }}
                      className="lp-stage-select"
                      aria-label="ステージを選択"
                    >
                      <option value="1-1">1-1</option>
                      <option value="1-2">1-2</option>
                      <option value="1-3">1-3</option>
                      <option value="1-4">1-4</option>
                    </select>
                  )}
                </div>
              </div>

              {/* 開始ボタン */}
              <button
                onClick={openDemo}
                className="h-11 w-56 md:h-12 md:w-64 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-2xl mx-auto"
                aria-label="ファンタジーモード デモを再生"
              >
                体験する（全画面）
              </button>

              {/* MIDI選択 */}
              <div>
                <div className="text-sm text-purple-200 font-semibold mb-2">MIDI機器を選択</div>
                <MidiDeviceSelector
                  value={settings.selectedMidiDevice}
                  onChange={(id) => updateSettings({ selectedMidiDevice: id })}
                />
                <div className="text-xs text-gray-400 mt-2">選択した機器はデモプレイで使用されます。未選択でもマウス/タッチでプレイ可能です。</div>
              </div>
              <div className="text-[11px] text-gray-400">通信や環境により音声の初回起動にユーザー操作が必要な場合があります。</div>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          ref={containerRef}
          className="fixed inset-0 z-[1000] bg-black min-h-[var(--dvh,100dvh)] flex flex-col"
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
                  onGameComplete={handleDemoGameComplete}
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