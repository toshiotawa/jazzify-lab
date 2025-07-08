import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '../components/ui/Header'

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}