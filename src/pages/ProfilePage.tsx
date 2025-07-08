import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { MemberRankConfig, getRankByExp, MemberRank } from '../types/user'
import { getLevelInfo } from '../utils/xp'
import { ProfileEditModal } from '@/components/auth/ProfileEditModal'

export const ProfilePage: React.FC = () => {
  const { state } = useAuth()
  const [editOpen, setEditOpen] = useState(false)

  if (!state.user) {
    return <div>ユーザー情報を読み込み中...</div>
  }

  const rankConfig = MemberRankConfig[state.user.memberRank as keyof typeof MemberRankConfig]
  const nextRank = getRankByExp(state.user.totalExp + 1)
  const nextRankInfo = nextRank !== state.user.memberRank ? MemberRankConfig[nextRank as MemberRank] : null
  const progressRatio =
    rankConfig.maxExp === Infinity
      ? 1
      : (state.user.totalExp - rankConfig.minExp) / (rankConfig.maxExp - rankConfig.minExp)
  const levelInfo = getLevelInfo(state.user.totalExp)

  return (
    <>
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">プロフィール</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-6 mb-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            {state.user.avatarUrl ? (
              <img 
                src={state.user.avatarUrl} 
                alt="Avatar" 
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl text-gray-400">👤</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {state.user.displayName || '名前未設定'}
            </h2>
            <p className="text-gray-600">{state.user.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: rankConfig.color }}
              >
                {rankConfig.label}
              </span>
              <span className="text-gray-600">
                経験値: {state.user.totalExp}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">アカウント情報</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-600">登録日</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(state.user.createdAt).toLocaleDateString('ja-JP')}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">最終更新</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(state.user.updatedAt).toLocaleDateString('ja-JP')}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">進捗情報</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-gray-600">会員ランク</dt>
                <dd className="text-sm text-gray-900">{rankConfig.label}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">レベル</dt>
                <dd className="text-sm text-gray-900">{levelInfo.level}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">必要経験値</dt>
                <dd className="text-sm text-gray-900">
                  {rankConfig.maxExp === Infinity
                    ? `${rankConfig.minExp}+`
                    : `${rankConfig.minExp} - ${rankConfig.maxExp}`
                  }
                </dd>
              </div>
              {nextRankInfo && (
                <div className="w-full mt-2">
                  <div className="h-2 bg-gray-200 rounded">
                    <div
                      className="h-full bg-blue-600 rounded"
                      style={{ width: `${Math.min(progressRatio, 1) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    次のランク: {nextRankInfo.label} / {state.user.totalExp} / {rankConfig.maxExp}
                  </p>
                </div>
              )}
              <div className="w-full mt-2">
                <div className="h-2 bg-green-200 rounded">
                  <div
                    className="h-full bg-green-600 rounded"
                    style={{ width: `${((state.user.totalExp - levelInfo.currentExp) / (levelInfo.nextExp - levelInfo.currentExp)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  次のレベルまで {levelInfo.nextExp - state.user.totalExp} XP
                </p>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            onClick={() => setEditOpen(true)}
          >
            プロフィールを編集
          </button>
        </div>
      </div>
    </div>
    <ProfileEditModal isOpen={editOpen} onClose={() => setEditOpen(false)} />
    </>
  )
}