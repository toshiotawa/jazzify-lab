import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/utils/cn';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose
}) => {
  const { state, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(state.user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(state.user?.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (file: File) => {
    if (!state.user) return;

    try {
      setIsUploading(true);
      setError(null);

      // ファイルの検証
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('ファイルサイズは5MB以下にしてください');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('画像ファイルのみアップロード可能です');
      }

      // ユニークなファイル名を生成
      const fileExt = file.name.split('.').pop();
      const fileName = `${state.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Supabase Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // 公開URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('ニックネームを入力してください');
      return;
    }

    if (displayName.length < 2) {
      setError('ニックネームは2文字以上で入力してください');
      return;
    }

    if (displayName.length > 20) {
      setError('ニックネームは20文字以下で入力してください');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await updateProfile({
        displayName: displayName.trim(),
        avatarUrl: avatarUrl || null
      });
      
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'プロフィールの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDisplayName(state.user?.displayName || '');
    setAvatarUrl(state.user?.avatarUrl || '');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">プロフィール編集</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* アバター画像 */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mx-auto mb-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="アバター"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                    👤
                  </div>
                )}
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                'px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isUploading ? 'アップロード中...' : '画像を選択'}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <p className="text-xs text-gray-500 mt-2">
              JPG, PNG, GIF（最大5MB）
            </p>
          </div>

          {/* ニックネーム */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              ニックネーム
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={cn(
                'w-full px-3 py-2 border border-gray-300 rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'disabled:bg-gray-50 disabled:text-gray-500'
              )}
              placeholder="例: ジャズ太郎"
              disabled={isLoading}
              maxLength={20}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              2〜20文字で入力してください
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-md text-sm bg-red-50 text-red-800 border border-red-200">
              {error}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploading}
              className={cn(
                'flex-1 py-2 px-4 rounded-md font-medium',
                'bg-blue-600 text-white hover:bg-blue-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
            >
              {isLoading ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 