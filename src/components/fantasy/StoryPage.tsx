import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { fetchFantasyClearedStageCounts } from '@/platform/supabaseFantasyStages';

const EPISODE_COUNT = 60 as const;

interface EpisodeItemProps {
  index: number;
  unlocked: boolean;
  active: boolean;
  requiredClears: number;
  onClick: (index: number) => void;
}

const EpisodeItem: React.FC<EpisodeItemProps> = ({ index, unlocked, active, requiredClears, onClick }) => {
  const handleClick = useCallback(() => {
    if (unlocked) onClick(index);
  }, [unlocked, index, onClick]);

  return (
    <button
      aria-label={`第${index}話${unlocked ? '' : '（ロック中）'}`}
      onClick={handleClick}
      disabled={!unlocked}
      className={
        [
          'w-full text-left px-3 py-2 rounded-md transition-colors',
          active ? 'bg-white/15 text-white' : 'bg-white/5 text-white/90 hover:bg-white/10',
          !unlocked ? 'opacity-50 cursor-not-allowed' : ''
        ].join(' ')
      }
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">第{index}話</div>
        {!unlocked && <span aria-hidden className="text-lg">🔒</span>}
      </div>
      <div className="text-xs opacity-60 mt-0.5">必要クリア数: {requiredClears}</div>
    </button>
  );
};

const StoryPage: React.FC = () => {
  const { profile, isGuest } = useAuthStore();
  const [selected, setSelected] = useState<number>(1);
  const [unlockedCount, setUnlockedCount] = useState<number>(1);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // 解放話数の計算: 第1話はデフォルト解放。合算クリア数が10の倍数に到達する度に+1
  useEffect(() => {
    let mounted = true;
    const loadClears = async () => {
      try {
        if (!profile || isGuest) {
          if (mounted) setUnlockedCount(1);
          return;
        }
        const counts = await fetchFantasyClearedStageCounts(profile.id);
        const total = counts?.total ?? 0;
        const episodes = Math.max(1, Math.min(EPISODE_COUNT, Math.floor(total / 10) + 1));
        if (mounted) setUnlockedCount(episodes);
      } catch {
        if (mounted) setUnlockedCount(1);
      }
    };
    loadClears();
    return () => { mounted = false; };
  }, [profile, isGuest]);

  const fetchEpisodeContent = useCallback(async (episodeIndex: number) => {
    setLoading(true);
    setError(null);
    try {
      const pad3 = (n: number) => n.toString().padStart(3, '0');
      const file = `/story/${pad3(episodeIndex)}.txt`;
      const res = await fetch(file, { cache: 'force-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setContent(text);
    } catch (e) {
      setError('本文の読み込みに失敗しました。しばらくしてから再度お試しください。');
      setContent('');
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回と選択変更時に本文を取得（ロック中は無視）
  useEffect(() => {
    if (selected <= unlockedCount) {
      fetchEpisodeContent(selected);
    }
  }, [selected, unlockedCount, fetchEpisodeContent]);

  // 最初に選択される話（解放済の範囲内で現在の選択をクランプ）
  useEffect(() => {
    setSelected((prev) => Math.min(prev, unlockedCount));
  }, [unlockedCount]);

  const episodeList = useMemo(() => Array.from({ length: EPISODE_COUNT }, (_, i) => i + 1), []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 text-white">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 p-4 sm:p-6 bg-gradient-to-b from-indigo-900/80 via-purple-900/80 to-pink-900/80 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">ストーリー</h1>
          <div className="flex items-center gap-2">
            {/* スマホ: メニュー切り替え */}
            <button
              className="sm:hidden px-3 py-2 bg-white/10 hover:bg-white/20 rounded-md"
              aria-label="エピソードメニューを開閉"
              onClick={() => setMenuOpen((m) => !m)}
            >
              エピソード
            </button>
            <button
              onClick={() => { window.location.hash = '#fantasy'; }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
            >
              戻る
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/80">物語が読めるモードです。</p>
      </div>

      {/* コンテンツ */}
      <div className="grid grid-cols-1 sm:grid-cols-[280px_minmax(0,1fr)] gap-4 sm:gap-6 p-4 sm:p-6">
        {/* 左メニュー（スマホではトグル表示） */}
        <aside className={[
          'sm:static sm:block',
          menuOpen ? 'block' : 'hidden',
          'sm:bg-transparent'
        ].join(' ')}>
          <div className="bg-black/20 sm:bg-black/10 rounded-lg p-3 sm:p-4 max-h-[50vh] sm:max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-2">
              {episodeList.map((ep) => {
                const unlocked = ep <= unlockedCount;
                const required = (ep - 1) * 10;
                return (
                  <EpisodeItem
                    key={ep}
                    index={ep}
                    unlocked={unlocked}
                    active={ep === selected}
                    requiredClears={required}
                    onClick={(i) => {
                      setSelected(i);
                      setMenuOpen(false);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </aside>

        {/* 本文 */}
        <main className="min-h-[60vh]">
          <div className="bg-black/20 rounded-lg p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-semibold">第{selected}話</h2>
              <div className="hidden sm:flex gap-2">
                <button
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-md disabled:opacity-50"
                  onClick={() => setSelected((s) => Math.max(1, s - 1))}
                  disabled={selected <= 1}
                >
                  前へ
                </button>
                <button
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-md disabled:opacity-50"
                  onClick={() => setSelected((s) => Math.min(EPISODE_COUNT, s + 1))}
                  disabled={selected >= EPISODE_COUNT}
                >
                  次へ
                </button>
              </div>
            </div>

            {selected > unlockedCount && (
              <div className="text-sm text-yellow-200 mb-3">この話を読むには、合計クリア数が{(selected - 1) * 10}に達している必要があります。</div>
            )}

            {loading ? (
              <div className="text-center py-10">読み込み中...</div>
            ) : error ? (
              <div className="text-red-300 text-sm">{error}</div>
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base text-white/95">
                {content}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StoryPage;


