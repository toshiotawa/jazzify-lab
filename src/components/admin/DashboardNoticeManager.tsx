import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  createDashboardNotice,
  deleteDashboardNotice,
  fetchAllDashboardNotices,
  toggleDashboardNoticePublished,
  updateDashboardNotice,
  DASHBOARD_NOTICE_TAB_TARGETS,
  type CreateDashboardNoticeData,
  type DashboardNotice,
} from '@/platform/supabaseDashboardNotices';
import { useToast, handleApiError } from '@/stores/toastStore';
import { FaEdit, FaEye, FaEyeSlash, FaPlus, FaTrash } from 'react-icons/fa';
import {
  isAllowedDashboardNoticeExternalUrl,
  isDashboardNoticeTabTarget,
} from '@/utils/dashboardNoticeNavigation';

type FormValues = CreateDashboardNoticeData;

const DashboardNoticeManager: React.FC = () => {
  const [notices, setNotices] = useState<DashboardNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      platform: 'web',
      locale: 'ja',
      action_kind: 'tab',
      action_target: 'account',
      is_published: false,
      sort_order: 0,
    },
  });

  const actionKind = watch('action_kind');

  useEffect(() => {
    void loadNotices();
  }, []);

  const loadNotices = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await fetchAllDashboardNotices();
      setNotices(data);
    } catch (error) {
      toast.error(handleApiError(error, 'ダッシュボード案内の読み込み'));
    } finally {
      setLoading(false);
    }
  };

  const validateActionTarget = (target: string, kind: FormValues['action_kind']): boolean => {
    if (kind === 'external') {
      return isAllowedDashboardNoticeExternalUrl(target);
    }
    return isDashboardNoticeTabTarget(target);
  };

  const onSubmit = async (values: FormValues): Promise<void> => {
    if (!validateActionTarget(values.action_target, values.action_kind)) {
      toast.error('遷移先が不正です（外部は https://、タブは定義済みキー）');
      return;
    }
    try {
      if (editingId) {
        await updateDashboardNotice(editingId, values);
        toast.success('更新しました');
      } else {
        await createDashboardNotice(values);
        toast.success('作成しました');
      }
      cancelEdit();
      await loadNotices();
    } catch (error) {
      toast.error(handleApiError(error, 'ダッシュボード案内の保存'));
    }
  };

  const cancelEdit = (): void => {
    setEditingId(null);
    setShowForm(false);
    reset({
      platform: 'web',
      locale: 'ja',
      title: '',
      body: '',
      action_label: '',
      action_kind: 'tab',
      action_target: 'account',
      is_published: false,
      sort_order: 0,
    });
  };

  const startEdit = (notice: DashboardNotice): void => {
    setEditingId(notice.id);
    setShowForm(true);
    reset({
      platform: notice.platform,
      locale: notice.locale,
      title: notice.title,
      body: notice.body,
      action_label: notice.action_label,
      action_kind: notice.action_kind,
      action_target: notice.action_target,
      is_published: notice.is_published,
      sort_order: notice.sort_order,
    });
  };

  const handleTogglePublished = async (id: string, current: boolean): Promise<void> => {
    try {
      await toggleDashboardNoticePublished(id, !current);
      await loadNotices();
    } catch (error) {
      toast.error(handleApiError(error, '公開状態の更新'));
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!window.confirm('この案内を削除しますか？')) return;
    try {
      await deleteDashboardNotice(id);
      toast.success('削除しました');
      await loadNotices();
    } catch (error) {
      toast.error(handleApiError(error, 'ダッシュボード案内の削除'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">ダッシュボード案内</h3>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            reset({
              platform: 'web',
              locale: 'ja',
              title: '',
              body: '',
              action_label: '',
              action_kind: 'tab',
              action_target: 'account',
              is_published: false,
              sort_order: 0,
            });
          }}
        >
          <FaPlus className="mr-1" />
          新規作成
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-800 rounded-lg border border-slate-600 p-6">
          <h4 className="font-semibold mb-4">{editingId ? '編集' : '新規作成'}</h4>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">プラットフォーム</label>
                <select {...register('platform', { required: true })} className="select select-bordered w-full text-white">
                  <option value="web">WEB</option>
                  <option value="ios">iOS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">言語</label>
                <select {...register('locale', { required: true })} className="select select-bordered w-full text-white">
                  <option value="ja">日本語 (ja)</option>
                  <option value="en">英語 (en)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">見出し</label>
              <input
                {...register('title', { required: '必須', maxLength: 120 })}
                className="input input-bordered w-full text-white"
              />
              {errors.title ? <p className="text-xs text-red-400 mt-1">{errors.title.message}</p> : null}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">本文</label>
              <textarea
                {...register('body', { required: '必須', maxLength: 500 })}
                rows={3}
                className="textarea textarea-bordered w-full text-white"
              />
              {errors.body ? <p className="text-xs text-red-400 mt-1">{errors.body.message}</p> : null}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ボタン文言</label>
              <input
                {...register('action_label', { required: '必須', maxLength: 80 })}
                className="input input-bordered w-full text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">遷移種別</label>
                <select
                  {...register('action_kind', { required: true })}
                  className="select select-bordered w-full text-white"
                  onChange={(event) => {
                    const kind = event.target.value as FormValues['action_kind'];
                    setValue('action_kind', kind);
                    setValue('action_target', kind === 'tab' ? 'account' : 'https://');
                  }}
                >
                  <option value="tab">アプリ内タブ</option>
                  <option value="external">外部リンク</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">遷移先</label>
                {actionKind === 'tab' ? (
                  <select {...register('action_target', { required: true })} className="select select-bordered w-full text-white">
                    {DASHBOARD_NOTICE_TAB_TARGETS.map((target) => (
                      <option key={target} value={target}>
                        {target}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...register('action_target', { required: true })}
                    className="input input-bordered w-full text-white"
                    placeholder="https://..."
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">表示順 (sort_order)</label>
              <input
                {...register('sort_order', { valueAsNumber: true })}
                type="number"
                className="input input-bordered w-full text-white"
              />
              <p className="text-xs text-gray-400 mt-1">小さいほど優先。同 platform×locale では先頭1件のみ表示。</p>
            </div>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input {...register('is_published')} type="checkbox" className="checkbox" />
              <span>公開する</span>
            </label>

            <div className="flex justify-end space-x-3">
              <button type="button" className="btn btn-sm btn-outline" onClick={cancelEdit}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                {editingId ? '更新' : '作成'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg border border-slate-600">
        <div className="p-4 border-b border-slate-700">
          <h4 className="font-semibold">一覧</h4>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">読み込み中...</div>
        ) : notices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">案内がありません</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {notices.map((notice) => (
              <div key={notice.id} className="p-4 hover:bg-slate-700/50">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h5 className="font-medium">{notice.title}</h5>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700">{notice.platform}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700">{notice.locale}</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          notice.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {notice.is_published ? '公開中' : '非公開'}
                      </span>
                      <span className="text-xs text-gray-400">sort: {notice.sort_order}</span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{notice.body}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {notice.action_kind} → {notice.action_target} ({notice.action_label})
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    <button
                      type="button"
                      className="btn btn-xs btn-outline"
                      onClick={() => void handleTogglePublished(notice.id, notice.is_published)}
                      title={notice.is_published ? '非公開にする' : '公開する'}
                    >
                      {notice.is_published ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <button type="button" className="btn btn-xs btn-outline" onClick={() => startEdit(notice)}>
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline btn-error"
                      onClick={() => void handleDelete(notice.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardNoticeManager;
