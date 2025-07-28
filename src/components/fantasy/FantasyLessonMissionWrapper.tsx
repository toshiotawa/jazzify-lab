import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import FantasyGameScreen from './FantasyGameScreen';
import { getSupabaseClient } from '@/platform/supabaseClient';
import { saveLessonFantasyClear, saveMissionFantasyClear } from '@/platform/supabaseFantasy';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/stores/toastStore';
import type { FantasyStage } from '@/platform/supabaseFantasy';

interface FantasyLessonMissionWrapperProps {
  isLesson: boolean;
}

const FantasyLessonMissionWrapper: React.FC<FantasyLessonMissionWrapperProps> = ({ isLesson }) => {
  const [stage, setStage] = useState<FantasyStage | null>(null);
  const [lessonSongId, setLessonSongId] = useState<string | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [clearDays, setClearDays] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuthStore();
  const toast = useToast();

  useEffect(() => {
    const loadStage = async () => {
      const params = new URLSearchParams(window.location.hash.split('?')[1]);
      const stageId = params.get('stageId');
      
      if (!stageId) {
        toast.error('ステージIDが指定されていません');
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('fantasy_stages')
          .select('*')
          .eq('id', stageId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('ステージが見つかりません');

        setStage(data);
        
        if (isLesson) {
          setLessonSongId(params.get('lessonSongId'));
          setLessonId(params.get('lessonId'));
        } else {
          setMissionId(params.get('mission'));
        }
        
        setClearDays(Number(params.get('clearDays') || '1'));
      } catch (error) {
        console.error('Error loading stage:', error);
        toast.error('ステージの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadStage();
  }, [isLesson, toast]);

  const handleGameComplete = async (
    result: 'clear' | 'gameover',
    score: number,
    correctAnswers: number,
    totalQuestions: number
  ) => {
    if (!user || !stage) return;

    try {
      const clearTime = Date.now() / 1000; // 仮のクリア時間
      const remainingHp = result === 'clear' ? 1 : 0; // 仮のHP
      
      if (isLesson && lessonSongId) {
        await saveLessonFantasyClear(
          user.id,
          lessonSongId,
          stage.id,
          result,
          remainingHp,
          clearTime
        );
      } else if (!isLesson && missionId) {
        await saveMissionFantasyClear(
          user.id,
          missionId,
          stage.id,
          result,
          remainingHp,
          clearTime
        );
      }

      if (result === 'clear') {
        toast.success('ステージクリア！');
      }
    } catch (error) {
      console.error('Error saving clear record:', error);
      toast.error('クリア記録の保存に失敗しました');
    }
  };

  const handleBackToStageSelect = () => {
    if (isLesson && lessonId) {
      window.location.hash = `#lesson-detail?id=${lessonId}`;
    } else if (!isLesson && missionId) {
      window.location.hash = '#missions';
    } else {
      window.location.hash = '#';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  if (!stage) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-xl mb-4">ステージが見つかりません</div>
        <button 
          className="btn btn-primary"
          onClick={handleBackToStageSelect}
        >
          戻る
        </button>
      </div>
    );
  }

  return (
    <FantasyGameScreen
      stage={stage}
      autoStart={true}
      onGameComplete={handleGameComplete}
      onBackToStageSelect={handleBackToStageSelect}
    />
  );
};

export default FantasyLessonMissionWrapper;