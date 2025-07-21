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
  
  // プレミアムプラン以上の確認
  const isPremiumOrHigher = profile && ['premium', 'platinum'].includes(profile.rank);
  
  // ステージ選択ハンドラ
  const handleStageSelect = useCallback((stage: FantasyStage) => {
    devLog.debug('🎮 ファンタジーモード: ステージ選択', stage.stageNumber);
    setCurrentStage(stage);
    setGameResult(null);
    setShowResult(false);
  }, []);
  
  // ゲーム完了ハンドラ
  const handleGameComplete = useCallback(async (
    result: 'clear' | 'gameover', 
    score: number, 
    correctAnswers: number, 
    totalQuestions: number
  ) => {
    devLog.debug('🎮 ファンタジーモード: ゲーム完了', { result, score, correctAnswers, totalQuestions });
    
    const gameResult: GameResult = { result, score, correctAnswers, totalQuestions };
    setGameResult(gameResult);
    setShowResult(true);
    
    // データベースに結果を保存
    try {
      if (!isGuest && profile && currentStage) {
        const { getSupabaseClient } = await import('@/platform/supabaseClient');
        const supabase = getSupabaseClient();
        
        // クリア記録を保存（既存記録がある場合は更新）
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
          });
        
        if (clearError) {
          console.error('ファンタジークリア記録保存エラー:', clearError);
        }
        
        // ユーザー進捗を更新（クリア時のみ）
        if (result === 'clear') {
          const { data: currentProgress, error: progressError } = await supabase
            .from('fantasy_user_progress')
            .select('*')
            .eq('user_id', profile.id)
            .single();
          
          if (!progressError && currentProgress) {
            // 次のステージをアンロック
            const [currentRank, currentStageNum] = currentStage.stageNumber.split('-').map(Number);
            const nextStageNumber = `${currentRank}-${currentStageNum + 1}`;
            
            // 10ステージクリアでランクアップ
            const newClearedStages = currentProgress.total_cleared_stages + 1;
            const newRank = getRankFromClearedStages(newClearedStages);
            
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
            } else {
              devLog.debug('✅ ファンタジー進捗更新完了:', {
                nextStage: nextStageNumber,
                rank: newRank,
                totalCleared: newClearedStages
              });
            }
          }
        }
        
        // 経験値付与（直接実装）
        const xpGain = result === 'clear' ? 1000 : 200;
        const reason = `ファンタジーモード${currentStage.stageNumber}${result === 'clear' ? 'クリア' : 'チャレンジ'}`;
        
        // XP履歴に記録
        const { error: xpError } = await supabase
          .from('xp_history')
          .insert({
            user_id: profile.id,
            xp_gained: xpGain,
            reason: reason
          });
        
        if (xpError) {
          console.error('XP履歴記録エラー:', xpError);
        }
        
        // プロフィールの総XPを更新
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            xp: supabase.rpc('increment', { x: xpGain }) 
          })
          .eq('id', profile.id);
        
        if (profileError) {
          console.error('プロフィールXP更新エラー:', profileError);
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
  }, []);
  
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
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-center max-w-md">
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
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-center max-w-md">
          {/* 結果アイコン */}
          <div className="text-8xl mb-6">
            {gameResult.result === 'clear' ? '🏆' : '💀'}
          </div>
          
          {/* 結果タイトル */}
          <h2 className="text-3xl font-bold mb-4">
            {gameResult.result === 'clear' ? 'ステージクリア！' : 'ゲームオーバー'}
          </h2>
          
          {/* スコア表示 */}
          <div className="bg-black bg-opacity-30 rounded-lg p-6 mb-6">
            <div className="space-y-2 text-lg">
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
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="text-blue-300">
                経験値 +{gameResult.result === 'clear' ? 1000 : 200} XP
              </div>
            </div>
          </div>
          
          {/* アクションボタン */}
          <div className="space-y-4">
            {gameResult.result === 'clear' && (
              <button
                onClick={handleBackToStageSelect}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors"
              >
                次のステージへ
              </button>
            )}
            
            <button
              onClick={() => setShowResult(false)}
              className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
            >
              再挑戦
            </button>
            
            <button
              onClick={handleBackToStageSelect}
              className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition-colors"
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
        stage={currentStage}
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