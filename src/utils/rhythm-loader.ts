/**
 * リズムモード用のJSONファイルローダー
 */

import { devLog } from './logger';
import type { ChordTiming } from '@/types';

export interface RhythmData {
  bpm: number;
  timeSignature: number;
  measureCount: number;
  chords: Array<{
    chord: string;
    measure: number;
    beat: number;
  }>;
}

/**
 * リズムモード用のJSONファイルを読み込む
 */
export async function loadRhythmData(url: string): Promise<RhythmData> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load rhythm data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // データ検証
    if (!data.bpm || !data.timeSignature || !data.measureCount || !Array.isArray(data.chords)) {
      throw new Error('Invalid rhythm data format');
    }
    
    devLog.debug('✅ Rhythm data loaded:', {
      bpm: data.bpm,
      timeSignature: data.timeSignature,
      measureCount: data.measureCount,
      chordCount: data.chords.length
    });
    
    return data as RhythmData;
  } catch (error) {
    devLog.error('❌ Failed to load rhythm data:', error);
    throw error;
  }
}

/**
 * RhythmDataからChordTiming配列に変換
 */
export function convertToChordTimings(data: RhythmData): ChordTiming[] {
  return data.chords.map(chord => ({
    chord: chord.chord,
    measure: chord.measure,
    beat: chord.beat
  }));
}

/**
 * RhythmDataからコード進行（文字列配列）を抽出
 */
export function extractChordProgression(data: RhythmData): string[] {
  return data.chords.map(chord => chord.chord);
}