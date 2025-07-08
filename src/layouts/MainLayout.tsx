import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const MainLayout: React.FC = () => {
  const { state, signOut } = useAuth()
  const location = useLocation()

  const isActiveRoute = (path: string) => {
    return location.pathname.startsWith(path)
  }

  const navItems = [
    { path: '/game', label: 'ゲーム', icon: '🎵' },
    { path: '/profile', label: 'プロフィール', icon: '👤' },
    { path: '/settings', label: '設定', icon: '⚙️' },
  ]

  // Add admin nav for master users
  if (state.user?.memberRank === 'master') {
    navItems.push({ path: '/admin', label: '管理画面', icon: '🛠️' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/game" className="flex items-center space-x-2">
                <span className="text-2xl">🎹</span>
                <span className="text-xl font-bold text-gray-900">
                  Jazz Learning Game
                </span>
              </Link>
            </div>

            {/* Navigation */}
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

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {state.user && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {state.user.displayName || state.user.email}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {state.user.memberRank}
                  </span>
                  <button
                    onClick={signOut}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
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
    </div>
  )
}