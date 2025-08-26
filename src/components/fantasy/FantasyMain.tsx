/**
 * ファンタジーモードメインコンポーネント
 * ルーティング管理とゲーム状態管理
 */

import React, { useState, useCallback, useEffect } from 'react';
import FantasyStageSelect from './FantasyStageSelect';
import FantasyGameScreen from './FantasyGameScreen';
import { FantasyStage } from './FantasyGameEngine';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { devLog } from '@/utils/logger';
import type { DisplayLang } from '@/utils/display-note';
import { LessonContext } from '@/types';
import { fetchFantasyStageById } from '@/platform/supabaseFantasyStages';
import { updateLessonRequirementProgress } from '@/platform/supabaseLessonRequirements';
import { getWizardRankString } from '@/utils/fantasyRankConstants';
import { currentLevelXP, xpToNextLevel } from '@/utils/xpCalculator';
import { useToast } from '@/stores/toastStore';
import { incrementFantasyMissionProgressOnClear } from '@/platform/supabaseChallengeFantasy';

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
}

const FantasyMain: React.FC = () => {
  const { profile, isGuest } = useAuthStore();
  const { settings } = useGameStore();
  const toast = useToast();
  const [currentStage, setCurrentStage] = useState<FantasyStage | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lessonContext, setLessonContext] = useState<LessonContext | null>(null);
  const [isLessonMode, setIsLessonMode] = useState(false);
  const [missionContext, setMissionContext] = useState<{ missionId: string; stageId: string } | null>(null);
  const [isMissionMode, setIsMissionMode] = useState(false);
  
  // ▼▼▼ 追加 ▼▼▼
  // ゲームコンポーネントを強制的に再マウントさせるためのキー
  const [gameKey, setGameKey] = useState(0); 
  // 再挑戦時の自動開始フラグ
  const [pendingAutoStart, setPendingAutoStart] = useState(false);
  // ▲▲▲ ここまで ▲▲▲
  
  // 経験値情報を保存するための state を追加
  const [xpInfo, setXpInfo] = useState<{
    gained: number;
    total: number;
    level: number;
    previousLevel: number;
    nextLevelXp: number;
    currentLevelXp: number;
    leveledUp: boolean;
    base: number;
    multipliers: { membership: number; guild: number };
  } | null>(null);
  
  // フリープラン・ゲストユーザーかどうかの確認
  const isFreeOrGuest = isGuest || (profile && profile.rank === 'free');
  
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
    
    if (lessonId && lessonSongId && stageId && clearConditionsStr) {
      // レッスンモード
      setIsLessonMode(true);
      try {
        const clearConditions = JSON.parse(clearConditionsStr);
        setLessonContext({
          lessonId,
          lessonSongId,
          clearConditions,
          sourceType: 'fantasy'
        });
        fetchFantasyStageById(stageId).then(stage => {
          const fantasyStage: FantasyStage = {
            id: stage.id,
            stageNumber: stage.stage_number,
            name: stage.name,
            description: stage.description,
            maxHp: stage.max_hp,
            enemyGaugeSeconds: stage.enemy_gauge_seconds,
            enemyCount: stage.enemy_count,
            enemyHp: stage.enemy_hp,
            minDamage: stage.min_damage,
            maxDamage: stage.max_damage,
            mode: (['single','progression_order','progression_random','progression_timing'] as const).includes(stage.mode as any)
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
            playRootOnCorrect: (stage as any).play_root_on_correct ?? true
          };
          setCurrentStage(fantasyStage);
        }).catch(err => {
          console.error('Failed to load fantasy stage:', err);
        });
      } catch (e) {
        console.error('Failed to parse clear conditions:', e);
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
          description: stage.description,
          maxHp: stage.max_hp,
          enemyGaugeSeconds: stage.enemy_gauge_seconds,
          enemyCount: stage.enemy_count,
          enemyHp: stage.enemy_hp,
          minDamage: stage.min_damage,
          maxDamage: stage.max_damage,
          mode: (['single','progression_order','progression_random','progression_timing'] as const).includes(stage.mode as any)
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
          playRootOnCorrect: (stage as any).play_root_on_correct ?? true
        };
        setCurrentStage(fantasyStage);
      }).catch(err => console.error('Failed to load fantasy stage:', err));
      return;
    }
  }, []);

  // ステージ選択ハンドラ
  const handleStageSelect = useCallback((stage: FantasyStage) => {
    setCurrentStage(stage);
    setGameResult(null);
    setShowResult(false);
    setGameKey(prevKey => prevKey + 1);
  }, []);
  
  // ゲーム完了ハンドラ
  const handleGameComplete = useCallback(async (
    result: 'clear' | 'gameover', 
    score: number, 
    correctAnswers: number, 
    totalQuestions: number
  ) => {
    setPendingAutoStart(false);
    devLog.debug('🎮 ファンタジーモード: ゲーム完了', { result, score, correctAnswers, totalQuestions });
    const gameResult: GameResult = { result, score, correctAnswers, totalQuestions };
    setGameResult(gameResult);
    setShowResult(true);
    
    // レッスンモードの場合の処理
    if (isLessonMode && lessonContext) {
      if (result === 'clear') {
        try {
          const achievedRank = lessonContext.clearConditions?.rank || 'B';
          await updateLessonRequirementProgress(
            lessonContext.lessonId,
            lessonContext.lessonSongId,
            achievedRank,
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
          // 初クリア判定
          let isFirstTimeClear = false;
          if (result === 'clear') {
            const { data: preClear } = await supabase
              .from('fantasy_stage_clears')
              .select('id')
              .eq('user_id', profile.id)
              .eq('stage_id', currentStage.id)
              .eq('clear_type', 'clear')
              .maybeSingle();
            isFirstTimeClear = !preClear;
          }
          // クリア記録保存（clear のみ）
          if (result === 'clear') {
            try {
              await supabase
                .from('fantasy_stage_clears')
                .upsert({
                  user_id: profile.id,
                  stage_id: currentStage.id,
                  score: score,
                  clear_type: result,
                  remaining_hp: Math.max(1, 5 - (totalQuestions - correctAnswers)),
                  total_questions: totalQuestions,
                  correct_answers: correctAnswers
                });
            } catch {}
          }
          // 進捗の更新
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

    // 経験値付与（addXp関数を使用）
    const xpGain = result === 'clear' ? 1000 : 200;
    const reason = `ファンタジーモード${currentStage?.stageNumber}${result === 'clear' ? 'クリア' : 'チャレンジ'}`;
    try {
      const { addXp } = await import('@/platform/supabaseXp');
      let membershipMultiplier = 1;
      let guildMultiplier = 1;
      try {
        if (profile?.rank === 'premium') membershipMultiplier = 1.5;
        if (profile?.rank === 'platinum') membershipMultiplier = 2;
        const { getMyGuild, fetchGuildMemberMonthlyXp } = await import('@/platform/supabaseGuilds');
        const { computeGuildBonus } = await import('@/utils/guildBonus');
        const myGuild = await getMyGuild();
        if (myGuild) {
          const perMember = await fetchGuildMemberMonthlyXp(myGuild.id);
          const contributors = perMember.filter(x => Number(x.monthly_xp || 0) >= 1).length;
          let streakSum = 0;
          if (myGuild.guild_type === 'challenge') {
            // チャレンジギルドの追加ボーナス（既存の計算に準拠）
          }
          guildMultiplier = computeGuildBonus(myGuild.level || 1, contributors).totalMultiplier;
        }
      } catch {}

      const xpResult = await addXp({
        songId: null,
        baseXp: xpGain,
        speedMultiplier: 1,
        rankMultiplier: 1,
        transposeMultiplier: 1,
        membershipMultiplier,
        missionMultiplier: guildMultiplier,
        reason,
      });

      const previousLevel = profile?.level || 1;
      const leveledUp = xpResult.level > previousLevel;
      const currentLvXp = currentLevelXP(xpResult.level, xpResult.totalXp);
      const nextLvXp = xpToNextLevel(xpResult.level);
      setXpInfo({
        gained: xpResult.gainedXp,
        total: xpResult.totalXp,
        level: xpResult.level,
        previousLevel,
        nextLevelXp: nextLvXp,
        currentLevelXp: currentLvXp,
        leveledUp,
        base: xpGain,
        multipliers: { membership: membershipMultiplier, guild: guildMultiplier },
      });
      if (leveledUp) {
        toast.success(`レベルアップ！ Lv.${previousLevel} → Lv.${xpResult.level}`, { duration: 5000, title: 'おめでとうございます！' });
      }
    } catch (xpError) {
      console.error('ファンタジーモードXP付与エラー:', xpError);
    }
  }, [isGuest, profile, currentStage, isLessonMode, lessonContext, toast, isFreeOrGuest, isMissionMode, missionContext]);

  // ステージ選択に戻る
  const handleBackToStageSelect = useCallback(() => {
    if (isMissionMode) {
      window.location.hash = '#missions';
      return;
    }
    setCurrentStage(null);
    setGameResult(null);
  }, [isMissionMode]);
  
  // ★ 追加: 次のステージに待機画面で遷移
  const gotoNextStageWaiting = useCallback(async () => {
    if (!currentStage) return;
    
    const nextStageNumber = getNextStageNumber(currentStage.stageNumber);
    
    // フリープラン・ゲストユーザーの場合、1-4以降には進めない
    if (isFreeOrGuest && nextStageNumber >= '1-4') {
      toast.error('フリープラン・ゲストプレイでは、ステージ1-3までプレイ可能です。', {
        duration: 5000
      });
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
        .eq('stage_tier', ((currentStage as any).tier === 'advanced' ? 'advanced' : 'basic'))
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
        mode: nextStageData.mode as 'single' | 'progression_order' | 'progression_random' | 'progression_timing',
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
      };

      setGameResult(null);
      setShowResult(false);
      setCurrentStage(convertedStage);   // ← 実データで待機画面
      setGameKey(k => k + 1);  // 強制リマウント
      
      devLog.debug('✅ 次のステージに遷移:', convertedStage);
    } catch (err) {
      console.error('次のステージ読み込みエラー:', err);
      alert('次のステージの読み込みに失敗しました');
    }
  }, [currentStage, isFreeOrGuest, handleBackToStageSelect]);
  
  // メニューに戻る
  const handleBackToMenu = useCallback(() => {
    window.location.hash = isMissionMode ? '#missions' : '#dashboard';
  }, [isMissionMode]);
  
  // ステージ選択画面
  if (!currentStage && !gameResult) {
    return (
      <FantasyStageSelect
        onStageSelect={handleStageSelect}
        onBackToMenu={handleBackToMenu}
      />
    );
  }
  
  // ゲーム結果画面
  if (showResult && gameResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="text-white text-center max-w-md w-full">
          {/* 結果タイトル */}
          <h2 className="text-3xl font-bold mb-6 font-sans">
            {currentStage?.stageNumber}&nbsp;
            {gameResult.result === 'clear' ? 'ステージクリア！' : 'ゲームオーバー'}
          </h2>
          
          {/* 結果表示 */}
          <div className="bg-black bg-opacity-30 rounded-lg p-6 mb-6">
            <div className="text-lg font-sans">
              <div>正解数: <span className="text-green-300 font-bold text-2xl">{gameResult.correctAnswers}</span></div>
            </div>
            
            {/* 経験値獲得 */}
            <div className="mt-4 pt-4 border-t border-gray-600 font-sans">
              {xpInfo ? (
                <>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div className="flex justify-between">
                      <span>基本XP:</span>
                      <span>{xpInfo.base}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ランクボーナス:</span>
                      <span>x{xpInfo.multipliers.membership}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ギルドボーナス:</span>
                      <span>x{xpInfo.multipliers.guild}</span>
                    </div>
                  </div>
                  <div className="text-green-300 font-bold text-xl mt-2">
                    獲得: +{xpInfo.gained} XP
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-300">XP計算中...</div>
              )}

              {/* 次レベルまでの経験値表示 */}
              {xpInfo && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  {xpInfo.leveledUp && (
                    <div className="text-yellow-400 font-bold mb-2">
                      レベルアップ！ Lv.{xpInfo.previousLevel} → Lv.{xpInfo.level}
                    </div>
                  )}
                  <div className="text-sm text-gray-300">
                    現在のレベル: Lv.{xpInfo.level}
                  </div>
                  <div className="text-sm text-gray-300">
                    次のレベルまで: {xpInfo.currentLevelXp.toLocaleString()} / {xpInfo.nextLevelXp.toLocaleString()} XP
                  </div>
                  <div className="mt-2 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-purple-400 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (xpInfo.currentLevelXp / xpInfo.nextLevelXp) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* アクションボタン */}
          <div className="space-y-4">
            {/* ミッションモード時は「次のステージへ」を表示しない */}
            {gameResult.result === 'clear' && !isLessonMode && !isMissionMode && (
              <button onClick={gotoNextStageWaiting} className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors font-sans">次のステージへ</button>
            )}
            <button
              onClick={() => { setShowResult(false); setGameKey(prevKey => prevKey + 1); setPendingAutoStart(true); }}
              className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors font-sans"
            >
              再挑戦
            </button>
            {/* 戻るボタンの遷移先を分岐 */}
            {isLessonMode && lessonContext ? (
              <button onClick={() => { window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`; }} className="w-full px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors font-sans">レッスンに戻る</button>
            ) : isMissionMode ? (
              <button onClick={() => { window.location.hash = '#missions'; }} className="w-full px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors font-sans">ミッションに戻る</button>
            ) : (
              <button onClick={handleBackToStageSelect} className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors font-sans">ステージ選択に戻る</button>
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
    />
  );
};

export default FantasyMain;