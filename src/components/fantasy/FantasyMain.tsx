/**
 * ファンタジーモードメインコンポーネント
 * ルーティング管理とゲーム状態管理
 */

import React, { useState, useCallback } from 'react';
import FantasyStageSelect from './FantasyStageSelect';
import FantasyGameScreen from './FantasyGameScreen';
import { FantasyStage } from './FantasyGameEngine';
import { useAuthStore } from '@/stores/authStore';
import { devLog } from '@/utils/logger';

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
  const [currentStage, setCurrentStage] = useState<FantasyStage | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // ▼▼▼ 追加 ▼▼▼
  // ゲームコンポーネントを強制的に再マウントさせるためのキー
  const [gameKey, setGameKey] = useState(0); 
  // 再挑戦時の自動開始フラグ
  const [pendingAutoStart, setPendingAutoStart] = useState(false);
  // ▲▲▲ ここまで ▲▲▲
  
  // プレミアムプラン以上の確認
  const isPremiumOrHigher = profile && ['premium', 'platinum'].includes(profile.rank);
  
  // ステージ選択ハンドラ
  const handleStageSelect = useCallback((stage: FantasyStage) => {
    devLog.debug('🎮 ファンタジーモード: ステージ選択', stage.stageNumber);
    setCurrentStage(stage);
    setGameResult(null);
    setShowResult(false);
    // ▼▼▼ 追加 ▼▼▼
    setGameKey(prevKey => prevKey + 1); // ステージ選択時にキーを更新
    // ▲▲▲ ここまで ▲▲▲
  }, []);
  
  // ゲーム完了ハンドラ
  const handleGameComplete = useCallback(async (
    result: 'clear' | 'gameover', 
    score: number, 
    correctAnswers: number, 
    totalQuestions: number
  ) => {
    // pendingAutoStart をリセット
    setPendingAutoStart(false);
    devLog.debug('🎮 ファンタジーモード: ゲーム完了', { result, score, correctAnswers, totalQuestions });
    
    const gameResult: GameResult = { result, score, correctAnswers, totalQuestions };
    setGameResult(gameResult);
    setShowResult(true);
    
    // データベースに結果を保存
    try {
      if (!isGuest && profile && currentStage) {
        const { getSupabaseClient } = await import('@/platform/supabaseClient');
        const supabase = getSupabaseClient();
        
        // まず初クリアかどうかを判定（upsertの前に実行）
        let isFirstTimeClear = false;
        if (result === 'clear') {
          const { data: preClear, error: preErr } = await supabase
            .from('fantasy_stage_clears')
            .select('id')
            .eq('user_id', profile.id)
            .eq('stage_id', currentStage.id)
            .eq('clear_type', 'clear')
            .maybeSingle();
          
          isFirstTimeClear = !preClear; // レコードが無ければ初クリア
          devLog.debug('🔍 初クリア判定:', { 
            stageNumber: currentStage.stageNumber,
            existingRecord: preClear,
            isFirstTimeClear 
          });
        }
        
        // クリア記録を保存（既存記録がある場合は更新）
        try {
          const { error: clearError } = await supabase
            .from('fantasy_stage_clears')
            .upsert({
              user_id: profile.id,
              stage_id: currentStage.id,
              score: score,
              clear_type: result,
              remaining_hp: result === 'clear' ? Math.max(1, 5 - (totalQuestions - correctAnswers)) : 0,
              total_questions: totalQuestions,
              correct_answers: correctAnswers
            }, {
              onConflict: 'user_id,stage_id'
            });
          
          if (clearError) {
            console.error('ファンタジークリア記録保存エラー:', clearError);
            devLog.debug('クリア記録保存失敗:', {
              error: clearError,
              data: {
                user_id: profile.id,
                stage_id: currentStage.id,
                score: score,
                clear_type: result,
                remaining_hp: result === 'clear' ? Math.max(1, 5 - (totalQuestions - correctAnswers)) : 0,
                total_questions: totalQuestions,
                correct_answers: correctAnswers
              }
            });
          } else {
            devLog.debug('✅ ファンタジークリア記録保存完了');
          }
        } catch (clearSaveError) {
          console.error('ファンタジークリア記録保存例外:', clearSaveError);
        }
        
        // ユーザー進捗を更新（初回クリア時のみ）
        if (result === 'clear' && isFirstTimeClear) {
          // 初回クリア時のみ進捗を更新
          const { data: currentProgress, error: progressError } = await supabase
            .from('fantasy_user_progress')
            .select('*')
            .eq('user_id', profile.id)
            .single();
          
          if (!progressError && currentProgress) {
            // 次のステージをアンロック
            const nextStageNumber = getNextStageNumber(currentStage.stageNumber);
            
            // 10ステージクリアでランクアップ（初回クリア時のみカウントアップ）
            const newClearedStages = currentProgress.total_cleared_stages + 1;
            const newRank = getRankFromClearedStages(newClearedStages);
            
            try {
              const { error: updateError } = await supabase
                .from('fantasy_user_progress')
                .update({
                  current_stage_number: nextStageNumber,
                  wizard_rank: newRank,
                  total_cleared_stages: newClearedStages
                })
                .eq('user_id', profile.id);
              
              if (updateError) {
                console.error('ファンタジー進捗更新エラー:', updateError);
                devLog.debug('進捗更新失敗:', {
                  error: updateError,
                  data: {
                    user_id: profile.id,
                    nextStage: nextStageNumber,
                    rank: newRank,
                    totalCleared: newClearedStages
                  }
                });
              } else {
                devLog.debug('✅ ファンタジー進捗更新完了（初回クリア）:', {
                  nextStage: nextStageNumber,
                  rank: newRank,
                  totalCleared: newClearedStages
                });
              }
            } catch (progressUpdateError) {
              console.error('ファンタジー進捗更新例外:', progressUpdateError);
            }
          }
        } else if (result === 'clear') {
          devLog.debug('🔄 既にクリア済みのステージ - 進捗更新スキップ:', currentStage.stageNumber);
        }
        
        // 経験値付与（addXp関数を使用）
        const xpGain = result === 'clear' ? 1000 : 200;
        const reason = `ファンタジーモード${currentStage.stageNumber}${result === 'clear' ? 'クリア' : 'チャレンジ'}`;
        
        try {
          // addXp関数をインポートして使用
          const { addXp } = await import('@/platform/supabaseXp');
          
          const xpResult = await addXp({
            songId: null, // ファンタジーモードなので曲IDはnull
            baseXp: xpGain,
            speedMultiplier: 1,
            rankMultiplier: 1,
            transposeMultiplier: 1,
            membershipMultiplier: 1,
            reason: reason
          });
          
          devLog.debug('✅ ファンタジーモードXP付与完了:', {
            gained: xpResult.gainedXp,
            total: xpResult.totalXp,
            level: xpResult.level
          });
          
        } catch (xpError) {
          console.error('ファンタジーモードXP付与エラー:', xpError);
        }
      }
    } catch (error) {
      console.error('ファンタジーモード結果保存エラー:', error);
    }
  }, [isGuest, profile, currentStage]);
  
  // ステージ選択に戻る
  const handleBackToStageSelect = useCallback(() => {
    setCurrentStage(null);
    setGameResult(null);
    setShowResult(false);
    setPendingAutoStart(false); // pendingAutoStart もリセット
  }, []);
  
  // ★ 追加: 次のステージに待機画面で遷移
  const gotoNextStageWaiting = useCallback(async () => {
    if (!currentStage) return;
    
    const nextStageNumber = getNextStageNumber(currentStage.stageNumber);

    try {
      // DB から実データを読み直す
      const { getSupabaseClient } = await import('@/platform/supabaseClient');
      const supabase = getSupabaseClient();
      const { data: nextStageData, error } = await supabase
        .from('fantasy_stages')
        .select('*')
        .eq('stage_number', nextStageNumber)
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
        mode: nextStageData.mode as 'single' | 'progression',
        allowedChords: Array.isArray(nextStageData.allowed_chords) ? nextStageData.allowed_chords : [],
        chordProgression: Array.isArray(nextStageData.chord_progression) ? nextStageData.chord_progression : undefined,
        showSheetMusic: nextStageData.show_sheet_music,
        showGuide: nextStageData.show_guide,
        monsterIcon: nextStageData.monster_icon,
        bgmUrl: nextStageData.bgm_url,
        simultaneousMonsterCount: nextStageData.simultaneous_monster_count || 1
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
  }, [currentStage]);
  
  // メニューに戻る
  const handleBackToMenu = useCallback(() => {
    window.location.hash = '#dashboard';
  }, []);
  
  // ランク計算ヘルパー
  const getRankFromClearedStages = (clearedStages: number): string => {
    const WIZARD_RANKS = ['F', 'F+', 'E', 'E+', 'D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+', 'S', 'S+'];
    const rankIndex = Math.floor(clearedStages / 10);
    return WIZARD_RANKS[Math.min(rankIndex, WIZARD_RANKS.length - 1)];
  };
  
  // プレミアムプラン未加入の場合
  if (isGuest || !isPremiumOrHigher) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center overflow-y-auto">
        <div className="text-white text-center max-w-md p-4">
          <div className="text-6xl mb-6">🧙‍♂️</div>
          <h2 className="text-3xl font-bold mb-4">ファンタジーモード</h2>
          
          {isGuest ? (
            <>
              <p className="text-indigo-200 mb-6">
                ファンタジーモードはログイン後にご利用いただけます。
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => window.location.hash = '#login'}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors"
                >
                  ログイン
                </button>
                <button
                  onClick={handleBackToMenu}
                  className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors"
                >
                  メニューに戻る
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-indigo-200 mb-6">
                ファンタジーモードはプレミアムプラン以上でご利用いただけます。
                <br />
                現在のプラン: <span className="text-yellow-300 font-bold capitalize">{profile?.rank}</span>
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => window.location.hash = '#pricing'}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors"
                >
                  プランをアップグレード
                </button>
                <button
                  onClick={handleBackToMenu}
                  className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors"
                >
                  メニューに戻る
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  
  // ゲーム結果画面
  if (showResult && gameResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="text-white text-center max-w-md w-full">
          {/* 結果タイトル */}
          <h2 className="text-3xl font-bold mb-6 font-dotgothic16">
            {currentStage?.stageNumber}&nbsp;
            {gameResult.result === 'clear' ? 'ステージクリア！' : 'ゲームオーバー'}
          </h2>
          
          {/* スコア表示 */}
          <div className="bg-black bg-opacity-30 rounded-lg p-6 mb-6">
            <div className="space-y-2 text-lg font-dotgothic16">
              <div>スコア: <span className="text-yellow-300 font-bold">{gameResult.score.toLocaleString()}</span></div>
              <div>正解数: <span className="text-green-300 font-bold">{gameResult.correctAnswers}</span> / {gameResult.totalQuestions}</div>
              <div>
                正解率: <span className={`font-bold ${
                  (gameResult.correctAnswers / gameResult.totalQuestions) >= 0.8 ? 'text-green-300' : 
                  (gameResult.correctAnswers / gameResult.totalQuestions) >= 0.6 ? 'text-yellow-300' : 'text-red-300'
                }`}>
                  {Math.round((gameResult.correctAnswers / gameResult.totalQuestions) * 100)}%
                </span>
              </div>
            </div>
            
            {/* 経験値獲得 */}
            <div className="mt-4 pt-4 border-t border-gray-600 font-dotgothic16">
              <div className="text-blue-300">
                経験値 +{gameResult.result === 'clear' ? 1000 : 200} XP
              </div>
            </div>
          </div>
          
          {/* アクションボタン */}
          <div className="space-y-4">
            {gameResult.result === 'clear' && (
              <button
                onClick={gotoNextStageWaiting}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors font-dotgothic16"
              >
                次のステージへ
              </button>
            )}
            
            <button
              // ▼▼▼ 修正 ▼▼▼
              onClick={() => {
                setShowResult(false);
                setGameKey(prevKey => prevKey + 1);
                setPendingAutoStart(true);   // ★ useState を 1 つ用意
              }}
              // ▲▲▲ ここまで ▲▲▲
              className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors font-dotgothic16"
            >
              再挑戦
            </button>
            
            <button
              onClick={handleBackToStageSelect}
              className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors font-dotgothic16"
            >
              ステージ選択に戻る
            </button>
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