import { Note, Chord, Interval } from 'tonal';
import { ChordDefinition } from '../components/fantasy/FantasyGameEngine';
import { ChordSpec, ChordProgressionDataItem } from '../components/fantasy/TaikoNoteSystem';

// Allowed keys: C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B (12 keys)
export const ALLOWED_KEYS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];

/**
 * Get the next key based on the current key and interval (semitones).
 * Ensures the result is in the allowed keys list.
 */
export function getNextKey(currentKey: string, intervalSemitones: number): string {
  // Normalize current key to allowed keys
  const normalizedCurrent = normalizeKey(currentKey);
  
  // Calculate next key
  const transposed = Note.transpose(normalizedCurrent, Interval.fromSemitones(intervalSemitones));
  
  // Normalize the result
  return normalizeKey(transposed);
}

/**
 * Normalize a key to the allowed list (e.g., C# -> Db, F# -> Gb, Cb -> B).
 */
export function normalizeKey(key: string): string {
  const simplified = Note.simplify(key); // Handles double sharps/flats
  
  // Explicit mapping for common enharmonics not handled by simplify preference
  // tonal prefers sharps in some contexts, we want flats for black keys generally (except F# which we want as Gb)
  const map: Record<string, string> = {
    'C#': 'Db',
    'D#': 'Eb',
    'F#': 'Gb',
    'G#': 'Ab',
    'A#': 'Bb',
    'Cb': 'B',
    'B#': 'C',
    'E#': 'F',
    'Fb': 'E'
  };

  // Strip octave if present
  const pitchClass = simplified.replace(/[0-9-]/g, '');
  
  if (ALLOWED_KEYS.includes(pitchClass)) {
    return pitchClass;
  }
  
  if (map[pitchClass]) {
    return map[pitchClass];
  }
  
  // Fallback: Find enharmonic equivalent in ALLOWED_KEYS
  const midi = Note.midi(pitchClass + '4'); // Use octave 4 for midi calc
  if (midi === null) return 'C';
  
  const mod = midi % 12;
  // Map midi remainder to our keys
  // 0:C, 1:Db, 2:D, 3:Eb, 4:E, 5:F, 6:Gb, 7:G, 8:Ab, 9:A, 10:Bb, 11:B
  const midiMap = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  return midiMap[mod];
}

/**
 * Transpose a ChordSpec by a number of semitones.
 */
export function transposeChordSpec(spec: ChordSpec, semitones: number): ChordSpec {
  if (semitones === 0) return spec;

  if (typeof spec === 'string') {
    // String spec (e.g. "CM7")
    return transposeChordName(spec, semitones);
  }

  // Object spec
  const newRoot = Note.transpose(spec.chord, Interval.fromSemitones(semitones));
  // Note: We need to be careful with chord symbols. Note.transpose might give "C#M7", we might want "DbM7".
  // But for ChordSpec.chord, it usually expects just the root or root+quality.
  // Ideally we should decompose, transpose root, and recompose.
  
  // Simple approach: Transpose the whole string (which might be just root or root+quality)
  // If spec.chord is just "C", transpose gives "C#".
  // If spec.chord is "CM7", Note.transpose might fail or give weird results if it parses it as a note.
  // Actually, tonal's Note.transpose works on Notes. Chord.transpose works on Chords.
  
  return {
    ...spec,
    chord: transposeChordName(spec.chord, semitones)
  };
}

/**
 * Transpose a chord name (e.g. "CM7", "C", "Dmin")
 */
export function transposeChordName(chordName: string, semitones: number): string {
  // Use tonal's Chord.transpose if possible, or manual root transposition
  // First try to parse as chord
  const chord = Chord.get(chordName);
  if (!chord.empty) {
    // It's a valid chord
    const newTonalChord = Chord.transpose(chordName, Interval.fromSemitones(semitones));
    // Normalize root
    const newRoot = normalizeKey(Chord.get(newTonalChord).tonic || '');
    // Reconstruct symbol using original quality if possible or just use the transposed symbol
    // tonal's transposed symbol usually keeps quality.
    // However, tonal might return "C#M7". We want "DbM7".
    // Let's manually replace root.
    
    // Decompose original
    const originalRoot = chord.tonic;
    if (!originalRoot) return newTonalChord;
    
    // Transpose root
    const transposedRoot = Note.transpose(originalRoot, Interval.fromSemitones(semitones));
    const normalizedRoot = normalizeKey(transposedRoot);
    
    // Replace root in original string? No, quality might be complex.
    // Better to use the quality from tonal.
    // chord.type ("major seventh") or chord.aliases[0] ("M7")
    // Let's blindly replace the root string part if it matches start.
    
    // Safer:
    const quality = chordName.substring(originalRoot.length);
    return normalizedRoot + quality;
  }
  
  // If not a chord, maybe a note (single note spec)
  const note = Note.get(chordName);
  if (!note.empty) {
    const transposed = Note.transpose(chordName, Interval.fromSemitones(semitones));
    // Normalize
    const p = Note.get(transposed);
    const norm = normalizeKey(p.pc);
    return norm + (p.oct !== null ? p.oct : '');
  }
  
  // Fallback
  return chordName;
}

/**
 * Transpose chord progression data items.
 */
export function transposeProgressionData(data: ChordProgressionDataItem[], semitones: number): ChordProgressionDataItem[] {
  if (semitones === 0) return data;
  
  return data.map(item => {
    const newItem = { ...item };
    
    if (item.chord) {
      newItem.chord = transposeChordName(item.chord, semitones);
    }
    
    if (item.notes && item.notes.length > 0) {
      newItem.notes = item.notes.map(n => {
        const transposed = Note.transpose(n, Interval.fromSemitones(semitones));
        // Normalize
        const p = Note.get(transposed);
        const norm = normalizeKey(p.pc);
        return norm + (p.oct !== null ? p.oct : '');
      });
    }
    
    // Transpose lyricDisplay (e.g. "C", "Dm7")
    if (item.lyricDisplay) {
      newItem.lyricDisplay = transposeChordName(item.lyricDisplay, semitones);
    }
    
    // Transpose text (Harmony marker)
    if (item.text) {
      newItem.text = transposeChordName(item.text, semitones);
    }
    
    return newItem;
  });
}
