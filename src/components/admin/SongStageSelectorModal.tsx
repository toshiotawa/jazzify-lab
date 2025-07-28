import React, { useState } from 'react';
import SongSelector from './SongSelector';
import StageSelector from './StageSelector';
import { FaMusic, FaDragon } from 'react-icons/fa';

interface Props{
  onSelectSong:(songId:string)=>void;
  onSelectStage:(stageId:string)=>void;
  onClose:()=>void;
  excludeSongIds:string[];
}

const SongStageSelectorModal:React.FC<Props>=({onSelectSong,onSelectStage,onClose,excludeSongIds})=>{
  const [mode,setMode]=useState<'song'|'stage'>('song');

  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center space-x-2">
            {mode==='song'?<FaMusic/>:<FaDragon/>}
            <span>{mode==='song'?'楽曲選択':'ステージ選択'}</span>
          </h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="tabs mb-4">
          <a className={`tab tab-bordered ${mode==='song'?'tab-active':''}`} onClick={()=>setMode('song')}>楽曲</a>
          <a className={`tab tab-bordered ${mode==='stage'?'tab-active':''}`} onClick={()=>setMode('stage')}>ステージ</a>
        </div>

        {mode==='song' && (
          <SongSelector
            excludeSongIds={excludeSongIds}
            onSelect={(id)=>{onSelectSong(id);onClose();}}
          />
        )}

        {mode==='stage' && (
          <StageSelector
            onChange={(e)=>{
              const id=e.target.value;
              if(id){
                onSelectStage(id);
                onClose();
              }
            }}
          />
        )}
      </div>
    </div>
  )
};

export default SongStageSelectorModal;