import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { addFantasyBgmAsset, fetchFantasyBgmAssets, deleteFantasyBgmAsset, FantasyBgmAsset } from '@/platform/supabaseFantasyBgm';
import { useToast } from '@/stores/toastStore';

interface BgmFormData {
  name: string;
  description?: string;
  mp3File?: FileList;
}

const FantasyBgmManager: React.FC = () => {
  const { register, handleSubmit, reset, watch } = useForm<BgmFormData>();
  const [assets, setAssets] = useState<FantasyBgmAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const watchedFile = watch('mp3File');

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchFantasyBgmAssets();
      setAssets(data);
    } catch (e) {
      console.error(e);
      toast.error('BGM一覧の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (values: BgmFormData) => {
    const file = values.mp3File?.[0];
    if (!file) {
      toast.error('MP3ファイルは必須です');
      return;
    }
    if (!values.name?.trim()) {
      toast.error('名称は必須です');
      return;
    }

    setUploading(true);
    try {
      await addFantasyBgmAsset({ name: values.name.trim(), description: values.description }, file);
      toast.success('BGMを追加しました');
      reset();
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'BGMの追加に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (text?: string | null) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success('URLをコピーしました');
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">ファンタジーBGM管理</h3>

      <form className="space-y-4 mb-8" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-sm font-medium mb-1">名称 *</label>
          <input className="input input-bordered w-full text-white" placeholder="例: ステージ1-1 BGM"
                 {...register('name', { required: true })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">説明</label>
          <input className="input input-bordered w-full text-white" placeholder="任意説明"
                 {...register('description')} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">MP3ファイル *</label>
          <input type="file" accept=".mp3,audio/mpeg" className="file-input file-input-bordered w-full"
                 {...register('mp3File', { required: true })} />
          {watchedFile?.[0] && (
            <p className="text-xs text-gray-400 mt-1">{watchedFile[0].name} ({formatFileSize(watchedFile[0].size)})</p>
          )}
        </div>
        <button type="submit" className="btn btn-primary w-full" disabled={uploading}>
          {uploading ? (
            <>
              <span className="loading loading-spinner loading-sm" /> アップロード中...
            </>
          ) : '追加'}
        </button>
      </form>

      <div className="divider my-8" />

      <h3 className="text-xl font-bold mb-4">BGM一覧</h3>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-slate-800/50 rounded-lg overflow-hidden">
          <ul className="divide-y divide-slate-700">
            {assets.map(a => (
              <li key={a.id} className="p-3 space-y-1 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{a.name}</p>
                    {a.description && <p className="text-xs text-gray-400 truncate">{a.description}</p>}
                    {a.mp3_url && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded">MP3</span>
                        <button className="btn btn-xs" onClick={() => copyToClipboard(a.mp3_url)}>URLコピー</button>
                        <a className="btn btn-xs btn-outline" href={a.mp3_url} target="_blank" rel="noreferrer">開く</a>
                      </div>
                    )}
                  </div>
                  <button className="btn btn-xs btn-error" onClick={async () => {
                    if (!confirm(`「${a.name}」を削除しますか？`)) return;
                    try {
                      await deleteFantasyBgmAsset(a.id);
                      toast.success('削除しました');
                      await load();
                    } catch (e: any) {
                      console.error(e);
                      toast.error('削除に失敗しました');
                    }
                  }}>削除</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        取得したURLを `fantasy_stages.mp3_url` に手動で貼り付けてご利用ください。
      </p>
    </div>
  );
};

export default FantasyBgmManager;