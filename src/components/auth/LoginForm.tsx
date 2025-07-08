import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginForm: React.FC = () => {
  const { state, signIn } = useAuth()
  const location = useLocation()
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const from = (location.state as any)?.from?.pathname || '/game'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Already authenticated, redirect
  if (state.user) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">
            ログインリンクを送信しました
          </h2>
          <p className="text-green-700 mb-4">
            入力されたメールアドレスにマジックリンクを送信しました。
            メール内のリンクをクリックしてログインを完了してください。
          </p>
          <p className="text-sm text-green-600">
            メールが届かない場合は、迷惑メールフォルダをご確認ください。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jazz Learning Game</h1>
          <p className="text-gray-600">メールアドレスでログイン</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '送信中...' : 'マジックリンクを送信'}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              パスワードは不要です。メールアドレスに送信されるリンクからログインします。
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}