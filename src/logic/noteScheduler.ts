import { useEffect, useRef } from 'react';
import { useTimeStore } from '../stores/timeStore';
import { useRhythmStore } from '../stores/rhythmStore';

/**
 * ノーツのスケジューリングを管理するカスタムフック
 * timeStoreの小節変更を監視して、適切なタイミングでノーツを生成
 */
export function useNoteScheduler() {
  const { currentMeasure, isCountIn } = useTimeStore();
  const { spawnNextLoop, removeOldNotes, stageMeta } = useRhythmStore();
  const lastProcessedMeasure = useRef<number>(-1);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    // カウントイン中またはステージメタがない場合は何もしない
    if (isCountIn || !stageMeta) {
      return;
    }

    // 小節が変わった時にノーツを生成
    if (currentMeasure !== lastProcessedMeasure.current && currentMeasure > 0) {
      lastProcessedMeasure.current = currentMeasure;
      const currentTimeMs = performance.now();
      spawnNextLoop(currentMeasure, currentTimeMs);
    }
  }, [currentMeasure, isCountIn, stageMeta, spawnNextLoop]);

  // 古いノーツの削除（定期的に実行）
  useEffect(() => {
    const cleanupOldNotes = () => {
      const currentTimeMs = performance.now();
      removeOldNotes(currentTimeMs);
      animationFrameId.current = requestAnimationFrame(cleanupOldNotes);
    };

    if (stageMeta) {
      animationFrameId.current = requestAnimationFrame(cleanupOldNotes);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [removeOldNotes, stageMeta]);

  // 最初の2小節分を事前に生成
  useEffect(() => {
    if (stageMeta && !isCountIn) {
      const currentTimeMs = performance.now();
      // 現在の小節と次の小節分を生成
      spawnNextLoop(currentMeasure, currentTimeMs);
      // さらに次の小節分も生成（2小節先読み）
      const { bpm, timeSignature } = stageMeta;
      const msPerBeat = 60000 / bpm;
      const msPerMeasure = msPerBeat * timeSignature;
      spawnNextLoop(currentMeasure + 1, currentTimeMs + msPerMeasure);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageMeta, isCountIn]); // 初回のみ実行
}

/**
 * ノーツの生成タイミングを計算するヘルパー関数
 */
export function calculateNoteTimings(
  measure: number,
  beat: number,
  bpm: number,
  timeSignature: number,
  startTimeMs: number,
  countInMeasures: number
): { spawnTimeMs: number; hitTimeMs: number } {
  const msPerBeat = 60000 / bpm;
  const msPerMeasure = msPerBeat * timeSignature;
  
  // カウントイン後の実際の小節数
  const measureAfterCountIn = measure - countInMeasures;
  const measureStartMs = startTimeMs + (measureAfterCountIn - 1) * msPerMeasure;
  const beatOffsetMs = (beat - 1) * msPerBeat;
  const hitTimeMs = measureStartMs + beatOffsetMs;
  const spawnTimeMs = hitTimeMs - 3000; // 3秒前から表示

  return { spawnTimeMs, hitTimeMs };
}