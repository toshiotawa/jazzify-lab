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
 * キーに基づいた正しい音名を取得
 */
export function getCorrectNoteName(midiNote: number, keySignature: KeySignature): string {
  const { octave, chromaticIndex } = getMidiNoteInfo(midiNote);
  const scaleDegree = getScaleDegree(midiNote, keySignature);
  
  // メジャースケールの度数から基本音名を決定
  const majorScalePattern = [0, 2, 4, 5, 7, 9, 11]; // C major scale intervals
  const keyRootIndex = NOTE_NAMES.indexOf(keySignature.key[0] as any);
  
  // スケール内の音かチェック
  let noteIndex = -1;
  let accidental = '';
  
  for (let i = 0; i < majorScalePattern.length; i++) {
    if (majorScalePattern[i] === scaleDegree) {
      noteIndex = (keyRootIndex + i) % 7;
      break;
    }
  }
  
  // スケール外の音の場合、最も近い音を基準に臨時記号を決定
  if (noteIndex === -1) {
    // 下の音を基準にするか上の音を基準にするか決定
    const useFlat = keySignature.preferredAccidentals === 'flat' || 
                    (keySignature.flats && keySignature.flats.length > 0);
    
    if (useFlat) {
      // フラット系：上の音を基準に♭
      for (let i = 0; i < majorScalePattern.length; i++) {
        if (majorScalePattern[i] === (scaleDegree + 1) % 12) {
          noteIndex = (keyRootIndex + i) % 7;
          accidental = 'b';
          break;
        }
      }
    } else {
      // シャープ系：下の音を基準に#
      for (let i = 0; i < majorScalePattern.length; i++) {
        if (majorScalePattern[i] === (scaleDegree - 1 + 12) % 12) {
          noteIndex = (keyRootIndex + i) % 7;
          accidental = '#';
          break;
        }
      }
    }
  }
  
  // それでも見つからない場合（ダブルシャープ/フラットが必要な場合）
  if (noteIndex === -1) {
    // デフォルトでクロマティックな音名を返す
    return getMidiNoteInfo(midiNote).noteLetter;
  }
  
  const baseName = NOTE_NAMES[noteIndex];
  
  // 調号による変化を確認
  const needsSharp = keySignature.sharps?.includes(baseName);
  const needsFlat = keySignature.flats?.includes(baseName);
  
  // 実際の音と期待される音の差を計算
  let expectedChromaticIndex = SEMITONE_DISTANCES[noteIndex];
  if (needsSharp) expectedChromaticIndex += 1;
  if (needsFlat) expectedChromaticIndex -= 1;
  expectedChromaticIndex = (expectedChromaticIndex + 12) % 12;
  
  const diff = (chromaticIndex - expectedChromaticIndex + 12) % 12;
  
  // 臨時記号を決定
  if (diff === 0) {
    // 調号通りの音（臨時記号なし）
    return baseName;
  } else if (diff === 1) {
    if (needsSharp) {
      return baseName + 'x'; // ダブルシャープ
    } else {
      return baseName + '#';
    }
  } else if (diff === 11) {
    if (needsFlat) {
      return baseName + 'bb'; // ダブルフラット
    } else {
      return baseName + 'b';
    }
  } else if (diff === 2) {
    // 2半音上 = ダブルシャープの可能性
    if (accidental === '#') {
      return baseName + 'x';
    }
  } else if (diff === 10) {
    // 2半音下 = ダブルフラットの可能性
    if (accidental === 'b') {
      return baseName + 'bb';
    }
  }
  
  return baseName + accidental;
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