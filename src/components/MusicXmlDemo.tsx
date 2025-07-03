import React, { useState, useCallback } from 'react';
import { SheetMusicDisplay } from './game/SheetMusicDisplay';
import { transposeMusicXml } from '../utils/musicXmlProcessor';

// サンプルMusicXML（簡単なCメジャースケール）
const SAMPLE_MUSICXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Sample Scale</work-title>
  </work>
  <identification>
    <creator type="composer">Demo Composer</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <direction placement="above">
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>120</per-minute>
          </metronome>
        </direction-type>
        <sound tempo="120"/>
      </direction>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

export const MusicXmlDemo: React.FC = () => {
  const [musicXml, setMusicXml] = useState(SAMPLE_MUSICXML);
  const [transposeValue, setTransposeValue] = useState(0);
  const [fileContent, setFileContent] = useState<string | null>(null);

  // ファイル読み込みハンドラ
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
      setMusicXml(content);
    };
    reader.readAsText(file);
  }, []);

  // 移調処理のデモ
  const handleTransposeDemo = useCallback(() => {
    const originalXml = fileContent || SAMPLE_MUSICXML;
    const result = transposeMusicXml(originalXml, { semitones: transposeValue });
    setMusicXml(result.xml);
    
    alert(`移調完了！\n${result.notesTransposed}個の音符を${transposeValue > 0 ? '+' : ''}${transposeValue}半音移調しました。`);
  }, [fileContent, transposeValue]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">MusicXML + Tonal デモ</h1>
      
      {/* ファイルアップロード */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">MusicXMLファイルをアップロード</h2>
        <input
          type="file"
          accept=".xml,.musicxml"
          onChange={handleFileUpload}
          className="mb-3 p-2 border rounded"
        />
        <p className="text-sm text-gray-600">
          MusicXMLファイルをアップロードするか、デフォルトのサンプルを使用します。
        </p>
      </div>

      {/* 移調機能のデモ */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">@stringsync/musicxml + tonal による移調</h2>
        <div className="flex items-center gap-4 mb-3">
          <label className="font-medium">移調値:</label>
          <input
            type="number"
            min="-12"
            max="12"
            value={transposeValue}
            onChange={(e) => setTransposeValue(parseInt(e.target.value) || 0)}
            className="w-20 p-2 border rounded"
          />
          <span className="text-sm text-gray-600">半音</span>
          <button
            onClick={handleTransposeDemo}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            移調を適用
          </button>
        </div>
        <div className="text-sm text-gray-600">
          <p>• @stringsync/musicxml: XMLのパース/シリアライズ</p>
          <p>• tonal: Interval.fromSemitones() で音程を計算</p>
          <p>• 型安全を保持したまま移調処理</p>
        </div>
      </div>

      {/* 楽譜表示 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">OpenSheetMusicDisplay による楽譜表示</h2>
        <SheetMusicDisplay
          musicXml={musicXml}
          onTransposeChange={(semitones) => {
            console.log('移調値変更:', semitones);
          }}
          onSongInfoChange={(info) => {
            console.log('楽曲情報:', info);
          }}
        />
      </div>

      {/* 実装のポイント */}
      <div className="p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold mb-2">実装のポイント</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>@stringsync/musicxml でXMLをパース → 型安全なオブジェクト構造</li>
          <li>tonal の transpose() 関数で各音符を移調</li>
          <li>移調後も MusicXML の構造を保持 → OSMDで正しく描画</li>
          <li>パフォーマンス: パース → 移調 → シリアライズが高速</li>
        </ul>
      </div>
    </div>
  );
};