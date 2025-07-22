import { Note, Chord } from '@tonaljs/tonal';

interface ChordNotesInfo {
  root: string;
  quality: string;
  noteNames: string[];
  midiNotes: number[];
}

/**
 * MIDIノート番号から音名を取得（日本語音名に対応）
 */
export function getMidiNoteName(midiNote: number, language: 'japanese' | 'english' = 'japanese'): string {
  const noteName = Note.fromMidi(midiNote);
  
  if (language === 'japanese') {
    return convertToJapaneseNoteName(noteName);
  }
  
  return noteName;
}

/**
 * 英語音名を日本語音名に変換
 */
function convertToJapaneseNoteName(noteName: string): string {
  const noteMap: { [key: string]: string } = {
    'C': 'ド',
    'C#': 'ド♯',
    'Db': 'レ♭',
    'D': 'レ',
    'D#': 'レ♯',
    'Eb': 'ミ♭',
    'E': 'ミ',
    'F': 'ファ',
    'F#': 'ファ♯',
    'Gb': 'ソ♭',
    'G': 'ソ',
    'G#': 'ソ♯',
    'Ab': 'ラ♭',
    'A': 'ラ',
    'A#': 'ラ♯',
    'Bb': 'シ♭',
    'B': 'シ'
  };
  
  // オクターブ番号を除去してマッピング
  const noteWithoutOctave = noteName.replace(/\d+$/, '');
  return noteMap[noteWithoutOctave] || noteName;
}

/**
 * コード名からコードの構成音情報を取得
 */
export function getChordNotes(chordSymbol: string, rootMidiNote: number = 60): ChordNotesInfo {
  const chord = Chord.get(chordSymbol);
  
  if (!chord.tonic || chord.notes.length === 0) {
    // コードが解析できない場合のフォールバック
    return {
      root: chordSymbol,
      quality: '',
      noteNames: [],
      midiNotes: []
    };
  }
  
  // ルート音のMIDIノート番号を基準に、コードの構成音のMIDIノート番号を計算
  const rootNoteName = Note.fromMidi(rootMidiNote);
  const rootPitchClass = Note.pitchClass(rootNoteName);
  const targetRootPitchClass = chord.tonic;
  
  // ルート音の調整
  let adjustedRootMidi = rootMidiNote;
  if (rootPitchClass !== targetRootPitchClass) {
    const interval = Note.distance(rootPitchClass, targetRootPitchClass);
    adjustedRootMidi = rootMidiNote + Note.semitones(interval);
  }
  
  // コードの構成音のMIDIノート番号を計算
  const midiNotes = chord.intervals.map(interval => {
    return adjustedRootMidi + Note.semitones(interval);
  });
  
  // 日本語音名に変換
  const noteNames = midiNotes.map(midi => getMidiNoteName(midi, 'japanese'));
  
  return {
    root: chord.tonic,
    quality: chord.quality,
    noteNames,
    midiNotes
  };
}

/**
 * コードシンボルからルート音と品質を分離（17パターンのルート音に対応）
 */
export function parseChordSymbol(chordSymbol: string): { root: string, quality: string } {
  // すべての可能なルート音（シャープとフラット両方を含む17パターン）
  const roots = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
  
  for (const root of roots) {
    if (chordSymbol.startsWith(root)) {
      const quality = chordSymbol.substring(root.length);
      return { root, quality };
    }
  }
  
  // デフォルト
  return { root: chordSymbol[0], quality: chordSymbol.substring(1) };
}

/**
 * MIDIノート番号の配列から、コード名を推測
 */
export function detectChord(midiNotes: number[]): string | null {
  if (midiNotes.length < 2) return null;
  
  // MIDIノートを音名に変換
  const noteNames = midiNotes.map(midi => Note.fromMidi(midi));
  
  // Tonalのコード検出機能を使用
  const detectedChords = Chord.detect(noteNames);
  
  return detectedChords.length > 0 ? detectedChords[0] : null;
}