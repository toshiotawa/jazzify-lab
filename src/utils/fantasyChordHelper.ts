/**
 * ファンタジーモード用コードヘルパー関数
 */

import { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import { getFantasyChordNotes } from './chord-utils';
import { FANTASY_CHORD_MAP } from './chord-templates';

/**
 * コードIDからChordDefinitionを取得
 */
export function getChordDefinition(chordId: string): ChordDefinition | null {
  const mapping = FANTASY_CHORD_MAP[chordId];
  if (!mapping) {
    return null;
  }
  
  const notes = getFantasyChordNotes(chordId);
  
  // 音名の生成（簡易版）
  const noteNames = notes.map(note => {
    const noteNumber = note % 12;
    const noteNameMap = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return noteNameMap[noteNumber];
  });
  
  return {
    id: chordId,
    notes,
    noteNames,
    quality: mapping.quality,
    root: mapping.root,
    displayName: chordId, // 表示名を追加
  };
}