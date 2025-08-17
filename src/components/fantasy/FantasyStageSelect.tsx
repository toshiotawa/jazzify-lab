/**
 * ファンタジーステージ選択画面
 * ステージ一覧表示とアンロック管理
 */

import React, { useState, useEffect, useCallback } from 'react';
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

// ===== 型定義 =====

interface FantasyUserProgress {
  id: string;
  userId: string;
  currentStageNumber: string;
  wizardRank: string;
  totalClearedStages: number;
}

interface FantasyStageClear {
  id: string;
  userId: string;
  stageId: string;
  clearedAt: string;
  score: number;
  clearType: 'clear' | 'gameover';
  remainingHp: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface FantasyStageSelectProps {
  onStageSelect: (stage: FantasyStage) => void;
  onBackToMenu: () => void;
}

// ===== 定数 =====
// WIZARD_RANKS, getRankFromClearedStages, RANK_COLORS, RANK_NAMESの定義を削除

// ===== ステージグルーピング =====
const groupStagesByRank = (stages: FantasyStage[]): Record<string, FantasyStage[]> => {
  return stages.reduce((groups, stage) => {
    const rank = stage.stageNumber.split('-')[0];
    if (!groups[rank]) groups[rank] = [];
    groups[rank].push(stage);
    return groups;
  }, {} as Record<string, FantasyStage[]>);
};

const FantasyStageSelect: React.FC<FantasyStageSelectProps> = ({
  onStageSelect,
  onBackToMenu,
  lessonContext
}) => {
  const { profile, isGuest } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<FantasyStage[]>([]);
  const [userProgress, setUserProgress] = useState<FantasyUserProgress | null>(null);
  const [stageClears, setStageClears] = useState<FantasyStageClear[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRank, setSelectedRank] = useState<string>('1');
  
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
        // ステージマスタデータの読み込み
        const timeoutMs = 7000;
        const stagesQuery = supabase
          .from('fantasy_stages')
          .select('*')
          .order('stage_number');
        const { data: stagesData, error: stagesError } = await Promise.race([
          stagesQuery,
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('stages timeout')), timeoutMs))
        ]);
        
        if (stagesError) {
          throw new Error(`ステージデータの読み込みに失敗: ${stagesError.message}`);
        }
        
        const convertedStages: FantasyStage[] = (stagesData || []).map((stage: any) => ({
          id: stage.id,
          stageNumber: stage.stage_number,
          name: stage.name,
          description: stage.description,
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
      const convertedStages: FantasyStage[] = (stagesData || []).map((stage: any) => ({
        id: stage.id,
        stageNumber: stage.stage_number,
        name: stage.name,
        description: stage.description || '',
        maxHp: stage.max_hp,
        enemyGaugeSeconds: stage.enemy_gauge_seconds,
        enemyCount: stage.enemy_count,
        enemyHp: stage.enemy_hp,
        minDamage: stage.min_damage,
        maxDamage: stage.max_damage,
        mode: stage.mode as 'single' | 'progression_order' | 'progression_random' | 'progression_timing',
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
      }));
      
      const convertedProgress: FantasyUserProgress = {
        id: userProgressData.id,
        userId: userProgressData.user_id,
        currentStageNumber: userProgressData.current_stage_number,
        wizardRank: userProgressData.wizard_rank,
        totalClearedStages: userProgressData.total_cleared_stages
      };
      
      const convertedClears: FantasyStageClear[] = (clearsData || []).map((clear: any) => ({
        id: clear.id,
        userId: clear.user_id,
        stageId: clear.stage_id,
        clearedAt: clear.cleared_at,
        score: clear.score,
        clearType: clear.clear_type as 'clear' | 'gameover',
        remainingHp: clear.remaining_hp,
        totalQuestions: clear.total_questions,
        correctAnswers: clear.correct_answers
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
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      console.error('❌ ファンタジーデータ読み込みエラー:', err);
    } finally {
      setLoading(false);
    }
  }, [isGuest]);
  
  // 初期読み込み
  useEffect(() => {
    loadFantasyData();
  }, [loadFantasyData]);
  
  // 現在地のステージ番号からランクを設定
  useEffect(() => {
    if (userProgress && userProgress.currentStageNumber) {
      const currentRank = userProgress.currentStageNumber.split('-')[0];
      setSelectedRank(currentRank);
      devLog.debug('🎮 現在のランクを設定:', currentRank);
    } else if (isFreeOrGuest) {
      // ゲストユーザーまたはフリープランの場合はランク1をデフォルトに設定
      setSelectedRank('1');
    }
  }, [userProgress, isFreeOrGuest]);
  
  // ステージがアンロックされているかチェック
  const isStageUnlocked = useCallback((stage: FantasyStage): boolean => {
    // フリープラン・ゲストユーザーの場合は1-1, 1-2, 1-3のみアンロック
    if (isFreeOrGuest) {
      const allowedStages = ['1-1', '1-2', '1-3'];
      return allowedStages.includes(stage.stageNumber);
    }
    
    if (!userProgress) return false;

    /* 1) すでにクリア記録があれば無条件でアンロック */
    const cleared = stageClears.some(
      c => c.stageId === stage.id && c.clearType === 'clear'
    );
    if (cleared) return true;

    /* 2) progress に記録されている現在地より前ならアンロック */
    const [currR, currS] = userProgress.currentStageNumber.split('-').map(Number);
    const [r, s] = stage.stageNumber.split('-').map(Number);
    if (r < currR) return true;
    if (r === currR && s <= currS) return true;

    return false;
  }, [userProgress, stageClears, isFreeOrGuest]);
  
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
    const [targetMajor, targetMinor] = stage.stageNumber.split('-').map(Number);
    
    // 全ステージをソートしてインデックスを見つける
    const allStages = stages.slice().sort((a, b) => {
      const [aMajor, aMinor] = a.stageNumber.split('-').map(Number);
      const [bMajor, bMinor] = b.stageNumber.split('-').map(Number);
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
  }, [stages]);
  
  // ステージカードのレンダリング
  const renderStageCard = useCallback((stage: FantasyStage, index: number) => {
    const unlocked = isStageUnlocked(stage);
    const clearInfo = getStageClearInfo(stage);
    const isCleared = clearInfo && clearInfo.clearType === 'clear';
    
    // グローバルインデックスを基にアイコン番号を計算（1-10の範囲）
    const globalIndex = getStageGlobalIndex(stage);
    const iconNumber = (globalIndex % 10) + 1;
    
    // モード表示のマッピング
    const modeDisplayMap: Record<string, { label: string; color: string }> = {
      'single': { label: 'クイズ', color: 'bg-blue-500' },
      'progression_order': { label: 'リズム・順番', color: 'bg-green-500' },
      'progression_random': { label: 'リズム・ランダム', color: 'bg-purple-500' },
      'progression_timing': { label: 'リズム・カスタム', color: 'bg-orange-500' }
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
        
        {/* コンテンツ部分 */}
        <div className="min-w-0 flex-grow">
          {/* ステージ名 */}
          <div className={cn(
            "text-base sm:text-lg font-medium mb-1 whitespace-normal break-words",
            unlocked ? "text-white" : "text-gray-400"
          )}>
            {unlocked ? stage.name : "???"}
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
          
          {/* 説明文 */}
          <div className={cn(
            "text-xs sm:text-sm leading-relaxed break-words",
            unlocked ? "text-gray-300" : "text-gray-500"
          )}>
            {unlocked ? stage.description : (
              isFreeOrGuest && stage.stageNumber >= '1-4' 
                ? "スタンダードプラン以上で利用可能です" 
                : "このステージはまだロックされています"
            )}
          </div>
        </div>
        
        {/* 右側のアイコン */}
        <div className="flex-shrink-0 self-center">
          {!unlocked && (
            <div className="text-xl sm:text-2xl">
              <span>🔒</span>
            </div>
          )}
          {isCleared && (
            <div className="text-yellow-400 text-xl sm:text-2xl">
              ⭐
            </div>
          )}
        </div>
      </div>
    );
  }, [isStageUnlocked, getStageClearInfo, handleStageSelect, getStageGlobalIndex, isFreeOrGuest]);
  
  // ローディング画面
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center fantasy-game-screen">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl sm:text-2xl font-bold">ファンタジーモード読み込み中...</h2>
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
          <h2 className="text-xl sm:text-2xl font-bold mb-4">エラーが発生しました</h2>
          <p className="text-indigo-200 mb-6 text-sm sm:text-base">{error}</p>
          <div className="space-x-2 sm:space-x-4">
            <button
              onClick={loadFantasyData}
              className="px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              再読み込み
            </button>
            <button
              onClick={onBackToMenu}
              className="px-4 sm:px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // メイン画面
  const groupedStages = groupStagesByRank(stages);
  const currentWizardRank = userProgress ? userProgress.wizardRank : 'F';
  const totalCleared = userProgress ? userProgress.totalClearedStages : 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 overflow-y-auto fantasy-game-screen">
      {/* ヘッダー */}
      <div className="relative z-10 p-4 sm:p-6 text-white">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
              <img src="/default_avater/default-avater.png" alt="ファンタジーモード" className="w-12 h-12 sm:w-16 sm:h-16" />
              <span className="whitespace-normal break-words">ファンタジーモード</span>
            </h1>
            <div className="flex items-center space-x-4 sm:space-x-6 text-base sm:text-lg">
              <div>現在地: <span className="text-blue-300 font-bold">{userProgress?.currentStageNumber || '1-1'}</span></div>
            </div>
          </div>
          
          <button
            onClick={onBackToMenu}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap"
          >
            戻る
          </button>
        </div>
      </div>
      
      {/* フリープラン・ゲストユーザー向けのメッセージ */}
      {isFreeOrGuest && (
        <div className="mx-4 sm:mx-6 mb-4 p-3 sm:p-4 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
          <p className="text-yellow-200 text-center text-sm sm:text-base">
            {isGuest ? 'ゲストプレイ中です。' : 'フリープランでご利用中です。'}
            ステージ1-1〜1-3までプレイ可能です。
            {isGuest && 'クリア記録は保存されません。'}
          </p>
        </div>
      )}
      
      {/* ランク選択タブ */}
      <div className="px-4 sm:px-6 mb-4 sm:mb-6">
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
              ランク {rank}
            </button>
          ))}
        </div>
      </div>
      
      {/* ステージ一覧 */}
      <div className="px-4 sm:px-6 pb-6">
        {selectedRank && groupedStages[selectedRank] && (
          <div className={cn(
            "rounded-xl p-4 sm:p-6 bg-gradient-to-br",
            getRankColor(parseInt(selectedRank))
          )}>
            <h2 className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              ランク {selectedRank} - {getFantasyRankInfo(parseInt(selectedRank)).title}
            </h2>
            
            <div className="space-y-2 sm:space-y-3">
              {groupedStages[selectedRank]
                .sort((a, b) => {
                  const [, aStage] = a.stageNumber.split('-').map(Number);
                  const [, bStage] = b.stageNumber.split('-').map(Number);
                  return aStage - bStage;
                })
                .map((stage, index) => renderStageCard(stage, index))
              }
            </div>
            
            {/* ランク説明 */}
            <div className="mt-4 sm:mt-6 bg-black bg-opacity-30 rounded-lg p-3 sm:p-4">
              <div className="text-white text-xs sm:text-sm">
                <p className="font-semibold mb-1 sm:mb-2">{getFantasyRankInfo(parseInt(selectedRank)).stageName}</p>
                <p className="leading-relaxed">{getFantasyRankInfo(parseInt(selectedRank)).description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* フッター */}
      <div className="text-center text-white text-xs sm:text-sm opacity-70 pb-6">
        <p>🎹 正しいコードを演奏してモンスターを倒そう！</p>
        <p className="text-[11px] sm:text-xs mt-1">構成音が全て含まれていれば正解です（順番・オクターブ不問）</p>
      </div>
    </div>
  );
};

export default FantasyStageSelect;