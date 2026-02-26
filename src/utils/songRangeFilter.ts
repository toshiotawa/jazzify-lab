import type { NoteData } from '@/types';

interface RangeFilterResult {
  notes: NoteData[];
  audioStartTime: number;
  audioEndTime: number;
  duration: number;
}

export function filterNotesByTimeRange(
  notes: NoteData[],
  rangeStartTime: number,
  rangeEndTime: number,
  audioStartTime: number | null | undefined,
  audioEndTime: number | null | undefined,
  audioPaddingSeconds: number
): RangeFilterResult {
  const filtered = notes.filter(
    (n) => n.time >= rangeStartTime && n.time <= rangeEndTime
  );

  const effAudioStart = audioStartTime ?? Math.max(0, rangeStartTime - audioPaddingSeconds);
  const effAudioEnd = audioEndTime ?? (rangeEndTime + audioPaddingSeconds);

  const offsetNotes = filtered.map((n) => ({
    ...n,
    time: n.time - effAudioStart,
  }));

  const duration = effAudioEnd - effAudioStart;

  return { notes: offsetNotes, audioStartTime: effAudioStart, audioEndTime: effAudioEnd, duration };
}

export async function filterNotesByMeasureRange(
  notes: NoteData[],
  xmlText: string,
  startMeasure: number,
  endMeasure: number,
  audioPaddingMeasures: number,
  audioPaddingSeconds?: number | null
): Promise<RangeFilterResult> {
  const { estimateMeasureTimeInfo } = await import('@/utils/musicXmlMapper');
  const { parseMusicXmlToNoteData } = await import('@/utils/musicXmlToNotes');

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  const xmlNotes = parseMusicXmlToNoteData(xmlText, 'temp');

  const extractNotePositionsFromDoc = (document: Document) => {
    const positions: Array<{ measureNumber: number; positionInMeasure: number; pitch: number; step: string; octave: number; alter: number }> = [];
    const measures = document.querySelectorAll('measure');
    measures.forEach((measure) => {
      const measureNumber = parseInt(measure.getAttribute('number') || '1', 10);
      let currentPosition = 0;
      measure.querySelectorAll('note').forEach((noteEl) => {
        if (noteEl.querySelector('rest')) {
          const durationEl = noteEl.querySelector('duration');
          if (durationEl) currentPosition += parseInt(durationEl.textContent || '0', 10);
          return;
        }
        if (noteEl.querySelector('chord')) {
          // same position as previous
        } else {
          const durationEl = noteEl.querySelector('duration');
          if (durationEl) {
            const dur = parseInt(durationEl.textContent || '0', 10);
            positions.push({
              measureNumber,
              positionInMeasure: currentPosition,
              pitch: 0, step: '', octave: 0, alter: 0,
            });
            currentPosition += dur;
            return;
          }
        }
        positions.push({
          measureNumber,
          positionInMeasure: currentPosition,
          pitch: 0, step: '', octave: 0, alter: 0,
        });
      });
    });
    return positions;
  };

  const notePositions = extractNotePositionsFromDoc(doc);
  const measureTimeInfo = estimateMeasureTimeInfo(notePositions, notes.length > 0 ? notes : xmlNotes);

  const startInfo = measureTimeInfo.find((m) => m.measureNumber === startMeasure);
  const endInfo = measureTimeInfo.find((m) => m.measureNumber === endMeasure);

  if (!startInfo || !endInfo) {
    const allMeasures = measureTimeInfo.map((m) => m.measureNumber);
    const fallbackStart = measureTimeInfo[0];
    const fallbackEnd = measureTimeInfo[measureTimeInfo.length - 1];
    const rangeStart = startInfo?.startTime ?? fallbackStart?.startTime ?? 0;
    const rangeEnd = endInfo
      ? endInfo.startTime + endInfo.duration
      : fallbackEnd
        ? fallbackEnd.startTime + fallbackEnd.duration
        : notes[notes.length - 1]?.time ?? 60;

    return filterNotesByTimeRange(notes, rangeStart, rangeEnd, null, null, 2);
  }

  const rangeStartTime = startInfo.startTime;
  const rangeEndTime = endInfo.startTime + endInfo.duration;

  const filtered = notes.filter(
    (n) => n.time >= rangeStartTime && n.time <= rangeEndTime
  );

  let audioStartTime = rangeStartTime;
  let audioEndTime = rangeEndTime;

  const useSecondsPadding = audioPaddingSeconds != null && audioPaddingSeconds > 0;

  if (useSecondsPadding) {
    audioStartTime = Math.max(0, rangeStartTime - audioPaddingSeconds);
    audioEndTime = rangeEndTime + audioPaddingSeconds;
  } else if (audioPaddingMeasures > 0) {
    const paddedStartMeasure = Math.max(1, startMeasure - audioPaddingMeasures);
    const paddedEndMeasure = endMeasure + audioPaddingMeasures;

    const paddedStartInfo = measureTimeInfo.find((m) => m.measureNumber === paddedStartMeasure);
    const paddedEndInfo = measureTimeInfo.find((m) => m.measureNumber === paddedEndMeasure);
    const lastMeasureInfo = measureTimeInfo[measureTimeInfo.length - 1];

    if (paddedStartInfo) audioStartTime = paddedStartInfo.startTime;
    if (paddedEndInfo) {
      audioEndTime = paddedEndInfo.startTime + paddedEndInfo.duration;
    } else if (lastMeasureInfo && paddedEndMeasure > lastMeasureInfo.measureNumber) {
      audioEndTime = lastMeasureInfo.startTime + lastMeasureInfo.duration;
    }
  }

  const offsetNotes = filtered.map((n) => ({
    ...n,
    time: n.time - audioStartTime,
  }));

  const duration = audioEndTime - audioStartTime;

  return { notes: offsetNotes, audioStartTime, audioEndTime, duration };
}

export function truncateMusicXmlByMeasureRange(xmlString: string, startMeasure: number, endMeasure: number): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
  const parts = xmlDoc.querySelectorAll('part');

  const essentialTags = ['divisions', 'key', 'time', 'staves', 'clef'];

  parts.forEach(part => {
    const measures = Array.from(part.querySelectorAll('measure'));
    if (measures.length === 0) return;

    const sourceAttrs = measures[0].querySelector('attributes');

    let firstSurvivingMeasure: Element | null = null;

    for (const m of measures) {
      const num = parseInt(m.getAttribute('number') || '0', 10);
      if (num < startMeasure || num > endMeasure) {
        m.parentNode?.removeChild(m);
      } else if (!firstSurvivingMeasure) {
        firstSurvivingMeasure = m;
      }
    }

    if (!firstSurvivingMeasure || !sourceAttrs) return;

    let targetAttrs = firstSurvivingMeasure.querySelector('attributes');
    if (!targetAttrs) {
      firstSurvivingMeasure.insertBefore(
        sourceAttrs.cloneNode(true),
        firstSurvivingMeasure.firstChild
      );
      return;
    }

    for (const tag of essentialTags) {
      if (!targetAttrs.querySelector(tag) && sourceAttrs.querySelector(tag)) {
        const elements = sourceAttrs.querySelectorAll(tag);
        elements.forEach(el => {
          targetAttrs!.appendChild(el.cloneNode(true));
        });
      }
    }
  });

  return new XMLSerializer().serializeToString(xmlDoc);
}

export function isRangeDuplicate(song: any): boolean {
  return !!(song.source_song_id && song.range_type);
}
