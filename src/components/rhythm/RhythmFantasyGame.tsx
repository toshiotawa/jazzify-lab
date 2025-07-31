/**
 * リズム機能を統合したファンタジーゲーム
 */

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useRhythmStore, useRhythmGameState, useRhythmEnemies, useRhythmJudgment } from '@/stores/rhythmStore';
import { AudioManager } from './AudioManager';
import { RhythmEngine } from './RhythmEngine';
import type { ExtendedFantasyStage, RhythmStageData, ChordDefinition } from '@/types';
import { resolveChord } from '@/utils/chord-utils';
import { toDisplayChordName } from '@/utils/display-note';

interface RhythmFantasyGameProps {
  stage: ExtendedFantasyStage;
  onChordCorrect: (chord: ChordDefinition, isSpecial: boolean, damageDealt: number, defeated: boolean, monsterId: string) => void;
  onChordIncorrect: (expectedChord: ChordDefinition, inputNotes: number[]) => void;
  onGameComplete: (result: 'clear' | 'gameover') => void;
  onEnemyAttack: (attackingMonsterId?: string) => void;
}

export const RhythmFantasyGame: React.FC<RhythmFantasyGameProps> = ({
  stage,
  onChordCorrect,
  onChordIncorrect,
  onGameComplete,
  onEnemyAttack,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  // ストア
  const rhythmStore = useRhythmStore();
  
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
      {/* オーディオマネージャー */}
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

      {/* リズムエンジン */}
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

      {/* エラー表示 */}
      {audioError && (
        <div className="error-message text-red-500 p-4 bg-red-100 rounded">
          {audioError}
        </div>
      )}

      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info text-xs bg-gray-100 p-2 rounded">
          <div>Game Type: {rhythmGameState.gameType}</div>
          <div>Pattern: {rhythmGameState.rhythmPattern}</div>
          <div>BPM: {rhythmGameState.bpm}</div>
          <div>Time: {rhythmGameState.currentTime.toFixed(2)}s</div>
          <div>Measure: {rhythmGameState.currentMeasure}</div>
          <div>Beat: {rhythmGameState.currentBeat.toFixed(2)}</div>
          <div>Expected: {rhythmJudgment.currentExpectedChord}</div>
          <div>In Window: {rhythmJudgment.isInJudgmentWindow ? 'Yes' : 'No'}</div>
          <div>Active Enemies: {rhythmEnemies.filter(e => e.isActive).length}</div>
        </div>
      )}
    </div>
  );
};

export default RhythmFantasyGame;