import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { addFantasyBgmAsset, fetchFantasyBgmAssets, deleteFantasyBgmAsset, updateFantasyBgmAsset, FantasyBgmAsset } from '@/platform/supabaseFantasyBgm';
import { useToast } from '@/stores/toastStore';
import { processAudioFile } from '@/utils/audioProcessor';

interface BgmFormData {
  name: string;
  description?: string;
  bpm?: number | null;
  time_signature?: number | null;
  measure_count?: number | null;
  count_in_measures?: number | null;
  mp3File?: FileList;
  convertToMp3?: boolean;
  addCountIn?: boolean;
  countBeats?: number;
}

const FantasyBgmManager: React.FC = () => {
  const { register, handleSubmit, reset, watch } = useForm<BgmFormData>({
    defaultValues: {
      convertToMp3: true,
      addCountIn: false,
      countBeats: 4,
    }
  });
  const [assets, setAssets] = useState<FantasyBgmAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<FantasyBgmAsset>>({});
  const toast = useToast();

  const watchedFile = watch('mp3File');
  const watchedAddCountIn = watch('addCountIn');
  const watchedBpm = watch('bpm');

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
    let file = values.mp3File?.[0];
    if (!file) {
      toast.error('音声ファイルは必須です');
      return;
    }
    if (!values.name?.trim()) {
      toast.error('名称は必須です');
      return;
    }

    // カウント追加にはBPMが必要
    if (values.addCountIn && (!values.bpm || values.bpm <= 0)) {
      toast.error('カウント追加にはBPMの設定が必要です');
      return;
    }

    setUploading(true);
    setUploadProgress('');
    
    try {
      // 音声処理（MP3変換・カウント追加）
      if (values.convertToMp3 || values.addCountIn) {
        setUploadProgress('音声を処理中...');
        
        const result = await processAudioFile(file, {
          convertToMp3: values.convertToMp3 ?? false,
          addCountIn: values.addCountIn ?? false,
          bpm: values.bpm ?? undefined,
          countBeats: values.countBeats ?? 4,
          mp3Bitrate: 192,
        });
        
        file = result.file;
        
        if (result.countInDuration) {
          setUploadProgress(`カウント（${result.countInDuration.toFixed(2)}秒）を追加しました`);
        }
      }

      setUploadProgress('アップロード中...');
      
      await addFantasyBgmAsset({
        name: values.name.trim(),
        description: values.description,
        bpm: values.bpm ?? null,
        time_signature: values.time_signature ?? null,
        measure_count: values.measure_count ?? null,
        count_in_measures: values.count_in_measures ?? null,
      }, file);
      
      toast.success('BGMを追加しました');
      reset();
      setUploadProgress('');
      await load();
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'BGMの追加に失敗しました';
      toast.error(errorMessage);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  const handleStartEdit = (asset: FantasyBgmAsset) => {
    setEditingId(asset.id);
    setEditValues({
      name: asset.name,
      description: asset.description,
      bpm: asset.bpm,
      time_signature: asset.time_signature,
      measure_count: asset.measure_count,
      count_in_measures: asset.count_in_measures,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updateFantasyBgmAsset(id, editValues);
      toast.success('BGMを更新しました');
      setEditingId(null);
      setEditValues({});
      await load();
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'BGMの更新に失敗しました';
      toast.error(errorMessage);
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

        {/* テンポ設定セクション */}
        <div className="bg-slate-800/60 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-sm text-white">テンポ設定（任意）</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-300 mb-1">BPM</label>
              <input type="number" className="input input-bordered w-full text-white" placeholder="例: 120"
                     {...register('bpm', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">拍子</label>
              <input type="number" className="input input-bordered w-full text-white" placeholder="例: 4"
                     {...register('time_signature', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">小節数</label>
              <input type="number" className="input input-bordered w-full text-white" placeholder="例: 8"
                     {...register('measure_count', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">カウントイン小節数</label>
              <input type="number" className="input input-bordered w-full text-white" placeholder="例: 1"
                     {...register('count_in_measures', { valueAsNumber: true })} />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            BGMにテンポ情報を登録しておくと、ステージ設定時に自動入力されます
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">音声ファイル *</label>
          <input type="file" accept=".mp3,.wav,.ogg,.m4a,audio/*" className="file-input file-input-bordered w-full"
                 {...register('mp3File', { required: true })} />
          {watchedFile?.[0] && (
            <p className="text-xs text-gray-400 mt-1">{watchedFile[0].name} ({formatFileSize(watchedFile[0].size)})</p>
          )}
        </div>

        {/* 処理オプション */}
        <div className="bg-slate-800/60 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-sm text-white">処理オプション</h4>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              {...register('convertToMp3')}
            />
            <div>
              <span className="text-sm text-white">MP3に変換</span>
              <p className="text-xs text-gray-400">WAV/OGG等をMP3形式に変換してアップロード</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              {...register('addCountIn')}
            />
            <div>
              <span className="text-sm text-white">カウント追加</span>
              <p className="text-xs text-gray-400">曲の先頭に設定BPMでカウント音を追加</p>
            </div>
          </label>
          
          {watchedAddCountIn && (
            <div className="ml-8 flex items-center gap-2">
              <label className="text-xs text-gray-300">拍数:</label>
              <input
                type="number"
                min={1}
                max={16}
                className="input input-bordered input-xs w-20 text-white"
                {...register('countBeats', { valueAsNumber: true, min: 1, max: 16 })}
              />
              <span className="text-xs text-gray-400">拍</span>
            </div>
          )}
          
          {watchedAddCountIn && (!watchedBpm || watchedBpm <= 0) && (
            <p className="text-xs text-amber-400">
              ⚠️ カウント追加にはBPMの設定が必要です
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={uploading}>
          {uploading ? (
            <>
              <span className="loading loading-spinner loading-sm" /> {uploadProgress || 'アップロード中...'}
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
              <li key={a.id} className="p-3 space-y-2 hover:bg-slate-700/50 transition-colors">
                {editingId === a.id ? (
                  // 編集モード
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">名称</label>
                        <input
                          className="input input-bordered input-sm w-full text-white"
                          value={editValues.name || ''}
                          onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">説明</label>
                        <input
                          className="input input-bordered input-sm w-full text-white"
                          value={editValues.description || ''}
                          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">BPM</label>
                        <input
                          type="number"
                          className="input input-bordered input-sm w-full text-white"
                          value={editValues.bpm ?? ''}
                          onChange={(e) => setEditValues({ ...editValues, bpm: e.target.value ? Number(e.target.value) : null })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">拍子</label>
                        <input
                          type="number"
                          className="input input-bordered input-sm w-full text-white"
                          value={editValues.time_signature ?? ''}
                          onChange={(e) => setEditValues({ ...editValues, time_signature: e.target.value ? Number(e.target.value) : null })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">小節数</label>
                        <input
                          type="number"
                          className="input input-bordered input-sm w-full text-white"
                          value={editValues.measure_count ?? ''}
                          onChange={(e) => setEditValues({ ...editValues, measure_count: e.target.value ? Number(e.target.value) : null })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1">カウントイン小節数</label>
                        <input
                          type="number"
                          className="input input-bordered input-sm w-full text-white"
                          value={editValues.count_in_measures ?? ''}
                          onChange={(e) => setEditValues({ ...editValues, count_in_measures: e.target.value ? Number(e.target.value) : null })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-xs btn-primary" onClick={() => handleSaveEdit(a.id)}>保存</button>
                      <button className="btn btn-xs" onClick={handleCancelEdit}>キャンセル</button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{a.name}</p>
                      {a.description && <p className="text-xs text-gray-400 truncate">{a.description}</p>}
                      {/* テンポ情報表示 */}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {a.bpm && (
                          <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">
                            BPM: {a.bpm}
                          </span>
                        )}
                        {a.time_signature && (
                          <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded">
                            拍子: {a.time_signature}/4
                          </span>
                        )}
                        {a.measure_count && (
                          <span className="text-xs bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded">
                            小節: {a.measure_count}
                          </span>
                        )}
                        {a.count_in_measures && (
                          <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded">
                            カウントイン: {a.count_in_measures}
                          </span>
                        )}
                      </div>
                      {a.mp3_url && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded">MP3</span>
                          <button className="btn btn-xs" onClick={() => copyToClipboard(a.mp3_url)}>URLコピー</button>
                          <a className="btn btn-xs btn-outline" href={a.mp3_url} target="_blank" rel="noreferrer">開く</a>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-xs" onClick={() => handleStartEdit(a)}>編集</button>
                      <button className="btn btn-xs btn-error" onClick={async () => {
                        if (!confirm(`「${a.name}」を削除しますか？`)) return;
                        try {
                          await deleteFantasyBgmAsset(a.id);
                          toast.success('削除しました');
                          await load();
                        } catch (e: unknown) {
                          console.error(e);
                          toast.error('削除に失敗しました');
                        }
                      }}>削除</button>
                    </div>
                  </div>
                )}
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