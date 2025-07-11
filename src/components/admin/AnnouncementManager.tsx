import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Announcement,
  CreateAnnouncementData,
  fetchAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
  updateAnnouncementPriority,
} from '@/platform/supabaseAnnouncements';
import { useToast, handleApiError } from '@/stores/toastStore';
import { 
  FaEye, 
  FaEyeSlash, 
  FaEdit, 
  FaTrash, 
  FaArrowUp, 
  FaArrowDown,
  FaExternalLinkAlt,
  FaPlus 
} from 'react-icons/fa';

const AnnouncementManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors },
    setValue 
  } = useForm<CreateAnnouncementData>();
  
  const toast = useToast();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await fetchAllAnnouncements();
      setAnnouncements(data);
    } catch (e: any) {
      toast.error(handleApiError(e, 'お知らせ読み込み'));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreateAnnouncementData) => {
    try {
      if (editingId) {
        await updateAnnouncement(editingId, data);
        toast.success('お知らせを更新しました', {
          title: '更新完了',
          duration: 3000,
        });
        setEditingId(null);
      } else {
        await createAnnouncement(data);
        toast.success('お知らせを作成しました', {
          title: '作成完了', 
          duration: 3000,
        });
      }
      
      reset();
      setShowForm(false);
      await loadAnnouncements();
    } catch (e: any) {
      toast.error(handleApiError(e, editingId ? 'お知らせ更新' : 'お知らせ作成'), {
        title: editingId ? '更新エラー' : '作成エラー',
      });
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setValue('title', announcement.title);
    setValue('content', announcement.content);
    setValue('link_url', announcement.link_url || '');
    setValue('link_text', announcement.link_text || '');
    setValue('is_active', announcement.is_active);
    setValue('priority', announcement.priority);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このお知らせを削除しますか？')) return;
    
    try {
      await deleteAnnouncement(id);
      toast.success('お知らせを削除しました', {
        title: '削除完了',
        duration: 2000,
      });
      await loadAnnouncements();
    } catch (e: any) {
      toast.error(handleApiError(e, 'お知らせ削除'), {
        title: '削除エラー',
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleAnnouncementStatus(id, !currentStatus);
      toast.success(`お知らせを${!currentStatus ? '公開' : '非公開'}しました`, {
        duration: 2000,
      });
      await loadAnnouncements();
    } catch (e: any) {
      toast.error(handleApiError(e, '状態変更'));
    }
  };

  const handleChangePriority = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = announcements.findIndex(a => a.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= announcements.length) return;
    
    try {
      const targetAnnouncement = announcements[newIndex];
      await updateAnnouncementPriority(id, targetAnnouncement.priority);
      await updateAnnouncementPriority(targetAnnouncement.id, announcements[currentIndex].priority);
      
      toast.success('表示順を変更しました', { duration: 2000 });
      await loadAnnouncements();
    } catch (e: any) {
      toast.error(handleApiError(e, '表示順変更'));
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    reset();
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">お知らせ管理</h3>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-sm btn-primary flex items-center space-x-2"
        >
          <FaPlus />
          <span>新規作成</span>
        </button>
      </div>

      {/* お知らせ作成・編集フォーム */}
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
          <h4 className="text-lg font-semibold mb-4">
            {editingId ? 'お知らせ編集' : 'お知らせ作成'}
          </h4>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">タイトル *</label>
              <input
                {...register('title', { 
                  required: 'タイトルは必須です',
                  maxLength: { value: 100, message: '100文字以内' }
                })}
                className="input input-bordered w-full text-white"
                placeholder="お知らせのタイトルを入力"
              />
              {errors.title && (
                <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">内容 *</label>
              <textarea
                {...register('content', { 
                  required: '内容は必須です',
                  maxLength: { value: 1000, message: '1000文字以内' }
                })}
                className="textarea textarea-bordered w-full text-white"
                rows={4}
                placeholder="お知らせの内容を入力"
              />
              {errors.content && (
                <p className="text-red-400 text-xs mt-1">{errors.content.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">リンクURL</label>
                <input
                  {...register('link_url')}
                  type="url"
                  className="input input-bordered w-full text-white"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">リンクテキスト</label>
                <input
                  {...register('link_text')}
                  className="input input-bordered w-full text-white"
                  placeholder="詳細はこちら"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">優先度</label>
                <input
                  {...register('priority', { 
                    valueAsNumber: true,
                    min: { value: 1, message: '優先度は1以上を入力してください' }
                  })}
                  type="number"
                  min="1"
                  className="input input-bordered w-full text-white"
                  placeholder="1"
                />
                <p className="text-xs text-gray-400 mt-1">小さいほど上位表示</p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    {...register('is_active')}
                    type="checkbox"
                    className="checkbox"
                    defaultChecked
                  />
                  <span>公開する</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelEdit}
                className="btn btn-sm btn-outline"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary"
              >
                {editingId ? '更新' : '作成'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* お知らせ一覧 */}
      <div className="bg-slate-800 rounded-lg border border-slate-600">
        <div className="p-4 border-b border-slate-700">
          <h4 className="font-semibold">お知らせ一覧</h4>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">読み込み中...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400">お知らせがありません</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {announcements.map((announcement, index) => (
              <div key={announcement.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h5 className="font-medium truncate max-w-xs md:max-w-md">{announcement.title}</h5>
                      <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                        announcement.is_active 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {announcement.is_active ? '公開中' : '非公開'}
                      </span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        優先度: {announcement.priority}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-2 line-clamp-2 break-all">
                      {announcement.content}
                    </p>
                    
                    {announcement.link_url && (
                      <div className="flex items-center space-x-1 text-xs text-blue-400">
                        <FaExternalLinkAlt />
                        <span className="truncate max-w-xs">{announcement.link_text || 'リンク'}</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      作成: {new Date(announcement.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 justify-end">
                    {/* 表示順変更 */}
                    <button
                      onClick={() => handleChangePriority(announcement.id, 'up')}
                      disabled={index === 0}
                      className="btn btn-xs btn-outline disabled:opacity-50"
                      title="上に移動"
                    >
                      <FaArrowUp />
                    </button>
                    <button
                      onClick={() => handleChangePriority(announcement.id, 'down')}
                      disabled={index === announcements.length - 1}
                      className="btn btn-xs btn-outline disabled:opacity-50"
                      title="下に移動"
                    >
                      <FaArrowDown />
                    </button>

                    {/* 公開状態切り替え */}
                    <button
                      onClick={() => handleToggleStatus(announcement.id, announcement.is_active)}
                      className={`btn btn-xs ${
                        announcement.is_active ? 'btn-warning' : 'btn-success'
                      }`}
                      title={announcement.is_active ? '非公開にする' : '公開する'}
                    >
                      {announcement.is_active ? <FaEyeSlash /> : <FaEye />}
                    </button>

                    {/* 編集 */}
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="btn btn-xs btn-primary"
                      title="編集"
                    >
                      <FaEdit />
                    </button>

                    {/* 削除 */}
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="btn btn-xs btn-error"
                      title="削除"
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

export default AnnouncementManager; 