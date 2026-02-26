import React, { useState, useMemo } from 'react';
import { Song, SongUsageType, SongRangeType, duplicateSongWithRange } from '@/platform/supabaseSongs';
import { useToast } from '@/stores/toastStore';

interface Props {
  song: Song;
  onClose: () => void;
  onDuplicated: () => void;
}

type DataPattern = 'xml_only' | 'json_only' | 'json_xml';

const detectDataPattern = (song: Song): DataPattern => {
  const hasJson = !!(song.json_url || song.json_data);
  const hasXml = !!song.xml_url;
  if (hasJson && hasXml) return 'json_xml';
  if (hasXml) return 'xml_only';
  return 'json_only';
};

const parseTimeInput = (input: string): number | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+):(\d{1,2})(?:[.,](\d))?$/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const tenths = match[3] ? parseInt(match[3], 10) : 0;
    return minutes * 60 + seconds + tenths * 0.1;
  }
  const numVal = parseFloat(trimmed);
  return isNaN(numVal) ? null : numVal;
};

const RangeDuplicateModal: React.FC<Props> = ({ song, onClose, onDuplicated }) => {
  const toast = useToast();
  const pattern = useMemo(() => detectDataPattern(song), [song]);

  const [title, setTitle] = useState(`${song.title} (部分)`);
  const [usageType, setUsageType] = useState<SongUsageType>(song.usage_type);
  const [saving, setSaving] = useState(false);

  const [startMeasure, setStartMeasure] = useState('1');
  const [endMeasure, setEndMeasure] = useState('4');
  const [audioPaddingMeasures, setAudioPaddingMeasures] = useState<number>(1);

  const [notesStartTime, setNotesStartTime] = useState('');
  const [notesEndTime, setNotesEndTime] = useState('');
  const [audioStartTime, setAudioStartTime] = useState('');
  const [audioEndTime, setAudioEndTime] = useState('');
  const [audioPaddingSeconds, setAudioPaddingSeconds] = useState<number>(2);

  const rangeType: SongRangeType = pattern === 'json_only' ? 'time' : 'measure';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('タイトルを入力してください');
      return;
    }

    if (rangeType === 'measure') {
      const sm = parseInt(startMeasure, 10);
      const em = parseInt(endMeasure, 10);
      if (isNaN(sm) || isNaN(em) || sm < 1 || em < sm) {
        toast.error('小節番号を正しく入力してください（開始 ≤ 終了）');
        return;
      }
    } else {
      const nst = parseTimeInput(notesStartTime);
      const net = parseTimeInput(notesEndTime);
      if (nst == null || net == null || nst < 0 || net <= nst) {
        toast.error('ノーツ生成範囲の時間を正しく入力してください');
        return;
      }
    }

    setSaving(true);
    try {
      if (rangeType === 'measure') {
        const sm = parseInt(startMeasure, 10);
        const em = parseInt(endMeasure, 10);
        await duplicateSongWithRange({
          sourceSongId: song.id,
          title: title.trim(),
          usageType,
          rangeType: 'measure',
          rangeStartMeasure: sm,
          rangeEndMeasure: em,
          audioPaddingMeasures,
        });
      } else {
        const nst = parseTimeInput(notesStartTime)!;
        const net = parseTimeInput(notesEndTime)!;
        const ast = parseTimeInput(audioStartTime);
        const aet = parseTimeInput(audioEndTime);

        const effectiveAst = ast ?? Math.max(0, nst - audioPaddingSeconds);
        const effectiveAet = aet ?? (net + audioPaddingSeconds);

        await duplicateSongWithRange({
          sourceSongId: song.id,
          title: title.trim(),
          usageType,
          rangeType: 'time',
          rangeStartTime: nst,
          rangeEndTime: net,
          audioStartTime: effectiveAst,
          audioEndTime: effectiveAet,
          audioPaddingSeconds,
        });
      }

      toast.success('範囲複製が完了しました');
      onDuplicated();
      onClose();
    } catch (err: any) {
      toast.error(`複製に失敗: ${err.message || ''}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg bg-slate-900">
        <h3 className="font-bold text-lg mb-2">範囲を指定して複製</h3>
        <p className="text-xs text-gray-400 mb-4">
          「{song.title}」から範囲を指定して新しい曲を作成します
        </p>

        <div className="mb-3 flex gap-2 flex-wrap">
          {song.json_url || song.json_data ? <span className="badge badge-info badge-sm">JSON</span> : null}
          {song.xml_url ? <span className="badge badge-secondary badge-sm">MusicXML</span> : null}
          {song.audio_url ? <span className="badge badge-success badge-sm">MP3</span> : null}
          <span className="badge badge-outline badge-sm">
            {pattern === 'xml_only' ? '小節指定' : pattern === 'json_only' ? '時間指定' : '小節指定（JSON+XML）'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">新しい曲タイトル *</label>
            <input
              className="input input-bordered w-full text-white"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">種別</label>
            <select
              className="select select-bordered w-full text-white"
              value={usageType}
              onChange={(e) => setUsageType(e.target.value as SongUsageType)}
            >
              <option value="general">通常曲</option>
              <option value="lesson">レッスン曲</option>
            </select>
          </div>

          <div className="divider text-xs">
            {rangeType === 'measure' ? '小節範囲指定' : '時間範囲指定'}
          </div>

          {rangeType === 'measure' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">開始小節</label>
                  <input
                    type="number"
                    min={1}
                    className="input input-bordered w-full text-white"
                    value={startMeasure}
                    onChange={(e) => setStartMeasure(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">終了小節</label>
                  <input
                    type="number"
                    min={1}
                    className="input input-bordered w-full text-white"
                    value={endMeasure}
                    onChange={(e) => setEndMeasure(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">音源の前後余白</label>
                <div className="flex gap-3">
                  {[0, 1, 2].map((v) => (
                    <label key={v} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="audio-padding-m"
                        className="radio radio-sm radio-primary"
                        checked={audioPaddingMeasures === v}
                        onChange={() => setAudioPaddingMeasures(v)}
                      />
                      <span className="text-sm">{v === 0 ? 'なし' : `前後${v}小節`}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ノーツ範囲の前後に音源再生の余白を追加します（前後に小節がない場合は自動で0）
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                <p className="text-sm font-medium mb-2">ノーツ生成範囲</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">開始 (分:秒.1桁)</label>
                    <input
                      className="input input-bordered input-sm w-full text-white"
                      placeholder="0:03.0"
                      value={notesStartTime}
                      onChange={(e) => setNotesStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">終了 (分:秒.1桁)</label>
                    <input
                      className="input input-bordered input-sm w-full text-white"
                      placeholder="0:15.5"
                      value={notesEndTime}
                      onChange={(e) => setNotesEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                <p className="text-sm font-medium mb-2">音源再生範囲 <span className="text-xs text-gray-400">（空欄で自動計算）</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">開始 (分:秒.1桁)</label>
                    <input
                      className="input input-bordered input-sm w-full text-white"
                      placeholder="自動"
                      value={audioStartTime}
                      onChange={(e) => setAudioStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">終了 (分:秒.1桁)</label>
                    <input
                      className="input input-bordered input-sm w-full text-white"
                      placeholder="自動"
                      value={audioEndTime}
                      onChange={(e) => setAudioEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">自動計算の前後余白</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.5}
                    className="input input-bordered input-sm w-24 text-white"
                    value={audioPaddingSeconds}
                    onChange={(e) => setAudioPaddingSeconds(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-sm text-gray-400">秒</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  音源再生範囲を空欄にした場合、ノーツ範囲の前後にこの秒数を余白として追加します
                </p>
              </div>
            </>
          )}

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  作成中...
                </>
              ) : (
                '範囲複製を実行'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default RangeDuplicateModal;
