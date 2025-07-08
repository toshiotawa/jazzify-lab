import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { MemberRankConfig } from '@/types/user'
import { cn } from '@/utils/cn'

interface AccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const { state, signOut } = useAuth()
  if (!isOpen || !state.user) return null

  const rank = MemberRankConfig[state.user.memberRank as keyof typeof MemberRankConfig]

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">アカウント</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-gray-200">
            {state.user.avatarUrl ? (
              <img src={state.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">👤</div>
            )}
          </div>
          <h3 className="mt-2 text-xl font-bold text-gray-900">{state.user.displayName || state.user.email}</h3>
          <span
            className="inline-block mt-2 px-2 py-1 text-sm text-white rounded-full"
            style={{ backgroundColor: rank.color }}
          >
            {rank.label}
          </span>
        </div>
        <ul className="text-left text-sm text-gray-600 space-y-1 mb-6">
          {rank.features.map((feat) => (
            <li key={feat}>・{feat}</li>
          ))}
        </ul>
        <button
          onClick={handleSignOut}
          className={cn(
            'w-full py-2 rounded-md font-medium',
            'bg-red-500 text-white hover:bg-red-600 transition-colors'
          )}
        >
          ログアウト
        </button>
      </div>
    </div>
  )
}
