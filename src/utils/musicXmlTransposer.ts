import { Note, Interval } from 'tonal';

/**
 * Transpose MusicXML string by given semitones, applying custom enharmonic rules.
 *
 * @param xmlString Raw MusicXML
 * @param semitones integer, positive = up, negative = down
 * @returns Transposed MusicXML string
 */
export function transposeMusicXml(xmlString: string, semitones: number): string {
  if (semitones === 0) return xmlString;

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  // Helper to convert step/alter/octave to tonal note string, e.g. C#, Eb4
  const pitchToNote = (step: string, alter: number | null, octave: number): string => {
    const accidental = alter === 1 ? '#' : alter === -1 ? 'b' : '';
    return `${step.toUpperCase()}${accidental}${octave}`;
  };

  // Helper to write back tonal note with support for double accidentals
  const applyNoteToPitch = (noteStr: string, pitchEl: Element) => {
    const parsed = Note.get(noteStr);
    if (!parsed.empty) {
      const { letter, acc, oct } = parsed;
      // Clear existing children then append
      Array.from(pitchEl.children).forEach((c) => c.remove());
      const stepEl = doc.createElement('step');
      stepEl.textContent = letter;
      pitchEl.appendChild(stepEl);

      if (acc) {
        const alterEl = doc.createElement('alter');
        let alterValue = '0';
        if (acc === '#') alterValue = '1';
        else if (acc === '##' || acc === 'x') alterValue = '2';
        else if (acc === 'b') alterValue = '-1';
        else if (acc === 'bb') alterValue = '-2';
        alterEl.textContent = alterValue;
        pitchEl.appendChild(alterEl);
      }
      const octaveEl = doc.createElement('octave');
      octaveEl.textContent = String(oct);
      pitchEl.appendChild(octaveEl);
    }
  };

  // transpose each <note><pitch>, skipping rests and tie-stop notes
  doc.querySelectorAll('note').forEach((noteEl) => {
    // Skip rest notes
    if (noteEl.querySelector('rest')) return;
    // Skip tie stop (後ろ側)
    if (Array.from(noteEl.querySelectorAll('tie')).some(t => t.getAttribute('type') === 'stop')) return;

    const pitchEl = noteEl.querySelector('pitch');
    if (!pitchEl) return; // safety
    const stepEl = pitchEl.querySelector('step');
    const alterEl = pitchEl.querySelector('alter');
    const octaveEl = pitchEl.querySelector('octave');
    if (!stepEl || !octaveEl) return;
    const step = stepEl.textContent || 'C';
    const alter = alterEl ? parseInt(alterEl.textContent || '0', 10) : 0;
    const octave = parseInt(octaveEl.textContent || '4', 10);

    const noteStr = pitchToNote(step, alter, octave);
    const transposedNote = Note.transpose(noteStr, Interval.fromSemitones(semitones));
    
    applyNoteToPitch(transposedNote, pitchEl);
  });

  // transpose key signature <key><fifths>
  doc.querySelectorAll('key').forEach((keyEl) => {
    const fifthsEl = keyEl.querySelector('fifths');
    if (!fifthsEl) return;
    const current = parseInt(fifthsEl.textContent || '0', 10);
    const newFifths = current + semitonesToFifths(semitones);
    fifthsEl.textContent = String(newFifths);
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

// Convert semitones to fifths (circle of fifths key signature).
function semitonesToFifths(semitones: number): number {
  // Map semitone shift (0=C) to key signature fifths within range -7..7
  // 0:C(0), 1:C#/Db(+7), 2:D(+2), 3:Eb(-3), 4:E(+4), 5:F(-1), 6:Gb(-6), 7:G(+1), 8:Ab(-4), 9:A(+3), 10:Bb(-2), 11:B(+5)
  const semitoneToFifthsMap = [0, 7, 2, -3, 4, -1, -6, 1, -4, 3, -2, 5];
  const mod = ((semitones % 12) + 12) % 12;
  return semitoneToFifthsMap[mod];
}

 