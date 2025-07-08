import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MemberRank, MemberRankConfig } from '@/types/user'
import { getLevelInfo } from '@/utils/xp'

interface RankingEntry {
  id: string
  displayName: string
  memberRank: MemberRank
  totalExp: number
}

export const RankingPage: React.FC = () => {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRanking = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, member_rank, total_exp')
        .order('total_exp', { ascending: false })
        .limit(100)

      if (!error && data) {
        setRanking(
          data.map((row) => ({
            id: row.id,
            displayName: row.display_name ?? '名無し',
            memberRank: row.member_rank as MemberRank,
            totalExp: row.total_exp,
          }))
        )
      }
      setLoading(false)
    }
    fetchRanking()
  }, [])

  if (loading) return <div>ランキングを読み込み中...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">レベルランキング</h1>
      <table className="min-w-full bg-white divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">#</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">ニックネーム</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">レベル</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">会員ランク</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((user, index) => {
            const level = getLevelInfo(user.totalExp).level
            const rankInfo = MemberRankConfig[user.memberRank]
            return (
              <tr key={user.id} className="odd:bg-gray-50">
                <td className="px-4 py-2">{index + 1}</td>
                <td className="px-4 py-2">{user.displayName}</td>
                <td className="px-4 py-2">Lv{level}</td>
                <td className="px-4 py-2">
                  <span
                    className="px-2 py-1 rounded text-white text-xs"
                    style={{ backgroundColor: rankInfo.color }}
                  >
                    {rankInfo.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
