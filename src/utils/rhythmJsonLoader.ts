/**
 * リズムモード用JSONローダー
 * コード進行データをJSONから読み込む
 */

export interface RhythmChordData {
  beat: number;      // 拍番号（1拍目の裏だったら1.5、3拍目の16分音符4つ目だったら3.75のように）
  chord: string;     // コード名
  measure: number;   // 小節番号
}

export interface RhythmJsonData {
  chords: RhythmChordData[];
}

/**
 * リズムモード用のJSONデータを読み込む
 * @param jsonData - JSON文字列またはオブジェクト
 * @returns パース済みのコード進行データ
 */
export const loadRhythmJson = (jsonData: string | RhythmJsonData): RhythmJsonData => {
  if (typeof jsonData === 'string') {
    try {
      const parsed = JSON.parse(jsonData) as RhythmJsonData;
      validateRhythmJson(parsed);
      return parsed;
    } catch (error) {
      throw new Error(`Invalid rhythm JSON data: ${error}`);
    }
  } else {
    validateRhythmJson(jsonData);
    return jsonData;
  }
};

/**
 * リズムJSONデータの妥当性を検証
 * @param data - 検証対象のデータ
 */
const validateRhythmJson = (data: any): void => {
  if (!data || typeof data !== 'object') {
    throw new Error('Rhythm JSON data must be an object');
  }
  
  if (!Array.isArray(data.chords)) {
    throw new Error('Rhythm JSON data must have a "chords" array');
  }
  
  data.chords.forEach((chord: any, index: number) => {
    if (typeof chord.beat !== 'number' || chord.beat < 0) {
      throw new Error(`Invalid beat at index ${index}: must be a positive number`);
    }
    
    if (typeof chord.chord !== 'string' || chord.chord.trim() === '') {
      throw new Error(`Invalid chord at index ${index}: must be a non-empty string`);
    }
    
    if (typeof chord.measure !== 'number' || chord.measure < 1) {
      throw new Error(`Invalid measure at index ${index}: must be a positive integer`);
    }
  });
};

/**
 * 指定された小節・拍のコードを取得
 * @param chords - コード進行データ
 * @param measure - 小節番号
 * @param beat - 拍番号
 * @param tolerance - 許容誤差（デフォルト: 0.125 = 32分音符）
 * @returns 該当するコードデータ、見つからない場合はnull
 */
export const getChordAtTiming = (
  chords: RhythmChordData[],
  measure: number,
  beat: number,
  tolerance = 0.125
): RhythmChordData | null => {
  return chords.find(chord => 
    chord.measure === measure &&
    Math.abs(chord.beat - beat) <= tolerance
  ) || null;
};

/**
 * コード進行データをソート（小節番号、拍番号順）
 * @param chords - コード進行データ
 * @returns ソート済みのコード進行データ
 */
export const sortChords = (chords: RhythmChordData[]): RhythmChordData[] => {
  return [...chords].sort((a, b) => {
    if (a.measure !== b.measure) {
      return a.measure - b.measure;
    }
    return a.beat - b.beat;
  });
};