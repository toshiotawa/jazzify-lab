/**
 * リズム機能を統合したファンタジーゲーム
 */

import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { useRhythmStore, useRhythmGameState, useRhythmEnemies, useRhythmJudgment } from '@/stores/rhythmStore';
import { AudioManager } from './AudioManager';
import { RhythmEngine } from './RhythmEngine';
import { RhythmGameUI } from './RhythmGameUI';
import { MIDIController } from '@/utils/MidiController';
import type { ExtendedFantasyStage, RhythmStageData, ChordDefinition } from '@/types';
import { resolveChord } from '@/utils/chord-utils';
import { toDisplayChordName } from '@/utils/display-note';

interface RhythmFantasyGameProps {
  stage: ExtendedFantasyStage;
  onChordCorrect: (chord: ChordDefinition, isSpecial: boolean, damageDealt: number, defeated: boolean, monsterId: string) => void;
  onChordIncorrect: (expectedChord: ChordDefinition, inputNotes: number[]) => void;
  onGameComplete: (result: 'clear' | 'gameover') => void;
  onEnemyAttack: (attackingMonsterId?: string) => void;
  onBackToStageSelect: () => void;
}

export const RhythmFantasyGame: React.FC<RhythmFantasyGameProps> = ({
  stage,
  onChordCorrect,
  onChordIncorrect,
  onGameComplete,
  onEnemyAttack,
  onBackToStageSelect,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [playerHp, setPlayerHp] = useState(stage.maxHp);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  
  // ストア
  const rhythmStore = useRhythmStore();
  
  // MIDI管理
  const midiControllerRef = useRef<MIDIController | null>(null);
  const activeNotesRef = useRef<Set<number>>(new Set());
  
  // リズム状態
  const rhythmGameState = useRhythmGameState();
  const rhythmEnemies = useRhythmEnemies();
  const rhythmJudgment = useRhythmJudgment();

  // ステージデータをリズム用に変換
  const rhythmStageData = useMemo((): RhythmStageData => ({
    id: stage.id,
    stage_number: stage.stageNumber,
    name: stage.name,
    description: stage.description,
    game_type: stage.gameType || 'rhythm',
    rhythm_pattern: stage.rhythmPattern || 'random',
    bpm: stage.bpm || 120,
    time_signature: stage.timeSignature || 4,
    loop_measures: stage.loopMeasures || 8,
    measure_count: stage.measureCount || 8,
    chord_progression_data: stage.chordProgressionData || null,
    rhythm_data: stage.rhythmData || null,
    mp3_url: stage.mp3Url || '/demo-1.mp3',
    allowed_chords: stage.allowedChords,
    simultaneous_monster_count: stage.simultaneousMonsterCount,
    max_hp: stage.maxHp,
    enemy_count: stage.enemyCount,
    enemy_hp: stage.enemyHp,
    min_damage: stage.minDamage,
    max_damage: stage.maxDamage,
    enemy_gauge_seconds: stage.enemyGaugeSeconds,
    show_sheet_music: stage.showSheetMusic,
    show_guide: stage.showGuide,
    monster_icon: stage.monsterIcon,
    bgm_url: stage.bgmUrl || null,
  }), [stage]);

  // MIDI初期化
  useEffect(() => {
    if (!midiControllerRef.current) {
      const controller = new MIDIController({
        onNoteOn: (note: number) => {
          activeNotesRef.current.add(note);
          handleNoteInput(note);
        },
        onNoteOff: (note: number) => {
          activeNotesRef.current.delete(note);
        },
        onDeviceChange: (connected: boolean) => {
          setIsMidiConnected(connected);
        },
      });
      midiControllerRef.current = controller;
    }

    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.destroy();
        midiControllerRef.current = null;
      }
    };
  }, [handleNoteInput]);

  // ゲーム初期化
  useEffect(() => {
    if (!isInitialized) {
      rhythmStore.initializeRhythmGame(rhythmStageData);
      setIsInitialized(true);
    }
  }, [rhythmStore, rhythmStageData, isInitialized]);

  // コード定義変換ユーティリティ
  const createChordDefinition = useCallback((chordName: string): ChordDefinition => {
    const chordData = resolveChord(chordName);
    if (!chordData) {
      throw new Error(`Unknown chord: ${chordName}`);
    }

    // 音名をMIDIノート番号に変換
    const midiNotes = chordData.notes.map(noteName => {
      // 簡単な音名->MIDI変換（C4=60を基準）
      const noteMap: Record<string, number> = {
        'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
        'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68,
        'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71
      };
      const baseNote = noteName.replace(/\d+$/, '');
      const octave = parseInt(noteName.match(/\d+$/)?.[0] || '4');
      return (noteMap[baseNote] || 60) + (octave - 4) * 12;
    });

    return {
      id: chordName,
      displayName: toDisplayChordName(chordName, { 
        lang: 'solfege',
        simple: true
      }),
      notes: midiNotes,
      noteNames: chordData.notes,
      quality: chordData.quality || 'major',
      root: chordData.root || chordName.charAt(0),
    };
  }, []);

  // オーディオ関連のコールバック
  const handleAudioReady = useCallback((duration: number) => {
    // Audio loaded successfully
    if (duration > 0) {
      setAudioError(null);
    }
  }, []);

  const handleAudioError = useCallback((error: string) => {
    setAudioError(error);
    rhythmStore.setError(error);
  }, [rhythmStore]);

  const handleTimeUpdate = useCallback((time: number) => {
    rhythmStore.updateTime(time);
  }, [rhythmStore]);

  // リズムエンジンのコールバック
  const handleBeatTick = useCallback((measure: number, beat: number) => {
    rhythmStore.onBeatTick(measure, beat);
  }, [rhythmStore]);

  const handleJudgmentStart = useCallback((expectedChord: string, judgmentTime: number) => {
    rhythmStore.onJudgmentStart(expectedChord, judgmentTime);
  }, [rhythmStore]);

  const handleJudgmentEnd = useCallback((judgment: { success: boolean; chord: string; timingError: number; expectedTime: number; actualTime: number }) => {
    rhythmStore.onJudgmentEnd(judgment);
    
    try {
      const chordDef = createChordDefinition(judgment.chord);
      
      if (judgment.success) {
        // 成功時の処理
        const targetEnemy = rhythmEnemies.find(e => e.assignedChord === judgment.chord);
        const damageDealt = rhythmStageData.min_damage + 
          Math.floor(Math.random() * (rhythmStageData.max_damage - rhythmStageData.min_damage + 1));
        const defeated = targetEnemy ? targetEnemy.hp <= 1 : false;
        
        onChordCorrect(chordDef, false, damageDealt, defeated, targetEnemy?.id || '');
      } else {
        // 失敗時の処理
        const expectedChordDef = createChordDefinition(rhythmJudgment.currentExpectedChord || judgment.chord);
        onChordIncorrect(expectedChordDef, []);
        onEnemyAttack();
        
        // HPを減少
        setPlayerHp(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error handling judgment:', error);
    }
  }, [
    rhythmStore, 
    createChordDefinition, 
    rhythmEnemies, 
    rhythmStageData, 
    rhythmJudgment.currentExpectedChord,
    onChordCorrect, 
    onChordIncorrect, 
    onEnemyAttack
  ]);

  // ノート入力処理
  const handleNoteInput = useCallback((_note: number) => {
    // 現在アクティブなノートセットからコードを判定
    const currentNotes = Array.from(activeNotesRef.current).sort((a, b) => a - b);
    
    if (currentNotes.length >= 3) { // 最低3音でコード判定
      // 簡単なコード判定ロジック（実際の実装ではより複雑な判定が必要）
      const chord = recognizeChord(currentNotes);
      if (chord && rhythmStageData.allowed_chords.includes(chord)) {
        handleChordInput(chord);
      }
    }
  }, [rhythmStageData.allowed_chords, recognizeChord, handleChordInput]);

  // 簡単なコード認識（実際の実装ではより精密な判定が必要）
  const recognizeChord = useCallback((notes: number[]): string | null => {
    const intervals = notes.slice(1).map(note => note - notes[0]);
    
    // 基本的なコードパターン
    const chordPatterns: Record<string, number[]> = {
      'C': [4, 7],     // メジャー
      'Cm': [3, 7],    // マイナー
      'C7': [4, 7, 10], // セブンス
      'CM7': [4, 7, 11], // メジャーセブンス
      // 他のコードパターンも追加可能
    };

    for (const [chordType, pattern] of Object.entries(chordPatterns)) {
      if (intervals.length >= pattern.length && 
          pattern.every(interval => intervals.includes(interval))) {
        // ルート音からコード名を生成
        const rootNote = notes[0] % 12;
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const root = noteNames[rootNote];
        return chordType === 'C' ? root : root + chordType.slice(1);
      }
    }
    
    return null;
  }, []);

  // 外部からのコード入力処理
  const handleChordInput = useCallback((chordName: string) => {
    const success = rhythmStore.triggerChordInput(chordName);
    return success;
  }, [rhythmStore]);

  // ゲーム状態の監視
  const gameStatus = useRhythmStore(state => ({
    isGameOver: state.isGameOver,
    gameResult: state.gameResult,
  }));

  useEffect(() => {
    if (gameStatus.isGameOver && gameStatus.gameResult) {
      onGameComplete(gameStatus.gameResult);
    }
  }, [gameStatus.isGameOver, gameStatus.gameResult, onGameComplete]);

  // HP 0でゲームオーバー
  useEffect(() => {
    if (playerHp <= 0) {
      rhythmStore.stopGame();
      onGameComplete('gameover');
    }
  }, [playerHp, rhythmStore, onGameComplete]);

  // ゲーム開始
  const startGame = useCallback(() => {
    rhythmStore.startGame();
  }, [rhythmStore]);

  // ゲーム停止
  const stopGame = useCallback(() => {
    rhythmStore.stopGame();
  }, [rhythmStore]);

  // 外部APIの提供
  React.useImperativeHandle(React.createRef(), () => ({
    startGame,
    stopGame,
    handleChordInput,
    isPlaying: rhythmGameState.isPlaying,
    currentTime: rhythmGameState.currentTime,
  }));

  return (
    <div className="rhythm-fantasy-game">
      {/* バックグラウンド処理 */}
      <AudioManager
        src={rhythmStageData.mp3_url}
        isPlaying={rhythmGameState.isPlaying}
        currentTime={rhythmGameState.currentTime}
        bpm={rhythmGameState.bpm}
        timeSignature={rhythmGameState.timeSignature}
        loopMeasures={rhythmStageData.loop_measures}
        onTimeUpdate={handleTimeUpdate}
        onAudioReady={handleAudioReady}
        onError={handleAudioError}
      />

      <RhythmEngine
        bpm={rhythmGameState.bpm}
        timeSignature={rhythmGameState.timeSignature}
        currentTime={rhythmGameState.currentTime}
        isPlaying={rhythmGameState.isPlaying}
        rhythmPattern={rhythmGameState.rhythmPattern}
        progressionData={rhythmStore.progressionData}
        allowedChords={rhythmStageData.allowed_chords}
        onBeatTick={handleBeatTick}
        onJudgmentStart={handleJudgmentStart}
        onJudgmentEnd={handleJudgmentEnd}
      />

      {/* メインUI */}
      <RhythmGameUI
        stage={{
          name: stage.name,
          stageNumber: stage.stageNumber,
          showGuide: stage.showGuide,
        }}
        playerHp={playerHp}
        maxHp={stage.maxHp}
        onBackToStageSelect={onBackToStageSelect}
      />

      {/* ゲーム開始/停止ボタン */}
      <div className="fixed bottom-4 left-4 space-x-2">
        <button
          onClick={startGame}
          disabled={rhythmGameState.isPlaying}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded"
        >
          開始
        </button>
        <button
          onClick={stopGame}
          disabled={!rhythmGameState.isPlaying}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white rounded"
        >
          停止
        </button>
      </div>

      {/* MIDI接続状態 */}
      <div className="fixed top-4 right-4">
        <div className={`px-3 py-1 rounded text-sm ${isMidiConnected ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'}`}>
          MIDI: {isMidiConnected ? '接続済み' : '未接続'}
        </div>
      </div>

      {/* エラー表示 */}
      {audioError && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white p-4 rounded shadow-lg">
          {audioError}
        </div>
      )}
    </div>
  );
};

export default RhythmFantasyGame;