import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchDiaries, createDiary, toggleLike } from '@/lib/diary'
import { Diary } from '@/types/diary'

export const DiaryPage: React.FC = () => {
  const { state } = useAuth()
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const data = await fetchDiaries(state.user?.id)
    setDiaries(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [state.user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    await createDiary(content.trim())
    setContent('')
    load()
  }

  const handleLike = async (diary: Diary) => {
    await toggleLike(diary.id, diary.likedByUser ?? false)
    load()
  }

  if (!state.user) return <div>読み込み中...</div>

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">日記</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
          maxLength={280}
          placeholder="今日の練習内容を記録しよう"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          投稿
        </button>
      </form>
      {loading ? (
        <div>読み込み中...</div>
      ) : (
        <ul className="space-y-4">
          {diaries.map((d) => (
            <li key={d.id} className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-500 mb-1">
                {d.displayName || '名無し'} / {new Date(d.createdAt).toLocaleDateString('ja-JP')}
              </div>
              <p className="whitespace-pre-wrap mb-2">{d.content}</p>
              <button
                onClick={() => handleLike(d)}
                className="text-sm text-blue-600 hover:underline"
              >
                {d.likedByUser ? 'いいね解除' : 'いいね'} ({d.likes})
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DiaryPage
