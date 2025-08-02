/**
 * リズム判定ウィンドウコンポーネント
 * キーボード入力を処理し、判定ウィンドウのロジックを管理
 */

import React, { useEffect, useCallback } from 'react';
import { JudgmentWindow } from '@/types/rhythm';

interface RhythmJudgmentWindowProps {
  windows: JudgmentWindow[];
  onNoteInput: (note: number) => void;
  onNoteRelease: (note: number) => void;
}

// キーボードからMIDIノート番号へのマッピング
const KEY_TO_MIDI: Record<string, number> = {
  // 白鍵
  'z': 60, // C4
  'x': 62, // D4
  'c': 64, // E4
  'v': 65, // F4
  'b': 67, // G4
  'n': 69, // A4
  'm': 71, // B4
  ',': 72, // C5
  '.': 74, // D5
  '/': 76, // E5
  
  // 黒鍵
  's': 61, // C#4
  'd': 63, // D#4
  'g': 66, // F#4
  'h': 68, // G#4
  'j': 70, // A#4
  'l': 73, // C#5
  ';': 75, // D#5
  
  // 追加の白鍵（上段）
  'q': 48, // C3
  'w': 50, // D3
  'e': 52, // E3
  'r': 53, // F3
  't': 55, // G3
  'y': 57, // A3
  'u': 59, // B3
  'i': 60, // C4 (duplicate)
  'o': 62, // D4 (duplicate)
  'p': 64, // E4 (duplicate)
  
  // 追加の黒鍵（上段）
  '2': 49, // C#3
  '3': 51, // D#3
  '5': 54, // F#3
  '6': 56, // G#3
  '7': 58, // A#3
  '9': 61, // C#4 (duplicate)
  '0': 63, // D#4 (duplicate)
};

const RhythmJudgmentWindow: React.FC<RhythmJudgmentWindowProps> = ({
  windows: _windows,
  onNoteInput,
  onNoteRelease
}) => {
  // キーボードイベントハンドラ
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 既に押されているキーは無視
    if (e.repeat) return;
    
    const key = e.key.toLowerCase();
    const midiNote = KEY_TO_MIDI[key];
    
    if (midiNote !== undefined) {
      e.preventDefault();
      onNoteInput(midiNote);
    }
  }, [onNoteInput]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    const midiNote = KEY_TO_MIDI[key];
    
    if (midiNote !== undefined) {
      e.preventDefault();
      onNoteRelease(midiNote);
    }
  }, [onNoteRelease]);

  // キーボードイベントの登録
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // このコンポーネントは見えない（ロジックのみ）
  return null;
};

export default RhythmJudgmentWindow;