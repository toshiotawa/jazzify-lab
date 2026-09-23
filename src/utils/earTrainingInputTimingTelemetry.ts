import { log } from '@/utils/logger';

export type EarTrainingInputTimingMode = 'chord_osmd' | 'chord_precision';

export interface EarTrainingInputTimingTelemetryParams {
  mode: EarTrainingInputTimingMode;
  slug?: string;
  timingSource?: string;
  nominalTargetSec: number;
  inputSec: number;
  midi: number;
}

export interface EarTrainingUnmatchedInputTimingTelemetryParams {
  mode: EarTrainingInputTimingMode;
  slug?: string;
  timingSource?: string;
  inputSec: number;
  midi: number;
  nearestTargetSec: number | null;
  nearestDeltaMs: number | null;
}

/** 入力イベント時のみ debug ログ（本番 silent）。C/F 差の型切り分け用。 */
export const logEarTrainingInputTimingTelemetry = (
  params: EarTrainingInputTimingTelemetryParams,
): void => {
  const deltaMs = (params.inputSec - params.nominalTargetSec) * 1000;
  log.debug('[earTrainingInputTiming]', {
    mode: params.mode,
    slug: params.slug ?? '',
    timingSource: params.timingSource ?? 'unknown',
    nominalTargetSec: params.nominalTargetSec,
    inputSec: params.inputSec,
    deltaMs: Math.round(deltaMs * 10) / 10,
    midi: params.midi,
    matched: true,
  });
};

/** 判定ウィンドウ外の入力。最近傍 pending ターゲットとの delta を記録。 */
export const logEarTrainingUnmatchedInputTimingTelemetry = (
  params: EarTrainingUnmatchedInputTimingTelemetryParams,
): void => {
  log.debug('[earTrainingInputTiming]', {
    mode: params.mode,
    slug: params.slug ?? '',
    timingSource: params.timingSource ?? 'unknown',
    inputSec: params.inputSec,
    nearestTargetSec: params.nearestTargetSec,
    nearestDeltaMs: params.nearestDeltaMs,
    midi: params.midi,
    matched: false,
  });
};

export interface EarTrainingPhraseTimelineReader {
  getPhraseTimelineSec: () => number | null;
  getPhraseTimelineSecFromDomTimeStamp?: (domTimeStampMs: number) => number | null;
}

export interface EarTrainingSamePitchGateRejectedTelemetryParams {
  mode: EarTrainingInputTimingMode;
  slug?: string;
  timingSource?: string;
  midi: number;
  intervalMs: number;
  minIntervalMs: number;
}

/** 同音連打ゲートで捨てた入力。入力イベント時のみ debug ログ。 */
export const logEarTrainingSamePitchGateRejectedTelemetry = (
  params: EarTrainingSamePitchGateRejectedTelemetryParams,
): void => {
  log.debug('[earTrainingInputTiming]', {
    mode: params.mode,
    slug: params.slug ?? '',
    timingSource: params.timingSource ?? 'unknown',
    midi: params.midi,
    samePitchGateRejected: true,
    intervalMs: Math.round(params.intervalMs * 10) / 10,
    minIntervalMs: Math.round(params.minIntervalMs * 10) / 10,
  });
};

/** MIDI パケット時刻があれば優先、なければフレーズ時計。 */
export const resolveEarTrainingInputPhraseTimeSec = (
  player: EarTrainingPhraseTimelineReader | null | undefined,
  domTimeStampMs?: number,
): number | null => {
  if (
    domTimeStampMs != null
    && Number.isFinite(domTimeStampMs)
    && player?.getPhraseTimelineSecFromDomTimeStamp
  ) {
    const fromMidi = player.getPhraseTimelineSecFromDomTimeStamp(domTimeStampMs);
    if (fromMidi != null && Number.isFinite(fromMidi)) {
      return fromMidi;
    }
  }
  return player?.getPhraseTimelineSec() ?? null;
};
