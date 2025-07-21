/**
 * ファンタジーゲームエンジン
 * コード判定・ゲームロジックを管理
 */

import { useState, useCallback, useEffect } from 'react';
import { devLog } from '@/utils/logger';

// ===== 型定義 =====

interface ChordDefinition {
  id: string;           // "CM7"
  displayName: string;  // "CM7"
  notes: number[];      // [60, 64, 67, 71]
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

const CHORD_DEFINITIONS: Record<string, ChordDefinition> = {
  // メジャートライアド
  'C': { id: 'C', displayName: 'C', notes: [60, 64, 67], quality: 'major', root: 'C' },
  'F': { id: 'F', displayName: 'F', notes: [65, 69, 72], quality: 'major', root: 'F' },
  'G': { id: 'G', displayName: 'G', notes: [67, 71, 74], quality: 'major', root: 'G' },
  
  // マイナートライアド
  'Am': { id: 'Am', displayName: 'Am', notes: [57, 60, 64], quality: 'minor', root: 'A' },
  'Dm': { id: 'Dm', displayName: 'Dm', notes: [62, 65, 69], quality: 'minor', root: 'D' },
  'Em': { id: 'Em', displayName: 'Em', notes: [64, 67, 71], quality: 'minor', root: 'E' },
  
  // ドミナント7th
  'G7': { id: 'G7', displayName: 'G7', notes: [67, 71, 74, 77], quality: 'dominant7', root: 'G' },
  'C7': { id: 'C7', displayName: 'C7', notes: [60, 64, 67, 70], quality: 'dominant7', root: 'C' },
  'F7': { id: 'F7', displayName: 'F7', notes: [65, 69, 72, 75], quality: 'dominant7', root: 'F' },
  
  // マイナー7th
  'Am7': { id: 'Am7', displayName: 'Am7', notes: [57, 60, 64, 67], quality: 'minor7', root: 'A' },
  'Dm7': { id: 'Dm7', displayName: 'Dm7', notes: [62, 65, 69, 72], quality: 'minor7', root: 'D' },
  'Em7': { id: 'Em7', displayName: 'Em7', notes: [64, 67, 71, 74], quality: 'minor7', root: 'E' },
  
  // メジャー7th
  'CM7': { id: 'CM7', displayName: 'CM7', notes: [60, 64, 67, 71], quality: 'major7', root: 'C' },
  'FM7': { id: 'FM7', displayName: 'FM7', notes: [65, 69, 72, 76], quality: 'major7', root: 'F' },
  'GM7': { id: 'GM7', displayName: 'GM7', notes: [67, 71, 74, 78], quality: 'major7', root: 'G' },
  
  // テンション系
  'C6': { id: 'C6', displayName: 'C6', notes: [60, 64, 67, 69], quality: 'major6', root: 'C' },
  'Cm6': { id: 'Cm6', displayName: 'Cm6', notes: [60, 63, 67, 69], quality: 'minor6', root: 'C' },
  'C9': { id: 'C9', displayName: 'C9', notes: [60, 64, 67, 70, 74], quality: 'dominant9', root: 'C' },
  'Cm9': { id: 'Cm9', displayName: 'Cm9', notes: [60, 63, 67, 70, 74], quality: 'minor9', root: 'C' },
  'C11': { id: 'C11', displayName: 'C11', notes: [60, 64, 67, 70, 74, 77], quality: 'dominant11', root: 'C' },
  'C13': { id: 'C13', displayName: 'C13', notes: [60, 64, 67, 70, 74, 81], quality: 'dominant13', root: 'C' },
  
  // 追加のドミナント7th
  'B7': { id: 'B7', displayName: 'B7', notes: [71, 75, 78, 81], quality: 'dominant7', root: 'B' },
  'E7': { id: 'E7', displayName: 'E7', notes: [64, 68, 71, 74], quality: 'dominant7', root: 'E' },
  'A7': { id: 'A7', displayName: 'A7', notes: [69, 73, 76, 79], quality: 'dominant7', root: 'A' },
  'D7': { id: 'D7', displayName: 'D7', notes: [62, 66, 69, 72], quality: 'dominant7', root: 'D' }
};

// ===== ヘルパー関数 =====

/**
 * コード判定関数
 * 構成音が全て押されていれば正解（順番・オクターブ不問、転回形も正解、余分な音があっても構成音が含まれていれば正解）
 */
const checkChordMatch = (inputNotes: number[], targetChord: ChordDefinition): boolean => {
  if (inputNotes.length === 0) return false;
  
  // 入力された音をノート番号のmod 12で正規化（オクターブ無視）
  const inputNotesMod12 = inputNotes.map(note => note % 12);
  const targetNotesMod12 = targetChord.notes.map(note => note % 12);
  
  // ターゲットコードの全ての音が入力に含まれているかチェック
  const hasAllTargetNotes = targetNotesMod12.every(targetNote => 
    inputNotesMod12.includes(targetNote)
  );
  
  devLog.debug(`🎵 コード判定:`, {
    input: inputNotes,
    inputMod12: inputNotesMod12,
    target: targetChord.displayName,
    targetNotes: targetChord.notes,
    targetMod12: targetNotesMod12,
    hasAllTargetNotes
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
    gameResult: null
  });
  
  const [enemyGaugeTimer, setEnemyGaugeTimer] = useState<NodeJS.Timeout | null>(null);
  const [inputBuffer, setInputBuffer] = useState<number[]>([]);
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // ゲーム初期化
  const initializeGame = useCallback(() => {
    if (!stage) return;
    
    const firstChord = stage.mode === 'single' 
      ? selectRandomChord(stage.allowedChords)
      : getProgressionChord(stage.chordProgression || [], 0);
    
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
      gameResult: null
    };
    
    setGameState(newState);
    setInputBuffer([]);
    onGameStateChange(newState);
    
    devLog.debug('🎮 ファンタジーゲーム初期化:', newState);
  }, [stage, onGameStateChange]);
  
  // 次の問題への移行
  const proceedToNextQuestion = useCallback(() => {
    setGameState(prevState => {
      const nextQuestionIndex = prevState.currentQuestionIndex + 1;
      const isLastQuestion = nextQuestionIndex >= prevState.totalQuestions;
      
      if (isLastQuestion) {
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
        // 次の問題
        const nextChord = prevState.currentStage?.mode === 'single'
          ? selectRandomChord(prevState.currentStage.allowedChords)
          : getProgressionChord(prevState.currentStage?.chordProgression || [], nextQuestionIndex);
        
        const nextState = {
          ...prevState,
          currentQuestionIndex: nextQuestionIndex,
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
    setGameState(prevState => {
      const newHp = prevState.playerHp - 1;
      const isGameOver = newHp <= 0;
      
      if (isGameOver) {
        const finalState = {
          ...prevState,
          playerHp: 0,
          isGameActive: false,
          isGameOver: true,
          gameResult: 'gameover' as const
        };
        
        onGameComplete('gameover', finalState);
        return finalState;
      } else {
        // HP減少して次の問題へ
        const nextQuestionIndex = prevState.currentQuestionIndex + 1;
        const isLastQuestion = nextQuestionIndex >= prevState.totalQuestions;
        
        if (isLastQuestion) {
          // 最後の問題でHP残りありなら一応クリア
          const finalState = {
            ...prevState,
            playerHp: newHp,
            isGameActive: false,
            isGameOver: true,
            gameResult: 'clear' as const
          };
          
          onGameComplete('clear', finalState);
          return finalState;
        } else {
          const nextChord = prevState.currentStage?.mode === 'single'
            ? selectRandomChord(prevState.currentStage.allowedChords)
            : getProgressionChord(prevState.currentStage?.chordProgression || [], nextQuestionIndex);
          
          const nextState = {
            ...prevState,
            playerHp: newHp,
            currentQuestionIndex: nextQuestionIndex,
            currentChordTarget: nextChord,
            enemyGauge: 0
          };
          
          onGameStateChange(nextState);
          return nextState;
        }
      }
    });
    
    onEnemyAttack();
  }, [onGameStateChange, onGameComplete, onEnemyAttack]);
  
  // 敵ゲージの更新
  const updateEnemyGauge = useCallback(() => {
    if (!gameState.isGameActive || !gameState.currentStage) return;
    
    const incrementRate = 100 / (gameState.currentStage.enemyGaugeSeconds * 10); // 100ms間隔で更新
    
    setGameState(prevState => {
      const newGauge = prevState.enemyGauge + incrementRate;
      
      if (newGauge >= 100) {
        // ゲージ満タン -> 敵の攻撃
        setTimeout(handleEnemyAttack, 0);
        return prevState; // handleEnemyAttackで状態更新
      } else {
        const nextState = { ...prevState, enemyGauge: newGauge };
        onGameStateChange(nextState);
        return nextState;
      }
    });
  }, [gameState.isGameActive, gameState.currentStage, handleEnemyAttack, onGameStateChange]);
  
  // ゲージタイマーの管理
  useEffect(() => {
    if (gameState.isGameActive && !enemyGaugeTimer) {
      const timer = setInterval(updateEnemyGauge, 100);
      setEnemyGaugeTimer(timer);
      
      return () => {
        clearInterval(timer);
        setEnemyGaugeTimer(null);
      };
    } else if (!gameState.isGameActive && enemyGaugeTimer) {
      clearInterval(enemyGaugeTimer);
      setEnemyGaugeTimer(null);
    }
  }, [gameState.isGameActive, enemyGaugeTimer, updateEnemyGauge]);
  
  // ノート入力処理
  const handleNoteInput = useCallback((note: number) => {
    if (!gameState.isGameActive || !gameState.currentChordTarget) return;
    
    // 入力バッファに追加
    setInputBuffer(prevBuffer => {
      const newBuffer = [...prevBuffer, note];
      
      // 入力タイムアウトをリセット
      if (inputTimeout) {
        clearTimeout(inputTimeout);
      }
      
      // 500ms後に自動判定
      const timeout = setTimeout(() => {
        checkCurrentInput(newBuffer);
        setInputBuffer([]);
      }, 500);
      
      setInputTimeout(timeout);
      
      return newBuffer;
    });
  }, [gameState.isGameActive, gameState.currentChordTarget, inputTimeout]);
  
  // 現在の入力を判定
  const checkCurrentInput = useCallback((notes: number[]) => {
    if (!gameState.currentChordTarget || notes.length === 0) return;
    
    const isCorrect = checkChordMatch(notes, gameState.currentChordTarget);
    
    if (isCorrect) {
      // 正解
      onChordCorrect(gameState.currentChordTarget);
      
      setGameState(prevState => {
        const nextState = {
          ...prevState,
          correctAnswers: prevState.correctAnswers + 1,
          score: prevState.score + 1000
        };
        onGameStateChange(nextState);
        return nextState;
      });
      
      // 次の問題へ
      setTimeout(proceedToNextQuestion, 500);
      
    } else {
      // 不正解
      onChordIncorrect(gameState.currentChordTarget, notes);
    }
  }, [gameState.currentChordTarget, onChordCorrect, onChordIncorrect, onGameStateChange, proceedToNextQuestion]);
  
  // 手動で現在の入力を判定
  const submitCurrentInput = useCallback(() => {
    if (inputTimeout) {
      clearTimeout(inputTimeout);
      setInputTimeout(null);
    }
    
    checkCurrentInput(inputBuffer);
    setInputBuffer([]);
  }, [inputTimeout, checkCurrentInput, inputBuffer]);
  
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
  
  // クリーンアップ
  useEffect(() => {
    return () => {
      if (enemyGaugeTimer) {
        clearInterval(enemyGaugeTimer);
      }
      if (inputTimeout) {
        clearTimeout(inputTimeout);
      }
    };
  }, [enemyGaugeTimer, inputTimeout]);
  
  return {
    gameState,
    inputBuffer,
    handleNoteInput,
    submitCurrentInput,
    initializeGame,
    stopGame,
    
    // ヘルパー関数もエクスポート
    checkChordMatch,
    selectRandomChord,
    getProgressionChord,
    CHORD_DEFINITIONS
  };
};

export type { ChordDefinition, FantasyStage, FantasyGameState, FantasyGameEngineProps };
export { CHORD_DEFINITIONS };