/**
 * ファンタジーゲームメイン画面
 * UI/UX要件に従ったゲーム画面の実装
 */

import React, { useState, useEffect, useCallback, useRef, useMemo, MutableRefObject } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { MIDIController, playNote, stopNote, initializeAudioSystem, updateGlobalVolume } from '@/utils/MidiController';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { bgmManager } from '@/utils/BGMManager';
import { useFantasyGameEngine, ChordDefinition, FantasyStage, FantasyGameState, MonsterState, type FantasyPlayMode } from './FantasyGameEngine';
import { 
  TaikoNote, 
  ChordProgressionDataItem,
  TransposeSettings,
  RepeatKeyChange,
  transposeTaikoNotes,
  calculateTransposeOffset
} from './TaikoNoteSystem';
import FantasySheetMusicDisplay from './FantasySheetMusicDisplay';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import { FantasyPIXIRenderer, FantasyPIXIInstance } from './FantasyPIXIRenderer';
import FantasySettingsModal from './FantasySettingsModal';
import type { DisplayOpts } from '@/utils/display-note';
import { toDisplayName } from '@/utils/display-note';
import { note as parseNote } from 'tonal';
import { shouldUseEnglishCopy, getLocalizedFantasyStageName, getLocalizedFantasyStageDescription } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
// 🚀 パフォーマンス最適化: FantasySoundManagerを静的インポート
import { FantasySoundManager } from '@/utils/FantasySoundManager';

interface FantasyGameScreenProps {
  stage: FantasyStage;
  autoStart?: boolean;        // ★ 追加
  autoStartSpeedMultiplier?: number; // ★ 追加: 自動開始時の速度倍率（progressionモード用）
  playMode: FantasyPlayMode;
  onPlayModeChange: (mode: FantasyPlayMode) => void;
  onSwitchToChallenge: () => void;
  onGameComplete: (result: 'clear' | 'gameover', score: number, correctAnswers: number, totalQuestions: number, playerHp: number, maxHp: number) => void;
  onBackToStageSelect: () => void;
  noteNameLang?: DisplayOpts['lang'];     // 音名表示言語
  simpleNoteName?: boolean;                // 簡易表記
  lessonMode?: boolean;                    // レッスンモード
  fitAllKeys?: boolean;                    // ★ 追加: 全鍵盤を幅内に収める（LPデモ用）
  /**
   * UI/ルールをデイリーチャレンジ仕様に切り替える
   * - 残り時間/スコア表示（HP/敵ゲージ/敵HPなどは非表示）
   * - タイムリミットで終了
   */
  uiMode?: 'normal' | 'daily_challenge';
  /** uiMode=daily_challenge のときのみ有効 */
  timeLimitSeconds?: number;
}

// 不要な定数とインターフェースを削除（PIXI側で処理）

const FantasyGameScreen: React.FC<FantasyGameScreenProps> = ({
  stage,
  autoStart = false, // ★ 追加
  autoStartSpeedMultiplier = 1.0, // ★ 追加: 自動開始時の速度倍率
  playMode,
  onPlayModeChange,
  onSwitchToChallenge,
  onGameComplete,
  onBackToStageSelect,
  noteNameLang = 'en',
  simpleNoteName = false,
  lessonMode = false,
  fitAllKeys = false,
  uiMode = 'normal',
  timeLimitSeconds = 120,
}) => {
  const isDailyChallenge = uiMode === 'daily_challenge';
  // タイマーeffectが onGameComplete 変化で再起動しないよう、最新参照は ref で保持する
  const onGameCompleteRef = useRef<FantasyGameScreenProps['onGameComplete']>(onGameComplete);
  useEffect(() => {
    onGameCompleteRef.current = onGameComplete;
  }, [onGameComplete]);
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry });
  const localizedStageName = useMemo(
    () => getLocalizedFantasyStageName(stage, profile?.rank),
    [stage, profile?.rank, geoCountry],
  );
  const localizedStageDescription = useMemo(
    () => getLocalizedFantasyStageDescription(stage, profile?.rank) ?? '',
    [stage, profile?.rank, geoCountry],
  );
  // useGameStoreの使用を削除（ファンタジーモードでは不要）
  
  // エフェクト状態
  const [damageShake, setDamageShake] = useState(false);
  const [overlay, setOverlay] = useState<null | { text:string }>(null); // ★★★ add
  const [heartFlash, setHeartFlash] = useState(false); // ハートフラッシュ効果
  
  // 設定モーダル状態
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // 設定状態を管理
  // ガイド表示: 練習モードはデフォルトON（トグル可能）、挑戦モードは常にOFF
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(true); // 練習モードのデフォルト値
  const [currentNoteNameLang, setCurrentNoteNameLang] = useState<DisplayOpts['lang']>(noteNameLang);
  const [currentSimpleNoteName, setCurrentSimpleNoteName] = useState(simpleNoteName);
  const [keyboardNoteNameStyle, setKeyboardNoteNameStyle] = useState<'off' | 'abc' | 'solfege'>('abc'); // 鍵盤上の音名表示
  
  // 魔法名表示状態 - 削除（パフォーマンス改善のため）
  
  // 鍵盤ガイド表示の実効値を計算
  // 練習モード: ユーザー設定に従う（デフォルトON）
  // 挑戦モード: 常にOFF（show_guide設定に関係なく）
  const effectiveShowGuide = useMemo(() => {
    // 挑戦モードは常にOFF
    if (playMode === 'challenge') {
      return false;
    }
    // 練習モードはユーザー設定に従う
    return showKeyboardGuide;
  }, [playMode, showKeyboardGuide]);
  
  // 時間管理 - BGMManagerから取得
  const [currentBeat, setCurrentBeat] = useState(1);
  const [currentMeasure, setCurrentMeasure] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const readyStartTimeRef = useRef<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(timeLimitSeconds);
  const hasTimeUpFiredRef = useRef(false);
  const gameStateRef = useRef<FantasyGameState | null>(null);
  
  // 低速練習モード用の状態（progressionモードでのみ使用）
  const [selectedSpeedMultiplier, setSelectedSpeedMultiplier] = useState<number>(1.0);
  
  // 移調練習用の状態（progression_timingモードかつ練習モードでのみ使用）
  const [transposeKeyOffset, setTransposeKeyOffset] = useState<number>(0); // -6 ~ +6
  const [repeatKeyChange, setRepeatKeyChange] = useState<RepeatKeyChange>('off');
  
  // 🚀 初期化完了状態を追跡
  const [isInitialized, setIsInitialized] = useState(false);
  const initPromiseRef = useRef<Promise<void> | null>(null);
  // ゲーム初期化（画像プリロード）完了を追跡
  const [isGameReady, setIsGameReady] = useState(false);
  
  // BGMManagerからタイミング情報を定期的に取得
  // 🚀 パフォーマンス最適化: 間隔を200msに
  useEffect(() => {
    const interval = setInterval(() => {
      const newBeat = bgmManager.getCurrentBeat();
      const newMeasure = bgmManager.getCurrentMeasure();
      // 変更があった場合のみ状態を更新（関数形式で比較）
      setCurrentBeat(prev => prev !== newBeat ? newBeat : prev);
      setCurrentMeasure(prev => prev !== newMeasure ? newMeasure : prev);
      // Ready状態は「2秒経過 AND 画像プリロード完了」で解除
      const timeElapsed = readyStartTimeRef.current > 0 && performance.now() - readyStartTimeRef.current > 2000;
      if (isReady && timeElapsed && isGameReady) {
        setIsReady(false);
      }
    }, 200); // 200ms間隔で更新（パフォーマンス改善）
    
    return () => clearInterval(interval);
  }, [isReady, isGameReady]);
  
  // ★★★ 修正箇所 ★★★
  // ローカルのuseStateからgameStoreに切り替え
  const { settings, updateSettings } = useGameStore();
  const midiControllerRef = useRef<MIDIController | null>(null);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  
  // ★★★ 追加: モンスターエリアの幅管理 ★★★
  const [monsterAreaWidth, setMonsterAreaWidth] = useState<number>(window.innerWidth);
  const monsterAreaRef = useRef<HTMLDivElement>(null);
  // スマホ横画面でのモンスターエリア高さを動的に調整
  const [monsterAreaHeight, setMonsterAreaHeight] = useState<number>(200);
  
  /* Ready → Start 判定 */
  // isReadyはローカルstateで管理済み
  
  // ★★★ 追加: モンスターエリアのサイズ監視 ★★★
  useEffect(() => {
    const update = () => {
      if (monsterAreaRef.current) {
        setMonsterAreaWidth(monsterAreaRef.current.clientWidth);
        // 端末の向き・サイズに応じて高さを決定
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const isLandscape = vw > vh;
        const isMobile = vw < 900; // タブレット未満をモバイル扱い
        if (isMobile && isLandscape) {
          // 横画面ではUIを圧縮し、描画コンテナを拡大
          // 画面高の約55%を上限に、最大320pxまで拡大（ダメージテキスト表示のため増加）
          const h = Math.min(320, Math.max(240, Math.floor(vh * 0.55)));
          setMonsterAreaHeight(h);
        } else {
          // 縦 or デスクトップは従来相当（ダメージテキスト表示のため増加）
          const h = Math.min(280, Math.max(220, Math.floor(vh * 0.35)));
          setMonsterAreaHeight(h);
        }
      }
    };
    update(); // 初期化時
    const ro = new ResizeObserver(update); // 動的リサイズ
    if (monsterAreaRef.current) {
      ro.observe(monsterAreaRef.current);
    }
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
  
  // BGM再生は gameState が確定してから制御（下でuseEffectを定義）
  
  // ★★★ 楽譜表示エリアの高さ（Progression_Timing用） ★★★
  const [sheetMusicHeight, setSheetMusicHeight] = useState<number>(180);
  
  // ★★★ 追加: 各モンスターのゲージDOM要素を保持するマップ ★★★
  const gaugeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // ノート入力のハンドリング用ref
  const handleNoteInputRef = useRef<(note: number, source?: 'mouse' | 'midi') => void>();
  
  // 再生中のノートを追跡
  const activeNotesRef = useRef<Set<number>>(new Set());

  // 🚀 パフォーマンス最適化: playNote を直接参照（動的インポート不要）
  const playNoteRef = useRef<((note: number, velocity?: number) => Promise<void>) | null>(playNote);
  
  // MIDIControllerの初期化と管理
  useEffect(() => {
    // MIDIControllerのインスタンスを作成（一度だけ）
    if (!midiControllerRef.current) {
      const controller = new MIDIController({
        onNoteOn: (note: number, _velocity?: number) => {
          if (handleNoteInputRef.current) {
            handleNoteInputRef.current(note, 'midi'); // MIDI経由として指定
          }
        },
        onNoteOff: (_note: number) => {
          // Note off - no action needed
        },
        playMidiSound: true // 通常プレイと同様に共通音声システムを有効化
      });
      
      controller.setConnectionChangeCallback((connected: boolean) => {
        setIsMidiConnected(connected);
      });
      
      midiControllerRef.current = controller;
      
      // 🚀 初期化を開始し、完了を追跡
      const initPromise = (async () => {
        try {
          await controller.initialize();
          
          // 音声システムとFantasySoundManagerを並列初期化（両方完了を待つ）
          await Promise.all([
            // 音声システム初期化
            initializeAudioSystem().then(() => {
              updateGlobalVolume(0.8);
            }),
            // FantasySoundManagerの初期化（完了を待つ）
            FantasySoundManager.init(
              settings.soundEffectVolume ?? 0.8,
              settings.rootSoundVolume ?? 0.5,
              stage?.playRootOnCorrect !== false
            ).then(() => {
              FantasySoundManager.enableRootSound(stage?.playRootOnCorrect !== false);
            })
          ]);
          
          setIsInitialized(true);
        } catch (error) {
          console.error('Audio system initialization failed:', error);
          // エラーでも初期化完了とする（ゲームは開始可能）
          setIsInitialized(true);
        }
      })();
      
      initPromiseRef.current = initPromise;
    }
    
    // クリーンアップ
    return () => {
      if (midiControllerRef.current) {
        midiControllerRef.current.destroy();
        midiControllerRef.current = null;
      }
    };
  }, []); // 空の依存配列で一度だけ実行
  
  // ★★★ 修正箇所 ★★★
  // gameStoreのデバイスIDを監視して接続/切断
  useEffect(() => {
    const connect = async () => {
      const deviceId = settings.selectedMidiDevice;
      if (midiControllerRef.current && deviceId) {
        await midiControllerRef.current.connectDevice(deviceId);
      } else if (midiControllerRef.current && !deviceId) {
        midiControllerRef.current.disconnect();
      }
    };
    connect();
  }, [settings.selectedMidiDevice]);

  // ステージ変更時にMIDI接続を確認・復元
  useEffect(() => {
    const restoreMidiConnection = async () => {
      if (midiControllerRef.current && midiControllerRef.current.getCurrentDeviceId()) {
        await midiControllerRef.current.checkAndRestoreConnection();
      }
    };

    // コンポーネントが表示されたときに接続復元を試みる
    const timer = setTimeout(restoreMidiConnection, 100);
    return () => clearTimeout(timer);
  }, [stage]); // stageが変更されたときに実行
  
  // 🚀 パフォーマンス最適化: ステージ設定に応じてルート音を有効/無効にする（動的インポート不要）
  useEffect(() => {
    // 明示的に false のときのみ無効化。未指定(undefined)は有効のまま
    FantasySoundManager.enableRootSound(stage?.playRootOnCorrect !== false);
  }, [stage?.playRootOnCorrect]);
  
  // PIXI.js レンダラー
  const [pixiRenderer, setPixiRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const pianoScrollRef = useRef<HTMLDivElement | null>(null);
  const hasUserScrolledRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const handlePianoScroll = useCallback(() => {
    if (!isProgrammaticScrollRef.current) {
      hasUserScrolledRef.current = true;
    }
  }, []);

  const centerPianoC4 = useCallback(() => {
    const container = pianoScrollRef.current;
    if (!container) return;

    if (hasUserScrolledRef.current) return;

    const contentWidth = container.scrollWidth;
    const viewportWidth = container.clientWidth;
    if (!contentWidth || !viewportWidth) return;
    if (contentWidth <= viewportWidth) return;

    const TOTAL_WHITE_KEYS = 52;
    const C4_WHITE_INDEX = 23; // A0=0 ... C4=23
    const whiteKeyWidth = contentWidth / TOTAL_WHITE_KEYS;
    const c4CenterX = (C4_WHITE_INDEX + 0.5) * whiteKeyWidth;
    const desiredScroll = Math.max(0, Math.min(contentWidth - viewportWidth, c4CenterX - viewportWidth / 2));

    isProgrammaticScrollRef.current = true;
    try {
      container.scrollTo({ left: desiredScroll, behavior: 'auto' });
    } catch {}
    container.scrollLeft = desiredScroll;
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, []);

  useEffect(() => {
    // Run after initial mount/layout
    const raf = requestAnimationFrame(centerPianoC4);
    const handleResize = () => requestAnimationFrame(centerPianoC4);
    window.addEventListener('resize', handleResize);
    const handleOrientation = () => requestAnimationFrame(centerPianoC4);
    window.addEventListener('orientationchange', handleOrientation);

    const el = pianoScrollRef.current;
    let ro: ResizeObserver | null = null;
    if (el && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => {
        // When content or container size changes, re-center
        requestAnimationFrame(centerPianoC4);
      });
      ro.observe(el);
    }

    // Fallback recenter after slight delay (mobile Safari layout pass)
    const t1 = setTimeout(centerPianoC4, 120);
    const t2 = setTimeout(centerPianoC4, 300);
    const t3 = setTimeout(centerPianoC4, 500);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientation);
      if (ro) ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [centerPianoC4]);
  const [fantasyPixiInstance, setFantasyPixiInstance] = useState<FantasyPIXIInstance | null>(null);
  const isTaikoModeRef = useRef(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameAreaSize, setGameAreaSize] = useState({ width: 1000, height: 120 }); // ファンタジーモード用に高さを大幅に縮小
  
  // ゲームエンジン コールバック
  const handleGameStateChange = useCallback((_state: FantasyGameState) => {
    // ゲーム状態の更新を通知（ログは削除済み）
  }, []);
  
  // ▼▼▼ 変更点 ▼▼▼
  // monsterId を受け取り、新しいPIXIメソッドを呼び出す
  // 🚀 パフォーマンス最適化: 全処理をrequestAnimationFrameで次フレームに遅延
  // これによりReactのsetStateバッチ更新と分離され、ノーツアニメーションがブレなくなる
  const handleChordCorrect = useCallback((chord: ChordDefinition, isSpecial: boolean, damageDealt: number, defeated: boolean, monsterId: string) => {
    // 🚀 全処理を次フレームに遅延（現在のフレームのレンダリングを妨げない）
    requestAnimationFrame(() => {
      // PIXI視覚フィードバック
      if (fantasyPixiInstance) {
        fantasyPixiInstance.triggerAttackSuccessOnMonster(monsterId, chord.displayName, isSpecial, damageDealt, defeated);
        if (isTaikoModeRef.current) {
          const pos = fantasyPixiInstance.getJudgeLinePosition();
          fantasyPixiInstance.createNoteHitEffect(pos.x, pos.y, true);
        }
      }

      // ルート音再生
      const allowRootSound = stage?.playRootOnCorrect !== false;
      if (allowRootSound) {
        const id = chord.id || chord.displayName || chord.root;
        let bassToPlay = chord.root;
        if (typeof id === 'string' && id.includes('/')) {
          const parts = id.split('/');
          if (parts[1]) bassToPlay = parts[1];
        }
        FantasySoundManager.playRootNote(bassToPlay).catch(() => {});
      }
    });
  }, [fantasyPixiInstance, stage?.playRootOnCorrect]);
  // ▲▲▲ ここまで ▲▲▲
  
  const handleChordIncorrect = useCallback((_expectedChord: ChordDefinition, _inputNotes: number[]) => {
    // 不正解エフェクトは削除（音の積み重ね方式のため）
  }, []);
  
  const handleEnemyAttack = useCallback((_attackingMonsterId?: string) => {
    // 🚀 パフォーマンス最適化: 敵の攻撃音を同期的に再生（動的インポート不要）
    if (stage.mode === 'single') {
      FantasySoundManager.playEnemyAttack();
    }
    
    // ダメージ時の画面振動
    setDamageShake(true);
    setTimeout(() => setDamageShake(false), 500);
    
    // ハートフラッシュ効果
    setHeartFlash(true);
    setTimeout(() => setHeartFlash(false), 150);
    
  }, [stage.mode]);
  
  const handleGameCompleteCallback = useCallback((result: 'clear' | 'gameover', finalState: FantasyGameState) => {
    const text = result === 'clear' ? 'Stage Clear' : 'Game Over';
    
    // ステージクリア時はBGMを即座に停止し、クリア効果音を再生
    if (result === 'clear') {
      bgmManager.stop();
      FantasySoundManager.playStageClear();
    }
    
    setOverlay({ text });                 // ★★★ add
    setTimeout(() => {
      setOverlay(null);                   // オーバーレイを消す
      onGameComplete(
        result,
        finalState.score,
        finalState.correctAnswers,
        finalState.totalQuestions,
        finalState.playerHp,
        stage.maxHp
      );
    }, 2000);                             // 2 秒待ってから結果画面へ
  }, [onGameComplete, stage.maxHp]);
  
  // ★【最重要修正】 ゲームエンジンには、UIの状態を含まない初期stageを一度だけ渡す
  // これでガイドをON/OFFしてもゲームはリセットされなくなる
  const {
    gameState,
    handleNoteInput: engineHandleNoteInput,
    initializeGame,
    stopGame,
    getCurrentEnemy,
    proceedToNextEnemy,
    imageTexturesRef, // 追加: プリロードされたテクスチャへの参照
    ENEMY_LIST
  } = useFantasyGameEngine({
    stage: null, // ★★★ change
    onGameStateChange: handleGameStateChange,
    onChordCorrect: handleChordCorrect,
    onChordIncorrect: handleChordIncorrect,
    onGameComplete: handleGameCompleteCallback,
    onEnemyAttack: handleEnemyAttack,
    displayOpts: { lang: 'en', simple: false }, // コードネーム表示は常に英語、簡易表記OFF
    isReady
  });

  // Progression_Timing用の楽譜表示フラグ
  // musicXmlが存在する場合のみOSMD楽譜を表示
  const showSheetMusicForTiming = useMemo(() => {
    return stage.mode === 'progression_timing' && 
           gameState.isTaikoMode && 
           gameState.taikoNotes.length > 0 &&
           !!stage.musicXml;
  }, [stage.mode, gameState.isTaikoMode, gameState.taikoNotes.length, stage.musicXml]);
  
  
  // 楽譜表示エリアの高さを画面サイズに応じて調整
  useEffect(() => {
    if (!showSheetMusicForTiming) return;
    
    const updateSheetHeight = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const isLandscape = vw > vh;
      const isMobile = vw < 900;
      
      if (isMobile && isLandscape) {
        // モバイル横向き: 高さを少し抑える
        setSheetMusicHeight(Math.min(140, Math.max(100, Math.floor(vh * 0.22))));
      } else {
        // PC/タブレット: 高さを大きく確保（調号・拍子記号・音符表示のため）
        setSheetMusicHeight(Math.min(220, Math.max(160, Math.floor(vh * 0.28))));
      }
    };
    
    updateSheetHeight();
    window.addEventListener('resize', updateSheetHeight);
    return () => window.removeEventListener('resize', updateSheetHeight);
  }, [showSheetMusicForTiming]);

  // Ready 終了後に BGM 再生（開始前画面では鳴らさない）
  // 注: currentTransposeOffsetを依存配列に含めないこと！
  // ループ境界で移調が変更されたときにBGMが再起動されてしまう
  useEffect(() => {
    if (!gameState.isGameActive) return;
    if (isReady) return;

    // 低速練習モードの場合、選択した速度を適用
    const playbackRate = selectedSpeedMultiplier;
    
    // 初回再生時のピッチシフト
    // 移調設定がある場合（repeatKeyChangeが'off'でない場合）、
    // Tone.jsを使用するために0.001などの小さな値を設定してピッチシフトを有効化
    // これにより、後からsetPitchShiftでピッチを変更できるようになる
    let initialPitchShift = gameState.currentTransposeOffset || 0;
    
    // repeatKeyChangeが設定されている場合、Tone.jsを強制的に使用
    // 初回は移調なし(0)でも、ループ後に移調が必要になるため
    if (gameState.transposeSettings && gameState.transposeSettings.repeatKeyChange !== 'off') {
      // 0だとTone.jsが使われないので、0.001を設定してTone.jsを有効化
      // （ほぼ聴こえない差だが、setPitchShiftが動作するようになる）
      if (initialPitchShift === 0) {
        initialPitchShift = 0.001;
      }
    }
    
    bgmManager.play(
      stage.bgmUrl ?? '/demo-1.mp3',
      stage.bpm || 120,
      stage.timeSignature || 4,
      stage.measureCount ?? 8,
      stage.countInMeasures ?? 0,
      settings.bgmVolume ?? 0.7,
      playbackRate,
      initialPitchShift
    );

    return () => bgmManager.stop();
   
  }, [gameState.isGameActive, isReady, stage, settings.bgmVolume, selectedSpeedMultiplier]);
  // 注: gameState.currentTransposeOffsetは意図的に依存配列から除外（ループ時の再起動防止）
  // 注: gameState.transposeSettingsも除外（初回再生後に変更されない）
  
  // 現在の敵情報を取得
  const currentEnemy = getCurrentEnemy(gameState.currentEnemyIndex);
  const primaryMonsterIcon = useMemo(() => {
    const activeIcon = gameState.activeMonsters?.[0]?.icon;
    if (isDailyChallenge) {
      // デイリーチャレンジは monster_icons/monster_XX.png を使用
      return activeIcon ?? 'monster_01';
    }
    return currentEnemy.icon;
  }, [currentEnemy.icon, gameState.activeMonsters, isDailyChallenge]);

  // 最新のgameState参照を保持（タイムアップ時に使用）
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const buildInitStage = useCallback((
    speedMultiplier?: number,
    transposeSettings?: TransposeSettings
  ): FantasyStage => {
    const baseStage = {
      ...stage,
      // 互換性：Supabaseのカラム note_interval_beats を noteIntervalBeats にマップ（存在する場合）
      noteIntervalBeats: (stage as any).note_interval_beats ?? (stage as any).noteIntervalBeats,
    };
    
    // 速度倍率を適用
    if (speedMultiplier !== undefined && speedMultiplier !== 1.0) {
      (baseStage as any).speedMultiplier = speedMultiplier;
    }
    
    // 移調設定を適用（progression_timingモードの場合のみ）
    if (transposeSettings && stage.mode === 'progression_timing') {
      (baseStage as any).transposeSettings = transposeSettings;
    }
    
    return baseStage;
  }, [stage]);

  const startGame = useCallback(async (
    mode: FantasyPlayMode, 
    speedMultiplier: number = 1.0,
    transposeOpts?: { keyOffset: number; repeatKeyChange: RepeatKeyChange }
  ) => {
    // 初期化が完了していない場合は待機
    if (!isInitialized && initPromiseRef.current) {
      await initPromiseRef.current;
    }
    
    // 速度を設定
    setSelectedSpeedMultiplier(speedMultiplier);
    
    onPlayModeChange(mode);
    readyStartTimeRef.current = performance.now();
    setIsReady(true);
    setIsGameReady(false); // リセット
    
    // 移調設定を構築（練習モードかつprogression_timingの場合のみ）
    const transposeSettings: TransposeSettings | undefined = 
      (mode === 'practice' && stage.mode === 'progression_timing' && transposeOpts)
        ? { keyOffset: transposeOpts.keyOffset, repeatKeyChange: transposeOpts.repeatKeyChange }
        : undefined;
    
    // 🚀 画像プリロードを含むゲーム初期化を待機
    // Ready画面表示中にロードが完了する
    const stageWithSettings = buildInitStage(speedMultiplier, transposeSettings);
    await initializeGame(stageWithSettings, mode);
    setIsGameReady(true); // 画像プリロード完了
  }, [buildInitStage, initializeGame, onPlayModeChange, isInitialized, stage.mode]);

  // デイリーチャレンジ: タイムリミットで終了
  useEffect(() => {
    if (!isDailyChallenge) return;
    if (hasTimeUpFiredRef.current) return;
    if (isReady) return; // Ready終了後に開始
    if (!gameState.isGameActive) return;
    // 練習モード（無限時間）の場合はタイマーを動作させない
    if (timeLimitSeconds === Infinity) return;

    const startMs = performance.now();
    const tick = () => {
      const elapsedSeconds = (performance.now() - startMs) / 1000;
      const next = Math.max(0, Math.ceil(timeLimitSeconds - elapsedSeconds));
      setRemainingSeconds(next);

      if (next <= 0 && !hasTimeUpFiredRef.current) {
        hasTimeUpFiredRef.current = true;
        try {
          stopGame();
        } catch {}
        setOverlay({ text: 'Finish' });
        setTimeout(() => {
          setOverlay(null);
          const s = gameStateRef.current;
          if (!s) return;
          onGameCompleteRef.current('clear', s.score, s.correctAnswers, s.totalQuestions, s.playerHp, stage.maxHp);
        }, 800);
      }
    };

    tick();
    const intervalId = setInterval(tick, 200);
    return () => clearInterval(intervalId);
  }, [isDailyChallenge, isReady, gameState.isGameActive, timeLimitSeconds, stopGame]);
  
  // MIDI/音声入力のハンドリング
  // 🚀 パフォーマンス最適化: 動的インポートを完全に削除
  const handleNoteInputBridge = useCallback((note: number, source: 'mouse' | 'midi' = 'mouse') => {
    // 高速化: AudioContext が停止している場合のみ再開を試みる (非同期実行)
    if ((window as any).Tone?.context?.state !== 'running') {
       (window as any).Tone?.start?.().catch(() => {});
    }

    // マウスクリック時のみ重複チェック（MIDI経由ではスキップしない）
    if (source === 'mouse' && activeNotesRef.current.has(note)) {
      return;
    }
    
    // クリック時にも音声を再生（静的インポート済みのplayNote使用）
    if (source === 'mouse') {
      // fire-and-forget で呼び出し
      playNote(note, 64).catch(() => {});
      activeNotesRef.current.add(note);
    }
    
    // ファンタジーゲームエンジンにのみ送信
    engineHandleNoteInput(note);
    
    // FantasySoundManagerのアンロックは低優先度で実行（静的インポート済み）
    if (source === 'mouse') {
      setTimeout(() => {
        FantasySoundManager.unlock().catch(() => {});
      }, 0);
    }
  }, [engineHandleNoteInput]);
  
  // handleNoteInputBridgeが定義された後にRefを更新
  useEffect(() => {
    handleNoteInputRef.current = handleNoteInputBridge;
  }, [handleNoteInputBridge]);
  
  // PIXI.jsレンダラーの準備完了ハンドラー
  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    setPixiRenderer(renderer);
    
    if (renderer) {
      // ファンタジーモード用の設定を適用
      const screenWidth = window.innerWidth;
      
      // Piano.tsと同じ白鍵幅計算方法を使用
      const minNote = 21; // A0
      const maxNote = 108; // C8
      let totalWhiteKeys = 0;
      
      // 黒鍵判定関数
      const isBlackKey = (midiNote: number): boolean => {
        const noteInOctave = midiNote % 12;
        return [1, 3, 6, 8, 10].includes(noteInOctave);
      };
      
      // 白鍵の総数を計算
      for (let note = minNote; note <= maxNote; note++) {
        if (!isBlackKey(note)) {
          totalWhiteKeys++;
        }
      }
      
      // 画面幅に基づいて白鍵幅を計算
      const whiteKeyWidth = screenWidth / totalWhiteKeys;
      const dynamicNoteWidth = Math.max(whiteKeyWidth - 2, 16); // 最小16px
      
        renderer.updateSettings({
          noteNameStyle: keyboardNoteNameStyle,
          simpleDisplayMode: true, // シンプル表示モードを有効
          pianoHeight: 120, // ファンタジーモード用に大幅に縮小
          noteHeight: 16, // 音符の高さも縮小
          noteWidth: dynamicNoteWidth,
          transpose: 0,
          transposingInstrument: 'concert_pitch',
          practiceGuide: effectiveShowGuide ? 'key' : 'off', // ガイド表示設定に基づく
          showHitLine: false, // ヒットラインを非表示
          viewportHeight: 120, // pianoHeightと同じ値に設定してノーツ下降部分を完全に非表示
          timingAdjustment: 0
        });

      // レイアウト反映後にC4を中央へ
      requestAnimationFrame(() => {
        // iOS Safari 対策で二重に呼ぶ
        requestAnimationFrame(centerPianoC4);
      });
      
      // キーボードのクリックイベントを接続
      // 🚀 パフォーマンス最適化: 動的インポートを削除
      renderer.setKeyCallbacks(
        (note: number) => {
          handleNoteInputBridge(note, 'mouse'); // マウスクリックとして扱う
        },
        (note: number) => {
          // マウスリリース時に音を止める（静的インポート済み）
          stopNote(note);
          activeNotesRef.current.delete(note);
        }
      );
      
      // MIDIControllerにキーハイライト機能を設定（通常プレイと同様の処理）
      if (midiControllerRef.current) {
        midiControllerRef.current.setKeyHighlightCallback((note: number, active: boolean) => {
          renderer.highlightKey(note, active);
        });
      }
    }
  }, [handleNoteInputBridge, effectiveShowGuide, keyboardNoteNameStyle]);

  // ファンタジーPIXIレンダラーの準備完了ハンドラー
  const handleFantasyPixiReady = useCallback((instance: FantasyPIXIInstance) => {
    setFantasyPixiInstance(instance);
    // 初期状態の太鼓モードを設定
    instance.updateTaikoMode(gameState.isTaikoMode);
    isTaikoModeRef.current = gameState.isTaikoMode;
  }, [gameState.isTaikoMode]);

  // 鍵盤上の音名表示設定変更時にレンダラーを更新
  useEffect(() => {
    if (pixiRenderer) {
      pixiRenderer.updateSettings({
        noteNameStyle: keyboardNoteNameStyle
      });
    }
  }, [keyboardNoteNameStyle, pixiRenderer]);
  
  // 魔法名表示ハンドラー - 削除（パフォーマンス改善のため）
  
  // モンスター撃破時のコールバック（状態機械対応）
  const handleMonsterDefeated = useCallback(() => {
    // アニメーションが終わったので、エンジンに次の敵へ進むよう命令する
    proceedToNextEnemy();
  }, [proceedToNextEnemy]);
  
  // FontAwesome使用のため削除済み
  
  // ゲームエリアのリサイズ対応
  useEffect(() => {
    if (!gameAreaRef.current) return;

    const updateSize = () => {
      if (!gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      const newSize = {
        width: Math.max(rect.width || window.innerWidth, window.innerWidth), // 画面幅を基準に設定
        height: 120 // ★★★ 高さを120pxに固定 ★★★
      };
      setGameAreaSize(newSize);
    };

    // 初回サイズ取得
    updateSize();

    // ResizeObserver でコンテナサイズ変化を監視
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateSize);
    });
    
    observer.observe(gameAreaRef.current);

    return () => observer.disconnect();
  }, []);

  // 敵が変更された時にモンスタースプライトを更新（状態機械対応）
  useEffect(() => {
    if (fantasyPixiInstance && primaryMonsterIcon) {
      // 状態機械のガード処理により、適切なタイミングでのみモンスターが生成される
      // 遅延処理は不要になった（状態機械が適切なタイミングを制御）
      fantasyPixiInstance.createMonsterSprite(primaryMonsterIcon);
    }
  }, [fantasyPixiInstance, primaryMonsterIcon, gameState.currentEnemyIndex]);
  
  // 太鼓モードの切り替えを監視
  useEffect(() => {
    if (fantasyPixiInstance) {
      fantasyPixiInstance.updateTaikoMode(gameState.isTaikoMode);
      isTaikoModeRef.current = gameState.isTaikoMode;
    }
  }, [fantasyPixiInstance, gameState.isTaikoMode]);
  
  // 🚀 パフォーマンス最適化: 太鼓ノーツ更新用のrefを追加（useEffectの依存配列から除外するため）
  const taikoNotesRef = useRef(gameState.taikoNotes);
  const currentNoteIndexRef = useRef(gameState.currentNoteIndex);
  const awaitingLoopStartRef = useRef(gameState.awaitingLoopStart);
  // 移調設定用のref
  const transposeSettingsRef = useRef(gameState.transposeSettings);
  const originalTaikoNotesRef = useRef(gameState.originalTaikoNotes);
  const currentTransposeOffsetRef = useRef(gameState.currentTransposeOffset);
  const taikoLoopCycleRef = useRef(gameState.taikoLoopCycle);
  
  // taikoNotes/currentNoteIndex/awaitingLoopStart/移調設定が変更されたらrefを更新（アニメーションループはそのまま継続）
  useEffect(() => {
    taikoNotesRef.current = gameState.taikoNotes;
    currentNoteIndexRef.current = gameState.currentNoteIndex;
    awaitingLoopStartRef.current = gameState.awaitingLoopStart;
    transposeSettingsRef.current = gameState.transposeSettings;
    originalTaikoNotesRef.current = gameState.originalTaikoNotes;
    currentTransposeOffsetRef.current = gameState.currentTransposeOffset;
    taikoLoopCycleRef.current = gameState.taikoLoopCycle;
  }, [gameState.taikoNotes, gameState.currentNoteIndex, gameState.awaitingLoopStart, gameState.transposeSettings, gameState.originalTaikoNotes, gameState.currentTransposeOffset, gameState.taikoLoopCycle]);

  // 太鼓の達人モードのノーツ表示更新（最適化版）
  // 🚀 パフォーマンス最適化: ステート変更時にアニメーションループを再起動しない
  useEffect(() => {
    if (!fantasyPixiInstance || !gameState.isTaikoMode) return;
    // 初期化時にノーツがない場合もループは開始（後からノーツが追加される可能性があるため）
    
    let animationId: number;
    let lastUpdateTime = 0;
    const updateInterval = 1000 / 60; // 60fps
    
    // ループ情報を事前計算
    const stageData = gameState.currentStage;
    if (!stageData) return;
    const secPerBeat = 60 / (stageData.bpm || 120);
    const secPerMeasure = secPerBeat * (stageData.timeSignature || 4);
    const loopDuration = (stageData.measureCount || 8) * secPerMeasure;

    // Overlay markers: lyricDisplay（歌詞）を優先、なければtext（Harmony）を使用
    // lyricDisplayは継続表示されるため、変化があった時点のみマーカーとして追加
    const overlayMarkers: Array<{ time: number; text: string }> = (() => {
      if (!Array.isArray((stage as any).chordProgressionData)) return [];
      
      const data = (stage as any).chordProgressionData as Array<any>;
      const markers: Array<{ time: number; text: string }> = [];
      let lastLyricDisplay: string | null = null;
      
      // 時間順にソートしてから処理
      const sortedData = [...data].sort((a, b) => {
        const timeA = (a.bar - 1) * secPerMeasure + ((a.beats ?? 1) - 1) * secPerBeat;
        const timeB = (b.bar - 1) * secPerMeasure + ((b.beats ?? 1) - 1) * secPerBeat;
        return timeA - timeB;
      });
      
      for (const it of sortedData) {
        if (!it) continue;
        const time = (it.bar - 1) * secPerMeasure + ((it.beats ?? 1) - 1) * secPerBeat;
        
        // lyricDisplayが変化した場合のみマーカーを追加
        if (it.lyricDisplay && it.lyricDisplay !== lastLyricDisplay) {
          markers.push({ time, text: it.lyricDisplay });
          lastLyricDisplay = it.lyricDisplay;
        }
        // lyricDisplayがなくtextがある場合（Harmony）はtextを使用
        else if (!it.lyricDisplay && typeof it.text === 'string' && it.text.trim() !== '') {
          markers.push({ time, text: it.text });
        }
      }
      
      return markers;
    })();
    
    const updateTaikoNotes = (timestamp: number) => {
      // フレームレート制御
      if (timestamp - lastUpdateTime < updateInterval) {
        animationId = requestAnimationFrame(updateTaikoNotes);
        return;
      }
      lastUpdateTime = timestamp;
      
      // 🚀 パフォーマンス最適化: refから最新の値を取得（useEffectの再起動なしに最新値を参照）
      const taikoNotes = taikoNotesRef.current;
      const currentNoteIndex = currentNoteIndexRef.current;
      const isAwaitingLoop = awaitingLoopStartRef.current;
      
      // ノーツがない場合は何も表示せずに次フレームへ
      if (taikoNotes.length === 0) {
        fantasyPixiInstance.updateTaikoNotes([]);
        animationId = requestAnimationFrame(updateTaikoNotes);
        return;
      }
      
      const currentTime = bgmManager.getCurrentMusicTime();
      const judgeLinePos = fantasyPixiInstance.getJudgeLinePosition();
      const lookAheadTime = 4; // 4秒先まで表示
      const noteSpeed = 200; // ピクセル/秒（視認性向上のため減速）
      
      // カウントイン中は複数ノーツを先行表示
      if (currentTime < 0) {
        const notesToDisplay: Array<{id: string, chord: string, x: number, noteNames?: string[]}> = [];
        const maxPreCountNotes = 6;
        for (let i = 0; i < taikoNotes.length; i++) {
          const note = taikoNotes[i];
          const timeUntilHit = note.hitTime - currentTime; // currentTime は負値
          if (timeUntilHit > lookAheadTime) break;
          if (timeUntilHit >= -0.5) {
            const x = judgeLinePos.x + timeUntilHit * noteSpeed;
            notesToDisplay.push({ 
              id: note.id, 
              chord: note.chord.displayName, 
              x,
              noteNames: note.chord.noteNames 
            });
            if (notesToDisplay.length >= maxPreCountNotes) break;
          }
        }
        fantasyPixiInstance.updateTaikoNotes(notesToDisplay);
        animationId = requestAnimationFrame(updateTaikoNotes);
        return;
      }
      
      // 表示するノーツを収集
      const notesToDisplay: Array<{id: string, chord: string, x: number, noteNames?: string[]}> = [];
      
      // 現在の時間（カウントイン中は負値）をループ内0..Tへ正規化
      const normalizedTime = ((currentTime % loopDuration) + loopDuration) % loopDuration;
      
      // 通常のノーツ（現在ループのみ表示）
      if (!isAwaitingLoop) {
        taikoNotes.forEach((note, index) => {
          // ヒット済みノーツは現在ループでは表示しない（次ループのプレビューには表示される）
          if (note.isHit) return;

          // 既にこのループで消化済みのインデックスは表示しない（復活防止）
          if (index < currentNoteIndex) return;

          // 現在ループ基準の時間差
          const timeUntilHit = note.hitTime - normalizedTime;

          // 判定ライン左側も少しだけ表示
          const lowerBound = -0.35;

          // 表示範囲内のノーツ（現在ループのみ）
          if (timeUntilHit >= lowerBound && timeUntilHit <= lookAheadTime) {
            const x = judgeLinePos.x + timeUntilHit * noteSpeed;
            notesToDisplay.push({
              id: note.id,
              chord: note.chord.displayName,
              x,
              noteNames: note.chord.noteNames
            });
          }
        });
      }
      
      // すでに通常ノーツで表示予定のベースID集合（プレビューと重複させない）
      const displayedBaseIds = new Set(notesToDisplay.map(n => n.id));
      
      // 次ループのプレビュー表示
      // ループ境界までの時間を計算
      const timeToLoop = loopDuration - normalizedTime;
      
      // 次ループのノーツを先読み表示する条件:
      // 1. awaitingLoopStart状態（現在ループの全ノーツ消化済み）
      // 2. ループ境界が近い（lookAheadTime以内）
      const shouldShowNextLoopPreview = isAwaitingLoop || timeToLoop < lookAheadTime;
      
      if (shouldShowNextLoopPreview && taikoNotes.length > 0) {
        // 移調設定がある場合、次のリピートサイクルの移調オフセットを計算
        const transposeSettings = transposeSettingsRef.current;
        const originalNotes = originalTaikoNotesRef.current;
        const currentLoopCycle = taikoLoopCycleRef.current ?? 0;
        
        // 次のループで使用するノーツを決定
        let nextLoopNotes = taikoNotes;
        if (transposeSettings && originalNotes.length > 0) {
          // 次のリピートサイクルの移調オフセットを計算
          const nextLoopCycle = currentLoopCycle + 1;
          const nextTransposeOffset = calculateTransposeOffset(
            transposeSettings.keyOffset,
            nextLoopCycle,
            transposeSettings.repeatKeyChange
          );
          // 元のノーツに次の移調を適用
          nextLoopNotes = transposeTaikoNotes(originalNotes, nextTransposeOffset);
        }
        
        for (let i = 0; i < nextLoopNotes.length; i++) {
          const note = nextLoopNotes[i];
          const baseNote = taikoNotes[i]; // 元のノーツのIDでチェック

          // すでに通常ノーツで表示しているものは重複させない
          if (baseNote && displayedBaseIds.has(baseNote.id)) continue;

          // 次ループの仮想的なヒット時間を計算
          const virtualHitTime = note.hitTime + loopDuration;
          const timeUntilHit = virtualHitTime - normalizedTime;

          // 現在より過去とみなせるものは描画しない
          if (timeUntilHit <= 0) continue;
          // lookAheadTime先までを表示（プレビュー範囲を拡大）
          if (timeUntilHit > lookAheadTime) break;

          const x = judgeLinePos.x + timeUntilHit * noteSpeed;
          notesToDisplay.push({
            id: `${note.id}_loop`,
            chord: note.chord.displayName,
            x,
            noteNames: note.chord.noteNames
          });
        }
      }
      
      // PIXIレンダラーに更新を送信
      fantasyPixiInstance.updateTaikoNotes(notesToDisplay);

      // オーバーレイテキスト（Harmony由来の text を拍に紐付け、次の text まで持続）
      if (overlayMarkers.length > 0) {
        const t = normalizedTime;
        // 現在の text を探索（wrap対応）
        let label = overlayMarkers[overlayMarkers.length - 1].text; // デフォルトは最後（wrap）
        for (let i = 0; i < overlayMarkers.length; i++) {
          const cur = overlayMarkers[i];
          const next = overlayMarkers[i + 1];
          if (t >= cur.time && (!next || t < next.time)) {
            label = cur.text;
            break;
          }
          if (t < overlayMarkers[0].time) {
            // ループ開始〜最初の text までは最後の text を継続
            label = overlayMarkers[overlayMarkers.length - 1].text;
          }
        }
        fantasyPixiInstance.updateOverlayText(label || null);
      } else {
        fantasyPixiInstance.updateOverlayText(null);
      }
      
      animationId = requestAnimationFrame(updateTaikoNotes);
    };
    
    // 初回実行
    animationId = requestAnimationFrame(updateTaikoNotes);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
    // 🚀 パフォーマンス最適化: taikoNotes/currentNoteIndex/awaitingLoopStartを依存配列から除外
    // これらはrefで参照するため、変更時にアニメーションループが再起動されない
  }, [gameState.isTaikoMode, fantasyPixiInstance, gameState.currentStage]);
  
  // 設定変更時にPIXIレンダラーを更新（鍵盤ハイライトは条件付きで有効）
  useEffect(() => {
    if (!pixiRenderer) return;
    const canGuide = effectiveShowGuide && gameState.simultaneousMonsterCount === 1;
    pixiRenderer.updateSettings({ practiceGuide: canGuide ? 'key' : 'off' });
  }, [pixiRenderer, effectiveShowGuide, gameState.simultaneousMonsterCount, stage.mode]);

  // 問題が変わったタイミングでハイライトを確実にリセット
  useEffect(() => {
    if (!pixiRenderer) return;
    // progression/single 共通：押下中のオレンジは保持。ガイドのみクリア。
    (pixiRenderer as any).setGuideHighlightsByMidiNotes?.([]);
  }, [pixiRenderer, gameState.currentChordTarget, gameState.currentNoteIndex]);

  // ガイド用ハイライト更新（showGuideが有効かつ同時出現数=1のときのみ）
  useEffect(() => {
    if (!pixiRenderer) return;
    const canGuide = effectiveShowGuide && gameState.simultaneousMonsterCount === 1;
    const setGuideMidi = (midiNotes: number[]) => {
      (pixiRenderer as any).setGuideHighlightsByMidiNotes?.(midiNotes);
    };
    if (!canGuide) {
      // ガイドだけ消す（演奏中オレンジは維持）
      setGuideMidi([]);
      return;
    }
    
    // 太鼓モードの場合は taikoNotes[currentNoteIndex] から直接取得
    let chord;
    if (gameState.isTaikoMode && gameState.taikoNotes.length > 0) {
      // awaitingLoopStart状態の場合、次のループの最初のノーツ（移調後）を表示
      if (gameState.awaitingLoopStart && gameState.transposeSettings && gameState.originalTaikoNotes.length > 0) {
        // 次のリピートサイクルの移調オフセットを計算
        const nextLoopCycle = (gameState.taikoLoopCycle ?? 0) + 1;
        const nextTransposeOffset = calculateTransposeOffset(
          gameState.transposeSettings.keyOffset,
          nextLoopCycle,
          gameState.transposeSettings.repeatKeyChange
        );
        // 元のノーツに次の移調を適用
        const nextLoopNotes = transposeTaikoNotes(gameState.originalTaikoNotes, nextTransposeOffset);
        // 次のループの最初のノーツを取得
        chord = nextLoopNotes[0]?.chord;
      } else {
        // 通常時: 現在のノーツを表示
        const currentNote = gameState.taikoNotes[gameState.currentNoteIndex];
        chord = currentNote?.chord;
      }
    } else {
      // 通常モード: activeMonsters または currentChordTarget を参照
      const targetMonster = gameState.activeMonsters?.[0];
      chord = targetMonster?.chordTarget || gameState.currentChordTarget;
    }
    
    if (!chord) {
      setGuideMidi([]);
      return;
    }
    // 差分適用のみ（オレンジは残る）
    setGuideMidi(chord.notes as number[]);
  }, [pixiRenderer, effectiveShowGuide, gameState.simultaneousMonsterCount, gameState.activeMonsters, gameState.currentChordTarget, gameState.isTaikoMode, gameState.taikoNotes, gameState.currentNoteIndex, gameState.awaitingLoopStart, gameState.transposeSettings, gameState.originalTaikoNotes, gameState.taikoLoopCycle]);

  // 正解済み鍵盤のハイライト更新（Singleモードのみ、赤色で保持）
  // ※モンスターが複数いる場合は非表示にする
  useEffect(() => {
    if (!pixiRenderer) return;
    // Singleモードでのみ有効
    if (stage.mode !== 'single') {
      (pixiRenderer as any).clearCorrectHighlights?.();
      return;
    }
    // モンスターが複数いる場合は正解ハイライトを非表示
    if (gameState.simultaneousMonsterCount > 1) {
      (pixiRenderer as any).clearCorrectHighlights?.();
      return;
    }
    const targetMonster = gameState.activeMonsters?.[0];
    const chord = targetMonster?.chordTarget || gameState.currentChordTarget;
    const correctNotes = targetMonster?.correctNotes || [];
    
    if (!chord || correctNotes.length === 0) {
      (pixiRenderer as any).clearCorrectHighlights?.();
      return;
    }
    
    // ガイド表示位置のオクターブの音のみハイライト
    // chord.notesはガイド用のMIDI番号を含む
    const correctMidiNotes: number[] = [];
    correctNotes.forEach((noteMod12: number) => {
      // chord.notes内で同じpitch class（mod 12）を持つMIDI番号を探す
      chord.notes.forEach((midiNote: number) => {
        if (midiNote % 12 === noteMod12) {
          correctMidiNotes.push(midiNote);
        }
      });
    });
    
    (pixiRenderer as any).setCorrectHighlightsByMidiNotes?.(correctMidiNotes);
  }, [pixiRenderer, stage.mode, gameState.activeMonsters, gameState.currentChordTarget, gameState.simultaneousMonsterCount]);

  // 問題が変わったら正解済みハイライトをリセット
  useEffect(() => {
    if (!pixiRenderer) return;
    (pixiRenderer as any).clearCorrectHighlights?.();
  }, [pixiRenderer, gameState.currentChordTarget, gameState.currentNoteIndex]);
  
  // HPハート表示（プレイヤーと敵の両方を赤色のハートで表示）
  const renderHearts = useCallback((hp: number, maxHp: number, isPlayer: boolean = true) => {
    if (maxHp >= 6) {
      return (
        <span className={cn(
          "text-2xl text-red-500 font-bold transition-all duration-300",
          heartFlash && isPlayer ? "animate-pulse brightness-150" : ""
        )}>
          ♥×{hp}
        </span>
      );                                    // ★★★ add
    }
    
    const hearts = [];
    
    for (let i = 0; i < maxHp; i++) {
      hearts.push(
        <span key={i} className={cn(
          "text-2xl transition-all duration-300 drop-shadow-sm",
          i < hp 
            ? "text-red-500" // プレイヤーも敵も赤いハート
            : "text-gray-400", // 空のハートは薄いグレー
          heartFlash && isPlayer && i < hp ? "animate-pulse brightness-150" : ""
        )}>
          {i < hp ? "♥" : "♡"}
        </span>
      );
    }
    return hearts;
  }, [heartFlash]);
  
  // 敵のゲージ表示（黄色系）
  const renderEnemyGauge = useCallback(() => {
    return (
      <div className="w-48 h-6 bg-gray-700 border-2 border-gray-600 rounded-full mt-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full transition-all duration-200 ease-out"
          style={{ 
            width: `${Math.min(gameState.enemyGauge, 100)}%`,
            boxShadow: gameState.enemyGauge > 80 ? '0 0 10px rgba(245, 158, 11, 0.6)' : 'none'
          }}
        />
      </div>
    );
  }, [gameState.enemyGauge]);
  
  // NEXTコード表示（コード進行モード用）
  const getNextChord = useCallback(() => {
    if (!stage.mode.startsWith('progression') || !stage.chordProgression) return null;
    const nextIndex = (gameState.currentQuestionIndex + 1) % stage.chordProgression.length;
    const spec = stage.chordProgression[nextIndex] as any;
    return typeof spec === 'string' ? spec : spec?.chord ?? '';
  }, [stage.mode, stage.chordProgression, gameState.currentQuestionIndex]);
  
  // SPゲージ表示
  const renderSpGauge = useCallback((sp: number) => {
    const spBlocks = [];
    for (let i = 0; i < 5; i++) {
      spBlocks.push(
        <div
          key={i}
          className={cn(
            "w-10 h-3 rounded transition-all duration-300",
            i < sp ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]' : 'bg-gray-600'
          )}
        />
      );
    }
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-bold text-yellow-300">SP</span>
        {spBlocks}
      </div>
    );
  }, []);
  
  // ★ マウント時 autoStart なら即開始（速度倍率を考慮）
  useEffect(() => {
    if (autoStart) {
      startGame(playMode, autoStartSpeedMultiplier, { keyOffset: transposeKeyOffset, repeatKeyChange });
    }
  }, [autoStart, playMode, autoStartSpeedMultiplier, startGame, transposeKeyOffset, repeatKeyChange]);

  // ゲーム開始前画面（オーバーレイ表示中は表示しない）
  if (!overlay && !gameState.isCompleting && (!gameState.isGameActive || !gameState.currentChordTarget)) {
    // progressionモードかどうかを判定
    const isProgressionMode = stage.mode.startsWith('progression');
    
    return (
      <div className="min-h-[var(--dvh,100dvh)] bg-black flex items-center justify-center fantasy-game-screen overflow-y-auto">
        <div className="text-white text-center max-w-md px-4 py-6 my-auto">
          <div className="text-6xl mb-6">🎮</div>
            <h2 className="text-3xl font-bold mb-4">
              {localizedStageName ?? (isEnglishCopy ? 'Title unavailable' : 'タイトル取得失敗')}
            </h2>
            <p className="text-gray-200 mb-6">
              {localizedStageDescription || (isEnglishCopy ? 'Description unavailable.' : '説明テキストを取得できませんでした')}
            </p>
          <div className="flex flex-col items-center gap-3">
            {/* 初期化中のローディング表示 */}
            {!isInitialized && (
              <div className="text-sm text-gray-400 mb-2 animate-pulse">
                {isEnglishCopy ? 'Loading...' : '読み込み中...'}
              </div>
            )}
            
            {/* 挑戦ボタン */}
            <button
              onClick={() => {
                startGame('challenge', 1.0);
              }}
              disabled={!isInitialized}
              className={cn(
                "w-full px-8 py-4 text-black font-bold text-xl rounded-lg shadow-lg transform transition-all",
                isInitialized 
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 hover:scale-105"
                  : "bg-gray-500 cursor-wait"
              )}
            >
              {isDailyChallenge 
                ? '🎯 挑戦する（2分）' 
                : (isEnglishCopy ? 'Challenge' : '挑戦')}
            </button>
            
            {/* 練習ボタン - progressionモードの場合は速度選択付き */}
            {isProgressionMode ? (
              <div className="w-full space-y-2">
                <div className="text-sm text-gray-400 mt-2">
                  {isEnglishCopy ? '🎹 Practice Mode' : '🎹 練習モード'}
                </div>
                
                {/* 移調練習設定（progression_timingモードの場合のみ表示） */}
                {stage.mode === 'progression_timing' && (
                  <div className="bg-gray-800/50 rounded-lg p-3 space-y-3 border border-gray-700">
                    <div className="text-sm text-yellow-300 font-medium">
                      🎹 {isEnglishCopy ? 'Transposition Practice' : '移調練習'}
                    </div>
                    
                    {/* 移調量ドロップダウン */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-300 min-w-[80px]">
                        {isEnglishCopy ? 'Transpose' : '移調'}:
                      </label>
                      <select
                        value={transposeKeyOffset}
                        onChange={(e) => setTransposeKeyOffset(parseInt(e.target.value, 10))}
                        className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                      >
                        {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(offset => (
                          <option key={offset} value={offset}>
                            {offset > 0 ? `+${offset}` : offset === 0 ? '0' : String(offset)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* リピートごとのキー変更 */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-300 min-w-[80px]">
                        {isEnglishCopy ? 'On Repeat' : 'リピート時'}:
                      </label>
                      <select
                        value={repeatKeyChange}
                        onChange={(e) => setRepeatKeyChange(e.target.value as RepeatKeyChange)}
                        className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
                      >
                        <option value="off">OFF ({isEnglishCopy ? 'No change' : '変更なし'})</option>
                        <option value="+1">+1 ({isEnglishCopy ? 'Half step up' : '半音ずつ上'})</option>
                        <option value="+5">+5 ({isEnglishCopy ? 'Perfect 4th up' : '完全4度ずつ上'})</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {/* 速度選択ドロップダウン + 練習開始ボタン */}
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-3 border border-gray-700">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-300 min-w-[60px]">
                      {isEnglishCopy ? 'Speed' : '速度'}:
                    </label>
                    <select
                      value={selectedSpeedMultiplier}
                      onChange={(e) => setSelectedSpeedMultiplier(parseFloat(e.target.value))}
                      className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-2 border border-gray-600"
                    >
                      <option value={1.0}>🎵 100% ({isEnglishCopy ? 'Normal' : '通常速度'})</option>
                      <option value={0.75}>🐢 75% ({isEnglishCopy ? 'Slow' : 'ゆっくり'})</option>
                      <option value={0.5}>🐌 50% ({isEnglishCopy ? 'Very Slow' : 'とてもゆっくり'})</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => {
                      startGame('practice', selectedSpeedMultiplier, { keyOffset: transposeKeyOffset, repeatKeyChange });
                    }}
                    disabled={!isInitialized}
                    className={cn(
                      "w-full px-6 py-3 font-bold rounded-lg shadow-lg transform transition-all border",
                      isInitialized 
                        ? "bg-green-600/80 hover:bg-green-500 border-green-400/50 hover:scale-[1.02]"
                        : "bg-gray-700 cursor-wait border-gray-600"
                    )}
                  >
                    <span className="text-white">{isEnglishCopy ? 'Start Practice' : '練習を開始'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* singleモードの場合は従来の練習ボタン */
              <button
                onClick={() => {
                  startGame('practice', 1.0);
                }}
                disabled={!isInitialized}
                className={cn(
                  "w-full px-8 py-3 text-white font-bold text-lg rounded-lg shadow-lg transform transition-all border border-white/20",
                  isInitialized 
                    ? "bg-white/10 hover:bg-white/20 hover:scale-105"
                    : "bg-gray-700 cursor-wait"
                )}
              >
                {isDailyChallenge 
                  ? '🎹 練習する（時間無制限）' 
                  : (isEnglishCopy ? 'Practice' : '練習する')}
              </button>
            )}
          </div>
          
          {/* デバッグ情報 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 bg-black bg-opacity-50 text-white text-xs p-3 rounded">
                <div>{isEnglishCopy ? 'Game state' : 'ゲーム状態'}: {gameState.isGameActive ? (isEnglishCopy ? 'Active' : 'アクティブ') : (isEnglishCopy ? 'Inactive' : '非アクティブ')}</div>
                <div>{isEnglishCopy ? 'Current chord' : '現在のコード'}: {gameState.currentChordTarget?.displayName || (isEnglishCopy ? 'None' : 'なし')}</div>
              <div>許可コード数: {stage.allowedChords?.length || 0}</div>
              {stage.mode === 'single' && <div>敵ゲージ秒数: {stage.enemyGaugeSeconds}</div>}
                <div>{isEnglishCopy ? 'Overlay' : 'オーバーレイ'}: {overlay ? (isEnglishCopy ? 'Visible' : '表示中') : (isEnglishCopy ? 'None' : 'なし')}</div>
                <div>{isEnglishCopy ? 'Completing' : '完了処理中'}: {gameState.isCompleting ? (isEnglishCopy ? 'Yes' : 'はい') : (isEnglishCopy ? 'No' : 'いいえ')}</div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      `${fitAllKeys ? 'h-full' : 'min-h-[var(--dvh,100dvh)]'} bg-black text-white relative overflow-hidden select-none flex flex-col fantasy-game-screen`
    )}>
      {/* ===== ヘッダー ===== */}
      <div className="relative z-30 p-1 text-white flex-shrink-0" style={{ minHeight: '40px' }}>
        {isDailyChallenge ? (
          <div className="flex items-center justify-between px-1">
            <div className="text-sm font-sans text-white">
              スコア <span className="text-yellow-300 font-bold">{gameState.correctAnswers}</span>
            </div>
            <div className="text-sm font-sans text-white">
              残り <span className="text-yellow-300 font-bold">
                {timeLimitSeconds === Infinity 
                  ? '∞' 
                  : `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`}
              </span>
            </div>
            {playMode === 'practice' && (
              <button
                onClick={onSwitchToChallenge}
                className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-xs font-bold transition-colors"
              >
                挑戦
              </button>
            )}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
            >
              ⚙️
            </button>
            <button
              onClick={onBackToStageSelect}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
            >
              戻る
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {/* 左: Measure/Beat 表示 */}
            <div className="text-sm text-yellow-300 font-sans">
              <>{bgmManager.getIsCountIn() ? 'Measure /' : `Measure ${currentMeasure}`} - B {currentBeat}</>
            </div>
            {/* 中: ステージ情報とモンスター数（残り） */}
            <div className="flex items-center space-x-4">
              <div className="text-sm font-bold">
                Stage {stage.stageNumber}
                {/* 低速モード表示 */}
                {selectedSpeedMultiplier < 1.0 && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-600 rounded text-xs">
                    {Math.round(selectedSpeedMultiplier * 100)}%
                  </span>
                )}
                {/* 移調量表示（progression_timingモードかつ移調設定がある場合） */}
                {gameState.transposeSettings && (
                  <span className="ml-2 px-2 py-0.5 bg-purple-600 rounded text-xs">
                    {gameState.currentTransposeOffset > 0 ? `+${gameState.currentTransposeOffset}` : gameState.currentTransposeOffset === 0 ? '0' : String(gameState.currentTransposeOffset)}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-300">
                モンスター数: {playMode === 'practice'
                  ? '∞'
                  : Math.max(0, (gameState.totalEnemies || stage.enemyCount || 0) - (gameState.enemiesDefeated || 0))
                }
              </div>
            </div>
            {/* 右: 戻る/設定ボタン */}
            <div className="flex items-center space-x-2">
              {playMode === 'practice' && (
                <button
                  onClick={onSwitchToChallenge}
                  className="px-2 py-1 bg-yellow-600 hover:bg-yellow-500 rounded text-xs font-bold transition-colors"
                >
                  {isEnglishCopy ? 'Challenge' : '挑戦'}
                </button>
              )}
              <button
                onClick={onBackToStageSelect}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
              >
                ステージ選択に戻る
              </button>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
              >
                ⚙️ 設定
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* ===== メインゲームエリア ===== */}
      <div className="flex-grow flex flex-col justify-center px-2 py-1 text-white text-center relative z-20" style={{ minHeight: '200px' }}>
        {/* ★★★ このエリアは削除します ★★★ */}
        {/* <div className="mb-1 text-center">
          ... (古いヒント表示エリア) ...
        </div>
        */}
        
        {/* ===== モンスター＋エフェクト描画エリア ===== */}
        <div className="mb-2 text-center relative w-full">
          <div
            ref={monsterAreaRef}
            className="relative w-full bg-black bg-opacity-20 rounded-lg overflow-hidden"
            style={{ height: `${monsterAreaHeight}px` }}
          >
            {/* 魔法名表示 - モンスターカード内に移動 */}
            <FantasyPIXIRenderer
              width={Math.max(monsterAreaWidth, 1)}   // 0 を渡さない
              height={monsterAreaHeight}
              monsterIcon={primaryMonsterIcon}
    
              enemyGauge={(isDailyChallenge || playMode === 'practice') ? 0 : gameState.enemyGauge}
              onReady={handleFantasyPixiReady}
              onMonsterDefeated={handleMonsterDefeated}
              className="w-full h-full"
              activeMonsters={gameState.activeMonsters}
              imageTexturesRef={imageTexturesRef}
            />
          </div>
          
          {/* モンスターの UI オーバーレイ */}
          <div className="mt-2">
            {gameState.activeMonsters && gameState.activeMonsters.length > 0 ? (
              // ★★★ 修正点: 絶対配置でPIXIレンダラーと同じx座標に配置 ★★★
              <div
                className="relative w-full mx-auto"
                style={{
                  // スマホ横画面ではUIエリアを圧縮
                  height: (window.innerWidth > window.innerHeight && window.innerWidth < 900)
                    ? 'min(80px,16vw)'
                    : 'min(120px,22vw)'
                }}
              >
                {gameState.activeMonsters
                  .sort((a, b) => a.position.localeCompare(b.position)) // 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'順でソート
                  .map((monster, index) => {
                    // モンスター数に応じて幅を動的に計算
                    const monsterCount = gameState.activeMonsters.length;
                    
                    // PIXIレンダラーと同じ計算でx座標を算出
                    const spacing = monsterAreaWidth / (monsterCount + 1);
                    const xPosition = spacing * (index + 1);
                    
                    // モバイル判定（768px未満）
                    const isMobile = window.innerWidth < 768;
                    
                    // 各アイテムの幅を計算
                    let itemWidth: number;
                    if (isMobile) {
                      if (monsterCount <= 3) {
                        itemWidth = Math.min(120, monsterAreaWidth * 0.3);
                      } else if (monsterCount <= 5) {
                        itemWidth = Math.min(80, monsterAreaWidth * 0.18);
                      } else {
                        itemWidth = Math.min(60, monsterAreaWidth * 0.12);
                      }
                    } else {
                      if (monsterCount <= 3) {
                        itemWidth = Math.min(220, monsterAreaWidth * 0.3);
                      } else if (monsterCount <= 5) {
                        itemWidth = Math.min(150, monsterAreaWidth * 0.18);
                      } else {
                        itemWidth = Math.min(120, monsterAreaWidth * 0.12);
                      }
                    }
                    
                    return (
                      <div 
                        key={monster.id}
                        // ★★★ 修正点: 絶対配置でx座標を指定 ★★★
                        className="absolute flex flex-col items-center"
                        style={{ 
                          left: `${xPosition}px`, 
                          transform: 'translateX(-50%)',
                          width: `${itemWidth}px`
                        }}
                      >
                      {/* 太鼓の達人モードまたは移調練習オプションON時は敵の下に何も表示しない */}
                      {!gameState.isTaikoMode && !gameState.transposeSettings && (
                        <>
                          {/* 通常モードの表示 */}
                          {/* 楽譜モード: 挑戦モードでは非表示、練習モードではオクターブなしで表示 */}
                          {stage.isSheetMusicMode ? (
                            playMode === 'practice' ? (
                              <div className={`text-yellow-300 font-bold text-center mb-1 truncate w-full ${
                                monsterCount > 5 ? 'text-sm' : monsterCount > 3 ? 'text-base' : 'text-xl'
                              }`}>
                                {/* オクターブを除去して表示 (例: "A#3" → "A#") */}
                                {monster.chordTarget.displayName.replace(/\d+$/, '')}
                              </div>
                            ) : null /* 挑戦モードでは音名を非表示 */
                          ) : (
                            /* 通常コードモードの表示 */
                            <div className={`text-yellow-300 font-bold text-center mb-1 truncate w-full ${
                              monsterCount > 5 ? 'text-sm' : monsterCount > 3 ? 'text-base' : 'text-xl'
                            }`}>
                              {monster.chordTarget.displayName}
                            </div>
                          )}
                          
                          {/* ヒント表示（楽譜モードでは非表示 - 単音なのでヒント不要） */}
                          {!isDailyChallenge && !stage.isSheetMusicMode && (
                            <div className={`mt-1 font-medium h-6 text-center ${
                              monsterCount > 5 ? 'text-xs' : 'text-sm'
                            }`}>
                            {monster.chordTarget.noteNames.map((noteName, index) => {
                              // 表示オプションを定義
                              const displayOpts: DisplayOpts = { lang: currentNoteNameLang, simple: currentSimpleNoteName };
                              // 表示用の音名に変換
                              const displayNoteName = toDisplayName(noteName, displayOpts);
                              
                              // 正解判定用にMIDI番号を計算 (tonal.jsを使用)
                              const noteObj = parseNote(noteName + '4'); // オクターブはダミー
                              const noteMod12 = noteObj.midi !== null ? noteObj.midi % 12 : -1;
                              
                              const isCorrect = monster.correctNotes.includes(noteMod12);

                              if (!effectiveShowGuide && !isCorrect) {
                                return (
                                  <span
                                    key={index}
                                    className={`mx-0.5 opacity-0 ${monsterCount > 5 ? '' : 'text-xs'}`}
                                    style={monsterCount > 5 ? { fontSize: '10px' } : undefined}
                                  >
                                    ?
                                  </span>
                                );
                              }
                              return (
                                                                <span
                                    key={index}
                                    className={`mx-0.5 ${monsterCount > 5 ? '' : 'text-xs'} ${isCorrect ? 'text-green-400 font-bold' : 'text-gray-300'}`}
                                    style={monsterCount > 5 ? { fontSize: '10px' } : undefined}
                                  >
                                    {displayNoteName}
                                    {isCorrect && '✓'}
                                  </span>
                              );
                            })}
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* 魔法名表示 - 削除（パフォーマンス改善のため） */}
                      
                      {/* 行動ゲージ (singleモードのみ表示) */}
                      {!isDailyChallenge && playMode !== 'practice' && stage.mode === 'single' && (
                        <div 
                          ref={el => {
                            if (el) gaugeRefs.current.set(monster.id, el);
                          }}
                          className="w-full h-2 bg-gray-700 border border-gray-600 rounded-full overflow-hidden relative mb-1"
                        >
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all duration-100"
                            style={{ width: `${monster.gauge}%` }}
                          />
                        </div>
                      )}
                      
                      {/* HPゲージ */}
                      {(() => {
                        const isLandscape = window.innerWidth > window.innerHeight;
                        // 横画面のモバイルではUI圧縮中だが、バーは従来より大きめに
                        const gaugeHeightClass = (isMobile && isLandscape)
                          ? (monsterCount > 5 ? 'h-4' : 'h-5')
                          : (monsterCount > 5 ? 'h-5' : 'h-6');
                        const textSizeClass = (isMobile && isLandscape)
                          ? (monsterCount > 5 ? 'text-xs' : 'text-sm')
                          : (monsterCount > 5 ? 'text-sm' : 'text-base');
                        return (
                          <div className={cn("w-full bg-gray-700 rounded-full overflow-hidden relative border-2 border-gray-600", gaugeHeightClass)}>
                            <div
                              className="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-300"
                              style={{ width: `${(monster.currentHp / monster.maxHp) * 100}%` }}
                            />
                            <div className={cn("absolute inset-0 flex items-center justify-center font-bold text-white drop-shadow", textSizeClass)}>
                              {monster.currentHp}/{monster.maxHp}
                            </div>
                          </div>
                        );
                                             })()}
                     </div>
                     );
                   })}
              </div>
            ) : null}
            
            {/* プレイヤーのHP表示とSPゲージ */}
          </div>
        </div>
        
        {/* NEXTコード表示（固定進行モードのみ、サイズを縮小） */}
        {stage.mode === 'progression_order' && getNextChord() && (
          <div className="mb-1 text-right">
            <div className="text-white text-xs">NEXT:</div>
            <div className="text-blue-300 text-sm font-bold">
              {getNextChord()}
            </div>
          </div>
        )}
      </div>
      
      {/* HP・SPゲージを固定配置 */}
      {!isDailyChallenge && (
        <div className="absolute left-2 bottom-2 z-50
                    pointer-events-none bg-black/40 rounded px-2 py-1">
          <div className="flex space-x-0.5">
            {renderHearts(gameState.playerHp, stage.maxHp)}
          </div>
        </div>
      )}
      {!isDailyChallenge && (
        <div className="absolute right-2 bottom-2 z-50
                    pointer-events-none bg-black/40 rounded px-2 py-1">
          {renderSpGauge(gameState.playerSp)}
        </div>
      )}
      
      {/* ===== 楽譜表示エリア（Progression_Timing用） ===== */}
      {showSheetMusicForTiming && (
        <div 
          className="mx-2 mb-1 rounded-lg overflow-hidden flex-shrink-0"
          style={{ height: `${sheetMusicHeight}px` }}
        >
          <FantasySheetMusicDisplay
            width={monsterAreaWidth || window.innerWidth - 16}
            height={sheetMusicHeight}
            musicXml={stage.musicXml || ''}
            bpm={stage.bpm || 120}
            timeSignature={stage.timeSignature || 4}
            measureCount={stage.measureCount || 8}
            countInMeasures={stage.countInMeasures || 0}
            transposeOffset={gameState.currentTransposeOffset || 0}
            nextTransposeOffset={
              // 移調設定がある場合、次のループの移調オフセットを計算
              gameState.transposeSettings
                ? calculateTransposeOffset(
                    gameState.transposeSettings.keyOffset,
                    (gameState.taikoLoopCycle ?? 0) + 1,
                    gameState.transposeSettings.repeatKeyChange
                  )
                : undefined
            }
            className="w-full h-full"
          />
        </div>
      )}
      
      {/* ===== ピアノ鍵盤エリア ===== */}
      <div 
        ref={gameAreaRef}
        className="relative mx-2 mb-1 bg-black bg-opacity-20 rounded-lg overflow-hidden flex-shrink-0 w-full"
        style={{ height: '120px' }} // ★★★ 高さを120pxに固定 ★★★
      >
        {(() => {
          // スクロール判定ロジック（GameEngine.tsxと同様）
          const VISIBLE_WHITE_KEYS = 14; // モバイル表示時の可視白鍵数
          const TOTAL_WHITE_KEYS = 52; // 88鍵中の白鍵数
          const gameAreaWidth = gameAreaRef.current?.clientWidth || window.innerWidth;
          const adjustedThreshold = 1100; // PC判定のしきい値
          
          let pixiWidth: number;
          let needsScroll: boolean;
          
          if (fitAllKeys) {
            // 全鍵盤を現在の幅にフィット（横スクロール無し）
            pixiWidth = gameAreaWidth;
            needsScroll = false;
          } else if (gameAreaWidth >= adjustedThreshold) {
            // PC等、画面が十分広い → 88鍵全表示（スクロール不要）
            pixiWidth = gameAreaWidth;
            needsScroll = false;
          } else {
            // モバイル等、画面が狭い → 横スクロール表示
            const whiteKeyWidth = gameAreaWidth / VISIBLE_WHITE_KEYS;
            pixiWidth = Math.ceil(TOTAL_WHITE_KEYS * whiteKeyWidth);
            needsScroll = true;
          }
          
          if (needsScroll) {
            // スクロールが必要な場合
            return (
              <div 
                className="absolute inset-0 overflow-x-auto overflow-y-hidden touch-pan-x custom-game-scrollbar" 
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollSnapType: 'none',
                  scrollBehavior: 'auto',
                  width: '100%',
                  touchAction: 'pan-x', // 横スクロールのみを許可
                  overscrollBehavior: 'contain' // スクロールの境界を制限
                }}
                onScroll={handlePianoScroll}
                ref={(el) => {
                  pianoScrollRef.current = el;
                  if (el) {
                    requestAnimationFrame(() => {
                      requestAnimationFrame(centerPianoC4);
                    });
                  }
                }}
              >
              <PIXINotesRenderer
                width={pixiWidth}
                height={120} // ★★★ 高さを120に固定 ★★★
                onReady={handlePixiReady}
                className="w-full h-full"
              />
              </div>
            );
          } else {
            // スクロールが不要な場合（全画面表示）
            return (
              <div className="absolute inset-0 overflow-hidden">
              <PIXINotesRenderer
                width={pixiWidth}
                height={120} // ★★★ 高さを120に固定 ★★★
                onReady={handlePixiReady}
                className="w-full h-full"
              />
              </div>
            );
          }
        })()}
        
        {/* 入力中のノーツ表示 */}
        
      </div>
      
      {/* エフェクト表示は削除 - PIXI側で処理 */}
      
      {/* デバッグ情報（FPSモニター削除済み） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white text-xs p-2 rounded z-40">
          <div>Q: {gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}</div>
          <div>HP: {gameState.playerHp}/{stage.maxHp}</div>
          {stage.mode === 'single' && playMode !== 'practice' && <div>ゲージ: {gameState.enemyGauge.toFixed(1)}%</div>}
          <div>スコア: {gameState.score}</div>
          <div>正解数: {gameState.correctAnswers}</div>
          <div>現在のコード: {gameState.currentChordTarget?.displayName || 'なし'}</div>
          <div>SP: {gameState.playerSp}</div>
          
          {/* ゲージ強制満タンテストボタン */}
          <button
            onClick={() => {
              // ゲージを100にして敵攻撃をトリガー
              if (playMode !== 'practice') {
                handleEnemyAttack();
              }
            }}
            className="mt-2 px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
          >
            敵攻撃テスト
          </button>
        </div>
      )}
      
      {/* 設定モーダル */}
      <FantasySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsChange={(newSettings) => {
          setCurrentNoteNameLang(newSettings.noteNameLang);
          setCurrentSimpleNoteName(newSettings.simpleNoteName);
          
          // 鍵盤上の音名表示設定が変更されたら更新
          if (newSettings.keyboardNoteNameStyle !== undefined) {
            setKeyboardNoteNameStyle(newSettings.keyboardNoteNameStyle);
          }
          
          // 鍵盤ガイド表示設定が変更されたら更新（デイリーチャレンジの練習モード時のみ）
          if (newSettings.showKeyboardGuide !== undefined) {
            setShowKeyboardGuide(newSettings.showKeyboardGuide);
          }
          
          // 🚀 パフォーマンス最適化: 動的インポートを削除
          // ピアノ音量設定が変更されたら、グローバル音量を更新
          if (newSettings.volume !== undefined) {
            // gameStoreの音量設定も更新
            updateSettings({ midiVolume: newSettings.volume });
            // グローバル音量を更新（静的インポート済み）
            updateGlobalVolume(newSettings.volume);
          }
          
          // 効果音音量設定が変更されたら、gameStoreを更新
          if (newSettings.soundEffectVolume !== undefined) {
            updateSettings({ soundEffectVolume: newSettings.soundEffectVolume });
            // FantasySoundManagerの音量も即座に更新（静的インポート済み）
            FantasySoundManager.setVolume(newSettings.soundEffectVolume);
          }
        }}
        // gameStoreの値を渡す
        midiDeviceId={settings.selectedMidiDevice}
        volume={settings.midiVolume} // gameStoreのMIDI音量を渡す
        soundEffectVolume={settings.soundEffectVolume} // gameStoreの効果音音量を渡す
        bgmVolume={settings.bgmVolume} // gameStoreのBGM音量を渡す
        noteNameLang={currentNoteNameLang}
        simpleNoteName={currentSimpleNoteName}
        keyboardNoteNameStyle={keyboardNoteNameStyle}
        // gameStoreを更新するコールバックを渡す
        onMidiDeviceChange={(deviceId) => updateSettings({ selectedMidiDevice: deviceId })}
        isMidiConnected={isMidiConnected}
        // デイリーチャレンジ用の追加props
        isDailyChallenge={isDailyChallenge}
        isPracticeMode={playMode === 'practice'}
        showKeyboardGuide={showKeyboardGuide}
      />
      
      {/* オーバーレイ表示 */}           {/* ★★★ add */}
      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <span className="font-sans text-6xl text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            {overlay.text}
          </span>
        </div>
      )}
      
      {/* Ready オーバーレイ */}
      {isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-[9998] bg-black/60">
          <span className="font-sans text-7xl text-white animate-pulse">
            Ready
          </span>
        </div>
      )}
    </div>
  );
};

export default FantasyGameScreen;