import React, { useState, useEffect } from 'react';
import { fetchSongs } from '@/platform/supabaseSongs';
import { useToast } from '@/stores/toastStore';

interface Song {
  id: string;
  title: string;
  artist?: string;
  usage_type?: string;
}

interface SongSelectorProps {
  onSelect: (songId: string) => void;
  excludeSongIds?: string[];
  placeholder?: string;
}

const SongSelector: React.FC<SongSelectorProps> = ({ 
  onSelect, 
  excludeSongIds = [], 
  placeholder = "楽曲を選択..." 
}) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'general' | 'lesson'>('all');
  const toast = useToast();

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        const allSongs = await fetchSongs();
        setSongs(allSongs);
      } catch (error) {
        // console.error('楽曲読み込みエラー:', error);
        toast.error('楽曲の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadSongs();
  }, [toast]);

  // フィルタリングとソート
  const filteredSongs = songs
    .filter(song => {
      // 除外リストに含まれていない
      if (excludeSongIds.includes(song.id)) return false;
      
      // タイプフィルター
      if (selectedType === 'general' && song.usage_type !== 'general') return false;
      if (selectedType === 'lesson' && song.usage_type !== 'lesson') return false;
      
      // 検索フィルター
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          song.title.toLowerCase().includes(term) ||
          (song.artist && song.artist.toLowerCase().includes(term))
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // アーティスト順 → タイトル順
      const artistA = a.artist || '';
      const artistB = b.artist || '';
      const artistCompare = artistA.localeCompare(artistB);
      if (artistCompare !== 0) return artistCompare;
      return a.title.localeCompare(b.title);
    });

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'general': return '通常曲';
      case 'lesson': return 'レッスン曲';
      default: return 'その他';
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-400 mx-auto"></div>
        <p className="text-sm text-gray-400 mt-2">楽曲を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 検索とフィルター */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="楽曲名またはアーティスト名で検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered w-full text-white bg-slate-700 border-slate-600"
        />
        
        <div className="flex gap-2">
          <button
            className={`btn btn-xs ${selectedType === 'all' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSelectedType('all')}
          >
            すべて
          </button>
          <button
            className={`btn btn-xs ${selectedType === 'general' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSelectedType('general')}
          >
            通常曲
          </button>
          <button
            className={`btn btn-xs ${selectedType === 'lesson' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSelectedType('lesson')}
          >
            レッスン曲
          </button>
        </div>
      </div>

      {/* 楽曲リスト */}
      <div className="max-h-60 overflow-y-auto border border-slate-600 rounded-lg">
        {filteredSongs.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            {searchTerm ? '検索条件に一致する楽曲がありません' : '楽曲がありません'}
          </div>
        ) : (
          <div className="divide-y divide-slate-600">
            {filteredSongs.map(song => (
              <button
                key={song.id}
                onClick={() => onSelect(song.id)}
                className="w-full p-3 text-left hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{song.title}</div>
                    <div className="text-sm text-gray-400 truncate">
                      {song.artist || '不明'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <span className="badge badge-xs badge-outline">
                      {getTypeLabel(song.usage_type)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400 text-center">
        {filteredSongs.length} 曲中から選択
      </div>
    </div>
  );
};

export default SongSelector; 