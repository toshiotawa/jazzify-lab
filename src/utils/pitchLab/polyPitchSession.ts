import type {
  PolyPitchEngineId,
  PolyPitchFrame,
  PolyPitchTrialLabel,
  PolyPitchTrialMetrics,
} from './polyPitchTypes';
import { computeTrialMetrics } from './polyPitchMetrics';

export interface PolyPitchSessionMeta {
  startedAtIso: string;
  userAgent: string;
  enablePianoModel: boolean;
  enableFourWayLive: boolean;
  audioDroppedSamples?: number;
  pitchPleaseCpuLoad?: number;
  effetuneDroppedTelemetry?: number;
  safariGlitchFlag?: boolean;
}

export interface PolyPitchLabeledTrial {
  label: PolyPitchTrialLabel;
  description: string;
  metricsByEngine: Partial<Record<PolyPitchEngineId, PolyPitchTrialMetrics>>;
}

export interface PolyPitchSessionExport {
  version: 1;
  meta: PolyPitchSessionMeta;
  frames: PolyPitchFrame[];
  labeledTrials: PolyPitchLabeledTrial[];
}

export class PolyPitchSessionRecorder {
  private readonly frames: PolyPitchFrame[] = [];

  append(frame: PolyPitchFrame): void {
    this.frames.push({
      engineId: frame.engineId,
      contentTimeSec: frame.contentTimeSec,
      emitTimeSec: frame.emitTimeSec,
      activeMidis: [...frame.activeMidis],
    });
  }

  getFrames(engineId?: PolyPitchEngineId): readonly PolyPitchFrame[] {
    if (!engineId) return this.frames;
    return this.frames.filter((f) => f.engineId === engineId);
  }

  buildMetricsForLabel(
    engineId: PolyPitchEngineId,
    label: PolyPitchTrialLabel,
  ): PolyPitchTrialMetrics {
    const engineFrames = this.getFrames(engineId);
    return computeTrialMetrics(engineFrames, label);
  }

  export(meta: PolyPitchSessionMeta, labeledTrials: PolyPitchLabeledTrial[]): PolyPitchSessionExport {
    return {
      version: 1,
      meta,
      frames: [...this.frames],
      labeledTrials,
    };
  }

  clear(): void {
    this.frames.length = 0;
  }
}

export const downloadPolyPitchSession = (payload: PolyPitchSessionExport): void => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pitch-mpe-lab-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};
