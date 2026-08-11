import {
  chordOsmdBeatToTargetTimeSec,
  chordOsmdRankForAccuracy,
  collectChordOsmdHarmonyEvents,
  collectChordOsmdMusicXmlAttacks,
  type ChordOsmdMusicXmlAttack,
} from '@/utils/earTrainingChordOsmd';
import type { EarTrainingRank } from '@/types';

/** アドリブ C&R: MusicXML voice 1 のみを判定ターゲットとする */
const ADLIB_CALL_RESPONSE_TARGET_VOICE = 1;

export interface AdlibCallResponseTarget {
  id: string;
  orderIndex: number;
  targetTimeSec: number;
  measureNumber: number;
  /** 正解となる pitch class 集合（オクターブ等価） */
  acceptedPitchClasses: ReadonlySet<number>;
  /** 鍵盤ガイド用の MusicXML 登録 MIDI（オクターブ展開しない） */
  guideMidis: readonly number[];
}

export interface BuildAdlibCallResponseTargetsOptions {
  readonly bpm: number;
  readonly beatsPerMeasure: number;
  readonly isSwing?: boolean;
}

export interface AdlibCallResponseChordSlot {
  id: string;
  name: string;
  measureNumber: number;
  startTimeSec: number;
}

const chordSlotId = (measureNumber: number, beatStartInMeasure: number, orderIndex: number): string => (
  `acr-chord:${measureNumber}:${beatStartInMeasure.toFixed(4)}:${orderIndex}`
);

/** MusicXML `<harmony>` からコードスロット列を生成。連続する同一コード名は1スロットにマージ。 */
export const buildAdlibCallResponseChordSlots = (
  musicXmlText: string,
  options: BuildAdlibCallResponseTargetsOptions,
): AdlibCallResponseChordSlot[] => {
  const { bpm, beatsPerMeasure, isSwing = false } = options;
  const events = collectChordOsmdHarmonyEvents(musicXmlText);
  if (events.length === 0) {
    return [];
  }

  const sorted = events.slice().sort((a, b) => {
    const timeA = chordOsmdBeatToTargetTimeSec(a.measureNumber, a.beatStartInMeasure, bpm, beatsPerMeasure, isSwing);
    const timeB = chordOsmdBeatToTargetTimeSec(b.measureNumber, b.beatStartInMeasure, bpm, beatsPerMeasure, isSwing);
    if (Math.abs(timeA - timeB) > 1e-9) {
      return timeA - timeB;
    }
    if (a.measureNumber !== b.measureNumber) {
      return a.measureNumber - b.measureNumber;
    }
    return a.beatStartInMeasure - b.beatStartInMeasure;
  });

  const slots: AdlibCallResponseChordSlot[] = [];
  let lastName: string | null = null;
  for (const event of sorted) {
    const trimmedName = event.name.trim();
    if (!trimmedName || trimmedName === lastName) {
      continue;
    }
    lastName = trimmedName;
    slots.push({
      id: chordSlotId(event.measureNumber, event.beatStartInMeasure, slots.length),
      name: trimmedName,
      measureNumber: event.measureNumber,
      startTimeSec: chordOsmdBeatToTargetTimeSec(
        event.measureNumber,
        event.beatStartInMeasure,
        bpm,
        beatsPerMeasure,
        isSwing,
      ),
    });
  }
  return slots;
};

/**
 * `startTimeSec <= phraseTimeSec` を満たす最後のスロット index。先頭未満なら 0。
 * アクティブ index はフレーズ内で単調増加するため、前回値を `fromIndex` に渡すと走査が償却 O(1) になる。
 * `resolveStartTimeSec` は練習速度などのスケーリング適用用（毎回同じ参照を渡すこと）。
 */
export const resolveAdlibCallResponseActiveChordSlotIndex = (
  slots: readonly AdlibCallResponseChordSlot[],
  phraseTimeSec: number,
  fromIndex = 0,
  resolveStartTimeSec?: (startTimeSec: number) => number,
): number => {
  if (slots.length === 0 || !Number.isFinite(phraseTimeSec)) {
    return 0;
  }
  const start = Math.min(Math.max(0, Math.trunc(fromIndex)), slots.length - 1);
  let activeIndex = start;
  for (let i = start + 1; i < slots.length; i += 1) {
    const startTimeSec = resolveStartTimeSec
      ? resolveStartTimeSec(slots[i].startTimeSec)
      : slots[i].startTimeSec;
    if (startTimeSec > phraseTimeSec + 1e-9) {
      break;
    }
    activeIndex = i;
  }
  return activeIndex;
};

const midiToPitchClass = (midi: number): number => ((Math.round(midi) % 12) + 12) % 12;

const scoreTargetId = (measureNumber: number, beatStartInMeasure: number): string => (
  `acr:${measureNumber}:${beatStartInMeasure.toFixed(4)}`
);

/** MusicXML から voice1 アタックを収集する。 */
export const collectAdlibCallResponseAttacks = (
  musicXmlText: string,
): ChordOsmdMusicXmlAttack[] => (
  collectChordOsmdMusicXmlAttacks(musicXmlText, { targetVoice: ADLIB_CALL_RESPONSE_TARGET_VOICE })
);

/**
 * voice1 アタックからアドリブ C&R ターゲットを生成。
 * コール小節は voice1 音符が無いため自動的にターゲット 0。
 */
export const buildAdlibCallResponseTargets = (
  attacks: readonly ChordOsmdMusicXmlAttack[],
  options: BuildAdlibCallResponseTargetsOptions,
): AdlibCallResponseTarget[] => {
  const { bpm, beatsPerMeasure, isSwing = false } = options;
  if (attacks.length === 0) {
    return [];
  }

  const sorted = attacks.slice().sort((a, b) => {
    const timeA = chordOsmdBeatToTargetTimeSec(a.measureNumber, a.beatStartInMeasure, bpm, beatsPerMeasure, isSwing);
    const timeB = chordOsmdBeatToTargetTimeSec(b.measureNumber, b.beatStartInMeasure, bpm, beatsPerMeasure, isSwing);
    if (Math.abs(timeA - timeB) > 1e-9) {
      return timeA - timeB;
    }
    if (a.measureNumber !== b.measureNumber) {
      return a.measureNumber - b.measureNumber;
    }
    return a.beatStartInMeasure - b.beatStartInMeasure;
  });

  return sorted.map((attack, orderIndex) => {
    const pitchClasses = new Set<number>();
    const guideMidis: number[] = [];
    const seenGuide = new Set<number>();
    for (const raw of attack.midis) {
      if (!Number.isFinite(raw)) {
        continue;
      }
      const midi = Math.round(raw);
      pitchClasses.add(midiToPitchClass(midi));
      if (!seenGuide.has(midi)) {
        seenGuide.add(midi);
        guideMidis.push(midi);
      }
    }
    guideMidis.sort((a, b) => a - b);
    return {
      id: `${scoreTargetId(attack.measureNumber, attack.beatStartInMeasure)}:${orderIndex}`,
      orderIndex,
      targetTimeSec: chordOsmdBeatToTargetTimeSec(
        attack.measureNumber,
        attack.beatStartInMeasure,
        bpm,
        beatsPerMeasure,
        isSwing,
      ),
      measureNumber: attack.measureNumber,
      acceptedPitchClasses: pitchClasses,
      guideMidis,
    };
  }).filter(target => target.acceptedPitchClasses.size > 0);
};

/** オクターブ等価でターゲットに含まれるか。1音一致で正解。 */
export const matchesAdlibCallResponseTarget = (
  target: AdlibCallResponseTarget,
  midi: number,
): boolean => {
  if (!Number.isFinite(midi)) {
    return false;
  }
  return target.acceptedPitchClasses.has(midiToPitchClass(midi));
};

/** 精度分母はターゲット数（1ターゲット = 1ノート）。 */
export const getAdlibCallResponseTargetCount = (
  targets: readonly AdlibCallResponseTarget[],
): number => targets.length;

export const adlibCallResponseHitRatio = (
  targets: readonly AdlibCallResponseTarget[],
  completedCount: number,
): number => {
  const total = getAdlibCallResponseTargetCount(targets);
  if (total <= 0) {
    return 1;
  }
  return Math.max(0, Math.min(1, completedCount / total));
};

export const adlibCallResponseRankForAccuracy = (accuracy: number): EarTrainingRank => (
  chordOsmdRankForAccuracy(accuracy)
);

/** 連続する同一 guideMidis（完全一致）の音群。 */
export interface AdlibCallResponseHintGroup {
  /** グループ先頭ターゲットの targets 配列インデックス */
  readonly startIndex: number;
  /** グループ末尾ターゲットの targets 配列インデックス（inclusive） */
  readonly endIndex: number;
  readonly guideMidis: readonly number[];
}

export const areSameAdlibCallResponseGuideMidis = (
  a: readonly number[],
  b: readonly number[],
): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

/** 連続ターゲットを guideMidis 完全一致でグループ化（順序は targets 順を維持）。 */
export const buildAdlibCallResponseHintGroups = (
  targets: readonly AdlibCallResponseTarget[],
): AdlibCallResponseHintGroup[] => {
  if (targets.length === 0) {
    return [];
  }
  const groups: AdlibCallResponseHintGroup[] = [];
  let startIndex = 0;
  for (let i = 1; i < targets.length; i += 1) {
    if (!areSameAdlibCallResponseGuideMidis(targets[startIndex].guideMidis, targets[i].guideMidis)) {
      groups.push({
        startIndex,
        endIndex: i - 1,
        guideMidis: targets[startIndex].guideMidis,
      });
      startIndex = i;
    }
  }
  groups.push({
    startIndex,
    endIndex: targets.length - 1,
    guideMidis: targets[startIndex].guideMidis,
  });
  return groups;
};

export interface ResolveAdlibCallResponseActiveHintOptions {
  readonly phraseTimeSec: number;
  readonly hammerLeadSec: number;
  readonly lateWindowSec: number;
  /** ターゲット時刻 → 判定用校正済み秒（timing adjustment 等） */
  readonly resolveJudgedTargetTimeSec: (targetTimeSec: number) => number;
  /** 末尾ターゲットが完了またはミス確定済みなら true（早期終了） */
  readonly isLastTargetSettled: (targetId: string) => boolean;
}

/**
 * アクティブな鍵盤ガイド音群を返す。
 * - 開始: 音群先頭ターゲットのハンマー射出時刻（judged - hammerLead）
 * - 終了: 音群末尾ターゲットの判定窓終了、または末尾が settle したら早期終了
 * - 前の音群が残っている間は次の射出が始まっても前のガイドを維持
 */
export const resolveAdlibCallResponseActiveHintGuideMidis = (
  targets: readonly AdlibCallResponseTarget[],
  groups: readonly AdlibCallResponseHintGroup[],
  options: ResolveAdlibCallResponseActiveHintOptions,
): readonly number[] | null => {
  const {
    phraseTimeSec,
    hammerLeadSec,
    lateWindowSec,
    resolveJudgedTargetTimeSec,
    isLastTargetSettled,
  } = options;
  if (targets.length === 0 || groups.length === 0 || !Number.isFinite(phraseTimeSec)) {
    return null;
  }

  for (const group of groups) {
    const first = targets[group.startIndex];
    const last = targets[group.endIndex];
    if (!first || !last) {
      continue;
    }
    const throwStartSec = resolveJudgedTargetTimeSec(first.targetTimeSec) - hammerLeadSec;
    if (phraseTimeSec + 1e-9 < throwStartSec) {
      break;
    }
    if (isLastTargetSettled(last.id)) {
      continue;
    }
    const lastWindowEndSec = resolveJudgedTargetTimeSec(last.targetTimeSec) + lateWindowSec;
    if (phraseTimeSec > lastWindowEndSec + 1e-9) {
      continue;
    }
    return group.guideMidis;
  }
  return null;
};
