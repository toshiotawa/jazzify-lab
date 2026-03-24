import React, { useState, useEffect, useCallback } from 'react';
import { useGameSelector, useGameActions } from '@/stores/helpers';
import GameEngineComponent from './GameEngine';
import ControlBar from './ControlBar';
import { MidiDeviceSelector, AudioDeviceSelector, AudioOutputDeviceSelector } from '@/components/ui/MidiDeviceManager';
import ResultModal from './ResultModal';
import SheetMusicDisplay from './SheetMusicDisplay';
import ResizeHandle from '@/components/ui/ResizeHandle';
import { getTransposingInstrumentName } from '@/utils/musicXmlTransposer';
import type { TransposingInstrument } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { fetchSongs, fetchGlobalAvailableSongs, MembershipRank, rankAllowed } from '@/platform/supabaseSongs';
import { getChallengeSongs } from '@/platform/supabaseChallenges';
import { FaArrowLeft, FaAward, FaLock, FaMusic } from 'react-icons/fa';
import GameHeader from '@/components/ui/GameHeader';
import KeyClearsModal from '@/components/ui/KeyClearsModal';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { useGeoStore } from '@/stores/geoStore';
import { isIOSWebView, sendGameCallback } from '@/utils/iosbridge';

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
      
      
      if (songId) {
        try {
          // 曲データを取得（レッスン曲は通常曲も使用できるため、すべての曲から検索）
          const songs = await fetchSongs();
          const normalizedSongId = songId.toLowerCase();
          const song = songs.find(s => s.id === normalizedSongId || s.id.toLowerCase() === normalizedSongId);
          
          if (!song) {
            console.error('曲が見つかりません:', songId);
            // エラー時は曲選択画面に戻る
            setIsLoadingLessonSong(false);
            window.location.hash = '#songs';
            return;
          }
          
          // ノーツデータの取得（JSON or MusicXML-only）
          let mapped: any[];
          if (song.json_url) {
            const response = await fetch(song.json_url);
            if (!response.ok) {
              throw new Error(`JSONデータの読み込みに失敗: ${response.status} ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              console.warn('⚠️ JSONでないコンテンツタイプ:', contentType);
            }
            
            const responseText = await response.text();
            
            if (responseText.trim().startsWith('<')) {
              throw new Error('JSONデータの代わりにHTMLが返されました。ファイルパスまたはサーバー設定を確認してください。');
            }
            
            let notesData: any;
            try {
              notesData = JSON.parse(responseText);
            } catch (parseError) {
              throw new Error(`JSONデータの解析に失敗しました: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
            }
            const notes = Array.isArray(notesData) ? notesData : notesData.notes;
            if (!notes || !Array.isArray(notes)) {
              throw new Error('ノーツデータの形式が不正です');
            }
            mapped = notes.map((n: any, idx: number) => ({ 
              id: `${song.id}-${idx}`, 
              time: n.time, 
              pitch: n.pitch 
            }));
          } else if (song.json_data) {
            const notesData = song.json_data;
            const notes = Array.isArray(notesData) ? notesData : notesData.notes;
            if (!notes || !Array.isArray(notes)) {
              throw new Error('ノーツデータの形式が不正です');
            }
            mapped = notes.map((n: any, idx: number) => ({ 
              id: `${song.id}-${idx}`, 
              time: n.time, 
              pitch: n.pitch 
            }));
          } else if (song.xml_url) {
            const { parseMusicXmlToNoteData, overrideMusicXmlTempo } = await import('@/utils/musicXmlToNotes');
            const xmlResponse = await fetch(song.xml_url);
            if (!xmlResponse.ok) {
              throw new Error(`MusicXMLの読み込みに失敗: ${xmlResponse.status}`);
            }
            let xmlText = await xmlResponse.text();
            if (xmlText.trim().startsWith('<html') || xmlText.trim().startsWith('<!DOCTYPE html')) {
              throw new Error('MusicXMLファイルの代わりにHTMLが返されました');
            }
            if (song.bpm && song.bpm > 0) {
              xmlText = overrideMusicXmlTempo(xmlText, song.bpm);
            }
            mapped = parseMusicXmlToNoteData(xmlText, song.id);
          } else {
            throw new Error('曲のノーツデータがありません（JSONまたはMusicXMLが必要です）');
          }

          // 範囲複製曲のフィルタリング
          let rangeAudioStart: number | undefined;
          let rangeAudioEnd: number | undefined;
          if (song.source_song_id && song.range_type) {
            const { filterNotesByTimeRange, filterNotesByMeasureRange } = await import('@/utils/songRangeFilter');
            if (song.range_type === 'time' && song.range_start_time != null && song.range_end_time != null) {
              const result = filterNotesByTimeRange(mapped, song.range_start_time, song.range_end_time, song.audio_start_time, song.audio_end_time, song.audio_padding_seconds ?? 2);
              mapped = result.notes;
              rangeAudioStart = result.audioStartTime;
              rangeAudioEnd = result.audioEndTime;
            } else if (song.range_type === 'measure' && song.range_start_measure != null && song.range_end_measure != null && song.xml_url) {
              const xmlResp = await fetch(song.xml_url);
              if (xmlResp.ok) {
                let xmlTxt = await xmlResp.text();
                if (song.bpm && song.bpm > 0) {
                  const { overrideMusicXmlTempo } = await import('@/utils/musicXmlToNotes');
                  xmlTxt = overrideMusicXmlTempo(xmlTxt, song.bpm);
                }
                const result = await filterNotesByMeasureRange(mapped, xmlTxt, song.range_start_measure, song.range_end_measure, song.audio_padding_measures ?? 1, song.audio_padding_seconds);
                mapped = result.notes;
                rangeAudioStart = result.audioStartTime;
                rangeAudioEnd = result.audioEndTime;
              }
            }
          }
          
          // 音声ファイルの長さを取得
          let duration = 60; // デフォルト値
          if (rangeAudioStart != null && rangeAudioEnd != null) {
            duration = rangeAudioEnd - rangeAudioStart;
          } else if (song.audio_url) {
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
          
          gameActions.stop();
          gameActions.clearSong();
          
          await gameActions.updateSettings({
            transpose: key,
            playbackSpeed: speed,
            showSheetMusic: notation === 'notes_chords' || notation === 'both' || notation === 'chords_only',
            sheetMusicChordsOnly: notation === 'chords_only'
          });
          
          await gameActions.loadSong({
            id: song.id,
            title: song.title,
            artist: song.artist || '',
            bpm: song.bpm ?? undefined,
            duration: duration,
            audioFile: song.audio_url || '',
            musicXmlFile: song.xml_url || null,
            hide_sheet_music: song.hide_sheet_music ?? false,
            use_rhythm_notation: song.use_rhythm_notation ?? false,
            source_song_id: song.source_song_id || null,
            range_type: song.range_type || null,
            range_start_measure: song.range_start_measure ?? null,
            range_end_measure: song.range_end_measure ?? null,
            audio_start_time: rangeAudioStart ?? song.audio_start_time ?? null,
            audio_end_time: rangeAudioEnd ?? song.audio_end_time ?? null,
            hand_filter: song.hand_filter ?? null,
          } as any, mapped);
          
          gameActions.setCurrentTab('practice');
          
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
          const normalizedMissionSongId = songId.toLowerCase();
          const song = songs.find(s => s.id === normalizedMissionSongId || s.id.toLowerCase() === normalizedMissionSongId);
          
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
          
          // ノーツデータの取得（JSON or MusicXML-only）
          let mapped: any[];
          if (song.json_url) {
            const response = await fetch(song.json_url);
            if (!response.ok) {
              throw new Error(`JSONデータの読み込みに失敗: ${response.status} ${response.statusText}`);
            }
            const responseText = await response.text();
            if (responseText.trim().startsWith('<')) {
              throw new Error('JSONデータの代わりにHTMLが返されました。');
            }
            const notesData = JSON.parse(responseText);
            const notes = Array.isArray(notesData) ? notesData : notesData.notes;
            if (!notes || !Array.isArray(notes)) throw new Error('ノーツデータの形式が不正です');
            mapped = notes.map((n: any, idx: number) => ({ 
              id: `${song.id}-${idx}`, time: n.time, pitch: n.pitch 
            }));
          } else if (song.json_data) {
            const notesData = song.json_data;
            const notes = Array.isArray(notesData) ? notesData : notesData.notes;
            if (!notes || !Array.isArray(notes)) throw new Error('ノーツデータの形式が不正です');
            mapped = notes.map((n: any, idx: number) => ({ 
              id: `${song.id}-${idx}`, time: n.time, pitch: n.pitch 
            }));
          } else if (song.xml_url) {
            const { parseMusicXmlToNoteData, overrideMusicXmlTempo } = await import('@/utils/musicXmlToNotes');
            const xmlResponse = await fetch(song.xml_url);
            if (!xmlResponse.ok) throw new Error(`MusicXMLの読み込みに失敗: ${xmlResponse.status}`);
            let xmlText = await xmlResponse.text();
            if (xmlText.trim().startsWith('<html') || xmlText.trim().startsWith('<!DOCTYPE html')) {
              throw new Error('MusicXMLファイルの代わりにHTMLが返されました');
            }
            if (song.bpm && song.bpm > 0) {
              xmlText = overrideMusicXmlTempo(xmlText, song.bpm);
            }
            mapped = parseMusicXmlToNoteData(xmlText, song.id);
          } else {
            throw new Error('曲のノーツデータがありません（JSONまたはMusicXMLが必要です）');
          }

          // 範囲複製曲のフィルタリング
          let mRangeAudioStart: number | undefined;
          let mRangeAudioEnd: number | undefined;
          if (song.source_song_id && song.range_type) {
            const { filterNotesByTimeRange, filterNotesByMeasureRange } = await import('@/utils/songRangeFilter');
            if (song.range_type === 'time' && song.range_start_time != null && song.range_end_time != null) {
              const result = filterNotesByTimeRange(mapped, song.range_start_time, song.range_end_time, song.audio_start_time, song.audio_end_time, song.audio_padding_seconds ?? 2);
              mapped = result.notes;
              mRangeAudioStart = result.audioStartTime;
              mRangeAudioEnd = result.audioEndTime;
            } else if (song.range_type === 'measure' && song.range_start_measure != null && song.range_end_measure != null && song.xml_url) {
              const xmlResp = await fetch(song.xml_url);
              if (xmlResp.ok) {
                let xmlTxt = await xmlResp.text();
                if (song.bpm && song.bpm > 0) {
                  const { overrideMusicXmlTempo } = await import('@/utils/musicXmlToNotes');
                  xmlTxt = overrideMusicXmlTempo(xmlTxt, song.bpm);
                }
                const result = await filterNotesByMeasureRange(mapped, xmlTxt, song.range_start_measure, song.range_end_measure, song.audio_padding_measures ?? 1, song.audio_padding_seconds);
                mapped = result.notes;
                mRangeAudioStart = result.audioStartTime;
                mRangeAudioEnd = result.audioEndTime;
              }
            }
          }
          
          // 音声ファイルの長さを取得
          let duration = 60;
          if (mRangeAudioStart != null && mRangeAudioEnd != null) {
            duration = mRangeAudioEnd - mRangeAudioStart;
          } else if (song.audio_url) {
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
          
          gameActions.stop();
          gameActions.clearSong();
          
          await gameActions.updateSettings({
            transpose: challengeSong.key_offset,
            playbackSpeed: challengeSong.min_speed,
            // notation設定に基づいて表示設定を更新
            showSheetMusic: challengeSong.notation_setting === 'notes_chords' || challengeSong.notation_setting === 'both' || challengeSong.notation_setting === 'chords_only',
            sheetMusicChordsOnly: challengeSong.notation_setting === 'chords_only'
          });
          
          await gameActions.loadSong({
            id: song.id,
            title: song.title,
            artist: song.artist || '',
            bpm: song.bpm ?? undefined,
            duration: duration,
            audioFile: song.audio_url || '',
            musicXmlFile: song.xml_url || null,
            hide_sheet_music: song.hide_sheet_music ?? false,
            use_rhythm_notation: song.use_rhythm_notation ?? false,
            source_song_id: song.source_song_id || null,
            range_type: song.range_type || null,
            range_start_measure: song.range_start_measure ?? null,
            range_end_measure: song.range_end_measure ?? null,
            audio_start_time: mRangeAudioStart ?? song.audio_start_time ?? null,
            audio_end_time: mRangeAudioEnd ?? song.audio_end_time ?? null,
            hand_filter: song.hand_filter ?? null,
          } as any, mapped);
          
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
            touchAction: 'pan-x pan-y pinch-zoom',
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
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });
  const [dbSongs, setDbSongs] = React.useState<any[]>([]);
  const [songStats, setSongStats] = React.useState<Record<string, {clear_count: number; b_rank_plus_count?: number; best_score?: number; best_rank?: string; key_clears?: Record<string, number>}>>({});
  const [lockedSong, setLockedSong] = React.useState<{title:string;min_rank:string}|null>(null);
  const [activeTab, setActiveTab] = React.useState<'bach' | 'parker'>('bach');
  
  const isStandardGlobal = profile?.rank === 'standard_global';

  React.useEffect(() => {
    (async () => {
      try {
        const allSongs = isStandardGlobal
          ? await fetchGlobalAvailableSongs('general')
          : await fetchSongs('general');
        setDbSongs(allSongs);
        
      if (user) {
        const { fetchUserSongStatsMap } = await import('@/platform/unifiedSongProgress');
        const statsMap = await fetchUserSongStatsMap(user.id);
        setSongStats(statsMap);
      }
      } catch (e) {
        console.error('曲一覧取得失敗', e);
      }
    })();
  }, [profile, user, isStandardGlobal]);

  const filteredSongs = React.useMemo(() => {
    const filtered = dbSongs.filter(song => {
      const artist = (song.artist || '').trim().toLowerCase();
      if (activeTab === 'bach') return artist.includes('bach');
      return artist === 'charlie parker';
    });
    filtered.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return filtered;
  }, [dbSongs, activeTab]);

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">{isEnglishCopy ? 'Legend Mode' : 'レジェンドモード'}</h2>
          <div className="text-sm text-gray-400">
            {dbSongs.length} {isEnglishCopy ? 'songs' : '曲'}
          </div>
        </div>

        <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center space-x-2 mb-1">
            <FaMusic className="text-green-400" />
            <h3 className="text-sm font-semibold">{isEnglishCopy ? 'Choose a song to practice' : '楽曲を選んで練習しましょう'}</h3>
          </div>
          <p className="text-gray-300 text-xs sm:text-sm">
            {isEnglishCopy
              ? 'Select a song to start practicing at your own pace. Play along with the original recording.'
              : '楽曲を選択すると練習画面に移動します。原曲の音源に合わせて演奏を楽しみましょう。'}
          </p>
        </div>

        {/* アーティストタブ */}
        <div className="flex gap-2 mb-6">
          <button
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'bach'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-gray-200 border border-slate-700'
            }`}
            onClick={() => setActiveTab('bach')}
          >
            Bach
          </button>
          <button
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'parker'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-gray-200 border border-slate-700'
            }`}
            onClick={() => setActiveTab('parker')}
          >
            Charlie Parker
          </button>
        </div>
        
        {/* 楽曲リスト */}
        <div className="space-y-2">
          {filteredSongs.map((song) => {
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
                    let mapped: any[];

                    // JSONデータの取得（json_urlがある場合はそちらを優先）
                    const hasJson = !!(song.json_url || song.json_data);

                    if (hasJson) {
                      // ---- 既存フロー: JSON からノーツを取得 ----
                      let notesData: any;
                      if (song.json_url) {
                        const response = await fetch(song.json_url);
                        if (!response.ok) {
                          throw new Error(`JSONデータの読み込みに失敗: ${response.status} ${response.statusText}`);
                        }
                        const responseText = await response.text();
                        if (responseText.trim().startsWith('<')) {
                          throw new Error('JSONデータの代わりにHTMLが返されました。ファイルパスまたはサーバー設定を確認してください。');
                        }
                        try {
                          notesData = JSON.parse(responseText);
                        } catch (parseError) {
                          throw new Error(`JSONデータの解析に失敗しました: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
                        }
                      } else {
                        notesData = song.json_data;
                      }
                      const notes = Array.isArray(notesData) ? notesData : notesData.notes;
                      if (!notes || !Array.isArray(notes)) {
                        throw new Error('ノーツデータの形式が不正です');
                      }
                      mapped = notes.map((n: any, idx: number) => ({
                        id: `${song.id}-${idx}`,
                        time: n.time,
                        pitch: n.pitch,
                      }));

                    } else if (song.xml_url) {
                      const { parseMusicXmlToNoteData, overrideMusicXmlTempo } = await import('@/utils/musicXmlToNotes');
                      const xmlResponse = await fetch(song.xml_url);
                      if (!xmlResponse.ok) {
                        throw new Error(`MusicXMLの読み込みに失敗: ${xmlResponse.status}`);
                      }
                      let xmlText = await xmlResponse.text();
                      if (xmlText.trim().startsWith('<html') || xmlText.trim().startsWith('<!DOCTYPE html')) {
                        throw new Error('MusicXMLファイルの代わりにHTMLが返されました');
                      }
                      if (song.bpm && song.bpm > 0) {
                        xmlText = overrideMusicXmlTempo(xmlText, song.bpm);
                      }
                      mapped = parseMusicXmlToNoteData(xmlText, song.id);

                    } else {
                      throw new Error('曲のノーツデータがありません（JSONまたはMusicXMLが必要です）');
                    }

                    // 範囲複製曲のフィルタリング処理
                    let rangeAudioStartTime: number | undefined;
                    let rangeAudioEndTime: number | undefined;
                    if (song.source_song_id && song.range_type) {
                      const { filterNotesByTimeRange, filterNotesByMeasureRange } = await import('@/utils/songRangeFilter');
                      if (song.range_type === 'time' && song.range_start_time != null && song.range_end_time != null) {
                        const result = filterNotesByTimeRange(
                          mapped,
                          song.range_start_time,
                          song.range_end_time,
                          song.audio_start_time,
                          song.audio_end_time,
                          song.audio_padding_seconds ?? 2
                        );
                        mapped = result.notes;
                        rangeAudioStartTime = result.audioStartTime;
                        rangeAudioEndTime = result.audioEndTime;
                      } else if (song.range_type === 'measure' && song.range_start_measure != null && song.range_end_measure != null && song.xml_url) {
                        const xmlResp = await fetch(song.xml_url);
                        if (xmlResp.ok) {
                          let xmlTxt = await xmlResp.text();
                          if (song.bpm && song.bpm > 0) {
                            const { overrideMusicXmlTempo: ovr } = await import('@/utils/musicXmlToNotes');
                            xmlTxt = ovr(xmlTxt, song.bpm);
                          }
                          const result = await filterNotesByMeasureRange(
                            mapped,
                            xmlTxt,
                            song.range_start_measure,
                            song.range_end_measure,
                            song.audio_padding_measures ?? 1,
                            song.audio_padding_seconds
                          );
                          mapped = result.notes;
                          rangeAudioStartTime = result.audioStartTime;
                          rangeAudioEndTime = result.audioEndTime;
                        }
                      }
                    }
                    
                    // 音声ファイルの長さを取得（audio_urlがある場合）
                    let duration = 60; // デフォルト値
                    if (rangeAudioStartTime != null && rangeAudioEndTime != null) {
                      duration = rangeAudioEndTime - rangeAudioStartTime;
                    } else if (song.audio_url) {
                      try {
                        const audio = new Audio(song.audio_url);
                        audio.crossOrigin = 'anonymous';
                        await new Promise((resolve) => {
                            const loadedHandler = () => {
                              duration = Math.floor(audio.duration) || 60;
                              resolve(void 0);
                            };
                          const errorHandler = () => {
                            resolve(void 0);
                          };
                          audio.addEventListener('loadedmetadata', loadedHandler);
                          audio.addEventListener('error', errorHandler);
                          setTimeout(() => resolve(void 0), 3000);
                          audio.load();
                        });
                      } catch {
                        // 音声ファイルの処理エラーは無視
                      }
                    } else if (!hasJson && song.xml_url) {
                      const lastNote = mapped[mapped.length - 1];
                      if (lastNote) {
                        duration = Math.ceil(lastNote.time + 4);
                      }
                    }
                    
                    // SongMetadata形式に変換
                    const songMetadata: any = {
                      id: song.id,
                      title: song.title,
                      artist: song.artist || '',
                      bpm: song.bpm ?? undefined,
                      duration: duration,
                      audioFile: song.audio_url || '',
                      notesFile: song.json_url || '',
                      musicXmlFile: song.xml_url || '',
                      genreCategory: 'database',
                      hide_sheet_music: song.hide_sheet_music ?? false,
                      use_rhythm_notation: song.use_rhythm_notation ?? false,
                      source_song_id: song.source_song_id || null,
                      range_type: song.range_type || null,
                      hand_filter: song.hand_filter ?? null,
                      range_start_measure: song.range_start_measure ?? null,
                      range_end_measure: song.range_end_measure ?? null,
                      audio_start_time: rangeAudioStartTime ?? song.audio_start_time ?? null,
                      audio_end_time: rangeAudioEndTime ?? song.audio_end_time ?? null,
                    };
                    
                    // 曲をロード（非同期処理）
                    await gameActions.loadSong(songMetadata, mapped);
                    
                    // 曲のロード後、少し遅延してからタブを切り替えることで
                    // 確実に画面遷移を行う
                    setTimeout(() => {
                      gameActions.setCurrentTab('performance');
                      window.location.hash = '#performance';
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
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
            onClick={() => setLockedSong(null)}
          >
            <div
              className="bg-slate-900 border border-slate-600 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <FaLock className="text-blue-400 text-lg" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {isEnglishCopy ? 'Song Locked' : 'この曲はプレイできません'}
                </h3>
              </div>
              <p className="text-gray-300 text-sm mb-2">
                {isEnglishCopy
                  ? `${lockedSong.title} requires ${lockedSong.min_rank.toUpperCase()} plan or higher.`
                  : `${lockedSong.title} は ${lockedSong.min_rank.toUpperCase()} プラン以上でプレイ可能です。`}
              </p>
              <p className="text-gray-400 text-sm mb-6">
                {isEnglishCopy
                  ? 'Upgrade your plan to unlock this song.'
                  : 'プランのアップグレードでこの曲を解放できます。'}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-300 text-sm transition-colors"
                  onClick={() => setLockedSong(null)}
                >
                  {isEnglishCopy ? 'Cancel' : 'キャンセル'}
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                  onClick={() => {
                    setLockedSong(null);
                    window.location.hash = '#account?tab=subscription';
                  }}
                >
                  {isEnglishCopy ? 'Upgrade Plan' : 'プランのアップグレード'}
                </button>
              </div>
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
  const { currentSong, mode, settings, lessonContext, missionContext, musicXml } = useGameSelector((s) => ({
    currentSong: s.currentSong,
    mode: s.mode,
    settings: s.settings,
    lessonContext: s.lessonContext,
    missionContext: s.missionContext,
    musicXml: s.musicXml
  }));
  const gameActions = useGameActions();
  const { profile: gpProfile } = useAuthStore();
  const gpGeoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: gpProfile?.rank, country: gpProfile?.country ?? gpGeoCountry, preferredLocale: gpProfile?.preferred_locale });
  
  // 楽譜エリアの高さ比率を管理（パーセンテージ）- localStorageで保持
  const [sheetMusicHeightPercentage, setSheetMusicHeightPercentage] = useState(() => {
    try {
      const saved = localStorage.getItem('legend_sheet_height_pct');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 5 && val <= 95) return val;
      }
    } catch { /* ignore */ }
    return 30;
  });
  
  // 楽譜エリアの高さ変更時のハンドラー（localStorageに保存）
  const handleSheetMusicResize = useCallback((newPercentage: number) => {
    setSheetMusicHeightPercentage(newPercentage);
    try {
      localStorage.setItem('legend_sheet_height_pct', String(newPercentage));
    } catch { /* ignore */ }
  }, []);

  if (!currentSong) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl text-gray-300 mb-4">{isEnglishCopy ? 'Select a song' : '楽曲を選択してください'}</h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => gameActions.setCurrentTab('songs')}
                className="btn btn-primary"
              >
                {isEnglishCopy ? 'Go to Song Selection' : '楽曲選択に移動'}
              </button>
              <button
                onClick={async () => {
                  try {
                    const { initializeAudioSystem } = await import('@/utils/MidiController');
                    await initializeAudioSystem();
                  } catch (error) {
                    console.error('Manual audio system initialization failed:', error);
                    alert(isEnglishCopy ? 'Failed to initialize audio system. Please reload the page.' : '音声システムの初期化に失敗しました。ページを再読み込みしてください。');
                  }
                }}
                className="btn btn-secondary text-sm"
              >
                {isEnglishCopy ? 'Initialize Audio' : '音声システム初期化'}
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
        {/* 楽譜表示エリア（上側） - 楽譜表示ON かつ hide_sheet_music でない かつ musicXml がある場合のみ表示 */}
        {settings.showSheetMusic && !currentSong?.hide_sheet_music && !!musicXml && (
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
            height: (settings.showSheetMusic && !currentSong?.hide_sheet_music && !!musicXml) ? `${100 - sheetMusicHeightPercentage}%` : '100%'
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

        {/* iOS: 設定・楽譜ボタンをゲーム部分にフローティング表示 */}
        {isIOSWebView() && <IOSGameOverlayButtons />}
      </div>

      {/* コントロールバー - フレックスボックス内の通常要素として配置 */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-700">
        <ControlBar />
      </div>
    </div>
  );
};

/**
 * iOS: ゲーム画面上の設定・楽譜フローティングボタン
 */
const IOSGameOverlayButtons: React.FC = () => {
  const { settings } = useGameSelector((s) => ({ settings: s.settings }));
  const gameActions = useGameActions();

  return (
    <div className="absolute left-2 bottom-2 z-20 flex flex-col gap-2">
      <button
        onClick={() => gameActions.toggleSettings()}
        className="w-10 h-10 flex items-center justify-center bg-gray-800/80 hover:bg-gray-700 rounded-lg text-white shadow-lg backdrop-blur-sm"
        aria-label="Settings"
      >
        <span className="text-base">⚙</span>
      </button>
      <button
        onClick={() => gameActions.updateSettings({ showSheetMusic: !settings.showSheetMusic })}
        className={`w-10 h-10 flex items-center justify-center rounded-lg text-white shadow-lg backdrop-blur-sm ${
          settings.showSheetMusic ? 'bg-blue-600/80' : 'bg-gray-800/80 hover:bg-gray-700'
        }`}
        aria-label="Toggle Sheet Music"
      >
        <FaMusic className="text-sm" />
      </button>
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
  const { profile: mtProfile } = useAuthStore();
  const mtGeoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: mtProfile?.rank, country: mtProfile?.country ?? mtGeoCountry, preferredLocale: mtProfile?.preferred_locale });

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
          title={isEnglishCopy ? 'Practice Mode (Rehearsal)' : '練習モード（リハーサル）'}
        >
          {isEnglishCopy ? 'Rehrs' : 'リハ'}
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
          title={isEnglishCopy ? 'Performance Mode (Stage)' : '本番モード（ステージ）'}
        >
          {isEnglishCopy ? 'Stage' : 'ステージ'}
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
  const { profile: lbProfile } = useAuthStore();
  const lbGeoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: lbProfile?.rank, country: lbProfile?.country ?? lbGeoCountry, preferredLocale: lbProfile?.preferred_locale });

  // レッスンコンテキストがない場合は何も表示しない
  if (!lessonContext) {
    return null;
  }

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
      <button
        onClick={() => {
          if (isIOSWebView()) { sendGameCallback('gameEnd'); return; }
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
        title={isEnglishCopy ? 'Back to Lesson' : 'レッスンに戻る'}
      >
        <FaArrowLeft className="w-3 h-3" />
        <span>{isEnglishCopy ? 'Back to Lesson' : 'レッスンに戻る'}</span>
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
  const { profile: mbProfile } = useAuthStore();
  const mbGeoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: mbProfile?.rank, country: mbProfile?.country ?? mbGeoCountry, preferredLocale: mbProfile?.preferred_locale });

  // ミッションコンテキストがない場合は何も表示しない
  if (!missionContext) {
    return null;
  }

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
      <button
        onClick={() => {
          if (isIOSWebView()) { sendGameCallback('gameEnd'); return; }
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
        title={isEnglishCopy ? 'Back to Missions' : 'ミッションに戻る'}
      >
        <FaArrowLeft className="w-3 h-3" />
        <span>{isEnglishCopy ? 'Back to Missions' : 'ミッションに戻る'}</span>
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
  stats?: {clear_count: number; b_rank_plus_count?: number; best_score?: number; best_rank?: string; key_clears?: Record<string, number>};
  onSelect: () => void;
}

const SongListItem: React.FC<SongListItemProps> = ({ song, accessible, stats, onSelect }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showKeyClearsModal, setShowKeyClearsModal] = React.useState(false);
  const { profile: slProfile } = useAuthStore();
  const slGeoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: slProfile?.rank, country: slProfile?.country ?? slGeoCountry, preferredLocale: slProfile?.preferred_locale });



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

  const getDifficultyLabel = (value?: number) => {
    if (value === 1) return 'Very Easy';
    if (value === 2) return 'Easy';
    if (value === 3) return 'Normal';
    if (value === 4) return 'Hard';
    if (value === 5) return 'Very Hard';
    return '';
  };

  const getDifficultyBadgeClass = (value?: number) => {
    if (value === 1) return 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/40';
    if (value === 2) return 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/40';
    if (value === 3) return 'bg-violet-500/15 text-violet-300 border border-violet-400/40';
    if (value === 4) return 'bg-orange-500/15 text-orange-300 border border-orange-400/40';
    if (value === 5) return 'bg-rose-500/15 text-rose-300 border border-rose-400/40';
    return 'bg-slate-600/20 text-slate-300 border border-slate-500/40';
  };

  const handleClick = async () => {
    if (isLoading) return;
    if (!accessible) {
      onSelect();
      return;
    }
    
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
            {song.difficulty != null && song.difficulty > 0 && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${getDifficultyBadgeClass(song.difficulty)}`}>
                {getDifficultyLabel(song.difficulty)}
              </span>
            )}
            {!accessible && (
              <span className="text-xs text-red-400">🔒</span>
            )}
            {isLoading && (
              <span className="text-xs text-blue-400">{isEnglishCopy ? 'Loading...' : '読み込み中...'}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-gray-400 text-sm truncate">{song.artist || (isEnglishCopy ? 'Unknown' : '不明')}</p>
            {song.phrase && <span className="text-xs bg-pink-600/20 text-pink-400 px-1.5 py-0.5 rounded">Phrase</span>}
            {song.jazz_piano && <span className="text-xs bg-amber-600/20 text-amber-400 px-1.5 py-0.5 rounded">Jazz Piano</span>}
            {song.classic_piano && <span className="text-xs bg-indigo-600/20 text-indigo-400 px-1.5 py-0.5 rounded">Classic Piano</span>}
            {song.solo_transcription && <span className="text-xs bg-teal-600/20 text-teal-400 px-1.5 py-0.5 rounded">Solo Transcription</span>}
          </div>
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
          const s = stats ?? { clear_count: 0, b_rank_plus_count: 0, best_score: undefined, best_rank: undefined, key_clears: {} };
          return (
          <div className="space-y-2 text-xs mt-2">
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center space-x-1 hover:bg-slate-600 rounded px-1 py-0.5 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowKeyClearsModal(true);
                }}
                title={isEnglishCopy ? 'Show clears by key' : 'キー別クリア回数を表示'}
              >
                <span className="text-gray-500">{isEnglishCopy ? 'Clears:' : 'クリア回数:'}</span>
                <span className="font-mono text-green-400 underline decoration-dotted underline-offset-2">{s.clear_count}{isEnglishCopy ? '' : '回'}</span>
              </button>
              {s.best_rank && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">{isEnglishCopy ? 'Best Rank:' : '最高ランク:'}</span>
                  <span className="font-mono text-yellow-400">{s.best_rank}</span>
                </div>
              )}
              {s.best_score && (
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">{isEnglishCopy ? 'High Score:' : 'ハイスコア:'}</span>
                  <span className="font-mono text-blue-400">{s.best_score.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {/* B-rank+ clear count progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{isEnglishCopy ? 'B-rank+ Clears:' : 'Bランク以上クリア:'}</span>
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
                  {isEnglishCopy ? 'Goal Achieved!' : '目標達成！'}
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
          <span className="hidden sm:inline">{isEnglishCopy ? 'Play' : 'プレイ'}</span>
        </button>
      </div>

      {/* キー別クリア回数モーダル */}
      <KeyClearsModal
        isOpen={showKeyClearsModal}
        onClose={() => setShowKeyClearsModal(false)}
        songTitle={song.title || (isEnglishCopy ? 'Unknown Song' : '不明な曲')}
        keyClears={stats?.key_clears || {}}
      />
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
  const { profile: spProfile } = useAuthStore();
  const spGeoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: spProfile?.rank, country: spProfile?.country ?? spGeoCountry, preferredLocale: spProfile?.preferred_locale });
  
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
    if (window.confirm(isEnglishCopy ? 'Reset settings to default? This cannot be undone.' : '設定をデフォルトにリセットしますか？この操作は取り消せません。')) {
      gameActions.resetSettings();
      setHasStoredSettings(false);
    }
  };
  
  // ローカルストレージをクリアする関数
  const handleClearStorage = () => {
    if (window.confirm(isEnglishCopy ? 'Delete saved settings? This cannot be undone.' : '保存された設定を削除しますか？この操作は取り消せません。')) {
      try {
        localStorage.removeItem('jazzgame_settings');
        setHasStoredSettings(false);
        alert(isEnglishCopy ? 'Saved settings have been deleted.' : '保存された設定を削除しました。');
      } catch (error) {
        console.error('Failed to delete localStorage:', error);
        alert(isEnglishCopy ? 'Failed to delete settings.' : '設定の削除に失敗しました。');
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
            <h2 className="text-xl font-bold text-white">{isEnglishCopy ? 'Settings' : '設定'}</h2>
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
                  {isEnglishCopy ? 'Stage Mode - Constraints Active' : '本番モード - 課題条件適用中'}
                  {isStageWithLessonConstraints && (isEnglishCopy ? ' (Lesson)' : '（レッスン）')}
                  {isStageWithMissionConstraints && (isEnglishCopy ? ' (Mission)' : '（ミッション）')}
                </h3>
              </div>
              <div className="text-sm text-amber-200 space-y-1">
                <p>
                  {isStageWithLessonConstraints && (isEnglishCopy ? 'Settings are locked by lesson constraints.' : 'レッスンの課題条件に従って設定が固定されています。')}
                  {isStageWithMissionConstraints && (isEnglishCopy ? 'Settings are locked by mission constraints.' : 'ミッションの課題条件に従って設定が固定されています。')}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                  {(lessonContext?.clearConditions.key !== undefined || missionContext?.clearConditions?.key !== undefined) && (
                    <div className="flex justify-between">
                      <span>{isEnglishCopy ? 'Key:' : 'キー設定:'}</span>
                      <span className="font-mono text-amber-300">
                        {(() => {
                          const key = lessonContext?.clearConditions.key ?? missionContext?.clearConditions?.key ?? 0;
                          return key > 0 ? `+${key}` : key;
                        })()}{isEnglishCopy ? ' semitones' : '半音'}
                      </span>
                    </div>
                  )}
                  {(lessonContext?.clearConditions.speed !== undefined || missionContext?.clearConditions?.speed !== undefined) && (
                    <div className="flex justify-between">
                      <span>{isEnglishCopy ? 'Speed:' : '再生速度:'}</span>
                      <span className="font-mono text-amber-300">
                        {lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0}x{isEnglishCopy ? ' or higher' : '倍速以上'}
                      </span>
                    </div>
                  )}
                  {(lessonContext?.clearConditions.rank || missionContext?.clearConditions?.rank) && (
                    <div className="flex justify-between">
                      <span>{isEnglishCopy ? 'Required Rank:' : '必要ランク:'}</span>
                      <span className="font-mono text-amber-300">
                        {lessonContext?.clearConditions.rank ?? missionContext?.clearConditions?.rank ?? 'B'}{isEnglishCopy ? ' or higher' : '以上'}
                      </span>
                    </div>
                  )}
                  
                  {(lessonContext?.clearConditions.notation_setting || missionContext?.clearConditions?.notation_setting) && (
                    <div className="flex justify-between">
                      <span>{isEnglishCopy ? 'Notation:' : '楽譜表示:'}</span>
                      <span className="font-mono text-amber-300">
                        {(() => {
                          const notation = lessonContext?.clearConditions.notation_setting ?? missionContext?.clearConditions?.notation_setting;
                          return notation === 'notes_chords' ? (isEnglishCopy ? 'Notes + Chords' : 'ノート+コード') :
                                 notation === 'chords_only' ? (isEnglishCopy ? 'Chords Only' : 'コードのみ') :
                                 (isEnglishCopy ? 'Notes + Chords' : 'ノート+コード');
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-amber-400">
                  {isEnglishCopy ? '💡 Switch to Practice mode to freely change settings' : '💡 練習モードに切り替えると設定を自由に変更できます'}
                </div>
              </div>
            </div>
          )}

            <div className="space-y-4">
              {/* 入力デバイス */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {isEnglishCopy ? 'Input Method' : '入力方式'}
                  </label>
                  <p className="text-xs text-gray-400 mb-3">
                    {isEnglishCopy ? 'Choose MIDI (keyboard) or voice input (microphone).' : 'MIDI（キーボード）または音声入力（マイク）を選択できます。'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => gameActions.updateSettings({ inputMethod: 'midi' })}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.inputMethod === 'midi'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      🎹 MIDI
                    </button>
                    <button
                      type="button"
                      onClick={() => gameActions.updateSettings({ inputMethod: 'voice' })}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        settings.inputMethod === 'voice'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      🎤 {isEnglishCopy ? 'Voice' : '音声'}
                    </button>
                  </div>
                </div>

                {/* MIDI デバイス設定 */}
                {settings.inputMethod === 'midi' && (
                  <div className="bg-blue-900 bg-opacity-20 p-4 rounded-lg border border-blue-700 border-opacity-30">
                    <h4 className="text-sm font-medium text-blue-200 mb-3">🎹 {isEnglishCopy ? 'MIDI Device Settings' : 'MIDI デバイス設定'}</h4>
                    <MidiDeviceSelector
                      value={settings.selectedMidiDevice}
                      onChange={(deviceId: string | null) => gameActions.updateSettings({ selectedMidiDevice: deviceId })}
                    />
                  </div>
                )}

                {/* 音声入力デバイス設定 */}
                {settings.inputMethod === 'voice' && (
                  <div className="bg-purple-900 bg-opacity-20 p-4 rounded-lg border border-purple-700 border-opacity-30">
                    <h4 className="text-sm font-medium text-purple-200 mb-3">🎤 {isEnglishCopy ? 'Voice Input Settings' : '音声入力設定'}</h4>
                    <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 border-opacity-40 rounded p-2 mb-3">
                      <p className="text-xs text-yellow-300">
                        ⚠️ {isEnglishCopy
                          ? 'Single-note detection only. Chord detection is inaccurate.'
                          : '単音での読み取り専用です。和音の読み取りは不正確です。'}
                      </p>
                    </div>
                    <div className="bg-orange-900 bg-opacity-30 border border-orange-600 border-opacity-40 rounded p-2 mb-3">
                      <p className="text-xs text-orange-300">
                        🎵 {isEnglishCopy
                          ? 'Chords cannot be recognized simultaneously. Notes in a chord must be played one at a time for detection.'
                          : '和音を同時に認識することはできません。コードの構成音を一音ずつ鳴らして認識させてください。'}
                      </p>
                    </div>
                    <div className="bg-purple-900 bg-opacity-30 border border-purple-600 border-opacity-40 rounded p-2 mb-3">
                      <p className="text-xs text-purple-300">
                        💡 {isEnglishCopy
                          ? 'Voice input has latency. We recommend shifting note timing to + (later) in timing adjustment.'
                          : '音声入力にはレイテンシがあるため、タイミング調整で+（遅く）方向にずらすことをおすすめします。'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      {isEnglishCopy ? 'Detect pitch using a microphone. Works on iOS/Android.' : 'マイクを使用してピッチを検出します。iOS/Android対応。'}
                    </p>
                    <AudioDeviceSelector
                      value={settings.selectedAudioDevice}
                      onChange={(deviceId: string | null) => gameActions.updateSettings({ selectedAudioDevice: deviceId })}
                    />
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        {isEnglishCopy ? 'Voice Recognition Sensitivity' : '音声認識の感度'}: {settings.voiceSensitivity}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={settings.voiceSensitivity}
                        onChange={(e) => gameActions.updateSettings({ voiceSensitivity: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{isEnglishCopy ? 'Low (noise resistant)' : '低（ノイズ耐性）'}</span>
                        <span>{isEnglishCopy ? 'High (sensitive)' : '高（高感度）'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 音声出力デバイス設定（プレイバック） */}
              <div className="bg-slate-900 bg-opacity-20 p-4 rounded-lg border border-slate-700 border-opacity-30">
                <h4 className="text-sm font-medium text-slate-200 mb-3">🔈 {isEnglishCopy ? 'Audio Output (Playback)' : '音声出力（プレイバック）'}</h4>
                <p className="text-xs text-gray-400 mb-3">
                  {isEnglishCopy ? 'Select playback output device on supported browsers (may not work on iOS Safari).' : '対応ブラウザでは再生の出力先を選択できます（iOS Safari では未対応の場合があります）。'}
                </p>
                <AudioOutputDeviceSelector
                  value={settings.selectedAudioOutputDevice}
                  onChange={(deviceId: string | null) => gameActions.updateSettings({ selectedAudioOutputDevice: deviceId })}
                />
              </div>

            {/* 音量設定 */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {isEnglishCopy ? 'Music Volume' : '音楽音量'}: {Math.round(settings.musicVolume * 100)}%
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
                  {isEnglishCopy ? 'MIDI Volume' : 'MIDI音量'}: {Math.round(settings.midiVolume * 100)}%
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
                <p className="text-xs text-gray-500 mt-1">
                  {isEnglishCopy
                    ? 'If the piano sound is delayed, set the volume to 0% and play audio from your own device or DAW.'
                    : 'ピアノの音が遅れて聴こえる際は、ピアノ音量を0％にして、ご自身のデバイスもしくはDAWから音を鳴らしてください。'}
                </p>
              </div>
            </div>

            {/* ノーツスピード */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {isEnglishCopy ? 'Notes Speed' : 'ノーツスピード'}: {settings.notesSpeed}x
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
                {isEnglishCopy ? 'Playback Speed' : '再生スピード'}: {Math.round(settings.playbackSpeed * 100)}%
                {(isStageWithLessonConstraints && lessonContext?.clearConditions.speed !== undefined) || 
                 (isStageWithMissionConstraints && missionContext?.clearConditions?.speed !== undefined) && (
                  <span className="ml-2 text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded">
                    {isEnglishCopy ? `Min ${lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0}x` : `最低${lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0}倍速`}
                  </span>
                )}
              </label>
              {(isStageWithLessonConstraints && lessonContext?.clearConditions.speed !== undefined) || 
               (isStageWithMissionConstraints && missionContext?.clearConditions?.speed !== undefined) && (
                <div className="text-xs text-amber-300 mb-2 bg-amber-900/10 p-2 rounded border border-amber-600/30">
                  {isEnglishCopy
                    ? `🎯 Constraint: ${lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0}x speed or higher required (adjustable above ${lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0}x in Stage mode)`
                    : `🎯 課題条件: ${lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0}倍速以上が必要（本番モードでは${lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0}倍速以上で変更可能）`}
                </div>
              )}
              <input
                type="range"
                min={((isStageWithLessonConstraints && lessonContext?.clearConditions.speed !== undefined) || 
                      (isStageWithMissionConstraints && missionContext?.clearConditions?.speed !== undefined))
                     ? (lessonContext?.clearConditions.speed ?? missionContext?.clearConditions?.speed ?? 1.0).toString() 
                     : "0.5"}
                max="2.5"
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
                {isEnglishCopy ? 'Timing Adjustment (display & judgment)' : '表示タイミング調整 (判定も同期)'}: {settings.timingAdjustment > 0 ? '+' : ''}{settings.timingAdjustment}ms
              </label>
              <div className="text-xs text-gray-400 mb-2">
                {isEnglishCopy ? 'Adjust note display and judgment timing (earlier: -, later: +)' : 'ノーツの表示位置と判定タイミングを調整します（早く: -, 遅く: +）'}
              </div>
              {settings.inputMethod === 'voice' && (
                <div className="bg-purple-900 bg-opacity-30 border border-purple-600 border-opacity-40 rounded p-2 mb-2">
                  <p className="text-xs text-purple-300">
                    🎤 {isEnglishCopy
                      ? 'Using voice input: we recommend shifting to + (later) to compensate for microphone latency.'
                      : '音声入力使用中: マイクのレイテンシを補正するため、+（遅く）方向への調整をおすすめします。'}
                  </p>
                </div>
              )}
              <input
                type="range"
                min="-400"
                max="400"
                step="1"
                value={settings.timingAdjustment}
                onChange={(e) => 
                  gameActions.updateSettings({ timingAdjustment: parseInt(e.target.value) })
                }
                className="slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-400ms {isEnglishCopy ? '(earlier)' : '(早く)'}</span>
                <span>0ms</span>
                <span>+400ms {isEnglishCopy ? '(later)' : '(遅く)'}</span>
              </div>
            </div>

            {/* オクターブ違い許容設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {isEnglishCopy ? 'Accept octave-shifted notes as correct' : 'オクターブ違いの音を正解にする'}
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
                {isEnglishCopy ? 'Transposing Instrument' : '移調楽器設定'}
                {(isStageWithLessonConstraints && lessonContext?.clearConditions.key !== undefined) || 
                 (isStageWithMissionConstraints && missionContext?.clearConditions?.key !== undefined) && (
                  <span className="ml-2 text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded">
                    {isEnglishCopy ? 'Locked in Stage' : '本番モード固定'}
                  </span>
                )}
              </label>
              {(isStageWithLessonConstraints && lessonContext?.clearConditions.key !== undefined) || 
               (isStageWithMissionConstraints && missionContext?.clearConditions?.key !== undefined) && (
                <div className="text-xs text-amber-300 mb-2 bg-amber-900/10 p-2 rounded border border-amber-600/30">
                  {isEnglishCopy ? '🎯 Constraint: Key setting is locked (cannot change in Stage mode)' : '🎯 課題条件: キー設定が固定されています（本番モードでは変更不可）'}
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
                <option value="concert_pitch">{isEnglishCopy ? 'Concert Pitch (no transposition)' : 'コンサートピッチ（移調なし）'}</option>
                <option value="bb_major_2nd">{isEnglishCopy ? 'in Bb (M2 up) Soprano Sax, Trumpet, Clarinet' : 'in Bb (長2度上) ソプラノサックス、トランペット、クラリネット'}</option>
                <option value="bb_major_9th">{isEnglishCopy ? 'in Bb (oct+M2 up) Tenor Sax' : 'in Bb (1オクターブ+長2度上) テナーサックス'}</option>
                <option value="eb_major_6th">{isEnglishCopy ? 'in Eb (M6 up) Alto Sax' : 'in Eb (長6度上) アルトサックス'}</option>
                <option value="eb_major_13th">{isEnglishCopy ? 'in Eb (oct+M6 up) Baritone Sax' : 'in Eb (1オクターブ+長6度上) バリトンサックス'}</option>
              </select>
              <div className="text-xs text-gray-400 mt-1">
                {isEnglishCopy ? 'Sheet music is transposed for the selected instrument. The keyboard stays in concert pitch.' : '選択した楽器に応じて楽譜が移調されます。鍵盤はコンサートピッチ（C調）のまま表示されます。'}<br/>
                <span className="text-yellow-300">{isEnglishCopy ? '+semitones = sheet music is transposed up by that amount' : '+半音数 = 楽譜がその分高く移調されます'}</span>
              </div>
            </div>

            {/* 簡易表示ON/OFF */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {isEnglishCopy ? 'Simplified Display' : '簡易表示'}
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
                {isEnglishCopy ? 'When ON, complex note names (enharmonics, double sharps, etc.) are simplified.' : 'ONにすると、複雑な音名（異名同音、ダブルシャープ等）が基本的な音名に変換されて表示されます。'}<br />
                <strong>{isEnglishCopy ? 'Applied to PIXI notes, keyboard, and OSMD sheet music.' : 'PIXIノーツ、鍵盤、OSMD楽譜のすべてに適用されます。'}</strong>
              </div>
            </div>

            {/* 音名表示設定 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {isEnglishCopy ? 'Note Names (keyboard & notes)' : '音名表示（鍵盤・ノーツ共通）'}
              </label>
              <select
                value={settings.noteNameStyle}
                onChange={(e) => gameActions.updateSettings({ noteNameStyle: e.target.value as any })}
                className="select select-bordered w-full max-w-xs bg-gray-800 text-white mb-2"
              >
                <option value="off">OFF</option>
                <option value="abc">{isEnglishCopy ? 'English (C, D, E...)' : '英語 (C, D, E...)'}</option>
                <option value="solfege">{isEnglishCopy ? 'Solfege (Do, Re, Mi...)' : 'ドレミ'}</option>
              </select>
              <div className="text-xs text-gray-400 mt-1">
                {settings.transposingInstrument !== 'concert_pitch' && 
                  <div>{isEnglishCopy ? `Note names are transposed for ${getTransposingInstrumentName(settings.transposingInstrument)}.` : `音名は${getTransposingInstrumentName(settings.transposingInstrument)}用に移調されて表示されます。`}</div>
                }
              </div>
            </div>

            {/* 楽譜表示モード */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {isEnglishCopy ? 'Sheet Music' : '楽譜表示'}
                {(isStageWithLessonConstraints && lessonContext?.clearConditions.notation_setting) || 
                 (isStageWithMissionConstraints && missionContext?.clearConditions?.notation_setting) && (
                  <span className="ml-2 text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded">
                    {isEnglishCopy ? 'Locked in Stage' : '本番モード固定'}
                  </span>
                )}
              </label>
              {(isStageWithLessonConstraints && lessonContext?.clearConditions.notation_setting) || 
               (isStageWithMissionConstraints && missionContext?.clearConditions?.notation_setting) && (
                <div className="text-xs text-amber-300 mb-2 bg-amber-900/10 p-2 rounded border border-amber-600/30">
                  {isEnglishCopy ? '🎯 Constraint: ' : '🎯 課題条件: '}{
                    (() => {
                      const notation = lessonContext?.clearConditions.notation_setting ?? missionContext?.clearConditions?.notation_setting;
                      return notation === 'notes_chords' ? (isEnglishCopy ? 'Notes + Chords display' : 'ノート+コード表示') :
                             notation === 'chords_only' ? (isEnglishCopy ? 'Chords Only display' : 'コードのみ表示') :
                             (isEnglishCopy ? 'Notes + Chords display' : 'ノート+コード表示');
                    })()
                  }{isEnglishCopy ? ' required (locked in Stage mode)' : 'が必要（本番モードでは固定）'}
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
                  <span className="text-sm text-gray-300">{isEnglishCopy ? 'Notes + Chords' : 'ノート+コード'}</span>
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
                  <span className="text-sm text-gray-300">{isEnglishCopy ? 'Chords Only' : 'コードのみ'}</span>
                </label>
              </div>
            </div>

            {/* 練習モードガイド設定 - 練習モード時のみ表示 */}
            {mode === 'practice' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {isEnglishCopy ? 'Practice Mode Guide' : '練習モードガイド'}
                </label>
                <select
                  value={settings.practiceGuide ?? 'key'}
                  onChange={(e) => gameActions.updateSettings({ practiceGuide: e.target.value as any })}
                  className="select select-bordered w-full max-w-xs bg-gray-800 text-white"
                >
                  <option value="off">OFF</option>
                  <option value="key_auto">{isEnglishCopy ? 'Key Highlight + Autoplay' : '鍵盤ハイライト + オートプレイ'}</option>
                  <option value="key">{isEnglishCopy ? 'Key Highlight Only' : '鍵盤ハイライトのみ'}</option>
                </select>
                <div className="text-xs text-gray-400 mt-1">
                  {isEnglishCopy ? 'Visual guide when notes pass the judgment line (Practice mode only)' : 'ノーツが判定ラインを通過する際の表示ガイド（練習モード専用）'}
                </div>
              </div>
            )}

            {/* ローカルストレージ管理セクション */}
            <div className="border-t border-gray-600 pt-4 mt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">💾 {isEnglishCopy ? 'Save & Manage Settings' : '設定の保存・管理'}</h3>
              
              <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-600">
                <div className="space-y-3">
                  {/* 保存状態表示 */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{isEnglishCopy ? 'Save Status:' : '保存状態:'}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      hasStoredSettings 
                        ? 'bg-green-600 text-green-100' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {hasStoredSettings ? (isEnglishCopy ? 'Settings saved' : '設定が保存されています') : (isEnglishCopy ? 'No saved settings' : '設定は保存されていません')}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    {isEnglishCopy
                      ? 'Settings are auto-saved to local storage (except playback speed & sheet music). Settings persist after closing the browser. Sheet music resets to default (Notes + Chords) each time a song is opened.'
                      : '設定は自動的にローカルストレージに保存されます（再生速度・楽譜表示設定は除く）。ブラウザを閉じても設定が保持されます。楽譜表示は曲を開く度にデフォルト（ノーツ+コード）になります。'}
                  </div>
                  
                  {/* 操作ボタン */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetSettings}
                      className="btn btn-sm btn-outline btn-warning"
                    >
                      🔄 {isEnglishCopy ? 'Reset to Default' : 'デフォルトにリセット'}
                    </button>
                    
                    {hasStoredSettings && (
                      <button
                        onClick={handleClearStorage}
                        className="btn btn-sm btn-outline btn-error"
                      >
                        🗑️ {isEnglishCopy ? 'Delete Saved Data' : '保存データ削除'}
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
  const { user, profile: hrcProfile } = useAuthStore();
  const hrcGeoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: hrcProfile?.rank, country: hrcProfile?.country ?? hrcGeoCountry, preferredLocale: hrcProfile?.preferred_locale });

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <a href="#login" className="btn btn-sm btn-outline">{isEnglishCopy ? 'Sign up / Log in' : '会員登録 / ログイン'}</a>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <a href="#account" className="btn btn-sm btn-primary">{isEnglishCopy ? 'Account' : 'アカウント'}</a>
    </div>
  );
};

export default GameScreen;
