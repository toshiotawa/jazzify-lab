import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// 遅延読込対象内でのみ参照（LP初期バンドルを軽く保つ）
import { MIDIController, initializeAudioSystem, playNote, stopNote } from '@/utils/MidiController';

// Cメジャー三和音のピッチクラス (C=0, C#=1, ..., B=11)
const TARGET_PITCH_CLASSES = new Set<number>([0, 4, 7]);
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// LP用に最低限のUIで1オクターブの白鍵のみ表示（C4〜B4）
const WHITE_KEY_MIDI = [60, 62, 64, 65, 67, 69, 71]; // C4 D4 E4 F4 G4 A4 B4

const getPitchClass = (midi: number): number => ((midi % 12) + 12) % 12;

const LandingStage1Demo: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [collected, setCollected] = useState<Set<number>>(new Set());
  const [midiConnected, setMidiConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ハイライト用途（MIDIノートオン/オフに追随）
  const activeMidiNotesRef = useRef<Set<number>>(new Set());
  const [, forceRerender] = useState(0);

  const controllerRef = useRef<MIDIController | null>(null);

  const remainingCount = 3 - collected.size;
  const progressRatio = collected.size / 3; // 0..1

  const handleCollectedUpdate = useCallback((pc: number) => {
    if (!TARGET_PITCH_CLASSES.has(pc) || isCleared) return;
    setCollected(prev => {
      if (prev.has(pc)) return prev;
      const next = new Set(prev);
      next.add(pc);
      if (next.size >= 3) {
        setIsCleared(true);
      }
      return next;
    });
  }, [isCleared]);

  const handleNoteOn = useCallback(async (midi: number, velocity?: number) => {
    try {
      // すでに音声システムが初期化済みならそのまま、未初期化ならユーザー操作後に初期化
      await initializeAudioSystem();
      await playNote(midi, velocity ?? 100);

      // ハイライト
      activeMidiNotesRef.current.add(midi);
      forceRerender(x => x + 1);

      handleCollectedUpdate(getPitchClass(midi));
    } catch (e) {
      console.error(e);
    }
  }, [handleCollectedUpdate]);

  const handleNoteOff = useCallback((midi: number) => {
    try {
      stopNote(midi);
    } catch {}
    activeMidiNotesRef.current.delete(midi);
    forceRerender(x => x + 1);
  }, []);

  const startDemo = useCallback(async () => {
    try {
      setError(null);
      await initializeAudioSystem();
      // MIDI controller 準備
      const controller = new MIDIController({
        onNoteOn: (note, vel) => handleNoteOn(note, vel),
        onNoteOff: (note) => handleNoteOff(note),
        onConnectionChange: (connected) => setMidiConnected(connected),
        playMidiSound: true,
      });
      controllerRef.current = controller;
      await controller.initialize();
      setIsReady(true);
    } catch (e) {
      console.warn('MIDI未対応、または初期化に失敗しました。クリック/タッチでプレイ可能です。', e);
      setIsReady(true); // クリック/タッチのみでも遊べる
      setMidiConnected(false);
      setError('MIDI未対応のため、クリック/タッチで遊べます');
    }
  }, [handleNoteOn, handleNoteOff]);

  const resetDemo = useCallback(() => {
    setCollected(new Set());
    setIsCleared(false);
  }, []);

  useEffect(() => {
    // 初期ロード時にユーザーインタラクション検出を仕込んでおく（初回クリックで音声が有効化されるように）
    initializeAudioSystem().catch(() => {});
    return () => {
      try {
        controllerRef.current?.destroy();
      } catch {}
    };
  }, []);

  // 画面上の白鍵クリック
  const handleKeyClick = useCallback(async (midi: number) => {
    await handleNoteOn(midi, 100);
    // 短めのノートオフ（簡易サステイン）
    setTimeout(() => handleNoteOff(midi), 200);
  }, [handleNoteOn, handleNoteOff]);

  const midiStatusText = useMemo(() => {
    if (!isReady) return '未初期化';
    return midiConnected ? 'MIDI接続: OK' : 'MIDI接続: なし';
  }, [isReady, midiConnected]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <img src="/monster_icons/monster_35.png" alt="monster" className="w-10 h-10" />
          <div className="text-lg font-bold">
            ステージ 1-1 デモ
            <span className="ml-2 text-sm text-purple-300">C メジャー三和音を揃えよう!</span>
          </div>
        </div>
        <div className="text-xs text-gray-300">{midiStatusText}</div>
      </div>

      {/* ステータス/HP風プログレス */}
      <div className="w-full h-3 rounded-full bg-slate-700 overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-yellow-400 transition-all duration-500"
          style={{ width: `${Math.max(0, 100 - progressRatio * 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-sm text-gray-300 mb-6">
        <div>のこり: {remainingCount} 音</div>
        {isCleared ? (
          <div className="text-emerald-300 font-semibold">CLEAR! お見事！</div>
        ) : (
          <div className="text-gray-400">目標: C, E, G（順不同・オクターブ自由）</div>
        )}
      </div>

      {/* 操作エリア */}
      {!isReady ? (
        <div className="p-6 rounded-xl border border-white/20 bg-white/5 text-center">
          <p className="mb-3">ボタンを押してデモを開始（MIDI/タッチ対応）</p>
          <button
            onClick={startDemo}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold"
          >
            デモを開始
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          {/* 白鍵（簡易） */}
          <div className="flex gap-1 justify-center mb-4 select-none">
            {WHITE_KEY_MIDI.map((midi) => {
              const pc = getPitchClass(midi);
              const isTarget = TARGET_PITCH_CLASSES.has(pc);
              const active = activeMidiNotesRef.current.has(midi);
              const collectedHit = collected.has(pc);
              return (
                <button
                  key={midi}
                  onClick={() => handleKeyClick(midi)}
                  className={[
                    'w-12 sm:w-14 md:w-16 h-24 sm:h-28 md:h-32 rounded-md flex items-end justify-center text-sm font-semibold transition-all',
                    isTarget ? 'bg-white text-slate-900' : 'bg-gray-200 text-slate-800',
                    'hover:scale-[1.03] active:scale-[0.98]',
                    active ? 'ring-2 ring-yellow-400' : '',
                    collectedHit ? 'shadow-[0_0_12px_rgba(34,197,94,0.9)]' : ''
                  ].join(' ')}
                >
                  <span className="mb-2">{NOTE_NAMES[pc]}</span>
                </button>
              );
            })}
          </div>

          {/* 操作ボタン */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetDemo}
              className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-sm"
            >
              リセット
            </button>
            <span className="text-xs text-gray-400">MIDIが無くてもクリック/タッチで演奏できます</span>
          </div>

          {error && (
            <div className="text-xs text-amber-300 text-center mt-3">{error}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LandingStage1Demo;