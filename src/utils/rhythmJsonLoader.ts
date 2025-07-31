/**
 * リズムモード用JSONローダー
 * コード進行データの読み込みと検証を担当
 */

import { devLog } from '@/utils/logger';

interface RhythmChordData {
  chord: string;
  measure: number;
  beat: number;
}

interface RhythmJsonData {
  chords: RhythmChordData[];
}

/**
 * リズムモード用のJSONデータを読み込む
 * @param jsonData - データベースから取得したJSON
 * @returns パース済みのコード進行データ
 */
export const parseRhythmJson = (jsonData: unknown): RhythmChordData[] | null => {
  if (!jsonData) {
    devLog.debug('リズムJSON: データがnull');
    return null;
  }

  try {
    // すでにオブジェクトの場合はそのまま使用
    const data: RhythmJsonData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    
    if (!data.chords || !Array.isArray(data.chords)) {
      devLog.debug('リズムJSON: chordsフィールドが無効');
      return null;
    }

    // データ検証
    const validatedChords: RhythmChordData[] = [];
    
    for (const chord of data.chords) {
      if (!chord.chord || typeof chord.chord !== 'string') {
        devLog.debug(`リズムJSON: 無効なコード名: ${chord.chord}`);
        continue;
      }
      
      if (typeof chord.measure !== 'number' || chord.measure < 1) {
        devLog.debug(`リズムJSON: 無効な小節番号: ${chord.measure}`);
        continue;
      }
      
      if (typeof chord.beat !== 'number' || chord.beat < 1) {
        devLog.debug(`リズムJSON: 無効な拍番号: ${chord.beat}`);
        continue;
      }
      
      validatedChords.push({
        chord: chord.chord,
        measure: chord.measure,
        beat: chord.beat
      });
    }
    
    devLog.debug(`リズムJSON: ${validatedChords.length}個のコードを読み込み`);
    return validatedChords;
    
  } catch (error) {
    devLog.debug('リズムJSON: パースエラー', error);
    return null;
  }
};

/**
 * デモ用のコード進行データを生成
 * @param allowedChords - 使用可能なコードリスト
 * @param measureCount - 小節数
 * @param timeSignature - 拍子
 * @returns デモ用コード進行データ
 */
export const generateDemoProgression = (
  allowedChords: string[],
  measureCount: number,
  _timeSignature: number
): RhythmChordData[] => {
  const progression: RhythmChordData[] = [];
  
  // 各小節の1拍目にコードを配置
  for (let measure = 1; measure <= measureCount; measure++) {
    const chordIndex = (measure - 1) % allowedChords.length;
    progression.push({
      chord: allowedChords[chordIndex],
      measure: measure,
      beat: 1
    });
  }
  
  return progression;
};

/**
 * サンプルJSON生成（デバッグ・テスト用）
 * @returns サンプルのリズムJSON文字列
 */
export const generateSampleJson = (): string => {
  const sampleData: RhythmJsonData = {
    chords: [
      { beat: 1.0, chord: "C", measure: 1 },
      { beat: 1.0, chord: "G", measure: 2 },
      { beat: 1.0, chord: "Am", measure: 3 },
      { beat: 1.0, chord: "F", measure: 4 },
      { beat: 1.0, chord: "C", measure: 5 },
      { beat: 1.0, chord: "Am", measure: 6 },
      { beat: 1.0, chord: "Dm", measure: 7 },
      { beat: 1.0, chord: "G", measure: 8 }
    ]
  };
  
  return JSON.stringify(sampleData, null, 2);
};