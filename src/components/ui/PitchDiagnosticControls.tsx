import { useState } from 'react';
import { PitchInputController } from '@/utils/PitchInputController';
import { pitchDiagnosticRecording } from '@/utils/pitchInput/pitchDiagnosticRecording';

export const PitchDiagnosticControls = ({ isEnglishCopy }: { isEnglishCopy: boolean }) => {
  const [recording, setRecording] = useState(pitchDiagnosticRecording.enabled);
  const [exporting, setExporting] = useState(false);
  return (
    <div className="space-y-2 border-t border-purple-800/40 pt-2">
      <p className="text-xs text-purple-200">
        {isEnglishCopy ? 'Voice input diagnostics' : '音声入力の診断ログ'}
        {recording ? (isEnglishCopy ? ' — recording' : '：収集中') : ''}
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
