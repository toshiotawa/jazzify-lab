/**
 * Progression（コード進行）ステージ用のコード列ヘルパー。
 *
 * - DB の `survival_stages.chord_progression` に保存された
 *   `[{ name, voicing }]` 配列をそのまま利用するため、MusicXML パーサは存在しない。
 * - `voicing` は実音域の MIDI 番号（練習モードの鍵盤ハイライト用）。
 *   正解判定はオクターブ無視（mod 12）で行う想定。
 */

import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import type { SurvivalChordProgressionEntry } from '@/components/survival/SurvivalStageDefinitions';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

const midiToNoteName = (midi: number): string => {
  const pitchClass = ((midi % 12) + 12) % 12;
  return NOTE_NAMES[pitchClass];
};

/**
 * 1 件の Progression エントリを `ChordDefinition` に変換する。
 * - `notes` は実音域の MIDI 配列（練習モード鍵盤ハイライト + 判定で利用）
 * - `id` はインデックスとコード名を組み合わせ、ループ時に同一コードでも別 slot 状態として扱えるようにする
 */
export const buildProgressionChordDefinition = (
  entry: SurvivalChordProgressionEntry,
  index: number,
): ChordDefinition => {
  const sortedVoicing: number[] = Array.from(new Set<number>(entry.voicing)).sort((a, b) => a - b);
  const noteNames = sortedVoicing.map(midiToNoteName);
  const id = `prog:${index}:${entry.name}:${sortedVoicing.join(',')}`;
  return {
    id,
    displayName: entry.name,
    notes: sortedVoicing,
    noteNames,
    quality: 'progression',
    root: noteNames[0] ?? 'C',
  };
};

/**
 * Progression 配列をそのまま `ChordDefinition[]` に変換する。
 */
export const buildProgressionChordDefinitions = (
  entries: SurvivalChordProgressionEntry[] | undefined,
): ChordDefinition[] => {
  if (!entries || entries.length === 0) return [];
  return entries.map((entry, idx) => buildProgressionChordDefinition(entry, idx));
};
