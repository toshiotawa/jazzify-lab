import React, { useState, useEffect } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import GameEngineComponent from './GameEngine';
import ControlBar from './ControlBar';
import { MidiDeviceSelector } from '@/components/ui/MidiDeviceManager';
import ResultModal from './ResultModal';
import SheetMusicDisplay from './SheetMusicDisplay';
import ResizeHandle from '@/components/ui/ResizeHandle';
import { getTransposingInstrumentName } from '@/utils/musicXmlTransposer';
import type { TransposingInstrument } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { fetchSongs, MembershipRank, rankAllowed } from '@/platform/supabaseSongs';
import { getChallengeSongs } from '@/platform/supabaseChallenges';
import { FaArrowLeft, FaAward, FaMusic } from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';

/**
 * メインゲーム画面コンポーネント
 * ゲームのメインUI要素を統合
 */
const GameScreen: React.FC = () => {
  const { currentTab, currentSong, score, isSettingsOpen, settings } = useGameSelector((s) => ({
    currentTab: s.currentTab,
    currentSong: s.currentSong,
    score: s.score,
    isSettingsOpen: s.isSettingsOpen,
    settings: s.settings
  }));

  const gameActions = useGameActions();
  
  // レッスン曲読み込み中の状態管理を追加
  const [isLoadingLessonSong, setIsLoadingLessonSong] = useState(false);

  // レッスン曲とミッション曲の自動読み込み処理を追加
  useEffect(() => {
      const handleLessonPlay = async (hash: string) => {
      setIsLoadingLessonSong(true);
      
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const songId = params.get('id');
      const lessonId = params.get('lessonId');
      const key = parseInt(params.get('key') || '0');
      const speed = parseFloat(params.get('speed') || '1.0');
      const rank = params.get('rank') || 'B';
      const count = parseInt(params.get('count') || '1');
      const notation = params.get('notation') || 'both';
      const requiresDays = params.get('requiresDays') === 'true';
      const dailyCount = parseInt(params.get('dailyCount') || '1');
      
      // 権限制御: Standard(Global)はレッスン/曲プレイ不可
      if (useAuthStore.getState().profile?.rank === 'standard_global') {
        console.warn('Standard(Global)は#play-lesson非対応のためダッシュボードへ');
        setIsLoadingLessonSong(false);
        window.location.hash = '#dashboard';
        return;
      }
      
      if (songId) {
        try {
          // 曲データを取得（レッスン曲は通常曲も使用できるため、すべての曲から検索）
          const songs = await fetchSongs(); // すべての曲を取得
          const song = songs.find(s => s.id === songId);
          
          if (!song) {
            console.error('曲が見つかりません:', songId);
            // エラー時は曲選択画面に戻る
            setIsLoadingLessonSong(false);
            window.location.hash = '#songs';
            return;
          }
          
          // JSONデータの取得
          let notesData: any;
          if (song.json_url) {
            const response = await fetch(song.json_url);
            if (!response.ok) {
              throw new Error(`JSONデータの読み込みに失敗: ${response.status} ${response.statusText}`);
            }
            
            // レスポンスの内容をチェック
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              console.warn('⚠️ JSONでないコンテンツタイプ:', contentType);
            }
            
            const responseText = await response.text();
            
            // HTMLが返されている場合の検出
            if (responseText.trim().startsWith('<')) {
              throw new Error('JSONデータの代わりにHTMLが返されました。ファイルパスまたはサーバー設定を確認してください。');
            }
            
            try {
              notesData = JSON.parse(responseText);
            } catch (parseError) {
              console.error('JSON解析エラー:', parseError);
              console.error('レスポンス内容の先頭100文字:', responseText.substring(0, 100));
              throw new Error(`JSONデータの解析に失敗しました: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
            }
          } else if (song.json_data) {
            notesData = song.json_data;
          } else {
            throw new Error('曲のノーツデータがありません');
          }
          
          // notes配列の抽出
          const notes = Array.isArray(notesData) ? notesData : notesData.notes;
          if (!notes || !Array.isArray(notes)) {
            throw new Error('ノーツデータの形式が不正です');
          }
          
          const mapped = notes.map((n: any, idx: number) => ({ 
            id: `${song.id}-${idx}`, 
            time: n.time, 
            pitch: n.pitch 
          }));
          
          // 音声ファイルの長さを取得
          let duration = 60; // デフォルト値
          if (song.audio_url) {
            try {
              const audio = new Audio(song.audio_url);
              audio.crossOrigin = 'anonymous';
              await new Promise((resolve) => {
                const loadedHandler = () => {
                  duration = Math.floor(audio.duration) || 60;
                  resolve(void 0);
                };
                const errorHandler = () => {
                  console.warn('音声ファイルの読み込みに失敗、デフォルト時間を使用');
                  resolve(void 0);
                };
                
                audio.addEventListener('loadedmetadata', loadedHandler);
                audio.addEventListener('error', errorHandler);
                
                // タイムアウト処理
                setTimeout(() => resolve(void 0), 5000);
              });
            } catch (e) {
              console.warn('音声ファイル時間取得エラー:', e);
            }
          }
          
          // 事前にミッションコンテキストをクリア
          gameActions.clearMissionContext();

          // レッスンコンテキストを設定
          if (lessonId) {
            gameActions.setLessonContext(lessonId, {
              key,
              speed,
              rank,
              count,
              notation_setting: notation,
              requires_days: requiresDays,
              daily_count: dailyCount
            });
          }
          
          // レッスン設定を先に適用（loadSongの前に実行）
          // 明示的リセット: 前の曲の再生・状態を完全停止/初期化
          gameActions.stop();
          gameActions.clearSong();
          
          await gameActions.updateSettings({
            transpose: key,
            playbackSpeed: speed,
            // notation設定に基づいて表示設定を更新
            showSheetMusic: notation === 'notes_chords' || notation === 'both' || notation === 'chords_only',
            sheetMusicChordsOnly: notation === 'chords_only'
          });
          
          // 曲をロード（設定適用後に実行）
          await gameActions.loadSong({
            id: song.id,
            title: song.title,
            artist: song.artist || '',
            duration: duration,
            audioFile: song.audio_url || '',
            musicXmlFile: song.xml_url || null
          }, mapped);
          
          // 曲のロード完了後に画面遷移を行う
          // 先にタブを切り替えてから、ハッシュを変更することで一瞬の曲選択画面表示を防ぐ
          gameActions.setCurrentTab('practice');
          
          // 読み込み完了
          setIsLoadingLessonSong(false);
          
          // 少し遅延させてからハッシュを変更（画面更新の完了を待つ）
          setTimeout(() => {
            window.location.hash = '#practice';
          }, 10);
          
        } catch (error) {
          console.error('レッスン曲の読み込みエラー:', error);
          
          // エラーの詳細情報をログ出力
          if (error instanceof Error) {
            console.error('エラーメッセージ:', error.message);
            console.error('エラースタック:', error.stack);
          }
          
          // ユーザーにエラーを通知（簡素なアラート）
          let userMessage = '楽曲の読み込みに失敗しました。';
          if (error instanceof Error) {
            if (error.message.includes('HTMLが返されました')) {
              userMessage = 'ファイルが見つかりません。曲データの設定を確認してください。';
            } else if (error.message.includes('JSON') || error.message.includes('Unexpected token')) {
              userMessage = '楽曲ファイルの形式が正しくありません。';
            }
          }
          
          // 非同期でアラートを表示（UIブロックを避ける）
          setTimeout(() => {
            alert(userMessage);
          }, 100);
          
          setIsLoadingLessonSong(false);
          window.location.hash = '#songs';
        }
      } else {
        console.warn('⚠️ songIdが不足:', { songId });
        setIsLoadingLessonSong(false);
      }
    };

      const handleMissionPlay = async (hash: string) => {
      setIsLoadingLessonSong(true);
      
      // 権限制御: Standard(Global)はミッションプレイ不可
      if (useAuthStore.getState().profile?.rank === 'standard_global') {
        console.warn('Standard(Global)は#play-mission非対応のためミッション一覧→ダッシュボードへ');
        setIsLoadingLessonSong(false);
        window.location.hash = '#dashboard';
        return;
      }
      
      // '#play-mission?...' から '?' 以降をパース
      const [, query] = hash.split('?');
      const params = new URLSearchParams(query);
      const songId = params.get('song');
      const missionId = params.get('mission');
      
      if (songId && missionId) {
        try {
          // ミッション曲の条件をデータベースから取得
          const challengeSongs = await getChallengeSongs(missionId);
          const challengeSong = challengeSongs.find(cs => cs.song_id === songId);
          if (!challengeSong) {
            console.error('❌ ミッション曲が見つかりません:', { 
              songId, 
              missionId,
              availableSongs: challengeSongs.map(cs => cs.song_id)
            });
            setIsLoadingLessonSong(false);
            // ミッション一覧に戻る
            setTimeout(() => {
              window.location.hash = '#missions';
            }, 100);
            return;
          }
          
            // 曲データを取得
          const songs = await fetchSongs();
          const song = songs.find(s => s.id === songId);
          
          if (!song) {
            console.error('❌ 曲が見つかりません:', {
              songId,
              availableSongs: songs.map(s => ({ id: s.id, title: s.title }))
            });
            setIsLoadingLessonSong(false);
            // ミッション一覧に戻る
            setTimeout(() => {
              window.location.hash = '#missions';
            }, 100);
            return;
          }
          
          // JSONデータの取得
          let notesData: any;
          if (song.json_url) {
            const response = await fetch(song.json_url);
            if (!response.ok) {
              throw new Error(`JSONデータの読み込みに失敗: ${response.status} ${response.statusText}`);
            }
            
            const responseText = await response.text();
            
            if (responseText.trim().startsWith('<')) {
              throw new Error('JSONデータの代わりにHTMLが返されました。');
            }
            
            notesData = JSON.parse(responseText);
          } else if (song.json_data) {
            notesData = song.json_data;
          } else {
            throw new Error('曲のノーツデータがありません');
          }
          
          // notes配列の抽出
          const notes = Array.isArray(notesData) ? notesData : notesData.notes;
          if (!notes || !Array.isArray(notes)) {
            throw new Error('ノーツデータの形式が不正です');
          }
          
          const mapped = notes.map((n: any, idx: number) => ({ 
            id: `${song.id}-${idx}`, 
            time: n.time, 
            pitch: n.pitch 
          }));
          
          // 音声ファイルの長さを取得
          let duration = 60;
          if (song.audio_url) {
            try {
              const audio = new Audio(song.audio_url);
              audio.crossOrigin = 'anonymous';
              await new Promise((resolve) => {
                const loadedHandler = () => {
                  duration = Math.floor(audio.duration) || 60;
                  resolve(void 0);
                };
                const errorHandler = () => {
                  console.warn('音声ファイルの読み込みに失敗、デフォルト時間を使用');
                  resolve(void 0);
                };
                
                audio.addEventListener('loadedmetadata', loadedHandler);
                audio.addEventListener('error', errorHandler);
                setTimeout(() => resolve(void 0), 5000);
              });
            } catch (e) {
              console.warn('音声ファイル時間取得エラー:', e);
            }
          }
          
          // 事前にレッスンコンテキストをクリア
          gameActions.clearLessonContext();

          // ミッションコンテキストを設定
          gameActions.setMissionContext(missionId, songId, {
            key: challengeSong.key_offset,
            speed: challengeSong.min_speed,
            rank: challengeSong.min_rank,
            count: challengeSong.clears_required,
            notation_setting: challengeSong.notation_setting
          });
          
          // ミッション曲の条件を先に設定に適用（loadSongの前に実行）
          // 明示的リセット: 前の曲の再生・状態を完全停止/初期化
          gameActions.stop();
          gameActions.clearSong();
          
          await gameActions.updateSettings({
            transpose: challengeSong.key_offset,
            playbackSpeed: challengeSong.min_speed,
            // notation設定に基づいて表示設定を更新
            showSheetMusic: challengeSong.notation_setting === 'notes_chords' || challengeSong.notation_setting === 'both' || challengeSong.notation_setting === 'chords_only',
            sheetMusicChordsOnly: challengeSong.notation_setting === 'chords_only'
          });
          
            // 曲をロード（設定適用後に実行）
          await gameActions.loadSong({
            id: song.id,
            title: song.title,
            artist: song.artist || '',
            duration: duration,
            audioFile: song.audio_url || '',
            musicXmlFile: song.xml_url || null
          }, mapped);
          
          // 画面遷移
          gameActions.setCurrentTab('practice');
          setIsLoadingLessonSong(false);
          setTimeout(() => {
            window.location.hash = '#practice';
          }, 10);
          
        } catch (error) {
          console.error('❌ ミッション曲の読み込みエラー:', {
            error,
            songId,
            missionId,
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          });
          setIsLoadingLessonSong(false);
          // エラー時はミッション一覧に戻る
          setTimeout(() => {
            window.location.hash = '#missions';
          }, 100);
        }
      } else {
        console.warn('⚠️ songIdまたはmissionIdが不足:', { songId, missionId });
        setIsLoadingLessonSong(false);
      }
    };

    const checkLessonPlay = async () => {
      const hash = window.location.hash;
      
      if (hash.startsWith('#play-lesson')) {
        await handleLessonPlay(hash);
        return;
      }
      
      if (hash.startsWith('#play-mission')) {
        await handleMissionPlay(hash);
        return;
      }
      
      setIsLoadingLessonSong(false);
    };
    
    checkLessonPlay();
    
    // ハッシュ変更を監視
    const handleHashChange = () => {
      checkLessonPlay();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [gameActions]);

  // 🔧 自動リダイレクト: 曲が未選択で、今タブが songs 以外なら自動で songs タブへ
  // ただし、レッスン曲読み込み中（#play-lesson）またはミッション曲読み込み中（#play-mission）は除外
  useEffect(() => {
    const isPlayLessonHash = window.location.hash.startsWith('#play-lesson') || window.location.hash.startsWith('#play-mission');
    
    // レッスン曲・ミッション曲読み込み中は曲選択画面へのリダイレクトをスキップ
    const isStandardGlobal = useAuthStore.getState().profile?.rank === 'standard_global';
    if (!currentSong && currentTab !== 'songs' && !isPlayLessonHash && !isLoadingLessonSong) {
      if (isStandardGlobal) {
        // 権限制御: standard_global は曲選択タブへ飛ばさない
        return;
      }
      gameActions.setCurrentTab('songs');
    }
  }, [currentSong, currentTab, gameActions, isLoadingLessonSong]);

  // レッスン曲読み込み中はローディング表示のみを返す
  if (isLoadingLessonSong) {
    return (
      <div className="w-full h-screen bg-gradient-game text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-gray-300">レッスン曲を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="game-container h-[100dvh] flex flex-col bg-gradient-game"
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        overscrollBehavior: 'none'
      }}
    >
            {/* ヘッダー */}
      {settings.showHeader && (
        <GameHeader />
      )}

      {/* メインコンテンツエリア */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        {currentTab === 'songs' ? (
          <SongSelectionScreen />
        ) : (
          <GamePlayScreen />
        )}
      </main>

      {isSettingsOpen && <SettingsPanel />}

      <ResultModal />
    </div>
  );
};

/**
 * タブボタンコンポーネント
 */
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className={`tab-xs ${active ? 'tab-active' : 'tab-inactive'}`}
    >
      {children}
    </button>
  );
};

interface HashButtonProps { hash: string; children: React.ReactNode; }
const HashButton: React.FC<HashButtonProps> = ({ hash, children }) => {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handler = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const active = currentHash === hash;

  return (
    <button
      onClick={() => {
        window.location.hash = hash;
      }}
      className={`tab-xs ${active ? 'tab-active' : 'tab-inactive'}`}
    >
      {children}
    </button>
  );
};

/**
 * 楽曲選択画面
 */
const SongSelectionScreen: React.FC = () => {
  const gameActions = useGameActions();
  const { profile, user } = useAuthStore();
  const [dbSongs, setDbSongs] = React.useState<any[]>([]);
  const [songStats, setSongStats] = React.useState<Record<string, {clear_count: number; b_rank_plus_count?: number; best_score?: number; best_rank?: string}>>({});
  const [lockedSong, setLockedSong] = React.useState<{title:string;min_rank:string}|null>(null);
  const [sortBy, setSortBy] = React.useState<'artist' | 'title'>('artist');
  const [searchTerm, setSearchTerm] = React.useState('');
  
  React.useEffect(() => {
    (async () => {
      try {
        const allSongs = await fetchSongs('general');
        setDbSongs(allSongs);
        
        // ユーザー統計を取得
      if (user) {
        const { fetchUserSongStatsMap } = await import('@/platform/unifiedSongProgress');
        const statsMap = await fetchUserSongStatsMap(user.id);
        setSongStats(statsMap);
      }
      } catch (e) {
        console.error('🔍 [DEBUG] 曲一覧取得失敗', e);
        console.error('🔍 [DEBUG] Error details:', {
          message: e instanceof Error ? e.message : 'Unknown error',
          stack: e instanceof Error ? e.stack : undefined,
          user: user ? { id: user.id, email: user.email } : null
        });
      }
    })();
  }, [profile, user]);

  // 楽曲ソート機能
  const sortedSongs = React.useMemo(() => {
    let sorted = [...dbSongs];
    
    // 検索フィルタ
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      sorted = sorted.filter(song => (
        (song.title || '').toLowerCase().includes(term) ||
        (song.artist || '').toLowerCase().includes(term)
      ));
    }
    
    // ソート
    sorted.sort((a, b) => {
      if (sortBy === 'artist') {
        // アーティスト順 → タイトル順
        const artistCompare = (a.artist || '').localeCompare(b.artist || '');
        if (artistCompare !== 0) return artistCompare;
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });
    
    return sorted;
  }, [dbSongs, sortBy, searchTerm]);

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">レジェンドモード</h2>
          <div className="text-sm text-gray-400">
            {sortedSongs.length} 曲
          </div>
        </div>


        <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center space-x-2 mb-1">
            <FaMusic className="text-green-400" />
            <h3 className="text-sm font-semibold">楽曲を選んで練習しましょう</h3>
          </div>
          <p className="text-gray-300 text-xs sm:text-sm">
            ソートや検索で楽曲を絞り込み、選択すると練習画面に移動します。自分のペースで練習を進めましょう。
          </p>
        </div>
        
        {/* フィルター コントロール */}

        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center space-x-2 whitespace-nowrap">
            <label className="text-sm text-gray-300">ソート:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'artist' | 'title')}
              className="select select-sm bg-slate-700 text-white border-slate-600"
            >
              <option value="artist">アーティスト順</option>
              <option value="title">タイトル順</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
            <label className="text-sm text-gray-300">検索:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="曲名・アーティストで検索"
              className="input input-sm bg-slate-700 text-white border-slate-600 w-full"
            />
          </div>
        </div>
        
        {/* 楽曲リスト - 軽量化されたレイアウト */}
        <div className="space-y-2">
          {sortedSongs.map((song) => {
            const accessible = rankAllowed((profile?.rank ?? 'free') as MembershipRank, song.min_rank as MembershipRank);
            const songStat = songStats[song.id];
            return (
              <SongListItem 
                key={song.id} 
                song={song} 
                accessible={accessible} 
                stats={songStat}
                onSelect={async () => {
                  if (!accessible) {
                    setLockedSong({title:song.title,min_rank:song.min_rank});
                    return;
                  }
                  
                  // 通常曲選択時はレッスンコンテキストとミッションコンテキストをクリア
                  gameActions.clearLessonContext();
                  gameActions.clearMissionContext();
                  
                  // 明示的リセット: 前の曲の再生・状態を完全停止/初期化
                  gameActions.stop();
                  gameActions.clearSong();
                  
                  try {
                    // JSONデータの取得（json_urlがある場合はそちらを優先）
                    let notesData: any;
                    if (song.json_url) {
                      const response = await fetch(song.json_url);
                      if (!response.ok) {
                        throw new Error(`JSONデータの読み込みに失敗: ${response.status} ${response.statusText}`);
                      }
                      
                      // レスポンスの内容をチェック
                      const contentType = response.headers.get('content-type');
                      if (!contentType || !contentType.includes('application/json')) {
                        console.warn('⚠️ JSONでないコンテンツタイプ:', contentType);
                      }
                      
                      const responseText = await response.text();
                      
                      // HTMLが返されている場合の検出
                      if (responseText.trim().startsWith('<')) {
                        throw new Error('JSONデータの代わりにHTMLが返されました。ファイルパスまたはサーバー設定を確認してください。');
                      }
                      
                      try {
                        notesData = JSON.parse(responseText);
                      } catch (parseError) {
                        console.error('JSON解析エラー:', parseError);
                        console.error('レスポンス内容の先頭100文字:', responseText.substring(0, 100));
                        throw new Error(`JSONデータの解析に失敗しました: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
                      }
                    } else if (song.json_data) {
                      notesData = song.json_data;
                    } else {
                      throw new Error('曲のノーツデータがありません');
                    }
                    
                    // notes配列の抽出
                    const notes = Array.isArray(notesData) ? notesData : notesData.notes;
                    if (!notes || !Array.isArray(notes)) {
                      throw new Error('ノーツデータの形式が不正です');
                    }
                    
                    const mapped = notes.map((n: any, idx: number) => ({ 
                      id: `${song.id}-${idx}`, 
                      time: n.time, 
                      pitch: n.pitch 
                    }));
                    
                    // 音声ファイルの長さを取得（audio_urlがある場合）
                    let duration = 60; // デフォルト値
                    if (song.audio_url) {
                      try {
                        const audio = new Audio(song.audio_url);
                        // CORS対応: Supabaseストレージからの音声ファイル用
                        audio.crossOrigin = 'anonymous';
                        await new Promise((resolve, reject) => {
                            const loadedHandler = () => {
                              duration = Math.floor(audio.duration) || 60;
                              resolve(void 0);
                            };
                          const errorHandler = (e: any) => {
                            console.warn('音声ファイルの読み込みに失敗、デフォルト時間を使用', e);
                            resolve(void 0);
                          };
                          
                          audio.addEventListener('loadedmetadata', loadedHandler);
                          audio.addEventListener('error', errorHandler);
                          
                          setTimeout(() => resolve(void 0), 3000); // タイムアウト
                          audio.load();
                        });
                      } catch (e) {
                        console.warn('音声ファイルの処理中にエラー:', e);
                      }
                    }
                    
                    // SongMetadata形式に変換
                    const songMetadata = {
                      id: song.id,
                      title: song.title,
                      artist: song.artist || '',
                      duration: duration,
                      audioFile: song.audio_url || '',
                      notesFile: song.json_url || '',
                      musicXmlFile: song.xml_url || '',
                      genreCategory: 'database'
                    };
                    
                    // 曲をロード（非同期処理）
                    await gameActions.loadSong(songMetadata, mapped);
                    
                    // 曲のロード後、少し遅延してからタブを切り替えることで
                    // 確実に画面遷移を行う
                    setTimeout(() => {
                      gameActions.setCurrentTab('practice');
                      window.location.hash = '#practice';
                    }, 50);
                  } catch (err) {
                    console.error('曲読み込みエラー:', err);
                    
                    // エラーの詳細情報をログ出力
                    if (err instanceof Error) {
                      console.error('エラーメッセージ:', err.message);
                      console.error('エラースタック:', err.stack);
                    }
                    
                    // ユーザーフレンドリーなエラーメッセージ
                    let userMessage = '楽曲の読み込みに失敗しました';
                    if (err instanceof Error) {
                      if (err.message.includes('HTMLが返されました')) {
                        userMessage = 'ファイルが見つかりません。曲データの設定を確認してください';
                      } else if (err.message.includes('JSON') || err.message.includes('Unexpected token')) {
                        userMessage = '楽曲ファイルの形式が正しくありません';
                      } else {
                        userMessage += `: ${err.message}`;
                      }
                    }
                    
                    alert(userMessage);
                  }
                }} 
              />
            );
          })}
          
          {/* ハードコードされたDemo-1は削除（データベースに移行） */}
        </div>

        {lockedSong && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={()=>setLockedSong(null)}>
            <div className="bg-slate-800 p-6 rounded-lg text-white space-y-4" onClick={e=>e.stopPropagation()}>
              <h4 className="text-lg font-bold text-center">この曲はプレイできません</h4>
              <p className="text-center">{lockedSong.title} は {lockedSong.min_rank.toUpperCase()} プラン以上でプレイ可能です。</p>
              <button className="btn btn-sm btn-primary w-full" onClick={()=>setLockedSong(null)}>閉じる</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ゲームプレイ画面
 */
const GamePlayScreen: React.FC = () => {
  const { currentSong, mode, settings, lessonContext, missionContext } = useGameSelector((s) => ({
    currentSong: s.currentSong,
    mode: s.mode,
    settings: s.settings,
    lessonContext: s.lessonContext,
    missionContext: s.missionContext
  }));
  const gameActions = useGameActions();
  
  // 楽譜エリアの高さ比率を管理（パーセンテージ）
  const [sheetMusicHeightPercentage, setSheetMusicHeightPercentage] = useState(30);
  
  // 楽譜エリアの高さ変更時のハンドラー（シンプル版）
  const handleSheetMusicResize = (newPercentage: number) => {
    setSheetMusicHeightPercentage(newPercentage);
  };

  if (!currentSong) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl text-gray-300 mb-4">楽曲を選択してください</h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => gameActions.setCurrentTab('songs')}
                className="btn btn-primary"
              >
                楽曲選択に移動
              </button>
              <button
                onClick={async () => {
                  try {
                    const { initializeAudioSystem } = await import('@/utils/MidiController');
                    await initializeAudioSystem();
                  } catch (error) {
                    console.error('❌ Manual audio system initialization failed:', error);
                    alert('音声システムの初期化に失敗しました。ページを再読み込みしてください。');
                  }
                }}
                className="btn btn-secondary text-sm"
              >
                音声システム初期化
              </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* メインコンテンツエリア - 残りのスペースを使用 */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* 楽譜表示エリア（上側） - showSheetMusicがtrueの場合のみ表示 */}
        {settings.showSheetMusic && (
          <>
            <div 
              className="min-h-0 overflow-hidden flex-shrink-0"
              style={{ height: `${sheetMusicHeightPercentage}%` }}
            >
              <SheetMusicDisplay 
                className="h-full"
              />
            </div>
            
            {/* リサイズハンドル */}
            <ResizeHandle
              onResize={handleSheetMusicResize}
              initialPercentage={sheetMusicHeightPercentage}
              minPercentage={5}
              maxPercentage={95}
            />
          </>
        )}
        
        {/* ゲームエンジン（下側） - 楽譜表示の有無に応じて高さを調整 */}
        <div 
          className="flex-1 min-h-0"
          style={{ 
            height: settings.showSheetMusic ? `${100 - sheetMusicHeightPercentage}%` : '100%'
          }}
        >
          <GameEngineComponent className="h-full w-full" />
        </div>
        
        {/* リハ/ステージ 縦ボタン - 画面中央右に配置 */}
        <ModeToggleButton />
        
        {/* レッスンに戻るボタン - 画面中央左に配置（レッスンコンテキストがある場合のみ） */}
        <LessonBackButton />
        
        {/* ミッションに戻るボタン - 画面中央左に配置（ミッションコンテキストがある場合のみ） */}
        <MissionBackButton />
      </div>

      {/* コントロールバー - フレックスボックス内の通常要素として配置 */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-700">
        <ControlBar />
      </div>
    </div>
  );
};

/**
 * リハ/ステージ モード切り替えボタン
 */
const ModeToggleButton: React.FC = () => {
  const { mode } = useGameSelector((s) => ({
    mode: s.mode
  }));
  const gameActions = useGameActions();

  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
      <div className="flex flex-col space-y-2">
        {/* リハボタン */}
        <button
          onClick={() => gameActions.setMode('practice')}
          className={`
            px-2 py-1 rounded-lg font-bold text-xs
            transition-all duration-200 hover:scale-105
            shadow-lg backdrop-blur-sm
            bg-opacity-80 border border-opacity-60
            ${mode === 'practice' 
              ? 'bg-gradient-to-br from-blue-500/80 to-blue-700/80 hover:from-blue-400/90 hover:to-blue-600/90 text-white border-blue-300/60' 
              : 'bg-gradient-to-br from-gray-500/60 to-gray-700/60 hover:from-gray-400/70 hover:to-gray-600/70 text-gray-200 border-gray-400/40'
            }
          `}
          title="練習モード（リハーサル）"
        >
          リハ
        </button>
        
        {/* ステージボタン */}
        <button
          onClick={() => gameActions.setMode('performance')}
          className={`
            px-2 py-1 rounded-lg font-bold text-xs
            transition-all duration-200 hover:scale-105
            shadow-lg backdrop-blur-sm
            bg-opacity-80 border border-opacity-60
            ${mode === 'performance' 
              ? 'bg-gradient-to-br from-blue-500/80 to-blue-700/80 hover:from-blue-400/90 hover:to-blue-600/90 text-white border-blue-300/60' 
              : 'bg-gradient-to-br from-gray-500/60 to-gray-700/60 hover:from-gray-400/70 hover:to-gray-600/70 text-gray-200 border-gray-400/40'
            }
          `}
          title="本番モード（ステージ）"
        >
          ステージ
        </button>
      </div>
    </div>
  );
};

/**
 * レッスンに戻るボタン - 画面左端に配置
 */
const LessonBackButton: React.FC = () => {
  const { lessonContext } = useGameSelector((s) => ({
    lessonContext: s.lessonContext
  }));

  // レッスンコンテキストがない場合は何も表示しない
  if (!lessonContext) {
    return null;
  }

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
      <button
        onClick={() => {
          // レッスン詳細ページに戻る
          window.location.hash = `#lesson-detail?id=${lessonContext.lessonId}`;
        }}
        className="
          px-3 py-2 rounded-lg font-bold text-sm
          transition-all duration-200 hover:scale-105
          shadow-lg backdrop-blur-sm
          bg-gradient-to-br from-gray-500/80 to-gray-700/80 
          hover:from-gray-400/90 hover:to-gray-600/90 
          text-white border border-gray-400/60
          flex items-center space-x-2
        "
        title="レッスンに戻る"
      >
        <FaArrowLeft className="w-3 h-3" />
        <span>レッスンに戻る</span>
      </button>
    </div>
  );
};

/**
 * ミッションに戻るボタン - 画面左端に配置
 */
const MissionBackButton: React.FC = () => {
  const { missionContext } = useGameSelector((s) => ({
    missionContext: s.missionContext
  }));

  // ミッションコンテキストがない場合は何も表示しない
  if (!missionContext) {
    return null;
  }

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
      <button
        onClick={() => {
          // ミッション一覧に戻る
          window.location.hash = '#missions';
        }}
        className="
          px-3 py-2 rounded-lg font-bold text-sm
          transition-all duration-200 hover:scale-105
          shadow-lg backdrop-blur-sm
          bg-gradient-to-br from-gray-500/80 to-gray-700/80 
          hover:from-gray-400/90 hover:to-gray-600/90 
          text-white border border-gray-400/60
          flex items-center space-x-2
        "
        title="ミッションに戻る"
      >
        <FaArrowLeft className="w-3 h-3" />
        <span>ミッションに戻る</span>
      </button>
    </div>
  );
};

/**
 * 楽曲リスト項目コンポーネント（軽量化レイアウト）
 */
interface SongListItemProps {
  song: any;
  accessible: boolean;
  stats?: {clear_count: number; b_rank_plus_count?: number; best_score?: number; best_rank?: string};
  onSelect: () => void;
}

const SongListItem: React.FC<SongListItemProps> = ({ song, accessible, stats, onSelect }) => {
  const [isLoading, setIsLoading] = React.useState(false);



  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'free':
        return 'bg-green-100 text-green-800';
      case 'standard':
      case 'standard_global':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'platinum':
        return 'bg-yellow-100 text-yellow-800';
      case 'black':
        return 'bg-slate-900 text-slate-100';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClick = async () => {
    if (isLoading || !accessible) return;
    
    setIsLoading(true);
    try {
      await onSelect();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 
        hover:border-primary-500 hover:bg-slate-700 transition-colors cursor-pointer
        ${!accessible ? 'opacity-50' : ''} ${isLoading ? 'opacity-75 pointer-events-none' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* 楽曲情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-white truncate">{song.title}</h3>
            {!accessible && (
              <span className="text-xs text-red-400">🔒</span>
            )}
            {isLoading && (
              <span className="text-xs text-blue-400">読み込み中...</span>
            )}
          </div>
          <p className="text-gray-400 text-sm truncate">{song.artist || '不明'}</p>
        </div>

                  {/* 楽曲詳細情報 */}
          <div className="flex items-center space-x-3 text-xs">
            {/* BPM */}
            {song.bpm && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">BPM:</span>
                <span className="font-mono text-blue-400">{song.bpm}</span>
              </div>
            )}

            {/* 会員ランク */}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRankColor(song.min_rank)}`}>
              {song.min_rank?.toUpperCase() || 'FREE'}
            </span>
          </div>
        
        {/* ユーザー統計情報 */}
        {(() => {
          const s = stats ?? { clear_count: 0, b_rank_plus_count: 0, best_score: undefined, best_rank: undefined };
          return (
          <div className="space-y-2 text-xs mt-2">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-gray-500">クリア回数:</span>
                <span className="font-mono text-green-400">{s.clear_count}回</span>
              </div>
              {s.best_rank && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">最高ランク:</span>
                  <span className="font-mono text-yellow-400">{s.best_rank}</span>
                </div>
              )}
              {s.best_score && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">ハイスコア:</span>
                  <span className="font-mono text-blue-400">{s.best_score.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {/* B-rank+ clear count progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Bランク以上クリア:</span>
                <span className="font-mono text-blue-400">{s.b_rank_plus_count || 0}/50</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-400 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, ((s.b_rank_plus_count || 0) / 50) * 100)}%` }}
                />
              </div>
              {(s.b_rank_plus_count || 0) >= 50 && (
                <div className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                  <FaAward className="text-emerald-400" />
                  目標達成！
                </div>
              )}
            </div>
          </div>
          );
        })()}
      </div>

      {/* 再生ボタン - クリックイベントを削除してdivのクリックに統一 */}
      <div className="flex items-center ml-4">
        <button
          className={`btn btn-sm ${accessible ? 'btn-primary' : 'btn-outline'} flex items-center space-x-1 pointer-events-none`}
          tabIndex={-1}
        >
          <span>▶</span>
          <span className="hidden sm:inline">プレイ</span>
        </button>
      </div>
    </div>
  );
};

/**
 * 楽曲カードコンポーネント（レガシー - デモ曲用）
 */
interface SongCardProps {
  title: string;
  artist: string;
  locked?: boolean;
  onSelect: () => void;
}

const SongCard: React.FC<SongCardProps> = ({ title, artist, locked = false, onSelect }) => {
  return (
    <div 
      className={`card hover:border-primary-500 transition-colors cursor-pointer ${locked ? 'opacity-50' : ''}`}
      onClick={onSelect}
    >
      <div className="card-body">
        <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">{artist}</p>
      </div>
    </div>
  );
};

/**
 * 空のスロットコンポーネント
 */
const EmptySlot: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="card border-dashed border-gray-600 opacity-50">
      <div className="card-body text-center">
        <div className="text-4xl mb-2">➕</div>
        <p className="text-gray-500 text-sm">{text}</p>
      </div>
    </div>
  );
};

/**
 * 設定パネル（簡易版）
 */
const SettingsPanel: React.FC = () => {
  const { settings, mode, lessonContext, missionContext } = useGameSelector((s) => ({ 
    settings: s.settings, 
    mode: s.mode,
    lessonContext: s.lessonContext,
    missionContext: s.missionContext
  }));
  const gameActions = useGameActions();
  
  // 本番モード + レッスンコンテキスト時の課題条件制限フラグ
  const isStageWithLessonConstraints = mode === 'performance' && lessonContext;
  
  // 本番モード + ミッションコンテキスト時の課題条件制限フラグ
  const isStageWithMissionConstraints = mode === 'performance' && missionContext?.clearConditions;
  
  // ローカルストレージ関連の状態
  const [hasStoredSettings, setHasStoredSettings] = React.useState(false);
  
  // コンポーネントマウント時にローカルストレージの状態をチェック
  useEffect(() => {
    const checkStoredSettings = () => {
      try {
        const stored = localStorage.getItem('jazzgame_settings');
        setHasStoredSettings(stored !== null);
      } catch (error) {
        console.error('ローカルストレージの確認に失敗:', error);
        setHasStoredSettings(false);
      }
    };
    
    checkStoredSettings();
  }, []);
  
  // 設定変更時にローカルストレージの状態を更新
  useEffect(() => {
    const checkStoredSettings = () => {
      try {
        const stored = localStorage.getItem('jazzgame_settings');
        setHasStoredSettings(stored !== null);
      } catch (error) {
        console.error('ローカルストレージの確認に失敗:', error);
        setHasStoredSettings(false);
      }
    };
    
    // 設定変更後に少し遅延してチェック
    const timeoutId = setTimeout(checkStoredSettings, 100);
    return () => clearTimeout(timeoutId);
  }, [settings]);
  
  // 設定をリセットする関数
  const handleResetSettings = () => {
    if (window.confirm('設定をデフォルトにリセットしますか？この操作は取り消せません。')) {
      gameActions.resetSettings();
      setHasStoredSettings(false);
    }
  };
  
  // ローカルストレージをクリアする関数
  const handleClearStorage = () => {
    if (window.confirm('保存された設定を削除しますか？この操作は取り消せません。')) {
      try {
        localStorage.removeItem('jazzgame_settings');
        setHasStoredSettings(false);
        alert('保存された設定を削除しました。');
      } catch (error) {
        console.error('ローカルストレージの削除に失敗:', error);
        alert('設定の削除に失敗しました。');
      }
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={(e) => {
        // オーバーレイ部分（背景領域）をクリックした場合のみモーダルを閉じる
        if (e.target === e.currentTarget) {
          gameActions.setSettingsOpen(false);
        }
      }}
      onClick={(e) => {
        // 追加の安全対策: onClick でも同様の処理
        if (e.target === e.currentTarget) {
          gameActions.setSettingsOpen(false);
        }
      }}
    >
      <div className="modal-content">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">設定</h2>
            <button
              onClick={() => gameActions.setSettingsOpen(false)}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="card-body">
          {/* 本番モード課題条件の全体説明 */}
          {(isStageWithLessonConstraints || isStageWithMissionConstraints) && (
            <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/40 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">🎯</span>
                <h3 className="text-lg font-bold text-amber-300">
                  本番モード - 課題条件適用中
                  {isStageWithLessonConstraints && '（レッスン）'}
                  {isStageWithMissionConstraints && '（ミッション）'}
                </h3>
              </div>
              <div className="text-sm text-amber-200 space-y-1">
                <p>
                  {isStageWithLessonConstraints && 'レッスンの課題条件に従って設定が固定されています。'}
                  {isStageWithMissionConstraints && 'ミッションの課題条件に従って設定が固定されています。'}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                  {(lessonContext?.clearConditions.key !== undefined || missionContext?.clearConditions?.key !== undefined) && (
                    <div className="flex justify-between">
                      <span>キー設定:</span>
                      <span className="font-mono text-amber-300">
                        {(() => {
                          const key = lessonContext?.clearConditions.key ?? missionContext?.clearConditions?.key ?? 0;
                          return key > 0 ? `+${key}` : key;
                        })()}半音
                      </span>
                    </div>
                  )}
                  {(lessonContext?.clearConditions.speed !== undefined || missionContext?.clearConditions?.speed !== undefined) && (
                    <div className="flex justify-between">
                      <span>再生速度:</span>
                      <span className="font-mono text-amber-300">
                        {lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0}倍速以上
                      </span>
                    </div>
                  )}
                  {(lessonContext?.clearConditions.rank || missionContext?.clearConditions?.rank) && (
                    <div className="flex justify-between">
                      <span>必要ランク:</span>
                      <span className="font-mono text-amber-300">
                        {lessonContext?.clearConditions.rank ?? missionContext?.clearConditions?.rank ?? 'B'}以上
                      </span>
                    </div>
                  )}
                  
                  {(lessonContext?.clearConditions.notation_setting || missionContext?.clearConditions?.notation_setting) && (
                    <div className="flex justify-between">
                      <span>楽譜表示:</span>
                      <span className="font-mono text-amber-300">
                        {(() => {
                          const notation = lessonContext?.clearConditions.notation_setting ?? missionContext?.clearConditions?.notation_setting;
                          return notation === 'notes_chords' ? 'ノート+コード' :
                                 notation === 'chords_only' ? 'コードのみ' :
                                 'ノート+コード';
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-amber-400">
                  💡 練習モードに切り替えると設定を自由に変更できます
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">


              {/* 入力デバイス設定 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    入力デバイス
                  </label>
                  <div className="bg-blue-900 bg-opacity-20 p-4 rounded-lg border border-blue-700 border-opacity-30">
                    <h4 className="text-sm font-medium text-blue-200 mb-3">🎹 MIDI デバイス設定</h4>
                    <MidiDeviceSelector
                      value={settings.selectedMidiDevice}
                      onChange={(deviceId: string | null) => gameActions.updateSettings({ selectedMidiDevice: deviceId })}
                    />
                  </div>
                </div>
              </div>

            {/* 音量設定 */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  音楽音量: {Math.round(settings.musicVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.musicVolume}
                  onChange={(e) => 
                    gameActions.updateSettings({ musicVolume: parseFloat(e.target.value) })
                  }
                  className="slider w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  MIDI音量: {Math.round(settings.midiVolume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.midiVolume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    gameActions.updateSettings({ midiVolume: newVolume });
                    // MIDIControllerに即座に反映（デバウンス付き）
                    requestAnimationFrame(() => {
                      import('@/utils/MidiController').then(({ updateGlobalVolume }) => {
                        updateGlobalVolume(newVolume);
                      }).catch(error => {
                        console.error('MidiController import failed:', error);
                        // フォールバック処理 - 無音で続行
                      });
                    });
                  }}
                  className="slider w-full accent-amber-400"
                />
              </div>
            </div>

            {/* ノーツスピード */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ノーツスピード: {settings.notesSpeed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={settings.notesSpeed}
                onChange={(e) => 
                  gameActions.updateSettings({ notesSpeed: parseFloat(e.target.value) })
                }
                className="slider"
              />
            </div>

            {/* 再生スピード */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                再生スピード: {Math.round(settings.playbackSpeed * 100)}%
                {(isStageWithLessonConstraints && lessonContext?.clearConditions.speed !== undefined) || 
                 (isStageWithMissionConstraints && missionContext?.clearConditions?.speed !== undefined) && (
                  <span className="ml-2 text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded">
                    最低{lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0}倍速
                  </span>
                )}
              </label>
              {(isStageWithLessonConstraints && lessonContext?.clearConditions.speed !== undefined) || 
               (isStageWithMissionConstraints && missionContext?.clearConditions?.speed !== undefined) && (
                <div className="text-xs text-amber-300 mb-2 bg-amber-900/10 p-2 rounded border border-amber-600/30">
                  🎯 課題条件: {lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0}倍速以上が必要（本番モードでは{lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0}倍速以上で変更可能）
                </div>
              )}
              <input
                type="range"
                min={((isStageWithLessonConstraints && lessonContext?.clearConditions.speed !== undefined) || 
                      (isStageWithMissionConstraints && missionContext?.clearConditions?.speed !== undefined))
                     ? (lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0).toString() 
                     : "0.5"}
                max="1.5"
                step="0.05"
                value={settings.playbackSpeed}
                onChange={(e) => 
                  gameActions.updateSettings({ playbackSpeed: parseFloat(e.target.value) })
                }
                className="slider"
              />
            </div>

            {/* 判定タイミング調整 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                表示タイミング調整 (判定も同期): {settings.timingAdjustment > 0 ? '+' : ''}{settings.timingAdjustment}ms
              </label>
              <div className="text-xs text-gray-400 mb-2">
                ノーツの表示位置と判定タイミングを調整します（早く: -, 遅く: +）
              </div>
              <input
                type="range"
                min="-200"
                max="200"
                step="1"
                value={settings.timingAdjustment}
                onChange={(e) => 
                  gameActions.updateSettings({ timingAdjustment: parseInt(e.target.value) })
                }
                className="slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-200ms (早く)</span>
                <span>0ms</span>
                <span>+200ms (遅く)</span>
              </div>
            </div>

            {/* オクターブ違い許容設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                オクターブ違いの音を正解にする
              </label>
              <div className="flex items-center space-x-4 mt-1">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="allow-octave-error"
                    value="on"
                    checked={settings.allowOctaveError}
                    onChange={() => gameActions.updateSettings({ allowOctaveError: true })}
                    className="radio radio-sm"
                  />
                  <span className="text-sm text-gray-300">ON</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="allow-octave-error"
                    value="off"
                    checked={!settings.allowOctaveError}
                    onChange={() => gameActions.updateSettings({ allowOctaveError: false })}
                    className="radio radio-sm"
                  />
                  <span className="text-sm text-gray-300">OFF</span>
                </label>
              </div>
            </div>

            {/* 移調楽器設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                移調楽器設定
                {(isStageWithLessonConstraints && lessonContext?.clearConditions.key !== undefined) || 
                 (isStageWithMissionConstraints && missionContext?.clearConditions?.key !== undefined) && (
                  <span className="ml-2 text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded">
                    本番モード固定
                  </span>
                )}
              </label>
              {(isStageWithLessonConstraints && lessonContext?.clearConditions.key !== undefined) || 
               (isStageWithMissionConstraints && missionContext?.clearConditions?.key !== undefined) && (
                <div className="text-xs text-amber-300 mb-2 bg-amber-900/10 p-2 rounded border border-amber-600/30">
                  🎯 課題条件: キー設定が固定されています（本番モードでは変更不可）
                </div>
              )}
              <select
                value={settings.transposingInstrument}
                onChange={(e) => gameActions.updateSettings({ transposingInstrument: e.target.value as TransposingInstrument })}
                className={`select select-bordered w-full max-w-xs bg-gray-800 text-white mb-2 ${
                  ((isStageWithLessonConstraints && lessonContext?.clearConditions.key !== undefined) || 
                   (isStageWithMissionConstraints && missionContext?.clearConditions?.key !== undefined)) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={(isStageWithLessonConstraints && lessonContext?.clearConditions.key !== undefined) || 
                         (isStageWithMissionConstraints && missionContext?.clearConditions?.key !== undefined)}
              >
                <option value="concert_pitch">コンサートピッチ（移調なし）</option>
                <option value="bb_major_2nd">in Bb (長2度上) ソプラノサックス、トランペット、クラリネット</option>
                <option value="bb_major_9th">in Bb (1オクターブ+長2度上) テナーサックス</option>
                <option value="eb_major_6th">in Eb (長6度上) アルトサックス</option>
                <option value="eb_major_13th">in Eb (1オクターブ+長6度上) バリトンサックス</option>
              </select>
              <div className="text-xs text-gray-400 mt-1">
                選択した楽器に応じて楽譜が移調されます。鍵盤はコンサートピッチ（C調）のまま表示されます。<br/>
                <span className="text-yellow-300">+半音数 = 楽譜がその分高く移調されます</span>
              </div>
            </div>

            {/* 簡易表示ON/OFF */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                簡易表示
              </label>
              <div className="flex items-center space-x-4 mt-1">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="simple-display-mode"
                    value="on"
                    checked={settings.simpleDisplayMode}
                    onChange={() => gameActions.updateSettings({ simpleDisplayMode: true })}
                    className="radio radio-sm"
                  />
                  <span className="text-sm text-gray-300">ON</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="simple-display-mode"
                    value="off"
                    checked={!settings.simpleDisplayMode}
                    onChange={() => gameActions.updateSettings({ simpleDisplayMode: false })}
                    className="radio radio-sm"
                  />
                  <span className="text-sm text-gray-300">OFF</span>
                </label>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                ONにすると、複雑な音名（異名同音、ダブルシャープ等）が基本的な音名に変換されて表示されます。<br />
                <strong>PIXIノーツ、鍵盤、OSMD楽譜</strong>のすべてに適用されます。
              </div>
            </div>

            {/* 音名表示設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                音名表示（鍵盤・ノーツ共通）
              </label>
              <select
                value={settings.noteNameStyle}
                onChange={(e) => gameActions.updateSettings({ noteNameStyle: e.target.value as any })}
                className="select select-bordered w-full max-w-xs bg-gray-800 text-white mb-2"
              >
                <option value="off">OFF</option>
                <option value="abc">英語 (C, D, E...)</option>
                <option value="solfege">ドレミ</option>
              </select>
              <div className="text-xs text-gray-400 mt-1">
                {settings.transposingInstrument !== 'concert_pitch' && 
                  <div>音名は{getTransposingInstrumentName(settings.transposingInstrument)}用に移調されて表示されます。</div>
                }
              </div>
            </div>

            {/* 楽譜表示モード */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                楽譜表示
                {(isStageWithLessonConstraints && lessonContext?.clearConditions.notation_setting) || 
                 (isStageWithMissionConstraints && missionContext?.clearConditions?.notation_setting) && (
                  <span className="ml-2 text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded">
                    本番モード固定
                  </span>
                )}
              </label>
              {(isStageWithLessonConstraints && lessonContext?.clearConditions.notation_setting) || 
               (isStageWithMissionConstraints && missionContext?.clearConditions?.notation_setting) && (
                <div className="text-xs text-amber-300 mb-2 bg-amber-900/10 p-2 rounded border border-amber-600/30">
                  🎯 課題条件: {
                    (() => {
                      const notation = lessonContext?.clearConditions.notation_setting ?? missionContext?.clearConditions?.notation_setting;
                      return notation === 'notes_chords' ? 'ノート+コード表示' :
                             notation === 'chords_only' ? 'コードのみ表示' :
                             'ノート+コード表示';
                    })()
                  }が必要（本番モードでは固定）
                </div>
              )}
              <div className="flex items-center space-x-4 mt-1">
                <label className={`flex items-center space-x-1 ${((isStageWithLessonConstraints && lessonContext?.clearConditions.notation_setting) || 
                                                                 (isStageWithMissionConstraints && missionContext?.clearConditions?.notation_setting)) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="sheet-music-mode"
                    value="full"
                    checked={!settings.sheetMusicChordsOnly}
                    onChange={() =>
                      gameActions.updateSettings({ sheetMusicChordsOnly: false })
                    }
                    className="radio radio-sm"
                    disabled={(isStageWithLessonConstraints && lessonContext?.clearConditions.notation_setting !== undefined) || 
                             (isStageWithMissionConstraints && missionContext?.clearConditions?.notation_setting !== undefined)}
                  />
                  <span className="text-sm text-gray-300">ノート+コード</span>
                </label>
                <label className={`flex items-center space-x-1 ${((isStageWithLessonConstraints && lessonContext?.clearConditions.notation_setting) || 
                                                                 (isStageWithMissionConstraints && missionContext?.clearConditions?.notation_setting)) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="sheet-music-mode"
                    value="chords-only"
                    checked={settings.sheetMusicChordsOnly}
                    onChange={() =>
                      gameActions.updateSettings({ sheetMusicChordsOnly: true })
                    }
                    className="radio radio-sm"
                    disabled={(isStageWithLessonConstraints && lessonContext?.clearConditions.notation_setting !== undefined) || 
                             (isStageWithMissionConstraints && missionContext?.clearConditions?.notation_setting !== undefined)}
                  />
                  <span className="text-sm text-gray-300">コードのみ</span>
                </label>
              </div>
            </div>

            {/* 練習モードガイド設定 - 練習モード時のみ表示 */}
            {mode === 'practice' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  練習モードガイド
                </label>
                <select
                  value={settings.practiceGuide ?? 'key'}
                  onChange={(e) => gameActions.updateSettings({ practiceGuide: e.target.value as any })}
                  className="select select-bordered w-full max-w-xs bg-gray-800 text-white"
                >
                  <option value="off">OFF</option>
                  <option value="key_auto">鍵盤ハイライト + オートプレイ</option>
                  <option value="key">鍵盤ハイライトのみ</option>
                </select>
                <div className="text-xs text-gray-400 mt-1">
                  ノーツが判定ラインを通過する際の表示ガイド（練習モード専用）
                </div>
              </div>
            )}

            {/* ローカルストレージ管理セクション */}
            <div className="border-t border-gray-600 pt-4 mt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">💾 設定の保存・管理</h3>
              
              <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-600">
                <div className="space-y-3">
                  {/* 保存状態表示 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">保存状態:</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      hasStoredSettings 
                        ? 'bg-green-600 text-green-100' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {hasStoredSettings ? '設定が保存されています' : '設定は保存されていません'}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    設定は自動的にローカルストレージに保存されます（再生速度・楽譜表示設定は除く）。
                    ブラウザを閉じても設定が保持されます。楽譜表示は曲を開く度にデフォルト（ノーツ+コード）になります。
                  </div>
                  
                  {/* 操作ボタン */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetSettings}
                      className="btn btn-sm btn-outline btn-warning"
                    >
                      🔄 デフォルトにリセット
                    </button>
                    
                    {hasStoredSettings && (
                      <button
                        onClick={handleClearStorage}
                        className="btn btn-sm btn-outline btn-error"
                      >
                        🗑️ 保存データ削除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ヘッダー右端ボタン群
 */
const HeaderRightControls: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    // 未ログイン
    return (
      <div className="flex items-center space-x-4">
        <a href="#login" className="btn btn-sm btn-outline">会員登録 / ログイン</a>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* アカウント */}
      <a href="#account" className="btn btn-sm btn-primary">アカウント</a>
    </div>
  );
};

export default GameScreen;
