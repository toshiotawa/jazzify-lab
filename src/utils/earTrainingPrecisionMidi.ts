import {
  isPrecisionShortNoteDuration,
  resolvePrecisionKeyboardRange,
  trimOverlappingSamePitchNotes,
  type PrecisionNote,
  type PrecisionNoteBuildResult,
} from '@/utils/earTrainingPrecisionNotes';
import {
  buildSmfTempoMap,
  parseSmfHeader,
  readSmfVariableLengthQuantity,
  smfDataBytesForChannelStatus,
  smfTickToSeconds,
} from '@/utils/smfBinary';

const BLACK_KEY_OFFSETS = new Set([1, 3, 6, 8, 10]);

const isBlackKeyMidi = (midi: number): boolean => (
  BLACK_KEY_OFFSETS.has(((Math.round(midi) % 12) + 12) % 12)
);

const precisionMidiNoteId = (startTick: number, midi: number, indexInCluster: number): string => (
  `m:${startTick}:${midi}:${indexInCluster}`
);

interface ParsedMidiNoteEvent {
  startTick: number;
  endTick: number;
  midi: number;
}

interface ActiveNote {
  startTick: number;
}

const parseTrackNoteEvents = (
  data: Uint8Array,
  trackStart: number,
  trackEnd: number,
): ParsedMidiNoteEvent[] => {
  const notes: ParsedMidiNoteEvent[] = [];
  const activeByKey = new Map<string, ActiveNote[]>();
  let offset = trackStart;
  let absoluteTick = 0;
  let runningStatus = 0;

  const pushNoteOn = (channel: number, midi: number, velocity: number): void => {
    if (velocity <= 0) {
      closeNote(channel, midi, absoluteTick);
      return;
    }
    const key = `${channel}:${midi}`;
    const stack = activeByKey.get(key) ?? [];
    stack.push({ startTick: absoluteTick });
    activeByKey.set(key, stack);
  };

  const closeNote = (channel: number, midi: number, endTick: number): void => {
    const key = `${channel}:${midi}`;
    const stack = activeByKey.get(key);
    if (!stack || stack.length === 0) {
      return;
    }
    const started = stack.pop();
    if (!started) {
      return;
    }
    if (stack.length === 0) {
      activeByKey.delete(key);
    }
    if (endTick > started.startTick) {
      notes.push({
        startTick: started.startTick,
        endTick,
        midi,
      });
    }
  };

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
      offset = len.nextOffset + len.value;
      if (metaType === 0x2f) {
        break;
      }
      continue;
    }

    if (status === 0xf0 || status === 0xf7) {
      const len = readSmfVariableLengthQuantity(data, offset);
      offset = len.nextOffset + len.value;
      continue;
    }

    const high = status & 0xf0;
    const channel = status & 0x0f;
    runningStatus = status;

    if (high === 0x90) {
      const midi = data[offset];
      const velocity = data[offset + 1];
      pushNoteOn(channel, midi, velocity);
      offset += 2;
      continue;
    }

    if (high === 0x80) {
      const midi = data[offset];
      closeNote(channel, midi, absoluteTick);
      offset += 2;
      continue;
    }

    offset += smfDataBytesForChannelStatus(status);
  }

  return notes;
};

export const buildPrecisionNotesFromMidi = (
  data: Uint8Array,
  bpm: number,
  transposeOffset = 0,
): PrecisionNoteBuildResult => {
  const tempoMap = buildSmfTempoMap(data);
  const { trackChunks } = parseSmfHeader(data);
  const parsed: ParsedMidiNoteEvent[] = [];
  for (const chunk of trackChunks) {
    parsed.push(...parseTrackNoteEvents(data, chunk.trackStart, chunk.trackEnd));
  }

  const clusterIndexByTick = new Map<number, number>();
  const notes: PrecisionNote[] = parsed.map(event => {
    const startSec = smfTickToSeconds(tempoMap, event.startTick);
    const endSec = smfTickToSeconds(tempoMap, event.endTick);
    const durationSec = Math.max(0.05, endSec - startSec);
    const midi = event.midi + transposeOffset;
    const indexInCluster = clusterIndexByTick.get(event.startTick) ?? 0;
    clusterIndexByTick.set(event.startTick, indexInCluster + 1);
    return {
      id: precisionMidiNoteId(event.startTick, midi, indexInCluster),
      midi,
      startSec,
      durationSec,
      isBlackKey: isBlackKeyMidi(midi),
      measureNumber: 1,
      isShortNote: isPrecisionShortNoteDuration(durationSec, bpm),
    };
  });

  notes.sort((a, b) => {
    if (Math.abs(a.startSec - b.startSec) > 0.0005) {
      return a.startSec - b.startSec;
    }
    if (a.midi !== b.midi) {
      return a.midi - b.midi;
    }
    return a.id.localeCompare(b.id);
  });

  const trimmedNotes = trimOverlappingSamePitchNotes(notes, bpm);

  const keyboardRange = resolvePrecisionKeyboardRange(trimmedNotes.map(note => note.midi));
  return { notes: trimmedNotes, keyboardRange };
};
