import { useEffect, useRef } from 'react';
import { FantasySoundManager } from '@/utils/FantasySoundManager';

/** ゲームクリア（stageClear）遷移時にクエスト完了ジングルを 1 回だけ再生 */
export function useQuestCompleteJingleOnStageClear(
  gameState: string,
  stageClearValue = 'stageClear',
): void {
  const playedRef = useRef(false);

  useEffect(() => {
    if (gameState === stageClearValue) {
      if (!playedRef.current) {
        playedRef.current = true;
        try {
          FantasySoundManager.playQuestCompleteJingle();
        } catch {
          /* noop */
        }
      }
    } else {
      playedRef.current = false;
    }
  }, [gameState, stageClearValue]);
}

/** Tutorial 完了 CTA 表示時にクエスト完了ジングルを 1 回だけ再生 */
export function useQuestCompleteJingleWhenVisible(visible: boolean): void {
  const playedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      if (!playedRef.current) {
        playedRef.current = true;
        try {
          FantasySoundManager.playQuestCompleteJingle();
        } catch {
          /* noop */
        }
      }
    } else {
      playedRef.current = false;
    }
  }, [visible]);
}
