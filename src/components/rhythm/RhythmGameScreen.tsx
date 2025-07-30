import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RhythmGameManager, RhythmGameCallbacks } from '@/rhythm/manager';
import { RhythmFantasyStage, RhythmQuestion } from '@/rhythm/generator';
import { JudgeResult } from '@/rhythm/judge';
import { MonsterGaugeUI } from './MonsterGaugeUI';
import FantasyPIXIRenderer, { FantasyPIXIInstance } from '../fantasy/FantasyPIXIRenderer';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import { useFantasyGameEngine, MonsterState, FantasyGameState } from '../fantasy/FantasyGameEngine';
import { MIDIController } from '@/utils/MidiController';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';

interface RhythmGameScreenProps {
  stage: RhythmFantasyStage;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number) => void;
  onBackToStageSelect: () => void;
  noteNameLang?: 'en' | 'ja';
  simpleNoteName?: boolean;
  lessonMode?: boolean;
}

export default function RhythmGameScreen({
  stage,
  onGameComplete,
  onBackToStageSelect,
  noteNameLang = 'en',
  simpleNoteName = false,
  lessonMode = false
}: RhythmGameScreenProps) {
  const managerRef = useRef<RhythmGameManager>();
  const pixiInstanceRef = useRef<FantasyPIXIInstance>();
  const notesRendererRef = useRef<PIXINotesRendererInstance>();
  const midiControllerRef = useRef<MIDIController | null>(null);
  
  const [gameStarted, setGameStarted] = useState(false);
  const [damageShake, setDamageShake] = useState(false);
  const [overlay, setOverlay] = useState<null | { text: string }>(null);
  const [activeMonsters, setActiveMonsters] = useState<(MonsterState & { rhythmQuestion?: RhythmQuestion })[]>([]);
  
  // Initialize fantasy game engine
  const {
    gameState,
    handleInput,
    startGame,
    isGameActive
  } = useFantasyGameEngine(
    stage as any, // TODO: Fix type
    {
      onGameComplete,
      onMonsterDefeat: (monsterId) => {
        devLog(`Monster defeated: ${monsterId}`);
      },
      onPlayerDamage: () => {
        setDamageShake(true);
        setTimeout(() => setDamageShake(false), 500);
      },
      onAttackSuccess: (monsterId, damage) => {
        pixiInstanceRef.current?.triggerAttackSuccessOnMonster(monsterId);
      },
      onMagicActivate: (monsterId, magicName, isSpecial) => {
        devLog(`Magic: ${magicName} on ${monsterId}`);
      }
    }
  );
  
  // Create rhythm game callbacks
  const callbacks: RhythmGameCallbacks = {
    onAttackSuccess: (monsterId, chord, result) => {
      devLog(`Rhythm hit: ${chord} (${result.timing})`);
      handleInput(60); // Dummy note for now
      
      // Show timing feedback
      if (result.timing === 'perfect') {
        setOverlay({ text: 'PERFECT!' });
        setTimeout(() => setOverlay(null), 1000);
      }
    },
    onAttackFail: (monsterId, chord, result) => {
      devLog(`Rhythm miss: ${chord}`);
      // Trigger enemy attack animation
      pixiInstanceRef.current?.triggerEnemyAttack();
    },
    onQuestionSpawn: (question) => {
      devLog(`Question spawned: ${question.chord} at measure ${question.measure}`);
      // Update monster with question
      setActiveMonsters(prev => {
        const monsters = [...prev];
        const index = (question.measure - 2) % monsters.length;
        if (monsters[index]) {
          monsters[index] = { ...monsters[index], rhythmQuestion: question };
        }
        return monsters;
      });
    },
    onAllEnemyDefeated: () => {
      devLog('All enemies defeated!');
    }
  };
  
  // Initialize rhythm game manager
  useEffect(() => {
    if (gameStarted && stage.game_type === 'rhythm') {
      managerRef.current = new RhythmGameManager(stage, callbacks);
      managerRef.current.start().catch(console.error);
      
      return () => {
        managerRef.current?.dispose();
      };
    }
  }, [gameStarted, stage]);
  
  // Initialize monsters
  useEffect(() => {
    if (gameState.monsters) {
      setActiveMonsters(gameState.monsters.map(m => ({ ...m })));
    }
  }, [gameState.monsters]);
  
  // MIDI controller setup
  useEffect(() => {
    if (!midiControllerRef.current) {
      const controller = new MIDIController({
        onNoteOn: (note) => {
          managerRef.current?.handleNoteOn(note);
          notesRendererRef.current?.handleNoteOn(note, 'midi');
        },
        onNoteOff: (note) => {
          managerRef.current?.handleNoteOff(note);
          notesRendererRef.current?.handleNoteOff(note, 'midi');
        }
      });
      midiControllerRef.current = controller;
    }
    
    return () => {
      midiControllerRef.current?.disconnect();
    };
  }, []);
  
  const handleNoteInput = useCallback((note: number, source?: 'mouse' | 'midi') => {
    if (source === 'mouse') {
      managerRef.current?.handleNoteOn(note);
      setTimeout(() => {
        managerRef.current?.handleNoteOff(note);
      }, 100);
    }
  }, []);
  
  const handleStartGame = () => {
    setGameStarted(true);
    startGame();
  };
  
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-gray-900 to-black">
      {/* Game overlay effects */}
      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-6xl font-bold text-yellow-400 animate-bounce">
            {overlay.text}
          </div>
        </div>
      )}
      
      {/* Start screen */}
      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black bg-opacity-75">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">リズムモード</h2>
            <p className="text-xl text-gray-300 mb-8">{stage.name}</p>
            <button
              onClick={handleStartGame}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xl font-bold transition-colors"
            >
              スタート
            </button>
          </div>
        </div>
      )}
      
      {/* Main game area */}
      <div className={cn(
        "flex-1 relative transition-all duration-100",
        damageShake && "animate-shake"
      )}>
        {/* Monster renderer */}
        <FantasyPIXIRenderer
          ref={pixiInstanceRef}
          monsterIcon={stage.monster_icon || 'monster_01'}
          width={window.innerWidth}
          height={300}
          enemyGauge={0}
          playerHp={gameState.playerHp}
          playerMaxHp={gameState.playerMaxHp}
          playerSp={gameState.playerSp}
          playerMaxSp={gameState.playerMaxSp}
          onInit={(instance) => {
            pixiInstanceRef.current = instance;
          }}
        />
        
        {/* Rhythm gauge UI */}
        <MonsterGaugeUI monsters={activeMonsters} />
      </div>
      
      {/* Piano keyboard */}
      <div className="relative h-48 bg-gray-800">
        <PIXINotesRenderer
          ref={notesRendererRef}
          width={window.innerWidth}
          height={192}
          onNoteInput={handleNoteInput}
          noteNameLang={noteNameLang}
          simpleNoteName={simpleNoteName}
          showGuide={stage.show_guide}
          targetNotes={[]}
          onInit={(instance) => {
            notesRendererRef.current = instance;
          }}
        />
      </div>
      
      {/* HUD */}
      <div className="absolute top-4 left-4 text-white">
        <div className="text-lg">HP: {gameState.playerHp} / {gameState.playerMaxHp}</div>
        <div className="text-lg">SP: {gameState.playerSp} / {gameState.playerMaxSp}</div>
      </div>
      
      {/* Back button */}
      <button
        onClick={onBackToStageSelect}
        className="absolute top-4 right-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
      >
        戻る
      </button>
    </div>
  );
}