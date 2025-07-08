import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AccountModal } from '@/components/auth/AccountModal'
import { ConsentModal } from '@/components/auth/ConsentModal'

export const MainLayout: React.FC = () => {
  const { state } = useAuth()
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const location = useLocation()

  const isActiveRoute = (path: string) => {
    return location.pathname.startsWith(path)
  }

  const navItems = [
    { path: '/dashboard', label: 'ホーム', icon: '🏠' },
    { path: '/game', label: 'ゲーム', icon: '🎵' },
    { path: '/ranking', label: 'ランキング', icon: '🏆' },
    { path: '/diary', label: '日記', icon: '✏️' },
    { path: '/lessons', label: 'レッスン', icon: '📚' },
    { path: '/profile', label: 'プロフィール', icon: '👤' },
    { path: '/settings', label: '設定', icon: '⚙️' },
  ]

  // Add admin nav for admin users
  if (state.user?.isAdmin) {
    navItems.push({ path: '/admin', label: '管理画面', icon: '🛠️' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: logo/top link and navigation */}
            <div className="flex items-center space-x-6">
              <Link to="/dashboard" className="text-lg font-bold text-gray-800">Jazz Game</Link>
              <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveRoute(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              </nav>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {state.user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/profile"
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    マイページ
                  </Link>
                  <button
                    onClick={() => setIsAccountOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    アカウント
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowConsent(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    おためしプレイ
                  </button>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    ログイン / 会員登録
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Mobile navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="grid grid-cols-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 text-xs transition-colors ${
                isActiveRoute(item.path)
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <AccountModal isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
      <ConsentModal
        isOpen={showConsent}
        onClose={() => setShowConsent(false)}
        onAccept={() => {
          setShowConsent(false)
          window.location.href = '/game?mode=guest'
        }}
        title="おためしプレイ利用規約"
      />
    </div>
  )
}