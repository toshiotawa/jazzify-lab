import React, { useCallback, useRef, useEffect } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { 
  RhythmNote, 
  JudgmentResult, 
  RhythmGameState, 
  FantasyStage,
  ChordDefinition,
  ChordProgressionData
} from '@/types';

interface RhythmGameEngineProps {
  stage: FantasyStage;
  onStateChange: (state: RhythmGameState) => void;
  onJudgment: (result: JudgmentResult) => void;
  onGameComplete: (result: 'clear' | 'gameover', finalState: RhythmGameState) => void;
}

// ランダムパターン生成
function generateRandomNotes(
  allowedChords: string[],
  measureCount: number,
  bpm: number,
  timeSignature: number = 4
): RhythmNote[] {
  const notes: RhythmNote[] = [];
  const secondsPerBeat = 60 / bpm;
  const beatsPerMeasure = timeSignature;
  
  for (let measure = 1; measure <= measureCount; measure++) {
    // ランダムコード選択
    const chordIndex = Math.floor(Math.random() * allowedChords.length);
    const chord = allowedChords[chordIndex];
    
    // タイミング計算（1拍目）
    const time = (measure - 1) * beatsPerMeasure * secondsPerBeat;
    
    notes.push({
      id: `${measure}-${chord}-${Date.now()}`,
      chord,
      targetTime: time,
      measure,
      beat: 1,
      status: 'waiting'
    });
  }
  
  return notes;
}

// コード進行パターン生成
function generateProgressionNotes(
  progressionData: ChordProgressionData,
  bpm: number,
  timeSignature: number = 4
): RhythmNote[] {
  const notes: RhythmNote[] = [];
  const secondsPerBeat = 60 / bpm;
  
  progressionData.chords.forEach((chordData, index) => {
    // 小節・拍から絶対時間を計算
    const measureTime = (chordData.measure - 1) * timeSignature * secondsPerBeat;
    const beatTime = (chordData.beat - 1) * secondsPerBeat;
    const time = measureTime + beatTime;
    
    notes.push({
      id: `${chordData.measure}-${chordData.beat}-${chordData.chord}-${index}`,
      chord: chordData.chord,
      targetTime: time,
      measure: chordData.measure,
      beat: chordData.beat,
      status: 'waiting'
    });
  });
  
  // 時間順でソート
  return notes.sort((a, b) => a.targetTime - b.targetTime);
}

export const useRhythmGameEngine = ({
  stage,
  onStateChange,
  onJudgment,
  onGameComplete
}: RhythmGameEngineProps) => {
  
  const timeStore = useTimeStore();
  const gameStateRef = useRef<RhythmGameState>({
    notes: [],
    currentTime: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    hitCount: 0,
    missCount: 0,
    isPlaying: false,
    playerHp: stage.max_hp,
    enemyHp: stage.enemy_hp * stage.enemy_count
  });

  const animationFrameRef = useRef<number>();

  // 現在のゲーム時間を取得
  const getCurrentGameTime = useCallback((): number => {
    const { startAt, readyDuration } = timeStore;
    if (!startAt) return 0;
    
    const elapsed = performance.now() - startAt;
    if (elapsed < readyDuration) return 0; // Ready期間中
    
    // BGM同期時間を計算（秒単位）
    return (elapsed - readyDuration) / 1000;
  }, [timeStore]);

  // ノーツ生成
  const generateNotes = useCallback((stage: FantasyStage): RhythmNote[] => {
    if (stage.chord_progression_data) {
      // コード進行パターン
      return generateProgressionNotes(
        stage.chord_progression_data, 
        stage.bpm || 120,
        stage.time_signature
      );
    } else {
      // ランダムパターン
      return generateRandomNotes(
        stage.allowed_chords, 
        stage.measure_count || 8, 
        stage.bpm || 120,
        stage.time_signature
      );
    }
  }, []);

  // ノーツ状態更新
  const updateNotesStatus = useCallback((notes: RhythmNote[], currentTime: number) => {
    const activationWindow = 3; // 3秒前からアクティブ
    
    notes.forEach(note => {
      const timeToTarget = note.targetTime - currentTime;
      
      if (note.status === 'waiting' && timeToTarget <= activationWindow) {
        note.status = 'active';
      }
    });
  }, []);

  // 自動Miss判定
  const checkMissedNotes = useCallback((notes: RhythmNote[], currentTime: number) => {
    const missThreshold = 0.3; // 300ms過ぎたらMiss
    
    notes.forEach(note => {
      if (note.status === 'active') {
        const timePassed = currentTime - note.targetTime;
        
        if (timePassed > missThreshold) {
          note.status = 'missed';
          handleMiss(note);
        }
      }
    });
  }, []);

  // ヒット処理
  const handleHit = useCallback((result: JudgmentResult) => {
    const state = gameStateRef.current;
    
    // ノーツの状態を更新
    if (result.note) {
      const noteIndex = state.notes.findIndex(n => n.id === result.note!.id);
      if (noteIndex !== -1) {
        state.notes[noteIndex].status = 'hit';
      }
    }
    
    // コンボ・スコア更新
    state.combo++;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.hitCount++;
    
    // スコア計算
    const baseScore = result.rank === 'perfect' ? 300 : 100;
    const comboBonus = Math.floor(state.combo / 10) * 50;
    state.score += baseScore + comboBonus;
    
    // 敵にダメージ
    const damage = result.rank === 'perfect' ? stage.max_damage : stage.min_damage;
    state.enemyHp = Math.max(0, state.enemyHp - damage);
    
    // 状態更新を通知
    onStateChange({ ...state });
    
    // ゲームクリア判定
    if (state.enemyHp <= 0) {
      state.isPlaying = false;
      onGameComplete('clear', { ...state });
    }
  }, [stage, onStateChange, onGameComplete]);

  // ミス処理
  const handleMiss = useCallback((note: RhythmNote | undefined) => {
    const state = gameStateRef.current;
    
    // コンボリセット
    state.combo = 0;
    state.missCount++;
    
    // プレイヤーダメージ
    state.playerHp = Math.max(0, state.playerHp - 1);
    
    // 状態更新を通知
    onStateChange({ ...state });
    
    // ゲームオーバー判定
    if (state.playerHp <= 0) {
      state.isPlaying = false;
      onGameComplete('gameover', { ...state });
    }
  }, [onStateChange, onGameComplete]);

  // 判定処理
  const processChordInput = useCallback((chord: ChordDefinition): void => {
    const currentTime = getCurrentGameTime();
    const activeNotes = gameStateRef.current.notes.filter(n => n.status === 'active');
    
    // 判定ウィンドウ実装
    const judgmentWindow = new JudgmentWindow();
    const result = judgmentWindow.processChordInput(
      chord,
      currentTime,
      activeNotes
    );
    
    if (result.type === 'hit') {
      handleHit(result);
    } else {
      handleMiss(result.note);
    }
    
    onJudgment(result);
  }, [getCurrentGameTime, handleHit, handleMiss, onJudgment]);

  // ゲーム状態更新
  const updateGameState = useCallback(() => {
    const state = gameStateRef.current;
    if (!state.isPlaying) return;
    
    state.currentTime = getCurrentGameTime();
    
    // ノーツ状態更新
    updateNotesStatus(state.notes, state.currentTime);
    
    // 自動Miss判定
    checkMissedNotes(state.notes, state.currentTime);
    
    // 状態更新を通知
    onStateChange({ ...state });
  }, [getCurrentGameTime, updateNotesStatus, checkMissedNotes, onStateChange]);

  // ゲーム初期化
  const initializeGame = useCallback(() => {
    const notes = generateNotes(stage);
    
    gameStateRef.current = {
      notes,
      currentTime: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      hitCount: 0,
      missCount: 0,
      isPlaying: true,
      playerHp: stage.max_hp,
      enemyHp: stage.enemy_hp * stage.enemy_count
    };
    
    // timeStore初期化
    timeStore.setStart(
      stage.bpm || 120,
      stage.time_signature || 4,
      stage.measure_count || 8,
      stage.count_in_measures || 1
    );
    
    onStateChange(gameStateRef.current);
  }, [stage, generateNotes, timeStore, onStateChange]);

  // ゲームループ
  useEffect(() => {
    if (!gameStateRef.current.isPlaying) return;
    
    const gameLoop = () => {
      updateGameState();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    gameLoop();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateGameState]);

  return {
    gameState: gameStateRef.current,
    processChordInput,
    initializeGame,
    getCurrentGameTime,
    update: updateGameState
  };
};

// 判定ウィンドウクラス
class JudgmentWindow {
  private readonly PERFECT_WINDOW_MS = 50; // ±50ms以内で PERFECT
  private readonly GOOD_WINDOW_MS = 200;   // ±200ms以内で GOOD
  
  processChordInput(
    inputChord: ChordDefinition,
    currentTime: number,
    activeNotes: RhythmNote[]
  ): JudgmentResult {
    // 現在判定可能なノーツを検索
    const targetNote = this.findJudgableNote(currentTime, activeNotes);
    
    if (!targetNote) {
      return {
        type: 'miss',
        reason: 'no_active_note',
        timing: 0
      };
    }
    
    // タイミング誤差を計算（ミリ秒）
    const timingError = Math.abs((currentTime - targetNote.targetTime) * 1000);
    
    // 判定ウィンドウ外
    if (timingError > this.GOOD_WINDOW_MS) {
      return {
        type: 'miss',
        reason: 'outside_window',
        timing: timingError,
        note: targetNote
      };
    }
    
    // コード一致チェック
    if (!this.isChordMatch(inputChord.id, targetNote.chord)) {
      return {
        type: 'miss',
        reason: 'wrong_chord',
        timing: timingError,
        note: targetNote
      };
    }
    
    // 判定ランク決定
    const rank = timingError <= this.PERFECT_WINDOW_MS ? 'perfect' : 'good';
    
    return {
      type: 'hit',
      rank,
      timing: timingError,
      note: targetNote
    };
  }
  
  private findJudgableNote(currentTime: number, notes: RhythmNote[]): RhythmNote | null {
    const windowSeconds = this.GOOD_WINDOW_MS / 1000;
    
    return notes.find(note => {
      const timeDiff = Math.abs(currentTime - note.targetTime);
      return note.status === 'active' && timeDiff <= windowSeconds;
    }) || null;
  }
  
  private isChordMatch(inputChord: string, targetChord: string): boolean {
    // 基本的な文字列一致
    if (inputChord === targetChord) return true;
    
    // 異名同音チェック（例: C# = Db）
    const enharmonicMap: { [key: string]: string[] } = {
      'C#': ['Db'],
      'Db': ['C#'],
      'D#': ['Eb'],
      'Eb': ['D#'],
      'F#': ['Gb'],
      'Gb': ['F#'],
      'G#': ['Ab'],
      'Ab': ['G#'],
      'A#': ['Bb'],
      'Bb': ['A#']
    };
    
    return enharmonicMap[inputChord]?.includes(targetChord) || false;
  }
}