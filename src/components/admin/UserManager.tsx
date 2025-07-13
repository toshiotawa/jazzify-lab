import React, { useEffect, useState } from 'react';
import { useToast } from '@/stores/toastStore';
import { UserProfile, fetchAllUsers, updateUserRank, setAdminFlag } from '@/platform/supabaseAdmin';
import { fetchUserLessonProgress } from '@/platform/supabaseLessonProgress';

const ranks = ['free','standard','premium','platinum'] as const;

type Rank = typeof ranks[number];

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [userProgress, setUserProgress] = useState<Record<string, LessonProgress[]>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
      for (const user of data) {
        const progress = await fetchUserLessonProgress(user.id);
        setUserProgress(prev => ({...prev, [user.id]: progress}));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{load();},[]);

  const handleRankChange = async (id:string, rank:Rank)=>{
    try {
      await updateUserRank(id, rank);
      toast.success('ランクを更新しました');
      await load();
    } catch(e){
      toast.error('更新に失敗しました');
    }
  };

  const toggleAdmin = async(id:string, isAdmin:boolean)=>{
    try {
      await setAdminFlag(id, isAdmin);
      toast.success('Admin 権限を更新しました');
      await load();
    } catch(e){
      toast.error('更新に失敗しました');
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">ユーザー管理</h3>
      {loading? <p>Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left border-b border-slate-700">
                <th className="py-1 px-2">Nick</th>
                <th className="py-1 px-2 hidden sm:table-cell">Email</th>
                <th className="py-1 px-2">Rank</th>
                <th className="py-1 px-2">Admin</th>
                <th className="py-1 px-2 text-right">Level</th>
                <th className="py-1 px-2">レッスン進捗</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u=> (
                <tr key={u.id} className="border-b border-slate-800">
                  <td className="py-1 px-2">
                    <span className="truncate block max-w-[100px] sm:max-w-none">{u.nickname}</span>
                  </td>
                  <td className="py-1 px-2 text-xs text-gray-400 hidden sm:table-cell">
                    <span className="truncate block max-w-[150px]">{u.email}</span>
                  </td>
                  <td className="py-1 px-2">
                    <select className="select select-xs w-20" value={u.rank} onChange={e=>handleRankChange(u.id, e.target.value as Rank)}>
                      {ranks.map(r=>(<option key={r} value={r}>{r}</option>))}
                    </select>
                  </td>
                  <td className="py-1 px-2">
                    <input type="checkbox" className="checkbox checkbox-sm" checked={u.is_admin} onChange={e=>toggleAdmin(u.id, e.target.checked)} />
                  </td>
                  <td className="py-1 px-2 text-right text-xs">Lv{u.level}</td>
                  <td className="py-1 px-2 text-right text-xs">{userProgress[u.id]?.[0]?.completed ? '完了' : '未完了'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManager; 