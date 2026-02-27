import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Challenge,
  ChallengeType,
  ChallengeCategory,
  ChallengeSong,
  listChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  subscribeChallenges,
  getChallengeWithSongs,
  addSongToChallenge,
  updateChallengeSong,
  removeSongFromChallenge,
} from '@/platform/supabaseChallenges';
import { useToast, handleApiError } from '@/stores/toastStore';
import SongSelector from './SongSelector';

import { fetchSongs } from '@/platform/supabaseSongs';
import { FaMusic, FaTrash, FaEdit, FaPlus, FaBook, FaPlay, FaTrophy, FaHatWizard, FaSkull } from 'react-icons/fa';
import { FantasyStageSelector } from './FantasyStageSelector';
import { getChallengeFantasyTracks, addFantasyStageToChallenge, removeFantasyStageFromChallenge, updateFantasyStageInChallenge } from '@/platform/supabaseChallengeFantasy';
import { fetchFantasyStageById, fetchFantasyStages } from '@/platform/supabaseFantasyStages';
import { getChallengeSurvivalStages, addSurvivalStageToChallenge, removeSurvivalStageFromChallenge, updateSurvivalStageInChallenge } from '@/platform/supabaseChallengeSurvival';
import { ALL_STAGES } from '@/components/survival/SurvivalStageDefinitions';
import type { RepeatTranspositionMode, FantasyStage } from '@/types';

interface FormValues {
  type: ChallengeType;
  category: ChallengeCategory;
  title: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  audience_type: 'domestic' | 'global' | 'both';
  start_date: string;
  end_date: string;
  reward_multiplier: number;
  diary_count?: number;
}

interface SongConditions {
  key_offset: number;
  min_speed: number;
  min_rank: string;
  min_clears_required: number;
  notation_setting: string;
}

const MissionManager: React.FC = () => {
  const [missions, setMissions] = useState<Challenge[]>([]);
  const [selectedMission, setSelectedMission] = useState<Challenge & { songs: ChallengeSong[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [editingSong, setEditingSong] = useState<ChallengeSong | null>(null);
  const [showFantasyAddModal, setShowFantasyAddModal] = useState(false);

  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [showFormSongSelector, setShowFormSongSelector] = useState(false);
  const [songInfo, setSongInfo] = useState<Record<string, { title: string; artist?: string }>>({});
  const [songConditions, setSongConditions] = useState<Record<string, SongConditions>>({});
  const [editingFormSong, setEditingFormSong] = useState<string | null>(null);

  // 新規作成用: ファンタジー選択リスト
  const [selectedFantasy, setSelectedFantasy] = useState<Array<{ 
    stageId: string; 
    label: string; 
    clears: number;
    mode?: string;
    overrideRepeatTranspositionMode?: RepeatTranspositionMode | null;
    overrideStartKey?: number | null;
  }>>([]);
  const [showFormFantasyAddModal, setShowFormFantasyAddModal] = useState(false);

  // 新規作成用: サバイバル選択リスト
  const [selectedSurvival, setSelectedSurvival] = useState<Array<{
    stageNumber: number;
    label: string;
    clears: number;
  }>>([]);
  const [showFormSurvivalAddModal, setShowFormSurvivalAddModal] = useState(false);
  const [showSurvivalAddModal, setShowSurvivalAddModal] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      type: 'monthly',
      category: 'song_clear',
      audience_type: 'domestic',
      start_date: new Date().toISOString().substring(0, 10),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      reward_multiplier: 2000,
    },
  });
  const toast = useToast();
  const watchedCategory = watch('category');

  const load = async () => {
    setLoading(true);
    try {
      const data = await listChallenges();
      setMissions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unsub = subscribeChallenges(() => load());
    return unsub;
  }, []);

  const onSubmit = async (v: FormValues) => {
    try {
      const startDate = new Date(v.start_date);
      const endDate = new Date(v.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (endDate <= startDate) {
        toast.error('終了日は開始日より後の日付を設定してください');
        return;
      }

      if (startDate < today) {
        toast.error('開始日は今日以降の日付を設定してください');
        return;
      }

      const payload = {
        type: v.type,
        category: v.category,
        title: v.title,
        title_en: v.title_en || null,
        description: v.description,
        description_en: v.description_en || null,
        audience_type: v.audience_type || 'domestic',
        start_date: v.start_date,
        end_date: v.end_date,
        reward_multiplier: v.reward_multiplier,
        diary_count: v.category === 'diary' ? v.diary_count : null,
      } as const;
      const newChallengeId = await createChallenge(payload);

      if (v.category === 'song_clear' && selectedSongs.length > 0) {
        for (const songId of selectedSongs) {
          const conditions = songConditions[songId] || {
            key_offset: 0,
            min_speed: 1.0,
            min_rank: 'B',
            min_clears_required: 1,
            notation_setting: 'both',
          };
          await addSongToChallenge(newChallengeId, songId, conditions);
        }
        toast.success(`ミッションを追加し、${selectedSongs.length}曲を追加しました`, { title: '追加完了', duration: 3000 });
      } else if (v.category === 'fantasy_clear' && selectedFantasy.length > 0) {
        for (const item of selectedFantasy) {
          await addFantasyStageToChallenge(newChallengeId, item.stageId, {
            clearsRequired: item.clears,
            overrideRepeatTranspositionMode: item.overrideRepeatTranspositionMode,
            overrideStartKey: item.overrideStartKey,
          });
        }
        toast.success(`ミッションを追加し、ファンタジーステージを${selectedFantasy.length}件追加しました`, { title: '追加完了', duration: 3000 });
      } else if (v.category === 'survival_clear' && selectedSurvival.length > 0) {
        for (const item of selectedSurvival) {
          await addSurvivalStageToChallenge(newChallengeId, item.stageNumber, item.clears);
        }
        toast.success(`ミッションを追加し、サバイバルステージを${selectedSurvival.length}件追加しました`, { title: '追加完了', duration: 3000 });
      } else {
        toast.success('ミッションを追加しました', { title: '追加完了', duration: 3000 });
      }

      reset();
      setSelectedSongs([]);
      setSongConditions({});
      setSelectedFantasy([]);
      setSelectedSurvival([]);

      await load();
    } catch (e) {
      toast.error(handleApiError(e, 'ミッション追加'), { title: '追加エラー' });
    }
  };

  const handleMissionSelect = async (missionId: string) => {
    try {
      const mission = await getChallengeWithSongs(missionId);
      setSelectedMission(mission);
    } catch (error) {
      toast.error('ミッション詳細の取得に失敗しました');
    }
  };

  const handleSongSelect = async (songId: string) => {
    if (!selectedMission) return;

    const defaultConditions: SongConditions = {
      key_offset: 0,
      min_speed: 1.0,
      min_rank: 'B',
      min_clears_required: 1,
      notation_setting: 'both',
    };

    try {
      await addSongToChallenge(selectedMission.id, songId, defaultConditions);
      toast.success('楽曲を追加しました');
      const updatedChallenge = await getChallengeWithSongs(selectedMission.id);
      setSelectedMission(updatedChallenge);
      setShowSongSelector(false);
    } catch (error) {
      toast.error('楽曲の追加に失敗しました');
    }
  };

  const handleFormSongSelect = (songId: string) => {
    if (!selectedSongs.includes(songId)) {
      setSelectedSongs([...selectedSongs, songId]);
      fetchSongInfo(songId);
      setSongConditions(prev => ({
        ...prev,
        [songId]: {
          key_offset: 0,
          min_speed: 1.0,
          min_rank: 'B',
          min_clears_required: 1,
          notation_setting: 'both',
        }
      }));
    }
  };

  const fetchSongInfo = async (songId: string) => {
    try {
      const songs = await fetchSongs();
      const song = songs.find((s: any) => s.id === songId);
      if (song) {
        setSongInfo(prev => ({
          ...prev,
          [songId]: { title: song.title, artist: song.artist }
        }));
      }
    } catch (error) {
      console.error('楽曲情報取得エラー:', error);
    }
  };

  const handleFormSongRemove = (songId: string) => {
    setSelectedSongs(selectedSongs.filter(id => id !== songId));
    setSongInfo(prev => {
      const newInfo = { ...prev };
      delete newInfo[songId];
      return newInfo;
    });
    setSongConditions(prev => {
      const newConditions = { ...prev };
      delete newConditions[songId];
      return newConditions;
    });
  };

  const handleSongEdit = (song: ChallengeSong) => {
    setEditingSong(song);
  };

  const handleSongUpdate = async (songId: string, conditions: SongConditions) => {
    if (!selectedMission) return;

    try {
      await updateChallengeSong(selectedMission.id, songId, conditions);
      toast.success('楽曲条件を更新しました');
      const updatedChallenge = await getChallengeWithSongs(selectedMission.id);
      setSelectedMission(updatedChallenge);
      setEditingSong(null);
    } catch (error) {
      toast.error('楽曲条件の更新に失敗しました');
    }
  };

  const handleSongRemove = async (songId: string) => {
    if (!selectedMission) return;

    if (!confirm('この楽曲を削除しますか？')) return;

    try {
      await removeSongFromChallenge(selectedMission.id, songId);
      toast.success('楽曲を削除しました');
      const updatedChallenge = await getChallengeWithSongs(selectedMission.id);
      setSelectedMission(updatedChallenge);
    } catch (error) {
      toast.error('楽曲の削除に失敗しました');
    }
  };

  const getCategoryIcon = (category: ChallengeCategory) => {
    return category === 'diary' ? <FaBook className="w-4 h-4" /> : <FaPlay className="w-4 h-4" />;
  };

  const getCategoryLabel = (category: ChallengeCategory) => {
    if (category === 'diary') return '日記投稿';
    if (category === 'fantasy_clear') return 'ファンタジー';
    if (category === 'survival_clear') return 'サバイバル';
    return '曲クリア';
  };

  const getTypeLabel = (type: ChallengeType) => {
    return type === 'weekly' ? 'ウィークリー' : 'マンスリー';
  };

  return (
    <div className="space-y-8">
      {/* ミッション追加セクション */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <FaPlus className="w-5 h-5 mr-2" />
          ミッション追加
        </h3>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium mb-1 block">ミッションタイプ</span>
              <select className="select select-bordered w-full text-white" {...register('type')}>
                <option value="monthly">マンスリー（推奨）</option>
                <option value="weekly">ウィークリー</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">マンスリー: 月間ミッション、ウィークリー: 週間ミッション</p>
            </label>
            
            <label className="block">
              <span className="text-sm font-medium mb-1 block">ミッションカテゴリ</span>
              <select className="select select-bordered w-full text-white" {...register('category')}>
                <option value="song_clear">曲クリア</option>
                <option value="fantasy_clear">ファンタジー</option>
                <option value="survival_clear">サバイバル</option>
                <option value="diary">日記投稿</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              className="input input-bordered w-full text-white" 
              placeholder="ミッションタイトル (日本語)" 
              {...register('title', { required: true })} 
            />
            <input 
              className="input input-bordered w-full text-white" 
              placeholder="Mission Title (English)" 
              {...register('title_en')} 
            />
          </div>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">対象ユーザー</span>
            <select className="select select-bordered w-full text-white" {...register('audience_type')}>
              <option value="domestic">国内のみ</option>
              <option value="both">国内 + グローバル</option>
              <option value="global">グローバルのみ</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">domestic: 国内ユーザーのみ、global: Standard(Global)ユーザーのみ、both: 両方</p>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium mb-1 block">開始日</span>
              <input className="input input-bordered w-full text-white" type="date" {...register('start_date', { required: true })} />
              <p className="text-xs text-gray-400 mt-1">ミッションが開始される日</p>
            </label>
            <label className="block">
              <span className="text-sm font-medium mb-1 block">終了日</span>
              <input className="input input-bordered w-full text-white" type="date" {...register('end_date', { required: true })} />
              <p className="text-xs text-gray-400 mt-1">ミッションが終了する日（開始日以降）</p>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">報酬XP</label>
              <input 
                className="input input-bordered text-white" 
                type="number" 
                step="100" 
                placeholder="経験値 (例: 2000)" 
                {...register('reward_multiplier', { valueAsNumber: true, required: true })} 
              />
              <p className="text-xs text-gray-400 mt-1">ミッション完了時に付与される経験値</p>
            </div>
            
            {watchedCategory === 'diary' ? (
              <input 
                className="input input-bordered text-white" 
                type="number" 
                placeholder="必要日記投稿数" 
                {...register('diary_count', { valueAsNumber: true, required: true })} 
              />
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea 
              className="textarea textarea-bordered w-full text-white" 
              rows={3} 
              placeholder="ミッションの説明 (日本語)" 
              {...register('description')} 
            />
            <textarea 
              className="textarea textarea-bordered w-full text-white" 
              rows={3} 
              placeholder="Mission Description (English)" 
              {...register('description_en')} 
            />
          </div>

          {/* 曲クリアタイプ */}
          {watchedCategory === 'song_clear' && (
            <div className="border border-slate-600 rounded-lg p-4 bg-slate-800/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-lg">楽曲選択</h4>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowFormSongSelector(true)}
                >
                  <FaMusic className="w-4 h-4 mr-2" />
                  楽曲を追加
                </button>
              </div>
              {selectedSongs.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <FaMusic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>楽曲が選択されていません</p>
                  <p className="text-sm">「楽曲を追加」ボタンから楽曲を選択してください</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSongs.map(songId => {
                    const info = songInfo[songId];
                    const conditions = songConditions[songId];
                    return (
                      <div key={songId} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {info ? info.title : `楽曲ID: ${songId}`}
                          </div>
                          {info?.artist && (
                            <div className="text-sm text-gray-400 truncate">{info.artist}</div>
                          )}
                          {conditions && (
                            <div className="text-xs text-gray-500 mt-1">
                              キー: {conditions.key_offset > 0 ? '+' : ''}{conditions.key_offset} | 
                              速度: {conditions.min_speed}x | 
                              ランク: {conditions.min_rank} | 
                              クリア回数: {conditions.min_clears_required}回 | 
                              楽譜: {conditions.notation_setting === 'both' ? 'ノート+コード' : 'コードのみ'}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            onClick={() => setEditingFormSong(songId)}
                          >
                            <FaEdit className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-error"
                            onClick={() => handleFormSongRemove(songId)}
                          >
                            <FaTrash className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ファンタジータイプ */}
          {watchedCategory === 'fantasy_clear' && (
            <div className="border border-purple-600 rounded-lg p-4 bg-slate-800/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-lg">ファンタジーステージ選択</h4>
                <button type="button" className="btn btn-primary btn-sm" onClick={()=>setShowFormFantasyAddModal(true)}>追加</button>
              </div>
              {selectedFantasy.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <FaHatWizard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>ステージが選択されていません</p>
                  <p className="text-sm">「追加」ボタンからステージを選択してください</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedFantasy.map((f)=> (
                    <div key={f.stageId} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                      <div className="text-sm text-white">
                        {f.label}
                        <span className="ml-2 text-xs text-gray-300">必要クリア: {f.clears}回</span>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="btn btn-xs" onClick={() => {
                          const input = prompt('必要クリア回数を入力してください', String(f.clears));
                          if (!input) return;
                          const num = parseInt(input, 10);
                          if (!Number.isFinite(num) || num <= 0) { toast.error('1以上の数値を入力してください'); return; }
                          setSelectedFantasy(prev => prev.map(x => x.stageId === f.stageId ? { ...x, clears: num } : x));
                        }}>編集</button>
                        <button type="button" className="btn btn-xs btn-error" onClick={() => setSelectedFantasy(prev => prev.filter(x => x.stageId !== f.stageId))}>削除</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* サバイバルタイプ */}
          {watchedCategory === 'survival_clear' && (
            <div className="border border-red-600 rounded-lg p-4 bg-slate-800/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-lg">サバイバルステージ選択</h4>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowFormSurvivalAddModal(true)}>追加</button>
              </div>
              {selectedSurvival.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <FaSkull className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>ステージが選択されていません</p>
                  <p className="text-sm">「追加」ボタンからステージを選択してください</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSurvival.map((s) => (
                    <div key={s.stageNumber} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                      <div className="text-sm text-white">
                        {s.label}
                        <span className="ml-2 text-xs text-gray-300">必要クリア: {s.clears}回</span>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="btn btn-xs" onClick={() => {
                          const input = prompt('必要クリア回数を入力してください', String(s.clears));
                          if (!input) return;
                          const num = parseInt(input, 10);
                          if (!Number.isFinite(num) || num <= 0) { toast.error('1以上の数値を入力してください'); return; }
                          setSelectedSurvival(prev => prev.map(x => x.stageNumber === s.stageNumber ? { ...x, clears: num } : x));
                        }}>編集</button>
                        <button type="button" className="btn btn-xs btn-error" onClick={() => setSelectedSurvival(prev => prev.filter(x => x.stageNumber !== s.stageNumber))}>削除</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className="btn btn-primary w-full md:w-auto" type="submit">
            <FaPlus className="w-4 h-4 mr-2" />
            ミッションを追加
          </button>
        </form>
      </div>

      {/* ミッション一覧セクション */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center">
          <FaTrophy className="w-5 h-5 mr-2" />
          ミッション一覧
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          全てのミッション（アクティブ・未開始・終了）が表示されます。状態は色分けされています。
        </p>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ミッション選択 */}
            <div>
              <h4 className="font-medium mb-4 text-lg">ミッション選択</h4>
              <div className="space-y-3">
                {missions.map(c => (
                  <MissionItem
                    key={c.id}
                    mission={c}
                    onRefresh={load}
                    onSelect={() => handleMissionSelect(c.id)}
                    isSelected={selectedMission?.id === c.id}
                  />
                ))}
              </div>
            </div>

            {/* 楽曲管理 */}
            {selectedMission && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-lg">楽曲管理</h4>
                    <p className="text-sm text-gray-400">
                      {selectedMission.title} ({getCategoryLabel(selectedMission.category)})
                    </p>
                  </div>
                  {selectedMission.category === 'song_clear' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowSongSelector(true)}
                    >
                      <FaMusic className="w-4 h-4 mr-2" />
                      楽曲追加
                    </button>
                  )}
                </div>

                {selectedMission.category === 'diary' ? (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FaBook className="w-4 h-4 mr-2 text-blue-400" />
                      <span className="font-medium">日記投稿ミッション</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      必要投稿数: {selectedMission.diary_count || 0}回
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      楽曲の追加は不要です。日記投稿数で判定されます。
                    </p>
                  </div>
                ) : selectedMission.category === 'survival_clear' ? (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FaSkull className="w-4 h-4 mr-2 text-red-400" />
                        <span className="font-medium">サバイバルステージ</span>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowSurvivalAddModal(true)}
                      >
                        追加
                      </button>
                    </div>
                    <AdminSurvivalTrackList missionId={selectedMission.id} />
                  </div>
                ) : selectedMission.category === 'fantasy_clear' ? (
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FaHatWizard className="w-4 h-4 mr-2 text-purple-300" />
                        <span className="font-medium">ファンタジーステージ</span>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setShowFantasyAddModal(true)}
                      >
                        追加
                      </button>
                    </div>
                    <AdminFantasyTrackList missionId={selectedMission.id} />
                  </div>
                ) : selectedMission.songs.length === 0 ? (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 text-center">
                    <FaMusic className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                    <p className="text-gray-300 mb-2">楽曲が追加されていません</p>
                    <p className="text-sm text-gray-400">「楽曲追加」ボタンから楽曲を追加してください</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMission.songs.map(song => (
                      <SongItem key={song.song_id} song={song} onEdit={handleSongEdit} onRemove={handleSongRemove} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 楽曲選択モーダル */}
      {showSongSelector && selectedMission && (
        <SongSelectorModal
          onSelect={handleSongSelect}
          onClose={() => setShowSongSelector(false)}
          excludeSongIds={selectedMission.songs.map(s => s.song_id)}
        />
      )}

      {/* フォーム用楽曲選択モーダル */}
      {showFormSongSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">楽曲を選択</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowFormSongSelector(false)}>✕</button>
            </div>
            <SongSelector
              onSelect={handleFormSongSelect}
              excludeSongIds={selectedSongs}
            />
          </div>
        </div>
      )}

      {/* 楽曲条件編集モーダル */}
      {editingSong && (
        <SongConditionsModal
          song={editingSong}
          onSave={handleSongUpdate}
          onCancel={() => setEditingSong(null)}
        />
      )}

      {/* フォーム用楽曲条件編集モーダル */}
      {editingFormSong && (
        <FormSongConditionsModal
          songId={editingFormSong}
          songInfo={songInfo[editingFormSong]}
          conditions={songConditions[editingFormSong]}
          onSave={(songId, conditions) => {
            setSongConditions(prev => ({
              ...prev,
              [songId]: conditions
            }));
            setEditingFormSong(null);
          }}
          onCancel={() => setEditingFormSong(null)}
        />
      )}

      {/* ファンタジーステージ追加モーダル */}
      {showFantasyAddModal && selectedMission && (
        <FantasyAddModal missionId={selectedMission.id} onClose={() => setShowFantasyAddModal(false)} onAdded={() => {
          void load(); // モーダルを閉じてもミッション一覧を再読み込み
          setShowFantasyAddModal(false);
        }} />
      )}

      {/* サバイバルステージ追加モーダル（既存ミッション用） */}
      {showSurvivalAddModal && selectedMission && (
        <SurvivalAddModal missionId={selectedMission.id} onClose={() => setShowSurvivalAddModal(false)} onAdded={() => {
          void load();
          setShowSurvivalAddModal(false);
        }} />
      )}

      {/* フォーム用サバイバル追加モーダル */}
      {showFormSurvivalAddModal && (
        <SurvivalAddModal missionId={null} onClose={() => setShowFormSurvivalAddModal(false)} onAdded={(stageNumber, clears, label) => {
          if (selectedSurvival.some(s => s.stageNumber === stageNumber)) {
            toast.error('このステージは既に追加されています');
            return;
          }
          setSelectedSurvival(prev => [...prev, { stageNumber, label, clears }]);
          setShowFormSurvivalAddModal(false);
        }} />
      )}

      {/* フォーム用ファンタジー追加モーダル */}
      {showFormFantasyAddModal && (
        <FormFantasyAddModal onClose={() => setShowFormFantasyAddModal(false)} onAdd={async (stageId, clears, mode, overrideRepeatTranspositionMode, overrideStartKey) => {
          // 重複チェック
          if (selectedFantasy.some(f => f.stageId === stageId)) {
            toast.error('このステージは既に追加されています');
            return;
          }
          try {
            const stage = await fetchFantasyStageById(stageId);
            setSelectedFantasy(prev => [...prev, { 
              stageId, 
              label: `${stage.stage_number} - ${stage.name}`, 
              clears,
              mode,
              overrideRepeatTranspositionMode,
              overrideStartKey,
            }]);
            setShowFormFantasyAddModal(false);
          } catch {
            toast.error('ステージ情報の取得に失敗しました');
          }
        }} />
      )}
    </div>
  );
};

const MissionItem: React.FC<{
  mission: Challenge;
  onRefresh: () => void;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ mission, onRefresh, onSelect, isSelected }) => {
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit } = useForm<Partial<Challenge>>({ defaultValues: mission });
  const toast = useToast();

  const getCategoryIcon = (category: ChallengeCategory) => {
    if (category === 'diary') return <FaBook className="w-3 h-3" />;
    if (category === 'fantasy_clear') return <FaHatWizard className="w-3 h-3" />;
    if (category === 'survival_clear') return <FaSkull className="w-3 h-3" />;
    return <FaPlay className="w-3 h-3" />;
  };

  const getCategoryLabel = (category: ChallengeCategory) => {
    if (category === 'diary') return '日記投稿';
    if (category === 'fantasy_clear') return 'ファンタジー';
    if (category === 'survival_clear') return 'サバイバル';
    return '曲クリア';
  };

  const getTypeLabel = (type: ChallengeType) => {
    return type === 'weekly' ? 'ウィークリー' : 'マンスリー';
  };

  // ミッションの状態を判定
  const getMissionStatus = () => {
    const today = new Date().toISOString().substring(0, 10);
    const startDate = mission.start_date;
    const endDate = mission.end_date;
    
    if (today < startDate) return { status: 'future', label: '未開始', color: 'badge-warning' };
    if (today > endDate) return { status: 'past', label: '終了', color: 'badge-error' };
    return { status: 'active', label: 'アクティブ', color: 'badge-success' };
  };

  const missionStatus = getMissionStatus();

  const onUpdate = async (v: Partial<Challenge>) => {
    try {
      await updateChallenge(mission.id, v);
      toast.success('更新しました', {
        title: '更新完了',
        duration: 2000,
      });
      setEditing(false);
      onRefresh();
    } catch(e) {
      toast.error(handleApiError(e, 'ミッション更新'), {
        title: '更新エラー',
      });
    }
  };

  return (
    <li className={`border rounded-lg p-4 cursor-pointer transition-colors ${
      isSelected 
        ? 'border-primary-500 bg-slate-700/50' 
        : missionStatus.status === 'active'
          ? 'border-green-500/50 bg-slate-800/50 hover:bg-slate-700/30'
          : missionStatus.status === 'future'
            ? 'border-yellow-500/50 bg-slate-800/50 hover:bg-slate-700/30'
            : 'border-red-500/50 bg-slate-800/30 hover:bg-slate-700/20'
    }`}>
      {editing ? (
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={handleSubmit(onUpdate)}>
          <input className="input input-bordered text-white" placeholder="タイトル (日本語)" {...register('title')} />
          <input className="input input-bordered text-white" placeholder="Title (English)" {...register('title_en')} />
          <textarea className="textarea textarea-bordered text-white" rows={2} placeholder="説明 (日本語)" {...register('description')} />
          <textarea className="textarea textarea-bordered text-white" rows={2} placeholder="Description (English)" {...register('description_en')} />
          <select className="select select-bordered text-white" {...register('audience_type')}>
            <option value="domestic">国内のみ</option>
            <option value="both">国内 + グローバル</option>
            <option value="global">グローバルのみ</option>
          </select>
          <input className="input input-bordered text-white" type="number" step="100" placeholder="報酬XP" {...register('reward_multiplier', { valueAsNumber: true })} />
          <div className="sm:col-span-2 flex gap-2">
            <button className="btn btn-xs btn-primary" type="submit">保存</button>
            <button className="btn btn-xs btn-secondary" type="button" onClick={() => setEditing(false)}>キャンセル</button>
          </div>
        </form>
      ) : (
        <div className="space-y-3" onClick={onSelect}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getCategoryIcon(mission.category)}
                <h4 className="font-medium truncate">{mission.title}</h4>
              </div>
              <p className="text-xs text-gray-400">
                {new Date(mission.start_date).toLocaleDateString()} ~ {new Date(mission.end_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1">
              <button className="btn btn-xs btn-primary" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>編集</button>
              <button className="btn btn-xs btn-error" onClick={async (e) => {
                e.stopPropagation();
                if (!confirm('削除しますか？')) return;
                try {
                  await deleteChallenge(mission.id);
                  toast.success('削除しました');
                  onRefresh();
                } catch (e) {
                  toast.error('削除に失敗しました');
                }
              }}>削除</button>
            </div>
          </div>
          
          {mission.description && (
            <p className="text-sm text-gray-300 line-clamp-2">{mission.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="badge badge-sm badge-primary">{getTypeLabel(mission.type)}</span>
            <span className="badge badge-sm badge-secondary">{getCategoryLabel(mission.category)}</span>
            <span className={`badge badge-sm ${missionStatus.color}`}>{missionStatus.label}</span>
            <span className="text-gray-400">報酬: {mission.reward_multiplier}XP</span>
            {mission.category === 'diary' && mission.diary_count && (
              <span className="text-blue-400">必要投稿: {mission.diary_count}回</span>
            )}
        </div>


      </div>
    )}
  </li>
  );
};

const SongItem: React.FC<{
  song: ChallengeSong;
  onEdit: (song: ChallengeSong) => void;
  onRemove: (songId: string) => void;
}> = ({ song, onEdit, onRemove }) => {
  return (
    <div className="border border-slate-600 rounded-lg p-3 bg-slate-800/30">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white">{song.song?.title || '不明'}</div>
          <div className="text-sm text-gray-400">{song.song?.artist || '不明'}</div>
          <div className="text-xs text-gray-500 mt-1">
            キー: {song.key_offset > 0 ? '+' : ''}{song.key_offset} | 
            速度: {song.min_speed}x | 
            ランク: {song.min_rank} | 
            クリア回数: {song.clears_required}回
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            className="btn btn-xs btn-primary"
            onClick={() => onEdit(song)}
          >
            <FaEdit className="w-3 h-3" />
          </button>
          <button
            className="btn btn-xs btn-error"
            onClick={() => onRemove(song.song_id)}
          >
            <FaTrash className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SongSelectorModal: React.FC<{
  onSelect: (songId: string) => void;
  onClose: () => void;
  excludeSongIds: string[];
}> = ({ onSelect, onClose, excludeSongIds }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">楽曲を追加</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>
        <SongSelector
          onSelect={onSelect}
          excludeSongIds={excludeSongIds}
        />
      </div>
    </div>
  );
};

const SongConditionsModal: React.FC<{
  song: ChallengeSong;
  onSave: (songId: string, conditions: any) => void;
  onCancel: () => void;
}> = ({ song, onSave, onCancel }) => {
  const [conditions, setConditions] = useState({
    key_offset: song.key_offset,
    min_speed: song.min_speed,
    min_rank: song.min_rank,
    min_clears_required: song.clears_required,
    notation_setting: song.notation_setting,
  });

  const handleSave = () => {
    onSave(song.song_id, conditions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">
          楽曲条件編集: {song.song?.title}
        </h3>
        
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium mb-1 block">キーオフセット</span>
            <input
              type="number"
              value={conditions.key_offset}
              onChange={(e) => setConditions({...conditions, key_offset: parseInt(e.target.value) || 0})}
              className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">最小速度</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={conditions.min_speed}
              onChange={(e) => setConditions({...conditions, min_speed: parseFloat(e.target.value) || 1.0})}
              className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">最小ランク</span>
            <select
              value={conditions.min_rank}
              onChange={(e) => setConditions({...conditions, min_rank: e.target.value})}
              className="select select-bordered w-full text-white bg-slate-700 border-slate-600"
            >
              <option value="C">C</option>
              <option value="B">B</option>
              <option value="A">A</option>
              <option value="S">S</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">クリア回数</span>
            <input
              type="number"
              min="1"
              value={conditions.min_clears_required}
              onChange={(e) => setConditions({...conditions, min_clears_required: parseInt(e.target.value) || 1})}
              className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">楽譜表示</span>
            <select
              value={conditions.notation_setting}
              onChange={(e) => setConditions({...conditions, notation_setting: e.target.value})}
              className="select select-bordered w-full text-white bg-slate-700 border-slate-600"
            >
              <option value="both">ノート+コード</option>
              <option value="chords">コードのみ</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button className="btn btn-primary flex-1" onClick={handleSave}>
            保存
          </button>
          <button className="btn btn-outline flex-1" onClick={onCancel}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

const FormSongConditionsModal: React.FC<{
  songId: string;
  songInfo?: { title: string; artist?: string };
  conditions?: SongConditions;
  onSave: (songId: string, conditions: SongConditions) => void;
  onCancel: () => void;
}> = ({ songId, songInfo, conditions, onSave, onCancel }) => {
  const [formConditions, setFormConditions] = useState<SongConditions>(
    conditions || {
      key_offset: 0,
      min_speed: 1.0,
      min_rank: 'B',
      min_clears_required: 1,
      notation_setting: 'both',
    }
  );

  const handleSave = () => {
    onSave(songId, formConditions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">
          楽曲条件編集: {songInfo?.title || `楽曲ID: ${songId}`}
        </h3>
        
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium mb-1 block">キーオフセット</span>
            <input
              type="number"
              value={formConditions.key_offset}
              onChange={(e) => setFormConditions({...formConditions, key_offset: parseInt(e.target.value) || 0})}
              className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">最小速度</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formConditions.min_speed}
              onChange={(e) => setFormConditions({...formConditions, min_speed: parseFloat(e.target.value) || 1.0})}
              className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">最小ランク</span>
            <select
              value={formConditions.min_rank}
              onChange={(e) => setFormConditions({...formConditions, min_rank: e.target.value})}
              className="select select-bordered w-full text-white bg-slate-700 border-slate-600"
            >
              <option value="C">C</option>
              <option value="B">B</option>
              <option value="A">A</option>
              <option value="S">S</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">クリア回数</span>
            <input
              type="number"
              min="1"
              value={formConditions.min_clears_required}
              onChange={(e) => setFormConditions({...formConditions, min_clears_required: parseInt(e.target.value) || 1})}
              className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium mb-1 block">楽譜表示</span>
            <select
              value={formConditions.notation_setting}
              onChange={(e) => setFormConditions({...formConditions, notation_setting: e.target.value})}
              className="select select-bordered w-full text-white bg-slate-700 border-slate-600"
            >
              <option value="both">ノート+コード</option>
              <option value="chords">コードのみ</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button className="btn btn-primary flex-1" onClick={handleSave}>
            保存
          </button>
          <button className="btn btn-outline flex-1" onClick={onCancel}>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

// 追加: ファンタジートラック一覧（管理）
const AdminFantasyTrackList: React.FC<{ missionId: string }> = ({ missionId }) => {
  const [tracks, setTracks] = React.useState<Array<{ 
    fantasy_stage_id: string; 
    stage_label: string; 
    clears_required: number;
    mode?: string;
    override_repeat_transposition_mode?: RepeatTranspositionMode | null;
    override_start_key?: number | null;
  }>>([]);
  const [editingTrack, setEditingTrack] = React.useState<string | null>(null);
  const toast = useToast();

  const load = async () => {
    try {
      const rows = await getChallengeFantasyTracks(missionId);
      setTracks(rows.map(r => ({ 
        fantasy_stage_id: r.fantasy_stage_id, 
        stage_label: `${r.stage.stage_number} - ${r.stage.name}`, 
        clears_required: r.clears_required,
        mode: r.stage.mode,
        override_repeat_transposition_mode: r.override_repeat_transposition_mode,
        override_start_key: r.override_start_key,
      })));
    } catch (e) {
      toast.error('ファンタジーステージの取得に失敗しました');
    }
  };

  React.useEffect(() => { void load(); }, [missionId]);

  const formatTranspositionMode = (mode: RepeatTranspositionMode | null | undefined) => {
    if (!mode) return '元設定';
    const labels: Record<RepeatTranspositionMode, string> = {
      'off': '転調なし',
      '+1': '+1(半音上)',
      '+5': '+5(完全4度上)',
      '-1': '-1(半音下)',
      '-5': '-5(完全4度下)',
      'random': 'ランダム',
    };
    return labels[mode] || mode;
  };

  return (
    <div className="space-y-2">
      {tracks.length === 0 && (
        <div className="text-sm text-gray-400">ステージが追加されていません</div>
      )}
      {tracks.map(t => (
        <div key={t.fantasy_stage_id} className="p-2 bg-slate-700/50 rounded">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white">
              {t.stage_label}
              <span className="ml-2 text-xs text-gray-300">必要クリア: {t.clears_required}回</span>
              {(t.mode === 'progression_timing' || t.mode === 'timing_combining') && (
                <span className="ml-2 text-xs text-purple-300">
                  [転調: {formatTranspositionMode(t.override_repeat_transposition_mode)}, 
                  キー: {t.override_start_key ?? '元設定'}]
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn btn-xs" onClick={() => setEditingTrack(editingTrack === t.fantasy_stage_id ? null : t.fantasy_stage_id)}>
                {editingTrack === t.fantasy_stage_id ? '閉じる' : '編集'}
              </button>
              <button className="btn btn-xs btn-error" onClick={async () => {
                if (!confirm('このステージを削除しますか？')) return;
                try {
                  await removeFantasyStageFromChallenge(missionId, t.fantasy_stage_id);
                  toast.success('削除しました');
                  void load();
                } catch (e) {
                  toast.error('削除に失敗しました');
                }
              }}>削除</button>
            </div>
          </div>
          {editingTrack === t.fantasy_stage_id && (
            <FantasyTrackEditForm
              track={t}
              missionId={missionId}
              onSaved={() => { setEditingTrack(null); void load(); }}
              onCancel={() => setEditingTrack(null)}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// 追加: ファンタジートラック編集フォーム
const FantasyTrackEditForm: React.FC<{
  track: {
    fantasy_stage_id: string;
    clears_required: number;
    mode?: string;
    override_repeat_transposition_mode?: RepeatTranspositionMode | null;
    override_start_key?: number | null;
  };
  missionId: string;
  onSaved: () => void;
  onCancel: () => void;
}> = ({ track, missionId, onSaved, onCancel }) => {
  const [clears, setClears] = React.useState(track.clears_required);
  const [overrideMode, setOverrideMode] = React.useState<RepeatTranspositionMode | null>(track.override_repeat_transposition_mode ?? null);
  const [overrideKey, setOverrideKey] = React.useState<number | null>(track.override_start_key ?? null);
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  const handleSave = async () => {
    if (clears <= 0) {
      toast.error('クリア回数は1以上を入力してください');
      return;
    }
    setSaving(true);
    try {
      await updateFantasyStageInChallenge(missionId, track.fantasy_stage_id, {
        clearsRequired: clears,
        overrideRepeatTranspositionMode: overrideMode,
        overrideStartKey: overrideKey,
      });
      toast.success('更新しました');
      onSaved();
    } catch (e) {
      toast.error('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 p-3 bg-slate-800 rounded border border-slate-600">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-300 mb-1">必要クリア回数</label>
          <input
            type="number"
            min={1}
            value={clears}
            onChange={(e) => setClears(parseInt(e.target.value, 10) || 1)}
            className="input input-bordered input-sm w-full text-white"
          />
        </div>
        {(track.mode === 'progression_timing' || track.mode === 'timing_combining') && (
          <>
            <div>
              <label className="block text-xs text-gray-300 mb-1">リピート転調設定</label>
              <select
                className="select select-bordered select-sm w-full text-white"
                value={overrideMode ?? ''}
                onChange={(e) => setOverrideMode(e.target.value === '' ? null : e.target.value as RepeatTranspositionMode)}
              >
                <option value="">元のステージ設定を使用</option>
                <option value="off">off（転調なし）</option>
                <option value="+1">+1（半音上）</option>
                <option value="+5">+5（完全4度上）</option>
                <option value="-1">-1（半音下）</option>
                <option value="-5">-5（完全4度下）</option>
                <option value="random">ランダム</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">開始キー</label>
              <select
                className="select select-bordered select-sm w-full text-white"
                value={overrideKey ?? ''}
                onChange={(e) => setOverrideKey(e.target.value === '' ? null : parseInt(e.target.value, 10))}
              >
                <option value="">元のステージ設定を使用</option>
                {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(k => (
                  <option key={k} value={k}>
                    {k === 0 ? '0（原曲キー）' : k > 0 ? `+${k}` : `${k}`}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>キャンセル</button>
      </div>
    </div>
  );
};

// 追加: ファンタジーステージ追加モーダル
const FantasyAddModal: React.FC<{ missionId: string; onClose: () => void; onAdded: () => void }> = ({ missionId, onClose, onAdded }) => {
  const [selectedStageId, setSelectedStageId] = React.useState<string | null>(null);
  const [selectedStage, setSelectedStage] = React.useState<FantasyStage | null>(null);
  const [count, setCount] = React.useState<number>(1);
  const [overrideMode, setOverrideMode] = React.useState<RepeatTranspositionMode | null>(null);
  const [overrideKey, setOverrideKey] = React.useState<number | null>(null);
  const toast = useToast();

  // ステージ選択時にステージ情報を取得
  const handleStageSelect = async (stageId: string) => {
    setSelectedStageId(stageId);
    try {
      const stage = await fetchFantasyStageById(stageId);
      setSelectedStage(stage);
      // ステージが変更されたら上書き設定をリセット
      setOverrideMode(null);
      setOverrideKey(null);
    } catch (e) {
      setSelectedStage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">ファンタジーステージを追加</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <FantasyStageSelector selectedStageId={selectedStageId} onStageSelect={handleStageSelect} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">必要クリア回数</label>
              <input type="number" min={1} value={count} onChange={(e)=>setCount(parseInt(e.target.value,10)||1)} className="input input-bordered w-full text-white" />
            </div>
            {(selectedStage?.mode === 'progression_timing' || selectedStage?.mode === 'timing_combining') && (
              <>
                <div>
                  <label className="block text-sm mb-1">リピート転調設定</label>
                  <select
                    className="select select-bordered w-full text-white"
                    value={overrideMode ?? ''}
                    onChange={(e) => setOverrideMode(e.target.value === '' ? null : e.target.value as RepeatTranspositionMode)}
                  >
                    <option value="">元のステージ設定を使用</option>
                    <option value="off">off（転調なし）</option>
                    <option value="+1">+1（半音上）</option>
                    <option value="+5">+5（完全4度上）</option>
                    <option value="-1">-1（半音下）</option>
                    <option value="-5">-5（完全4度下）</option>
                    <option value="random">ランダム</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">開始キー</label>
                  <select
                    className="select select-bordered w-full text-white"
                    value={overrideKey ?? ''}
                    onChange={(e) => setOverrideKey(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                  >
                    <option value="">元のステージ設定を使用</option>
                    {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(k => (
                      <option key={k} value={k}>
                        {k === 0 ? '0（原曲キー）' : k > 0 ? `+${k}` : `${k}`}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          {(selectedStage?.mode === 'progression_timing' || selectedStage?.mode === 'timing_combining') && (
            <p className="text-xs text-gray-400">
              timingモードのステージです。転調設定と開始キーを上書きできます。
            </p>
          )}
          <button
            className="btn btn-primary w-full"
            disabled={!selectedStageId || count <= 0}
            onClick={async () => {
              if (!selectedStageId) return;
              try {
                await addFantasyStageToChallenge(missionId, selectedStageId, {
                  clearsRequired: count,
                  overrideRepeatTranspositionMode: overrideMode,
                  overrideStartKey: overrideKey,
                });
                toast.success('追加しました');
                onAdded();
                onClose();
              } catch (e) {
                toast.error('追加に失敗しました');
              }
            }}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
};

// 追加: フォーム用ファンタジー追加モーダル（新規作成時に使用）
const FormFantasyAddModal: React.FC<{ 
  onClose: () => void; 
  onAdd: (
    stageId: string, 
    clears: number, 
    mode?: string,
    overrideRepeatTranspositionMode?: RepeatTranspositionMode | null,
    overrideStartKey?: number | null
  ) => void 
}> = ({ onClose, onAdd }) => {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<FantasyStage | null>(null);
  const [count, setCount] = useState<number>(1);
  const [overrideMode, setOverrideMode] = useState<RepeatTranspositionMode | null>(null);
  const [overrideKey, setOverrideKey] = useState<number | null>(null);
  const toast = useToast();

  // ステージ選択時にステージ情報を取得
  const handleStageSelect = async (stageId: string) => {
    setSelectedStageId(stageId);
    try {
      const stage = await fetchFantasyStageById(stageId);
      setSelectedStage(stage);
      // ステージが変更されたら上書き設定をリセット
      setOverrideMode(null);
      setOverrideKey(null);
    } catch (e) {
      toast.error('ステージ情報の取得に失敗しました');
      setSelectedStage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">ファンタジーステージを追加</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <FantasyStageSelector selectedStageId={selectedStageId} onStageSelect={handleStageSelect} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">必要クリア回数</label>
              <input type="number" min={1} value={count} onChange={(e)=>setCount(parseInt(e.target.value,10)||1)} className="input input-bordered w-full text-white" />
            </div>
            {(selectedStage?.mode === 'progression_timing' || selectedStage?.mode === 'timing_combining') && (
              <>
                <div>
                  <label className="block text-sm mb-1">リピート転調設定</label>
                  <select
                    className="select select-bordered w-full text-white"
                    value={overrideMode ?? ''}
                    onChange={(e) => setOverrideMode(e.target.value === '' ? null : e.target.value as RepeatTranspositionMode)}
                  >
                    <option value="">元のステージ設定を使用</option>
                    <option value="off">off（転調なし）</option>
                    <option value="+1">+1（半音上）</option>
                    <option value="+5">+5（完全4度上）</option>
                    <option value="-1">-1（半音下）</option>
                    <option value="-5">-5（完全4度下）</option>
                    <option value="random">ランダム</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">開始キー</label>
                  <select
                    className="select select-bordered w-full text-white"
                    value={overrideKey ?? ''}
                    onChange={(e) => setOverrideKey(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                  >
                    <option value="">元のステージ設定を使用</option>
                    {[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map(k => (
                      <option key={k} value={k}>
                        {k === 0 ? '0（原曲キー）' : k > 0 ? `+${k}` : `${k}`}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
          {(selectedStage?.mode === 'progression_timing' || selectedStage?.mode === 'timing_combining') && (
            <p className="text-xs text-gray-400">
              timingモードのステージです。転調設定と開始キーを上書きできます。
            </p>
          )}
          <button
            className="btn btn-primary w-full"
            disabled={!selectedStageId || count <= 0}
            onClick={() => { 
              if (selectedStageId) {
                onAdd(
                  selectedStageId, 
                  count, 
                  selectedStage?.mode,
                  overrideMode,
                  overrideKey
                ); 
              }
            }}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
};

// サバイバルトラック一覧（管理・既存ミッション用）
const AdminSurvivalTrackList: React.FC<{ missionId: string }> = ({ missionId }) => {
  const [tracks, setTracks] = React.useState<Array<{
    stage_number: number;
    stage_name: string;
    clears_required: number;
    difficulty: string;
  }>>([]);
  const [editingTrack, setEditingTrack] = React.useState<number | null>(null);
  const toast = useToast();

  const load = async () => {
    try {
      const rows = await getChallengeSurvivalStages(missionId);
      setTracks(rows.map(r => ({
        stage_number: r.stage_number,
        stage_name: r.stage_name,
        clears_required: r.clears_required,
        difficulty: r.difficulty,
      })));
    } catch {
      toast.error('サバイバルステージの取得に失敗しました');
    }
  };

  React.useEffect(() => { void load(); }, [missionId]);

  return (
    <div className="space-y-2">
      {tracks.length === 0 && (
        <div className="text-sm text-gray-400">ステージが追加されていません</div>
      )}
      {tracks.map(t => (
        <div key={t.stage_number} className="p-2 bg-slate-700/50 rounded">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white">
              {t.stage_name}
              <span className="ml-2 text-xs text-gray-300">必要クリア: {t.clears_required}回</span>
              <span className="ml-2 text-xs text-gray-400">[{t.difficulty}]</span>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-xs" onClick={() => setEditingTrack(editingTrack === t.stage_number ? null : t.stage_number)}>
                {editingTrack === t.stage_number ? '閉じる' : '編集'}
              </button>
              <button className="btn btn-xs btn-error" onClick={async () => {
                if (!confirm('このステージを削除しますか？')) return;
                try {
                  await removeSurvivalStageFromChallenge(missionId, t.stage_number);
                  toast.success('削除しました');
                  void load();
                } catch {
                  toast.error('削除に失敗しました');
                }
              }}>削除</button>
            </div>
          </div>
          {editingTrack === t.stage_number && (
            <div className="mt-3 p-3 bg-slate-800 rounded border border-slate-600">
              <div>
                <label className="block text-xs text-gray-300 mb-1">必要クリア回数</label>
                <input
                  type="number"
                  min={1}
                  defaultValue={t.clears_required}
                  className="input input-bordered input-sm w-full text-white"
                  onBlur={async (e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!Number.isFinite(val) || val <= 0) return;
                    try {
                      await updateSurvivalStageInChallenge(missionId, t.stage_number, val);
                      toast.success('更新しました');
                      void load();
                      setEditingTrack(null);
                    } catch {
                      toast.error('更新に失敗しました');
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// サバイバルステージ追加モーダル
const SurvivalAddModal: React.FC<{
  missionId: string | null;
  onClose: () => void;
  onAdded: (stageNumber: number, clears: number, label: string) => void;
}> = ({ missionId, onClose, onAdded }) => {
  const [selectedStageNumber, setSelectedStageNumber] = useState<number | null>(null);
  const [count, setCount] = useState<number>(1);
  const [searchText, setSearchText] = useState('');
  const toast = useToast();

  const filteredStages = ALL_STAGES.filter(s => {
    if (!searchText) return true;
    const lower = searchText.toLowerCase();
    return s.name.toLowerCase().includes(lower) || s.nameEn.toLowerCase().includes(lower) || String(s.stageNumber).includes(lower);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">サバイバルステージを追加</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            className="input input-bordered w-full text-white"
            placeholder="ステージ名 or 番号で検索..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <div className="max-h-60 overflow-y-auto border border-slate-600 rounded-lg">
            {filteredStages.map(s => (
              <button
                key={s.stageNumber}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0 ${
                  selectedStageNumber === s.stageNumber ? 'bg-purple-900/50 text-purple-300' : 'text-white'
                }`}
                onClick={() => setSelectedStageNumber(s.stageNumber)}
              >
                <span className="font-medium">{s.name}</span>
                <span className="ml-2 text-xs text-gray-400">[{s.difficulty}]</span>
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm mb-1">必要クリア回数</label>
            <input type="number" min={1} value={count} onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)} className="input input-bordered w-full text-white" />
          </div>
          <button
            className="btn btn-primary w-full"
            disabled={!selectedStageNumber || count <= 0}
            onClick={async () => {
              if (!selectedStageNumber) return;
              const stageDef = ALL_STAGES.find(s => s.stageNumber === selectedStageNumber);
              const label = stageDef?.name ?? `Stage ${selectedStageNumber}`;
              if (missionId) {
                try {
                  await addSurvivalStageToChallenge(missionId, selectedStageNumber, count);
                  toast.success('追加しました');
                } catch {
                  toast.error('追加に失敗しました');
                  return;
                }
              }
              onAdded(selectedStageNumber, count, label);
              onClose();
            }}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissionManager; 
