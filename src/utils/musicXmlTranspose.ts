import { MusicXML } from '@stringsync/musicxml';

/**
 * 半音オフセットから調号（五度圏）への変換テーブル
 * 半音オフセット(C = 0) => 五度圏値(fifths)
 */
const TRANSPOSE_TO_FIFTHS: { [key: number]: number } = {
  0: 0,    // C major
  1: -5,   // D♭ major (C♯を使わずD♭を採用)
  2: 2,    // D major
  3: -3,   // E♭ major
  4: 4,    // E major
  5: -1,   // F major
  6: -6,   // G♭ major (F♯ではなくG♭)
  7: 1,    // G major
  8: -4,   // A♭ major (G♯ではなくA♭)
  9: 3,    // A major
  10: -2,  // B♭ major
  11: 5,   // B major
};

/**
 * 音名の定義
 */
const PITCH_CLASSES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

/**
 * 半音から次の音名へのマッピング
 * シャープ系とフラット系の判定に使用
 */
const CHROMATIC_SCALE_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_SCALE_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * 音名をピッチクラス番号に変換
 */
const pitchClassToNumber = (step: string): number => {
  const index = PITCH_CLASSES.indexOf(step.toUpperCase());
  if (index === -1) throw new Error(`Invalid pitch class: ${step}`);
  return index;
};

/**
 * ピッチクラス番号を音名に変換
 */
const numberToPitchClass = (num: number): string => {
  return PITCH_CLASSES[((num % 7) + 7) % 7];
};

/**
 * MIDI番号から音名とオクターブを取得
 */
const midiToNote = (midi: number, preferFlat: boolean = false): { step: string; alter: number; octave: number } => {
  const octave = Math.floor(midi / 12) - 1;
  const pitchClass = midi % 12;
  const scale = preferFlat ? CHROMATIC_SCALE_FLAT : CHROMATIC_SCALE_SHARP;
  const noteName = scale[pitchClass];
  
  let step = noteName[0];
  let alter = 0;
  
  if (noteName.includes('#')) {
    alter = 1;
  } else if (noteName.includes('b')) {
    alter = -1;
  }
  
  return { step, alter, octave };
};

/**
 * 音名、変化記号、オクターブからMIDI番号を計算
 */
const noteToMidi = (step: string, alter: number, octave: number): number => {
  const pitchClassNum = pitchClassToNumber(step);
  const baseNote = [0, 2, 4, 5, 7, 9, 11][pitchClassNum]; // C, D, E, F, G, A, B
  return (octave + 1) * 12 + baseNote + alter;
};

/**
 * MusicXMLを指定された半音数だけ移調する
 * @param xmlString - 元のMusicXML文字列
 * @param semitones - 移調する半音数（正: 上、負: 下）
 * @returns 移調されたMusicXML文字列
 */
export const transposeMusicXML = async (xmlString: string, semitones: number): Promise<string> => {
  if (semitones === 0) {
    return xmlString;
  }
  
  // DOMParser を使用してXMLをパース
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  
  // エラーチェック
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML: ' + parseError.textContent);
  }
  
  // 正規化: -12 〜 +11 の範囲に収める
  const normalizedSemitones = ((semitones % 12) + 12) % 12;
  
  // フラット系の調を優先するかどうか
  const preferFlat = TRANSPOSE_TO_FIFTHS[normalizedSemitones] < 0;
  
  // 1. 全ての音符を移調
  const notes = doc.querySelectorAll('note');
  notes.forEach(note => {
    const pitch = note.querySelector('pitch');
    if (!pitch) return; // 休符などはスキップ
    
    const stepElem = pitch.querySelector('step');
    const alterElem = pitch.querySelector('alter');
    const octaveElem = pitch.querySelector('octave');
    
    if (!stepElem || !octaveElem) return;
    
    const step = stepElem.textContent || 'C';
    const alter = alterElem ? parseInt(alterElem.textContent || '0') : 0;
    const octave = parseInt(octaveElem.textContent || '4');
    
    // MIDI番号に変換して移調
    const originalMidi = noteToMidi(step, alter, octave);
    const transposedMidi = originalMidi + semitones;
    
    // 新しい音名を取得
    const newNote = midiToNote(transposedMidi, preferFlat);
    
    // 要素を更新
    stepElem.textContent = newNote.step;
    
    // octaveが存在し、数値であることを確認
    if (newNote.octave !== undefined && newNote.octave !== null) {
      octaveElem.textContent = String(newNote.octave);
    } else {
      console.error('Invalid octave value:', newNote.octave);
      return; // forEachの中なのでreturnを使用
    }
    
    // alter要素の処理
    if (newNote.alter !== 0) {
      if (!alterElem) {
        // alter要素が存在しない場合は作成
        const newAlterElem = doc.createElement('alter');
        newAlterElem.textContent = String(newNote.alter);
        pitch.insertBefore(newAlterElem, octaveElem);
      } else {
        alterElem.textContent = String(newNote.alter);
      }
    } else if (alterElem) {
      // alter が 0 の場合は要素を削除
      alterElem.remove();
    }
  });
  
  // 2. 調号を更新
  const keys = doc.querySelectorAll('key');
  keys.forEach(key => {
    const fifthsElem = key.querySelector('fifths');
    if (!fifthsElem) return;
    
    const currentFifths = parseInt(fifthsElem.textContent || '0');
    
    // 現在の調から元のキーを推定
    let originalKey = 0;
    for (const [offset, fifths] of Object.entries(TRANSPOSE_TO_FIFTHS)) {
      if (fifths === currentFifths) {
        originalKey = parseInt(offset);
        break;
      }
    }
    
    // 新しい調を計算
    const newKey = (originalKey + semitones) % 12;
    const newFifths = TRANSPOSE_TO_FIFTHS[newKey];
    
    // newFifthsが存在することを確認
    if (newFifths !== undefined && newFifths !== null) {
      fifthsElem.textContent = String(newFifths);
    } else {
      console.error('Invalid key mapping for transpose:', newKey);
    }
  });
  
  // 3. 既存の<transpose>要素があれば削除
  const transposes = doc.querySelectorAll('transpose');
  transposes.forEach(transpose => transpose.remove());
  
  // XMLを文字列に戻す
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
};

/**
 * MusicXMLファイルをフェッチして移調する
 * @param url - MusicXMLファイルのURL
 * @param semitones - 移調する半音数
 * @returns 移調されたMusicXML文字列
 */
export const fetchAndTransposeMusicXML = async (url: string, semitones: number): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch MusicXML: ${response.statusText}`);
  }
  
  const xmlString = await response.text();
  return transposeMusicXML(xmlString, semitones);
};