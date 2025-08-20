import { note as parseNote } from 'tonal';

export interface ParsedChordEvent {
  bar: number;
  beats: number; // 1-based beat position within the bar (supports fractional)
  text: string; // chord text from <lyric><text>
  notes: { name: string; midi: number }[]; // simultaneous notes at that onset
  bass: { name: string; midi: number } | null; // lowest note if any
}

/** Convert MusicXML <step> + optional <alter> + <octave> to note name with octave (e.g., C#4) */
function xmlPitchToNoteName(step: string, alter: number | null | undefined, octave: string | null): string | null {
  if (!step || !octave) return null;
  let acc = '';
  if (typeof alter === 'number') {
    if (alter === 1) acc = '#';
    else if (alter === -1) acc = 'b';
    else if (alter === 2) acc = 'x';
    else if (alter === -2) acc = 'bb';
    else acc = '';
  }
  return `${step}${acc}${octave}`;
}

/** Get integer from element textContent, or null */
function intOrNull(el: Element | null): number | null {
  if (!el) return null;
  const v = el.textContent?.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Safe query helper */
function hasChild(el: Element, tagName: string): boolean {
  return el.getElementsByTagName(tagName).length > 0;
}

/**
 * Parse a MusicXML string and extract chord events where chord symbols appear in lyric/text.
 * - harmony tags are intentionally ignored.
 * - Groups simultaneous chord notes via <chord/> markers.
 * - Computes bar (measure number) and beats (1-based) using divisions and time signature.
 */
export function parseMusicXmlForChords(xmlString: string): ParsedChordEvent[] {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    throw new Error('MusicXML parsing requires a browser environment');
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  // Basic error check
  const parserErrors = doc.getElementsByTagName('parsererror');
  if (parserErrors && parserErrors.length > 0) {
    throw new Error('MusicXMLの解析に失敗しました（XML構文エラー）');
  }

  const parts = Array.from(doc.getElementsByTagName('part'));
  if (parts.length === 0) return [];

  const events: ParsedChordEvent[] = [];

  for (const part of parts) {
    const measures = Array.from(part.getElementsByTagName('measure'));

    let currentDivisions: number = 1; // default fallbacks
    let currentBeatType: number = 4; // denominator

    for (const measure of measures) {
      // Update attributes within this measure when present
      const attrs = measure.getElementsByTagName('attributes')[0] || null;
      if (attrs) {
        const div = intOrNull(attrs.getElementsByTagName('divisions')[0] || null);
        if (div && div > 0) currentDivisions = div;
        const timeEl = attrs.getElementsByTagName('time')[0] || null;
        if (timeEl) {
          const beatTypeEl = timeEl.getElementsByTagName('beat-type')[0] || null;
          const bt = intOrNull(beatTypeEl);
          if (bt && bt > 0) currentBeatType = bt;
        }
      }

      const measureNumberStr = measure.getAttribute('number') || '0';
      const bar = Number(measureNumberStr) || 0;

      // Beat length in divisions
      const beatLenTicks = (4 / currentBeatType) * currentDivisions;
      let posTicks = 0; // position within measure

      // Iterate notes in-order, grouping chord stacks
      let pendingGroup: {
        startTicks: number;
        text: string | null;
        notes: { name: string; midi: number }[];
      } | null = null;

      const noteEls = Array.from(measure.getElementsByTagName('note'));
      for (const note of noteEls) {
        const isChordTone = hasChild(note, 'chord');
        const isRest = hasChild(note, 'rest');
        const durationEl = note.getElementsByTagName('duration')[0] || null;
        const durationTicks = intOrNull(durationEl) || 0;

        // Collect lyric text only on the first note of a chord group
        let lyricText: string | null = null;
        if (!isChordTone) {
          const lyric = note.getElementsByTagName('lyric')[0] || null;
          if (lyric) {
            const textEl = lyric.getElementsByTagName('text')[0] || null;
            const t = textEl?.textContent?.trim();
            if (t) lyricText = t;
          }
        }

        // Extract pitch if not rest
        let pitchName: string | null = null;
        if (!isRest) {
          const pitchEl = note.getElementsByTagName('pitch')[0] || null;
          if (pitchEl) {
            const step = pitchEl.getElementsByTagName('step')[0]?.textContent?.trim() || '';
            const alter = intOrNull(pitchEl.getElementsByTagName('alter')[0] || null);
            const octave = pitchEl.getElementsByTagName('octave')[0]?.textContent?.trim() || null;
            pitchName = xmlPitchToNoteName(step, alter, octave);
          }
        }

        // Start new onset if this is not a chord tone
        if (!isChordTone) {
          // Finalize previous group
          if (pendingGroup && pendingGroup.text) {
            const beats = 1 + (pendingGroup.startTicks / beatLenTicks);
            const sorted = [...pendingGroup.notes].sort((a, b) => a.midi - b.midi);
            const bass = sorted.length ? sorted[0] : null;
            events.push({
              bar,
              beats: Number(beats.toFixed(4)),
              text: pendingGroup.text,
              notes: sorted,
              bass
            });
          }

          // Begin new group
          pendingGroup = { startTicks: posTicks, text: lyricText, notes: [] };

          // Add the first note's pitch to group if available
          if (pitchName) {
            const parsed = parseNote(pitchName) as any;
            const midi: number | null = parsed?.midi ?? null;
            if (typeof midi === 'number') {
              pendingGroup.notes.push({ name: pitchName, midi });
            } else {
              pendingGroup.notes.push({ name: pitchName, midi: Number.NEGATIVE_INFINITY });
            }
          }

          // Advance time by duration for non-chord notes (rests advance too)
          posTicks += durationTicks;
        } else {
          // This is an additional chord tone at the same onset
          if (pendingGroup && pitchName) {
            const parsed = parseNote(pitchName) as any;
            const midi: number | null = parsed?.midi ?? null;
            if (typeof midi === 'number') {
              pendingGroup.notes.push({ name: pitchName, midi });
            } else {
              pendingGroup.notes.push({ name: pitchName, midi: Number.NEGATIVE_INFINITY });
            }
          }
          // Do not advance posTicks for <chord/>
        }
      }

      // Finalize trailing group for the measure
      if (pendingGroup && pendingGroup.text) {
        const beats = 1 + (pendingGroup.startTicks / beatLenTicks);
        const sorted = [...pendingGroup.notes].sort((a, b) => a.midi - b.midi);
        const bass = sorted.length ? sorted[0] : null;
        events.push({
          bar,
          beats: Number(beats.toFixed(4)),
          text: pendingGroup.text,
          notes: sorted,
          bass
        });
      }
    }

    // Only take the first part by default
    break;
  }

  return events;
}