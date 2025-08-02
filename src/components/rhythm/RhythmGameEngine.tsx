/**
 * リズムゲームエンジン
 * 判定ロジックとゲーム制御を担当
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useRhythmStore, ChordDefinition, RhythmNote } from '@/stores/rhythmStore';
import { useTimeStore } from '@/stores/timeStore';
import { FantasyStage } from '../fantasy/FantasyGameEngine';
import { note as parseNote } from 'tonal';
import { resolveChord } from '@/utils/chord-utils';
import type { DisplayOpts } from '@/utils/display-note';
import { devLog } from '@/utils/logger';

// 判定ウィンドウ定数
const JUDGMENT_WINDOW_MS = 200; // ±200ms

// ユーティリティ関数
const getChordDefinition = (chordId: string, displayOpts?: DisplayOpts): ChordDefinition | null => {
  const resolved = resolveChord(chordId, 4, displayOpts);
  if (!resolved) {
    console.warn(`⚠️ 未定義のリズムコード: ${chordId}`);
    return null;
  }

  // notesをMIDIノート番号に変換
  const midiNotes = resolved.notes.map(noteName => {
    const noteObj = parseNote(noteName + '4');
    return noteObj && typeof noteObj.midi === 'number' ? noteObj.midi : 60;
  });

  return {
    id: chordId,
    displayName: resolved.displayName,
    notes: midiNotes,
    noteNames: resolved.notes,
    quality: resolved.quality,
    root: resolved.root
  };
};

interface RhythmGameEngineProps {
  stage: FantasyStage;
  onChordCorrect: (chord: ChordDefinition, damageDealt: number) => void;
  onChordIncorrect: () => void;
  onEnemyAttack: (damage: number) => void;
  inputNotes: number[];
  displayOpts?: DisplayOpts;
  onNotesUpdate?: (notes: RhythmNote[]) => void;
}

// カスタムフック
export const useRhythmGameEngine = ({
  stage,
  onChordCorrect,
  onChordIncorrect,
  onEnemyAttack,
  inputNotes,
  displayOpts,
  onNotesUpdate
}: RhythmGameEngineProps) => {
  const rhythmStore = useRhythmStore();
  const timeStore = useTimeStore();
  
  const [enemyHp, setEnemyHp] = useState(stage.enemyHp);
  const [enemyMaxHp] = useState(stage.enemyHp);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  
  // 最後に生成したノーツの小節番号を記録
  const lastGeneratedMeasure = useRef<number>(-1);
  
  // 判定タイマーのRef
  const judgmentTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // コード進行データのパース
  const chordProgressionData = useRef<Array<{
    measure: number;
    beat: number;
    chord: string;
  }>>([]);
  
  useEffect(() => {
    if (stage.chordProgressionData?.chords) {
      chordProgressionData.current = stage.chordProgressionData.chords;
      devLog.debug('🎵 コード進行データ:', chordProgressionData.current);
    }
  }, [stage.chordProgressionData]);
  
  // ノーツ生成タイミングの計算
  const calculateNoteTime = (measure: number, beat: number): number => {
    const { bpm, timeSignature, startAt, readyDuration } = timeStore;
    if (!startAt) return 0;
    
    const msPerBeat = 60000 / bpm;
    const beatsFromStart = (measure - 1) * timeSignature + (beat - 1);
    const totalMs = readyDuration + beatsFromStart * msPerBeat;
    
    return startAt + totalMs;
  };
  
  // ランダムモードでのコード選択
  const selectRandomChord = (): ChordDefinition | null => {
    const { allowedChords } = stage;
    if (!allowedChords || allowedChords.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * allowedChords.length);
    return getChordDefinition(allowedChords[randomIndex], displayOpts);
  };
  
  // プログレッションモードでのコード選択
  const selectProgressionChord = (measure: number): ChordDefinition | null => {
    if (chordProgressionData.current.length === 0) return null;
    
    // 現在の小節のコードを探す
    const chordData = chordProgressionData.current.find(c => c.measure === measure);
    if (!chordData) return null;
    
    return getChordDefinition(chordData.chord, displayOpts);
  };
  
  // ノーツの生成
  const generateNotes = useCallback(() => {
    const { currentMeasure, isCountIn, measureCount } = timeStore;
    
    // カウントイン中から次の小節のノーツを準備
    const measureToGenerate = isCountIn 
      ? 1 // カウントイン中は1小節目のノーツを準備
      : currentMeasure + 1; // 通常は次の小節を準備
    
    // ループ処理
    const actualMeasure = measureToGenerate > measureCount ? 1 : measureToGenerate;
    
    // 既に生成済みの小節はスキップ
    if (lastGeneratedMeasure.current === actualMeasure && !isCountIn) {
      return;
    }
    
    lastGeneratedMeasure.current = actualMeasure;
    
    // コード選択
    const chord = stage.chordProgressionData
      ? selectProgressionChord(actualMeasure)
      : selectRandomChord();
    
    if (!chord) return;
    
    // ノーツのタイミング計算
    const hitTime = calculateNoteTime(actualMeasure, 1); // 各小節の1拍目
    
    const newNote: RhythmNote = {
      id: `note_${Date.now()}_${actualMeasure}`,
      chord,
      hitTime,
      measureNumber: actualMeasure,
      beatNumber: 1
    };
    
    rhythmStore.addNote(newNote);
    devLog.debug('🎵 ノーツ生成:', newNote);
    
    // 判定タイマーの設定（ウィンドウ終了時に自動的にmiss判定）
    const timerId = setTimeout(() => {
      if (!rhythmStore.isJudged(newNote.id)) {
        handleMissJudgment(newNote);
      }
    }, hitTime + JUDGMENT_WINDOW_MS - performance.now());
    
    judgmentTimers.current.set(newNote.id, timerId);
  }, [timeStore, stage, displayOpts, rhythmStore]);
  
  // miss判定の処理
  const handleMissJudgment = useCallback((note: RhythmNote) => {
    rhythmStore.markAsJudged(note.id);
    rhythmStore.removeNote(note.id);
    
    // 敵の攻撃
    const damage = Math.floor(Math.random() * (stage.maxDamage - stage.minDamage + 1)) + stage.minDamage;
    onEnemyAttack(damage);
    onChordIncorrect();
    
    // タイマーのクリーンアップ
    const timerId = judgmentTimers.current.get(note.id);
    if (timerId) {
      clearTimeout(timerId);
      judgmentTimers.current.delete(note.id);
    }
  }, [rhythmStore, stage, onEnemyAttack, onChordIncorrect]);
  
  // 入力判定
  const checkChordMatch = useCallback(() => {
    const now = performance.now();
    
    // 判定ウィンドウ内のノーツを探す
    const pendingNotes = rhythmStore.pendingNotes;
    
    for (const note of pendingNotes) {
      // 既に判定済みならスキップ
      if (rhythmStore.isJudged(note.id)) continue;
      
      // 判定ウィンドウ内かチェック
      if (now >= note.hitTime - JUDGMENT_WINDOW_MS && 
          now <= note.hitTime + JUDGMENT_WINDOW_MS) {
        
        // 入力ノートとコードが一致するか確認
        const inputSet = new Set(inputNotes);
        const targetSet = new Set(note.chord.notes);
        
        if (inputSet.size === targetSet.size &&
            [...inputSet].every(n => targetSet.has(n))) {
          // 成功判定
          rhythmStore.markAsJudged(note.id);
          rhythmStore.removeNote(note.id);
          
          // ダメージ計算
          const damage = Math.floor(Math.random() * (stage.maxDamage - stage.minDamage + 1)) + stage.minDamage;
          
          // 敵HPを減らす
          const newHp = Math.max(0, enemyHp - damage);
          setEnemyHp(newHp);
          
          if (newHp === 0) {
            // 敵を倒した
            setEnemiesDefeated(prev => prev + 1);
            setEnemyHp(enemyMaxHp); // 次の敵のHP
          }
          
          onChordCorrect(note.chord, damage);
          
          // タイマーのクリーンアップ
          const timerId = judgmentTimers.current.get(note.id);
          if (timerId) {
            clearTimeout(timerId);
            judgmentTimers.current.delete(note.id);
          }
          
          break; // 一度に判定するのは1つのノーツのみ
        }
      }
    }
  }, [inputNotes, rhythmStore, stage, enemyHp, enemyMaxHp, onChordCorrect]);
  
  // 入力が変化したら判定を実行
  useEffect(() => {
    if (inputNotes.length > 0) {
      checkChordMatch();
    }
  }, [inputNotes, checkChordMatch]);
  
  // 拍の変化を監視してノーツを生成
  useEffect(() => {
    const { currentBeat, isCountIn } = timeStore;
    
    // 各小節の最初の拍でノーツを生成
    if (currentBeat === 1 || (isCountIn && currentBeat === timeStore.timeSignature)) {
      generateNotes();
    }
  }, [timeStore.currentBeat, timeStore.currentMeasure, timeStore.isCountIn, generateNotes]);
  
  // ノーツの更新をコールバックに通知
  useEffect(() => {
    if (onNotesUpdate) {
      onNotesUpdate(rhythmStore.pendingNotes);
    }
  }, [rhythmStore.pendingNotes, onNotesUpdate]);
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      // すべての判定タイマーをクリア
      judgmentTimers.current.forEach(timerId => clearTimeout(timerId));
      judgmentTimers.current.clear();
      
      // ストアをリセット
      rhythmStore.reset();
    };
  }, []);
  
  return {
    enemyHp,
    enemyMaxHp,
    enemiesDefeated,
    totalEnemies: stage.enemyCount,
    pendingNotes: rhythmStore.pendingNotes,
    currentChord: rhythmStore.currentChord
  };
};

export type { RhythmGameEngineProps };