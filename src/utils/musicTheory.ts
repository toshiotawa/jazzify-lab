/**
 * 音楽理論に基づいた音名計算ユーティリティ
 */

// 基本音名（調号なし）
const NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

// 半音の距離
const SEMITONE_DISTANCES = [0, 2, 4, 5, 7, 9, 11];

// キーシグネチャー定義
export interface KeySignature {
  key: string;
  type: 'major' | 'minor';
  sharps?: string[];
  flats?: string[];
  preferredAccidentals?: 'sharp' | 'flat';
}

// メジャーキーの定義（五度圏順）
export const MAJOR_KEYS: KeySignature[] = [
  // フラット系
  { key: 'Cb', type: 'major', flats: ['B', 'E', 'A', 'D', 'G', 'C', 'F'], preferredAccidentals: 'flat' },
  { key: 'Gb', type: 'major', flats: ['B', 'E', 'A', 'D', 'G', 'C'], preferredAccidentals: 'flat' },
  { key: 'Db', type: 'major', flats: ['B', 'E', 'A', 'D', 'G'], preferredAccidentals: 'flat' },
  { key: 'Ab', type: 'major', flats: ['B', 'E', 'A', 'D'], preferredAccidentals: 'flat' },
  { key: 'Eb', type: 'major', flats: ['B', 'E', 'A'], preferredAccidentals: 'flat' },
  { key: 'Bb', type: 'major', flats: ['B', 'E'], preferredAccidentals: 'flat' },
  { key: 'F', type: 'major', flats: ['B'], preferredAccidentals: 'flat' },
  
  // ナチュラル
  { key: 'C', type: 'major', sharps: [], flats: [] },
  
  // シャープ系
  { key: 'G', type: 'major', sharps: ['F'], preferredAccidentals: 'sharp' },
  { key: 'D', type: 'major', sharps: ['F', 'C'], preferredAccidentals: 'sharp' },
  { key: 'A', type: 'major', sharps: ['F', 'C', 'G'], preferredAccidentals: 'sharp' },
  { key: 'E', type: 'major', sharps: ['F', 'C', 'G', 'D'], preferredAccidentals: 'sharp' },
  { key: 'B', type: 'major', sharps: ['F', 'C', 'G', 'D', 'A'], preferredAccidentals: 'sharp' },
  // F#メジャーではなくGbメジャーを優先
  { key: 'C#', type: 'major', sharps: ['F', 'C', 'G', 'D', 'A', 'E', 'B'], preferredAccidentals: 'sharp' }
];

// マイナーキーの定義
export const MINOR_KEYS: KeySignature[] = [
  // フラット系
  { key: 'Ab', type: 'minor', flats: ['B', 'E', 'A', 'D', 'G', 'C', 'F'], preferredAccidentals: 'flat' },
  { key: 'Eb', type: 'minor', flats: ['B', 'E', 'A', 'D', 'G', 'C'], preferredAccidentals: 'flat' },
  { key: 'Bb', type: 'minor', flats: ['B', 'E', 'A', 'D', 'G'], preferredAccidentals: 'flat' },
  { key: 'F', type: 'minor', flats: ['B', 'E', 'A', 'D'], preferredAccidentals: 'flat' },
  { key: 'C', type: 'minor', flats: ['B', 'E', 'A'], preferredAccidentals: 'flat' },
  { key: 'G', type: 'minor', flats: ['B', 'E'], preferredAccidentals: 'flat' },
  { key: 'D', type: 'minor', flats: ['B'], preferredAccidentals: 'flat' },
  
  // ナチュラル
  { key: 'A', type: 'minor', sharps: [], flats: [] },
  
  // シャープ系
  { key: 'E', type: 'minor', sharps: ['F'], preferredAccidentals: 'sharp' },
  { key: 'B', type: 'minor', sharps: ['F', 'C'], preferredAccidentals: 'sharp' },
  { key: 'F#', type: 'minor', sharps: ['F', 'C', 'G'], preferredAccidentals: 'sharp' },
  { key: 'C#', type: 'minor', sharps: ['F', 'C', 'G', 'D'], preferredAccidentals: 'sharp' },
  { key: 'G#', type: 'minor', sharps: ['F', 'C', 'G', 'D', 'A'], preferredAccidentals: 'sharp' },
  { key: 'D#', type: 'minor', sharps: ['F', 'C', 'G', 'D', 'A', 'E'], preferredAccidentals: 'sharp' },
  { key: 'A#', type: 'minor', sharps: ['F', 'C', 'G', 'D', 'A', 'E', 'B'], preferredAccidentals: 'sharp' }
];

/**
 * キー情報を取得
 */
export function getKeySignature(key: string, type: 'major' | 'minor' = 'major'): KeySignature | null {
  const keys = type === 'major' ? MAJOR_KEYS : MINOR_KEYS;
  return keys.find(k => k.key === key) || null;
}

/**
 * MIDIノート番号から基本音名とオクターブを取得
 */
export function getMidiNoteInfo(midiNote: number): { noteLetter: string; octave: number; chromaticIndex: number } {
  const chromaticIndex = midiNote % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  
  // クロマティックスケールでの音名（シャープ系）
  const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteLetter = chromaticNotes[chromaticIndex];
  
  return { noteLetter, octave, chromaticIndex };
}

/**
 * キーにおける度数を計算
 */
export function getScaleDegree(midiNote: number, keySignature: KeySignature): number {
  const { chromaticIndex } = getMidiNoteInfo(midiNote);
  const keyRootIndex = NOTE_NAMES.indexOf(keySignature.key[0] as any);
  
  // キーのルートのクロマティック位置を計算
  let rootChromaticIndex = SEMITONE_DISTANCES[keyRootIndex];
  if (keySignature.key.includes('#')) rootChromaticIndex += 1;
  if (keySignature.key.includes('b')) rootChromaticIndex -= 1;
  if (rootChromaticIndex < 0) rootChromaticIndex += 12;
  
  // 音の度数を計算（0-11）
  let degree = (chromaticIndex - rootChromaticIndex + 12) % 12;
  
  return degree;
}

/**
 * 正確な度数計算に基づいた音名取得
 */
export function getCorrectNoteName(midiNote: number, keySignature: KeySignature): string {
  const { chromaticIndex } = getMidiNoteInfo(midiNote);
  
  // キーのルート音の基本音名インデックス
  const keyRootIndex = NOTE_NAMES.indexOf(keySignature.key[0] as any);
  
  // キーのルートのクロマティック位置
  let rootChromaticIndex = SEMITONE_DISTANCES[keyRootIndex];
  if (keySignature.key.includes('#')) rootChromaticIndex += 1;
  if (keySignature.key.includes('b')) rootChromaticIndex -= 1;
  rootChromaticIndex = (rootChromaticIndex + 12) % 12;
  
  // 相対的な半音数（度数）
  const relativeSemitones = (chromaticIndex - rootChromaticIndex + 12) % 12;
  
  // メジャースケールの度数パターン
  const scalePattern = [
    { semitones: 0, degree: 1, noteOffset: 0 },   // 1度（完全1度）
    { semitones: 2, degree: 2, noteOffset: 1 },   // 2度（長2度）
    { semitones: 4, degree: 3, noteOffset: 2 },   // 3度（長3度）
    { semitones: 5, degree: 4, noteOffset: 3 },   // 4度（完全4度）
    { semitones: 7, degree: 5, noteOffset: 4 },   // 5度（完全5度）
    { semitones: 9, degree: 6, noteOffset: 5 },   // 6度（長6度）
    { semitones: 11, degree: 7, noteOffset: 6 },  // 7度（長7度）
  ];
  
  // 最も近い度数を見つける
  let closestPattern = scalePattern[0];
  let accidentalOffset = 0;
  
  for (const pattern of scalePattern) {
    if (pattern.semitones === relativeSemitones) {
      closestPattern = pattern;
      accidentalOffset = 0;
      break;
    }
  }
  
  // スケール内にない音の場合
  if (accidentalOffset === 0 && closestPattern.semitones !== relativeSemitones) {
    // 上下の度数を探す
    for (const pattern of scalePattern) {
      // 半音上の場合（増音程または臨時記号のシャープ）
      if (pattern.semitones === relativeSemitones - 1) {
        closestPattern = pattern;
        accidentalOffset = 1; // シャープ
        break;
      }
      // 半音下の場合（減音程または臨時記号のフラット）
      if ((pattern.semitones === relativeSemitones + 1) || 
          (pattern.semitones === relativeSemitones - 11)) {
        closestPattern = pattern;
        accidentalOffset = -1; // フラット
        break;
      }
    }
    
    // 特殊なケース：増4度（F# in C major）、減5度（Gb in C major）
    if (relativeSemitones === 6) {
      if (keySignature.preferredAccidentals === 'flat' || keySignature.flats && keySignature.flats.length > 0) {
        // Gbとして扱う（5度のフラット）
        closestPattern = scalePattern[4]; // 5度
        accidentalOffset = -1;
      } else {
        // F#として扱う（4度のシャープ）
        closestPattern = scalePattern[3]; // 4度
        accidentalOffset = 1;
      }
    }
  }
  
  // 基本音名を決定
  const baseNoteIndex = (keyRootIndex + closestPattern.noteOffset) % 7;
  const baseName = NOTE_NAMES[baseNoteIndex];
  
  // 調号による変化を考慮
  let finalAccidental = accidentalOffset;
  
  // この音に調号がある場合
  if (keySignature.sharps?.includes(baseName)) {
    finalAccidental += 1;
  } else if (keySignature.flats?.includes(baseName)) {
    finalAccidental -= 1;
  }
  
  // 臨時記号を文字列に変換
  let accidentalString = '';
  switch (finalAccidental) {
    case -2: accidentalString = 'bb'; break; // ダブルフラット
    case -1: accidentalString = 'b'; break;  // フラット
    case 0: accidentalString = ''; break;    // ナチュラル（表示なし）
    case 1: accidentalString = '#'; break;   // シャープ
    case 2: accidentalString = 'x'; break;   // ダブルシャープ
    default:
      // 3以上または-3以下の場合は、理論的に正しくないが表示
      if (finalAccidental > 0) {
        accidentalString = '#'.repeat(finalAccidental);
      } else {
        accidentalString = 'b'.repeat(-finalAccidental);
      }
  }
  
  return baseName + accidentalString;
}

/**
 * 音名から臨時記号情報を抽出
 */
export function parseNoteName(noteName: string): { baseName: string; accidental: string } {
  const match = noteName.match(/^([A-G])(.*)$/);
  if (!match) return { baseName: noteName, accidental: '' };
  
  return {
    baseName: match[1],
    accidental: match[2] || ''
  };
}

/**
 * Cメジャーに戻った時に必要な臨時記号を判定
 */
export function getNaturalAccidental(noteName: string, previousKey: KeySignature | null): string {
  if (!previousKey || previousKey.key === 'C') return '';
  
  const { baseName } = parseNoteName(noteName);
  
  // 前のキーで変化記号があった音にナチュラルが必要
  if (previousKey.sharps?.includes(baseName) || previousKey.flats?.includes(baseName)) {
    return '♮';
  }
  
  return '';
}

/**
 * F#メジャーではなくGbメジャーを推奨
 */
export function getPreferredKey(key: string, type: 'major' | 'minor' = 'major'): KeySignature | null {
  // F#メジャーの場合はGbメジャーに変換
  if (key === 'F#' && type === 'major') {
    return getKeySignature('Gb', 'major');
  }
  return getKeySignature(key, type);
}