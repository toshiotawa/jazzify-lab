import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  computeAllPhraseLoopWindows,
  isSeparateTracksPhraseBars,
  type SeparateTracksPhraseBars,
} from '@/game/defense/defenseSeparateTracksTransport';
import {
  fetchDefenseStageDetail,
  saveDefenseStageAudioRegistration,
} from '@/platform/supabaseDefense';
import { getSupabaseClient } from '@/platform/supabaseClient';
import { useToast } from '@/stores/toastStore';

interface StageListRow {
  readonly id: string;
  readonly title: string;
  readonly audioRegistrationMode: string;
  readonly phraseCount: number;
}

const MODE_LABELS: Record<string, string> = {
  per_phrase: 'フレーズ別',
  single_source: '単一音源',
  shared_progression: '進行共有(ミックス)',
  shared_progression_separate_tracks: '進行共有(別トラック)',
};

const DefenseAudioRegistrationEditor: React.FC = () => {
  const toast = useToast();
  const [stages, setStages] = useState<readonly StageListRow[]>([]);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [bgmUrl, setBgmUrl] = useState('');
  const [melodyUrl, setMelodyUrl] = useState('');
  const [bpm, setBpm] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [progressionBars, setProgressionBars] = useState(12);
  const [phraseBars, setPhraseBars] = useState<SeparateTracksPhraseBars>(2);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const previewPlayersRef = useRef<HTMLAudioElement[]>([]);

  const stopPreview = useCallback((): void => {
    previewPlayersRef.current.forEach((player) => {
      player.pause();
      player.src = '';
    });
    previewPlayersRef.current = [];
  }, []);

  useEffect(() => () => {
    stopPreview();
  }, [stopPreview]);

  const loadStages = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('defense_stages')
        .select('id, title, audio_registration_mode, defense_phrases(count)')
        .order('sort_order', { ascending: true });
      if (error) {
        throw error;
      }
      const rows = (data ?? []).map((row) => {
        const phraseCountRaw = row.defense_phrases as { count: number }[] | { count: number } | null;
        const phraseCount = Array.isArray(phraseCountRaw)
          ? (phraseCountRaw[0]?.count ?? 0)
          : (phraseCountRaw?.count ?? 0);
        return {
          id: row.id as string,
          title: row.title as string,
          audioRegistrationMode: row.audio_registration_mode as string,
          phraseCount,
        };
      });
      setStages(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ステージ一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadStages();
  }, [loadStages]);

  const selectedStage = useMemo(
    () => stages.find((stage) => stage.id === selectedStageId) ?? null,
    [stages, selectedStageId],
  );

  const phraseWindows = useMemo(() => {
    if (!selectedStage || selectedStage.phraseCount <= 0) {
      return [];
    }
    return computeAllPhraseLoopWindows(
      selectedStage.phraseCount,
      phraseBars,
      bpm,
      beatsPerBar,
      44100,
    );
  }, [selectedStage, phraseBars, bpm, beatsPerBar]);

  const loadStageDetail = useCallback(async (stageId: string): Promise<void> => {
    const detail = await fetchDefenseStageDetail(stageId);
    if (!detail) {
      toast.error('ステージ詳細を読み込めませんでした');
      return;
    }
    setBgmUrl(detail.audioUrl ?? '');
    setMelodyUrl(detail.melodyAudioUrl ?? '');
    setBpm(detail.bpm);
    setBeatsPerBar(detail.beatsPerBar);
    setProgressionBars(detail.progressionBars ?? detail.phraseBars);
    if ([1, 2, 4].includes(detail.phraseBars)) {
      setPhraseBars(detail.phraseBars as SeparateTracksPhraseBars);
    }
  }, [toast]);

  const handleSelectStage = useCallback((stageId: string): void => {
    setSelectedStageId(stageId);
    if (stageId.length > 0) {
      void loadStageDetail(stageId);
    }
  }, [loadStageDetail]);

  const playPreview = useCallback((urls: readonly string[]): void => {
    const playable = urls.filter((url) => url.trim().length > 0);
    if (playable.length === 0) {
      return;
    }
    stopPreview();
    const players = playable.map((url) => {
      const audio = new Audio(url);
      audio.volume = playable.length > 1 ? 0.5 : 1;
      return audio;
    });
    previewPlayersRef.current = players;
    players.forEach((player) => {
      void player.play();
    });
  }, [stopPreview]);

  const handleSave = useCallback(async (): Promise<void> => {
    if (!selectedStageId) {
      toast.error('ステージを選択してください');
      return;
    }
    const detail = await fetchDefenseStageDetail(selectedStageId);
    if (!detail) {
      toast.error('ステージ詳細を読み込めませんでした');
      return;
    }

    setSaving(true);
    try {
      const sortedPhrases = [...detail.phrases].sort((a, b) => a.orderIndex - b.orderIndex);
      await saveDefenseStageAudioRegistration({
        stageId: selectedStageId,
        mode: 'shared_progression_separate_tracks',
        stageAudioUrl: bgmUrl.trim(),
        melodyAudioUrl: melodyUrl.trim(),
        bpm,
        beatsPerBar,
        phraseBars,
        progressionBars,
        phrases: sortedPhrases.map((phrase, rank) => ({
          id: phrase.id,
          audioUrl: null,
          loopStartMeasure: rank * phraseBars + 1,
          loopEndMeasure: (rank + 1) * phraseBars,
        })),
      });
      toast.success('進行共有(別トラック)形式を保存しました');
      await loadStages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  }, [
    selectedStageId,
    bgmUrl,
    melodyUrl,
    bpm,
    beatsPerBar,
    phraseBars,
    progressionBars,
    toast,
    loadStages,
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Defense 音源登録</h1>
      <p className="text-sm text-gray-400">
        進行共有(別トラック)形式: BGM 1 本 + メロディ 1 本。フレーズ区間は order_index 順に K 小節ずつ自動配置されます。
      </p>

      <label className="block space-y-1">
        <span className="text-sm font-medium">ステージ</span>
        <select
          className="select select-bordered w-full"
          value={selectedStageId}
          onChange={(event) => handleSelectStage(event.target.value)}
          disabled={loading}
        >
          <option value="">選択してください</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.title}
              {' '}
              (
              {MODE_LABELS[stage.audioRegistrationMode] ?? stage.audioRegistrationMode}
              ,
              {' '}
              {stage.phraseCount}
              課題)
            </option>
          ))}
        </select>
      </label>

      {selectedStage && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium">BGM URL</span>
              <input
                className="input input-bordered w-full"
                value={bgmUrl}
                onChange={(event) => setBgmUrl(event.target.value)}
              />
              <button
                type="button"
                className="btn btn-xs btn-outline mt-1"
                onClick={() => playPreview([bgmUrl])}
              >
                BGM 試聴
              </button>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">メロディ URL</span>
              <input
                className="input input-bordered w-full"
                value={melodyUrl}
                onChange={(event) => setMelodyUrl(event.target.value)}
              />
              <button
                type="button"
                className="btn btn-xs btn-outline mt-1"
                onClick={() => playPreview([melodyUrl])}
              >
                メロディ試聴
              </button>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => playPreview([bgmUrl, melodyUrl])}
            >
              重ね合わせ試聴
            </button>
            <button
              type="button"
              className="btn btn-xs btn-ghost"
              onClick={stopPreview}
            >
              試聴停止
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium">BPM</span>
              <input
                type="number"
                className="input input-bordered w-full"
                value={bpm}
                min={1}
                onChange={(event) => setBpm(Number(event.target.value))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">拍数</span>
              <input
                type="number"
                className="input input-bordered w-full"
                value={beatsPerBar}
                min={1}
                onChange={(event) => setBeatsPerBar(Number(event.target.value))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">進行 N 小節</span>
              <input
                type="number"
                className="input input-bordered w-full"
                value={progressionBars}
                min={1}
                onChange={(event) => setProgressionBars(Number(event.target.value))}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">区切り K 小節</span>
              <select
                className="select select-bordered w-full"
                value={phraseBars}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (isSeparateTracksPhraseBars(next)) {
                    setPhraseBars(next);
                  }
                }}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={4}>4</option>
              </select>
            </label>
          </div>

          <div className="rounded-lg border border-slate-700 p-4 space-y-2">
            <h2 className="font-semibold">メロディ区間対応表</h2>
            <ul className="text-sm space-y-1">
              {phraseWindows.map((window) => (
                <li key={window.rank}>
                  課題
                  {' '}
                  {window.rank + 1}
                  :
                  {' '}
                  {window.startMeasure}
                  –
                  {window.endMeasure}
                  小節
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            disabled={saving}
            onClick={() => { void handleSave(); }}
          >
            {saving ? '保存中…' : '進行共有(別トラック)形式で保存'}
          </button>
        </>
      )}
    </div>
  );
};

export default DefenseAudioRegistrationEditor;
