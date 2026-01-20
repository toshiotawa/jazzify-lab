import { Note, Interval, Key } from 'tonal';
import type { TransposingInstrument } from '@/types';

/**
 * 読みやすい12種類のメジャーキー
 * 白鍵キー: C, D, E, F, G, A, B
 * 黒鍵キー: Db, Eb, Gb, Ab, Bb
 */
const PREFERRED_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * 異名同音（Enharmonic）のマッピング - 読みやすいキーへ正規化
 */
const ENHARMONIC_MAP: Record<string, string> = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb',
  'Cb': 'B',
  'Fb': 'E',
  'E#': 'F',
  'B#': 'C',
  // ダブルシャープ・ダブルフラット
  'C##': 'D',
  'D##': 'E',
  'E##': 'Gb',
  'F##': 'G',
  'G##': 'A',
  'A##': 'B',
  'B##': 'Db',
  'Cbb': 'Bb',
  'Dbb': 'C',
  'Ebb': 'D',
  'Fbb': 'Eb',
  'Gbb': 'F',
  'Abb': 'G',
  'Bbb': 'A',
};

/**
 * キーを読みやすい形式に正規化
 * @param key キー名
 * @returns 正規化されたキー名
 */
function normalizeToPreferredKey(key: string): string {
  // すでに読みやすいキーならそのまま返す
  if (PREFERRED_KEYS.includes(key)) {
    return key;
  }
  
  // 異名同音マッピングで変換
  if (ENHARMONIC_MAP[key]) {
    return ENHARMONIC_MAP[key];
  }
  
  return key;
}

/**
 * 元のキーから半音数で移調した後の「読みやすいキー」を決定
 * @param originalKey 元のキー（例: 'F'）
 * @param semitones 半音数（例: 6）
 * @returns 読みやすいターゲットキー（例: 'B'）
 */
export function getPreferredTargetKey(originalKey: string, semitones: number): string {
  // 元のキーを正規化
  const normalizedOriginal = normalizeToPreferredKey(originalKey);
  
  // 半音数からターゲットのピッチクラス（0-11）を計算
  const originalNote = Note.get(normalizedOriginal);
  if (originalNote.empty) {
    return normalizedOriginal;
  }
  
  const originalChroma = originalNote.chroma ?? 0;
  const targetChroma = ((originalChroma + semitones) % 12 + 12) % 12;
  
  // ターゲットのピッチクラスに対応する読みやすいキーを返す
  return PREFERRED_KEYS[targetChroma];
}

/**
 * 2つのキー間の正しい音程（Interval）を取得
 * 音楽理論的に正しい度数を返す（例: F→B = 増4度、F→Cb = 減5度）
 * @param fromKey 元のキー
 * @param toKey ターゲットキー
 * @returns 音程文字列（例: '4A' = 増4度）
 */
export function getCorrectInterval(fromKey: string, toKey: string): string {
  // Tonal.jsのInterval.distanceを使用して正しい音程を取得
  const interval = Interval.distance(fromKey, toKey);
  if (interval) {
    return interval;
  }
  
  // フォールバック: 半音数から音程を計算
  const fromNote = Note.get(fromKey);
  const toNote = Note.get(toKey);
  if (fromNote.empty || toNote.empty) {
    return '1P'; // ユニゾン
  }
  
  const fromChroma = fromNote.chroma ?? 0;
  const toChroma = toNote.chroma ?? 0;
  const semitones = ((toChroma - fromChroma) % 12 + 12) % 12;
  
  return Interval.fromSemitones(semitones) ?? '1P';
}

/**
 * キーのfifths値（五度圏）を取得
 * @param keyName キー名
 * @returns fifths値
 */
function getKeyFifths(keyName: string): number {
  const keyInfo = Key.majorKey(keyName);
  // Key.majorKey returns an object with scale info
  // fifths is the number of sharps (positive) or flats (negative)
  
  // フォールバック: 直接マッピング
  const fifthsMap: Record<string, number> = {
    'C': 0,
    'G': 1,
    'D': 2,
    'A': 3,
    'E': 4,
    'B': 5,
    'Gb': -6,
    'F#': 6,
    'Db': -5,
    'C#': 7,
    'Ab': -4,
    'Eb': -3,
    'Bb': -2,
    'F': -1,
    'Cb': -7,
  };
  
  if (keyInfo && typeof keyInfo.alteration === 'number') {
    return keyInfo.alteration;
  }
  
  return fifthsMap[keyName] ?? 0;
}

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
 * fifths値（五度圏）からキー名を取得
 * @param fifths fifths値
 * @returns キー名
 */
function fifthsToKeyName(fifths: number): string {
  const fifthsToKeyMap: Record<number, string> = {
    '-7': 'Cb',
    '-6': 'Gb',
    '-5': 'Db',
    '-4': 'Ab',
    '-3': 'Eb',
    '-2': 'Bb',
    '-1': 'F',
    '0': 'C',
    '1': 'G',
    '2': 'D',
    '3': 'A',
    '4': 'E',
    '5': 'B',
    '6': 'F#',
    '7': 'C#',
  };
  return fifthsToKeyMap[fifths] ?? 'C';
}

/**
 * Transpose MusicXML string by given semitones, applying music theory-correct enharmonic rules.
 * 
 * 改善点:
 * 1. 移調後のキーを「読みやすいキー」に正規化（C, D, E, F, G, A, B または Db, Eb, Gb, Ab, Bb）
 * 2. 正しい音程（Interval）を使用して移調（例: F→B = 増4度、G# → C##）
 * 3. キー署名も正しく更新
 *
 * @param xmlString Raw MusicXML
 * @param semitones integer, positive = up, negative = down
 * @returns Transposed MusicXML string
 */
export function transposeMusicXml(xmlString: string, semitones: number): string {
  if (semitones === 0) return xmlString;

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  // 1. 元のキーを取得（最初の<key><fifths>から）
  const firstKeyEl = doc.querySelector('key fifths');
  const originalFifths = firstKeyEl ? parseInt(firstKeyEl.textContent || '0', 10) : 0;
  const originalKeyName = fifthsToKeyName(originalFifths);
  
  // 2. ターゲットキー（読みやすいキー）を決定
  const targetKeyName = getPreferredTargetKey(originalKeyName, semitones);
  
  // 3. 正しい音程を計算
  const transposeInterval = getCorrectInterval(originalKeyName, targetKeyName);
  
  // オクターブの調整が必要な場合を考慮（+12, +24, -12などの場合）
  const octaveShift = Math.floor(semitones / 12);
  const octaveInterval = octaveShift !== 0 ? `${Math.abs(octaveShift) * 8}P` : null;

  // Helper to convert step/alter/octave to tonal note string, e.g. C#4, Eb4
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
    
    // 正しい音程で移調
    let transposedNote = Note.transpose(noteStr, transposeInterval);
    
    // オクターブシフトがある場合は追加で適用
    if (octaveInterval && transposedNote) {
      if (octaveShift > 0) {
        transposedNote = Note.transpose(transposedNote, octaveInterval);
      } else if (octaveShift < 0) {
        // 負のオクターブシフト
        transposedNote = Note.transpose(transposedNote, `-${octaveInterval}`);
      }
    }
    
    if (transposedNote) {
      applyNoteToPitch(transposedNote, pitchEl);
    }
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
    
    // Transpose the root note using the correct interval
    const transposedRootNote = Note.transpose(rootNote, transposeInterval);
    if (!transposedRootNote) return;
    
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

  // transpose key signature <key><fifths> - ターゲットキーのfifths値を使用
  const targetFifths = getKeyFifths(targetKeyName);
  doc.querySelectorAll('key').forEach((keyEl) => {
    const fifthsEl = keyEl.querySelector('fifths');
    if (!fifthsEl) return;
    fifthsEl.textContent = String(targetFifths);
  });

  // <credit>要素を削除（キー名などのテキストが全キー分表示される問題を防ぐ）
  doc.querySelectorAll('credit').forEach((creditEl) => {
    creditEl.remove();
  });

  // <direction>要素内のキー名テキスト（words要素）を削除
  // 単一文字のキー名（A-G、シャープ/フラット付き）を検出して削除
  doc.querySelectorAll('direction words').forEach((wordsEl) => {
    const text = wordsEl.textContent?.trim() || '';
    // キー名パターン: A, B, C, D, E, F, G またはそれにb/#が付いたもの
    if (/^[A-G][b#]?$/.test(text)) {
      // キー名テキストの場合、親のdirection要素ごと削除
      const directionEl = wordsEl.closest('direction');
      if (directionEl) {
        directionEl.remove();
      }
    }
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}
