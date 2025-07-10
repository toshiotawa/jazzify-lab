import React, { useEffect, useState } from 'react';
import { useToast } from '@/stores/toastStore';
import { UserProfile, fetchAllUsers, updateUserRank, setAdminFlag } from '@/platform/supabaseAdmin';

const ranks = ['free','standard','premium','platinum'] as const;

type Rank = typeof ranks[number];

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{load();},[]);

  const handleRankChange = async (id:string, rank:Rank)=>{
    try {
      await updateUserRank(id, rank);
      toast('ランクを更新しました','success');
      await load();
    } catch(e){
      toast('更新に失敗しました','error');
    }
  };

  const toggleAdmin = async(id:string, isAdmin:boolean)=>{
    try {
      await setAdminFlag(id, isAdmin);
      toast('Admin 権限を更新しました','success');
      await load();
    } catch(e){
      toast('更新に失敗しました','error');
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">ユーザー管理</h3>
      {loading? <p>Loading...</p> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-700">
              <th className="py-1">Nick</th>
              <th className="py-1">Email</th>
              <th className="py-1">Rank</th>
              <th className="py-1">Admin</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u=> (
              <tr key={u.id} className="border-b border-slate-800">
                <td className="py-1">{u.nickname}</td>
                <td className="py-1 text-xs text-gray-400">{u.email}</td>
                <td className="py-1">
                  <select className="select select-xs" value={u.rank} onChange={e=>handleRankChange(u.id, e.target.value as Rank)}>
                    {ranks.map(r=>(<option key={r} value={r}>{r}</option>))}
                  </select>
                </td>
                <td className="py-1">
                  <input type="checkbox" className="checkbox checkbox-sm" checked={u.is_admin} onChange={e=>toggleAdmin(u.id, e.target.checked)} />
                </td>
                <td className="py-1 text-right text-xs">Lv{u.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManager; 