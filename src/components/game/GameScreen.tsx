import React, { useState, useEffect } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import GameEngineComponent from './GameEngine';
import ControlBar from './ControlBar';
import { MidiDeviceSelector, AudioDeviceSelector } from '@/components/ui/MidiDeviceManager';
import ResultModal from './ResultModal';
import SheetMusicDisplay from './SheetMusicDisplay';
import ResizeHandle from '@/components/ui/ResizeHandle';
import { getTransposingInstrumentName } from '@/utils/musicXmlTransposer';
import type { TransposingInstrument } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { fetchSongs, MembershipRank, rankAllowed } from '@/platform/supabaseSongs';

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
        <header
          className="flex-shrink-0 bg-game-surface border-b border-gray-700 px-3 py-1 z-[60]"
        >
          <div className="flex justify-between items-center">
            {/* 左側ナビゲーション */}
            <div className="flex items-center space-x-2">
              {/* トップ (ダッシュボード) */}
              <button
                className="text-white hover:text-primary-400 font-bold px-2"
                onClick={() => { window.location.hash = '#dashboard'; }}
              >
                トップ
              </button>

              {/* 曲選択タブ */}
              <TabButton
                active={currentTab === 'songs'}
                onClick={() => gameActions.setCurrentTab('songs')}
              >
                曲選択
              </TabButton>

              {/* レッスン */}
              <button
                className="text-white hover:text-primary-400 px-2"
                onClick={() => { window.location.hash = '#lessons'; }}
              >
                レッスン
              </button>

              {/* ランキング */}
              <button
                className="text-white hover:text-primary-400 px-2"
                onClick={() => { window.location.hash = '#ranking'; }}
              >
                ランキング
              </button>

              {/* 日記 */}
              <button
                className="text-white hover:text-primary-400 px-2"
                onClick={() => { window.location.hash = '#diary'; }}
              >
                日記
              </button>

              {/* お知らせ */}
              <button
                className="text-white hover:text-primary-400 px-2"
                onClick={() => { window.location.hash = '#dashboard'; }}
              >
                お知らせ
              </button>
            </div>

            {/* 右側のコントロール */}
            <HeaderRightControls />
          </div>
        </header>
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

/**
 * 楽曲選択画面
 */
const SongSelectionScreen: React.FC = () => {
  const gameActions = useGameActions();
  const { profile } = useAuthStore();
  const [dbSongs, setDbSongs] = React.useState<any[]>([]);
  const [lockedSong, setLockedSong] = React.useState<{title:string;min_rank:string}|null>(null);
  const [sortBy, setSortBy] = React.useState<'artist' | 'title' | 'difficulty'>('artist');
  const [filterBy, setFilterBy] = React.useState<'all' | 'free' | 'premium'>('all');

  React.useEffect(() => {
    (async () => {
      try {
        const allSongs = await fetchSongs();
        setDbSongs(allSongs);
      } catch (e) {
        console.error('曲一覧取得失敗', e);
      }
    })();
  }, [profile]);

  // 楽曲ソート機能
  const sortedSongs = React.useMemo(() => {
    let sorted = [...dbSongs];
    
    // フィルタリング
    if (filterBy !== 'all') {
      sorted = sorted.filter(song => {
        if (filterBy === 'free') return song.min_rank === 'free';
        if (filterBy === 'premium') return ['premium', 'platinum'].includes(song.min_rank);
        return true;
      });
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
      if (sortBy === 'difficulty') {
        return (a.difficulty || 0) - (b.difficulty || 0);
      }
      return 0;
    });
    
    return sorted;
  }, [dbSongs, sortBy, filterBy]);

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">楽曲選択</h2>
          <div className="text-sm text-gray-400">
            {sortedSongs.length} 曲
          </div>
        </div>

        {/* ソート・フィルター コントロール */}
        <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">ソート:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'artist' | 'title' | 'difficulty')}
              className="select select-sm bg-slate-700 text-white border-slate-600"
            >
              <option value="artist">アーティスト順</option>
              <option value="title">タイトル順</option>
              <option value="difficulty">難易度順</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">フィルター:</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'free' | 'premium')}
              className="select select-sm bg-slate-700 text-white border-slate-600"
            >
              <option value="all">すべて</option>
              <option value="free">無料</option>
              <option value="premium">プレミアム</option>
            </select>
          </div>
        </div>
        
        {/* 楽曲リスト - 軽量化されたレイアウト */}
        <div className="space-y-2">
          {sortedSongs.map((song) => {
            const accessible = rankAllowed((profile?.rank ?? 'free') as MembershipRank, song.min_rank as MembershipRank);
            return (
              <SongListItem 
                key={song.id} 
                song={song} 
                accessible={accessible} 
                onSelect={async () => {
                  if (!accessible) {
                    setLockedSong({title:song.title,min_rank:song.min_rank});
                    return;
                  }
                  try {
                    const data = song.data;
                    const notes = Array.isArray(data) ? data : data.notes;
                    const mapped = notes.map((n: any, idx: number) => ({ id: `${song.id}-${idx}`, time: n.time, pitch: n.pitch }));
                    gameActions.loadSong(song, mapped);
                    gameActions.setCurrentTab('practice');
                  } catch (err) {
                    alert('曲読み込みに失敗しました');
                  }
                }} 
              />
            );
          })}
          
          {/* Demo-1楽曲 */}
          <SongListItem
            song={{
              id: 'demo-1',
              title: 'Demo-1',
              artist: 'Jazz Learning Game',
              difficulty: 2,
              bpm: 120,
              min_rank: 'free'
            }}
            accessible={true}
            onSelect={async () => {
              try {
                // demo-1のノーツデータを読み込み
                const response = await fetch('/demo-1.json');
                if (!response.ok) {
                  throw new Error(`ノーツデータの読み込みに失敗: ${response.status}`);
                }
                const data = await response.json();
                
                // 音声ファイルの長さを動的に取得（エラーハンドリング改善）
                let actualDuration = 60; // デフォルト値
                try {
                  console.log(`🎵 Demo-1音声ファイル読み込み試行: /demo-1.mp3`);
                  const audio = new Audio('/demo-1.mp3');
                  
                  await new Promise((resolve, reject) => {
                    const loadedHandler = () => {
                      actualDuration = Math.floor(audio.duration) || 60;
                      console.log(`🎵 Demo-1音声読み込み成功:`, {
                        duration: actualDuration,
                        src: audio.src,
                        readyState: audio.readyState,
                        networkState: audio.networkState
                      });
                      resolve(void 0);
                    };
                    const errorHandler = (e: Event) => {
                      console.warn('🚨 Demo-1音声ファイルの読み込みに失敗、デフォルト時間を使用:', {
                        error: e,
                        src: audio.src,
                        readyState: audio.readyState,
                        networkState: audio.networkState,
                        lastError: audio.error
                      });
                      resolve(void 0); // エラーでも続行
                    };
                    
                    audio.addEventListener('loadedmetadata', loadedHandler);
                    audio.addEventListener('error', errorHandler);
                    audio.addEventListener('canplaythrough', loadedHandler);
                    
                    // タイムアウト設定
                    setTimeout(() => {
                      console.warn('🚨 Demo-1音声ファイル読み込みタイムアウト、デフォルト時間を使用');
                      resolve(void 0);
                    }, 3000);
                    
                    audio.load();
                  });
                } catch (audioError) {
                  console.warn('🚨 Demo-1音声ファイルの処理中にエラー、デフォルト時間を使用:', audioError);
                }
                
                const demo1Song = {
                  id: 'demo-1',
                  title: 'Demo-1',
                  artist: 'Jazz Learning Game',
                  difficulty: 2,
                  duration: actualDuration,
                  audioFile: '/demo-1.mp3',
                  notesFile: '/demo-1.json',
                  musicXmlFile: '/demo-1.xml',
                  genreCategory: 'demo'
                };
                
                // JSONデータをNoteData形式に変換
                if (!data.notes || !Array.isArray(data.notes)) {
                  throw new Error('ノーツデータの形式が不正です');
                }
                
                const demo1Notes = data.notes.map((note: any, index: number) => ({
                  id: `demo1-${index}`,
                  time: note.time,
                  pitch: note.pitch
                }));
                
                console.log(`🎵 Demo-1読み込み完了: ${demo1Notes.length}ノーツ, ${actualDuration}秒`);
                
                gameActions.loadSong(demo1Song, demo1Notes);
                gameActions.setCurrentTab('practice');
              } catch (error) {
                console.error('Demo-1楽曲の読み込みに失敗しました:', error);
                alert(`Demo-1楽曲の読み込みに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
          />
          
          {/* Alice in Wonderland楽曲カード（JSONデータのみ - 音声なし）*/}
          <SongListItem
            song={{
              id: 'alice-in-wonderland',
              title: 'Alice in Wonderland',
              artist: 'Bill Evans (譜面のみ)',
              difficulty: 3,
              bpm: 140,
              min_rank: 'free'
            }}
            accessible={true}
            onSelect={async () => {
              try {
                // JSONデータを読み込み
                const response = await fetch('/bill-evans-alice-in-wonderland.json');
                if (!response.ok) {
                  throw new Error(`ノーツデータの読み込みに失敗: ${response.status}`);
                }
                const data = await response.json();
                
                const aliceSong = {
                  id: 'alice-in-wonderland',
                  title: 'Alice in Wonderland',
                  artist: 'Bill Evans (譜面のみ)',
                  difficulty: 3,
                  duration: 240, // 適当な長さ
                  audioFile: '', // 音声ファイルなし
                  notesFile: '/bill-evans-alice-in-wonderland.json',
                  genreCategory: 'jazz'
                };
                
                // JSONデータをNoteData形式に変換（配列構造に対応）
                let notesArray: any[] = [];
                if (Array.isArray(data)) {
                  // 直接配列の場合
                  notesArray = data;
                } else if (data.notes && Array.isArray(data.notes)) {
                  // notesプロパティがある場合
                  notesArray = data.notes;
                } else {
                  throw new Error('ノーツデータの形式が不正です');
                }
                
                // 最初の100ノートのみ
                const aliceNotes = notesArray.slice(0, 100).map((note: any, index: number) => ({
                  id: `alice-${index}`,
                  time: note.time,
                  pitch: note.pitch
                }));
                
                console.log(`🎵 Alice in Wonderland読み込み完了: ${aliceNotes.length}ノーツ（音声なしモード）`);
                
                gameActions.loadSong(aliceSong, aliceNotes);
                gameActions.setCurrentTab('practice');
              } catch (error) {
                console.error('Alice in Wonderland楽曲の読み込みに失敗しました:', error);
                alert(`Alice in Wonderland楽曲の読み込みに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }}
          />
          
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
  const { currentSong, mode, settings } = useGameSelector((s) => ({
    currentSong: s.currentSong,
    mode: s.mode,
    settings: s.settings
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
          <button
            onClick={() => gameActions.setCurrentTab('songs')}
            className="btn btn-primary"
          >
            楽曲選択に移動
          </button>
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
 * 楽曲リスト項目コンポーネント（軽量化レイアウト）
 */
interface SongListItemProps {
  song: any;
  accessible: boolean;
  onSelect: () => void;
}

const SongListItem: React.FC<SongListItemProps> = ({ song, accessible, onSelect }) => {
  const getDifficultyColor = (difficulty: number | null) => {
    if (!difficulty) return 'text-gray-400';
    if (difficulty <= 3) return 'text-green-400';
    if (difficulty <= 6) return 'text-yellow-400';
    if (difficulty <= 8) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'free': return 'bg-green-100 text-green-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'platinum': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className={`flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 
        hover:border-primary-500 hover:bg-slate-700 transition-colors cursor-pointer
        ${!accessible ? 'opacity-50' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* 楽曲情報 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-white truncate">{song.title}</h3>
            {!accessible && (
              <span className="text-xs text-red-400">🔒</span>
            )}
          </div>
          <p className="text-gray-400 text-sm truncate">{song.artist || '不明'}</p>
        </div>

        {/* 楽曲詳細情報 */}
        <div className="flex items-center space-x-3 text-xs">
          {/* 難易度 */}
          {song.difficulty && (
            <div className="flex items-center space-x-1">
              <span className="text-gray-500">難易度:</span>
              <span className={`font-mono ${getDifficultyColor(song.difficulty)}`}>
                {song.difficulty}
              </span>
            </div>
          )}

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
      </div>

      {/* 再生ボタン */}
      <div className="flex items-center ml-4">
        <button
          className={`btn btn-sm ${accessible ? 'btn-primary' : 'btn-outline'} flex items-center space-x-1`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
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
  const { settings, mode } = useGameSelector((s) => ({ 
    settings: s.settings, 
    mode: s.mode 
  }));
  const gameActions = useGameActions();
  
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
          <div className="space-y-4">


            {/* 入力モード選択 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  入力モード
                </label>
                
                {/* ラジオボタン選択 */}
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="input-mode"
                      value="midi"
                      checked={settings.inputMode === 'midi'}
                      onChange={() => gameActions.updateSettings({ inputMode: 'midi' })}
                      className="radio radio-primary"
                    />
                    <span className="text-sm text-white font-medium">🎹 MIDI入力</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="input-mode"
                      value="audio"
                      checked={settings.inputMode === 'audio'}
                      onChange={() => gameActions.updateSettings({ inputMode: 'audio' })}
                      className="radio radio-primary"
                    />
                    <span className="text-sm text-white font-medium">🎤 音声入力</span>
                  </label>
                </div>
              </div>

              {/* MIDI デバイス設定 */}
              {settings.inputMode === 'midi' && (
                <div className="bg-blue-900 bg-opacity-20 p-4 rounded-lg border border-blue-700 border-opacity-30">
                  <h4 className="text-sm font-medium text-blue-200 mb-3">🎹 MIDI デバイス設定</h4>
                  <MidiDeviceSelector
                    value={settings.selectedMidiDevice}
                    onChange={(deviceId: string | null) => gameActions.updateSettings({ selectedMidiDevice: deviceId })}
                  />
                </div>
              )}

              {/* 音声入力設定 */}
              {settings.inputMode === 'audio' && (
                <div className="bg-green-900 bg-opacity-20 p-4 rounded-lg border border-green-700 border-opacity-30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-green-200">🎤 音声入力設定</h4>
                    <div className="text-xs text-green-300 bg-green-800 bg-opacity-50 px-2 py-1 rounded">
                      精度調整中
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* AudioDeviceSelector コンポーネント */}
                    <AudioDeviceSelector
                      value={settings.selectedAudioDevice}
                      onChange={(deviceId: string | null) => gameActions.updateSettings({ selectedAudioDevice: deviceId })}
                    />
                    
                    {/* PYIN感度調整スライダー */}
                    <div>
                      <label className="block text-xs text-green-200 mb-1">
                        ピッチ検出感度: {Math.round((settings.pyinThreshold || 0.1) * 100)}%
                      </label>
                      <div className="text-xs text-green-300 mb-2">
                        低い値ほど敏感に検出（誤検出増加）、高い値ほど厳密に検出
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.5"
                        step="0.05"
                        value={settings.pyinThreshold || 0.1}
                        onChange={(e) => 
                          gameActions.updateSettings({ pyinThreshold: parseFloat(e.target.value) })
                        }
                        className="slider w-full accent-green-400"
                      />
                      <div className="flex justify-between text-xs text-green-400 mt-1">
                        <span>敏感 (5%)</span>
                        <span>標準 (10%)</span>
                        <span>厳密 (50%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
              </label>
              <input
                type="range"
                min="0.5"
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
              </label>
              <select
                value={settings.transposingInstrument}
                onChange={(e) => gameActions.updateSettings({ transposingInstrument: e.target.value as TransposingInstrument })}
                className="select select-bordered w-full max-w-xs bg-gray-800 text-white mb-2"
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
              </label>
              <div className="flex items-center space-x-4 mt-1">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="sheet-music-mode"
                    value="full"
                    checked={!settings.sheetMusicChordsOnly}
                    onChange={() =>
                      gameActions.updateSettings({ sheetMusicChordsOnly: false })
                    }
                    className="radio radio-sm"
                  />
                  <span className="text-sm text-gray-300">ノート+コード</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="sheet-music-mode"
                    value="chords-only"
                    checked={settings.sheetMusicChordsOnly}
                    onChange={() =>
                      gameActions.updateSettings({ sheetMusicChordsOnly: true })
                    }
                    className="radio radio-sm"
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
                    設定は自動的にローカルストレージに保存されます（再生速度は除く）。
                    ブラウザを閉じても設定が保持されます。
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
  const { user, isGuest, hasProfile } = useAuthStore();

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
      {/* マイページ */}
      {hasProfile && (
        <a href="#mypage" className="btn btn-sm btn-ghost text-white hover:text-primary-400">マイページ</a>
      )}
      {/* アカウント */}
      <a href="#account" className="btn btn-sm btn-primary">アカウント</a>
    </div>
  );
};

export default GameScreen;
