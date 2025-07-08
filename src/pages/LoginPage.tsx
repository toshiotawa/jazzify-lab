import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'

export const LoginPage: React.FC = () => {
  const { state } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (state.user) {
      navigate('/game', { replace: true })

    }
  }, [state.user, navigate])

  return <LoginForm />
}
