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

export interface SurvivalTutorialV4MidiTempoEvent {
  /** 絶対 tick。 */
  readonly tick: number;
  /** 四分音符あたりのマイクロ秒。 */
  readonly usPerQuarter: number;
}

export interface SurvivalTutorialV4MidiTempoMap {
  readonly ticksPerQuarter: number;
  /** tick 昇順。必ず tick=0 のエントリを含む。 */
  readonly tempos: readonly SurvivalTutorialV4MidiTempoEvent[];
}

const DEFAULT_US_PER_QUARTER = 500000; // 120 BPM

const readUint32 = (data: Uint8Array, offset: number): number =>
  ((data[offset] << 24) |
    (data[offset + 1] << 16) |
    (data[offset + 2] << 8) |
    data[offset + 3]) >>>
  0;

const readUint16 = (data: Uint8Array, offset: number): number =>
  (data[offset] << 8) | data[offset + 1];

const matchesAscii = (data: Uint8Array, offset: number, ascii: string): boolean => {
  for (let i = 0; i < ascii.length; i += 1) {
    if (data[offset + i] !== ascii.charCodeAt(i)) return false;
  }
  return true;
};

interface VlqResult {
  readonly value: number;
  readonly nextOffset: number;
}

const readVariableLengthQuantity = (data: Uint8Array, offset: number): VlqResult => {
  let value = 0;
  let cursor = offset;
  for (let i = 0; i < 4; i += 1) {
    const byte = data[cursor];
    cursor += 1;
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) {
      return { value: value >>> 0, nextOffset: cursor };
    }
  }
  return { value: value >>> 0, nextOffset: cursor };
};

const dataBytesForChannelStatus = (status: number): number => {
  const high = status & 0xf0;
  // Program Change(0xC0) と Channel Pressure(0xD0) のみ 1 byte。
  return high === 0xc0 || high === 0xd0 ? 1 : 2;
};

const parseTrackTempos = (
  data: Uint8Array,
  trackStart: number,
  trackEnd: number,
): SurvivalTutorialV4MidiTempoEvent[] => {
  const tempos: SurvivalTutorialV4MidiTempoEvent[] = [];
  let offset = trackStart;
  let absoluteTick = 0;
  let runningStatus = 0;

  while (offset < trackEnd) {
    const delta = readVariableLengthQuantity(data, offset);
    absoluteTick += delta.value;
    offset = delta.nextOffset;

    let status = data[offset];
    if (status < 0x80) {
      // ランニングステータス: 直前のチャンネルステータスを継続。
      status = runningStatus;
    } else {
      offset += 1;
    }

    if (status === 0xff) {
      // メタイベント。
      const metaType = data[offset];
      offset += 1;
      const len = readVariableLengthQuantity(data, offset);
      offset = len.nextOffset;
      if (metaType === 0x51 && len.value === 3) {
        const usPerQuarter =
          (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
        tempos.push({ tick: absoluteTick, usPerQuarter });
      }
      offset += len.value;
      continue;
    }

    if (status === 0xf0 || status === 0xf7) {
      // SysEx: 長さ分スキップ。
      const len = readVariableLengthQuantity(data, offset);
      offset = len.nextOffset + len.value;
      continue;
    }

    // チャンネルボイスメッセージ。
    runningStatus = status;
    offset += dataBytesForChannelStatus(status);
  }

  return tempos;
};

export const parseSurvivalTutorialV4MidiTempoMap = (
  data: Uint8Array,
): SurvivalTutorialV4MidiTempoMap => {
  if (data.length < 14 || !matchesAscii(data, 0, 'MThd')) {
    throw new Error('SMF ヘッダ(MThd)が見つかりません');
  }
  const headerLength = readUint32(data, 4);
  // MThd データ: format(2) + ntrks(2) + division(2)。division は offset 12。
  const division = readUint16(data, 12);
  if ((division & 0x8000) !== 0) {
    throw new Error('SMPTE 形式の division は非対応です');
  }
  const ticksPerQuarter = division;
  if (ticksPerQuarter <= 0) {
    throw new Error('division が不正です');
  }

  const collected: SurvivalTutorialV4MidiTempoEvent[] = [];
  let offset = 8 + headerLength;
  while (offset + 8 <= data.length) {
    if (!matchesAscii(data, offset, 'MTrk')) {
      // 未知チャンクは長さ分スキップ。
      const len = readUint32(data, offset + 4);
      offset += 8 + len;
      continue;
    }
    const trackLength = readUint32(data, offset + 4);
    const trackStart = offset + 8;
    const trackEnd = trackStart + trackLength;
    collected.push(...parseTrackTempos(data, trackStart, trackEnd));
    offset = trackEnd;
  }

  const sorted = [...collected].sort((a, b) => a.tick - b.tick);
  const tempos: SurvivalTutorialV4MidiTempoEvent[] =
    sorted.length > 0 && sorted[0].tick === 0
      ? sorted
      : [{ tick: 0, usPerQuarter: DEFAULT_US_PER_QUARTER }, ...sorted];

  return { ticksPerQuarter, tempos };
};

/** 一定 BPM のテンポマップを生成(MIDI 未指定時のフォールバック用)。 */
export const createConstantTempoMap = (
  bpm: number,
  ticksPerQuarter = 480,
): SurvivalTutorialV4MidiTempoMap => {
  const safeBpm = Number.isFinite(bpm) && bpm > 0 ? bpm : 120;
  return {
    ticksPerQuarter,
    tempos: [{ tick: 0, usPerQuarter: Math.round(60000000 / safeBpm) }],
  };
};

/** 四分音符基準の拍数を tick に変換。 */
export const quarterBeatsToTick = (
  map: SurvivalTutorialV4MidiTempoMap,
  quarterBeats: number,
): number => Math.round(quarterBeats * map.ticksPerQuarter);

/** 絶対 tick を秒へ変換(区間積分)。 */
export const midiTickToSeconds = (
  map: SurvivalTutorialV4MidiTempoMap,
  tick: number,
): number => {
  const { tempos, ticksPerQuarter } = map;
  let seconds = 0;
  for (let i = 0; i < tempos.length; i += 1) {
    const current = tempos[i];
    const next = tempos[i + 1];
    const segmentEndTick = next ? Math.min(next.tick, tick) : tick;
    if (segmentEndTick > current.tick) {
      const deltaTicks = segmentEndTick - current.tick;
      seconds += (deltaTicks * current.usPerQuarter) / ticksPerQuarter / 1_000_000;
    }
    if (next && tick <= next.tick) {
      break;
    }
  }
  return Math.round(seconds * 1_000_000) / 1_000_000;
};
