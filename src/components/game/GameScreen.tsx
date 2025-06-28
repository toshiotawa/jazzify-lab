import React, { useState } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import GameEngineComponent from './GameEngine';
import ControlBar from './ControlBar';

/**
 * メインゲーム画面コンポーネント
 * ゲームのメインUI要素を統合
 */
const GameScreen: React.FC = () => {
  const { currentTab, currentSong, score, isSettingsOpen } = useGameSelector((s) => ({
    currentTab: s.currentTab,
    currentSong: s.currentSong,
    score: s.score,
    isSettingsOpen: s.isSettingsOpen
  }));

  const gameActions = useGameActions();
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  return (
    <div className="game-container h-screen flex flex-col bg-gradient-game">
      {/* ヘッダー（展開状態） */}
      {!headerCollapsed && (
        <header
          className="flex-shrink-0 bg-game-surface border-b border-gray-700 p-4"
        >
          <div className="flex justify-between items-center">
            {/* タブナビゲーション */}
            <div className="flex space-x-2">
              <TabButton
                active={currentTab === 'practice'}
                onClick={() => gameActions.setCurrentTab('practice')}
              >
                練習モード
              </TabButton>
              <TabButton
                active={currentTab === 'performance'}
                onClick={() => gameActions.setCurrentTab('performance')}
              >
                本番モード
              </TabButton>
              <TabButton
                active={currentTab === 'songs'}
                onClick={() => gameActions.setCurrentTab('songs')}
              >
                曲選択
              </TabButton>
            </div>

            {/* 右側のコントロール */}
            <div className="flex items-center space-x-4">
              {/* スコア表示 */}
              {currentSong && (
                <div className="score-display">
                  スコア: {score.score}
                </div>
              )}

              {/* ヘッダー開閉トグル */}
              <button
                onClick={() => setHeaderCollapsed(true)}
                className="btn btn-secondary btn-xs"
                title="ヘッダーを収納"
              >
                ▲
              </button>

              {/* 設定ボタン */}
              <button
                onClick={() => gameActions.toggleSettings()}
                className="btn btn-secondary btn-sm"
              >
                ⚙️ 設定
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ヘッダー（収納時のミニバー） */}
      {headerCollapsed && (
        <div className="flex-shrink-0 bg-game-surface border-b border-gray-700 px-4 py-1">
          <div className="flex justify-end">
            <button
              onClick={() => setHeaderCollapsed(false)}
              className="btn btn-secondary btn-xs"
              title="ヘッダーを展開"
            >
              ▼
            </button>
          </div>
        </div>
      )}

      {/* メインコンテンツエリア */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentTab === 'songs' ? (
          <SongSelectionScreen />
        ) : (
          <GamePlayScreen />
        )}
      </main>

      {/* 設定パネル（オーバーレイ） */}
      {isSettingsOpen && <SettingsPanel />}
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
      className={`tab ${active ? 'tab-active' : 'tab-inactive'}`}
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

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">楽曲選択</h2>
        
        {/* 楽曲リスト */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Demo-1楽曲カード */}
          <SongCard
            title="Demo-1"
            artist="Jazz Learning Game"
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
          <SongCard
            title="Alice in Wonderland"
            artist="Bill Evans (譜面のみ)"
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
          
          {/* 追加楽曲の予定地 */}
          <EmptySlot text="新しい楽曲を追加予定" />
        </div>
      </div>
    </div>
  );
};

/**
 * ゲームプレイ画面
 */
const GamePlayScreen: React.FC = () => {
  const { currentSong, mode } = useGameSelector((s) => ({
    currentSong: s.currentSong,
    mode: s.mode
  }));
  const gameActions = useGameActions();

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
    <div className="flex-1 flex flex-col">
      {/* Phase 3: ゲームエンジン統合 */}
      <div className="flex-1 p-4">
        <GameEngineComponent className="h-full flex flex-col" />
      </div>

      {/* 新しいコントロールバー（シークバー + 詳細コントロール） */}
      <ControlBar />
    </div>
  );
};

/**
 * 楽曲カードコンポーネント
 */
interface SongCardProps {
  title: string;
  artist: string;
  onSelect: () => void;
}

const SongCard: React.FC<SongCardProps> = ({ title, artist, onSelect }) => {
  return (
    <div 
      className="card hover:border-primary-500 transition-colors cursor-pointer"
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
  const { settings } = useGameSelector((s) => ({ settings: s.settings }));
  const gameActions = useGameActions();

  return (
    <div className="modal-overlay" onMouseDown={(e) => {
      // オーバーレイ部分（背景領域）をクリックした場合のみモーダルを閉じる
      if (e.target === e.currentTarget) {
        gameActions.setSettingsOpen(false);
      }
    }}>
      <div className="modal-content">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">設定</h2>
            <button
              onClick={() => gameActions.setSettingsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="card-body">
          <div className="space-y-4">
            {/* 楽器モード */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                楽器モード
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => gameActions.setInstrumentMode('piano')}
                  className={`btn ${settings.instrumentMode === 'piano' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  🎹 ピアノ
                </button>
                <button
                  onClick={() => gameActions.setInstrumentMode('guitar')}
                  className={`btn ${settings.instrumentMode === 'guitar' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  🎸 ギター
                </button>
              </div>
            </div>

            {/* 音量設定 */}
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
                className="slider"
              />
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

            {/* 鍵盤音名表示 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                鍵盤音名表示
              </label>
              <select
                value={settings.keyboardNoteNameStyle ?? 'abc'}
                onChange={(e) => gameActions.updateSettings({ keyboardNoteNameStyle: e.target.value as any })}
                className="select select-bordered w-full max-w-xs bg-gray-800 text-white"
              >
                <option value="off">OFF</option>
                <option value="abc">ABC</option>
                <option value="solfege">ドレミ</option>
              </select>
            </div>

            {/* ノーツ音名表示 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ノーツ音名表示
              </label>
              <select
                value={settings.noteNoteNameStyle ?? 'abc'}
                onChange={(e) => gameActions.updateSettings({ noteNoteNameStyle: e.target.value as any })}
                className="select select-bordered w-full max-w-xs bg-gray-800 text-white mb-2"
              >
                <option value="off">OFF</option>
                <option value="abc">ABC</option>
                <option value="solfege">ドレミ</option>
              </select>

              {/* # / ♭ 表示選択 */}
              <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="accidental-style"
                    value="sharp"
                    checked={(settings.noteAccidentalStyle ?? 'sharp') === 'sharp'}
                    onChange={() => gameActions.updateSettings({ noteAccidentalStyle: 'sharp' })}
                    className="radio radio-sm"
                  />
                  <span className="text-sm text-gray-300"># 表示</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="accidental-style"
                    value="flat"
                    checked={(settings.noteAccidentalStyle ?? 'sharp') === 'flat'}
                    onChange={() => gameActions.updateSettings({ noteAccidentalStyle: 'flat' })}
                    className="radio radio-sm"
                  />
                  <span className="text-sm text-gray-300">♭ 表示</span>
                </label>
              </div>
            </div>

            {/* 練習モードガイド設定 */}
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
                <option value="key_auto">鍵盤 + オートプレイ</option>
                <option value="key">鍵盤のみ</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen; 