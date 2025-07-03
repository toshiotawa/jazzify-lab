import type { NoteData } from '@/types';

/**
 * Extract playable note names from transposed MusicXML document.
 * Skips rests and tie-stop notes to match JSON note structure.
 */
export function extractPlayableNoteNames(doc: Document): string[] {
  const names: string[] = [];
  let totalNotes = 0;
  let skippedRests = 0;
  let skippedTies = 0;
  
  doc.querySelectorAll('note').forEach((noteEl) => {
    totalNotes++;
    
    // Skip rest notes
    if (noteEl.querySelector('rest')) {
      skippedRests++;
      console.log(`⏸️ Skipping rest at position ${totalNotes}`);
      return;
    }
    
    // Skip tie stop (後ろ側)
    const ties = Array.from(noteEl.querySelectorAll('tie'));
    if (ties.some(t => t.getAttribute('type') === 'stop' && !ties.some(t2 => t2.getAttribute('type') === 'start'))) {
      skippedTies++;
      console.log(`🔗 Skipping tie-stop at position ${totalNotes}`);
      return;
    }

    const pitchEl = noteEl.querySelector('pitch');
    if (!pitchEl) {
      console.warn(`⚠️ Note without pitch at position ${totalNotes}`);
      return;
    }

    const step = pitchEl.querySelector('step')?.textContent ?? 'C';
    const alter = parseInt(pitchEl.querySelector('alter')?.textContent ?? '0', 10);
    const octave = parseInt(pitchEl.querySelector('octave')?.textContent ?? '4', 10);

    // Generate accidental string: 0=natural, 1=#, 2=##, -1=b, -2=bb
    let accidental = '';
    if (alter > 0) {
      accidental = '#'.repeat(alter);
    } else if (alter < 0) {
      accidental = 'b'.repeat(-alter);
    }

    const noteName = `${step}${accidental}${octave}`;
    names.push(noteName);
    console.log(`🎵 Extracted note ${names.length}: ${noteName} (position ${totalNotes})`);
  });
  
  console.log(`📊 MusicXML Note Extraction Summary:
    Total notes in XML: ${totalNotes}
    Skipped rests: ${skippedRests}
    Skipped ties: ${skippedTies}
    Extracted playable notes: ${names.length}`);
  
  return names;
}

/**
 * Merge JSON note data with MusicXML note names.
 * Assumes both arrays are in the same order (time-sequential).
 */
export function mergeJsonWithNames(jsonNotes: NoteData[], noteNames: string[]): NoteData[] {
  console.log(`🔄 Merging ${jsonNotes.length} JSON notes with ${noteNames.length} XML note names`);
  
  if (jsonNotes.length !== noteNames.length) {
    console.error(`❌ Note count mismatch: JSON=${jsonNotes.length}, XML=${noteNames.length}`);
    console.log('First 5 JSON notes:', jsonNotes.slice(0, 5).map(n => ({ time: n.time, pitch: n.pitch })));
    console.log('First 5 XML names:', noteNames.slice(0, 5));
  }

  const merged = jsonNotes.map((note, index) => {
    const noteName = noteNames[index] ?? `Unknown${index}`;
    console.log(`   Note ${index}: time=${note.time.toFixed(2)}s, pitch=${note.pitch}, name=${noteName}`);
    return {
      ...note,
      noteName
    };
  });
  
  console.log(`✅ Merged ${merged.length} notes with names`);
  return merged;
} 