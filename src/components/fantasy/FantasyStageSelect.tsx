/**
 * ファンタジーステージ選択画面
 * ステージ一覧表示とアンロック管理
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaHatWizard } from 'react-icons/fa';
import { cn } from '@/utils/cn';
import { FantasyStage } from './FantasyGameEngine';
// BackButton は未使用のため削除
import { devLog } from '@/utils/logger';
import { 
  getFantasyRankInfo, 
  getRankFromStageNumber, 
  getRankColor,
  getRankFromClearedStages as getRankFromClearedStagesUtil 
} from '@/utils/fantasyRankConstants';
import { useAuthStore } from '@/stores/authStore';
import { LessonContext, FantasyRank } from '@/types';
import { shouldUseEnglishCopy, getLocalizedFantasyStageName, getLocalizedFantasyStageDescription } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { 
  getRankColor as getGameRankColor, 
  getRankBgColor,
  getRemainingClearsForNextStage,
  isNextStageUnlocked 
} from '@/utils/fantasyRankCalculator';
import { isIOSWebView, sendGameCallback } from '@/utils/iosbridge';

// ===== 型定義 =====

interface FantasyUserProgress {
  id: string;
  userId: string;
  currentStageNumber: string;
  wizardRank: string;
  totalClearedStages: number;
  currentStageNumberBasic?: string;
  currentStageNumberAdvanced?: string;
  currentStageNumberPhrases?: string;
}

interface FantasyStageClear {
  id: string;
  userId: string;
  stageId: string;
  clearedAt: string;
  score: number;
  clearType: 'clear' | 'gameover';
  remainingHp: number;
  maxHp: number | null; // クリア時点のステージ最大HP（ノーダメージ判定用）
  totalQuestions: number;
  correctAnswers: number;
  // ランクシステム関連
  rank?: FantasyRank | null;
  bestRank?: FantasyRank | null;
  totalClearCredit?: number;
  clearCount?: number;
}

interface FantasyStageSelectProps {
  onStageSelect: (stage: FantasyStage) => void;
  onBackToMenu: () => void;
  lessonContext?: LessonContext | null;
  initialTier?: 'basic' | 'advanced' | 'phrases' | null;
  initialRank?: string | null;
}

// ===== 定数 =====
// WIZARD_RANKS, getRankFromClearedStages, RANK_COLORS, RANK_NAMESの定義を削除

const isDailyChallengeStageNumber = (stageNumber: string | null | undefined): boolean =>
  (stageNumber ?? '').toUpperCase().startsWith('DC-');

// ===== ステージグルーピング =====
const groupStagesByRank = (stages: FantasyStage[]): Record<string, FantasyStage[]> => {
  return stages.reduce((groups, stage) => {
    // stageNumberがnullの場合はスキップ（レッスン専用ステージ等）
    if (!stage.stageNumber) return groups;
    const rank = stage.stageNumber.split('-')[0];
    if (!groups[rank]) groups[rank] = [];
    groups[rank].push(stage);
    return groups;
  }, {} as Record<string, FantasyStage[]>);
};

const FantasyStageSelect: React.FC<FantasyStageSelectProps> = ({
  onStageSelect,
  onBackToMenu,
  lessonContext,
  initialTier,
  initialRank
}) => {
  const { profile, isGuest } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });
  const fantasyHeaderTitle = isEnglishCopy ? 'Fantasy Mode' : 'ファンタジーモード';
  const currentStageLabel = isEnglishCopy ? 'Current stage' : '現在地';
  const storyButtonLabel = isEnglishCopy ? 'Story' : 'ストーリー';
  const backButtonLabel = isEnglishCopy ? 'Back' : '戻る';
  const limitedAccessMessage = isEnglishCopy ? 'Stages 1-1 to 1-3 are available.' : 'ステージ1-1〜1-3までプレイ可能です。';
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<FantasyStage[]>([]);
  const [userProgress, setUserProgress] = useState<FantasyUserProgress | null>(null);
  const [stageClears, setStageClears] = useState<FantasyStageClear[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRank, setSelectedRank] = useState<string>(initialRank || '1');
  const [selectedTier, setSelectedTier] = useState<'basic' | 'advanced' | 'phrases'>(initialTier || 'basic');
  const initialRankApplied = useRef(!!initialRank);
  
  // フリープラン・ゲストユーザーかどうかの確認
  const isFreeOrGuest = isGuest || (profile && profile.rank === 'free');
  
  // データ読み込み
  const loadFantasyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Supabaseクライアントの動的インポート
      const { getSupabaseClient } = await import('@/platform/supabaseClient');
      const supabase = getSupabaseClient();
      // 既にストアにある情報を利用して余計なリクエストを避ける
      const authState = useAuthStore.getState();
      const userId = authState.profile?.id || authState.user?.id || null;
      
      // ゲストユーザーの場合、またはユーザーが存在しない場合は、ステージデータのみ読み込む
      if (!userId || isGuest) {
        // ステージマスタデータの読み込み（ファンタジーモード用のみ）
        const timeoutMs = 7000;
        const stagesQuery = supabase
          .from('fantasy_stages')
          .select('*')
          .in('usage_type', ['fantasy', 'both'])
          .order('stage_number');
        const { data: stagesData, error: stagesError } = await Promise.race([
          stagesQuery,
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('stages timeout')), timeoutMs))
        ]);
        
        if (stagesError) {
          throw new Error(`ステージデータの読み込みに失敗: ${stagesError.message}`);
        }
        
          const filteredStagesData = (stagesData || []).filter(
            (stage: { stage_number?: string | null }) => !isDailyChallengeStageNumber(stage.stage_number),
          );
          const convertedStages: FantasyStage[] = filteredStagesData.map((stage: any) => ({
            id: stage.id,
            stageNumber: stage.stage_number,
            name: stage.name,
            name_en: stage.name_en,
            description: stage.description,
            description_en: stage.description_en,
          maxHp: stage.max_hp,
          enemyCount: stage.enemy_count,
          enemyHp: stage.enemy_hp,
          minDamage: stage.min_damage,
          maxDamage: stage.max_damage,
          enemyGaugeSeconds: stage.enemy_gauge_seconds,
          mode: stage.mode,
          allowedChords: stage.allowed_chords,
          monsterIcon: 'dragon',
          chordProgression: stage.chord_progression,
          simultaneousMonsterCount: stage.simultaneous_monster_count || 1,
          showGuide: stage.show_guide || false,
          // 追加: 拍間隔（存在すれば）
          noteIntervalBeats: (stage as any).note_interval_beats,
          showSheetMusic: false,
          // 追加: 正解時にルート音を鳴らす
          playRootOnCorrect: (stage as any).play_root_on_correct ?? true,
          bpm: (stage as any).bpm || 120,
          tier: (stage as any).stage_tier || 'basic',
          // BGM（ゲスト用にも必須 - 欠落で無音になる）
          bgmUrl: stage.bgm_url || (stage as any).mp3_url,
          measureCount: (stage as any).measure_count,
          countInMeasures: (stage as any).count_in_measures,
          timeSignature: (stage as any).time_signature,
          // 楽譜モード
          isSheetMusicMode: !!(stage as any).is_sheet_music_mode,
          sheetMusicClef: (stage as any).sheet_music_clef || 'treble',
          // 次ステージ開放必要回数
          required_clears_for_next: (stage as any).required_clears_for_next ?? 5,
          // MusicXML（OSMD楽譜表示用）
          musicXml: (stage as any).music_xml,
          isAuftakt: !!(stage as any).is_auftakt,
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
        }));
        
        setStages(convertedStages);
        setUserProgress(null); // ゲストユーザーは進捗データなし
        setStageClears([]); // ゲストユーザーはクリア記録なし
        setLoading(false);
        return;
      }
      
      // ===== 並列取得 + タイムアウト =====
      const timeoutMs = 7000;
      const stagesQuery = supabase
        .from('fantasy_stages')
        .select('*')
        .in('usage_type', ['fantasy', 'both'])
        .order('stage_number');
      const progressQuery = supabase
        .from('fantasy_user_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      const clearsQuery = supabase
        .from('fantasy_stage_clears')
        .select('*')
        .eq('user_id', userId);
      
      const [stagesRes, progressRes, clearsRes] = await Promise.all([
        Promise.race([stagesQuery, new Promise<any>((_, r) => setTimeout(() => r(new Error('stages timeout')), timeoutMs))]),
        Promise.race([progressQuery, new Promise<any>((_, r) => setTimeout(() => r(new Error('progress timeout')), timeoutMs))]),
        Promise.race([clearsQuery, new Promise<any>((_, r) => setTimeout(() => r(new Error('clears timeout')), timeoutMs))])
      ]);
      
      const stagesError = stagesRes instanceof Error ? { message: stagesRes.message } : stagesRes.error;
      const stagesData = stagesRes instanceof Error ? [] : stagesRes.data;
      if (stagesError) {
        throw new Error(`ステージデータの読み込みに失敗: ${stagesError.message}`);
      }
      
      const progressError = progressRes instanceof Error ? { message: progressRes.message, code: undefined } : progressRes.error;
      let userProgressData = progressRes instanceof Error ? null : progressRes.data;
      if (progressError && progressError.code !== 'PGRST116') {
        throw new Error(`ユーザー進捗の読み込みに失敗: ${progressError.message}`);
      }
      
      if (!userProgressData) {
        // 初回アクセス時は進捗レコードを作成
        const { data: newProgress, error: createError } = await supabase
          .from('fantasy_user_progress')
          .insert({
            user_id: userId,
            current_stage_number: '1-1',
            current_stage_number_basic: '1-1',
            current_stage_number_advanced: '1-1',
            current_stage_number_phrases: '1-1',
            wizard_rank: 'F',
            total_cleared_stages: 0
          })
          .select()
          .single();
        if (createError) {
          throw new Error(`ユーザー進捗の作成に失敗: ${createError.message}`);
        }
        userProgressData = newProgress;
      }
      
      const clearsError = clearsRes instanceof Error ? { message: clearsRes.message } : clearsRes.error;
      const clearsData = clearsRes instanceof Error ? [] : clearsRes.data;
       
      if (clearsError) {
        throw new Error(`クリア記録の読み込みに失敗: ${clearsError.message}`);
      }
      
      //// データの変換とセット
        const filteredStagesData = (stagesData || []).filter(
          (stage: { stage_number?: string | null }) => !isDailyChallengeStageNumber(stage.stage_number),
        );
        const convertedStages: FantasyStage[] = filteredStagesData.map((stage: any) => ({
          id: stage.id,
          stageNumber: stage.stage_number,
          name: stage.name,
          name_en: stage.name_en,
          description: stage.description || '',
          description_en: stage.description_en,
        maxHp: stage.max_hp,
        enemyGaugeSeconds: stage.enemy_gauge_seconds,
        enemyCount: stage.enemy_count,
        enemyHp: stage.enemy_hp,
        minDamage: stage.min_damage,
        maxDamage: stage.max_damage,
        mode: stage.mode as 'single' | 'progression_order' | 'progression_random' | 'progression_timing' | 'timing_combining',
        allowedChords: Array.isArray(stage.allowed_chords) ? stage.allowed_chords : [],
        chordProgression: Array.isArray(stage.chord_progression) ? stage.chord_progression : undefined,
        chordProgressionData: (stage as any).chord_progression_data,
        showSheetMusic: false,
        showGuide: stage.show_guide,
        // 追加: 拍間隔（存在すれば）
        noteIntervalBeats: (stage as any).note_interval_beats,
        monsterIcon: 'dragon',
        bgmUrl: stage.bgm_url || (stage as any).mp3_url,
        simultaneousMonsterCount: stage.simultaneous_monster_count || 1,
        bpm: (stage as any).bpm || 120,
        measureCount: (stage as any).measure_count,
        countInMeasures: (stage as any).count_in_measures,
        timeSignature: (stage as any).time_signature,
        // 追加: 正解時にルート音を鳴らす
        playRootOnCorrect: (stage as any).play_root_on_correct ?? true,
        tier: (stage as any).stage_tier || 'basic',
        // 次ステージ開放必要回数
        required_clears_for_next: (stage as any).required_clears_for_next ?? 5,
        // 楽譜モード
        isSheetMusicMode: !!(stage as any).is_sheet_music_mode,
        sheetMusicClef: (stage as any).sheet_music_clef || 'treble',
        // MusicXML（OSMD楽譜表示用）
        musicXml: (stage as any).music_xml,
        // timing_combining 用
        combinedStageIds: Array.isArray((stage as any).combined_stage_ids) ? (stage as any).combined_stage_ids : undefined,
        combinedSectionRepeats: Array.isArray((stage as any).combined_section_repeats) ? (stage as any).combined_section_repeats : undefined,
        combinedSectionMeasureLimits: Array.isArray((stage as any).combined_section_measure_limits) ? (stage as any).combined_section_measure_limits : undefined,
        isAuftakt: !!(stage as any).is_auftakt,
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
      }));
      
      const convertedProgress: FantasyUserProgress = {
        id: userProgressData.id,
        userId: userProgressData.user_id,
        currentStageNumber: userProgressData.current_stage_number,
        wizardRank: userProgressData.wizard_rank,
        totalClearedStages: userProgressData.total_cleared_stages,
        currentStageNumberBasic: userProgressData.current_stage_number_basic,
        currentStageNumberAdvanced: userProgressData.current_stage_number_advanced,
        currentStageNumberPhrases: userProgressData.current_stage_number_phrases,
      };
      
      const convertedClears: FantasyStageClear[] = (clearsData || []).map((clear: any) => ({
        id: clear.id,
        userId: clear.user_id,
        stageId: clear.stage_id,
        clearedAt: clear.cleared_at,
        score: clear.score,
        clearType: clear.clear_type as 'clear' | 'gameover',
        remainingHp: clear.remaining_hp,
        maxHp: clear.max_hp ?? null,
        totalQuestions: clear.total_questions,
        correctAnswers: clear.correct_answers,
        // ランクシステム関連
        rank: clear.rank as FantasyRank | null,
        bestRank: clear.best_rank as FantasyRank | null,
        totalClearCredit: clear.total_clear_credit ?? 0,
        clearCount: clear.clear_count ?? 0
      }));
      
      setStages(convertedStages);
      setUserProgress(convertedProgress);
      setStageClears(convertedClears);
      
      devLog.debug('🎮 ファンタジーデータ読み込み完了:', {
        stages: convertedStages.length,
        progress: convertedProgress,
        clears: convertedClears.length
      });
      
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : (isEnglishCopy ? 'An unknown error occurred.' : '不明なエラーが発生しました');
        setError(errorMessage);
      devLog.error('❌ ファンタジーデータ読み込みエラー:', err);
    } finally {
      setLoading(false);
      }
    }, [isGuest, isEnglishCopy]);
  
  // 初期読み込み
  useEffect(() => {
    loadFantasyData();
  }, [loadFantasyData]);
  
  // Tier変更時にそのTierの最初のランクへ自動切替
  useEffect(() => {
    const tierFiltered = (stages || []).filter(s => (s as any).tier === selectedTier);
    const groups = groupStagesByRank(tierFiltered);
    const keys = Object.keys(groups);
    if (keys.length > 0 && !keys.includes(selectedRank)) {
      setSelectedRank(keys[0]);
    }
  }, [selectedTier, stages]);

  // 現在地のステージ番号からランクを設定
  useEffect(() => {
    // Tier変更時に最初のランクへ移動（直前のeffectで処理済み）
    if (!userProgress) {
      if (isFreeOrGuest) setSelectedRank('1');
      return;
    }
    // initialRankが指定されていて未消費の場合は、そちらを優先（戻るボタンで戻ってきた場合）
    if (initialRankApplied.current) {
      initialRankApplied.current = false;
      return;
    }
    // Basic/Advanced/Phrasesともに数値ランク（1,2,3...）運用。選択Tierの現在地ランクを開く
    const currentStageForTier = selectedTier === 'advanced'
      ? (userProgress.currentStageNumberAdvanced || userProgress.currentStageNumber)
      : selectedTier === 'phrases'
      ? (userProgress.currentStageNumberPhrases || '1-1')
      : (userProgress.currentStageNumberBasic || userProgress.currentStageNumber);
    if (currentStageForTier) {
      const currentRank = currentStageForTier.split('-')[0];
      setSelectedRank(currentRank);
      devLog.debug('🎮 現在のランクを設定:', currentRank);
    }
  }, [userProgress, isFreeOrGuest, selectedTier]);
  
  // ステージがアンロックされているかチェック
  const isStageUnlocked = useCallback((stage: FantasyStage): boolean => {
    // stageNumberがnullの場合はアンロックしない（レッスン専用ステージ等）
    if (!stage.stageNumber) return false;
    
    // フリープラン・ゲストユーザーの場合はBasic/Advancedともに1-1, 1-2, 1-3のみアンロック
    if (isFreeOrGuest) {
      const allowedStages = ['1-1', '1-2', '1-3'];
      return allowedStages.includes(stage.stageNumber);
    }
    
    if (!userProgress) return false;

    const [r, s] = stage.stageNumber.split('-').map(Number);
    if (isNaN(r) || isNaN(s)) return false;

    // 最初のランク最初のステージ（1-1）は常にアンロック
    if (r === 1 && s === 1) return true;

    // X-1 (X > 1) ステージの場合: 前のランクの最後のステージの必要クリア回数をチェック
    if (s === 1 && r > 1) {
      // 前のランクの最後のステージ（(r-1)-10）を探す
      const prevRankLastStageNumber = `${r - 1}-10`;
      const prevRankLastStage = stages.find(st => 
        st.stageNumber === prevRankLastStageNumber && 
        (st as any).tier === selectedTier
      );
      
      if (prevRankLastStage) {
        const prevRankClear = stageClears.find(c => c.stageId === prevRankLastStage.id && c.clearType === 'clear');
        // 前ランクの最後をクリアしていなければアンロックしない
        if (!prevRankClear) return false;
        
        // 必要クリア回数をチェック（ランクをまたぐ場合も同様）
        const totalClearCredit = prevRankClear?.totalClearCredit ?? 0;
        const requiredClears = (prevRankLastStage as any).required_clears_for_next ?? 
                              (prevRankLastStage as any).requiredClearsForNext ?? 5;
        
        // 必要クリア回数を満たしていればアンロック
        if (isNextStageUnlocked(totalClearCredit, requiredClears)) {
          return true;
        }
        // 必要クリア回数を満たしていなければアンロックしない
        return false;
      }
      // 前ランクの最後のステージが存在しない場合はアンロックしない
      return false;
    }

    /* 1) すでにクリア記録があれば無条件でアンロック（再挑戦可能） */
    const cleared = stageClears.some(
      c => c.stageId === stage.id && c.clearType === 'clear'
    );
    if (cleared) return true;

    /* 2) 前のステージのクリア換算回数が必要回数以上ならアンロック */
    // 前のステージを特定
    const prevStageNumber = s > 1 ? `${r}-${s - 1}` : null;
    if (prevStageNumber) {
      // 同じTierの前のステージを探す
      const prevStage = stages.find(st => 
        st.stageNumber === prevStageNumber && 
        (st as any).tier === selectedTier
      );
      
      if (prevStage) {
        const prevClear = stageClears.find(c => c.stageId === prevStage.id);
        const totalClearCredit = prevClear?.totalClearCredit ?? 0;
        const requiredClears = (prevStage as any).required_clears_for_next ?? 
                              (prevStage as any).requiredClearsForNext ?? 5;
        
        if (isNextStageUnlocked(totalClearCredit, requiredClears)) {
          return true;
        }
      }
    }

    /* 3) 従来の互換性: progress に記録されている現在地より前ならアンロック */
    const currentStageForTier = selectedTier === 'advanced'
      ? (userProgress.currentStageNumberAdvanced || userProgress.currentStageNumber)
      : selectedTier === 'phrases'
      ? (userProgress.currentStageNumberPhrases || '1-1')
      : (userProgress.currentStageNumberBasic || userProgress.currentStageNumber);
    const [currR, currS] = (currentStageForTier || '1-1').split('-').map(Number);
    if (isNaN(currR) || isNaN(currS)) return false;
    if (r < currR) return true;
    if (r === currR && s <= currS) return true;

    return false;
  }, [userProgress, stageClears, isFreeOrGuest, selectedTier, stages]);
  
  // ステージのクリア状況を取得
  const getStageClearInfo = useCallback((stage: FantasyStage) => {
    const clear = stageClears.find(c => c.stageId === stage.id);
    return clear;
  }, [stageClears]);
  
  // ステージ選択ハンドラ
  const handleStageSelect = useCallback((stage: FantasyStage) => {
    if (!isStageUnlocked(stage)) return;
    
    devLog.debug('🎮 ステージ選択:', stage.stageNumber);
    onStageSelect(stage);
  }, [isStageUnlocked, onStageSelect]);
  
  // 全ステージのグローバルインデックスを計算
  const getStageGlobalIndex = useCallback((stage: FantasyStage) => {
    let globalIndex = 0;
    // stageNumberがnullの場合は0を返す
    if (!stage.stageNumber) return 0;
    const [targetMajor, targetMinor] = stage.stageNumber.split('-').map(Number);
    
    // 選択中Tierのステージのみを対象（stageNumberがnullのものは除外）
    const tierFiltered = stages.filter(s => (s as any).tier === selectedTier && s.stageNumber);
    
    // 全ステージをソートしてインデックスを見つける
    const allStages = tierFiltered.slice().sort((a, b) => {
      const [aMajor, aMinor] = (a.stageNumber || '0-0').split('-').map(Number);
      const [bMajor, bMinor] = (b.stageNumber || '0-0').split('-').map(Number);
      if (aMajor !== bMajor) return aMajor - bMajor;
      return aMinor - bMinor;
    });
    
    for (let i = 0; i < allStages.length; i++) {
      if (allStages[i].id === stage.id) {
        globalIndex = i;
        break;
      }
    }
    
    return globalIndex;
  }, [stages, selectedTier]);
  
  // ステージカードのレンダリング
  const renderStageCard = useCallback((stage: FantasyStage, index: number) => {
    const unlocked = isStageUnlocked(stage);
    const clearInfo = getStageClearInfo(stage);
    const isCleared = clearInfo && clearInfo.clearType === 'clear';
    
    // 最高ランク
    const bestRank = clearInfo?.bestRank;
    // クリア換算回数と次ステージ開放情報
    const totalClearCredit = clearInfo?.totalClearCredit ?? 0;
    const requiredClears = (stage as any).required_clears_for_next ?? 5;
    const remainingClears = getRemainingClearsForNextStage(totalClearCredit, requiredClears);
    const nextUnlocked = isNextStageUnlocked(totalClearCredit, requiredClears);
    
    // グローバルインデックスを基にアイコン番号を計算（1-10の範囲）
    const globalIndex = getStageGlobalIndex(stage);
    const iconNumber = (globalIndex % 10) + 1;
    
    // モード表示のマッピング
    const modeDisplayMap: Record<string, { label: string; color: string }> = {
      single: { label: isEnglishCopy ? 'Quiz' : 'クイズ', color: 'bg-blue-500' },
      progression_order: { label: isEnglishCopy ? 'Rhythm / Order' : 'リズム・順番', color: 'bg-green-500' },
      progression_random: { label: isEnglishCopy ? 'Rhythm / Random' : 'リズム・ランダム', color: 'bg-purple-500' },
      progression_timing: { label: isEnglishCopy ? 'Rhythm / Custom' : 'リズム・カスタム', color: 'bg-orange-500' },
      timing_combining: { label: isEnglishCopy ? 'Combined' : '結合', color: 'bg-pink-500' },
    };
    
    const modeDisplay = modeDisplayMap[stage.mode] || { label: stage.mode, color: 'bg-gray-500' };
    
    return (
      <div
        key={stage.id}
        className={cn(
          "relative p-4 sm:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] flex items-start sm:items-center gap-3 sm:gap-4 w-full",
          unlocked
            ? "bg-white bg-opacity-10 border-white border-opacity-30 hover:bg-opacity-20"
            : "bg-gray-700 bg-opacity-50 border-gray-600 cursor-not-allowed",
          isCleared && "ring-2 ring-yellow-400"
        )}
        onClick={() => handleStageSelect(stage)}
      >
        {/* ステージアイコン */}
        <div className="flex-shrink-0">
          <img 
            src={`/stage_icons/${iconNumber}.png`}
            alt={`Stage ${stage.stageNumber} icon`}
            className="w-14 h-14 sm:w-20 sm:h-20 object-contain"
          />
        </div>
        
        {/* ステージ番号 */}
        <div className="text-white text-lg sm:text-xl font-bold flex-shrink-0 w-14 sm:w-16 text-center">
          {stage.stageNumber}
        </div>
        
        {/* コンテンツ部分 - 最小幅を設定して要素が細くなりすぎないようにする */}
        <div className="flex-grow min-w-[120px] sm:min-w-[200px]">
          {/* ステージ名 */}
          <div className={cn(
            "text-base sm:text-lg font-medium mb-1 whitespace-normal break-words",
            unlocked ? "text-white" : "text-gray-400"
            )}>
              {unlocked ? getLocalizedFantasyStageName(stage, { rank: profile?.rank, country: profile?.country ?? geoCountry }) : "???"}
          </div>
          
          {/* モードタグ */}
          {unlocked && (
            <div className="mb-1 sm:mb-2">
              <span className={cn(
                "inline-block px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold text-white rounded-full",
                modeDisplay.color
              )}>
                {modeDisplay.label}
              </span>
            </div>
          )}
          
          {/* 説明文 - スマホでの縦伸びを防ぐため行数制限を追加 */}
          <div className={cn(
            "text-xs sm:text-sm leading-relaxed break-words line-clamp-2 sm:line-clamp-3",
            unlocked ? "text-gray-300" : "text-gray-500"
            )}>
              {unlocked ? getLocalizedFantasyStageDescription(stage, { rank: profile?.rank, country: profile?.country ?? geoCountry }) : (
                isFreeOrGuest && stage.stageNumber && stage.stageNumber >= '1-4' 
                  ? (isEnglishCopy ? 'Available on the Standard plan or higher.' : 'スタンダードプラン以上で利用可能です') 
                  : (isEnglishCopy ? 'This stage is still locked.' : 'このステージはまだロックされています')
              )}
          </div>
        </div>
        
        {/* 右側のアイコンとランク */}
        <div className="flex-shrink-0 self-center flex flex-col items-end gap-1 max-w-[60px] sm:max-w-[80px]">
          {!unlocked && (
            <div className="text-xl sm:text-2xl">
              <span>🔒</span>
            </div>
          )}
          {isCleared && bestRank && (
            <div className={`text-xl sm:text-2xl font-bold ${getGameRankColor(bestRank)}`} title={isEnglishCopy ? `Best Rank: ${bestRank}` : `最高ランク: ${bestRank}`}>
              {bestRank}
            </div>
          )}
          {unlocked && !nextUnlocked && (
            <div className="text-[10px] sm:text-xs text-blue-300 text-right leading-tight whitespace-nowrap">
              {isEnglishCopy 
                ? <>+{remainingClears} clears</>
                : <>あと{remainingClears}回</>
              }
            </div>
          )}
          {unlocked && nextUnlocked && (
            <div className="text-[10px] sm:text-xs text-green-400 text-right leading-tight whitespace-nowrap">
              {isEnglishCopy ? <>✓ Cleared</> : <>✓ 開放済</>}
            </div>
          )}
        </div>
      </div>
    );
  }, [isStageUnlocked, getStageClearInfo, handleStageSelect, getStageGlobalIndex, isFreeOrGuest, isEnglishCopy]);
  
  // ローディング画面
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center fantasy-game-screen">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl sm:text-2xl font-bold">{isEnglishCopy ? 'Loading Fantasy Mode...' : 'ファンタジーモード読み込み中...'}</h2>
        </div>
      </div>
    );
  }
  
  // エラー画面
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center fantasy-game-screen">
        <div className="text-white text-center max-w-md">
          <div className="text-5xl sm:text-6xl mb-4">😵</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4">{isEnglishCopy ? 'An error occurred' : 'エラーが発生しました'}</h2>
          <p className="text-indigo-200 mb-6 text-sm sm:text-base">{error}</p>
          <div className="space-x-2 sm:space-x-4">
            <button
              onClick={loadFantasyData}
              className="px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              {isEnglishCopy ? 'Reload' : '再読み込み'}
            </button>
            <button
              onClick={() => {
                if (isIOSWebView()) { sendGameCallback('gameEnd'); return; }
                onBackToMenu();
              }}
              className="px-4 sm:px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              {isEnglishCopy ? 'Back' : '戻る'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // メイン画面
  const groupedStages = groupStagesByRank(
    (stages || []).filter(s => (s as any).tier === selectedTier)
  );
  const selectedRankNumberRaw = Number.parseInt(selectedRank, 10);
  const selectedRankNumber = Number.isFinite(selectedRankNumberRaw) ? selectedRankNumberRaw : 1;
  const selectedRankInfo = getFantasyRankInfo(selectedRankNumber, selectedTier, isEnglishCopy);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 overflow-y-auto fantasy-game-screen">
      {/* ヘッダー */}
      <div className="relative z-10 p-4 sm:p-6 text-white">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
                <img src="/default_avater/default-avater.png" alt={fantasyHeaderTitle} className="w-12 h-12 sm:w-16 sm:h-16" />
                <span className="whitespace-normal break-words">{fantasyHeaderTitle}</span>
            </h1>
            <div className="flex items-center space-x-4 sm:space-x-6 text-base sm:text-lg">
              {(stages.some(s => (s as any).tier === selectedTier)) && (
                <div>
                    {currentStageLabel}: <span className="text-blue-300 font-bold">
                    {selectedTier === 'advanced'
                      ? (userProgress?.currentStageNumberAdvanced || userProgress?.currentStageNumber || '1-1')
                      : selectedTier === 'phrases'
                      ? (userProgress?.currentStageNumberPhrases || '1-1')
                      : (userProgress?.currentStageNumberBasic || userProgress?.currentStageNumber || '1-1')}
                  </span>
                  <span className="ml-2 text-xs opacity-80">({selectedTier === 'advanced' ? 'Advanced' : selectedTier === 'phrases' ? 'Phrases' : 'Basic'})</span>
                </div>
              )}
            </div>
          </div>
          
            <div className="flex items-center gap-2">
              {!isEnglishCopy && (
                <button
                  onClick={() => { window.location.hash = '#Story'; }}
                  className="px-3 sm:px-4 py-2 sm:py-3 bg-white/15 hover:bg-white/25 rounded-lg font-medium transition-colors text-xs sm:text-base whitespace-nowrap"
                >
                  {storyButtonLabel}
                </button>
              )}
              <button
                onClick={() => {
                  if (isIOSWebView()) { sendGameCallback('gameEnd'); return; }
                  onBackToMenu();
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                {backButtonLabel}
              </button>
            </div>
        </div>
      </div>
      
      {/* 説明セクション */}
      <div className="px-4 sm:px-6 mb-4">
        <div className="bg-black/40 rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center space-x-2 mb-1">
            <FaHatWizard className="text-purple-400 text-sm" />
            <h3 className="text-sm font-semibold text-white font-sans">
              {isEnglishCopy ? 'Defeat monsters with chords!' : 'コードでモンスターを倒そう！'}
            </h3>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm font-sans">
            {isEnglishCopy
              ? 'Play the correct chord to attack monsters. Clear stages to unlock new ones and raise your jazz skill.'
              : '正しいコードを演奏してモンスターを攻撃しよう。ステージをクリアして新しいステージを解放し、ジャズ力を上げよう！。'}
          </p>
        </div>
      </div>

      {/* フリープラン・ゲストユーザー向けのメッセージ */}
      {isFreeOrGuest && (
          <div className="mx-4 sm:mx-6 mb-4 p-3 sm:p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
            <p className="text-yellow-200 text-center text-sm sm:text-base">
              {isGuest ? (isEnglishCopy ? 'You are playing as a guest.' : 'ゲストプレイ中です。') : (isEnglishCopy ? 'You are using the free plan.' : 'フリープランでご利用中です。')}
              &nbsp;{limitedAccessMessage}
              {isGuest && (isEnglishCopy ? 'Progress is not saved in guest mode.' : 'クリア記録は保存されません。')}
            </p>
          </div>
      )}
      
      {/* ランク選択タブの上にTier切り替え */}
      <div className="px-4 sm:px-6 mb-3 sm:mb-4">
        <div className="flex space-x-2 overflow-x-auto">
          {(['basic','advanced','phrases'] as const).map(tier => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={cn(
                "px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium whitespace-nowrap transition-colors text-sm sm:text-base",
                selectedTier === tier
                  ? "bg-white text-purple-900"
                  : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
              )}
            >
              {tier === 'basic' ? 'Basic' : tier === 'advanced' ? 'Advanced' : 'Phrases'}
            </button>
          ))}
        </div>
      </div>
      
      {/* ランク選択タブ（Advancedでは非表示） */}
      {selectedTier !== 'advanced' && <div className="px-4 sm:px-6 mb-4 sm:mb-6">
        <div className="flex space-x-2 overflow-x-auto">
          {Object.keys(groupedStages).map(rank => (
            <button
              key={rank}
              onClick={() => setSelectedRank(rank)}
              className={cn(
                "px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium whitespace-nowrap transition-colors text-sm sm:text-base",
                selectedRank === rank
                  ? "bg-white text-purple-900"
                  : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
              )}
            >
              {isEnglishCopy ? `Rank ${rank}` : `ランク ${rank}`}
            </button>
          ))}
        </div>
      </div>}
      
      {/* ステージ一覧 */}
      <div className="px-4 sm:px-6 pb-6">
        {selectedTier === 'advanced' ? (
          <div className="rounded-xl p-8 sm:p-12 bg-gradient-to-br from-slate-700 to-slate-800 text-center">
            <div className="text-5xl sm:text-6xl mb-4">🔧</div>
            <h2 className="text-white text-2xl sm:text-3xl font-bold mb-3">Coming Soon...</h2>
            <p className="text-gray-300 text-sm sm:text-base">
              {isEnglishCopy
                ? 'Advanced stages are currently under development. Stay tuned!'
                : 'Advancedステージは現在準備中です。お楽しみに！'}
            </p>
          </div>
        ) : selectedRank && groupedStages[selectedRank] ? (
          <div className={cn(
            "rounded-xl p-4 sm:p-6 bg-gradient-to-br",
            getRankColor(selectedRankNumber)
          )}>
            <h2 className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">
             {isEnglishCopy ? `Rank ${selectedRank} - ${selectedRankInfo.title}` : `ランク ${selectedRank} - ${selectedRankInfo.title}`}
            </h2>
            
            <div className="space-y-2 sm:space-y-3">
              {groupedStages[selectedRank]
                .sort((a, b) => {
                  const [, aStage] = (a.stageNumber || '0-0').split('-').map(Number);
                  const [, bStage] = (b.stageNumber || '0-0').split('-').map(Number);
                  return aStage - bStage;
                })
                .map((stage, index) => renderStageCard(stage, index))
              }
            </div>
            
            {/* ランク説明 */}
            <div className="mt-4 sm:mt-6 bg-black bg-opacity-30 rounded-lg p-3 sm:p-4">
              <div className="text-white text-xs sm:text-sm">
               <p className="font-semibold mb-1 sm:mb-2">{selectedRankInfo.stageName}</p>
               <p className="leading-relaxed">{selectedRankInfo.description}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      
      {/* フッター */}
      <div className="text-center text-white text-xs sm:text-sm opacity-70 pb-6">
        {isEnglishCopy ? (
          <>
            <p>🎹 Play the correct chords to defeat the monsters!</p>
            <p className="text-[11px] sm:text-xs mt-1">Correct if all notes are included (order/octave doesn't matter)</p>
          </>
        ) : (
          <>
            <p>🎹 正しいコードを演奏してモンスターを倒そう！</p>
            <p className="text-[11px] sm:text-xs mt-1">構成音が全て含まれていれば正解です（順番・オクターブ不問）</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FantasyStageSelect;