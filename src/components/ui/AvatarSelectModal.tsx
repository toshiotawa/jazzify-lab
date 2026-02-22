import React, { useState, useRef } from 'react';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';

type AvatarCategory = 'characters' | 'monsters';

interface Props {
  isOpen: boolean;
  currentAvatarUrl: string | null | undefined;
  isEnglishCopy: boolean;
  onSelect: (avatarPath: string) => void;
  onUpload: (file: File) => void;
  onClose: () => void;
  uploading: boolean;
}

const CHARACTER_AVATARS = [
  { path: DEFAULT_AVATAR_URL, label: 'Default' },
  ...Array.from({ length: 10 }, (_, i) => ({
    path: `/stage_icons/${i + 1}.png`,
    label: `Character ${i + 1}`,
  })),
];

const MONSTER_AVATARS = Array.from({ length: 63 }, (_, i) => {
  const num = String(i + 1).padStart(2, '0');
  return {
    path: `/monster_icons/monster_${num}.png`,
    label: `Monster ${num}`,
  };
});

const AvatarSelectModal: React.FC<Props> = ({
  isOpen,
  currentAvatarUrl,
  isEnglishCopy,
  onSelect,
  onUpload,
  onClose,
  uploading,
}) => {
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>('characters');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const avatars = activeCategory === 'characters' ? CHARACTER_AVATARS : MONSTER_AVATARS;

  const isSelected = (path: string) => {
    if (!currentAvatarUrl) return path === DEFAULT_AVATAR_URL;
    return currentAvatarUrl === path || currentAvatarUrl.endsWith(path);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden border border-slate-600/50"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">
            {isEnglishCopy ? 'Choose Avatar' : 'アバターを選択'}
          </h3>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-slate-700 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-700 px-5">
          <button
            className={`py-3 px-4 text-sm font-medium transition-colors relative ${
              activeCategory === 'characters'
                ? 'text-primary-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveCategory('characters')}
          >
            {isEnglishCopy ? 'Characters' : 'キャラクター'}
            {activeCategory === 'characters' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400 rounded-full" />
            )}
          </button>
          <button
            className={`py-3 px-4 text-sm font-medium transition-colors relative ${
              activeCategory === 'monsters'
                ? 'text-primary-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            onClick={() => setActiveCategory('monsters')}
          >
            {isEnglishCopy ? 'Monsters' : 'モンスター'}
            {activeCategory === 'monsters' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Avatar Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-5 gap-3">
            {avatars.map(avatar => (
              <button
                key={avatar.path}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-150 hover:scale-105 focus:outline-none ${
                  isSelected(avatar.path)
                    ? 'border-primary-400 ring-2 ring-primary-400/40 shadow-lg shadow-primary-400/20'
                    : 'border-slate-600/50 hover:border-slate-500'
                }`}
                onClick={() => onSelect(avatar.path)}
                aria-label={avatar.label}
              >
                <img
                  src={avatar.path}
                  alt={avatar.label}
                  className="w-full h-full object-cover bg-slate-700"
                  loading="lazy"
                />
                {isSelected(avatar.path) && (
                  <div className="absolute inset-0 bg-primary-400/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-primary-400 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer with Upload */}
        <div className="px-5 py-4 border-t border-slate-700 flex items-center justify-between">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm text-gray-200 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {uploading
              ? (isEnglishCopy ? 'Uploading...' : 'アップロード中...')
              : (isEnglishCopy ? 'Upload Image' : '画像をアップロード')}
          </button>
          <button
            className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            {isEnglishCopy ? 'Cancel' : 'キャンセル'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectModal;
