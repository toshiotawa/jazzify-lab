import React, { useState } from 'react';
import { useDiaryStore } from '@/stores/diaryStore';
import { useToast, getValidationMessage, handleApiError } from '@/stores/toastStore';
import { useAuthStore } from '@/stores/authStore';
import { Diary } from '@/platform/supabaseDiary';

const MAX_LEN = 1000;
const MIN_LEN = 10;

interface Props {
  diary?: Diary;
  onClose?: () => void;
}

const DiaryEditor = ({ diary, onClose }: Props) => {
  const { add, update, todayPosted } = useDiaryStore();
  const [text, setText] = useState(diary?.content ?? '');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const { profile } = useAuthStore();
  const isEdit = !!diary;
  const disabled = (isEdit ? false : todayPosted) || submitting || text.trim().length === 0;

  // 会員ランクに応じたXP計算
  const getExpectedXp = () => {
    if (!profile) return 5000;
    const baseXp = 5000;
    const multiplier = profile.rank === 'premium' ? 1.5 : profile.rank === 'platinum' ? 2 : 1;
    return Math.round(baseXp * multiplier);
  };

  const handleSubmit = async () => {
    const content = text.trim();
    
    // バリデーション
    if (!content) {
      return toast.error(getValidationMessage('練習内容', 'required'));
    }
    
    if (content.length < MIN_LEN) {
      return toast.error(`練習内容は${MIN_LEN}文字以上で入力してください`);
    }
    
    if (content.length > MAX_LEN) {
      return toast.error(`練習内容は${MAX_LEN}文字以下で入力してください`);
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await update(diary.id, content);
        toast.success('日記を更新しました');
        onClose?.();
      } else {
        const result = await add(content);
        setText('');
        
        // 詳細なフィードバック表示
        if (result.levelUp) {
          toast.success(
            `レベルアップ！ Lv.${result.level} おめでとうございます！`,
            {
              title: '🎉 LEVEL UP!',
              duration: 5000,
            }
          );
        }
        
        // XP獲得とミッション進捗の通知
        const missionText = result.missionsUpdated > 0 
          ? ` ミッション進捗 +${result.missionsUpdated}件` 
          : '';
        
        toast.success(
          `+${result.xpGained.toLocaleString()} XP 獲得！${missionText}`,
          {
            title: '投稿完了',
            duration: 4000,
          }
        );
      }
    } catch (e: any) {
      toast.error(handleApiError(e, isEdit ? '日記更新' : '日記投稿'), {
        title: 'エラー',
        actions: [
          {
            label: '再試行',
            onClick: () => handleSubmit(),
            style: 'primary',
          },
        ],
        persistent: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-4 p-4 bg-slate-800 rounded-lg">
      <h4 className="font-bold mb-2">{isEdit ? '日記編集' : '今日の練習日記'}</h4>
      {isEdit ? null : todayPosted ? (
        <p className="text-sm text-emerald-400">本日は投稿済みです。明日また書きましょう！</p>
      ) : (
        <>
          <textarea
            className="w-full mb-2 p-3 bg-slate-700 text-white border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
            maxLength={MAX_LEN}
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="今日の気づき、練習内容などを共有しましょう (最大1000文字)"
          />
          <div className="flex justify-between items-center mb-2 text-xs text-gray-400">
            <span className={`${text.length > MAX_LEN * 0.9 ? 'text-yellow-400' : ''}`}>
              {text.length}/{MAX_LEN}
            </span>
            {!isEdit && (
              <span className="text-emerald-400">
                投稿すると +{getExpectedXp().toLocaleString()} XP
                {profile?.rank !== 'free' && (
                  <span className="ml-1 text-xs text-yellow-400">
                    ({profile?.rank} 倍率適用)
                  </span>
                )}
              </span>
            )}
          </div>
          <button 
            className="btn btn-sm btn-primary w-full" 
            disabled={disabled} 
            onClick={handleSubmit}
          >
            {submitting ? '処理中...' : isEdit ? '更新する' : '投稿する'}
          </button>
        </>
      )}
    </div>
  );
};

export default DiaryEditor; 