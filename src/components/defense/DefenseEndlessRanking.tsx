import React, { useEffect, useMemo, useState } from 'react';

import { formatDefenseStarRank } from '@/game/defense/defenseCallResponseCombat';
import {
  fetchDefenseEndlessRanking,
  fetchMyDefenseEndlessSummary,
} from '@/platform/supabaseDefense';
import type { PlayMapNode } from '@/platform/supabasePlayMap';
import { useAuthStore } from '@/stores/authStore';

interface DefenseEndlessRankingProps {
  readonly stageNodes: readonly PlayMapNode[];
  readonly initialNodeId: string;
  readonly isEnglish: boolean;
  readonly onBack: () => void;
}

export const DefenseEndlessRanking: React.FC<DefenseEndlessRankingProps> = ({
  stageNodes,
  initialNodeId,
  isEnglish,
  onBack,
}) => {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const stageOptions = useMemo(
    () => stageNodes.filter((node) => node.nodeKind === 'stage' && node.defenseStageId),
    [stageNodes],
  );
  const [selectedId, setSelectedId] = useState(() => (
    stageOptions.some((node) => node.id === initialNodeId)
      ? initialNodeId
      : (stageOptions[0]?.id ?? '')
  ));
  const [rows, setRows] = useState<Awaited<ReturnType<typeof fetchDefenseEndlessRanking>>>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stageOptions.some((node) => node.id === selectedId)) return;
    setSelectedId(stageOptions[0]?.id ?? '');
  }, [selectedId, stageOptions]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let cancelled = false;
    setLoading(true);
    void Promise.all([
      fetchDefenseEndlessRanking(selectedId, 100),
      userId ? fetchMyDefenseEndlessSummary() : Promise.resolve([]),
    ])
      .then(([ranking, summary]) => {
        if (cancelled) return;
        setRows(ranking);
        const mine = summary.find((row) => row.nodeId === selectedId);
        setMyRank(mine?.rankPosition ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, userId]);

  const selectedNode = stageOptions.find((node) => node.id === selectedId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {isEnglish ? 'Endless Ranking' : 'エンドレスランキング'}
        </h1>
        <button type="button" className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white" onClick={onBack}>
          {isEnglish ? 'Back' : '戻る'}
        </button>
      </div>

      <label className="mb-4 block text-sm text-slate-300">
        {isEnglish ? 'Stage' : 'ステージ'}
        <select
          className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          {stageOptions.map((node) => (
            <option key={node.id} value={node.id}>
              {isEnglish ? node.titleEn : node.title}
            </option>
          ))}
        </select>
      </label>

      {selectedNode && (
        <p className="mb-4 text-sm text-slate-400">
          {isEnglish ? selectedNode.titleEn : selectedNode.title}
        </p>
      )}

      {myRank != null && (
        <div className="mb-4 rounded-xl border border-indigo-500/40 bg-indigo-950/50 px-4 py-3 text-indigo-100">
          {isEnglish ? 'Your rank …' : 'あなたの順位 …'}
          {' '}
          <span className="font-bold">{myRank}</span>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">{isEnglish ? 'Loading…' : '読み込み中…'}</p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-slate-700/80 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-400">
          {isEnglish ? 'No records yet.' : 'まだ記録がありません。'}
        </p>
      ) : (
        <ol className="space-y-2">
          {rows.map((row) => (
            <li
              key={`${row.rankPosition}-${row.userId}`}
              className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white"
            >
              <span className="w-10 font-bold text-amber-300">{row.rankPosition}</span>
              <span className="flex-1">{row.nickname}</span>
              <span className="text-slate-400">
                Lv
                {row.playerLevel}
              </span>
              <span className="font-semibold tabular-nums">
                {row.enemiesDefeated}
                {isEnglish ? ' KO' : ' 撃破'}
              </span>
              <span className="tracking-widest">{formatDefenseStarRank(row.starRank ?? undefined)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};