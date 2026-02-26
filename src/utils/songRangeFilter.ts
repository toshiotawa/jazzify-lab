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

interface MeasureBoundary {
  measureNumber: number;
  startTime: number;
  endTime: number;
}

function calculateMeasureTimeBoundaries(xmlText: string): MeasureBoundary[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const measures = Array.from(doc.querySelectorAll('part:first-of-type > measure'));

  let divisionsPerQuarter = 1;
  let tempo = 120;
  let beatsPerMeasure = 4;
  let beatType = 4;
  let currentTime = 0;

  const boundaries: MeasureBoundary[] = [];

  for (const measure of measures) {
    const num = parseInt(measure.getAttribute('number') || '0', 10);

    const attrs = measure.querySelector('attributes');
    if (attrs) {
      const div = attrs.querySelector('divisions');
      if (div) divisionsPerQuarter = parseInt(div.textContent || '1', 10);
      const timeEl = attrs.querySelector('time');
      if (timeEl) {
        const b = parseInt(timeEl.querySelector('beats')?.textContent || '', 10);
        const bt = parseInt(timeEl.querySelector('beat-type')?.textContent || '', 10);
        if (!isNaN(b) && b > 0) beatsPerMeasure = b;
        if (!isNaN(bt) && bt > 0) beatType = bt;
      }
    }

    const soundEl = measure.querySelector(':scope > sound[tempo]');
    if (soundEl) {
      const t = parseFloat(soundEl.getAttribute('tempo') || '');
      if (!isNaN(t) && t > 0) tempo = t;
    }
    for (const dir of Array.from(measure.querySelectorAll(':scope > direction'))) {
      const dirSound = dir.querySelector('sound[tempo]');
      if (dirSound) {
        const t = parseFloat(dirSound.getAttribute('tempo') || '');
        if (!isNaN(t) && t > 0) tempo = t;
      }
    }

    const measureStartTime = currentTime;
    const measureDuration = beatsPerMeasure * (60 / tempo) * (4 / beatType);
    currentTime += measureDuration;

    boundaries.push({ measureNumber: num, startTime: measureStartTime, endTime: currentTime });
  }

  return boundaries;
}

export async function filterNotesByMeasureRange(
  notes: NoteData[],
  xmlText: string,
  startMeasure: number,
  endMeasure: number,
  audioPaddingMeasures: number,
  audioPaddingSeconds?: number | null
): Promise<RangeFilterResult> {
  const boundaries = calculateMeasureTimeBoundaries(xmlText);

  const startInfo = boundaries.find((m) => m.measureNumber === startMeasure);
  const endInfo = boundaries.find((m) => m.measureNumber === endMeasure);

  if (!startInfo || !endInfo) {
    const fallbackStart = boundaries[0];
    const fallbackEnd = boundaries[boundaries.length - 1];
    const rangeStart = startInfo?.startTime ?? fallbackStart?.startTime ?? 0;
    const rangeEnd = endInfo?.endTime ?? fallbackEnd?.endTime ?? (notes[notes.length - 1]?.time ?? 60);
    return filterNotesByTimeRange(notes, rangeStart, rangeEnd, null, null, 2);
  }

  const rangeStartTime = startInfo.startTime;
  const rangeEndTime = endInfo.endTime;

  const filtered = notes.filter(
    (n) => n.time >= rangeStartTime && n.time < rangeEndTime + 0.01
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

    const paddedStartInfo = boundaries.find((m) => m.measureNumber === paddedStartMeasure);
    const paddedEndInfo = boundaries.find((m) => m.measureNumber === paddedEndMeasure);
    const lastBoundary = boundaries[boundaries.length - 1];

    if (paddedStartInfo) audioStartTime = paddedStartInfo.startTime;
    if (paddedEndInfo) {
      audioEndTime = paddedEndInfo.endTime;
    } else if (lastBoundary && paddedEndMeasure > lastBoundary.measureNumber) {
      audioEndTime = lastBoundary.endTime;
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

    // 範囲外（前方）の小節からテンポ指示を収集
    let lastTempoElement: Element | null = null;
    for (const m of measures) {
      const num = parseInt(m.getAttribute('number') || '0', 10);
      if (num >= startMeasure) break;
      for (const child of Array.from(m.children)) {
        if (child.tagName === 'sound' && child.hasAttribute('tempo')) {
          lastTempoElement = child;
        } else if (child.tagName === 'direction') {
          const dirSound = child.querySelector('sound[tempo]');
          if (dirSound) {
            lastTempoElement = child;
          }
        }
      }
    }

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
      targetAttrs = firstSurvivingMeasure.querySelector('attributes');
    } else {
      for (const tag of essentialTags) {
        if (!targetAttrs.querySelector(tag) && sourceAttrs.querySelector(tag)) {
          const elements = sourceAttrs.querySelectorAll(tag);
          elements.forEach(el => {
            targetAttrs!.appendChild(el.cloneNode(true));
          });
        }
      }
    }

    // テンポ指示を最初の surviving measure に挿入（attributes の直後）
    if (lastTempoElement && targetAttrs) {
      const existingTempo = firstSurvivingMeasure.querySelector(':scope > sound[tempo]')
        || firstSurvivingMeasure.querySelector(':scope > direction > sound[tempo]');
      if (!existingTempo) {
        const insertBefore = targetAttrs.nextSibling;
        firstSurvivingMeasure.insertBefore(lastTempoElement.cloneNode(true), insertBefore);
      }
    }

    removeEmptyStaves(part, targetAttrs);
  });

  return new XMLSerializer().serializeToString(xmlDoc);
}

function removeEmptyStaves(part: Element, attrs: Element | null): void {
  if (!attrs) return;
  const stavesEl = attrs.querySelector('staves');
  const numStaves = stavesEl ? parseInt(stavesEl.textContent || '1', 10) : 1;
  if (numStaves <= 1) return;

  const usedStaves = new Set<number>();
  const survivingMeasures = part.querySelectorAll('measure');
  survivingMeasures.forEach(m => {
    m.querySelectorAll('note').forEach(noteEl => {
      if (noteEl.querySelector('rest')) return;
      const staffEl = noteEl.querySelector('staff');
      const staffNum = staffEl ? parseInt(staffEl.textContent || '1', 10) : 1;
      usedStaves.add(staffNum);
    });
  });

  if (usedStaves.size >= numStaves) return;

  const keepStaff = usedStaves.size > 0 ? Math.min(...usedStaves) : 1;

  stavesEl!.textContent = '1';

  const clefs = attrs.querySelectorAll('clef');
  clefs.forEach(clef => {
    const clefNumber = parseInt(clef.getAttribute('number') || '1', 10);
    if (clefNumber !== keepStaff) {
      clef.parentNode?.removeChild(clef);
    } else {
      clef.removeAttribute('number');
    }
  });

  survivingMeasures.forEach(m => {
    const localAttrs = m.querySelector('attributes');
    if (localAttrs && localAttrs !== attrs) {
      const localStaves = localAttrs.querySelector('staves');
      if (localStaves) localStaves.textContent = '1';

      const localClefs = localAttrs.querySelectorAll('clef');
      localClefs.forEach(clef => {
        const clefNumber = parseInt(clef.getAttribute('number') || '1', 10);
        if (clefNumber !== keepStaff) {
          clef.parentNode?.removeChild(clef);
        } else {
          clef.removeAttribute('number');
        }
      });
    }

    m.querySelectorAll('note').forEach(noteEl => {
      const staffEl = noteEl.querySelector('staff');
      if (staffEl) staffEl.textContent = '1';
    });

    m.querySelectorAll('backup, forward').forEach(el => {
      const staffEl = el.querySelector('staff');
      if (staffEl) staffEl.textContent = '1';
    });
  });
}

export function filterMusicXmlByStaff(xmlString: string, keepHand: 'right' | 'left'): string {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
  const parts = xmlDoc.querySelectorAll('part');

  const keepStaff = keepHand === 'right' ? 1 : 2;

  parts.forEach(part => {
    const measures = part.querySelectorAll('measure');

    measures.forEach(measure => {
      const toRemove: Element[] = [];

      for (const child of Array.from(measure.children)) {
        switch (child.tagName) {
          case 'note': {
            const staffEl = child.querySelector('staff');
            const staffNum = staffEl ? parseInt(staffEl.textContent || '1', 10) : 1;
            if (staffNum !== keepStaff) {
              toRemove.push(child);
            }
            break;
          }
          case 'backup':
            toRemove.push(child);
            break;
          case 'forward': {
            const staffEl = child.querySelector('staff');
            if (staffEl) {
              const staffNum = parseInt(staffEl.textContent || '1', 10);
              if (staffNum !== keepStaff) {
                toRemove.push(child);
              }
            }
            break;
          }
          case 'direction': {
            const staffEl = child.querySelector('staff');
            if (staffEl) {
              const staffNum = parseInt(staffEl.textContent || '1', 10);
              if (staffNum !== keepStaff) {
                toRemove.push(child);
              }
            }
            break;
          }
        }
      }

      for (const el of toRemove) {
        measure.removeChild(el);
      }
    });

    const firstMeasureAttrs = part.querySelector('measure > attributes');
    removeEmptyStaves(part, firstMeasureAttrs);

    measures.forEach(m => {
      m.querySelectorAll('direction').forEach(dir => {
        const staffEl = dir.querySelector(':scope > staff');
        if (staffEl) staffEl.textContent = '1';
      });
    });
  });

  return new XMLSerializer().serializeToString(xmlDoc);
}

export function isRangeDuplicate(song: any): boolean {
  return !!(song.source_song_id && song.range_type);
}
