/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { addSongWithFiles, fetchSongs, deleteSong, Song, SongFiles, SongUsageType } from '@/platform/supabaseSongs';
import { createSongFilesBucket } from '@/platform/supabaseStorage';
import { useToast } from '@/stores/toastStore';

interface SongFormData {
  title: string;
  artist?: string;
  min_rank: 'free' | 'standard' | 'premium' | 'platinum';
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
  const { register, handleSubmit, reset, watch } = useForm<SongFormData>();
  const toast = useToast();

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
    createSongFilesBucket().catch(e => console.warn('バケット作成済み:', e));
  }, []);

  useEffect(() => {
    loadSongs(activeListTab);
  }, [activeListTab]);

  const onSubmit = async (values: SongFormData) => {
    if (!values.jsonFile?.[0]) {
      toast.error('JSONファイルは必須です');
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
          </select>
        </div>

        {/* ファイルアップロード */}
        <div className="divider">ファイル</div>

        <div>
          <label className="block text-sm font-medium mb-1">
            JSONファイル * 
            <span className="text-xs text-gray-400 ml-2">ノーツデータ</span>
          </label>
          <input 
            type="file" 
            accept=".json,application/json"
            className="file-input file-input-bordered w-full" 
            {...register('jsonFile', { required: true })}
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
                  <div className="flex gap-2 mt-1">
                    {s.json_url && <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">JSON</span>}
                    {s.audio_url && <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded">MP3</span>}
                    {s.xml_url && <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded">XML</span>}
                  </div>
                </div>
                <button className="btn btn-xs btn-error ml-2 flex-shrink-0" onClick={async () => {
                  if (!confirm(`「${s.title}」を削除しますか？`)) return;
                  try {
                    await deleteSong(s.id);
                    toast.success('曲を削除しました');
                    await loadSongs(activeListTab);
                  } catch (e: any) {
                    console.error('曲の削除エラー:', e);
                    toast.error('曲の削除に失敗しました');
                  }
                }}>削除</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SongManager; 