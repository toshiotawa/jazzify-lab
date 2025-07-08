import React from 'react'
import { useAuth } from '../../hooks/useAuth'

export const AdminPage: React.FC = () => {
  const { state } = useAuth()

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">管理画面</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* 統計カード */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">総ユーザー数</h3>
          <p className="text-3xl font-bold text-blue-600">---</p>
          <p className="text-sm text-gray-500">実装予定</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">アクティブユーザー</h3>
          <p className="text-3xl font-bold text-green-600">---</p>
          <p className="text-sm text-gray-500">実装予定</p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">今日のセッション</h3>
          <p className="text-3xl font-bold text-purple-600">---</p>
          <p className="text-sm text-gray-500">実装予定</p>
        </div>
      </div>

      {/* 管理機能 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">管理機能</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 transition-colors">
            <div className="text-2xl mb-2">👥</div>
            <div className="font-medium">ユーザー管理</div>
            <div className="text-sm text-gray-500">実装予定</div>
          </button>
          
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 transition-colors">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">統計・分析</div>
            <div className="text-sm text-gray-500">実装予定</div>
          </button>
          
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 transition-colors">
            <div className="text-2xl mb-2">🎵</div>
            <div className="font-medium">楽曲管理</div>
            <div className="text-sm text-gray-500">実装予定</div>
          </button>
          
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 transition-colors">
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-medium">システム設定</div>
            <div className="text-sm text-gray-500">実装予定</div>
          </button>
        </div>
      </div>

      {/* 現在のユーザー情報 */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">管理者情報</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-600">ユーザーID</dt>
            <dd className="text-sm text-gray-900">{state.user?.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">メール</dt>
            <dd className="text-sm text-gray-900">{state.user?.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">ランク</dt>
            <dd className="text-sm text-gray-900">{state.user?.memberRank}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">ログイン時刻</dt>
            <dd className="text-sm text-gray-900">{new Date().toLocaleString('ja-JP')}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}