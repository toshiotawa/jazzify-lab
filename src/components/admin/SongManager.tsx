/// <reference types="vite/client" />
import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { addSongWithFiles, fetchSongs, deleteSong, updateSong, updateSongGlobalAvailable, Song, SongFiles, SongUsageType } from '@/platform/supabaseSongs';
import { useToast } from '@/stores/toastStore';

interface SongFormData {
  title: string;
  artist?: string;
  min_rank: 'free' | 'standard' | 'premium' | 'platinum' | 'black';
  audioFile?: FileList;
  xmlFile?: FileList;
  jsonFile?: FileList;
  /** MusicXMLがあっても譜面を表示しない */
  hide_sheet_music?: boolean;
  /** リズム譜モード - 符頭の高さを一定にして表示 */
  use_rhythm_notation?: boolean;
  /** standard_global プランで遊べるかどうか */
  global_available?: boolean;
}

interface EditFormData {
  title: string;
  artist: string;
  min_rank: 'free' | 'standard' | 'premium' | 'platinum' | 'black';
  hide_sheet_music: boolean;
  use_rhythm_notation: boolean;
  global_available: boolean;
  audioFile?: FileList;
  xmlFile?: FileList;
  jsonFile?: FileList;
}

const SongManager: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<SongUsageType>('general');
  const [activeListTab, setActiveListTab] = useState<SongUsageType>('general');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const { register, handleSubmit, reset, watch } = useForm<SongFormData>();
  const { register: editRegister, handleSubmit: editHandleSubmit, reset: editReset, watch: editWatch, setValue: editSetValue } = useForm<EditFormData>();
  const toast = useToast();

  const openEditModal = useCallback((song: Song) => {
    setEditingSong(song);
    editReset({
      title: song.title,
      artist: song.artist ?? '',
      min_rank: song.min_rank as EditFormData['min_rank'],
      hide_sheet_music: song.hide_sheet_music ?? false,
      use_rhythm_notation: song.use_rhythm_notation ?? false,
      global_available: song.global_available ?? false,
    });
  }, [editReset]);

  const closeEditModal = useCallback(() => {
    setEditingSong(null);
    editReset();
  }, [editReset]);

  const onEditSubmit = useCallback(async (values: EditFormData) => {
    if (!editingSong) return;
    setEditUploading(true);
    try {
      const files: SongFiles = {
        audioFile: values.audioFile?.[0],
        xmlFile: values.xmlFile?.[0],
        jsonFile: values.jsonFile?.[0],
      };

      let jsonData: any = undefined;
      if (files.jsonFile) {
        try {
          const text = await files.jsonFile.text();
          jsonData = JSON.parse(text);
        } catch {
          toast.error('JSONファイルの形式が不正です');
          setEditUploading(false);
          return;
        }
      }

      const updates: Partial<Omit<Song, 'id' | 'created_by'>> = {
        title: values.title,
        artist: values.artist || undefined,
        min_rank: values.min_rank,
        hide_sheet_music: values.hide_sheet_music,
        use_rhythm_notation: values.use_rhythm_notation,
        global_available: values.global_available,
      };

      if (jsonData !== undefined) {
        updates.json_data = jsonData;
      }

      const hasFiles = files.audioFile || files.xmlFile || files.jsonFile;
      await updateSong(editingSong.id, updates, hasFiles ? files : undefined);

      toast.success('曲を更新しました');
      closeEditModal();
      await loadSongs(activeListTab);
    } catch (e: any) {
      toast.error(`曲の更新に失敗しました: ${e.message || ''}`);
    } finally {
      setEditUploading(false);
    }
  }, [editingSong, activeListTab, closeEditModal, toast]);

  const editWatchedFiles = editWatch(['audioFile', 'xmlFile', 'jsonFile']);

  // フォームの値を監視
  const watchedFiles = watch(['audioFile', 'xmlFile', 'jsonFile']);

  // 環境変数チェック
  useEffect(() => {
    console.log('環境変数チェック:', {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '設定済み' : '未設定',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '設定済み' : '未設定',
    });
  }, []);

  const loadSongs = async (usageType: SongUsageType) => {
    setLoading(true);
    try {
      const data = await fetchSongs(usageType);
      setSongs(data);
    } catch (e: any) {
      console.error(`[${usageType}] 曲一覧読み込みエラー:`, e);
      toast.error('曲一覧の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    loadSongs(activeListTab);
  }, [activeListTab]);

  const onSubmit = async (values: SongFormData) => {
    // JSONまたはMusicXMLのいずれかが必要
    if (!values.jsonFile?.[0] && !values.xmlFile?.[0]) {
      toast.error('JSONファイルまたはMusicXMLファイルのいずれかは必須です');
      return;
    }

    setUploading(true);
    try {
      const files: SongFiles = {
        audioFile: values.audioFile?.[0],
        xmlFile: values.xmlFile?.[0],
        jsonFile: values.jsonFile?.[0]
      };

      console.log('アップロード開始:', {
        title: values.title,
        artist: values.artist,
        min_rank: values.min_rank,
        usage_type: activeFormTab,
        files: {
          audio: files.audioFile?.name,
          xml: files.xmlFile?.name,
          json: files.jsonFile?.name
        }
      });

      const result = await addSongWithFiles({
        title: values.title,
        artist: values.artist,
        min_rank: values.min_rank,
        usage_type: activeFormTab,
        hide_sheet_music: values.hide_sheet_music ?? false,
        use_rhythm_notation: values.use_rhythm_notation ?? false,
        global_available: values.global_available ?? false,
      }, files);

      console.log('アップロード成功:', result);
      toast.success(`[${activeFormTab}] 曲を追加しました`);
      reset();
      if (activeListTab === activeFormTab) {
        await loadSongs(activeListTab);
      } else {
        setActiveListTab(activeFormTab);
      }
    } catch (e: any) {
      console.error('曲の追加エラー:', e);
      console.error('エラー詳細:', {
        message: e.message,
        code: e.code,
        details: e.details,
        hint: e.hint,
        statusCode: e.statusCode || e.status
      });
      
      // エラーメッセージを改善
      let errorMessage = '曲の追加に失敗しました';
      if (e.message) {
        errorMessage += `: ${e.message}`;
      }
      if (e.code === 'PGRST116') {
        errorMessage = 'データベースエラー: テーブルまたはカラムが見つかりません';
      } else if (e.message?.includes('Supabase URL')) {
        errorMessage = '環境変数が設定されていません。管理者に連絡してください。';
      }
      
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">曲登録</h3>
      <div className="tabs tabs-boxed mb-4 bg-slate-800/50">
        <a className={`tab ${activeFormTab === 'general' ? 'tab-active' : ''}`} onClick={() => setActiveFormTab('general')}>通常曲</a>
        <a className={`tab ${activeFormTab === 'lesson' ? 'tab-active' : ''}`} onClick={() => setActiveFormTab('lesson')}>レッスン曲</a>
      </div>
      <form className="space-y-4 mb-8" onSubmit={handleSubmit(onSubmit)}>
        {/* 基本情報 */}
        <div>
          <label className="block text-sm font-medium mb-1">タイトル *</label>
          <input 
            className="input input-bordered w-full text-white" 
            placeholder="曲のタイトル" 
            {...register('title', { required: true })} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">アーティスト</label>
          <input 
            className="input input-bordered w-full text-white" 
            placeholder="アーティスト名（任意）" 
            {...register('artist')} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">最低ランク</label>
          <select 
            className="select select-bordered w-full text-white" 
            {...register('min_rank')} 
            defaultValue="free"
          >
            <option value="free">フリー</option>
            <option value="standard">スタンダード</option>
            <option value="premium">プレミアム</option>
            <option value="platinum">プラチナ</option>
            <option value="black">ブラック</option>
          </select>
        </div>

        {/* 楽譜表示オプション */}
        <div className="divider">楽譜表示オプション</div>

        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input 
              type="checkbox" 
              className="checkbox checkbox-primary" 
              {...register('hide_sheet_music')}
            />
            <span className="label-text">譜面を表示しない</span>
            <span className="text-xs text-gray-400">（MusicXMLがあっても楽譜非表示）</span>
          </label>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input 
              type="checkbox" 
              className="checkbox checkbox-primary" 
              {...register('use_rhythm_notation')}
            />
            <span className="label-text">リズム譜モード</span>
            <span className="text-xs text-gray-400">（符頭の高さを一定にして表示）</span>
          </label>
        </div>

        <div className="divider">Global プラン</div>

        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input 
              type="checkbox" 
              className="checkbox checkbox-accent" 
              {...register('global_available')}
            />
            <span className="label-text">Global プランで遊べる</span>
            <span className="text-xs text-gray-400">（standard_global ユーザーに公開）</span>
          </label>
        </div>

        {/* ファイルアップロード */}
        <div className="divider">ファイル</div>

        <div>
          <label className="block text-sm font-medium mb-1">
            JSONファイル
            <span className="text-xs text-gray-400 ml-2">ノーツデータ（MusicXMLのみの場合は不要）</span>
          </label>
          <input 
            type="file" 
            accept=".json,application/json"
            className="file-input file-input-bordered w-full" 
            {...register('jsonFile')}
          />
          {watchedFiles[2]?.[0] && (
            <p className="text-xs text-gray-400 mt-1">
              {watchedFiles[2][0].name} ({formatFileSize(watchedFiles[2][0].size)})
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            MP3ファイル
            <span className="text-xs text-gray-400 ml-2">音源（任意）</span>
          </label>
          <input 
            type="file" 
            accept=".mp3,audio/mpeg"
            className="file-input file-input-bordered w-full" 
            {...register('audioFile')}
          />
          {watchedFiles[0]?.[0] && (
            <p className="text-xs text-gray-400 mt-1">
              {watchedFiles[0][0].name} ({formatFileSize(watchedFiles[0][0].size)})
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            MusicXMLファイル
            <span className="text-xs text-gray-400 ml-2">楽譜（任意）</span>
          </label>
          <input 
            type="file" 
            accept=".xml,.musicxml,application/xml"
            className="file-input file-input-bordered w-full" 
            {...register('xmlFile')}
          />
          {watchedFiles[1]?.[0] && (
            <p className="text-xs text-gray-400 mt-1">
              {watchedFiles[1][0].name} ({formatFileSize(watchedFiles[1][0].size)})
            </p>
          )}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary w-full"
          disabled={uploading}
        >
          {uploading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              アップロード中...
            </>
          ) : (
            '追加'
          )}
        </button>
      </form>

      <div className="divider my-8"></div>

      <h3 className="text-xl font-bold mb-4">曲一覧</h3>
      <div className="tabs tabs-boxed mb-4 bg-slate-800/50">
        <a className={`tab ${activeListTab === 'general' ? 'tab-active' : ''}`} onClick={() => setActiveListTab('general')}>通常曲</a>
        <a className={`tab ${activeListTab === 'lesson' ? 'tab-active' : ''}`} onClick={() => setActiveListTab('lesson')}>レッスン曲</a>
      </div>
      {loading ? <p className="text-gray-400">Loading...</p> : (
        <div className="bg-slate-800/50 rounded-lg overflow-hidden">
          <ul className="divide-y divide-slate-700">
            {songs.map(s => (
              <li key={s.id} className="flex items-center justify-between p-3 hover:bg-slate-700/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{s.title}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {s.artist && `${s.artist} • `}
                    {s.min_rank}
                  </p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {s.json_url && <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">JSON</span>}
                    {s.audio_url && <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded">MP3</span>}
                    {s.xml_url && <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded">XML</span>}
                    {s.hide_sheet_music && <span className="text-xs bg-orange-600/20 text-orange-400 px-2 py-0.5 rounded">譜面非表示</span>}
                    {s.use_rhythm_notation && <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded">リズム譜</span>}
                    {s.global_available && <span className="text-xs bg-cyan-600/20 text-cyan-400 px-2 py-0.5 rounded">Global</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <label className="label cursor-pointer gap-1" title="Globalプランで遊べる">
                    <span className="text-xs text-gray-400">G</span>
                    <input
                      type="checkbox"
                      className="toggle toggle-xs toggle-accent"
                      checked={s.global_available ?? false}
                      onChange={async (e) => {
                        try {
                          await updateSongGlobalAvailable(s.id, e.target.checked);
                          toast.success(e.target.checked ? 'Globalに公開しました' : 'Global非公開にしました');
                          await loadSongs(activeListTab);
                        } catch (err: any) {
                          toast.error('更新に失敗しました');
                        }
                      }}
                    />
                  </label>
                </div>
                <button
                  className="btn btn-xs btn-info ml-2 flex-shrink-0"
                  onClick={() => openEditModal(s)}
                  aria-label={`${s.title}を編集`}
                >
                  編集
                </button>
                <button className="btn btn-xs btn-error ml-2 flex-shrink-0" onClick={async () => {
                  if (!confirm(`「${s.title}」を削除しますか？`)) return;
                  try {
                    await deleteSong(s.id);
                    toast.success('曲を削除しました');
                    await loadSongs(activeListTab);
                  } catch (e: any) {
                    toast.error('曲の削除に失敗しました');
                  }
                }}>削除</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 編集モーダル */}
      {editingSong && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg bg-slate-900">
            <h3 className="font-bold text-lg mb-4">曲を編集</h3>
            <form className="space-y-4" onSubmit={editHandleSubmit(onEditSubmit)}>
              <div>
                <label className="block text-sm font-medium mb-1">タイトル *</label>
                <input
                  className="input input-bordered w-full text-white"
                  placeholder="曲のタイトル"
                  {...editRegister('title', { required: true })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">アーティスト</label>
                <input
                  className="input input-bordered w-full text-white"
                  placeholder="アーティスト名（任意）"
                  {...editRegister('artist')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">最低ランク</label>
                <select
                  className="select select-bordered w-full text-white"
                  {...editRegister('min_rank')}
                >
                  <option value="free">フリー</option>
                  <option value="standard">スタンダード</option>
                  <option value="premium">プレミアム</option>
                  <option value="platinum">プラチナ</option>
                  <option value="black">ブラック</option>
                </select>
              </div>

              <div className="divider text-xs">楽譜表示オプション</div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    {...editRegister('hide_sheet_music')}
                  />
                  <span className="label-text">譜面を表示しない</span>
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    {...editRegister('use_rhythm_notation')}
                  />
                  <span className="label-text">リズム譜モード</span>
                </label>
              </div>

              <div className="divider text-xs">Global プラン</div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-accent"
                    {...editRegister('global_available')}
                  />
                  <span className="label-text">Global プランで遊べる</span>
                </label>
              </div>

              <div className="divider text-xs">ファイル差し替え（変更時のみ選択）</div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  JSONファイル
                  {editingSong.json_url && <span className="text-xs text-blue-400 ml-2">アップロード済み</span>}
                </label>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="file-input file-input-bordered file-input-sm w-full"
                  {...editRegister('jsonFile')}
                />
                {editWatchedFiles[2]?.[0] && (
                  <p className="text-xs text-gray-400 mt-1">
                    {editWatchedFiles[2][0].name} ({formatFileSize(editWatchedFiles[2][0].size)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  MP3ファイル
                  {editingSong.audio_url && <span className="text-xs text-green-400 ml-2">アップロード済み</span>}
                </label>
                <input
                  type="file"
                  accept=".mp3,audio/mpeg"
                  className="file-input file-input-bordered file-input-sm w-full"
                  {...editRegister('audioFile')}
                />
                {editWatchedFiles[0]?.[0] && (
                  <p className="text-xs text-gray-400 mt-1">
                    {editWatchedFiles[0][0].name} ({formatFileSize(editWatchedFiles[0][0].size)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  MusicXMLファイル
                  {editingSong.xml_url && <span className="text-xs text-purple-400 ml-2">アップロード済み</span>}
                </label>
                <input
                  type="file"
                  accept=".xml,.musicxml,application/xml"
                  className="file-input file-input-bordered file-input-sm w-full"
                  {...editRegister('xmlFile')}
                />
                {editWatchedFiles[1]?.[0] && (
                  <p className="text-xs text-gray-400 mt-1">
                    {editWatchedFiles[1][0].name} ({formatFileSize(editWatchedFiles[1][0].size)})
                  </p>
                )}
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeEditModal}
                  disabled={editUploading}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editUploading}
                >
                  {editUploading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={closeEditModal}></div>
        </div>
      )}
    </div>
  );
};

export default SongManager; 