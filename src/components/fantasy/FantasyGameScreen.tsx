/**
 * ファンタジーゲームメイン画面
 * UI/UX要件に従ったゲーム画面の実装
 */

import React, { useState, useEffect, useCallback, useRef, useMemo, MutableRefObject } from 'react';
import { cn } from '@/utils/cn';
import { devLog } from '@/utils/logger';
import { MIDIController, playNote, stopNote, initializeAudioSystem, updateGlobalVolume } from '@/utils/MidiController';
import { VoiceInputController } from '@/utils/VoiceInputController';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { bgmManager } from '@/utils/BGMManager';
import { useFantasyGameEngine, ChordDefinition, FantasyStage, FantasyGameState, MonsterState, CombinedSection, type FantasyPlayMode } from './FantasyGameEngine';
import { TaikoRenderBridge } from './TaikoRenderBridge';
import { 
  TaikoNote, 
  ChordProgressionDataItem
} from './TaikoNoteSystem';
const LazyFantasySheetMusicDisplay = React.lazy(() => import('./FantasySheetMusicDisplay'));
import { countMusicXmlStaves } from '@/utils/musicXmlMapper';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '../game/PIXINotesRenderer';
import { FantasyPIXIRenderer, FantasyPIXIInstance } from './FantasyPIXIRenderer';
import FantasySettingsModal from './FantasySettingsModal';
import type { DisplayOpts } from '@/utils/display-note';
import { toDisplayName } from '@/utils/display-note';
import { note as parseNote } from 'tonal';
import { shouldUseEnglishCopy, getLocalizedFantasyStageName } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
// 🚀 パフォーマンス最適化: FantasySoundManagerを静的インポート
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { isIOSWebView, sendGameCallback } from '@/utils/iosbridge';
import { getWindow } from '@/platform';

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

// ===== 楽譜リサイズ設定 =====
const SHEET_HEIGHT_STORAGE_KEY_1 = 'fantasy_sheet_height_1staff';
const SHEET_HEIGHT_STORAGE_KEY_2 = 'fantasy_sheet_height_2staff';
const SHEET_HEIGHT_MIN = 80;
const SHEET_HEIGHT_MAX = 400;
const SHEET_HEIGHT_DEFAULT_1 = 180;
const SHEET_HEIGHT_DEFAULT_2 = 280;

function loadSheetMusicHeight(staves: number): number | null {
  try {
    const key = staves >= 2 ? SHEET_HEIGHT_STORAGE_KEY_2 : SHEET_HEIGHT_STORAGE_KEY_1;
    const saved = localStorage.getItem(key);
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val) && val >= SHEET_HEIGHT_MIN && val <= SHEET_HEIGHT_MAX) return val;
    }
  } catch { /* ignore */ }
  return null;
}

function saveSheetMusicHeight(staves: number, height: number): void {
  try {
    const key = staves >= 2 ? SHEET_HEIGHT_STORAGE_KEY_2 : SHEET_HEIGHT_STORAGE_KEY_1;
    localStorage.setItem(key, String(Math.round(height)));
  } catch { /* ignore */ }
}

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
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });
  const localizedStageName = useMemo(
    () => getLocalizedFantasyStageName(stage, { rank: profile?.rank, country: profile?.country ?? geoCountry }),
    [stage, profile?.rank, geoCountry],
  );
  // useGameStoreの使用を削除（ファンタジーモードでは不要）
  
  // エフェクト状態
  const [damageShake, setDamageShake] = useState(false);
  const [overlay, setOverlay] = useState<null | { text:string }>(null); // ★★★ add
  const [heartFlash, setHeartFlash] = useState(false); // ハートフラッシュ効果
  
  // 設定モーダル状態
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // ファンタジーモード設定のローカルストレージキー
  const FANTASY_SETTINGS_KEY = 'fantasyGameSettings';
  
  // ローカルストレージから設定を読み込む
  const loadFantasySettings = useCallback(() => {
    try {
      const stored = localStorage.getItem(FANTASY_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // エラーは無視
    }
    return null;
  }, []);
  
  // ローカルストレージに設定を保存する
  const saveFantasySettings = useCallback((settings: {
    noteNameLang: DisplayOpts['lang'];
    simpleNoteName: boolean;
    keyboardNoteNameStyle: 'off' | 'abc' | 'solfege';
    showKeyboardGuide: boolean;
  }) => {
    try {
      localStorage.setItem(FANTASY_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // エラーは無視
    }
  }, []);
  
  // 設定状態を管理（ローカルストレージから初期値を読み込み）
  // ガイド表示: 練習モードはデフォルトON（トグル可能）、挑戦モードは常にOFF
  const storedSettings = useMemo(() => loadFantasySettings(), [loadFantasySettings]);
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(() => storedSettings?.showKeyboardGuide ?? true); // 練習モードのデフォルト値
  const [currentNoteNameLang, setCurrentNoteNameLang] = useState<DisplayOpts['lang']>(() => storedSettings?.noteNameLang ?? noteNameLang);
  const [currentSimpleNoteName, setCurrentSimpleNoteName] = useState(() => storedSettings?.simpleNoteName ?? simpleNoteName);
  const [keyboardNoteNameStyle, setKeyboardNoteNameStyle] = useState<'off' | 'abc' | 'solfege'>(() => storedSettings?.keyboardNoteNameStyle ?? 'abc'); // 鍵盤上の音名表示

  // リズム譜表示: 管理画面のステージ設定から取得（本番・練習両方で適用）
  const useRhythmNotation = !!stage.useRhythmNotation;
  
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
  
  // 移調練習は廃止済み（移調済み譜面を別ステージで用意する方式に移行）

  // C&Rオーバーレイ状態
  const [crOverlay, setCrOverlay] = useState<string | null>(null);
  const crOverlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCrPhaseRef = useRef<string | null>(null);
  
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
      // Ready状態は「1秒経過 AND 画像プリロード完了」で解除
      const timeElapsed = readyStartTimeRef.current > 0 && performance.now() - readyStartTimeRef.current > 1000;
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
  const voiceControllerRef = useRef<VoiceInputController | null>(null);
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
  const [sheetMusicHeight, setSheetMusicHeight] = useState<number>(SHEET_HEIGHT_DEFAULT_1);
  const sheetMusicStavesRef = useRef<number>(1);
  const isResizingSheetRef = useRef(false);
  const resizeStartRef = useRef({ y: 0, height: 0 });
  const sheetMusicHeightRef = useRef(SHEET_HEIGHT_DEFAULT_1);
  // ユーザーが手動リサイズしたかどうか（trueなら画面リサイズ時にauto調整しない）
  const hasUserResizedRef = useRef(false);
  
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
      
      const initPromise = (async () => {
        try {
          // 1. ゲーム開始に必須な初期化のみブロッキング（オーディオ + GM音源）
          await Promise.all([
            initializeAudioSystem().then(() => {
              updateGlobalVolume(settings.midiVolume ?? 0.8);
            }),
            FantasySoundManager.waitForGMReady()
          ]);
          setIsInitialized(true);

          // 2. SE/MIDI 等の残り初期化はバックグラウンド（ゲーム開始をブロックしない）
          FantasySoundManager.init(
            settings.soundEffectVolume ?? 0.8,
            settings.rootSoundVolume ?? 0.5,
            stage?.playRootOnCorrect !== false
          ).then(() => {
            FantasySoundManager.enableRootSound(stage?.playRootOnCorrect !== false);
          }).catch(() => {});
          controller.initialize().catch(() => {});
        } catch (error) {
          console.error('Audio system initialization failed:', error);
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

  // 音声入力初期化（レジェンドモードと同様）
  useEffect(() => {
    if (settings.inputMethod !== 'voice') {
      if (voiceControllerRef.current) {
        void voiceControllerRef.current.disconnect();
      }
      return;
    }
    if (!settings.selectedAudioDevice) {
      if (voiceControllerRef.current) {
        void voiceControllerRef.current.disconnect();
      }
      return;
    }
    if (!VoiceInputController.isSupported()) return;

    const initVoiceInput = async () => {
      try {
        if (!voiceControllerRef.current) {
          voiceControllerRef.current = new VoiceInputController({
            onNoteOn: (note: number) => {
              if (handleNoteInputRef.current) {
                handleNoteInputRef.current(note, 'midi');
              }
              pixiRendererRef.current?.highlightKey(note, true);
              setTimeout(() => {
                pixiRendererRef.current?.highlightKey(note, false);
              }, 150);
            },
            onNoteOff: (note: number) => {
              pixiRendererRef.current?.highlightKey(note, false);
            },
            onConnectionChange: () => {},
            onError: () => {}
          });
          voiceControllerRef.current.setSensitivity(settings.voiceSensitivity);
        }
        if (settings.selectedAudioDevice) {
          const deviceId = settings.selectedAudioDevice === 'default' ? undefined : settings.selectedAudioDevice;
          await voiceControllerRef.current.connect(deviceId);
        }
      } catch {
        // エラー時はタッチ入力で続行可能
      }
    };
    void initVoiceInput();
  }, [settings.inputMethod, settings.selectedAudioDevice]);

  // 音声認識感度の反映
  useEffect(() => {
    if (voiceControllerRef.current) {
      voiceControllerRef.current.setSensitivity(settings.voiceSensitivity);
    }
  }, [settings.voiceSensitivity]);

  // 音声入力コントローラーのクリーンアップ
  useEffect(() => {
    return () => {
      if (voiceControllerRef.current) {
        voiceControllerRef.current.destroy();
        voiceControllerRef.current = null;
      }
    };
  }, []);

  // 入力方式切り替え時のMIDI/Voice切り替え処理
  useEffect(() => {
    if (settings.inputMethod === 'midi') {
      if (voiceControllerRef.current) {
        void voiceControllerRef.current.disconnect();
      }
      if (midiControllerRef.current && settings.selectedMidiDevice) {
        void midiControllerRef.current.connectDevice(settings.selectedMidiDevice);
      }
    } else if (settings.inputMethod === 'voice') {
      if (midiControllerRef.current) {
        midiControllerRef.current.disconnect();
      }
    }
    // iOS: 入力方式切り替え後にBGM音量が低下する問題への対策
    // AudioContext操作後に短い遅延を置いてBGM音量を再適用する
    const currentBgmVolume = settings.bgmVolume ?? 0.7;
    const timer = setTimeout(() => {
      if (bgmManager.getIsPlaying()) {
        bgmManager.setVolume(currentBgmVolume);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [settings.inputMethod, settings.selectedMidiDevice, settings.bgmVolume]);

  // 🚀 パフォーマンス最適化: ステージ設定に応じてルート音を有効/無効にする（動的インポート不要）
  useEffect(() => {
    // 明示的に false のときのみ無効化。未指定(undefined)は有効のまま
    FantasySoundManager.enableRootSound(stage?.playRootOnCorrect !== false);
  }, [stage?.playRootOnCorrect]);
  
  // PIXI.js レンダラー
  const [pixiRenderer, setPixiRenderer] = useState<PIXINotesRendererInstance | null>(null);
  const pixiRendererRef = useRef<PIXINotesRendererInstance | null>(null);
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

  const shiftPianoOctave = useCallback((direction: -1 | 1) => {
    const container = pianoScrollRef.current;
    if (!container) return;
    // オクターブシフトはユーザーの表示位置の意図として扱い、以降の centerPianoC4 で上書きしない
    hasUserScrolledRef.current = true;
    const TOTAL_WHITE_KEYS = 52;
    const whiteKeyWidth = container.scrollWidth / TOTAL_WHITE_KEYS;
    const octavePixels = whiteKeyWidth * 7;
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    const target = Math.max(0, Math.min(maxScroll, container.scrollLeft + direction * octavePixels));
    isProgrammaticScrollRef.current = true;
    container.scrollLeft = target;
    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, []);

  // インライン ref だと親の再レンダーのたびに ref が付け直され centerPianoC4 が毎回走り、スクロール位置が C4 に戻る
  const setPianoScrollContainerRef = useCallback((el: HTMLDivElement | null) => {
    pianoScrollRef.current = el;
    if (el) {
      requestAnimationFrame(() => {
        requestAnimationFrame(centerPianoC4);
      });
    }
  }, [centerPianoC4]);

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
  
  const handleChordCorrect = useCallback((chord: ChordDefinition, isSpecial: boolean, damageDealt: number, defeated: boolean, monsterId: string) => {
    if (fantasyPixiInstance) {
      fantasyPixiInstance.triggerAttackSuccessOnMonster(monsterId, chord.displayName, isSpecial, damageDealt, defeated);
      if (isTaikoModeRef.current) {
        const pos = fantasyPixiInstance.getJudgeLinePosition();
        fantasyPixiInstance.createNoteHitEffect(pos.x, pos.y, true);
      }
    }

    const allowRootSound = (stage as any)?.tier === 'phrases' || stage?.playRootOnCorrect !== false;
    if (allowRootSound) {
      const id = chord.id || chord.displayName || chord.root;
      let bassToPlay = chord.root;
      if (typeof id === 'string' && id.includes('/')) {
        const parts = id.split('/');
        if (parts[1]) bassToPlay = parts[1];
      }
      queueMicrotask(() => {
        FantasySoundManager.playRootNote(bassToPlay).catch(() => {});
      });
    }
  }, [fantasyPixiInstance, stage?.playRootOnCorrect]);
  
  const handleChordIncorrect = useCallback((_expectedChord: ChordDefinition, _inputNotes: number[]) => {
    // 不正解エフェクトは削除（音の積み重ね方式のため）
  }, []);
  
  const handleEnemyAttack = useCallback((_attackingMonsterId?: string) => {
    if (stage.mode === 'single' || stage.mode === 'single_order') {
      queueMicrotask(() => FantasySoundManager.playEnemyAttack());
    }
    
    setDamageShake(true);
    setTimeout(() => setDamageShake(false), 500);
    
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

  // 太鼓ノーツ表示ループ用 ref（エンジンより前に確保）
  const taikoNotesRef = useRef<TaikoNote[]>([]);
  const currentNoteIndexRef = useRef(0);
  const awaitingLoopStartRef = useRef(false);
  const taikoLoopCycleRef = useRef(0);
  const preHitNoteIndicesRef = useRef<number[]>([]);
  const isCombiningModeRef = useRef(false);
  const combinedSectionsRef = useRef<CombinedSection[]>([]);
  const currentSectionIndexRef = useRef(0);
  const handleTaikoVisualSync = useCallback((s: FantasyGameState) => {
    taikoNotesRef.current = s.taikoNotes;
    currentNoteIndexRef.current = s.currentNoteIndex;
    awaitingLoopStartRef.current = s.awaitingLoopStart;
    taikoLoopCycleRef.current = s.taikoLoopCycle;
    preHitNoteIndicesRef.current = s.preHitNoteIndices;
    isCombiningModeRef.current = s.isCombiningMode;
    combinedSectionsRef.current = s.combinedSections;
    currentSectionIndexRef.current = s.currentSectionIndex;
  }, []);
  
  // ★【最重要修正】 ゲームエンジンには、UIの状態を含まない初期stageを一度だけ渡す
  // これでガイドをON/OFFしてもゲームはリセットされなくなる
  const {
    gameState,
    handleNoteInput: engineHandleNoteInput,
    initializeGame,
    stopGame,
    getCurrentEnemy,
    proceedToNextEnemy,
    imageTexturesRef,
    flushToReact,
    ENEMY_LIST
  } = useFantasyGameEngine({
    stage: null, // ★★★ change
    onGameStateChange: handleGameStateChange,
    onTaikoVisualSync: handleTaikoVisualSync,
    onChordCorrect: handleChordCorrect,
    onChordIncorrect: handleChordIncorrect,
    onGameComplete: handleGameCompleteCallback,
    onEnemyAttack: handleEnemyAttack,
    displayOpts: { lang: 'en', simple: false }, // コードネーム表示は常に英語、簡易表記OFF
    isReady
  });

  // Progression_Timing用の楽譜表示フラグ
  // musicXmlが存在する場合のみOSMD楽譜を表示
  // timing_combining: 現在のセクションのmusicXmlを取得
  const currentSheetSection = useMemo(() => {
    if (stage.mode !== 'timing_combining' || !gameState.isCombiningMode || gameState.combinedSections.length === 0) {
      return null;
    }
    return gameState.combinedSections[gameState.currentSectionIndex] ?? null;
  }, [stage.mode, gameState.isCombiningMode, gameState.combinedSections, gameState.currentSectionIndex]);

  const currentSectionMusicXml = useMemo(() => {
    if (currentSheetSection) return currentSheetSection.musicXml ?? null;
    return stage.musicXml ?? null;
  }, [currentSheetSection, stage.musicXml]);

  const currentSheetBpm = currentSheetSection?.bpm ?? (stage.bpm || 120);
  const currentSheetTimeSignature = currentSheetSection?.timeSignature ?? (stage.timeSignature || 4);
  const currentSheetMeasureCount = currentSheetSection?.measureCount ?? (stage.measureCount || 8);
  const currentSheetCountInMeasures = currentSheetSection
    ? (currentSheetSection.isAuftakt ? currentSheetSection.countInMeasures : 0)
    : (stage.isAuftakt ? (stage.countInMeasures || 0) : 0);
  const sheetDisplayWidth = monsterAreaWidth || window.innerWidth - 16;

  const showSheetMusicForTiming = useMemo(() => {
    return (stage.mode === 'progression_timing' || stage.mode === 'timing_combining') && 
           gameState.isTaikoMode && 
           gameState.taikoNotes.length > 0 &&
           !!currentSectionMusicXml;
  }, [stage.mode, gameState.isTaikoMode, gameState.taikoNotes.length, currentSectionMusicXml]);
  
  const nextSectionSheetInfo = useMemo(() => {
    if (stage.mode !== 'timing_combining' || !gameState.isCombiningMode) return null;
    const sections = gameState.combinedSections;
    if (sections.length === 0) return null;
    
    const nextIdx = gameState.currentSectionIndex + 1;
    const isLastSection = nextIdx >= sections.length;
    const ns = isLastSection ? sections[0] : sections[nextIdx];
    if (!ns?.musicXml) return null;
    
    let nextListenBars: [number, number] | undefined = ns.listenBars;
    if (ns.callResponseMode === 'alternating') {
      const nextTotalPlay = (gameState.combinedFullLoopCount ?? 0) * (ns.sectionRepeatCount ?? 1) + (ns.repeatIndex ?? 0);
      nextListenBars = nextTotalPlay % 2 === 0 ? [1, ns.measureCount] : undefined;
    }

    return {
      musicXml: ns.musicXml,
      bpm: ns.bpm,
      timeSignature: ns.timeSignature,
      listenBars: nextListenBars,
      useRhythmNotation: useRhythmNotation,
    };
  }, [stage.mode, gameState.isCombiningMode, gameState.combinedSections, gameState.currentSectionIndex, gameState.combinedFullLoopCount, useRhythmNotation]);

  const sheetListenBars = useMemo<[number, number] | undefined>(() => {
    if (gameState.isCombiningMode) {
      if (!currentSheetSection) return undefined;
      if (currentSheetSection.callResponseMode === 'alternating') {
        const totalPlay = (gameState.combinedFullLoopCount ?? 0) * (currentSheetSection.sectionRepeatCount ?? 1) + (currentSheetSection.repeatIndex ?? 0);
        return totalPlay % 2 === 0 ? [1, currentSheetSection.measureCount] : undefined;
      }
      return currentSheetSection.listenBars;
    }

    if (stage.callResponseEnabled && stage.callResponseMode === 'alternating') {
      return (gameState.taikoLoopCycle % 2) === 0 ? [1, stage.measureCount ?? 8] : undefined;
    }

    return (stage.callResponseEnabled && stage.callResponseListenBars) ? stage.callResponseListenBars : undefined;
  }, [
    gameState.isCombiningMode,
    gameState.combinedFullLoopCount,
    gameState.taikoLoopCycle,
    currentSheetSection,
    stage.callResponseEnabled,
    stage.callResponseMode,
    stage.measureCount,
    stage.callResponseListenBars,
  ]);

  // timing_combining: 全セクションの楽譜を初期化時に一括プリレンダリング
  const combiningPreloadSections = useMemo(() => {
    if (stage.mode !== 'timing_combining' || !gameState.isCombiningMode) return undefined;
    const sections = gameState.combinedSections;
    if (sections.length === 0) return undefined;

    const seen = new Set<string>();
    const result: Array<{
      musicXml: string;
      bpm: number;
      timeSignature: number;
      listenBars?: [number, number];
      useRhythmNotation?: boolean;
    }> = [];

    for (const section of sections) {
      if (!section.musicXml) continue;
      const dedup = `${section.musicXml.length}_${section.bpm}_${section.timeSignature}_${section.listenBars?.[0] ?? ''}_${section.listenBars?.[1] ?? ''}_${!!useRhythmNotation}`;
      if (seen.has(dedup)) continue;
      seen.add(dedup);
      result.push({
        musicXml: section.musicXml,
        bpm: section.bpm,
        timeSignature: section.timeSignature,
        listenBars: section.listenBars,
        useRhythmNotation: useRhythmNotation || undefined,
      });
    }

    return result.length > 0 ? result : undefined;
  }, [stage.mode, gameState.isCombiningMode, gameState.combinedSections, useRhythmNotation]);

  const sheetMusicDisplay = useMemo(() => {
    if (!showSheetMusicForTiming) return null;

    return (
      <React.Suspense fallback={
        <div className="w-full h-full flex items-center justify-center bg-gray-800/50 text-gray-400 text-sm">
          楽譜を読み込み中...
        </div>
      }>
        <LazyFantasySheetMusicDisplay
          width={sheetDisplayWidth}
          height={sheetMusicHeight}
          musicXml={currentSectionMusicXml || ''}
          bpm={currentSheetBpm}
          timeSignature={currentSheetTimeSignature}
          measureCount={currentSheetMeasureCount}
          countInMeasures={currentSheetCountInMeasures}
          disablePreview={gameState.isCombiningMode && !nextSectionSheetInfo}
          simpleMode={currentSimpleNoteName}
          nextMusicXml={nextSectionSheetInfo?.musicXml}
          nextBpm={nextSectionSheetInfo?.bpm}
          nextTimeSignature={nextSectionSheetInfo?.timeSignature}
          nextListenBars={nextSectionSheetInfo?.listenBars}
          nextUseRhythmNotation={nextSectionSheetInfo?.useRhythmNotation}
          listenBars={sheetListenBars}
          useRhythmNotation={useRhythmNotation}
          preloadSections={combiningPreloadSections}
          className="w-full h-full"
        />
      </React.Suspense>
    );
  }, [
    showSheetMusicForTiming,
    sheetDisplayWidth,
    sheetMusicHeight,
    currentSectionMusicXml,
    currentSheetBpm,
    currentSheetTimeSignature,
    currentSheetMeasureCount,
    currentSheetCountInMeasures,
    gameState.isCombiningMode,
    nextSectionSheetInfo,
    currentSimpleNoteName,
    sheetListenBars,
    useRhythmNotation,
    combiningPreloadSections,
  ]);

  // 楽譜の段数を判定（MusicXMLパート数から）
  const currentStaves = useMemo(() => {
    if (!currentSectionMusicXml) return 1;
    return countMusicXmlStaves(currentSectionMusicXml);
  }, [currentSectionMusicXml]);

  // 楽譜表示エリアの初期高さを設定（段数変更・楽譜表示開始時）
  useEffect(() => {
    if (!showSheetMusicForTiming) return;
    sheetMusicStavesRef.current = currentStaves;

    const saved = loadSheetMusicHeight(currentStaves);
    if (saved !== null) {
      hasUserResizedRef.current = true;
      sheetMusicHeightRef.current = saved;
      setSheetMusicHeight(saved);
      return;
    }

    hasUserResizedRef.current = false;
    const defaultH = currentStaves >= 2 ? SHEET_HEIGHT_DEFAULT_2 : SHEET_HEIGHT_DEFAULT_1;
    sheetMusicHeightRef.current = defaultH;
    setSheetMusicHeight(defaultH);
  }, [showSheetMusicForTiming, currentStaves]);

  // ユーザーが手動リサイズしていない場合のみ、画面サイズに応じて高さを自動調整
  useEffect(() => {
    if (!showSheetMusicForTiming || hasUserResizedRef.current) return;

    const updateSheetHeight = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const isLandscape = vw > vh;
      const isMobile = vw < 900;
      const is2Staff = sheetMusicStavesRef.current >= 2;

      let h: number;
      if (isMobile && isLandscape) {
        const base = is2Staff ? 180 : 100;
        const maxH = is2Staff ? 220 : 140;
        h = Math.min(maxH, Math.max(base, Math.floor(vh * 0.22)));
      } else {
        const base = is2Staff ? 220 : 160;
        const maxH = is2Staff ? 340 : 220;
        h = Math.min(maxH, Math.max(base, Math.floor(vh * 0.28)));
      }
      sheetMusicHeightRef.current = h;
      setSheetMusicHeight(h);
    };

    updateSheetHeight();
    window.addEventListener('resize', updateSheetHeight);
    return () => window.removeEventListener('resize', updateSheetHeight);
  }, [showSheetMusicForTiming]);

  // ドラッグリサイズ用イベントハンドラー（依存なしで1回だけ登録）
  useEffect(() => {
    const handleMove = (clientY: number) => {
      if (!isResizingSheetRef.current) return;
      const delta = clientY - resizeStartRef.current.y;
      const next = Math.max(SHEET_HEIGHT_MIN, Math.min(SHEET_HEIGHT_MAX, resizeStartRef.current.height + delta));
      sheetMusicHeightRef.current = next;
      setSheetMusicHeight(next);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizingSheetRef.current) return;
      e.preventDefault();
      requestAnimationFrame(() => handleMove(e.clientY));
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isResizingSheetRef.current || e.touches.length === 0) return;
      e.preventDefault();
      requestAnimationFrame(() => handleMove(e.touches[0].clientY));
    };
    const onEnd = () => {
      if (!isResizingSheetRef.current) return;
      isResizingSheetRef.current = false;
      hasUserResizedRef.current = true;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      saveSheetMusicHeight(sheetMusicStavesRef.current, sheetMusicHeightRef.current);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchend', onEnd);
    };
  }, []);

  // Ready 終了後に BGM 再生（開始前画面では鳴らさない）
  // 注: currentTransposeOffsetを依存配列に含めないこと！
  // ループ境界で移調が変更されたときにBGMが再起動されてしまう
  useEffect(() => {
    if (!gameState.isGameActive) return;
    if (isReady) return;

    // iOS: BGM再生前にAudioContextが確実にrunningであることを保証
    bgmManager.ensureContextRunning();

    // 低速練習モードの場合、選択した速度を適用
    const playbackRate = selectedSpeedMultiplier;
    
    const initialPitchShift = 0;
    
    // timing_combining: 最初のセクションのBGMをnoLoopで再生
    if (stage.mode === 'timing_combining' && gameState.isCombiningMode && gameState.combinedSections.length > 0) {
      const firstSection = gameState.combinedSections[0];
      const firstBgmUrl = firstSection.bgmUrl;
      const firstSectionSkipCI = firstSection.callResponseMode === 'alternating' && (firstSection.repeatIndex ?? 0) % 2 === 0;
      if (firstBgmUrl) {
        bgmManager.play(
          firstBgmUrl,
        firstSection.bpm,
        firstSection.timeSignature,
        firstSection.measureCount,
        firstSectionSkipCI ? firstSection.audioCountInMeasures : firstSection.countInMeasures,
        settings.bgmVolume ?? 0.7,
        playbackRate,
        initialPitchShift,
        true, // noLoop
        firstSectionSkipCI
        );
      }
      // 次セクション用チェーンを完全に事前構築（ゼロラグ切り替え準備）
      if (gameState.combinedSections.length > 1) {
        const nextSection = gameState.combinedSections[1];
        if (nextSection.bgmUrl) {
          const nextSkipCI = nextSection.countInMeasures !== nextSection.audioCountInMeasures;
          bgmManager.prepareNextSection(
            nextSection.bgmUrl, nextSection.bpm, nextSection.timeSignature,
            nextSection.measureCount, nextSection.audioCountInMeasures,
            settings.bgmVolume ?? 0.7, playbackRate, initialPitchShift, true, nextSkipCI
          );
        }
      }
    } else {
      const bgmUrl = stage.bgmUrl;
      if (bgmUrl) {
        const isProgressionOrder = stage.mode === 'progression_order';
        const isAlternatingCR = stage.callResponseEnabled && stage.callResponseMode === 'alternating';
        bgmManager.play(
          bgmUrl,
          stage.bpm || 120,
          stage.timeSignature || 4,
          stage.measureCount ?? 8,
          stage.countInMeasures ?? 0,
          settings.bgmVolume ?? 0.7,
          playbackRate,
          initialPitchShift,
          false,
          isAlternatingCR, // 交互モード: 初回はリスニングなのでカウントインスキップ
          isProgressionOrder
        );
      }
    }

    return () => bgmManager.stop();
  }, [gameState.isGameActive, isReady, stage?.id, stage?.mode, stage?.bgmUrl, settings.bgmVolume, selectedSpeedMultiplier]);
  // 注: stage オブジェクト全体ではなく stage.id/mode/bgmUrl のみ依存に含め、親の再レンダーで不要な effect 再実行を防止
  // 注: gameState.currentTransposeOffsetは意図的に依存配列から除外（ループ時の再起動防止）
  
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
    speedMultiplier?: number
  ): FantasyStage => {
    const baseStage = {
      ...stage,
      noteIntervalBeats: (stage as any).note_interval_beats ?? stage.noteIntervalBeats,
    };
    
    if (speedMultiplier !== undefined && speedMultiplier !== 1.0) {
      (baseStage as any).speedMultiplier = speedMultiplier;
    }
    
    return baseStage;
  }, [stage]);

  const startGame = useCallback(async (
    mode: FantasyPlayMode, 
    speedMultiplier: number = 1.0
  ) => {
    bgmManager.ensureContextRunning();
    await bgmManager.ensureContextRunningAsync();
    FantasySoundManager.unlock().catch(() => {});
    FantasySoundManager.ensureContextsRunning();
    audioUnlockedRef.current = true;

    if (!isInitialized && initPromiseRef.current) {
      await initPromiseRef.current;
    }
    
    setSelectedSpeedMultiplier(speedMultiplier);
    
    onPlayModeChange(mode);
    readyStartTimeRef.current = performance.now();
    setIsReady(true);
    setIsGameReady(false);
    
    const stageWithSettings = buildInitStage(speedMultiplier);
    
    // timing_combining: 子ステージデータをDBからロードしてstageに注入
    if (stageWithSettings.mode === 'timing_combining' && stageWithSettings.combinedStageIds && stageWithSettings.combinedStageIds.length > 0) {
      const { fetchFantasyStagesByIds } = await import('@/platform/supabaseFantasyStages');
      const childStagesRaw = await fetchFantasyStagesByIds(stageWithSettings.combinedStageIds);
      stageWithSettings.combinedStages = childStagesRaw.map(cs => ({
        id: cs.id,
        stageNumber: (cs as any).stage_number,
        name: cs.name,
        name_en: (cs as any).name_en,
        description: cs.description,
        description_en: (cs as any).description_en,
        maxHp: (cs as any).max_hp,
        enemyGaugeSeconds: (cs as any).enemy_gauge_seconds,
        enemyCount: (cs as any).enemy_count,
        enemyHp: (cs as any).enemy_hp,
        minDamage: (cs as any).min_damage,
        maxDamage: (cs as any).max_damage,
        mode: 'progression_timing' as const,
        allowedChords: (cs as any).allowed_chords || [],
        chordProgression: (cs as any).chord_progression,
        chordProgressionData: (cs as any).chord_progression_data,
        showSheetMusic: false,
        showGuide: (cs as any).show_guide,
        simultaneousMonsterCount: (cs as any).simultaneous_monster_count || 1,
        monsterIcon: 'dragon',
        bpm: (cs as any).bpm || 120,
        bgmUrl: (cs as any).bgm_url || (cs as any).mp3_url,
        measureCount: (cs as any).measure_count,
        countInMeasures: (cs as any).count_in_measures || 0,
        timeSignature: (cs as any).time_signature || 4,
        noteIntervalBeats: (cs as any).note_interval_beats,
        playRootOnCorrect: (cs as any).play_root_on_correct ?? true,
        isSheetMusicMode: !!(cs as any).is_sheet_music_mode,
        sheetMusicClef: (cs as any).sheet_music_clef || 'treble',
        musicXml: (cs as any).music_xml,
        isAuftakt: !!(cs as any).is_auftakt,
      }));
    }
    
    // BGM音声をReady中にプリロード（ゲーム初期化と並列）
    // await可能版を使い、Ready解除前にBGMデコード済みバッファを確保
    const bgmPreloadPromise = (async () => {
      try {
        const urls: string[] = [];
        if (stageWithSettings.mode === 'timing_combining' && stageWithSettings.combinedStages?.length) {
          const firstUrl = stageWithSettings.combinedStages[0]?.bgmUrl;
          if (firstUrl) urls.push(firstUrl);
        }
        const mainUrl = stageWithSettings.bgmUrl;
        if (mainUrl && !urls.includes(mainUrl)) urls.push(mainUrl);
        await Promise.all(urls.map(u => bgmManager.preloadAudioAsync(u)));
      } catch { /* ignore */ }
    })();

    await Promise.all([
      initializeGame(stageWithSettings, mode),
      Promise.race([bgmPreloadPromise, new Promise<void>(r => setTimeout(r, 6000))]),
      Promise.race([FantasySoundManager.warmupRootSound().catch(() => {}), new Promise<void>(r => setTimeout(r, 500))]),
    ]);
    
    setIsGameReady(true);
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
  const audioUnlockedRef = useRef(false);
  const handleNoteInputBridge = useCallback((note: number, source: 'mouse' | 'touch' | 'midi' = 'mouse') => {
    const inputTimestampMs = performance.now();

    // startGame で unlock 済みなら Tone.start / unlock を毎入力で叩かない
    if (!audioUnlockedRef.current) {
      if ((window as any).Tone?.context?.state !== 'running') {
        (window as any).Tone?.start?.().catch(() => {});
      }
    }

    const isScreen = source === 'mouse' || source === 'touch';

    if (isScreen && activeNotesRef.current.has(note)) {
      return;
    }
    
    engineHandleNoteInput(note, inputTimestampMs);

    if (isScreen) {
      activeNotesRef.current.add(note);
      // メインスレッドをすぐ返し、次タスクで発音（WebKit でタッチと rAF の詰まりを軽減）
      getWindow().setTimeout(() => {
        playNote(note, 64).catch(() => {});
      }, 0);
    }
    
    // 未 unlock 時だけ低優先度で解放を試みる
    if (isScreen && !audioUnlockedRef.current) {
      audioUnlockedRef.current = true;
      setTimeout(() => {
        FantasySoundManager.unlock().catch(() => {});
      }, 0);
    }
  }, [engineHandleNoteInput]);
  
  // handleNoteInputBridgeが定義された後にRefを更新
  useEffect(() => {
    handleNoteInputRef.current = handleNoteInputBridge;
  }, [handleNoteInputBridge]);

  // pixiRendererのRefを最新に同期
  useEffect(() => {
    pixiRendererRef.current = pixiRenderer;
  }, [pixiRenderer]);
  
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
      
      renderer.setTouchActionMode('none');
      renderer.setKeyCallbacks(
        (note: number, pointerKind: 'mouse' | 'touch' | 'pen') => {
          handleNoteInputBridge(note, pointerKind === 'pen' ? 'touch' : pointerKind);
        },
        (note: number) => {
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

  // 楽譜モードフラグをPIXIレンダラーに反映
  useEffect(() => {
    if (fantasyPixiInstance) {
      fantasyPixiInstance.setSheetMusicMode(!!stage?.isSheetMusicMode);
    }
  }, [fantasyPixiInstance, stage?.isSheetMusicMode]);
  
  // onTaikoVisualSync (engine内) が唯一の高速同期経路。
  // React 側は太鼓モードOFF時のみ bridge をクリアする。
  useEffect(() => {
    if (gameState.isTaikoMode) return;
    taikoNotesRef.current = [];
    currentNoteIndexRef.current = 0;
    awaitingLoopStartRef.current = false;
    taikoLoopCycleRef.current = 0;
    preHitNoteIndicesRef.current = [];
    isCombiningModeRef.current = false;
    combinedSectionsRef.current = [];
    currentSectionIndexRef.current = 0;
  }, [gameState.isTaikoMode]);

  // 太鼓の達人モードのノーツ表示更新（最適化版）
  // 🚀 パフォーマンス最適化: ステート変更時にアニメーションループを再起動しない
  useEffect(() => {
    if (!fantasyPixiInstance || !gameState.isTaikoMode) return;

    // ループ情報を事前計算
    const stageData = gameState.currentStage;
    if (!stageData) return;
    const secPerBeat = 60 / (stageData.bpm || 120);
    const secPerMeasure = secPerBeat * (stageData.timeSignature || 4);
    const isProgressionOrder = stageData.mode === 'progression_order';
    const countInSec = (stageData.countInMeasures || 0) * secPerMeasure;
    const actualEnd = bgmManager.getActualLoopEnd();
    const hasCountInLoop = bgmManager.getLoopIncludesCountIn();
    const loopDuration = hasCountInLoop && actualEnd > 0
      ? actualEnd - countInSec
      : (stageData.measureCount || 8) * secPerMeasure;
    const useChordNameOnNotes =
      stageData.mode === 'progression_order' ||
      stageData.mode === 'progression_random' ||
      stageData.mode === 'progression';

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
    
    // C&R: リスニング/演奏小節情報（progression_timing用）
    const crListenBars = (stageData.callResponseEnabled && stageData.callResponseMode !== 'alternating') ? stageData.callResponseListenBars : undefined;
    const crPlayBars = (stageData.callResponseEnabled && stageData.callResponseMode !== 'alternating') ? stageData.callResponsePlayBars : undefined;
    const isAlternatingCR = !!(stageData.callResponseEnabled && stageData.callResponseMode === 'alternating');

    const bridge = new TaikoRenderBridge(
      {
        taikoNotesRef,
        currentNoteIndexRef,
        awaitingLoopStartRef,
        taikoLoopCycleRef,
        preHitNoteIndicesRef,
        combinedSectionsRef,
      },
      {
        stageData,
        useChordNameOnNotes,
        displayOpts: { lang: currentNoteNameLang, simple: currentSimpleNoteName },
        useRhythmNotation,
        loopDuration,
        secPerMeasure,
        isProgressionOrder,
        overlayMarkers,
        crListenBars,
        crPlayBars,
        isAlternatingCR,
      },
      { setCrOverlay, crOverlayTimerRef }
    );

    fantasyPixiInstance.setTaikoFrameCallback(() => {
      bridge.tick(fantasyPixiInstance);
    });

    return () => {
      fantasyPixiInstance.setTaikoFrameCallback(null);
    };
    // 🚀 パフォーマンス最適化: taikoNotes/currentNoteIndex/awaitingLoopStartを依存配列から除外
    // これらはrefで参照するため、変更時にアニメーションループが再起動されない
  }, [gameState.isTaikoMode, fantasyPixiInstance, gameState.currentStage, useRhythmNotation, currentNoteNameLang, currentSimpleNoteName]);

  // 太鼓モード: flushToReact を runTaikoFrame（rAF）と同じスタックから切り離す。
  // WebKit 系でタッチ時にメインスレッドが詰まった際、音楽時刻は進むのに描画だけ遅れる「止まり→ワープ」を抑える。
  useEffect(() => {
    if (!gameState.isTaikoMode) return;
    const id = setInterval(() => {
      flushToReact();
    }, 50);
    return () => clearInterval(id);
  }, [gameState.isTaikoMode, flushToReact]);

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
  // taikoNotes は ref 経由で参照し、依存配列に入れない（配列差し替えで不要な再実行を防ぐ）
  useEffect(() => {
    if (!pixiRenderer) return;
    const canGuide = effectiveShowGuide && gameState.simultaneousMonsterCount === 1;
    const setGuideMidi = (midiNotes: number[]) => {
      (pixiRenderer as any).setGuideHighlightsByMidiNotes?.(midiNotes);
    };
    if (!canGuide) {
      setGuideMidi([]);
      return;
    }
    
    let chord;
    if (gameState.isTaikoMode) {
      const notes = taikoNotesRef.current;
      if (notes.length > 0) {
        if (gameState.awaitingLoopStart) {
          const targetMonster = gameState.activeMonsters?.[0];
          chord = targetMonster?.nextChord || notes[gameState.currentNoteIndex]?.chord;
        } else {
          chord = notes[gameState.currentNoteIndex]?.chord;
        }
      }
    } else {
      const targetMonster = gameState.activeMonsters?.[0];
      chord = targetMonster?.chordTarget || gameState.currentChordTarget;
    }
    
    if (!chord) {
      setGuideMidi([]);
      return;
    }
    setGuideMidi(chord.notes as number[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixiRenderer, effectiveShowGuide, gameState.simultaneousMonsterCount, gameState.activeMonsters, gameState.currentChordTarget, gameState.isTaikoMode, gameState.currentNoteIndex, gameState.awaitingLoopStart]);

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
      startGame(playMode, autoStartSpeedMultiplier);
    }
  }, [autoStart, playMode, autoStartSpeedMultiplier, startGame]);

  // ゲーム開始前画面（オーバーレイ表示中は表示しない）
  if (!overlay && !gameState.isCompleting && (!gameState.isGameActive || !gameState.currentChordTarget)) {
    // progressionモードかどうかを判定
    const isProgressionMode = stage.mode.startsWith('progression') || stage.mode === 'timing_combining';
    
    return (
      <div className="min-h-[var(--dvh,100dvh)] bg-black flex items-center justify-center fantasy-game-screen overflow-y-auto">
        <div className="text-white text-center max-w-md px-4 py-6 my-auto">
          <div className="text-6xl mb-6">🎮</div>
            <h2 className="text-3xl font-bold mb-4">
              {localizedStageName ?? (isEnglishCopy ? 'Title unavailable' : 'タイトル取得失敗')}
            </h2>
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
                ? (isEnglishCopy ? '🎯 Challenge (2 min)' : '🎯 挑戦する（2分）')
                : (isEnglishCopy ? 'Challenge' : '挑戦')}
            </button>
            
            {/* 練習ボタン - progressionモードの場合は速度選択付き */}
            {isProgressionMode ? (
              <div className="w-full space-y-2">
                <div className="text-sm text-gray-400 mt-2">
                  {isEnglishCopy ? '🎹 Practice Mode' : '🎹 練習モード'}
                </div>
                
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
                      <option value={0.5}>🐌 50% ({isEnglishCopy ? 'Very Slow' : 'とてもゆっくり'})</option>
                      <option value={0.75}>🐢 75% ({isEnglishCopy ? 'Slow' : 'ゆっくり'})</option>
                      <option value={1.0}>🎵 100% ({isEnglishCopy ? 'Normal' : '通常速度'})</option>
                      <option value={1.25}>🚀 125%</option>
                      <option value={1.5}>🚀 150%</option>
                      <option value={1.75}>🚀 175%</option>
                      <option value={2.0}>⚡ 200%</option>
                      <option value={2.25}>⚡ 225%</option>
                      <option value={2.5}>⚡ 250%</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => {
                      startGame('practice', selectedSpeedMultiplier);
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
                  ? (isEnglishCopy ? '🎹 Practice (Unlimited)' : '🎹 練習する（時間無制限）')
                  : (isEnglishCopy ? 'Practice' : '練習する')}
              </button>
            )}
            
            {/* 戻るボタン */}
            <button
              onClick={() => {
                if (isIOSWebView()) { sendGameCallback('gameEnd'); return; }
                onBackToStageSelect();
              }}
              className="w-full px-8 py-3 mt-2 text-gray-300 font-bold text-lg rounded-lg shadow-lg transform transition-all border border-gray-600 bg-gray-800 hover:bg-gray-700 hover:scale-105"
            >
              {isEnglishCopy ? 'Back' : '戻る'}
            </button>
          </div>
          
          {/* デバッグ情報 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 bg-black bg-opacity-50 text-white text-xs p-3 rounded">
                <div>{isEnglishCopy ? 'Game state' : 'ゲーム状態'}: {gameState.isGameActive ? (isEnglishCopy ? 'Active' : 'アクティブ') : (isEnglishCopy ? 'Inactive' : '非アクティブ')}</div>
                <div>{isEnglishCopy ? 'Current chord' : '現在のコード'}: {gameState.currentChordTarget?.displayName || (isEnglishCopy ? 'None' : 'なし')}</div>
              <div>許可コード数: {stage.allowedChords?.length || 0}</div>
              {(stage.mode === 'single' || stage.mode === 'single_order') && <div>敵ゲージ秒数: {stage.enemyGaugeSeconds}</div>}
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
      <div className="relative z-30 p-1 text-white flex-shrink-0" style={{ minHeight: '40px', paddingTop: isIOSWebView() ? 'max(48px, env(safe-area-inset-top, 48px))' : 'max(4px, env(safe-area-inset-top))' }}>
        {isDailyChallenge ? (
          <div className="flex items-center justify-between px-1">
            <div className="text-sm font-sans text-white">
              {isEnglishCopy ? 'Score' : 'スコア'} <span className="text-yellow-300 font-bold">{gameState.correctAnswers}</span>
            </div>
            <div className="text-sm font-sans text-white">
              {isEnglishCopy ? 'Time' : '残り'} <span className="text-yellow-300 font-bold">
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
                {isEnglishCopy ? 'Challenge' : '挑戦'}
              </button>
            )}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
            >
              ⚙️
            </button>
            <button
              onClick={() => {
                if (isIOSWebView()) { sendGameCallback('gameEnd'); return; }
                onBackToStageSelect();
              }}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
            >
              {isEnglishCopy ? 'Back' : '戻る'}
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
              </div>
              <div className="text-xs text-gray-300">
                {isEnglishCopy ? 'Monsters:' : 'モンスター数:'} {playMode === 'practice'
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
                onClick={() => {
                  if (isIOSWebView()) { sendGameCallback('gameEnd'); return; }
                  onBackToStageSelect();
                }}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
              >
                {isEnglishCopy ? 'Back to Select' : 'ステージ選択に戻る'}
              </button>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium transition-colors"
              >
                ⚙️ {isEnglishCopy ? 'Settings' : '設定'}
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
          {/* コンボ表示（右・やや下寄り） */}
          {gameState.combo >= 2 && (
            <div className="absolute top-12 right-1 z-30 pointer-events-none text-right">
              <span className="text-2xl font-black text-yellow-300 drop-shadow-lg">{gameState.combo}</span>
              <span className="block text-[10px] font-bold text-yellow-200 tracking-widest">COMBO</span>
            </div>
          )}
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
          
          {/* モンスターの UI オーバーレイ（HPバー等は見た目のまま、タッチは下の鍵盤へ通す） */}
          <div className="mt-2 pointer-events-none">
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
                      {!isDailyChallenge && playMode !== 'practice' && (stage.mode === 'single' || stage.mode === 'single_order') && (
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
      
      {/* ===== 楽譜リサイズハンドル（楽譜の上部に配置） ===== */}
      {showSheetMusicForTiming && (
        <div
          className="relative w-full h-3 -my-1.5 z-20 cursor-row-resize group"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizingSheetRef.current = true;
            resizeStartRef.current = { y: e.clientY, height: sheetMusicHeight };
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
          }}
          onTouchStart={(e) => {
            if (e.touches.length === 0) return;
            e.preventDefault();
            isResizingSheetRef.current = true;
            resizeStartRef.current = { y: e.touches[0].clientY, height: sheetMusicHeight };
            document.body.style.userSelect = 'none';
          }}
        >
          <div className="absolute inset-x-0 -top-2 -bottom-2" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gray-700" />
          <div
            className={cn(
              'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-16 h-6 rounded-full',
              'bg-gray-700 border border-gray-600',
              'flex items-center justify-center',
              'transition-all duration-150',
              'hover:bg-gray-600 hover:scale-110',
              'group-hover:shadow-lg'
            )}
          >
            <div className="flex flex-col gap-0.5">
              <div className="w-6 h-0.5 bg-gray-400 rounded-full" />
              <div className="w-6 h-0.5 bg-gray-400 rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* ===== 楽譜表示エリア（Progression_Timing用） ===== */}
      {showSheetMusicForTiming && (
        <div 
          className="mx-2 mb-1 rounded-lg overflow-hidden flex-shrink-0"
          style={{ height: `${sheetMusicHeight}px` }}
        >
          {sheetMusicDisplay}
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
            return (
              <>
                <div 
                  className="absolute inset-0 overflow-x-scroll overflow-y-hidden scrollbar-hidden"
                  style={{ touchAction: 'none' }}
                  ref={setPianoScrollContainerRef}
                  onScroll={handlePianoScroll}
                >
                  <div style={{ width: pixiWidth, height: '100%' }}>
                    <PIXINotesRenderer
                      width={pixiWidth}
                      height={120}
                      onReady={handlePixiReady}
                      className="w-full h-full"
                    />
                  </div>
                </div>
                {/* オクターブシフトボタン（ピアノ左上） */}
                <div className="absolute top-0 left-1 z-10 flex items-center gap-0.5 pointer-events-auto" style={{ height: '28px' }}>
                  <button
                    type="button"
                    aria-label="1 octave left"
                    onPointerDown={(e) => { e.stopPropagation(); shiftPianoOctave(-1); }}
                    className="w-7 h-7 flex items-center justify-center rounded bg-black/60 text-white/80 text-sm active:bg-white/20 select-none"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="1 octave right"
                    onPointerDown={(e) => { e.stopPropagation(); shiftPianoOctave(1); }}
                    className="w-7 h-7 flex items-center justify-center rounded bg-black/60 text-white/80 text-sm active:bg-white/20 select-none"
                  >
                    ›
                  </button>
                </div>
              </>
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
          {(stage.mode === 'single' || stage.mode === 'single_order') && playMode !== 'practice' && <div>ゲージ: {gameState.enemyGauge.toFixed(1)}%</div>}
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
          // 設定ステートを更新
          const updatedNoteNameLang = newSettings.noteNameLang;
          const updatedSimpleNoteName = newSettings.simpleNoteName;
          const updatedKeyboardStyle = newSettings.keyboardNoteNameStyle ?? keyboardNoteNameStyle;
          const updatedShowGuide = newSettings.showKeyboardGuide ?? showKeyboardGuide;
          
          setCurrentNoteNameLang(updatedNoteNameLang);
          setCurrentSimpleNoteName(updatedSimpleNoteName);
          
          // 鍵盤上の音名表示設定が変更されたら更新
          if (newSettings.keyboardNoteNameStyle !== undefined) {
            setKeyboardNoteNameStyle(newSettings.keyboardNoteNameStyle);
          }
          
          // 鍵盤ガイド表示設定が変更されたら更新（デイリーチャレンジの練習モード時のみ）
          if (newSettings.showKeyboardGuide !== undefined) {
            setShowKeyboardGuide(newSettings.showKeyboardGuide);
          }
          
          // ローカルストレージに保存（レジェンドモードと同様）
          saveFantasySettings({
            noteNameLang: updatedNoteNameLang,
            simpleNoteName: updatedSimpleNoteName,
            keyboardNoteNameStyle: updatedKeyboardStyle,
            showKeyboardGuide: updatedShowGuide
          });
          
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
            FantasySoundManager.setVolume(newSettings.soundEffectVolume);
          }
          
          // ルート音量設定が変更されたら、gameStoreを更新
          if (newSettings.rootSoundVolume !== undefined) {
            updateSettings({ rootSoundVolume: newSettings.rootSoundVolume });
            FantasySoundManager.setRootVolume(newSettings.rootSoundVolume);
          }
        }}
        midiDeviceId={settings.selectedMidiDevice}
        volume={settings.midiVolume}
        soundEffectVolume={settings.soundEffectVolume}
        rootSoundVolume={settings.rootSoundVolume ?? 0.7}
        bgmVolume={settings.bgmVolume}
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

      {/* C&R オーバーレイ (Listen... / Your Turn!) */}
      {crOverlay && (
        <div className="absolute inset-0 flex items-center justify-center z-[9997] pointer-events-none animate-fade-in">
          <span className={cn(
            "font-sans text-4xl font-bold px-8 py-3 rounded-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]",
            crOverlay === 'Listen...'
              ? "text-cyan-300 bg-cyan-900/50 border border-cyan-500/40"
              : "text-amber-300 bg-amber-900/50 border border-amber-500/40"
          )}>
            {crOverlay}
          </span>
        </div>
      )}
      
      {/* Ready オーバーレイ */}
      {isReady && (
        <div className="absolute inset-0 flex items-center justify-center z-[9998] bg-black/60 pointer-events-none">
          <span className="font-sans text-7xl text-white animate-pulse">
            Ready
          </span>
        </div>
      )}
    </div>
  );
};

export default FantasyGameScreen;