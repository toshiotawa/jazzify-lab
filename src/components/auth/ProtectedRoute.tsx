import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { state } = useAuth()
  const location = useLocation()

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  if (!state.user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (requireAdmin && state.user.memberRank !== 'master') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">アクセス権限がありません</h2>
          <p className="text-gray-600 mb-4">この機能にはマスターランクが必要です</p>
          <Navigate to="/game" replace />
        </div>
      </div>
    )
  }

  return <>{children}</>
}