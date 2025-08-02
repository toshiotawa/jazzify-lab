/**
 * リズムゲームエンジン
 * リズムモードのゲームロジックとステート管理を担当
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { resolveChord } from '@/utils/chord-utils';
import { toDisplayChordName, type DisplayOpts } from '@/utils/display-note';
import { useEnemyStore } from '@/stores/enemyStore';
import { useTimeStore } from '@/stores/timeStore';
import { useRhythmStore, type RhythmNote } from '@/stores/rhythmStore';
import { getStageMonsterIds } from '@/data/monsters';
import { note as parseNote } from 'tonal';

// ===== 型定義 =====

interface ChordDefinition {
  id: string;          
  displayName: string; 
  notes: number[];     
  noteNames: string[]; 
  quality: string;     
  root: string;        
}

interface RhythmEngineProps {
  // ステージ情報
  stage: {
    id: string;
    stageNumber: string;
    name: string;
    maxHp: number;
    enemyGaugeSeconds: number;
    enemyCount: number;
    enemyHp: number;
    minDamage: number;
    maxDamage: number;
    allowedChords: string[];
    chord_progression_data?: any;
    bpm: number;
    measureCount: number;
    timeSignature: number;
    countInMeasures: number;
  };
  
  // 音名表示設定
  noteNameLang: 'en' | 'solfege';
  simpleNoteName: boolean;
  
  // BGM制御
  bgmManager: any; // BGMManager instance
  
  // イベントハンドラ
  onCorrectInput: () => void;
  onWrongInput: () => void;
  onPlayerAttack: (damage: number) => void;
  onEnemyAttack: (damage: number) => void;
  onGameComplete: () => void;
  
  // プレイヤー状態
  playerHp: number;
  setPlayerHp: (hp: number) => void;
}

interface ChordProgressionData {
  chords: Array<{
    measure: number;
    beat: number;
    chord: string;
  }>;
}

const RhythmGameEngine = ({
  stage,
  noteNameLang,
  simpleNoteName,
  bgmManager: _bgmManager,
  onCorrectInput,
  onWrongInput,
  onPlayerAttack,
  onEnemyAttack,
  onGameComplete,
  playerHp,
  setPlayerHp
}: RhythmEngineProps) => {
  // ストア
  const { currentBeat, currentMeasure, isCountIn, bpm, startAt } = useTimeStore();
  const { addNote, setChord, judge, reset: resetRhythm, pending } = useRhythmStore();
  const { enrageLevel, setEnrageLevel, reset: resetEnemy } = useEnemyStore();
  
  // ローカル状態
  const [playedNotes, setPlayedNotes] = useState<Set<number>>(new Set());
  const [progressionIndex, setProgressionIndex] = useState(0);
  const [totalEnemiesDefeated, setTotalEnemiesDefeated] = useState(0);
  const [currentEnemyHp, setCurrentEnemyHp] = useState(stage.enemyHp);
  
  // Refs
  const lastProcessedMeasure = useRef(0);
  const judgmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasJudgedCurrentChord = useRef(false);
  
  // モンスターID取得
  const monsterIds = getStageMonsterIds(stage.enemyCount);
  const currentMonsterId = monsterIds[totalEnemiesDefeated % monsterIds.length];
  
  // 表示オプション
  const displayOpts = useRef<DisplayOpts>({
    lang: noteNameLang,
    simple: simpleNoteName
  });
  
  // ===== コード解析・生成 =====
  
  // コード進行データの解析
  const progressionData = stage.chord_progression_data ? 
    (stage.chord_progression_data as ChordProgressionData) : null;
  
  // コード定義を生成
  const createChordDefinition = useCallback((chordId: string): ChordDefinition | null => {
    const chord = resolveChord(chordId);
    if (!chord) return null;
    
    // notesをMIDIノート番号に変換
    const midiNotes = chord.notes.map(noteName => {
      const parsed = parseNote(noteName);
      return parsed ? parsed.midi : 60;
    }).filter((n): n is number => n !== null);
    
    return {
      id: chordId,
      displayName: toDisplayChordName(chordId, displayOpts.current),
      notes: midiNotes,
      noteNames: chord.notes,
      quality: chord.quality || 'major',
      root: chord.root || chordId.charAt(0)
    };
  }, []);
  
  // ===== 判定ロジック =====
  
  // 現在演奏中のコードを判定
  const checkPlayedChord = useCallback((): ChordDefinition | null => {
    if (playedNotes.size === 0) return null;
    
    const sortedNotes = Array.from(playedNotes).sort((a, b) => a - b);
    
    // 許可されたコードから一致するものを探す
    const allowedChordDefs = stage.allowedChords
      .map(createChordDefinition)
      .filter((c): c is ChordDefinition => c !== null);
    
    for (const chordDef of allowedChordDefs) {
      const chordNotes = [...chordDef.notes].sort((a, b) => a - b);
      
      // 完全一致チェック
      if (sortedNotes.length === chordNotes.length &&
          sortedNotes.every((note, i) => note % 12 === chordNotes[i] % 12)) {
        return chordDef;
      }
    }
    
    return null;
  }, [playedNotes, stage.allowedChords, createChordDefinition]);
  
  // 判定処理
  const performJudgment = useCallback((now: number) => {
    if (hasJudgedCurrentChord.current) return;
    
    const playedChord = checkPlayedChord();
    if (!playedChord) return;
    
    const result = judge(now, playedChord);
    
    if (result === 'hit') {
      hasJudgedCurrentChord.current = true;
      onCorrectInput();
      
      // プレイヤー攻撃処理
      const damage = Math.floor(Math.random() * (stage.maxDamage - stage.minDamage + 1)) + stage.minDamage;
      onPlayerAttack(damage);
      
      // 敵HP更新
      const newHp = Math.max(0, currentEnemyHp - damage);
      setCurrentEnemyHp(newHp);
      
      if (newHp === 0) {
        // 敵撃破
        const newDefeated = totalEnemiesDefeated + 1;
        setTotalEnemiesDefeated(newDefeated);
        
        if (newDefeated >= stage.enemyCount) {
          // ゲームクリア
          onGameComplete();
        } else {
          // 次の敵
          setCurrentEnemyHp(stage.enemyHp);
          setEnrageLevel(0);
        }
      }
    }
  }, [checkPlayedChord, judge, hasJudgedCurrentChord, onCorrectInput, onPlayerAttack, 
      currentEnemyHp, totalEnemiesDefeated, stage, setEnrageLevel, onGameComplete]);
  
  // ===== ノーツ生成 =====
  
  // 次のコードを取得
  const getNextChord = useCallback((): ChordDefinition | null => {
    if (progressionData) {
      // プログレッションモード
      const chordData = progressionData.chords[progressionIndex];
      if (!chordData) return null;
      
      return createChordDefinition(chordData.chord);
    } else {
      // ランダムモード
      const randomIndex = Math.floor(Math.random() * stage.allowedChords.length);
      return createChordDefinition(stage.allowedChords[randomIndex]);
    }
  }, [progressionData, progressionIndex, stage.allowedChords, createChordDefinition]);
  
  // 小節の処理
  useEffect(() => {
    if (!startAt || isCountIn) return;
    
    // 新しい小節に入った時
    if (currentMeasure !== lastProcessedMeasure.current && currentBeat === 1) {
      lastProcessedMeasure.current = currentMeasure;
      
      // 次のコードを生成
      const nextChord = getNextChord();
      if (!nextChord) return;
      
      // ノーツの理想到達時刻を計算
      const msPerBeat = 60000 / bpm;
      const beatsFromStart = ((currentMeasure - 1) * stage.timeSignature) + (currentBeat - 1);
      const hitTime = startAt + 2000 + (beatsFromStart * msPerBeat); // Ready 2秒を考慮
      
      // ノーツを追加
      const note: RhythmNote = {
        id: `${currentMeasure}-${Date.now()}`,
        chord: nextChord,
        hitTime,
        measure: currentMeasure,
        beat: 1
      };
      
      addNote(note);
      
      // 判定ウィンドウを設定
      setTimeout(() => {
        setChord(nextChord, hitTime);
        hasJudgedCurrentChord.current = false;
        
        // 判定ウィンドウ終了時の処理
        judgmentTimeoutRef.current = setTimeout(() => {
          if (!hasJudgedCurrentChord.current) {
            // 失敗判定
            onWrongInput();
            onEnemyAttack(1);
            setPlayerHp(Math.max(0, playerHp - 1));
          }
          
          // プログレッションのインデックスを進める
          if (progressionData) {
            setProgressionIndex((prev) => 
              (prev + 1) % progressionData.chords.length
            );
          }
        }, 400); // ±200ms = 400ms window
      }, Math.max(0, hitTime - performance.now() - 200));
    }
  }, [currentMeasure, currentBeat, isCountIn, startAt, bpm, stage.timeSignature,
      getNextChord, addNote, setChord, progressionData, onWrongInput, onEnemyAttack,
      playerHp, setPlayerHp]);
  
  // ===== 入力処理 =====
  
  // MIDI入力
  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    if (!event.data || event.data.length < 3) return;
    const [status, note, velocity] = Array.from(event.data);

    const command = status & 0xf0;
    
    if (command === 0x90 && velocity > 0) {
      // Note On
      setPlayedNotes(prev => new Set(prev).add(note));
      performJudgment(performance.now());
    } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      // Note Off
      setPlayedNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(note);
        return newSet;
      });
    }
  }, [performJudgment]);
  
  // キーボード入力
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 簡易実装：キーボードからコード名を入力
    const key = e.key.toUpperCase();
    if (stage.allowedChords.includes(key)) {
      const chord = createChordDefinition(key);
      if (chord) {
        // 即座に判定
        const result = judge(performance.now(), chord);
        if (result === 'hit') {
          performJudgment(performance.now());
        }
      }
    }
  }, [stage.allowedChords, createChordDefinition, judge, performJudgment]);
  
  // MIDI接続
  useEffect(() => {
    if (!navigator.requestMIDIAccess) return;
    
    navigator.requestMIDIAccess().then(midiAccess => {
      midiAccess.inputs.forEach(input => {
        input.addEventListener('midimessage', handleMidiMessage as EventListener);
      });
      
      return () => {
        midiAccess.inputs.forEach(input => {
          input.removeEventListener('midimessage', handleMidiMessage as EventListener);
        });
      };
    });
  }, [handleMidiMessage]);
  
  // キーボードイベント
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      if (judgmentTimeoutRef.current) {
        clearTimeout(judgmentTimeoutRef.current);
      }
      resetRhythm();
      resetEnemy();
    };
  }, [resetRhythm, resetEnemy]);
  
  // 敵の怒りゲージ更新
  useEffect(() => {
    if (isCountIn || totalEnemiesDefeated >= stage.enemyCount) return;
    
    const interval = setInterval(() => {
      setEnrageLevel(prev => {
        const next = prev + (100 / stage.enemyGaugeSeconds / 10);
        if (next >= 100) {
          // 敵の攻撃
          onEnemyAttack(1);
          setPlayerHp(Math.max(0, playerHp - 1));
          return 0;
        }
        return next;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isCountIn, totalEnemiesDefeated, stage.enemyCount, stage.enemyGaugeSeconds,
      setEnrageLevel, onEnemyAttack, playerHp, setPlayerHp]);
  
  // エンジンの状態を公開
  return {
    playedNotes: Array.from(playedNotes),
    currentMonsterId,
    currentEnemyHp,
    totalEnemiesDefeated,
    enrageLevel,
    pendingNotes: pending
  };
};

export default RhythmGameEngine;
export type { RhythmEngineProps };