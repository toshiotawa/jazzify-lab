const PERF_SUPPORTED =
  typeof performance !== 'undefined' &&
  typeof performance.mark === 'function' &&
  typeof performance.measure === 'function';

type LegendPerfGlobalScope = typeof globalThis & {
  __legendPerf__?: {
    enabled?: boolean;
  };
};

const getGlobalConfig = () => (globalThis as LegendPerfGlobalScope).__legendPerf__;

const isEnabled = (): boolean => PERF_SUPPORTED && Boolean(getGlobalConfig()?.enabled);

const safeMeasure = (label: string, start: string, end: string): void => {
  try {
    performance.measure(label, start, end);
  } catch {
    // 計測が失敗しても処理を継続する
  }
};

export const legendPerf = {
  isEnabled,
  measure<T>(label: string, fn: () => T): T {
    if (!isEnabled()) {
      return fn();
    }

    const start = `${label}:start`;
    const end = `${label}:end`;
    performance.mark(start);

    try {
      return fn();
    } finally {
      performance.mark(end);
      safeMeasure(label, start, end);
      performance.clearMarks(start);
      performance.clearMarks(end);
      performance.clearMeasures(label);
    }
  }
};
