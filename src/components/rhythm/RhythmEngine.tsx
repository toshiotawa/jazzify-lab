import { useEffect, useRef } from 'react';
import { useRhythmStore } from '@/stores/rhythmStore';
import { useFantasyGameEngine } from '@/components/fantasy/FantasyGameEngine';
import type { FantasyStage } from '@/components/fantasy/FantasyGameEngine';

interface Props {
  stage: FantasyStage;
  onSuccess: (chord: string) => void;
  onMiss: () => void;
}

const RhythmEngine = ({ stage, onSuccess, onMiss }: Props) => {
  const lastPointerRef = useRef(0);
  
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
    lastPointerRef.current = 0;
  }, [stage]);

  // 2. サブスクライブして判定
  useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now();
      const { tick, questions } = useRhythmStore.getState();
      const res = tick(now);
      
      if (res === 'success') {
        const currentPointer = useRhythmStore.getState().pointer;
        if (currentPointer > lastPointerRef.current && questions[currentPointer - 1]) {
          const q = questions[currentPointer - 1];
          onSuccess(q.chord);
          /* 正解したら既存 handleNoteInput を呼び出し
             （FantasyGameEngine が敵ダメージを処理）*/
          handleNoteInput(60); // ダミーノート (C4) – 音は鳴らない
          lastPointerRef.current = currentPointer;
        }
      }
    }, 16);
    return () => clearInterval(id);
  }, [onSuccess, handleNoteInput]);

  // miss 判定は別途必要 → 簡易にタイムアウトで
  useEffect(() => {
    const t = setInterval(() => {
      const { questions, pointer } = useRhythmStore.getState();
      if (pointer >= questions.length) return;
      const currentQuestion = questions[pointer];
      if (currentQuestion && performance.now() - currentQuestion.targetMs > 200) {
        onMiss();
        useRhythmStore.setState({ pointer: pointer + 1 });
      }
    }, 50);
    return () => clearInterval(t);
  }, [onMiss]);

  return null;
};

export default RhythmEngine;