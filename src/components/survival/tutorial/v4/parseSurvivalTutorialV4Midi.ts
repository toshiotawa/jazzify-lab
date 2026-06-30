/**
 * Survival Tutorial V4 — 最小 SMF(Standard MIDI File) テンポリーダ。
 *
 * 目的はステージ全体 MIDI のテンポマップ(tick→sec)算出のみ。
 * - ヘッダ(MThd)から division(ticks per quarter)を読む。
 * - 全トラック(MTrk)を走査し、`FF 51 03` テンポメタを絶対 tick とともに収集する。
 * - 依存ライブラリは追加しない(Node/ブラウザ両対応の純粋関数)。
 *
 * SMPTE 形式 division は教材用途では使わない想定のため非対応(エラー)。
 */

import {
  buildSmfTempoMap,
  createConstantSmfTempoMap,
  smfTickToSeconds,
  type SmfTempoEvent,
  type SmfTempoMap,
} from '@/utils/smfBinary';

export type SurvivalTutorialV4MidiTempoEvent = SmfTempoEvent;
export type SurvivalTutorialV4MidiTempoMap = SmfTempoMap;

export const parseSurvivalTutorialV4MidiTempoMap = buildSmfTempoMap;

/** 一定 BPM のテンポマップを生成(MIDI 未指定時のフォールバック用)。 */
export const createConstantTempoMap = createConstantSmfTempoMap;

/** 四分音符基準の拍数を tick に変換。 */
export const quarterBeatsToTick = (
  map: SurvivalTutorialV4MidiTempoMap,
  quarterBeats: number,
): number => Math.round(quarterBeats * map.ticksPerQuarter);

/** 絶対 tick を秒へ変換(区間積分)。 */
export const midiTickToSeconds = smfTickToSeconds;
