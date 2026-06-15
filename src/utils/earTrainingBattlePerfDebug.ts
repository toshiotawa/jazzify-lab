export const EAR_TRAINING_BATTLE_PERF_DEBUG_STORAGE_KEY = 'earTrainingBattlePerfDebug';

export interface EarTrainingBattlePerfMetrics {
  fps: number;
  avgFrameMs: number;
  maxFrameMs: number;
}

export const isEarTrainingBattlePerfDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('earPerf') === '1') {
      return true;
    }
    return window.localStorage.getItem(EAR_TRAINING_BATTLE_PERF_DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

/** 1秒ごとに FPS / フレーム時間を報告する。戻り値は stop 関数。 */
export const createEarTrainingBattlePerfMonitor = (
  onMetrics: (metrics: EarTrainingBattlePerfMetrics) => void,
): (() => void) => {
  let rafId = 0;
  let lastFrameAt = performance.now();
  let reportStartedAt = lastFrameAt;
  let frameCount = 0;
  let accumulatedFrameMs = 0;
  let maxFrameMs = 0;

  const tick = (now: number): void => {
    const frameMs = now - lastFrameAt;
    lastFrameAt = now;
    frameCount += 1;
    accumulatedFrameMs += frameMs;
    if (frameMs > maxFrameMs) {
      maxFrameMs = frameMs;
    }

    const elapsedSinceReport = now - reportStartedAt;
    if (elapsedSinceReport >= 1000) {
      onMetrics({
        fps: Math.round((frameCount * 1000) / elapsedSinceReport),
        avgFrameMs: frameCount > 0 ? accumulatedFrameMs / frameCount : 0,
        maxFrameMs,
      });
      frameCount = 0;
      accumulatedFrameMs = 0;
      maxFrameMs = 0;
      reportStartedAt = now;
    }

    rafId = window.requestAnimationFrame(tick);
  };

  rafId = window.requestAnimationFrame(tick);
  return () => {
    window.cancelAnimationFrame(rafId);
  };
};
