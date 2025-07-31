import React, { useState, useEffect, useMemo } from 'react';
import { FantasyStage } from '@/types';
import { fetchFantasyStages } from '@/platform/supabaseFantasyStages';
import { cn } from '@/utils/cn';

interface FantasyStageSelectorProps {
  selectedStageId: string | null;
  onStageSelect: (stageId: string) => void;
}

export const FantasyStageSelector: React.FC<FantasyStageSelectorProps> = ({
  selectedStageId,
  onStageSelect
}) => {
  const [stages, setStages] = useState<FantasyStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // ステージ一覧の取得
  useEffect(() => {
    fetchFantasyStages()
      .then(setStages)
      .catch((err) => {
        // console.error('Failed to fetch fantasy stages:', err);
        setError('ファンタジーステージの取得に失敗しました');
      })
      .finally(() => setLoading(false));
  }, []);
  
  // 検索フィルタリング
  const filteredStages = useMemo(() => {
    if (!searchTerm) return stages;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return stages.filter(stage => 
      stage.name.toLowerCase().includes(lowerSearchTerm) || 
      stage.stage_number.toLowerCase().includes(lowerSearchTerm) ||
      stage.description.toLowerCase().includes(lowerSearchTerm)
    );
  }, [stages, searchTerm]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded">
        {error}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="ステージを検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-2">
        {filteredStages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            検索結果がありません
          </div>
        ) : (
          filteredStages.map(stage => (
            <div
              key={stage.id}
              className={cn(
                "p-4 border rounded-lg cursor-pointer transition-colors",
                "hover:bg-gray-50",
                selectedStageId === stage.id && "bg-blue-50 border-blue-500"
              )}
              onClick={() => onStageSelect(stage.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-lg">
                    {stage.stage_number} - {stage.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {stage.description}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      モード: {stage.mode === 'single' ? 'シングル' : 'プログレッション'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      敵数: {stage.enemy_count}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      HP: {stage.max_hp}
                    </span>
                    {stage.show_sheet_music && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        楽譜表示
                      </span>
                    )}
                    {stage.show_guide && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        ガイド表示
                      </span>
                    )}
                  </div>
                </div>
                {selectedStageId === stage.id && (
                  <div className="ml-4">
                    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {selectedStageId && (
        <div className="text-sm text-gray-600">
          選択中: {stages.find(s => s.id === selectedStageId)?.name || '不明'}
        </div>
      )}
    </div>
  );
};