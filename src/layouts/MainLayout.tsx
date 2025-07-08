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
              {state.user ? (
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                    {state.user.avatarUrl ? (
                      <img
                        src={state.user.avatarUrl}
                        alt="アバター"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        👤
                      </div>
                    )}
                  </div>
                  
                  <span className="text-sm text-gray-600">
                    {state.user.displayName || state.user.email}
                  </span>
                  
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {state.user.memberRank}
                  </span>
                  
                  {state.user.isAdmin && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      Admin
                    </span>
                  )}
                  
                  <button
                    onClick={signOut}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  ログイン / 会員登録
                </Link>
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