import { Note, Interval } from 'tonal';
import type { TransposingInstrument } from '@/types';

/**
 * 移調楽器の移調量を取得
 * @param instrument 移調楽器タイプ
 * @returns 移調量（半音）
 */
export function getTransposingInstrumentSemitones(instrument: TransposingInstrument): number {
  switch (instrument) {
    case 'concert_pitch':
      return 0;
    case 'bb_major_2nd':
      return 2; // in Bb (長2度上) - 実音より2半音低く聞こえる → 楽譜は2半音上に書く
    case 'bb_major_9th':
      return 14; // in Bb (1オクターブ+長2度上) - 実音より14半音低く聞こえる → 楽譜は14半音上に書く
    case 'eb_major_6th':
      return 9; // in Eb (長6度上) - 実音より9半音低く聞こえる → 楽譜は9半音上に書く
    case 'eb_major_13th':
      return 21; // in Eb (1オクターブ+長6度上) - 実音より21半音低く聞こえる → 楽譜は21半音上に書く
    default:
      return 0;
  }
}

/**
 * 移調楽器の表示名を取得
 * @param instrument 移調楽器タイプ
 * @returns 表示名
 */
export function getTransposingInstrumentName(instrument: TransposingInstrument): string {
  switch (instrument) {
    case 'concert_pitch':
      return 'コンサートピッチ（移調なし）';
    case 'bb_major_2nd':
      return 'in Bb (長2度上) ソプラノサックス、トランペット、クラリネット';
    case 'bb_major_9th':
      return 'in Bb (1オクターブ+長2度上) テナーサックス';
    case 'eb_major_6th':
      return 'in Eb (長6度上) アルトサックス';
    case 'eb_major_13th':
      return 'in Eb (1オクターブ+長6度上) バリトンサックス';
    default:
      return 'コンサートピッチ（移調なし）';
  }
}

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
  // 🐛 Fix: ダブルシャープ・ダブルフラットもサポート
  const pitchToNote = (step: string, alter: number | null, octave: number): string => {
    let accidental = '';
    if (alter !== null && alter !== 0) {
      if (alter > 0) {
        accidental = '#'.repeat(alter); // 1=#, 2=##
      } else {
        accidental = 'b'.repeat(-alter); // -1=b, -2=bb
      }
    }
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

  // transpose harmony elements (chord symbols)
  doc.querySelectorAll('harmony').forEach((harmonyEl) => {
    const rootStepEl = harmonyEl.querySelector('root root-step');
    const rootAlterEl = harmonyEl.querySelector('root root-alter');
    
    if (!rootStepEl?.textContent) return;
    
    const rootStep = rootStepEl.textContent;
    const rootAlter = rootAlterEl ? parseInt(rootAlterEl.textContent || '0', 10) : 0;
    
    // Build root note string (C, C#, Bb, etc.)
    let rootNote = rootStep;
    if (rootAlter > 0) {
      rootNote += '#'.repeat(rootAlter);
    } else if (rootAlter < 0) {
      rootNote += 'b'.repeat(-rootAlter);
    }
    
    // Transpose the root note
    const transposedRootNote = Note.transpose(rootNote, Interval.fromSemitones(semitones));
    const parsed = Note.get(transposedRootNote);
    
    if (!parsed.empty) {
      const { letter, acc } = parsed;
      
      // Update root-step
      rootStepEl.textContent = letter;
      
      // Update root-alter
      if (rootAlterEl) {
        rootAlterEl.remove();
      }
      
      if (acc) {
        const newRootAlterEl = doc.createElement('root-alter');
        let alterValue = '0';
        if (acc === '#') alterValue = '1';
        else if (acc === '##' || acc === 'x') alterValue = '2';
        else if (acc === 'b') alterValue = '-1';
        else if (acc === 'bb') alterValue = '-2';
        newRootAlterEl.textContent = alterValue;
        
        const rootEl = harmonyEl.querySelector('root');
        if (rootEl) {
          rootEl.appendChild(newRootAlterEl);
        }
      }
    }
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
  // 0:C(0), 1:Db(-5), 2:D(+2), 3:Eb(-3), 4:E(+4), 5:F(-1), 6:Gb(-6), 7:G(+1), 8:Ab(-4), 9:A(+3), 10:Bb(-2), 11:B(+5)
  const semitoneToFifthsMap = [0, -5, 2, -3, 4, -1, -6, 1, -4, 3, -2, 5];
  const mod = ((semitones % 12) + 12) % 12;
  return semitoneToFifthsMap[mod];
}

 