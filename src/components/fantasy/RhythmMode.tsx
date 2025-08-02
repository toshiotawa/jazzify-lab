/**
 * リズムモードコンポーネント
 * 太鼓の達人のような右から左に流れるUIで、タイミングに合わせてコードを演奏
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTimeStore } from '@/stores/timeStore';
import { devLog } from '@/utils/logger';
import { resolveChord } from '@/utils/chord-utils';
import { bgmManager } from '@/utils/BGMManager';
import type { DisplayOpts } from '@/utils/display-note';
import { 
  RhythmNote, 
  JudgmentWindow, 
  JUDGMENT_WINDOW_MS,
  ChordProgressionData
} from '@/types/rhythm';
import RhythmNotes from './RhythmNotes';
import RhythmJudgmentWindow from './RhythmJudgmentWindow';
import { note as parseNote } from 'tonal';

interface ChordDefinition {
  id: string;
  displayName: string;
  notes: number[];
  noteNames: string[];
  quality: string;
  root: string;
}

interface MonsterState {
  id: string;
  currentHp: number;
  maxHp: number;
  gauge: number;
  icon: string;
}

interface RhythmModeProps {
  stage: {
    maxHp: number;
    enemyCount: number;
    enemyHp: number;
    minDamage: number;
    maxDamage: number;
    monsterIcon?: string;
    allowedChords?: string[];
    chordProgressionData?: ChordProgressionData;
    bpm: number;
    timeSignature: number;
    measureCount: number;
    countInMeasures: number;
    mp3Url?: string;
  };
  onNoteOn: (note: number) => void;
  onNoteOff: (note: number) => void;
  onChordCorrect: (chord: ChordDefinition, isSpecial: boolean, damageDealt: number, defeated: boolean, monsterId: string) => void;
  onChordIncorrect: (expectedChord: ChordDefinition, inputNotes: number[]) => void;
  onEnemyAttack: (attackingMonsterId?: string) => void;
  onGameComplete: (result: 'clear' | 'gameover') => void;
  displayOpts?: DisplayOpts;
}

const RhythmMode: React.FC<RhythmModeProps> = ({
  stage,
  onNoteOn,
  onNoteOff,
  onChordCorrect,
  onChordIncorrect,
  onEnemyAttack,
  onGameComplete,
  displayOpts
}) => {
  // 時間管理
  const { 
    currentMeasure, 
    currentBeat, 
    isCountIn, 
    bpm, 
    timeSignature,
    setStart
  } = useTimeStore();

  // ゲーム状態
  const [notes, setNotes] = useState<RhythmNote[]>([]);
  const [judgmentWindows, setJudgmentWindows] = useState<JudgmentWindow[]>([]);
  const [inputNotes, setInputNotes] = useState<number[]>([]);
  const [playerHp, setPlayerHp] = useState(stage?.maxHp || 100);
  const [monster, setMonster] = useState<MonsterState | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [lastGeneratedMeasure, setLastGeneratedMeasure] = useState(0);

  // タイマー用のref
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  /**
   * コード定義を取得
   */
  const getChordDefinition = useCallback((chordId: string): ChordDefinition | null => {
    const resolved = resolveChord(chordId, 4, displayOpts);
    if (!resolved) {
      console.warn(`⚠️ 未定義のコード: ${chordId}`);
      return null;
    }

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
  }, [displayOpts]);

  /**
   * ゲームの初期化とBGM再生
   */
  useEffect(() => {
    if (!stage) return;
    
    // モンスターの初期化
    setMonster({
      id: 'rhythm_monster',
      currentHp: stage.enemyCount * stage.enemyHp,
      maxHp: stage.enemyCount * stage.enemyHp,
      gauge: 0,
      icon: stage.monsterIcon || 'ghost'
    });
    
    // 時間管理の初期化
    setStart(stage.bpm, stage.timeSignature, stage.measureCount, stage.countInMeasures);
    
    // BGMの再生
    if (stage.mp3Url) {
      bgmManager.play(stage.mp3Url, {
        bpm: stage.bpm,
        measureCount: stage.measureCount,
        countInMeasures: stage.countInMeasures
      });
    }
    
    return () => {
      // クリーンアップ時にBGMを停止
      bgmManager.stop();
    };
  }, [stage, setStart]);

  /**
   * ノーツの生成（ランダムパターン）
   */
  const generateRandomNote = useCallback((measure: number): RhythmNote | null => {
    if (!stage?.allowedChords?.length) return null;
    
    const chordId = stage.allowedChords[Math.floor(Math.random() * stage.allowedChords.length)];
    const noteId = `note_${measure}_${Date.now()}`;
    
    // 判定ラインに到達する時刻を計算
    const msPerBeat = 60000 / bpm;
    const msPerMeasure = msPerBeat * timeSignature;
    const targetTime = startTimeRef.current + (measure - 1) * msPerMeasure;
    
    return {
      id: noteId,
      chord: chordId,
      measure,
      beat: 1,
      position: 1, // 初期位置は画面右端
      judged: false,
      targetTime
    };
  }, [stage, bpm, timeSignature]);

  /**
   * ノーツの生成（プログレッションパターン）
   */
  const generateProgressionNote = useCallback((measure: number): RhythmNote | null => {
    if (!stage?.chordProgressionData) return null;
    
    const progressionData = stage.chordProgressionData as ChordProgressionData;
    const chordInfo = progressionData.chords.find(c => c.measure === measure);
    
    if (!chordInfo) return null;
    
    const noteId = `note_${measure}_${chordInfo.beat}_${Date.now()}`;
    
    // 判定ラインに到達する時刻を計算
    const msPerBeat = 60000 / bpm;
    const msPerMeasure = msPerBeat * timeSignature;
    const beatOffset = (chordInfo.beat - 1) * msPerBeat;
    const targetTime = startTimeRef.current + (measure - 1) * msPerMeasure + beatOffset;
    
    return {
      id: noteId,
      chord: chordInfo.chord,
      measure,
      beat: chordInfo.beat,
      position: 1,
      judged: false,
      targetTime
    };
  }, [stage, bpm, timeSignature]);

  /**
   * ノーツの生成管理
   */
  useEffect(() => {
    if (!stage || isCountIn || isGameOver) return;
    
    // 現在の小節のノーツがまだ生成されていない場合
    if (currentMeasure > lastGeneratedMeasure) {
      const newNote = stage.chordProgressionData 
        ? generateProgressionNote(currentMeasure)
        : generateRandomNote(currentMeasure);
      
      if (newNote) {
        setNotes(prev => [...prev, newNote]);
        
        // 判定ウィンドウも生成
        const window: JudgmentWindow = {
          startTime: newNote.targetTime - JUDGMENT_WINDOW_MS,
          endTime: newNote.targetTime + JUDGMENT_WINDOW_MS,
          chord: newNote.chord,
          noteId: newNote.id,
          judged: false
        };
        setJudgmentWindows(prev => [...prev, window]);
      }
      
      setLastGeneratedMeasure(currentMeasure);
    }
  }, [currentMeasure, isCountIn, isGameOver, stage, lastGeneratedMeasure, generateRandomNote, generateProgressionNote]);

  /**
   * ノート入力処理
   */
  const handleNoteInput = useCallback((note: number) => {
    setInputNotes(prev => [...prev, note]);
    onNoteOn(note);
  }, [onNoteOn]);

  const handleNoteRelease = useCallback((note: number) => {
    setInputNotes(prev => prev.filter(n => n !== note));
    onNoteOff(note);
  }, [onNoteOff]);

  /**
   * コード判定処理
   */
  const checkChordInput = useCallback(() => {
    const currentTime = performance.now();
    
    // 現在の判定ウィンドウを探す
    const activeWindow = judgmentWindows.find(w => 
      !w.judged && 
      currentTime >= w.startTime && 
      currentTime <= w.endTime
    );
    
    if (!activeWindow || inputNotes.length === 0) return;
    
    const chordDef = getChordDefinition(activeWindow.chord);
    if (!chordDef) return;
    
    // 入力されたノートがコードと一致するかチェック
    const sortedInput = [...inputNotes].sort();
    const sortedChord = [...chordDef.notes].sort();
    
    if (JSON.stringify(sortedInput) === JSON.stringify(sortedChord)) {
      // 判定成功
      devLog.debug('rhythm: 判定成功', { chord: activeWindow.chord, timing: currentTime - (activeWindow.startTime + JUDGMENT_WINDOW_MS) });
      
      // ウィンドウとノーツを判定済みにする
      setJudgmentWindows(prev => prev.map(w => 
        w.noteId === activeWindow.noteId ? { ...w, judged: true } : w
      ));
      setNotes(prev => prev.map(n => 
        n.id === activeWindow.noteId ? { ...n, judged: true } : n
      ));
      
      // モンスターにダメージ
      if (monster) {
        const damage = Math.floor(Math.random() * (stage.maxDamage - stage.minDamage + 1)) + stage.minDamage;
        const newHp = Math.max(0, monster.currentHp - damage);
        setMonster(prev => prev ? { ...prev, currentHp: newHp } : null);
        
        onChordCorrect(chordDef, false, damage, newHp === 0, monster.id);
        
        if (newHp === 0) {
          // ゲームクリア
          onGameComplete('clear');
          setIsGameOver(true);
        }
      }
      
      // 入力をクリア
      setInputNotes([]);
    }
  }, [inputNotes, judgmentWindows, getChordDefinition, monster, stage, onChordCorrect, onGameComplete]);

  /**
   * 判定チェック（毎フレーム）
   */
  useEffect(() => {
    checkChordInput();
  }, [inputNotes, checkChordInput]);

  /**
   * 判定失敗チェック
   */
  const checkMissedWindows = useCallback(() => {
    const currentTime = performance.now();
    
    judgmentWindows.forEach(window => {
      if (!window.judged && currentTime > window.endTime) {
        // 判定失敗
        devLog.debug('rhythm: 判定失敗', { chord: window.chord });
        
        // ウィンドウを判定済みにする
        setJudgmentWindows(prev => prev.map(w => 
          w.noteId === window.noteId ? { ...w, judged: true } : w
        ));
        
        // プレイヤーがダメージを受ける
        const damage = Math.floor(Math.random() * (stage.maxDamage - stage.minDamage + 1)) + stage.minDamage;
        setPlayerHp((prev: number) => {
          const newHp = Math.max(0, prev - damage);
          if (newHp === 0) {
            onGameComplete('gameover');
            setIsGameOver(true);
          }
          return newHp;
        });
        
        onEnemyAttack(monster?.id);
        
        const chordDef = getChordDefinition(window.chord);
        if (chordDef) {
          onChordIncorrect(chordDef, inputNotes);
        }
      }
    });
  }, [judgmentWindows, stage, monster, inputNotes, getChordDefinition, onEnemyAttack, onChordIncorrect, onGameComplete]);

  /**
   * アニメーションループ
   */
  useEffect(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
    }
    
    const animate = () => {
      checkMissedWindows();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [checkMissedWindows]);

  return (
    <div className="rhythm-mode">
      {/* HP表示 */}
      <div className="rhythm-hp-display">
        <div className="player-hp">
          <span>Player HP: {playerHp}/{stage?.maxHp || 100}</span>
          <div className="hp-bar">
            <div 
              className="hp-fill"
              style={{ width: `${(playerHp / (stage?.maxHp || 100)) * 100}%` }}
            />
          </div>
        </div>
        {monster && (
          <div className="monster-hp">
            <span>Monster HP: {monster.currentHp}/{monster.maxHp}</span>
            <div className="hp-bar">
              <div 
                className="hp-fill enemy"
                style={{ width: `${(monster.currentHp / monster.maxHp) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ノーツ表示 */}
      <RhythmNotes 
        notes={notes}
        bpm={bpm}
        timeSignature={timeSignature}
        displayOpts={displayOpts}
      />

      {/* 判定ウィンドウ（見えない） */}
      <RhythmJudgmentWindow
        windows={judgmentWindows}
        onNoteInput={handleNoteInput}
        onNoteRelease={handleNoteRelease}
      />

      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="rhythm-debug">
          <div>M{currentMeasure} B{currentBeat}</div>
          <div>Input: {inputNotes.join(', ')}</div>
          <div>Active Windows: {judgmentWindows.filter(w => !w.judged).length}</div>
        </div>
      )}
    </div>
  );
};

export default RhythmMode;