import React, { useState } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import GameEngineComponent from './GameEngine';
import ControlBar from './ControlBar';
import { MidiDeviceSelector, AudioDeviceSelector } from '@/components/ui/MidiDeviceManager';
import ResultModal from './ResultModal';
import SheetMusicDisplay from './SheetMusicDisplay';

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
      {/* ヘッダー（展開状態） */}
      {!headerCollapsed && (
        <header
          className="flex-shrink-0 bg-game-surface border-b border-gray-700 px-4 py-2"
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
        <div className="flex-shrink-0 bg-game-surface border-b border-gray-700 px-2 py-1">
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
    <div className="flex-1 p-3 sm:p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">楽曲選択</h2>
        
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
  const { currentSong, mode, settings } = useGameSelector((s) => ({
    currentSong: s.currentSong,
    mode: s.mode,
    settings: s.settings
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
    <div className="flex-1 flex flex-col h-full">
      {/* メインコンテンツエリア - 残りのスペースを使用 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 楽譜表示エリア（上側） - flex-1で余った領域を使用 */}
        <div className="flex-1 min-h-0 border-b border-gray-700 overflow-hidden">
          <SheetMusicDisplay 
            musicXmlUrl={currentSong.musicXmlFile}
            className="h-full"
          />
        </div>
        
        {/* ゲームエンジン（下側） - flex-1で余った領域を使用 */}
        <div className="flex-1 min-h-0">
          <GameEngineComponent className="h-full w-full" />
        </div>
      </div>

      {/* コントロールバー - フレックスボックス内の通常要素として配置 */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-700">
        <ControlBar />
      </div>
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
                ノーツの表示位置と判定タイミングを調整します（早い: -, 遅い: +）
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={settings.timingAdjustment}
                onChange={(e) => 
                  gameActions.updateSettings({ timingAdjustment: parseInt(e.target.value) })
                }
                className="slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-100ms (早い)</span>
                <span>0ms</span>
                <span>+100ms (遅い)</span>
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

            {/* 音名表示設定（統一版） */}
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
                <option value="abc">ABC (C, D, E...)</option>
                <option value="solfege">ドレミ</option>
              </select>


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
                <option value="key_auto">鍵盤ハイライト + オートプレイ</option>
                <option value="key">鍵盤ハイライトのみ</option>
              </select>
              <div className="text-xs text-gray-400 mt-1">
                ノーツが判定ラインを通過する際の表示ガイド
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen; 