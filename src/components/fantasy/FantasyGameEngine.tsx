/**
 * ファンタジーゲームエンジン
 * コード判定・ゲームロジックを管理
 */

import { useState, useCallback, useEffect } from 'react';
import { devLog } from '@/utils/logger';
import { getMidiNoteName } from '@/utils/chordUtils';

// ===== 型定義 =====

interface ChordDefinition {
  id: string;           // "CM7"
  displayName: string;  // "CM7"
  notes: number[];      // [60, 64, 67, 71]
  noteNames: string[];  // ["ド", "ミ", "ソ", "シ"]
  quality: string;      // "M7"
  root: string;        // "C"
}

interface FantasyStage {
  id: string;
  stageNumber: string;
  name: string;
  description: string;
  maxHp: number;
  questionCount: number;
  enemyGaugeSeconds: number;
  mode: 'single' | 'progression';
  allowedChords: string[];
  chordProgression?: string[];
  showSheetMusic: boolean;
  showGuide: boolean; // ガイド表示設定を追加
  monsterIcon: string;
  bgmUrl?: string;
}

interface FantasyGameState {
  currentStage: FantasyStage | null;
  currentQuestionIndex: number;
  currentChordTarget: ChordDefinition | null;
  playerHp: number;
  enemyGauge: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  isGameActive: boolean;
  isGameOver: boolean;
  gameResult: 'clear' | 'gameover' | null;
  // 複数敵システム用
  currentEnemyIndex: number;
  currentEnemyHits: number;
  enemiesDefeated: number;
  totalEnemies: number;
  // 敵のHP管理を追加
  currentEnemyHp: number;
  maxEnemyHp: number;
}

interface FantasyGameEngineProps {
  stage: FantasyStage | null;
  onGameStateChange: (state: FantasyGameState) => void;
  onChordCorrect: (chord: ChordDefinition) => void;
  onChordIncorrect: (expectedChord: ChordDefinition, inputNotes: number[]) => void;
  onGameComplete: (result: 'clear' | 'gameover', finalState: FantasyGameState) => void;
  onEnemyAttack: () => void;
}

// ===== コード定義データ =====

// ヘルパー関数：MIDIノート配列から音名配列を生成
const createNoteNames = (notes: number[]): string[] => {
  return notes.map(note => getMidiNoteName(note));
};

// ヘルパー関数：コード定義を作成
const createChord = (id: string, displayName: string, notes: number[], quality: string, root: string): ChordDefinition => {
  return {
    id,
    displayName,
    notes,
    noteNames: createNoteNames(notes),
    quality,
    root
  };
};

const CHORD_DEFINITIONS: Record<string, ChordDefinition> = {
  // メジャートライアド
  'C': createChord('C', 'C', [60, 64, 67], 'major', 'C'),
  'F': createChord('F', 'F', [65, 69, 72], 'major', 'F'),
  'G': createChord('G', 'G', [67, 71, 74], 'major', 'G'),
  
  // マイナートライアド
  'Am': createChord('Am', 'Am', [57, 60, 64], 'minor', 'A'),
  'Dm': createChord('Dm', 'Dm', [62, 65, 69], 'minor', 'D'),
  'Em': createChord('Em', 'Em', [64, 67, 71], 'minor', 'E'),
  
  // ドミナント7th
  'G7': createChord('G7', 'G7', [67, 71, 74, 77], 'dominant7', 'G'),
  'C7': createChord('C7', 'C7', [60, 64, 67, 70], 'dominant7', 'C'),
  'F7': createChord('F7', 'F7', [65, 69, 72, 75], 'dominant7', 'F'),
  
  // マイナー7th
  'Am7': createChord('Am7', 'Am7', [57, 60, 64, 67], 'minor7', 'A'),
  'Dm7': createChord('Dm7', 'Dm7', [62, 65, 69, 72], 'minor7', 'D'),
  'Em7': createChord('Em7', 'Em7', [64, 67, 71, 74], 'minor7', 'E'),
  
  // メジャー7th
  'CM7': createChord('CM7', 'CM7', [60, 64, 67, 71], 'major7', 'C'),
  'FM7': createChord('FM7', 'FM7', [65, 69, 72, 76], 'major7', 'F'),
  'GM7': createChord('GM7', 'GM7', [67, 71, 74, 78], 'major7', 'G'),
  
  // テンション系
  'C6': createChord('C6', 'C6', [60, 64, 67, 69], 'major6', 'C'),
  'Cm6': createChord('Cm6', 'Cm6', [60, 63, 67, 69], 'minor6', 'C'),
  'C9': createChord('C9', 'C9', [60, 64, 67, 70, 74], 'dominant9', 'C'),
  'Cm9': createChord('Cm9', 'Cm9', [60, 63, 67, 70, 74], 'minor9', 'C'),
  'C11': createChord('C11', 'C11', [60, 64, 67, 70, 74, 77], 'dominant11', 'C'),
  'C13': createChord('C13', 'C13', [60, 64, 67, 70, 74, 81], 'dominant13', 'C'),
  
  // 追加のドミナント7th
  'B7': createChord('B7', 'B7', [71, 75, 78, 81], 'dominant7', 'B'),
  'E7': createChord('E7', 'E7', [64, 68, 71, 74], 'dominant7', 'E'),
  'A7': createChord('A7', 'A7', [69, 73, 76, 79], 'dominant7', 'A'),
  'D7': createChord('D7', 'D7', [62, 66, 69, 72], 'dominant7', 'D'),
  
  // === 黒鍵ルートのコード (シャープ系) ===
  // C#メジャー系
  'C#': createChord('C#', 'C#', [61, 65, 68], 'major', 'C#'),
  'C#m': createChord('C#m', 'C#m', [61, 64, 68], 'minor', 'C#'),
  'C#7': createChord('C#7', 'C#7', [61, 65, 68, 71], 'dominant7', 'C#'),
  'C#m7': createChord('C#m7', 'C#m7', [61, 64, 68, 71], 'minor7', 'C#'),
  'C#M7': createChord('C#M7', 'C#M7', [61, 65, 68, 72], 'major7', 'C#'),
  
  // D#メジャー系  
  'D#': createChord('D#', 'D#', [63, 67, 70], 'major', 'D#'),
  'D#m': createChord('D#m', 'D#m', [63, 66, 70], 'minor', 'D#'),
  'D#7': createChord('D#7', 'D#7', [63, 67, 70, 73], 'dominant7', 'D#'),
  'D#m7': createChord('D#m7', 'D#m7', [63, 66, 70, 73], 'minor7', 'D#'),
  
  // F#メジャー系
  'F#': createChord('F#', 'F#', [66, 70, 73], 'major', 'F#'),
  'F#m': createChord('F#m', 'F#m', [66, 69, 73], 'minor', 'F#'),
  'F#7': createChord('F#7', 'F#7', [66, 70, 73, 76], 'dominant7', 'F#'),
  'F#m7': createChord('F#m7', 'F#m7', [66, 69, 73, 76], 'minor7', 'F#'),
  'F#M7': createChord('F#M7', 'F#M7', [66, 70, 73, 77], 'major7', 'F#'),
  
  // G#メジャー系
  'G#': createChord('G#', 'G#', [68, 72, 75], 'major', 'G#'),
  'G#m': createChord('G#m', 'G#m', [68, 71, 75], 'minor', 'G#'),
  'G#7': createChord('G#7', 'G#7', [68, 72, 75, 78], 'dominant7', 'G#'),
  'G#m7': createChord('G#m7', 'G#m7', [68, 71, 75, 78], 'minor7', 'G#'),
  
  // A#メジャー系
  'A#': createChord('A#', 'A#', [70, 74, 77], 'major', 'A#'),
  'A#m': createChord('A#m', 'A#m', [70, 73, 77], 'minor', 'A#'),
  'A#7': createChord('A#7', 'A#7', [70, 74, 77, 80], 'dominant7', 'A#'),
  'A#m7': createChord('A#m7', 'A#m7', [70, 73, 77, 80], 'minor7', 'A#'),
  
  // === 黒鍵ルートのコード (フラット系) ===
  // Dbメジャー系
  'Db': createChord('Db', 'Db', [61, 65, 68], 'major', 'Db'),
  'Dbm': createChord('Dbm', 'Dbm', [61, 64, 68], 'minor', 'Db'),
  'Db7': createChord('Db7', 'Db7', [61, 65, 68, 71], 'dominant7', 'Db'),
  'DbM7': createChord('DbM7', 'DbM7', [61, 65, 68, 72], 'major7', 'Db'),
  
  // Ebメジャー系
  'Eb': createChord('Eb', 'Eb', [63, 67, 70], 'major', 'Eb'),
  'Ebm': createChord('Ebm', 'Ebm', [63, 66, 70], 'minor', 'Eb'),
  'Eb7': createChord('Eb7', 'Eb7', [63, 67, 70, 73], 'dominant7', 'Eb'),
  'EbM7': createChord('EbM7', 'EbM7', [63, 67, 70, 74], 'major7', 'Eb'),
  
  // Gbメジャー系
  'Gb': createChord('Gb', 'Gb', [66, 70, 73], 'major', 'Gb'),
  'Gbm': createChord('Gbm', 'Gbm', [66, 69, 73], 'minor', 'Gb'),
  'Gb7': createChord('Gb7', 'Gb7', [66, 70, 73, 76], 'dominant7', 'Gb'),
  'GbM7': createChord('GbM7', 'GbM7', [66, 70, 73, 77], 'major7', 'Gb'),
  
  // Abメジャー系
  'Ab': createChord('Ab', 'Ab', [68, 72, 75], 'major', 'Ab'),
  'Abm': createChord('Abm', 'Abm', [68, 71, 75], 'minor', 'Ab'),
  'Ab7': createChord('Ab7', 'Ab7', [68, 72, 75, 78], 'dominant7', 'Ab'),
  'AbM7': createChord('AbM7', 'AbM7', [68, 72, 75, 79], 'major7', 'Ab'),
  
  // Bbメジャー系
  'Bb': createChord('Bb', 'Bb', [70, 74, 77], 'major', 'Bb'),
  'Bbm': createChord('Bbm', 'Bbm', [70, 73, 77], 'minor', 'Bb'),
  'Bb7': createChord('Bb7', 'Bb7', [70, 74, 77, 80], 'dominant7', 'Bb'),
  'BbM7': createChord('BbM7', 'BbM7', [70, 74, 77, 81], 'major7', 'Bb')
};

// ===== 敵リスト定義 =====

const ENEMY_LIST = [
  { id: 'vampire', icon: 'vampire', name: 'ドラキュラ' },
  { id: 'monster', icon: 'monster', name: '怪獣' },
  { id: 'reaper', icon: 'reaper', name: '死神' },
  { id: 'kraken', icon: 'kraken', name: 'クラーケン' },
  { id: 'werewolf', icon: 'werewolf', name: '狼男' },
  { id: 'demon', icon: 'demon', name: '魔王' }
];

// ===== ヘルパー関数 =====

/**
 * コード判定関数
 * 構成音が全て押されていれば正解（順番・オクターブ不問、転回形も正解、余分な音があっても構成音が含まれていれば正解）
 */
const checkChordMatch = (inputNotes: number[], targetChord: ChordDefinition): boolean => {
  if (inputNotes.length === 0) {
    devLog.debug('❌ コード判定: 入力音なし');
    return false;
  }
  
  // 入力された音をノート番号のmod 12で正規化（オクターブ無視）
  const inputNotesMod12 = [...new Set(inputNotes.map(note => note % 12))]; // 重複除去も追加
  const targetNotesMod12 = [...new Set(targetChord.notes.map(note => note % 12))]; // 重複除去も追加
  
  // ターゲットコードの全ての音が入力に含まれているかチェック
  const hasAllTargetNotes = targetNotesMod12.every(targetNote => 
    inputNotesMod12.includes(targetNote)
  );
  
  // より詳細なログ出力
  devLog.debug(`🎵 コード判定詳細:`, {
    targetChord: targetChord.displayName,
    targetNotes: targetChord.notes,
    targetMod12: targetNotesMod12,
    targetMod12Names: targetNotesMod12.map(note => {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return noteNames[note];
    }),
    inputNotes: inputNotes,
    inputMod12: inputNotesMod12,
    inputMod12Names: inputNotesMod12.map(note => {
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return noteNames[note];
    }),
    hasAllTargetNotes,
    matchDetails: targetNotesMod12.map(targetNote => ({
      note: targetNote,
      noteName: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][targetNote],
      found: inputNotesMod12.includes(targetNote)
    }))
  });
  
  return hasAllTargetNotes;
};

/**
 * ランダムコード選択（allowedChordsから）
 */
const selectRandomChord = (allowedChords: string[]): ChordDefinition | null => {
  const availableChords = allowedChords
    .map(chordId => CHORD_DEFINITIONS[chordId])
    .filter(Boolean);
    
  if (availableChords.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * availableChords.length);
  return availableChords[randomIndex];
};

/**
 * コード進行から次のコードを取得
 */
const getProgressionChord = (progression: string[], questionIndex: number): ChordDefinition | null => {
  if (progression.length === 0) return null;
  
  const chordId = progression[questionIndex % progression.length];
  return CHORD_DEFINITIONS[chordId] || null;
};

/**
 * 現在の敵情報を取得
 */
const getCurrentEnemy = (enemyIndex: number) => {
  if (enemyIndex >= 0 && enemyIndex < ENEMY_LIST.length) {
    return ENEMY_LIST[enemyIndex];
  }
  return ENEMY_LIST[0]; // フォールバック
};

// ===== メインコンポーネント =====

export const useFantasyGameEngine = ({
  stage,
  onGameStateChange,
  onChordCorrect,
  onChordIncorrect,
  onGameComplete,
  onEnemyAttack
}: FantasyGameEngineProps) => {
  
  const [gameState, setGameState] = useState<FantasyGameState>({
    currentStage: null,
    currentQuestionIndex: 0,
    currentChordTarget: null,
    playerHp: 5,
    enemyGauge: 0,
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    isGameActive: false,
    isGameOver: false,
    gameResult: null,
    // 複数敵システム用
    currentEnemyIndex: 0,
    currentEnemyHits: 0,
    enemiesDefeated: 0,
    totalEnemies: 5,
    // 敵のHP管理を追加
    currentEnemyHp: 5,
    maxEnemyHp: 5
  });
  
  const [enemyGaugeTimer, setEnemyGaugeTimer] = useState<NodeJS.Timeout | null>(null);
  const [inputBuffer, setInputBuffer] = useState<number[]>([]);
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // ゲーム初期化
  const initializeGame = useCallback(() => {
    devLog.debug('🎮 ゲーム初期化開始:', stage);
    
    if (!stage) {
      devLog.debug('❌ ステージ情報がありません');
      return;
    }
    
    const firstChord = stage.mode === 'single' 
      ? selectRandomChord(stage.allowedChords)
      : getProgressionChord(stage.chordProgression || [], 0);
    
    devLog.debug('🎯 最初のコード選択:', {
      mode: stage.mode,
      allowedChords: stage.allowedChords,
      chordProgression: stage.chordProgression,
      selectedChord: firstChord
    });
    
    if (!firstChord) {
      devLog.debug('❌ 最初のコードを選択できませんでした');
      return;
    }
    
    const newState: FantasyGameState = {
      currentStage: stage,
      currentQuestionIndex: 0,
      currentChordTarget: firstChord,
      playerHp: stage.maxHp,
      enemyGauge: 0,
      score: 0,
      totalQuestions: stage.questionCount,
      correctAnswers: 0,
      isGameActive: true,
      isGameOver: false,
      gameResult: null,
      // 複数敵システム用
      currentEnemyIndex: 0,
      currentEnemyHits: 0,
      enemiesDefeated: 0,
      totalEnemies: 5,
      // 敵のHP管理を追加
      currentEnemyHp: 5,
      maxEnemyHp: 5
    };
    
    setGameState(newState);
    setInputBuffer([]);
    onGameStateChange(newState);
    
    devLog.debug('✅ ファンタジーゲーム初期化完了:', newState);
  }, [stage, onGameStateChange]);
  
  // 次の問題への移行（回答数ベース、ループ対応）
  const proceedToNextQuestion = useCallback(() => {
    setGameState(prevState => {
      const nextCorrectAnswers = prevState.correctAnswers;
      const isComplete = nextCorrectAnswers >= prevState.totalQuestions; // 回答数でクリア判定
      
      if (isComplete) {
        // ゲームクリア
        const finalState = {
          ...prevState,
          isGameActive: false,
          isGameOver: true,
          gameResult: 'clear' as const
        };
        
        onGameComplete('clear', finalState);
        return finalState;
      } else {
        // 次の問題（ループ対応）
        let nextChord;
        if (prevState.currentStage?.mode === 'single') {
          // ランダムモード：そのまま
          nextChord = selectRandomChord(prevState.currentStage.allowedChords);
        } else {
          // コード進行モード：ループさせる
          const progression = prevState.currentStage?.chordProgression || [];
          const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
          nextChord = getProgressionChord(progression, nextIndex);
        }
        
        const nextState = {
          ...prevState,
          currentQuestionIndex: (prevState.currentQuestionIndex + 1) % (prevState.currentStage?.chordProgression?.length || 1),
          currentChordTarget: nextChord,
          enemyGauge: 0 // ゲージリセット
        };
        
        onGameStateChange(nextState);
        return nextState;
      }
    });
  }, [onGameStateChange, onGameComplete]);
  
  // 敵の攻撃処理
  const handleEnemyAttack = useCallback(() => {
    // 攻撃時に入力バッファをリセット
    setInputBuffer([]);
    if (inputTimeout) {
      clearTimeout(inputTimeout);
      setInputTimeout(null);
    }
    
    setGameState(prevState => {
      const newHp = Math.max(0, prevState.playerHp - 1); // 確実に1減らす
      
      devLog.debug('💥 敵の攻撃！HP更新:', {
        oldHp: prevState.playerHp,
        newHp: newHp,
        damage: 1
      });
      
      const isGameOver = newHp <= 0;
      
      if (isGameOver) {
        const finalState = {
          ...prevState,
          playerHp: 0,
          isGameActive: false,
          isGameOver: true,
          gameResult: 'gameover' as const
        };
        
        // ゲームオーバーコールバックを安全に呼び出し
        setTimeout(() => {
          try {
            onGameComplete('gameover', finalState);
          } catch (error) {
            devLog.debug('❌ ゲームオーバーコールバックエラー:', error);
          }
        }, 100);
        
        return finalState;
      } else {
        // HP減少して次の問題へ（回答数ベース、ループ対応）
        const isComplete = prevState.correctAnswers >= prevState.totalQuestions;
        
        if (isComplete) {
          // 必要な回答数に到達済みでHP残りありならクリア
          const finalState = {
            ...prevState,
            playerHp: newHp,
            isGameActive: false,
            isGameOver: true,
            gameResult: 'clear' as const
          };
          
          // クリアコールバックを安全に呼び出し
          setTimeout(() => {
            try {
              onGameComplete('clear', finalState);
            } catch (error) {
              devLog.debug('❌ クリアコールバックエラー:', error);
            }
          }, 100);
          
          return finalState;
        } else {
          // 次の問題（ループ対応）
          let nextChord;
          if (prevState.currentStage?.mode === 'single') {
            // ランダムモード：そのまま
            nextChord = selectRandomChord(prevState.currentStage.allowedChords);
          } else {
            // コード進行モード：ループさせる
            const progression = prevState.currentStage?.chordProgression || [];
            const nextIndex = (prevState.currentQuestionIndex + 1) % progression.length;
            nextChord = getProgressionChord(progression, nextIndex);
          }
          
          const nextState = {
            ...prevState,
            playerHp: newHp,
            currentQuestionIndex: (prevState.currentQuestionIndex + 1) % (prevState.currentStage?.chordProgression?.length || 1),
            currentChordTarget: nextChord,
            enemyGauge: 0
          };
          
          onGameStateChange(nextState);
          return nextState;
        }
      }
    });
    
    onEnemyAttack();
  }, [onGameStateChange, onGameComplete, onEnemyAttack, inputTimeout]);
  
  // ゲージタイマーの管理
  useEffect(() => {
    devLog.debug('🎮 ゲージタイマー状態チェック:', { 
      isGameActive: gameState.isGameActive, 
      hasTimer: !!enemyGaugeTimer,
      currentStage: gameState.currentStage?.stageNumber
    });
    
    // 既存のタイマーをクリア
    if (enemyGaugeTimer) {
      clearInterval(enemyGaugeTimer);
      setEnemyGaugeTimer(null);
    }
    
    // ゲームがアクティブな場合のみ新しいタイマーを開始
    if (gameState.isGameActive && gameState.currentStage) {
      devLog.debug('⏰ 敵ゲージタイマー開始');
      const timer = setInterval(() => {
        updateEnemyGauge();
      }, 100); // 100ms間隔で更新
      setEnemyGaugeTimer(timer);
    }
    
    // クリーンアップ
    return () => {
      if (enemyGaugeTimer) {
        clearInterval(enemyGaugeTimer);
      }
    };
  }, [gameState.isGameActive, gameState.currentStage]); // ゲーム状態とステージの変更を監視
  
  // 敵ゲージの更新
  const updateEnemyGauge = useCallback(() => {
    setGameState(prevState => {
      if (!prevState.isGameActive || !prevState.currentStage) {
        devLog.debug('⏰ ゲージ更新スキップ: ゲーム非アクティブ');
        return prevState;
      }
      
      const incrementRate = 100 / (prevState.currentStage.enemyGaugeSeconds * 10); // 100ms間隔で更新
      const newGauge = prevState.enemyGauge + incrementRate;
      
      devLog.debug('⚡ ゲージ更新:', { 
        currentGauge: prevState.enemyGauge.toFixed(1), 
        newGauge: newGauge.toFixed(1), 
        incrementRate: incrementRate.toFixed(2),
        enemyGaugeSeconds: prevState.currentStage.enemyGaugeSeconds
      });
      
      if (newGauge >= 100) {
        // ゲージ満タン -> 敵の攻撃
        devLog.debug('💥 敵ゲージ満タン！攻撃開始');
        // 攻撃処理を非同期で実行し、ここではゲージをリセット
        setTimeout(() => handleEnemyAttack(), 0);
        const nextState = { ...prevState, enemyGauge: 0 }; // ゲージをリセット
        onGameStateChange(nextState);
        return nextState;
      } else {
        const nextState = { ...prevState, enemyGauge: newGauge };
        onGameStateChange(nextState);
        return nextState;
      }
    });
  }, [handleEnemyAttack, onGameStateChange]);
  
  // ノート入力処理
  const handleNoteInput = useCallback((note: number) => {
    if (!gameState.isGameActive || !gameState.currentChordTarget) return;
    
    devLog.debug('🎵 ノート入力受信:', { note, currentChord: gameState.currentChordTarget.displayName });
    
    // 入力バッファに追加
    setInputBuffer(prevBuffer => {
      const newBuffer = [...prevBuffer, note];
      devLog.debug('🎵 入力バッファ更新:', { newBuffer, bufferSize: newBuffer.length });
      
      // 入力タイムアウトをリセット
      if (inputTimeout) {
        clearTimeout(inputTimeout);
      }
      
      // 自動判定タイマー（500msに延長 - 和音が完成するまで待機）
      const timeout = setTimeout(() => {
        devLog.debug('⏰ 自動判定タイマー発動');
        checkCurrentInput(newBuffer);
        // 正解の場合のみバッファをクリア（checkCurrentInput内で処理）
      }, 500);
      
      setInputTimeout(timeout);
      
      // 即座に判定も試行（構成音数が満たされた場合）
      if (gameState.currentChordTarget && newBuffer.length >= gameState.currentChordTarget.notes.length) {
        devLog.debug('🎯 構成音数達成 - 即座に判定');
        setTimeout(() => {
          clearTimeout(timeout);
          const isCorrectImmediate = checkChordMatch(newBuffer, gameState.currentChordTarget!);
          if (isCorrectImmediate) {
            checkCurrentInput(newBuffer);
            setInputBuffer([]);
          }
          // 不正解の場合は何もせず、音の積み重ねを継続
        }, 100);
      }
      
      return newBuffer;
    });
  }, [gameState.isGameActive, gameState.currentChordTarget, inputTimeout]);
  
  // 現在の入力を判定
  const checkCurrentInput = useCallback((notes: number[]) => {
    if (!gameState.currentChordTarget || notes.length === 0) {
      devLog.debug('❌ 判定スキップ: コードなしまたは入力なし', { hasChord: !!gameState.currentChordTarget, inputCount: notes.length });
      return;
    }
    
    devLog.debug('🎯 コード判定実行中...', { 
      targetChord: gameState.currentChordTarget.displayName,
      inputNotes: notes,
      inputCount: notes.length 
    });
    
    const isCorrect = checkChordMatch(notes, gameState.currentChordTarget);
    
    if (isCorrect) {
      devLog.debug('✅ 正解判定!', { chord: gameState.currentChordTarget.displayName });
      
      // 正解
      onChordCorrect(gameState.currentChordTarget);
      
      setGameState(prevState => {
        const newHits = prevState.currentEnemyHits + 1;
        const newEnemyHp = Math.max(0, prevState.currentEnemyHp - 1); // 敵のHPを1減らす
        
        let nextState = {
          ...prevState,
          correctAnswers: prevState.correctAnswers + 1,
          score: prevState.score + 1000,
          enemyGauge: 0, // ゲージをリセット
          currentEnemyHits: newHits,
          currentEnemyHp: newEnemyHp
        };
        
        devLog.debug('⚔️ 敵にダメージ:', {
          oldHp: prevState.currentEnemyHp,
          newHp: newEnemyHp,
          hits: newHits
        });
        
        // 敵を倒したか判定（HPが0になったら倒れる）
        if (newEnemyHp <= 0) {
          const newEnemiesDefeated = prevState.enemiesDefeated + 1;
          const nextEnemyIndex = prevState.currentEnemyIndex + 1;
          
          // 全ての敵を倒したかチェック
          if (newEnemiesDefeated >= prevState.totalEnemies) {
            // ゲームクリア
            nextState = {
              ...nextState,
              enemiesDefeated: newEnemiesDefeated,
              isGameActive: false,
              isGameOver: true,
              gameResult: 'clear'
            };
            
            devLog.debug('🎉 全ての敵を倒してゲームクリア!', { enemiesDefeated: newEnemiesDefeated });
            
            // ゲーム完了コールバックを安全に呼び出し
            setTimeout(() => {
              try {
                onGameComplete('clear', nextState);
              } catch (error) {
                devLog.debug('❌ ゲーム完了コールバックエラー:', error);
              }
            }, 200);
          } else {
            // 次の敵に交代
            nextState = {
              ...nextState,
              currentEnemyIndex: nextEnemyIndex,
              currentEnemyHits: 0,
              enemiesDefeated: newEnemiesDefeated,
              currentEnemyHp: prevState.maxEnemyHp, // 新しい敵のHPをフル回復
            };
            
            devLog.debug('👹 敵を倒した！次の敵が出現:', { 
              defeatedEnemies: newEnemiesDefeated,
              nextEnemyIndex,
              nextEnemy: ENEMY_LIST[nextEnemyIndex]?.name,
              newEnemyHp: prevState.maxEnemyHp
            });
          }
        }
        
        onGameStateChange(nextState);
        return nextState;
      });
      
      // 入力バッファをクリア
      setInputBuffer([]);
      
      // 次の問題へ（待機時間を 0 に変更）
      setTimeout(proceedToNextQuestion, 0);
      
    } else {
      devLog.debug('🎵 まだ構成音が足りません', { 
        targetChord: gameState.currentChordTarget.displayName,
        inputNotes: notes,
        message: '音を追加してください'
      });
      
      // 不正解の概念を削除し、単純に何もしない（音の積み重ねを続行）
      // onChordIncorrect(gameState.currentChordTarget, notes);
    }
  }, [gameState.currentChordTarget, onChordCorrect, onChordIncorrect, onGameStateChange, proceedToNextQuestion]);
  
  // 手動で現在の入力を判定（削除予定 - 自動判定のみ使用）
  // const submitCurrentInput = useCallback(() => {
  //   if (inputTimeout) {
  //     clearTimeout(inputTimeout);
  //     setInputTimeout(null);
  //   }
  //   
  //   checkCurrentInput(inputBuffer);
  //   setInputBuffer([]);
  // }, [inputTimeout, checkCurrentInput, inputBuffer]);
  
  // ゲーム停止
  const stopGame = useCallback(() => {
    setGameState(prevState => ({
      ...prevState,
      isGameActive: false
    }));
    
    if (enemyGaugeTimer) {
      clearInterval(enemyGaugeTimer);
      setEnemyGaugeTimer(null);
    }
    
    if (inputTimeout) {
      clearTimeout(inputTimeout);
      setInputTimeout(null);
    }
    
    setInputBuffer([]);
  }, [enemyGaugeTimer, inputTimeout]);
  
  // ステージ変更時の初期化
  useEffect(() => {
    if (stage) {
      initializeGame();
    }
  }, [stage, initializeGame]);
  
  // コンポーネント破棄時のクリーンアップ
  useEffect(() => {
    return () => {
      if (enemyGaugeTimer) {
        devLog.debug('⏰ 敵ゲージタイマー クリーンアップで停止');
        clearInterval(enemyGaugeTimer);
      }
      if (inputTimeout) {
        devLog.debug('⏰ 入力タイムアウト クリーンアップで停止');
        clearTimeout(inputTimeout);
      }
    };
  }, []);
  
  return {
    gameState,
    inputBuffer,
    handleNoteInput,
    initializeGame,
    stopGame,
    
    // ヘルパー関数もエクスポート
    checkChordMatch,
    selectRandomChord,
    getProgressionChord,
    getCurrentEnemy,
    CHORD_DEFINITIONS,
    ENEMY_LIST
  };
};

export type { ChordDefinition, FantasyStage, FantasyGameState, FantasyGameEngineProps };
export { CHORD_DEFINITIONS, ENEMY_LIST, getCurrentEnemy };