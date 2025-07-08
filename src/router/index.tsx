import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AuthCallback } from '../components/auth/AuthCallback'
import { LoginPage } from '../pages/LoginPage'
import { AdminPage } from '../pages/admin/AdminPage'

import { GamePage } from '../pages/GamePage'
import { ProfilePage } from '../pages/ProfilePage'
import { SettingsPage } from '../pages/SettingsPage'
import { DiaryPage } from '../pages/DiaryPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/game" replace />,

      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {

        path: 'game',
        element: (
          <ProtectedRoute>
            <GamePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />

          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'callback',
        element: <AuthCallback />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/game" replace />,
  },
])


export const AppRouter = () => <RouterProvider router={router} />