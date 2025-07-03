import React, { useRef, useEffect, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { transposeMusicXml, createOSMDInstance, extractSongInfo, type SongInfo } from '../../utils/musicXmlProcessor';

interface SheetMusicDisplayProps {
  /** MusicXML形式の文字列 */
  musicXml: string;
  /** コンポーネントの幅（デフォルト: 100%） */
  width?: string | number;
  /** コンポーネントの高さ（デフォルト: auto） */
  height?: string | number;
  /** 初期の移調値（半音数） */
  initialTranspose?: number;
  /** 移調変更時のコールバック */
  onTransposeChange?: (semitones: number) => void;
  /** 楽曲情報変更時のコールバック */
  onSongInfoChange?: (info: SongInfo) => void;
}

export const SheetMusicDisplay: React.FC<SheetMusicDisplayProps> = ({
  musicXml,
  width = '100%',
  height = 'auto',
  initialTranspose = 0,
  onTransposeChange,
  onSongInfoChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [transpose, setTranspose] = useState(initialTranspose);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [songInfo, setSongInfo] = useState<SongInfo>({});

  // 楽譜の描画
  useEffect(() => {
    const renderSheet = async () => {
      if (!containerRef.current || !musicXml) return;

      setIsLoading(true);
      setError(null);

      try {
        // 既存のOSMDインスタンスをクリーンアップ
        if (osmdRef.current) {
          osmdRef.current.clear();
          osmdRef.current = null;
        }

        // 移調処理
        let xmlToRender = musicXml;
        if (transpose !== 0) {
          const result = transposeMusicXml(musicXml, { semitones: transpose });
          xmlToRender = result.xml;
        }

        // 楽曲情報を抽出
        const info = extractSongInfo(xmlToRender);
        setSongInfo(info);
        onSongInfoChange?.(info);

        // OSMDインスタンスを作成して楽譜を描画
        const osmd = await createOSMDInstance(containerRef.current, xmlToRender);
        osmdRef.current = osmd;

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '楽譜の描画中にエラーが発生しました');
        setIsLoading(false);
      }
    };

    renderSheet();

    // クリーンアップ
    return () => {
      if (osmdRef.current) {
        osmdRef.current.clear();
        osmdRef.current = null;
      }
    };
  }, [musicXml, transpose, onSongInfoChange]);

  // 移調値の変更ハンドラ
  const handleTransposeChange = (newTranspose: number) => {
    setTranspose(newTranspose);
    onTransposeChange?.(newTranspose);
  };

  // 移調ボタンのスタイル
  const buttonClass = "px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  
  return (
    <div className="w-full">
      {/* コントロールパネル */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* 楽曲情報 */}
          <div className="flex-1">
            {songInfo.title && (
              <h3 className="text-lg font-semibold">{songInfo.title}</h3>
            )}
            {songInfo.composer && (
              <p className="text-sm text-gray-600">作曲: {songInfo.composer}</p>
            )}
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              {songInfo.tempo && <span>♩ = {songInfo.tempo}</span>}
              {songInfo.timeSignature && (
                <span>{songInfo.timeSignature.beats}/{songInfo.timeSignature.beatType}</span>
              )}
              {songInfo.key && <span>調: {songInfo.key}</span>}
            </div>
          </div>

          {/* 移調コントロール */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTransposeChange(transpose - 1)}
              className={buttonClass}
              disabled={transpose <= -12 || isLoading}
              aria-label="半音下げる"
            >
              ♭
            </button>
            
            <div className="px-3 py-1 min-w-[80px] text-center bg-white border rounded">
              {transpose === 0 ? '原調' : `${transpose > 0 ? '+' : ''}${transpose}半音`}
            </div>
            
            <button
              onClick={() => handleTransposeChange(transpose + 1)}
              className={buttonClass}
              disabled={transpose >= 12 || isLoading}
              aria-label="半音上げる"
            >
              ♯
            </button>
            
            {transpose !== 0 && (
              <button
                onClick={() => handleTransposeChange(0)}
                className="ml-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                disabled={isLoading}
              >
                リセット
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 楽譜表示エリア */}
      <div 
        className="bg-white rounded-lg shadow-sm border p-4 overflow-x-auto"
        style={{ width, height }}
      >
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            <span className="ml-3 text-gray-600">楽譜を読み込み中...</span>
          </div>
        )}
        
        {error && (
          <div className="py-8 text-center">
            <p className="text-red-600">エラー: {error}</p>
          </div>
        )}
        
        <div 
          ref={containerRef} 
          className={`${isLoading || error ? 'hidden' : ''}`}
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* 使い方の説明 */}
      <div className="mt-4 text-sm text-gray-500">
        <p>♭/♯ボタンで移調できます（最大±12半音）</p>
      </div>
    </div>
  );
};