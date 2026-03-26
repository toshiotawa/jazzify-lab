/**
 * ファンタジーモードメインコンポーネント
 * ルーティング管理とゲーム状態管理
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import FantasyStageSelect from './FantasyStageSelect';
import FantasyGameScreen from './FantasyGameScreen';
import { FantasyStage, type FantasyPlayMode } from './FantasyGameEngine';
import { RepeatKeyChange } from './TaikoNoteSystem';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { devLog } from '@/utils/logger';
import type { DisplayLang } from '@/utils/display-note';
import { LessonContext, FantasyRank } from '@/types';
import { fetchFantasyStageById, fetchFantasyStageByNumber } from '@/platform/supabaseFantasyStages';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { getWizardRankString } from '@/utils/fantasyRankConstants';
import { useToast } from '@/stores/toastStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { incrementFantasyMissionProgressOnClear } from '@/platform/supabaseChallengeFantasy';
import { getWindow } from '@/platform';
import { isIOSWebView, sendGameCallback } from '@/utils/iosbridge';
import { 
  calculateFantasyRank, 
  getRankClearCredit, 
  getRankColor, 
  getRankBgColor,
  getRemainingClearsForNextStage 
} from '@/utils/fantasyRankCalculator';

const musicXmlCache = new Map<string, string>();
async function resolveMusicXml(stage: FantasyStage): Promise<FantasyStage> {
  const raw = stage.musicXml;
  if (!raw || (!raw.startsWith('/') && !raw.startsWith('http'))) return stage;

  if (musicXmlCache.has(raw)) {
    return { ...stage, musicXml: musicXmlCache.get(raw) };
  }
  try {
    const res = await fetch(raw);
    if (!res.ok) throw new Error(`${res.status}`);
    const xml = await res.text();
    musicXmlCache.set(raw, xml);
    return { ...stage, musicXml: xml };
  } catch (e) {
    devLog.error('MusicXML fetch failed:', raw, e);
    return stage;
  }
}

/** レッスン/ミッションからの直リンク（ステージ選択を挟まない）か */
function isEmbeddedFantasyUrlHash(hash: string): boolean {
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const stageId = params.get('stageId');
  if (!stageId) return false;
  const hasLesson = !!(params.get('lessonId') && params.get('lessonSongId'));
  const hasMission = !!params.get('missionId');
  return hasLesson || hasMission;
}

// 結果画面用の練習設定コンポーネント
interface ResultPracticeSettingsProps {
  currentStage: FantasyStage;
  isEnglishCopy: boolean;
  onStartPractice: (speed: number, transposeOpts?: { keyOffset: number; repeatKeyChange: RepeatKeyChange }) => void;
}

const ResultPracticeSettings: React.FC<ResultPracticeSettingsProps> = ({
  currentStage,
  isEnglishCopy,
  onStartPractice
}) => {
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);
  const [transposeKeyOffset, setTransposeKeyOffset] = useState(0);
  const [repeatKeyChange, setRepeatKeyChange] = useState<RepeatKeyChange>('off');
  
  const isTimingMode = currentStage.mode === 'progression_timing' || currentStage.mode === 'timing_combining';
  
  return (
    <div className="w-full space-y-2">
      <div className="text-sm text-gray-400 mt-2">
        {isEnglishCopy ? '🎹 Practice Mode' : '🎹 練習モード'}
      </div>
      
      {/* 移調練習設定（TIMINGモードの場合のみ表示） */}
      {isTimingMode && (
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
            value={selectedSpeed}
            onChange={(e) => setSelectedSpeed(parseFloat(e.target.value))}
            className="flex-1 bg-gray-700 text-white text-sm rounded px-2 py-2 border border-gray-600"
          >
            <option value={1.0}>🎵 100% ({isEnglishCopy ? 'Normal' : '通常速度'})</option>
            <option value={0.75}>🐢 75% ({isEnglishCopy ? 'Slow' : 'ゆっくり'})</option>
            <option value={0.5}>🐌 50% ({isEnglishCopy ? 'Very Slow' : 'とてもゆっくり'})</option>
          </select>
        </div>
        
        <button
          onClick={() => {
            const transposeOpts = isTimingMode 
              ? { keyOffset: transposeKeyOffset, repeatKeyChange }
              : undefined;
            onStartPractice(selectedSpeed, transposeOpts);
          }}
          className="w-full px-6 py-3 font-bold rounded-lg shadow-lg transform transition-all border bg-green-600/80 hover:bg-green-500 border-green-400/50 hover:scale-[1.02]"
        >
          <span className="text-white">{isEnglishCopy ? 'Start Practice' : '練習を開始'}</span>
        </button>
      </div>
    </div>
  );
};

// 1コース当たりのステージ数定数
const COURSE_LENGTH = 10;

// 次のステージ番号を算出する共通関数
function getNextStageNumber(current: string): string {
  const [rank, num] = current.split('-').map(Number);
  const nextNum = num >= COURSE_LENGTH ? 1 : num + 1;
  const nextRank = num >= COURSE_LENGTH ? rank + 1 : rank;
  return `${nextRank}-${nextNum}`;
}

interface GameResult {
  result: 'clear' | 'gameover';
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  playerHp: number;
  maxHp: number;
  rank: FantasyRank;
  clearCredit: number;
}

interface FantasyMainProps {
  demoStage?: string;
  initialStage?: string;
}

const FantasyMain: React.FC<FantasyMainProps> = ({ demoStage, initialStage }) => {
  const { profile, isGuest } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const { settings } = useGameStore();
  const toast = useToast();
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });
  const stageClearText = isEnglishCopy ? 'Stage Clear!' : 'ステージクリア！';
  const gameOverText = isEnglishCopy ? 'Game Over' : 'ゲームオーバー';
  const correctAnswersLabel = isEnglishCopy ? 'Correct answers' : '正解数';
  const nextStageButtonLabel = isEnglishCopy ? 'Next stage' : '次のステージへ';
  const retryButtonLabel = isEnglishCopy ? 'Retry' : '再挑戦';
  const backToSelectLabel = isEnglishCopy ? 'Stage select' : 'ステージ選択に戻る';
  const rankLabel = isEnglishCopy ? 'Rank' : 'ランク';
  const nextStageUnlockLabel = isEnglishCopy ? 'Next stage unlock' : '次ステージ開放まで';
  const clearsRemainingLabel = isEnglishCopy ? 'clears remaining' : '回クリア';
  const stageUnlockedLabel = isEnglishCopy ? 'Next stage unlocked!' : '次のステージが開放されました！';
  const [currentStage, setCurrentStage] = useState<FantasyStage | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [playMode, setPlayMode] = useState<FantasyPlayMode>('challenge');
  const [lessonContext, setLessonContext] = useState<LessonContext | null>(null);
  const [isLessonMode, setIsLessonMode] = useState(false);
  const [missionContext, setMissionContext] = useState<{ missionId: string; stageId: string } | null>(null);
  const [isMissionMode, setIsMissionMode] = useState(false);
  const [lastPlayedTier, setLastPlayedTier] = useState<'basic' | 'advanced' | 'phrases' | null>(null);
  const [lastPlayedRank, setLastPlayedRank] = useState<string | null>(null);
  const embeddedFantasyUrlOnMount = useMemo(() => {
    try {
      return isEmbeddedFantasyUrlHash(getWindow().location.hash);
    } catch {
      return false;
    }
  }, []);
  const [embeddedStageLoadFailed, setEmbeddedStageLoadFailed] = useState(false);
  
  // 次ステージ開放情報
  const [nextStageUnlockInfo, setNextStageUnlockInfo] = useState<{
    currentClearCredit: number;
    requiredClears: number;
    remainingClears: number;
    isUnlocked: boolean;
  } | null>(null);
  
  // ▼▼▼ 追加 ▼▼▼
  // ゲームコンポーネントを強制的に再マウントさせるためのキー
  const [gameKey, setGameKey] = useState(0); 
  // 再挑戦時の自動開始フラグ
  const [pendingAutoStart, setPendingAutoStart] = useState(false);
  // 再挑戦時の速度倍率（progressionモード用）
  const [pendingSpeedMultiplier, setPendingSpeedMultiplier] = useState<number>(1.0);
  // ▲▲▲ ここまで ▲▲▲
  
  // フリープラン・ゲストユーザーかどうかの確認
  const isFreeOrGuest = isGuest || (profile && profile.rank === 'free');
  const canProceedToNextStage =
    gameResult?.result === 'clear' &&
    !isLessonMode &&
    !isMissionMode &&
    (isFreeOrGuest || nextStageUnlockInfo?.isUnlocked === true);
  const previousClearCredit = nextStageUnlockInfo
    ? Math.max(0, nextStageUnlockInfo.currentClearCredit - (gameResult?.clearCredit ?? 0))
    : 0;
  const shouldShowStageUnlockedMessage =
    gameResult?.result === 'clear' &&
    !isLessonMode &&
    !isMissionMode &&
    nextStageUnlockInfo?.isUnlocked === true &&
    previousClearCredit < (nextStageUnlockInfo?.requiredClears ?? 0);
  const shouldShowNextStageInfo =
    !isLessonMode &&
    !isMissionMode &&
    !!nextStageUnlockInfo &&
    (!nextStageUnlockInfo.isUnlocked || shouldShowStageUnlockedMessage);
  
  // ステージ選択画面表示中にAudio/サウンド初期化を先行開始（ゲーム開始の高速化）
  // iOS: Tone.js・モンスター画像を早期プリロードし、BGM・敵アイコンの遅延を防止
  useEffect(() => {
    import('@/utils/FantasySoundManager').then(({ FantasySoundManager }) => {
      // GM音源を最優先で先行読込開始（ゲーム画面の waitForGMReady と共有Promise）
      FantasySoundManager.preloadGM();
      FantasySoundManager.init(
        settings.soundEffectVolume ?? 0.8,
        settings.rootSoundVolume ?? 0.5,
        true
      ).catch(() => {});
    }).catch(() => {});
    import('@/utils/MidiController').then(({ initializeAudioSystem }) => {
      initializeAudioSystem().catch(() => {});
    }).catch(() => {});
    // Tone.js: main.tsxでロード済み。二重ロードを避けるためここではimportしない（BGMManager.ensureContextRunningAsyncが未ロード時は補完）
    // モンスター画像: 18体を先行プリロード（getStageMonsterIdsのシャッフルと重複しやすく、iOSで敵アイコン遅延を防止）
    import('@/components/fantasy/FantasyGameEngine').then(({ preloadMonsterImages, globalImageCache }) => {
      const commonIds = Array.from({ length: 18 }, (_, i) => `monster_${String(i + 1).padStart(2, '0')}`);
      preloadMonsterImages(commonIds, globalImageCache).catch(() => {});
    }).catch(() => {});
  }, [settings.soundEffectVolume, settings.rootSoundVolume]);

  // ステージ選択時に画像を即座にプリロード開始（Challengeクリック時にはキャッシュ済み）
  // ステージ選択はユーザージェスチャーなので、このタイミングでAudioContextをアンロック（iOS対応）
  useEffect(() => {
    const stage = currentStage;
    if (!stage) return;
    import('@/utils/BGMManager').then(({ bgmManager }) => {
      bgmManager.ensureContextRunning();
      bgmManager.ensureContextRunningAsync().catch(() => {});
    }).catch(() => {});
    import('@/components/fantasy/FantasyGameEngine').then(({ preloadMonsterImages, preloadSheetMusicImages, globalImageCache }) => {
      import('@/data/monsters').then(({ getStageMonsterIds }) => {
        if (stage.isSheetMusicMode && stage.allowedChords?.length) {
          const noteNames = stage.allowedChords.map((chord: unknown) =>
            typeof chord === 'string' ? chord : (chord as { chord?: string })?.chord
          ).filter(Boolean) as string[];
          preloadSheetMusicImages(noteNames, globalImageCache).catch(() => {});
        } else {
          const monsterIds = getStageMonsterIds(stage.enemyCount ?? 6);
          preloadMonsterImages(monsterIds, globalImageCache).catch(() => {});
        }
      });
    }).catch(() => {});
  }, [currentStage?.id]);

  // iOS initialStage/demoStage による自動ステージ読み込み
  useEffect(() => {
    const stageNumber = initialStage || demoStage;
    if (!stageNumber || currentStage) return;
    const hash = window.location.hash;
    if (hash.includes('lessonId=') || hash.includes('missionId=')) return;

    fetchFantasyStageByNumber(stageNumber).then(dbStage => {
      if (!dbStage) return;
      const fantasyStage: FantasyStage = {
        id: dbStage.id,
        stageNumber: dbStage.stage_number,
        name: dbStage.name,
        name_en: (dbStage as Record<string, unknown>).name_en as string | undefined,
        description: dbStage.description,
        description_en: (dbStage as Record<string, unknown>).description_en as string | undefined,
        maxHp: dbStage.max_hp,
        enemyGaugeSeconds: dbStage.enemy_gauge_seconds,
        enemyCount: dbStage.enemy_count,
        enemyHp: dbStage.enemy_hp,
        minDamage: dbStage.min_damage,
        maxDamage: dbStage.max_damage,
        mode: (['single','single_order','progression_order','progression_random','progression_timing','timing_combining'] as const)
          .includes(dbStage.mode as never) ? (dbStage.mode as FantasyStage['mode']) : 'progression',
        allowedChords: dbStage.allowed_chords,
        chordProgression: dbStage.chord_progression,
        chordProgressionData: (dbStage as Record<string, unknown>).chord_progression_data as FantasyStage['chordProgressionData'],
        showSheetMusic: false,
        showGuide: dbStage.show_guide,
        simultaneousMonsterCount: dbStage.simultaneous_monster_count || 1,
        monsterIcon: 'dragon',
        bpm: ((dbStage as Record<string, unknown>).bpm as number) || 120,
        bgmUrl: dbStage.bgm_url || (dbStage as Record<string, unknown>).mp3_url as string | undefined,
        measureCount: (dbStage as Record<string, unknown>).measure_count as number | undefined,
        countInMeasures: (dbStage as Record<string, unknown>).count_in_measures as number | undefined,
        timeSignature: (dbStage as Record<string, unknown>).time_signature as string | undefined,
        noteIntervalBeats: (dbStage as Record<string, unknown>).note_interval_beats as number | undefined,
        playRootOnCorrect: (dbStage as Record<string, unknown>).play_root_on_correct as boolean ?? true,
        isSheetMusicMode: !!(dbStage as Record<string, unknown>).is_sheet_music_mode,
        sheetMusicClef: ((dbStage as Record<string, unknown>).sheet_music_clef as string) || 'treble',
        required_clears_for_next: ((dbStage as Record<string, unknown>).required_clears_for_next as number) ?? 5,
        musicXml: (dbStage as Record<string, unknown>).music_xml as string | undefined,
        combinedStageIds: (dbStage as Record<string, unknown>).combined_stage_ids as string[] | undefined,
        combinedSectionRepeats: (dbStage as Record<string, unknown>).combined_section_repeats as number[] | undefined,
        combinedSectionMeasureLimits: (dbStage as Record<string, unknown>).combined_section_measure_limits as number[] | undefined,
        callResponseEnabled: !!(dbStage as Record<string, unknown>).call_response_enabled,
        callResponseMode: (dbStage as Record<string, unknown>).call_response_mode as string | undefined,
        callResponseListenBars: (dbStage as Record<string, unknown>).call_response_listen_bars as number | undefined,
        callResponsePlayBars: (dbStage as Record<string, unknown>).call_response_play_bars as number | undefined,
        combinedSectionListenBars: (dbStage as Record<string, unknown>).combined_section_listen_bars as number[] | undefined,
        combinedSectionPlayBars: (dbStage as Record<string, unknown>).combined_section_play_bars as number[] | undefined,
        combinedSectionCrModes: (dbStage as Record<string, unknown>).combined_section_cr_modes as string[] | undefined,
        useRhythmNotation: !!(dbStage as Record<string, unknown>).use_rhythm_notation,
        productionRepeatTranspositionMode: (dbStage as Record<string, unknown>).production_repeat_transposition_mode as string | undefined,
        productionStartKey: (dbStage as Record<string, unknown>).production_start_key as number | undefined,
      };
      resolveMusicXml(fantasyStage).then(s => setCurrentStage(s));
    }).catch(() => {});
  }, [initialStage, demoStage]);

  // URLパラメータからレッスン/ミッションコンテキストを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const lessonId = params.get('lessonId');
    const lessonSongId = params.get('lessonSongId');
    const stageId = params.get('stageId');
    const clearConditionsStr = params.get('clearConditions');
    const missionId = params.get('missionId');
    
    devLog.debug('🎮 FantasyMain URLパラメータ:', {
      lessonId,
      lessonSongId,
      stageId,
      missionId,
      clearConditionsStr,
      fullHash: window.location.hash
    });
    
    if (lessonId && lessonSongId && stageId) {
      // レッスンモード（clearConditionsはnull許容）
      setIsLessonMode(true);
      try {
        const clearConditions = clearConditionsStr ? JSON.parse(clearConditionsStr) : {};
        setLessonContext({
          lessonId,
          lessonSongId,
          clearConditions,
          sourceType: 'fantasy'
        });
        fetchFantasyStageById(stageId).then(async stage => {
          const fantasyStage: FantasyStage = {
            id: stage.id,
            stageNumber: stage.stage_number,
            name: stage.name,
            name_en: stage.name_en,
            description: stage.description,
            description_en: stage.description_en,
            maxHp: stage.max_hp,
            enemyGaugeSeconds: stage.enemy_gauge_seconds,
            enemyCount: stage.enemy_count,
            enemyHp: stage.enemy_hp,
            minDamage: stage.min_damage,
            maxDamage: stage.max_damage,
            mode: (['single','single_order','progression_order','progression_random','progression_timing','timing_combining'] as const).includes(stage.mode as any)
              ? (stage.mode as any)
              : 'progression',
            allowedChords: stage.allowed_chords,
            chordProgression: stage.chord_progression,
            chordProgressionData: (stage as any).chord_progression_data,
            showSheetMusic: false,
            showGuide: stage.show_guide,
            simultaneousMonsterCount: stage.simultaneous_monster_count || 1,
            monsterIcon: 'dragon',
            bpm: (stage as any).bpm || 120,
            bgmUrl: stage.bgm_url || (stage as any).mp3_url,
            measureCount: (stage as any).measure_count,
            countInMeasures: (stage as any).count_in_measures,
            timeSignature: (stage as any).time_signature,
            noteIntervalBeats: (stage as any).note_interval_beats,
            playRootOnCorrect: (stage as any).play_root_on_correct ?? true,
            isSheetMusicMode: !!(stage as any).is_sheet_music_mode,
            sheetMusicClef: (stage as any).sheet_music_clef || 'treble',
            required_clears_for_next: (stage as any).required_clears_for_next ?? 5,
            musicXml: (stage as any).music_xml,
            combinedStageIds: (stage as any).combined_stage_ids ?? undefined,
            combinedSectionRepeats: (stage as any).combined_section_repeats ?? undefined,
            combinedSectionMeasureLimits: (stage as any).combined_section_measure_limits ?? undefined,
            callResponseEnabled: !!(stage as any).call_response_enabled,
            callResponseMode: (stage as any).call_response_mode ?? undefined,
            callResponseListenBars: (stage as any).call_response_listen_bars ?? undefined,
            callResponsePlayBars: (stage as any).call_response_play_bars ?? undefined,
            combinedSectionListenBars: (stage as any).combined_section_listen_bars ?? undefined,
            combinedSectionPlayBars: (stage as any).combined_section_play_bars ?? undefined,
            combinedSectionCrModes: (stage as any).combined_section_cr_modes ?? undefined,
            useRhythmNotation: !!(stage as any).use_rhythm_notation,
            productionRepeatTranspositionMode: (stage as any).production_repeat_transposition_mode ?? undefined,
            productionStartKey: (stage as any).production_start_key ?? undefined,
          };
          setCurrentStage(await resolveMusicXml(fantasyStage));
        }).catch(err => {
          console.error('Failed to load fantasy stage:', err);
          setEmbeddedStageLoadFailed(true);
        });
      } catch (e) {
        console.error('Failed to parse clear conditions:', e);
        setEmbeddedStageLoadFailed(true);
      }
      return;
    }

    if (missionId && stageId) {
      // ミッションモード
      setIsMissionMode(true);
      setMissionContext({ missionId, stageId });
      fetchFantasyStageById(stageId).then(stage => {
        const fantasyStage: FantasyStage = {
          id: stage.id,
          stageNumber: stage.stage_number,
          name: stage.name,
          name_en: stage.name_en,
          description: stage.description,
          description_en: stage.description_en,
          maxHp: stage.max_hp,
          enemyGaugeSeconds: stage.enemy_gauge_seconds,
          enemyCount: stage.enemy_count,
          enemyHp: stage.enemy_hp,
          minDamage: stage.min_damage,
          maxDamage: stage.max_damage,
          mode: (['single','single_order','progression_order','progression_random','progression_timing','timing_combining'] as const).includes(stage.mode as any)
            ? (stage.mode as any)
            : 'progression',
          allowedChords: stage.allowed_chords,
          chordProgression: stage.chord_progression,
          chordProgressionData: (stage as any).chord_progression_data,
          showSheetMusic: false,
          showGuide: stage.show_guide,
          simultaneousMonsterCount: stage.simultaneous_monster_count || 1,
          monsterIcon: 'dragon',
          bpm: (stage as any).bpm || 120,
          bgmUrl: stage.bgm_url || (stage as any).mp3_url,
          measureCount: (stage as any).measure_count,
          countInMeasures: (stage as any).count_in_measures,
          timeSignature: (stage as any).time_signature,
          noteIntervalBeats: (stage as any).note_interval_beats,
          playRootOnCorrect: (stage as any).play_root_on_correct ?? true,
          isSheetMusicMode: !!(stage as any).is_sheet_music_mode,
          sheetMusicClef: (stage as any).sheet_music_clef || 'treble',
          required_clears_for_next: (stage as any).required_clears_for_next ?? 5,
          musicXml: (stage as any).music_xml,
          combinedStageIds: (stage as any).combined_stage_ids ?? undefined,
          combinedSectionRepeats: (stage as any).combined_section_repeats ?? undefined,
          combinedSectionMeasureLimits: (stage as any).combined_section_measure_limits ?? undefined,
          callResponseEnabled: !!(stage as any).call_response_enabled,
          callResponseMode: (stage as any).call_response_mode ?? undefined,
          callResponseListenBars: (stage as any).call_response_listen_bars ?? undefined,
          callResponsePlayBars: (stage as any).call_response_play_bars ?? undefined,
          combinedSectionListenBars: (stage as any).combined_section_listen_bars ?? undefined,
          combinedSectionPlayBars: (stage as any).combined_section_play_bars ?? undefined,
          combinedSectionCrModes: (stage as any).combined_section_cr_modes ?? undefined,
          useRhythmNotation: !!(stage as any).use_rhythm_notation,
          productionRepeatTranspositionMode: (stage as any).production_repeat_transposition_mode ?? undefined,
          productionStartKey: (stage as any).production_start_key ?? undefined,
        };
        resolveMusicXml(fantasyStage).then(setCurrentStage);
      }).catch(err => {
        console.error('Failed to load fantasy stage:', err);
        setEmbeddedStageLoadFailed(true);
      });
      return;
    }
  }, []);

  // ステージ選択ハンドラ
  const handleStageSelect = useCallback((stage: FantasyStage) => {
    resolveMusicXml(stage).then(setCurrentStage);
    setGameResult(null);
    setShowResult(false);
    setPlayMode('challenge');
    setPendingAutoStart(false);
    setPendingSpeedMultiplier(1.0);
    setGameKey(prevKey => prevKey + 1);
    const tier = ((stage as any).tier as 'basic' | 'advanced' | 'phrases') || 'basic';
    setLastPlayedTier(tier);
    setLastPlayedRank(stage.stageNumber?.split('-')[0] || null);
  }, []);
  
  // ゲーム完了ハンドラ
  const handleGameComplete = useCallback(async (
    result: 'clear' | 'gameover', 
    score: number, 
    correctAnswers: number, 
    totalQuestions: number,
    playerHp: number,
    maxHp: number
  ) => {
    setPendingAutoStart(false);
    
    // ランクを計算
    const rank = calculateFantasyRank(result, playerHp, maxHp);
    const clearCredit = getRankClearCredit(rank, result);
    
    devLog.debug('🎮 ファンタジーモード: ゲーム完了', { result, score, correctAnswers, totalQuestions, playerHp, maxHp, rank, clearCredit });
    const gameResultData: GameResult = { result, score, correctAnswers, totalQuestions, playerHp, maxHp, rank, clearCredit };
    setGameResult(gameResultData);
    setShowResult(true);
    
    // レッスンモードの場合の処理
    if (isLessonMode && lessonContext) {
      if (result === 'clear') {
        try {
          // レッスン用ファンタジーは計算したランクを使用
          await updateLessonRequirementProgress(
            lessonContext.lessonId,
            lessonContext.lessonSongId,
            rank, // 計算したランクを使用
            lessonContext.clearConditions,
            { sourceType: 'fantasy', lessonSongId: lessonContext.lessonSongId }
          );
        } catch (error) {
          console.error('レッスン課題進捗更新エラー:', error);
        }
      }
      return; // レッスンモードはここで終了
    }

    // ミッションモード：通常のファンタジークリア記録は更新しない
    if (isMissionMode && missionContext && currentStage) {
      try {
        if (!isFreeOrGuest && profile && result === 'clear') {
          await incrementFantasyMissionProgressOnClear(missionContext.missionId, currentStage.id);
        }
      } catch (e) {
        console.error('ミッション進捗更新エラー:', e);
      }
      // ミッションモードでは通常通りXPは付与（ステージ報酬）
      // 以下は通常処理と同じXP付与
    } else {
      // 通常のファンタジーモードの処理（クリア記録の保存など）
      try {
        if (!isFreeOrGuest && profile && currentStage) {
          const { getSupabaseClient } = await import('@/platform/supabaseClient');
          const supabase = getSupabaseClient();
          let canAdvanceStage = false;
          // クリア記録保存（RPC関数を使用）
          try {
            const { data: clearResult, error: clearError } = await supabase
              .rpc('upsert_fantasy_stage_clear', {
                p_user_id: profile.id,
                p_stage_id: currentStage.id,
                p_score: score,
                p_clear_type: result,
                p_remaining_hp: playerHp,
                p_max_hp: maxHp,
                p_total_questions: totalQuestions,
                p_correct_answers: correctAnswers,
                p_rank: rank
              });
            
            if (clearError) {
              devLog.error('クリア記録保存エラー:', clearError);
            } else if (clearResult && clearResult.length > 0) {
              const clearData = clearResult[0];
              const requiredClears = (currentStage as any).required_clears_for_next ?? 5;
              const remaining = getRemainingClearsForNextStage(clearData.total_clear_credit, requiredClears);
              const isUnlocked = remaining === 0;
              setNextStageUnlockInfo({
                currentClearCredit: clearData.total_clear_credit,
                requiredClears,
                remainingClears: remaining,
                isUnlocked
              });
              canAdvanceStage = isUnlocked;
              devLog.debug('✅ クリア記録保存成功:', clearData);
            }
          } catch (e) {
            devLog.error('クリア記録保存例外:', e);
          }
          // 進捗の更新（クリア時に current_stage_number が遅れていたら進める）
          if (result === 'clear' && currentStage.stageNumber && canAdvanceStage) {
            try {
              const nextStageNumber = getNextStageNumber(currentStage.stageNumber);
              const tier = (currentStage as { tier?: string }).tier || 'basic';
              
              devLog.debug('🎮 ファンタジー進捗更新開始:', {
                stageNumber: currentStage.stageNumber,
                nextStageNumber,
                tier,
                userId: profile.id
              });
              
              // 現在の進捗を取得
              const { data: currentProgress, error: fetchError } = await supabase
                .from('fantasy_user_progress')
                .select('current_stage_number_basic, current_stage_number_advanced, current_stage_number_phrases')
                .eq('user_id', profile.id)
                .maybeSingle();
              
              if (fetchError) {
                devLog.error('進捗取得エラー:', fetchError);
              }
              
              // ティア別の進捗カラムマッピング
              const tierColumnMap: Record<string, string> = {
                advanced: 'current_stage_number_advanced',
                phrases: 'current_stage_number_phrases',
                basic: 'current_stage_number_basic',
              };
              const progressColumn = tierColumnMap[tier] || 'current_stage_number_basic';
              const currentValue = (currentProgress as Record<string, string | null>)?.[progressColumn] || '1-1';
              
              const [currR, currS] = currentValue.split('-').map(Number);
              const [nextR, nextS] = nextStageNumber.split('-').map(Number);
              const shouldUpdate = (nextR > currR) || (nextR === currR && nextS > currS);
              
              devLog.debug('🎮 進捗更新判定:', {
                currentValue,
                nextStageNumber,
                tier,
                shouldUpdate
              });
              
              if (shouldUpdate) {
                const updateData = { [progressColumn]: nextStageNumber };
                
                const { error: updateError } = await supabase
                  .from('fantasy_user_progress')
                  .upsert({
                    user_id: profile.id,
                    ...updateData
                  }, { onConflict: 'user_id' });
                
                if (updateError) {
                  devLog.error('進捗更新エラー:', updateError);
                } else {
                  devLog.debug('✅ 進捗更新成功:', updateData);
                }
              }
            } catch (progressError) {
              devLog.error('進捗更新処理エラー:', progressError);
            }
          }
          // キャッシュのクリア
          if (result === 'clear') {
            try {
              const { clearCacheByPattern } = await import('@/platform/supabaseClient');
              clearCacheByPattern(new RegExp(`^fantasy_stage_clears`));
              clearCacheByPattern(new RegExp(`^fantasy_user_progress:${profile.id}`));
            } catch {}
          }
        }
      } catch (error) {
        console.error('ファンタジーモード結果保存エラー:', error);
      }
    }

  }, [isGuest, profile, currentStage, isLessonMode, lessonContext, toast, isFreeOrGuest, isMissionMode, missionContext]);

  const handleBackToStageSelect = useCallback(() => {
    if (isIOSWebView()) {
      sendGameCallback('gameEnd');
      return;
    }
    if (isLessonMode && lessonContext) {
      window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
      return;
    }
    if (isMissionMode) {
      window.location.hash = '#missions';
      return;
    }
    setCurrentStage(null);
    setGameResult(null);
    setPlayMode('challenge');
    setPendingAutoStart(false);
    setPendingSpeedMultiplier(1.0);
  }, [isMissionMode, isLessonMode, lessonContext]);
  
  // ★ 追加: 次のステージに待機画面で遷移
  const gotoNextStageWaiting = useCallback(async () => {
    if (!currentStage) return;
    
    // レッスン専用ステージ（stageNumberがnull）の場合は次ステージ遷移しない
    if (!currentStage.stageNumber) return;
    
    const nextStageNumber = getNextStageNumber(currentStage.stageNumber);
    
    // フリープラン・ゲストユーザーの場合、1-4以降には進めない
      if (isFreeOrGuest && nextStageNumber >= '1-4') {
        toast.error(
          isEnglishCopy
            ? 'Free plan and guest players can play up to stage 1-3.'
            : 'フリープラン・ゲストプレイでは、ステージ1-3までプレイ可能です。',
          {
            duration: 5000,
          }
        );
      handleBackToStageSelect();
      return;
    }

    try {
      // DB から実データを読み直す
      const { getSupabaseClient } = await import('@/platform/supabaseClient');
      const supabase = getSupabaseClient();
      const { data: nextStageData, error } = await supabase
        .from('fantasy_stages')
        .select('*')
        .eq('stage_number', nextStageNumber)
        .eq('stage_tier', (currentStage as any).tier || 'basic')
        .single();
      
      if (error || !nextStageData) {
        alert(`ステージ ${nextStageNumber} が見つかりません`);
        devLog.debug('次のステージが見つからない:', { nextStageNumber, error });
        return;
      }

      // データベースの形式から FantasyStage 形式に変換
      const convertedStage: FantasyStage = {
        id: nextStageData.id,
        stageNumber: nextStageData.stage_number,
        name: nextStageData.name,
        description: nextStageData.description || '',
        maxHp: nextStageData.max_hp,
        enemyGaugeSeconds: nextStageData.enemy_gauge_seconds,
        enemyCount: nextStageData.enemy_count,
        enemyHp: nextStageData.enemy_hp,
        minDamage: nextStageData.min_damage,
        maxDamage: nextStageData.max_damage,
        mode: nextStageData.mode as 'single' | 'single_order' | 'progression_order' | 'progression_random' | 'progression_timing' | 'timing_combining',
        allowedChords: Array.isArray(nextStageData.allowed_chords) ? nextStageData.allowed_chords : [],
        chordProgression: Array.isArray(nextStageData.chord_progression) ? nextStageData.chord_progression : undefined,
        chordProgressionData: (nextStageData as any).chord_progression_data,
        showSheetMusic: false,
        showGuide: nextStageData.show_guide,
        monsterIcon: 'dragon',
        bgmUrl: nextStageData.bgm_url || (nextStageData as any).mp3_url,
        simultaneousMonsterCount: nextStageData.simultaneous_monster_count || 1,
        bpm: (nextStageData as any).bpm || 120,
        measureCount: (nextStageData as any).measure_count,
        countInMeasures: (nextStageData as any).count_in_measures,
        timeSignature: (nextStageData as any).time_signature,
        // 追加: 拍間隔（存在すれば）
        noteIntervalBeats: (nextStageData as any).note_interval_beats,
        // ステージ設定のルート音
        playRootOnCorrect: (nextStageData as any).play_root_on_correct ?? true,
        tier: (nextStageData as any).stage_tier || 'basic',
        // 楽譜モード
        isSheetMusicMode: !!(nextStageData as any).is_sheet_music_mode,
        sheetMusicClef: (nextStageData as any).sheet_music_clef || 'treble',
        required_clears_for_next: (nextStageData as any).required_clears_for_next ?? 5,
        musicXml: (nextStageData as any).music_xml,
        combinedStageIds: (nextStageData as any).combined_stage_ids ?? undefined,
        combinedSectionRepeats: (nextStageData as any).combined_section_repeats ?? undefined,
        combinedSectionMeasureLimits: (nextStageData as any).combined_section_measure_limits ?? undefined,
        callResponseEnabled: !!(nextStageData as any).call_response_enabled,
        callResponseMode: (nextStageData as any).call_response_mode ?? undefined,
        callResponseListenBars: (nextStageData as any).call_response_listen_bars ?? undefined,
        callResponsePlayBars: (nextStageData as any).call_response_play_bars ?? undefined,
        combinedSectionListenBars: (nextStageData as any).combined_section_listen_bars ?? undefined,
        combinedSectionPlayBars: (nextStageData as any).combined_section_play_bars ?? undefined,
        combinedSectionCrModes: (nextStageData as any).combined_section_cr_modes ?? undefined,
        useRhythmNotation: !!(nextStageData as any).use_rhythm_notation,
        productionRepeatTranspositionMode: (nextStageData as any).production_repeat_transposition_mode ?? undefined,
        productionStartKey: (nextStageData as any).production_start_key ?? undefined,
      };

      setGameResult(null);
      setShowResult(false);
      resolveMusicXml(convertedStage).then(s => setCurrentStage(s));   // MusicXML URL を解決
      setGameKey(k => k + 1);  // 強制リマウント
      
      devLog.debug('✅ 次のステージに遷移:', convertedStage);
      } catch (err) {
        console.error('次のステージ読み込みエラー:', err);
        alert(isEnglishCopy ? 'Failed to load the next stage.' : '次のステージの読み込みに失敗しました');
    }
  }, [currentStage, isFreeOrGuest, handleBackToStageSelect]);
  
  const handleBackToMenu = useCallback(() => {
    if (isIOSWebView()) {
      sendGameCallback('gameEnd');
      return;
    }
    window.location.hash = isMissionMode ? '#missions' : '#dashboard';
  }, [isMissionMode]);
  
  // ステージ選択画面（レッスン/ミッション直リンク時は取得完了まで出さない）
  if (!currentStage && !gameResult) {
    if (embeddedFantasyUrlOnMount && !embeddedStageLoadFailed) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center fantasy-game-screen">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {isEnglishCopy ? 'Loading Fantasy Mode...' : 'ファンタジーモード読み込み中...'}
            </h2>
          </div>
        </div>
      );
    }
    return (
      <FantasyStageSelect
        onStageSelect={handleStageSelect}
        onBackToMenu={handleBackToMenu}
        initialTier={lastPlayedTier}
        initialRank={lastPlayedRank}
      />
    );
  }
  
  // ゲーム結果画面
  if (showResult && gameResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-start justify-center p-4 overflow-y-auto">
        <div className="text-white text-center max-w-md w-full my-auto py-6 min-h-fit">
          {/* 結果タイトル */}
            <h2 className="text-3xl font-bold mb-6 font-sans">
              {currentStage?.stageNumber}&nbsp;
              {gameResult.result === 'clear' ? stageClearText : gameOverText}
            </h2>
          
          {/* ランク表示 */}
          <div className={`inline-block px-8 py-4 rounded-xl border-2 mb-6 ${getRankBgColor(gameResult.rank)}`}>
            <div className="text-sm text-gray-300 mb-1">{rankLabel}</div>
            <div className={`text-5xl font-bold ${getRankColor(gameResult.rank)}`}>
              {gameResult.rank}
            </div>
          </div>
          
          {/* 結果表示 */}
          <div className="bg-black bg-opacity-30 rounded-lg p-6 mb-6">
              <div className="text-lg font-sans">
                <div>{correctAnswersLabel}: <span className="text-green-300 font-bold text-2xl">{gameResult.correctAnswers}</span></div>
              </div>
            
            {/* 次ステージ開放情報 */}
            {shouldShowNextStageInfo && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                {shouldShowStageUnlockedMessage ? (
                  <div className="text-yellow-400 font-bold text-lg">
                    {stageUnlockedLabel}
                  </div>
                ) : (
                  <div className="text-gray-300">
                    <span className="text-sm">{nextStageUnlockLabel}:</span>
                    <div className="text-xl font-bold text-blue-300">
                      {isEnglishCopy 
                        ? `${nextStageUnlockInfo.remainingClears} ${clearsRemainingLabel}`
                        : `あと${nextStageUnlockInfo.remainingClears}${clearsRemainingLabel}`
                      }
                    </div>
                    <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-400 h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (nextStageUnlockInfo.currentClearCredit / nextStageUnlockInfo.requiredClears) * 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {nextStageUnlockInfo.currentClearCredit} / {nextStageUnlockInfo.requiredClears}
                      {gameResult.rank === 'S' && (
                        <span className="text-yellow-400 ml-2">(S{isEnglishCopy ? ' Rank = 10 clears!' : 'ランク = 10回分！'})</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
          
          {/* アクションボタン */}
          <div className="space-y-4">
            {/* ミッションモード時は「次のステージへ」を表示しない */}
              {canProceedToNextStage && (
                <button onClick={gotoNextStageWaiting} className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors font-sans">{nextStageButtonLabel}</button>
              )}
              <button
                onClick={() => {
                  setPlayMode('challenge');
                  setShowResult(false);
                  setGameKey(prevKey => prevKey + 1);
                  setPendingAutoStart(true);
                  setPendingSpeedMultiplier(1.0); // 再挑戦は通常速度
                }}
                className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors font-sans"
              >
                {retryButtonLabel}
              </button>
              {/* 練習ボタン - progressionモードの場合は速度選択・移調設定付き */}
              {currentStage?.mode?.startsWith('progression') ? (
                <ResultPracticeSettings
                  currentStage={currentStage}
                  isEnglishCopy={isEnglishCopy}
                  onStartPractice={(speed, transposeOpts) => {
                    setPlayMode('practice');
                    setShowResult(false);
                    setGameKey(prevKey => prevKey + 1);
                    setPendingAutoStart(true);
                    setPendingSpeedMultiplier(speed);
                    // 移調設定はFantasyGameScreen側で処理（URLパラメータ経由ではなくprops経由）
                  }}
                />
              ) : (
                /* singleモードの場合は従来の練習ボタン */
                <button
                  onClick={() => {
                    setPlayMode('practice');
                    setShowResult(false);
                    setGameKey(prevKey => prevKey + 1);
                    setPendingAutoStart(true);
                  }}
                  className="w-full px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors font-sans border border-white/20"
                >
                  {isEnglishCopy ? 'Practice' : '練習する'}
                </button>
              )}
            {/* 戻るボタンの遷移先を分岐 */}
              {isLessonMode && lessonContext ? (
                <button onClick={() => { if (isIOSWebView()) { sendGameCallback('gameEnd'); return; } window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`; }} className="w-full px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors font-sans">{isEnglishCopy ? 'Back to lesson' : 'レッスンに戻る'}</button>
              ) : (
                <button onClick={handleBackToStageSelect} className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors font-sans">{backToSelectLabel}</button>
              )}
          </div>
        </div>
      </div>
    );
  }
  
  // ゲーム画面
  if (currentStage) {
    return (
      <FantasyGameScreen
        // ▼▼▼ 追加 ▼▼▼
        key={gameKey} // keyプロパティを渡す
        // ▲▲▲ ここまで ▲▲▲
        stage={currentStage}
        autoStart={pendingAutoStart}   // ★
        autoStartSpeedMultiplier={pendingSpeedMultiplier} // ★ 速度倍率を渡す
        playMode={playMode}
        onPlayModeChange={setPlayMode}
        onSwitchToChallenge={() => {
          setPlayMode('challenge');
          setGameKey(prevKey => prevKey + 1);
          setPendingAutoStart(true);
          setPendingSpeedMultiplier(1.0); // 挑戦モードは通常速度
        }}
        onGameComplete={handleGameComplete}
        onBackToStageSelect={handleBackToStageSelect}
        noteNameLang={settings.noteNameStyle === 'solfege' ? 'solfege' : 'en'}
        simpleNoteName={settings.simpleDisplayMode}
        lessonMode={isLessonMode}
      />
    );
  }
  
  // ステージ選択画面
  return (
    <FantasyStageSelect
      onStageSelect={handleStageSelect}
      onBackToMenu={handleBackToMenu}
      initialTier={lastPlayedTier}
      initialRank={lastPlayedRank}
    />
  );
};

export default FantasyMain;