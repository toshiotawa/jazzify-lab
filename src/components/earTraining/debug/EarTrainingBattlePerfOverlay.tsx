import React, { useEffect, useState } from 'react';

import {
  createEarTrainingBattlePerfMonitor,
  type EarTrainingBattlePerfMetrics,
} from '@/utils/earTrainingBattlePerfDebug';

const INITIAL_METRICS: EarTrainingBattlePerfMetrics = {
  fps: 0,
  avgFrameMs: 0,
  maxFrameMs: 0,
};

export const EarTrainingBattlePerfOverlay: React.FC = () => {
  const [metrics, setMetrics] = useState<EarTrainingBattlePerfMetrics>(INITIAL_METRICS);

  useEffect(() => {
    return createEarTrainingBattlePerfMonitor(setMetrics);
  }, []);

  return (
    <div
      className="pointer-events-none absolute left-2 top-2 z-[200] rounded bg-black/75 px-2 py-1 font-mono text-[10px] leading-snug text-lime-300"
      aria-hidden
    >
      <div>FPS {metrics.fps}</div>
      <div>avg {metrics.avgFrameMs.toFixed(1)}ms</div>
      <div>max {metrics.maxFrameMs.toFixed(1)}ms</div>
    </div>
  );
};
