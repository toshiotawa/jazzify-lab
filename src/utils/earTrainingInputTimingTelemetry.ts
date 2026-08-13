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
  });
};

export interface EarTrainingPhraseTimelineReader {
  getPhraseTimelineSec: () => number | null;
  getPhraseTimelineSecFromDomTimeStamp?: (domTimeStampMs: number) => number | null;
}

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
