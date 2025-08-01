/**
 * ファンタジーリズムエンジン
 * リズムモードのゲームロジックとステート管理を担当
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { toDisplayChordName, type DisplayOpts } from '@/utils/display-note';
import { useTimeStore } from '@/stores/timeStore';
import { note as parseNote } from 'tonal';
import { FantasyStage } from './FantasyGameEngine';

// ===== 型定義 =====

interface ChordDefinition {
  id: string;
  displayName: string;
  notes: number[];
  noteNames: string[];
  quality: string;
  root: string;
}

interface RhythmChordEvent {
  chord: ChordDefinition;
  measure: number;
  beat: number;
  timingMs: number; // 曲の開始からのミリ秒
  window: {
    start: number;
    end: number;
  };
  status: 'pending' | 'success' | 'miss';
}

interface RhythmGameState {
  isActive: boolean;
  currentChordEvents: RhythmChordEvent[];
  nextChordEvents: RhythmChordEvent[];
  playerHp: number;
  enemiesDefeated: number;
  totalEnemies: number;
  score: number;
  combo: number;
  maxCombo: number;
  isGameOver: boolean;
  gameResult: 'clear' | 'gameover' | null;
}

interface RhythmEngineProps {
  stage: FantasyStage;
  isActive: boolean;
  currentInput: number[];
  onGameStateChange: (state: RhythmGameState) => void;
  onChordComplete: (chordId: string) => void;
  onMiss: () => void;
  onInputClear: () => void;
  displayOpts: DisplayOpts;
}

// 判定ウィンドウの設定（前後200ms）
const JUDGMENT_WINDOW_MS = 200;

export const FantasyRhythmEngine: React.FC<RhythmEngineProps> = ({
  stage,
  isActive,
  currentInput,
  onGameStateChange,
  onChordComplete,
  onMiss,
  onInputClear,
  displayOpts
}) => {
  const [gameState, setGameState] = useState<RhythmGameState>({
    isActive: false,
    currentChordEvents: [],
    nextChordEvents: [],
    playerHp: stage?.maxHp || 5,
    enemiesDefeated: 0,
    totalEnemies: stage?.enemyCount || 10,
    score: 0,
    combo: 0,
    maxCombo: 0,
    isGameOver: false,
    gameResult: null
  });

  const { currentMeasure, isCountIn, startAt, readyDuration, bpm } = useTimeStore();
  const chordQueueRef = useRef<RhythmChordEvent[]>([]);
  const processedEventsRef = useRef<Set<string>>(new Set());
  const lastGeneratedMeasureRef = useRef<number>(0);

  // BPMから1拍のミリ秒を計算
  const beatMs = useMemo(() => 60000 / bpm, [bpm]);

  // チャートデータからチードイベントを生成
  const generateChordEvent = useCallback((chordId: string, measure: number, beat: number): RhythmChordEvent => {
    const chordDef = resolveChord(chordId);
    if (!chordDef) {
      throw new Error(`Invalid chord: ${chordId}`);
    }
    
    const displayName = toDisplayChordName(chordDef.root, chordDef.quality, displayOpts);
    
    // 曲開始からのタイミングを計算（カウントイン後を基準に）
    const measuresFromStart = measure - 1;
    const beatsFromStart = measuresFromStart * (stage?.timeSignature || 4) + (beat - 1);
    const timingMs = beatsFromStart * beatMs;
    
    // MIDIノート番号に変換
    const notesNumbers = chordDef.notes.map((note, index) => {
      // ルート音は3オクターブ、その他は4オクターブ
      const octave = index === 0 ? 3 : 4;
      return parseNote(`${note}${octave}`).midi || 60;
    });
    
    return {
      chord: {
        id: chordId,
        displayName,
        notes: notesNumbers,
        noteNames: chordDef.notes,
        quality: chordDef.quality,
        root: chordDef.root
      },
      measure,
      beat,
      timingMs,
      window: {
        start: timingMs - JUDGMENT_WINDOW_MS,
        end: timingMs + JUDGMENT_WINDOW_MS
      },
      status: 'pending'
    };
  }, [beatMs, stage?.timeSignature, displayOpts]);

  // チードイベントの生成（ランダムまたはプログレッション）
  const generateChordEvents = useCallback(() => {
    if (!stage || !isActive) return;

    const events: RhythmChordEvent[] = [];

    if (stage.chordProgressionData?.chords) {
      // プログレッションモード
      const progressionChords = stage.chordProgressionData.chords;
      
      // 現在の小節から次の数小節分のイベントを生成
      for (let m = currentMeasure; m <= currentMeasure + 4; m++) {
        for (const chord of progressionChords) {
          // ループを考慮した小節番号の計算
          const loopedMeasure = ((m - 1) % stage.measureCount) + 1;
          
          if (chord.measure === loopedMeasure) {
            const eventKey = `${loopedMeasure}-${chord.beat}-${chord.chord}`;
            if (!processedEventsRef.current.has(eventKey)) {
              events.push(generateChordEvent(chord.chord, m, chord.beat));
              processedEventsRef.current.add(eventKey);
            }
          }
        }
      }
    } else {
      // ランダムモード（1小節に1回）
      for (let m = currentMeasure; m <= currentMeasure + 4; m++) {
        if (m > lastGeneratedMeasureRef.current) {
          const randomChord = stage.allowedChords[Math.floor(Math.random() * stage.allowedChords.length)];
          events.push(generateChordEvent(randomChord, m, 1));
          lastGeneratedMeasureRef.current = m;
        }
      }
    }

    chordQueueRef.current = [...chordQueueRef.current, ...events];
  }, [stage, isActive, currentMeasure, generateChordEvent]);

  // 現在時刻の取得
  const getCurrentTime = useCallback(() => {
    if (!startAt || isCountIn) return 0;
    return performance.now() - startAt - readyDuration;
  }, [startAt, readyDuration, isCountIn]);

  // 判定処理
  const judgeInput = useCallback(() => {
    if (!isActive || currentInput.length === 0) return;

    const currentTime = getCurrentTime();
    const activeEvents = gameState.currentChordEvents.filter(e => e.status === 'pending');

    for (const event of activeEvents) {
      // 判定ウィンドウ内かチェック
      if (currentTime >= event.window.start && currentTime <= event.window.end) {
        // 入力されたコードが正解かチェック
        const inputNotes = [...currentInput].sort((a, b) => a - b);
        const targetNotes = [...event.chord.notes].sort((a, b) => a - b);
        
        if (inputNotes.length === targetNotes.length &&
            inputNotes.every((note, index) => note === targetNotes[index])) {
          // 正解
          event.status = 'success';
          onChordComplete(event.chord.id);
          onInputClear(); // 入力をクリア
          
          setGameState(prev => ({
            ...prev,
            enemiesDefeated: prev.enemiesDefeated + 1,
            score: prev.score + 100 * (prev.combo + 1),
            combo: prev.combo + 1,
            maxCombo: Math.max(prev.maxCombo, prev.combo + 1)
          }));
          
          devLog.debug('fantasy-rhythm', 'Chord hit!', { chord: event.chord.id, time: currentTime });
          break;
        }
      }
    }
  }, [isActive, currentInput, getCurrentTime, gameState.currentChordEvents, onChordComplete, onInputClear]);

  // ミス判定処理
  const checkMissedEvents = useCallback(() => {
    if (!isActive) return;

    const currentTime = getCurrentTime();
    const updatedEvents = gameState.currentChordEvents.map(event => {
      if (event.status === 'pending' && currentTime > event.window.end) {
        // ミス
        onMiss();
        
        setGameState(prev => ({
          ...prev,
          playerHp: Math.max(0, prev.playerHp - 1),
          combo: 0
        }));
        
        devLog.debug('fantasy-rhythm', 'Chord missed!', { chord: event.chord.id, time: currentTime });
        
        return { ...event, status: 'miss' as const };
      }
      return event;
    });

    // アクティブなイベントを更新
    const activeEvents = updatedEvents.filter(e => 
      e.timingMs > currentTime - 2000 && // 2秒前まで表示
      e.timingMs < currentTime + 4000    // 4秒先まで表示
    );

    setGameState(prev => ({
      ...prev,
      currentChordEvents: activeEvents
    }));
  }, [isActive, getCurrentTime, gameState.currentChordEvents, onMiss]);

  // ゲーム終了判定
  useEffect(() => {
    if (gameState.playerHp <= 0 && !gameState.isGameOver) {
      setGameState(prev => ({
        ...prev,
        isGameOver: true,
        gameResult: 'gameover'
      }));
    } else if (gameState.enemiesDefeated >= gameState.totalEnemies && !gameState.isGameOver) {
      setGameState(prev => ({
        ...prev,
        isGameOver: true,
        gameResult: 'clear'
      }));
    }
  }, [gameState.playerHp, gameState.enemiesDefeated, gameState.totalEnemies, gameState.isGameOver]);

  // ゲーム状態の初期化
  useEffect(() => {
    if (isActive && stage) {
      setGameState({
        isActive: true,
        currentChordEvents: [],
        nextChordEvents: [],
        playerHp: stage.maxHp,
        enemiesDefeated: 0,
        totalEnemies: stage.enemyCount,
        score: 0,
        combo: 0,
        maxCombo: 0,
        isGameOver: false,
        gameResult: null
      });
      processedEventsRef.current.clear();
      lastGeneratedMeasureRef.current = 0;
    }
  }, [isActive, stage]);

  // チードイベントの生成タイミング
  useEffect(() => {
    if (isActive && !isCountIn && currentMeasure > 0) {
      generateChordEvents();
    }
  }, [isActive, isCountIn, currentMeasure, generateChordEvents]);

  // 入力判定
  useEffect(() => {
    judgeInput();
  }, [currentInput, judgeInput]);

  // ミス判定の定期チェック
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      checkMissedEvents();
    }, 16); // 60fps

    return () => clearInterval(interval);
  }, [isActive, checkMissedEvents]);

  // 親コンポーネントへの状態通知
  useEffect(() => {
    onGameStateChange(gameState);
  }, [gameState, onGameStateChange]);

  return null; // このコンポーネントは描画しない（ロジックのみ）
};

export default FantasyRhythmEngine;