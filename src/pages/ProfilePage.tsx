import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { MemberRankConfig } from '../types/user'

export const ProfilePage: React.FC = () => {
  const { state } = useAuth()

  if (!state.user) {
    return <div>ユーザー情報を読み込み中...</div>
  }

  const rankConfig = MemberRankConfig[state.user.memberRank as keyof typeof MemberRankConfig]

  return (
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
                <dt className="text-sm text-gray-600">必要経験値</dt>
                <dd className="text-sm text-gray-900">
                  {rankConfig.maxExp === Infinity 
                    ? `${rankConfig.minExp}+` 
                    : `${rankConfig.minExp} - ${rankConfig.maxExp}`
                  }
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            プロフィールを編集
          </button>
        </div>
      </div>
    </div>
  )
}