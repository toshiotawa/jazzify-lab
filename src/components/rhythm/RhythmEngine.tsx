import { useEffect } from 'react';
import { useRhythmStore } from '@/stores/rhythmStore';
import { useFantasyGameEngine } from '@/components/fantasy/FantasyGameEngine';
import type { FantasyStage } from '@/types';

interface Props {
  stage: FantasyStage;
  onSuccess: (chord: string) => void;
  onMiss: () => void;
}

const RhythmEngine = ({ stage, onSuccess, onMiss }: Props) => {
  /* 既存ファンタジーエンジンを流用 (敵HP・攻撃演出等) */
  const { handleNoteInput } = useFantasyGameEngine({
    stage,
    onGameStateChange: () => {},
    onChordCorrect: () => {},
    onChordIncorrect: () => {},
    onGameComplete: () => {},
    onEnemyAttack: () => {}
  });

  // 1. 質問生成
  useEffect(() => {
    useRhythmStore.getState().generate(stage);
  }, [stage]);

  // 2. サブスクライブして判定
  useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now();
      const res = useRhythmStore.getState().tick(now);
      if (res === 'success') {
        const state = useRhythmStore.getState();
        const q = state.questions[state.pointer - 1];
        onSuccess(q.chord);
        /* 正解したら既存 handleNoteInput を呼び出し
           （FantasyGameEngine が敵ダメージを処理）*/
        handleNoteInput(60); // ダミーノート (C4) – 音は鳴らない
      }
    }, 16);
    return () => clearInterval(id);
  }, [onSuccess, handleNoteInput]);

  // miss 判定は別途必要 → 簡易にタイムアウトで
  useEffect(() => {
    const t = setInterval(() => {
      const { questions, pointer } = useRhythmStore.getState();
      if (pointer >= questions.length) return;
      if (performance.now() - questions[pointer].targetMs > 200) {
        onMiss();
        useRhythmStore.setState({ pointer: pointer + 1 });
      }
    }, 50);
    return () => clearInterval(t);
  }, [onMiss]);

  return null;
};

export default RhythmEngine;