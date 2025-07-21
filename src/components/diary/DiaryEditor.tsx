import React, { useState, useEffect } from 'react';
import { useDiaryStore } from '@/stores/diaryStore';
import { useToast, getValidationMessage, handleApiError } from '@/stores/toastStore';
import { useAuthStore } from '@/stores/authStore';
import { Diary } from '@/platform/supabaseDiary';
import { compressDiaryImage } from '@/utils/imageCompression';
import { uploadDiaryImage, createDiaryImagesBucket } from '@/platform/supabaseStorage';

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [hasImageChanged, setHasImageChanged] = useState(false);
  const toast = useToast();
  const { profile } = useAuthStore();
  const isEdit = !!diary;
  const disabled = (isEdit ? false : todayPosted) || submitting || text.trim().length === 0;

  // 編集モードで既存の画像を初期表示
  useEffect(() => {
    if (isEdit && diary?.image_url) {
      setImagePreview(diary.image_url);
    }
  }, [isEdit, diary?.image_url]);

  // 会員ランクに応じたXP計算
  const getExpectedXp = () => {
    if (!profile) return 5000;
    const baseXp = 5000;
    const multiplier = profile.rank === 'premium' ? 1.5 : profile.rank === 'platinum' ? 2 : 1;
    return Math.round(baseXp * multiplier);
  };

  // 画像選択ハンドラー
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('画像ファイルは5MB以下にしてください');
      return;
    }
    
    setImageUploading(true);
    try {
      // 画像を圧縮
      const compressedBlob = await compressDiaryImage(file);
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/webp' });
      
      setSelectedImage(compressedFile);
      setHasImageChanged(true);
      
      // プレビュー用のURLを生成
      const previewUrl = URL.createObjectURL(compressedBlob);
      setImagePreview(previewUrl);
      
      toast.success('画像を圧縮しました');
    } catch (error) {
      console.error('画像圧縮エラー:', error);
      toast.error('画像の処理に失敗しました');
    } finally {
      setImageUploading(false);
    }
  };

  // 画像削除ハンドラー
  const handleImageRemove = () => {
    setSelectedImage(null);
    setHasImageChanged(true);
    if (imagePreview && !imagePreview.startsWith('http')) {
      // Blob URLの場合のみrevokeする（既存画像URLは除く）
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
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
        let finalImageUrl = diary.image_url;
        
        // 画像が変更された場合の処理
        if (hasImageChanged) {
          if (selectedImage) {
            // 新しい画像をアップロード
            try {
              await createDiaryImagesBucket();
              finalImageUrl = await uploadDiaryImage(selectedImage, profile!.id, diary.id);
            } catch (uploadError) {
              console.error('画像アップロードエラー:', uploadError);
              toast.error('画像のアップロードに失敗しました');
              setSubmitting(false);
              return;
            }
          } else {
            // 画像が削除された場合
            finalImageUrl = undefined;
          }
        }
        
        await update(diary.id, content, finalImageUrl);
        toast.success('日記を更新しました');
        onClose?.();
      } else {
        // 最初に日記を作成（画像なし）
        const result = await add(content);
        
        // 日記作成後に画像をアップロード
        if (selectedImage) {
          try {
            // バケットを作成（初回のみ）
            await createDiaryImagesBucket();
            
            // 実際の日記IDを使用してアップロード
            const imageUrl = await uploadDiaryImage(selectedImage, profile!.id, result.diaryId);
            
            // 日記レコードに画像URLを追加
            await update(result.diaryId, content, imageUrl);
            
          } catch (uploadError) {
            console.error('画像アップロードエラー:', uploadError);
            toast.error('画像のアップロードに失敗しました（日記は投稿されました）');
          }
        }
        
        setText('');
        setSelectedImage(null);
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        
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
      {isEdit ? null : profile?.rank === 'free' ? (
        <div className="text-center py-6 space-y-3">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-sm text-gray-400">※フリープランでは日記を投稿できません</p>
          <p className="text-xs text-gray-500">日記投稿はスタンダードプラン以上でご利用いただけます</p>
          <button 
            className="btn btn-sm btn-primary mt-2"
            onClick={() => window.location.hash = '#account'}
          >
            プラン変更
          </button>
        </div>
      ) : todayPosted ? (
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
          
          {/* 画像添付セクション */}
          {profile?.rank === 'premium' || profile?.rank === 'platinum' ? (
            <div className="mb-2 p-3 bg-slate-700 rounded-lg border-2 border-dashed border-slate-600">
              {imagePreview ? (
                <div className="space-y-2">
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full max-w-sm mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="absolute top-2 right-2 btn btn-xs btn-error"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">画像を変更する場合は削除してから新しい画像を選択してください</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl mb-2">📸</div>
                  <p className="text-sm text-gray-400 mb-2">画像を添付 (1日1枚まで)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="diary-image-input"
                    disabled={imageUploading}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('diary-image-input')?.click()}
                    className="btn btn-xs btn-primary"
                    disabled={imageUploading}
                  >
                    {imageUploading ? '処理中...' : '画像を選択'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">最大5MB、自動で1MB以下に圧縮されます</p>
                </div>
              )}
            </div>
          ) : profile?.rank === 'standard' ? (
            <div className="mb-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="text-center">
                <div className="text-xl mb-2 opacity-50">📸</div>
                <p className="text-sm text-gray-400 mb-1">※スタンダードプランでは画像を添付できません</p>
                <p className="text-xs text-gray-500">画像添付はプレミアム限定機能です</p>
              </div>
            </div>
          ) : null}
          
          <div className="flex justify-between items-center mb-2 text-xs text-gray-400">
            <span className={`${text.length > MAX_LEN * 0.9 ? 'text-yellow-400' : ''}`}>
              {text.length}/{MAX_LEN}
            </span>
            {!isEdit && (
              <span className="text-emerald-400">
                投稿すると +{getExpectedXp().toLocaleString()} XP
                {profile?.rank && ['standard', 'premium', 'platinum'].includes(profile.rank) && (
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