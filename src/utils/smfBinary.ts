/** SMF(Standard MIDI File) バイナリ読み取り共通ユーティリティ */

export interface SmfTempoEvent {
  readonly tick: number;
  readonly usPerQuarter: number;
}

export interface SmfTempoMap {
  readonly ticksPerQuarter: number;
  readonly tempos: readonly SmfTempoEvent[];
}

export interface SmfVlqResult {
  readonly value: number;
  readonly nextOffset: number;
}

export const SMF_DEFAULT_US_PER_QUARTER = 500000;

export const readSmfUint32 = (data: Uint8Array, offset: number): number =>
  ((data[offset] << 24) |
    (data[offset + 1] << 16) |
    (data[offset + 2] << 8) |
    data[offset + 3]) >>>
  0;

export const readSmfUint16 = (data: Uint8Array, offset: number): number =>
  (data[offset] << 8) | data[offset + 1];

export const smfMatchesAscii = (data: Uint8Array, offset: number, ascii: string): boolean => {
  for (let i = 0; i < ascii.length; i += 1) {
    if (data[offset + i] !== ascii.charCodeAt(i)) {
      return false;
    }
  }
  return true;
};

export const readSmfVariableLengthQuantity = (data: Uint8Array, offset: number): SmfVlqResult => {
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

export const smfDataBytesForChannelStatus = (status: number): number => {
  const high = status & 0xf0;
  return high === 0xc0 || high === 0xd0 ? 1 : 2;
};

export interface SmfTrackChunk {
  readonly trackStart: number;
  readonly trackEnd: number;
}

export const parseSmfHeader = (data: Uint8Array): { ticksPerQuarter: number; trackChunks: SmfTrackChunk[] } => {
  if (data.length < 14 || !smfMatchesAscii(data, 0, 'MThd')) {
    throw new Error('SMF ヘッダ(MThd)が見つかりません');
  }
  const headerLength = readSmfUint32(data, 4);
  const division = readSmfUint16(data, 12);
  if ((division & 0x8000) !== 0) {
    throw new Error('SMPTE 形式の division は非対応です');
  }
  const ticksPerQuarter = division;
  if (ticksPerQuarter <= 0) {
    throw new Error('division が不正です');
  }

  const trackChunks: SmfTrackChunk[] = [];
  let offset = 8 + headerLength;
  while (offset + 8 <= data.length) {
    if (!smfMatchesAscii(data, offset, 'MTrk')) {
      const len = readSmfUint32(data, offset + 4);
      offset += 8 + len;
      continue;
    }
    const trackLength = readSmfUint32(data, offset + 4);
    const trackStart = offset + 8;
    const trackEnd = trackStart + trackLength;
    trackChunks.push({ trackStart, trackEnd });
    offset = trackEnd;
  }

  return { ticksPerQuarter, trackChunks };
};

export const collectSmfTempoEvents = (
  data: Uint8Array,
  trackStart: number,
  trackEnd: number,
): SmfTempoEvent[] => {
  const tempos: SmfTempoEvent[] = [];
  let offset = trackStart;
  let absoluteTick = 0;
  let runningStatus = 0;

  while (offset < trackEnd) {
    const delta = readSmfVariableLengthQuantity(data, offset);
    absoluteTick += delta.value;
    offset = delta.nextOffset;

    let status = data[offset];
    if (status < 0x80) {
      status = runningStatus;
    } else {
      offset += 1;
    }

    if (status === 0xff) {
      const metaType = data[offset];
      offset += 1;
      const len = readSmfVariableLengthQuantity(data, offset);
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
      const len = readSmfVariableLengthQuantity(data, offset);
      offset = len.nextOffset + len.value;
      continue;
    }

    runningStatus = status;
    offset += smfDataBytesForChannelStatus(status);
  }

  return tempos;
};

export const buildSmfTempoMap = (data: Uint8Array): SmfTempoMap => {
  const { ticksPerQuarter, trackChunks } = parseSmfHeader(data);
  const collected: SmfTempoEvent[] = [];
  for (const chunk of trackChunks) {
    collected.push(...collectSmfTempoEvents(data, chunk.trackStart, chunk.trackEnd));
  }
  const sorted = [...collected].sort((a, b) => a.tick - b.tick);
  const tempos: SmfTempoEvent[] =
    sorted.length > 0 && sorted[0].tick === 0
      ? sorted
      : [{ tick: 0, usPerQuarter: SMF_DEFAULT_US_PER_QUARTER }, ...sorted];
  return { ticksPerQuarter, tempos };
};

export const createConstantSmfTempoMap = (
  bpm: number,
  ticksPerQuarter = 480,
): SmfTempoMap => {
  const safeBpm = Number.isFinite(bpm) && bpm > 0 ? bpm : 120;
  return {
    ticksPerQuarter,
    tempos: [{ tick: 0, usPerQuarter: Math.round(60_000_000 / safeBpm) }],
  };
};

export const smfTickToSeconds = (map: SmfTempoMap, tick: number): number => {
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
