import type { EarTrainingPhrase, EarTrainingPhraseChord, EarTrainingRank } from '@/types';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

export const CHORD_OSMD_JUDGMENT_WINDOW_SEC = 0.1;
/** カウントイン中に最初のターゲットのハンマーも投げきれるよう、リードを短めにする */
export const CHORD_OSMD_HAMMER_LEAD_SEC = 2.4;
export const CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC = 0.2;

const SAME_TARGET_EPSILON_SEC = 0.0005;
const SAME_TARGET_BEAT_EPSILON = 0.0005;
const XML_TIMING_EPSILON = 0.0005;

interface ChordOsmdMidiCount {
  midi: number;
  count: number;
}

export interface ChordOsmdRhythmTarget {
  id: string;
  label: string;
  orderIndex: number;
  targetTimeSec: number;
  measureNumber: number;
  midiCounts: readonly ChordOsmdMidiCount[];
}

export type ChordOsmdTargetVisualState = 'idle' | 'active' | 'completed' | 'failed';

interface MusicXmlTimingState {
  divisions: number;
  beats: number;
  beatType: number;
}

interface TimedMusicXmlMarker {
  time: number;
  node: Node;
}

interface TimedStaffNote {
  start: number;
  duration: number;
  staff: 1 | 2;
  note: Element;
}

const isElementNode = (node: Node): node is Element => node.nodeType === 1;

const getDirectChild = (parent: Element, localName: string): Element | null => {
  for (let child = parent.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName === localName) {
      return child;
    }
  }
  return null;
};

const getDirectChildText = (parent: Element, localName: string): string | null => {
  const child = getDirectChild(parent, localName);
  const text = child?.textContent?.trim();
  return text ? text : null;
};

const parsePositiveNumber = (value: string | null): number | null => {
  if (value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseStaffNumber = (value: string | null): 1 | 2 | null => {
  if (value === '1') {
    return 1;
  }
  if (value === '2') {
    return 2;
  }
  return null;
};

const setDirectChildText = (doc: Document, parent: Element, localName: string, text: string): void => {
  const existing = getDirectChild(parent, localName);
  if (existing) {
    existing.textContent = text;
    return;
  }
  const child = doc.createElement(localName);
  child.textContent = text;
  parent.appendChild(child);
};

const durationToMusicXmlType = (duration: number, divisions: number): string | null => {
  const ratio = duration / Math.max(1, divisions);
  if (Math.abs(ratio - 4) <= XML_TIMING_EPSILON) {
    return 'whole';
  }
  if (Math.abs(ratio - 2) <= XML_TIMING_EPSILON) {
    return 'half';
  }
  if (Math.abs(ratio - 1) <= XML_TIMING_EPSILON) {
    return 'quarter';
  }
  if (Math.abs(ratio - 0.5) <= XML_TIMING_EPSILON) {
    return 'eighth';
  }
  if (Math.abs(ratio - 0.25) <= XML_TIMING_EPSILON) {
    return '16th';
  }
  return null;
};

const createDurationElement = (doc: Document, duration: number): Element => {
  const durationElement = doc.createElement('duration');
  durationElement.textContent = String(Math.round(duration));
  return durationElement;
};

const createRestNote = (
  doc: Document,
  duration: number,
  voice: 1 | 2,
  staff: 1 | 2,
  divisions: number,
): Element => {
  const note = doc.createElement('note');
  note.appendChild(doc.createElement('rest'));
  note.appendChild(createDurationElement(doc, duration));
  const voiceElement = doc.createElement('voice');
  voiceElement.textContent = String(voice);
  note.appendChild(voiceElement);
  const noteType = durationToMusicXmlType(duration, divisions);
  if (noteType) {
    const typeElement = doc.createElement('type');
    typeElement.textContent = noteType;
    note.appendChild(typeElement);
  }
  const staffElement = doc.createElement('staff');
  staffElement.textContent = String(staff);
  note.appendChild(staffElement);
  return note;
};

const createBackup = (doc: Document, duration: number): Element => {
  const backup = doc.createElement('backup');
  backup.appendChild(createDurationElement(doc, duration));
  return backup;
};

const cloneTimedNote = (doc: Document, source: Element, voice: 1 | 2, staff: 1 | 2): Element => {
  const note = source.cloneNode(true);
  if (!isElementNode(note)) {
    return source;
  }
  setDirectChildText(doc, note, 'voice', String(voice));
  setDirectChildText(doc, note, 'staff', String(staff));
  return note;
};

const readMeasureTiming = (
  measure: Element,
  previous: MusicXmlTimingState,
): MusicXmlTimingState => {
  const attributes = getDirectChild(measure, 'attributes');
  if (!attributes) {
    return previous;
  }
  const divisions = parsePositiveNumber(getDirectChildText(attributes, 'divisions')) ?? previous.divisions;
  const time = getDirectChild(attributes, 'time');
  const beats = time ? parsePositiveNumber(getDirectChildText(time, 'beats')) ?? previous.beats : previous.beats;
  const beatType = time
    ? parsePositiveNumber(getDirectChildText(time, 'beat-type')) ?? previous.beatType
    : previous.beatType;
  return { divisions, beats, beatType };
};

const normalizeMeasureToExplicitTwoStaffVoices = (
  doc: Document,
  measure: Element,
  timing: MusicXmlTimingState,
): boolean => {
  if (measure.getElementsByTagName('backup').length > 0 || measure.getElementsByTagName('forward').length > 0) {
    return false;
  }

  const timedNotes: TimedStaffNote[] = [];
  const markers: TimedMusicXmlMarker[] = [];
  let time = 0;
  let hasUnsupportedNote = false;

  for (const child of Array.from(measure.childNodes)) {
    if (!isElementNode(child)) {
      continue;
    }

    if (child.localName !== 'note') {
      markers.push({ time, node: child.cloneNode(true) });
      continue;
    }

    if (getDirectChild(child, 'chord') || getDirectChild(child, 'grace')) {
      hasUnsupportedNote = true;
      break;
    }

    const duration = parsePositiveNumber(getDirectChildText(child, 'duration'));
    const staff = parseStaffNumber(getDirectChildText(child, 'staff'));
    if (duration === null || staff === null) {
      hasUnsupportedNote = true;
      break;
    }

    timedNotes.push({
      start: time,
      duration,
      staff,
      note: child,
    });
    time += duration;
  }

  if (hasUnsupportedNote || timedNotes.length === 0) {
    return false;
  }

  const hasTreble = timedNotes.some(note => note.staff === 1);
  const hasBass = timedNotes.some(note => note.staff === 2);
  if (!hasTreble || !hasBass) {
    return false;
  }

  const hasStaffSwitch = timedNotes.some((note, index) => index > 0 && note.staff !== timedNotes[index - 1].staff);
  if (!hasStaffSwitch) {
    return false;
  }

  const expectedMeasureDuration = timing.divisions * timing.beats * (4 / timing.beatType);
  const measureDuration = Math.max(time, expectedMeasureDuration);
  if (!Number.isFinite(measureDuration) || measureDuration <= 0) {
    return false;
  }

  while (measure.firstChild) {
    measure.removeChild(measure.firstChild);
  }

  const inlineMarkers = markers.filter(marker => marker.time < measureDuration - XML_TIMING_EPSILON);
  const endMarkers = markers.filter(marker => marker.time >= measureDuration - XML_TIMING_EPSILON);
  let markerIndex = 0;

  const appendInlineMarkersUpTo = (targetTime: number): void => {
    while (
      markerIndex < inlineMarkers.length
      && inlineMarkers[markerIndex].time <= targetTime + XML_TIMING_EPSILON
    ) {
      measure.appendChild(inlineMarkers[markerIndex].node);
      markerIndex += 1;
    }
  };

  const appendRest = (duration: number, voice: 1 | 2, staff: 1 | 2): void => {
    if (duration <= XML_TIMING_EPSILON) {
      return;
    }
    measure.appendChild(createRestNote(doc, duration, voice, staff, timing.divisions));
  };

  const appendStaffVoice = (staff: 1 | 2, withMarkers: boolean): void => {
    const staffNotes = timedNotes.filter(note => note.staff === staff);
    let cursor = 0;
    for (const note of staffNotes) {
      if (withMarkers) {
        while (
          markerIndex < inlineMarkers.length
          && inlineMarkers[markerIndex].time < note.start - XML_TIMING_EPSILON
        ) {
          const marker = inlineMarkers[markerIndex];
          appendRest(marker.time - cursor, staff, staff);
          cursor = marker.time;
          measure.appendChild(marker.node);
          markerIndex += 1;
        }
        appendInlineMarkersUpTo(note.start);
      }
      appendRest(note.start - cursor, staff, staff);
      measure.appendChild(cloneTimedNote(doc, note.note, staff, staff));
      cursor = note.start + note.duration;
    }
    if (withMarkers) {
      while (markerIndex < inlineMarkers.length) {
        const marker = inlineMarkers[markerIndex];
        appendRest(marker.time - cursor, staff, staff);
        cursor = marker.time;
        measure.appendChild(marker.node);
        markerIndex += 1;
      }
    }
    appendRest(measureDuration - cursor, staff, staff);
  };

  appendStaffVoice(1, true);
  measure.appendChild(createBackup(doc, measureDuration));
  appendStaffVoice(2, false);
  for (const marker of endMarkers) {
    measure.appendChild(marker.node);
  }
  return true;
};

/** `<harmony>` の並べ替えは MusicXML の時間位置を壊すため行わない。交互 staff の単一 voice のみ正規化する。 */
export const normalizeChordOsmdMusicXml = (xmlText: string): string => {
  if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
    return xmlText;
  }

  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    return xmlText;
  }

  let changed = false;
  let timing: MusicXmlTimingState = { divisions: 1, beats: 4, beatType: 4 };
  for (const measure of Array.from(doc.getElementsByTagName('measure'))) {
    timing = readMeasureTiming(measure, timing);
    changed = normalizeMeasureToExplicitTwoStaffVoices(doc, measure, timing) || changed;
  }

  return changed ? new XMLSerializer().serializeToString(doc) : xmlText;
};

const chordStartTimeSec = (
  chord: EarTrainingPhraseChord,
  beatDurationSec: number,
  beatsPerMeasure: number,
): number => {
  if (typeof chord.start_time_sec === 'number' && Number.isFinite(chord.start_time_sec)) {
    return Math.max(0, chord.start_time_sec);
  }

  if (
    typeof chord.measure_number === 'number'
    && Number.isFinite(chord.measure_number)
    && typeof chord.beat_offset === 'number'
    && Number.isFinite(chord.beat_offset)
  ) {
    const measureIndex = Math.max(0, Math.trunc(chord.measure_number) - 1);
    const beatIndex = Math.max(0, chord.beat_offset - 1);
    return (measureIndex * Math.max(1, beatsPerMeasure) + beatIndex) * beatDurationSec;
  }

  return Math.max(0, chord.order_index) * beatDurationSec;
};

const chordMeasureNumber = (
  chord: EarTrainingPhraseChord,
  targetTimeSec: number,
  beatDurationSec: number,
  beatsPerMeasure: number,
): number => {
  if (typeof chord.measure_number === 'number' && Number.isFinite(chord.measure_number)) {
    return Math.max(1, Math.trunc(chord.measure_number));
  }
  const measureDurationSec = beatDurationSec * Math.max(1, beatsPerMeasure);
  return measureDurationSec > 0
    ? Math.floor(targetTimeSec / measureDurationSec) + 1
    : 1;
};

const chordBeatOffset = (chord: EarTrainingPhraseChord): number | null => {
  if (typeof chord.beat_offset !== 'number' || !Number.isFinite(chord.beat_offset)) {
    return null;
  }
  return chord.beat_offset;
};

const chordItemsAreSameTiming = (
  a: { targetTimeSec: number; measureNumber: number; beatOffset: number | null },
  b: { targetTimeSec: number; measureNumber: number; beatOffset: number | null },
): boolean => {
  if (a.measureNumber !== b.measureNumber) {
    return false;
  }
  if (Math.abs(a.targetTimeSec - b.targetTimeSec) <= SAME_TARGET_EPSILON_SEC) {
    return true;
  }
  return a.beatOffset !== null
    && b.beatOffset !== null
    && Math.abs(a.beatOffset - b.beatOffset) <= SAME_TARGET_BEAT_EPSILON;
};

const noteNameToMidi = (noteName: string): number | null => {
  const trimmed = noteName.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return parseVoicingNoteName(trimmed).midi;
  } catch {
    return null;
  }
};

const addMidiCounts = (
  counts: Map<number, number>,
  voicing: readonly string[] | null | undefined,
): void => {
  for (const noteName of voicing ?? []) {
    const midi = noteNameToMidi(noteName);
    if (midi !== null) {
      counts.set(midi, (counts.get(midi) ?? 0) + 1);
    }
  }
};

const midiCountArray = (counts: ReadonlyMap<number, number>): ChordOsmdMidiCount[] => (
  Array.from(counts, ([midi, count]) => ({ midi, count }))
    .filter(item => item.count > 0)
    .sort((a, b) => a.midi - b.midi)
);

export const buildChordOsmdRhythmTargets = (
  phrase: EarTrainingPhrase | undefined,
  bpm: number,
  beatsPerMeasure: number,
): ChordOsmdRhythmTarget[] => {
  const chords = phrase?.chords ?? [];
  if (chords.length === 0) {
    return [];
  }

  const beatDurationSec = 60 / Math.max(1, bpm);
  const sorted = chords
    .map(chord => {
      const targetTimeSec = chordStartTimeSec(chord, beatDurationSec, beatsPerMeasure);
      const measureNumber = chordMeasureNumber(chord, targetTimeSec, beatDurationSec, beatsPerMeasure);
      const beatOffset = chordBeatOffset(chord);
      return { chord, targetTimeSec, measureNumber, beatOffset };
    })
    .sort((a, b) => {
      if (Math.abs(a.targetTimeSec - b.targetTimeSec) > SAME_TARGET_EPSILON_SEC) {
        return a.targetTimeSec - b.targetTimeSec;
      }
      return a.chord.order_index - b.chord.order_index;
    });

  const targets: Array<ChordOsmdRhythmTarget & { beatOffset: number | null; mutableCounts: Map<number, number> }> = [];
  for (const item of sorted) {
    const counts = new Map<number, number>();
    addMidiCounts(counts, item.chord.voicing);
    if (counts.size === 0) {
      continue;
    }

    const last = targets[targets.length - 1];
    if (
      last
      && chordItemsAreSameTiming(last, item)
    ) {
      if (!last.label.split(' / ').includes(item.chord.chord_name)) {
        last.label = `${last.label} / ${item.chord.chord_name}`;
      }
      counts.forEach((count, midi) => {
        last.mutableCounts.set(midi, (last.mutableCounts.get(midi) ?? 0) + count);
      });
      last.midiCounts = midiCountArray(last.mutableCounts);
      continue;
    }

    targets.push({
      id: item.chord.id,
      label: item.chord.chord_name,
      orderIndex: item.chord.order_index,
      targetTimeSec: item.targetTimeSec,
      measureNumber: item.measureNumber,
      beatOffset: item.beatOffset,
      midiCounts: midiCountArray(counts),
      mutableCounts: counts,
    });
  }

  return targets.map(({ beatOffset: _beatOffset, mutableCounts: _mutableCounts, ...target }) => target);
};

export const createChordOsmdRemainingCounts = (
  target: ChordOsmdRhythmTarget,
): Map<number, number> => (
  new Map(target.midiCounts.map(item => [item.midi, item.count]))
);

export const consumeChordOsmdMidi = (
  remainingCounts: ReadonlyMap<number, number>,
  midi: number,
): Map<number, number> | null => {
  const current = remainingCounts.get(Math.round(midi)) ?? 0;
  if (current <= 0) {
    return null;
  }
  const next = new Map(remainingCounts);
  next.set(Math.round(midi), current - 1);
  return next;
};

export const chordOsmdTargetIsComplete = (
  remainingCounts: ReadonlyMap<number, number>,
): boolean => {
  for (const count of remainingCounts.values()) {
    if (count > 0) {
      return false;
    }
  }
  return true;
};

export const chordOsmdRankForAccuracy = (accuracy: number): EarTrainingRank => {
  if (accuracy >= 0.98) {
    return 'Perfect';
  }
  if (accuracy >= 0.8) {
    return 'Great';
  }
  if (accuracy >= 0.4) {
    return 'Good';
  }
  return 'Fail';
};

export const getChordOsmdTargetNoteCount = (target: ChordOsmdRhythmTarget): number => (
  target.midiCounts.reduce((sum, item) => sum + item.count, 0)
);

export const getChordOsmdTotalNoteCount = (
  targets: readonly ChordOsmdRhythmTarget[],
): number => (
  targets.reduce((sum, target) => sum + getChordOsmdTargetNoteCount(target), 0)
);
