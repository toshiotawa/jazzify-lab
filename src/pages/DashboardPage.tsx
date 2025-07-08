import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getLevelInfo } from '@/utils/xp'

export const DashboardPage: React.FC = () => {
  const { state } = useAuth()

  if (!state.user) return <div>読み込み中...</div>

  const levelInfo = getLevelInfo(state.user.totalExp)
  const progress =
    ((state.user.totalExp - levelInfo.currentExp) /
      (levelInfo.nextExp - levelInfo.currentExp)) *
    100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">ようこそ、{state.user.displayName || 'ユーザー'} さん</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="font-semibold text-gray-700 mb-2">レベル: {levelInfo.level}</p>
        <div className="h-2 bg-gray-200 rounded">
          <div className="h-full bg-green-500 rounded" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          次のレベルまで {levelInfo.nextExp - state.user.totalExp} XP
        </p>
      </div>
      <div>
        <Link
          to="/game"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          ゲームを開始
        </Link>
      </div>
    </div>
  )
}

export default DashboardPage
