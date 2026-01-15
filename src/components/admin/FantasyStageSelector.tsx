import React, { useState, useEffect, useMemo } from 'react';
import { FantasyStage } from '@/types';
import { 
  fetchFantasyStages, 
  fetchLessonFantasyStages,
  fetchFantasyModeStages 
} from '@/platform/supabaseFantasyStages';
import { cn } from '@/utils/cn';

interface FantasyStageSelectorProps {
  selectedStageId: string | null;
  onStageSelect: (stageId: string) => void;
  /**
   * ステージのフィルタリングモード
   * - 'all': 全ステージを表示（デフォルト）
   * - 'fantasy': ファンタジーモード用ステージのみ（usage_type = 'fantasy' or 'both'）
   * - 'lesson': レッスンモード用ステージのみ（usage_type = 'lesson' or 'both'）
   */
  filterMode?: 'all' | 'fantasy' | 'lesson';
  /**
   * 外部から渡すステージリスト（楽観的更新用）
   * 指定された場合は内部でのフェッチをスキップし、このリストを使用
   */
  externalStages?: FantasyStage[];
}

export const FantasyStageSelector: React.FC<FantasyStageSelectorProps> = ({
  selectedStageId,
  onStageSelect,
  filterMode = 'all',
  externalStages
}) => {
  const [internalStages, setInternalStages] = useState<FantasyStage[]>([]);
  const [loading, setLoading] = useState(!externalStages);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // 使用するステージリスト（外部から渡された場合はそちらを優先）
  const stages = externalStages ?? internalStages;
  
  // ステージ一覧の取得（externalStagesが渡されていない場合のみ）
  useEffect(() => {
    // 外部からステージリストが渡されている場合はフェッチをスキップ
    if (externalStages) {
      setLoading(false);
      return;
    }
    
    const fetchFn = filterMode === 'lesson' 
      ? fetchLessonFantasyStages 
      : filterMode === 'fantasy'
        ? fetchFantasyModeStages
        : fetchFantasyStages;
        
    fetchFn()
      .then(setInternalStages)
      .catch((err) => {
        console.error('Failed to fetch fantasy stages:', err);
        setError('ファンタジーステージの取得に失敗しました');
      })
      .finally(() => setLoading(false));
  }, [filterMode, externalStages]);
  
  // 検索フィルタリング（nullセーフ）
  const filteredStages = useMemo(() => {
    if (!searchTerm) return stages;
    const lower = searchTerm.toLowerCase();
    return stages.filter(stage => {
      const name = (stage.name ?? '').toLowerCase();
      const desc = (stage.description ?? '').toLowerCase();
      const num  = (stage.stage_number ?? '').toLowerCase();
      return name.includes(lower) || desc.includes(lower) || num.includes(lower);
    });
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
                    {(stage.stage_number ?? '—')} - {stage.name ?? 'No Title'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {stage.description ?? ''}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      モード: {stage.mode === 'single' ? 'シングル' : stage.mode === 'progression_order' ? 'リズム・順番' : stage.mode === 'progression_random' ? 'リズム・ランダム' : stage.mode === 'progression_timing' ? 'リズム・カスタム' : 'プログレッション'}
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      種別: {stage.stage_tier === 'advanced' ? 'Advanced' : 'Basic'}
                    </span>
                    {stage.usage_type && (
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        stage.usage_type === 'lesson' && "bg-blue-100 text-blue-700",
                        stage.usage_type === 'fantasy' && "bg-orange-100 text-orange-700",
                        stage.usage_type === 'both' && "bg-green-100 text-green-700"
                      )}>
                        {stage.usage_type === 'lesson' ? 'レッスン専用' : stage.usage_type === 'fantasy' ? 'ファンタジー専用' : '両方'}
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      敵数: {stage.enemy_count}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      HP: {stage.max_hp}
                    </span>
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