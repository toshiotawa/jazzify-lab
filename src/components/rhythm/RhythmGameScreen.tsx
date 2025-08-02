import React, {
  useEffect, useRef, useCallback,
} from 'react';
import { RhythmGameEngine } from '@/engines/RhythmGameEngine';
import { useRhythmStore } from '@/stores/rhythmStore';
import type { RhythmGameState } from '@/types/rhythm';
import RhythmNotesRenderer from './RhythmNotesRenderer';

import type { FantasyStage } from '../fantasy/FantasyGameEngine';

interface Props {
  stage: FantasyStage;
}

const RhythmGameScreen: React.FC<Props> = ({ stage }) => {
  const engineRef = useRef<RhythmGameEngine | null>(null);
  const startTimeRef = useRef<number>(performance.now());

  /* Engine 初期化 */
  useEffect(() => {
    engineRef.current = new RhythmGameEngine({
      mode: stage.chordProgression ? 'progression' : 'random',
      bpm: stage.bpm,
      timeSig: stage.timeSignature ?? 4,
      measureCount: stage.measureCount ?? 8,
      countIn: stage.countInMeasures ?? 0,
      allowedChords: stage.allowedChords,
      progression: stage.chordProgression,
    });
    useRhythmStore.setState({ notes: engineRef.current.generateNotes(0) });
    useRhythmStore.setState({ playing: true });
  }, [stage]);

  /* 時間同期 – timeStore.currentTime を rhythmStore に転写 */
  useEffect(() => {
    let raf: number;
    const step = () => {
      const state = useRhythmStore.getState();
      if (!state.playing) return;
      const t = (performance.now() - startTimeRef.current) / 1000;
      useRhythmStore.setState({ currentTime: t });
      engineRef.current?.update(t, state, useRhythmStore.setState);
      raf = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, []);

  /* 入力ハンドラ */
  const onKey = useCallback((note: number) => {
    const t = (performance.now() - startTimeRef.current) / 1000;
    const committed = (patch: Partial<RhythmGameState>) => useRhythmStore.setState(patch);
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