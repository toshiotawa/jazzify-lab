import { useState } from 'react';
import { PitchInputController } from '@/utils/PitchInputController';
import { pitchDiagnosticRecording } from '@/utils/pitchInput/pitchDiagnosticRecording';

export const PitchDiagnosticControls = ({ isEnglishCopy }: { isEnglishCopy: boolean }) => {
  const [recording, setRecording] = useState(pitchDiagnosticRecording.enabled);
  const [exporting, setExporting] = useState(false);
  const [interval, setIntervalMs] = useState(PitchInputController.getInferenceIntervalMs);
  const [reconnecting, setReconnecting] = useState(false);
  return (
    <div className="space-y-2 border-t border-purple-800/40 pt-2">
      <p className="text-xs text-purple-200">
        {isEnglishCopy ? 'Voice input diagnostics' : '音声入力の診断ログ'}
        {recording ? (isEnglishCopy ? ' — recording' : '：収集中') : ''}
      </p>
      <label className="flex items-center gap-2 text-xs text-purple-200">
        {isEnglishCopy ? 'Pitch update interval' : '音程の更新間隔'}
        <select
          className="rounded bg-slate-800 p-2 text-white"
          value={interval}
          disabled={reconnecting || exporting}
          onChange={async (event) => {
            const value = event.target.value;
            const next = value === '10' ? 10 : value === '20' ? 20 : 5;
            setReconnecting(true);
            try {
              await PitchInputController.setInferenceIntervalMs(next);
              setIntervalMs(next);
            } finally {
              setReconnecting(false);
            }
          }}
        >
          <option value={5}>5ms</option>
          <option value={10}>10ms</option>
          <option value={20}>20ms</option>
        </select>
      </label>
      <p className="text-xs text-gray-400">
        {isEnglishCopy
          ? 'Changing this reconnects voice input. Default: 5ms. Experimental 10/20ms use less CPU but may miss short notes. Resets on reload.'
          : '変更時に音声入力を再接続します。既定は5ms。比較用の10／20msは負荷が減りますが、短い音を取りこぼす場合があります。再読み込みで既定に戻ります。'}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-purple-800 px-3 py-2 text-xs text-white"
          disabled={exporting}
          onClick={() => {
            PitchInputController.setDiagnosticRecording(!recording);
            setRecording(!recording);
          }}
        >
          {recording
            ? (isEnglishCopy ? 'Stop recording' : '収集を停止')
            : (isEnglishCopy ? 'Start new recording' : 'ログ収集を開始')}
        </button>
        <button
          type="button"
          className="rounded bg-slate-700 px-3 py-2 text-xs text-white disabled:opacity-50"
          disabled={exporting || !pitchDiagnosticRecording.hasRecording}
          onClick={async () => {
            setExporting(true);
            try {
              await PitchInputController.downloadDiagnostics();
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting
            ? (isEnglishCopy ? 'Saving…' : '保存中…')
            : (isEnglishCopy ? 'Save diagnostic JSON' : '診断ログを保存（JSON）')}
        </button>
      </div>
      <p className="text-xs text-gray-400">
        {isEnglishCopy
          ? 'Start before playing, then save after input cuts out. Recent history is kept until you reload. No audio is recorded or sent.'
          : '演奏前に開始し、入力が途切れた後に保存してください。直近の履歴をページ再読み込みまで保持します。音声の録音・外部送信は行いません。'}
      </p>
    </div>
  );
};
