import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { MemberRank } from '@/types/user'
import { Lesson } from '@/types/lesson'

const lessons: Lesson[] = [
  { id: 'lesson1', title: 'ジャズ入門', description: 'コード進行とリズムの基礎を学びます', free: true },
  { id: 'lesson2', title: 'スイング応用', description: 'より高度なスイングテクニック', free: false },
  { id: 'lesson3', title: 'アドリブ実践', description: '即興演奏のコツを身につけます', free: false },
]

export const LessonsPage: React.FC = () => {
  const { state } = useAuth()
  const rank = state.user?.memberRank as MemberRank | undefined

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">レッスン</h1>
      <div className="space-y-6">
        {lessons.map((lesson) => {
          const locked = !lesson.free &&
            (rank === MemberRank.FREE || rank === MemberRank.STANDARD)
          return (
            <div key={lesson.id} className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {lesson.title}
              </h2>
              <p className="text-gray-600 mb-4">{lesson.description}</p>
              {locked ? (
                <p className="text-sm text-gray-400">プレミアムプラン以上で解放</p>
              ) : (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  進む
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LessonsPage
