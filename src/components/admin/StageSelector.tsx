import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/platform/supabaseClient';
import { FaDragon, FaSpinner } from 'react-icons/fa';

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {}

/**
 * ファンタジーモードのステージをプルダウンで選択するコンポーネント
 *   ・管理画面（レッスン/ミッション）専用
 */
const StageSelector: React.FC<Props> = (props) => {
  const [stages, setStages] = useState<Array<{id:string; stage_number:string; name:string}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async ()=>{
      try{
        const { data, error } = await getSupabaseClient()
          .from('fantasy_stages')
          .select('id, stage_number, name')
          .order('stage_number',{ascending:true});
        if(error) throw error;
        setStages(data as any[]);
      }catch(e){
        console.error('StageSelector load error',e);
      }finally{
        setLoading(false);
      }
    })();
  },[]);

  if(loading){
    return <div className="flex items-center text-gray-400"><FaSpinner className="animate-spin mr-2"/>読み込み中...</div>;
  }

  return (
    <select {...props} className={`select select-bordered w-full ${props.className||''}`}>
      <option value="">-- ステージを選択 --</option>
      {stages.map(s=>(
        <option key={s.id} value={s.id}>
          {s.stage_number} : {s.name}
        </option>
      ))}
    </select>
  );
};

export default StageSelector;