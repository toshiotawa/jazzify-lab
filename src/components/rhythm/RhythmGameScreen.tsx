import React, {
  useEffect, useRef, useCallback,
} from 'react';
import { RhythmGameEngine } from '@/engines/RhythmGameEngine';
import { useRhythmStore } from '@/stores/rhythmStore';
import RhythmNotesRenderer from './RhythmNotesRenderer';

interface Props {
  stage: any;                // FantasyStage 型だが簡素化
}

const RhythmGameScreen: React.FC<Props> = ({ stage }) => {
  const store = useRhythmStore();
  const engineRef = useRef<RhythmGameEngine | null>(null);
  const startTimeRef = useRef<number>(performance.now());

  /* Engine 初期化 */
  useEffect(() => {
    engineRef.current = new RhythmGameEngine({
      mode: stage.chord_progression_data ? 'progression' : 'random',
      bpm: stage.bpm || 120,
      timeSig: stage.time_signature || 4,
      measureCount: stage.measure_count || 8,
      countIn: stage.count_in_measures || 1,
      allowedChords: stage.allowed_chords || ['C', 'G', 'Am', 'F'],
      progression: stage.chord_progression_data,
    });
    store.setNotes(engineRef.current.generateNotes(0));
    store.setPlaying(true);
    startTimeRef.current = performance.now();
    
    return () => {
      store.setPlaying(false);
    };
  }, [stage, store]);

  /* 時間同期 – timeStore.currentTime を rhythmStore に転写 */
  useEffect(() => {
    let raf: number;
    const step = () => {
      if (!store.playing) return;
      const t = (performance.now() - startTimeRef.current) / 1000;
      useRhythmStore.setState({ currentTime: t });
      engineRef.current?.update(t, useRhythmStore.getState(), store.setState);
      raf = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, [store]);

  /* 入力ハンドラ */
  const onKey = useCallback((note: number) => {
    const t = (performance.now() - startTimeRef.current) / 1000;
    const committed = (patch: Partial<any>) => useRhythmStore.setState(patch);
    engineRef.current?.judgeInput(note, t, useRhythmStore.getState(), committed);
  }, []);

  /* demo: キーボード Z=60 だけ対応 */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'z') onKey(60); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onKey]);

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex-1 flex items-center justify-center">
        {/* TODO: monster / HP UI reuse */}
        <span className="text-white">Rhythm Mode</span>
      </div>
      <div className="h-28 w-full">
        <RhythmNotesRenderer width={window.innerWidth} height={112} />
      </div>
    </div>
  );
};

export default RhythmGameScreen;