/**
 * ファンタジーステージ選択画面
 * ステージ一覧表示とアンロック管理
 */

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import { FantasyStage } from './FantasyGameEngine';
import BackButton from '../ui/BackButton';
import { devLog } from '@/utils/logger';
import { 
  getFantasyRankInfo, 
  getRankFromStageNumber, 
  getRankColor,
  getRankFromClearedStages as getRankFromClearedStagesUtil 
} from '@/utils/fantasyRankConstants';

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
  onBackToMenu
}) => {
  // 状態管理
  const [stages, setStages] = useState<FantasyStage[]>([]);
  const [userProgress, setUserProgress] = useState<FantasyUserProgress | null>(null);
  const [stageClears, setStageClears] = useState<FantasyStageClear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRank, setSelectedRank] = useState<string>('1');
  
  // データ読み込み
  const loadFantasyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Supabaseクライアントの動的インポート
      const { getSupabaseClient } = await import('@/platform/supabaseClient');
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('ユーザーがログインしていません');
      }
      
      // ステージマスタデータの読み込み
      const { data: stagesData, error: stagesError } = await supabase
        .from('fantasy_stages')
        .select('*')
        .order('stage_number');
      
      if (stagesError) {
        throw new Error(`ステージデータの読み込みに失敗: ${stagesError.message}`);
      }
      
      // ユーザー進捗の読み込み
      let userProgressData;
      const { data: existingProgress, error: progressError } = await supabase
        .from('fantasy_user_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (progressError && progressError.code !== 'PGRST116') { // PGRST116 = レコードが見つからない
        throw new Error(`ユーザー進捗の読み込みに失敗: ${progressError.message}`);
      }
      
      if (!existingProgress) {
        // 初回アクセス時は進捗レコードを作成
        const { data: newProgress, error: createError } = await supabase
          .from('fantasy_user_progress')
          .insert({
            user_id: user.id,
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
      } else {
        userProgressData = existingProgress;
      }
      
      // クリア記録の読み込み
      const { data: clearsData, error: clearsError } = await supabase
        .from('fantasy_stage_clears')
        .select('*')
        .eq('user_id', user.id);
      
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
        chordProgressionData: stage.chord_progression_data,
        showSheetMusic: stage.show_sheet_music,
        showGuide: stage.show_guide,
        monsterIcon: stage.monster_icon,
        bgmUrl: stage.bgm_url || stage.mp3_url,
        simultaneousMonsterCount: stage.simultaneous_monster_count || 1,
        bpm: stage.bpm || 120,
        measureCount: stage.measure_count,
        countInMeasures: stage.count_in_measures,
        timeSignature: stage.time_signature
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
  }, []);
  
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
    }
  }, [userProgress]);
  
  // ステージがアンロックされているかチェック
  const isStageUnlocked = useCallback((stage: FantasyStage): boolean => {
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
  }, [userProgress, stageClears]);
  
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
  
  // ステージカードのレンダリング
  const renderStageCard = useCallback((stage: FantasyStage) => {
    const unlocked = isStageUnlocked(stage);
    const clearInfo = getStageClearInfo(stage);
    const isCleared = clearInfo && clearInfo.clearType === 'clear';
    
    // モードの詳細テキスト
    const getModeText = (mode: string) => {
      switch (mode) {
        case 'single':
          return 'クイズ';
        case 'progression_order':
          return 'リズム・順番';
        case 'progression_random':
          return 'リズム・ランダム';
        case 'progression_timing':
          return 'リズム・カスタム';
        default:
          return mode;
      }
    };
    
    return (
      <div
        key={stage.id}
        className={cn(
          "relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] flex items-center gap-4",
          unlocked
            ? "bg-white bg-opacity-10 border-white border-opacity-30 hover:bg-opacity-20"
            : "bg-gray-700 bg-opacity-50 border-gray-600 cursor-not-allowed",
          isCleared && "ring-2 ring-yellow-400"
        )}
        onClick={() => handleStageSelect(stage)}
      >
        {/* ステージアイコン */}
        <div className="flex-shrink-0 w-20 h-20">
          <img 
            src={`/stage_icons/${stage.stageNumber}.png`}
            alt={`Stage ${stage.stageNumber}`}
            className={cn(
              "w-full h-full object-cover rounded-lg",
              !unlocked && "opacity-50 grayscale"
            )}
            onError={(e) => {
              // アイコンがない場合はステージ番号を表示
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center text-white text-2xl font-bold">${stage.stageNumber}</div>`;
              }
            }}
          />
        </div>
        
        {/* コンテンツ部分 */}
        <div className="flex-grow">
          {/* ステージ名 */}
          <div className={cn(
            "text-lg font-medium mb-1",
            unlocked ? "text-white" : "text-gray-400"
          )}>
            {unlocked ? stage.name : "???"}
          </div>
          
          {/* モード表示 */}
          <div className={cn(
            "text-sm font-medium mb-1",
            unlocked ? "text-blue-300" : "text-gray-500"
          )}>
            {unlocked ? getModeText(stage.mode) : "???"}
          </div>
          
          {/* 説明文 */}
          <div className={cn(
            "text-sm leading-relaxed",
            unlocked ? "text-gray-300" : "text-gray-500"
          )}>
            {unlocked ? stage.description : "このステージはまだロックされています"}
          </div>
        </div>
        
        {/* 右側のアイコン */}
        <div className="flex-shrink-0">
          {!unlocked && (
            <div className="text-2xl">
              <span>🔒</span>
            </div>
          )}
          {isCleared && (
            <div className="text-yellow-400 text-2xl">
              ⭐
            </div>
          )}
        </div>
      </div>
    );
  }, [isStageUnlocked, getStageClearInfo, handleStageSelect]);
  
  // ローディング画面
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center fantasy-game-screen">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">ファンタジーモード読み込み中...</h2>
        </div>
      </div>
    );
  }
  
  // エラー画面
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center fantasy-game-screen">
        <div className="text-white text-center max-w-md">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>
          <p className="text-indigo-200 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={loadFantasyData}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
            >
              再読み込み
            </button>
            <button
              onClick={onBackToMenu}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors"
            >
              メニューに戻る
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
      <div className="relative z-10 p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">🧙‍♂️ ファンタジーモード</h1>
            <div className="flex items-center space-x-6 text-sm">
              <div>現在地: <span className="text-blue-300 font-bold">{userProgress?.currentStageNumber}</span></div>
            </div>
          </div>
          
          <button
            onClick={onBackToMenu}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            メニューに戻る
          </button>
        </div>
      </div>
      
      {/* ランク選択タブ */}
      <div className="px-6 mb-6">
        <div className="flex space-x-2 overflow-x-auto">
          {Object.keys(groupedStages).map(rank => (
            <button
              key={rank}
              onClick={() => setSelectedRank(rank)}
              className={cn(
                "px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors",
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
      <div className="px-6 pb-6">
        {selectedRank && groupedStages[selectedRank] && (
          <div className={cn(
            "rounded-xl p-6 bg-gradient-to-br",
            getRankColor(parseInt(selectedRank))
          )}>
            <h2 className="text-white text-xl font-bold mb-4">
              ランク {selectedRank} - {getFantasyRankInfo(parseInt(selectedRank)).title}
            </h2>
            
            <div className="space-y-3">
              {groupedStages[selectedRank]
                .sort((a, b) => {
                  const [, aStage] = a.stageNumber.split('-').map(Number);
                  const [, bStage] = b.stageNumber.split('-').map(Number);
                  return aStage - bStage;
                })
                .map(renderStageCard)
              }
            </div>
            
            {/* ランク説明 */}
            <div className="mt-6 bg-black bg-opacity-30 rounded-lg p-4">
              <div className="text-white text-sm">
                <p className="font-semibold mb-2">{getFantasyRankInfo(parseInt(selectedRank)).stageName}</p>
                <p>{getFantasyRankInfo(parseInt(selectedRank)).description}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* フッター */}
      <div className="text-center text-white text-sm opacity-70 pb-6">
        <p>🎹 正しいコードを演奏してモンスターを倒そう！</p>
        <p className="text-xs mt-1">構成音が全て含まれていれば正解です（順番・オクターブ不問）</p>
      </div>
    </div>
  );
};

export default FantasyStageSelect;