import { useGameStore } from '@/stores/gameStore';
import {
  isPolyphonicVoiceEngine,
  parseVoicePitchEngine,
} from '@/utils/pitchInput/voicePitchEngine';

export const VoicePitchEngineControl = ({
  isEnglishCopy,
  includePolyphonic = false,
}: {
  isEnglishCopy: boolean;
  includePolyphonic?: boolean;
}) => {
  const engine = useGameStore((state) => state.settings.voicePitchEngine ?? 'pesto');
  const updateSettings = useGameStore((state) => state.updateSettings);
  const shown = includePolyphonic || !isPolyphonicVoiceEngine(engine) ? engine : 'pesto';

  return (
    <div className="space-y-1">
      <label className="flex items-center justify-between gap-3 text-sm text-purple-200">
        <span>{isEnglishCopy ? 'Pitch detection' : '音程の認識方式'}</span>
        <select
          className="rounded bg-slate-800 p-2 text-white"
          value={shown}
          onChange={(event) => updateSettings({
            voicePitchEngine: parseVoicePitchEngine(event.target.value),
          })}
        >
          <option value="pesto">PESTO</option>
          <option value="pitchy">{isEnglishCopy ? 'Pitchy (comparison)' : 'Pitchy（比較用）'}</option>
          {includePolyphonic ? (
            <>
              <option value="pitchplease-fast">PitchPlease fast</option>
              <option value="pitchplease-piano">PitchPlease piano</option>
              <option value="effetune">{isEnglishCopy ? 'EffeTune (polyphonic)' : 'EffeTune（多声）'}</option>
            </>
          ) : null}
        </select>
      </label>
      <p className="text-xs text-gray-400">
        {isEnglishCopy
          ? 'Changing this reconnects the microphone. Your choice is saved. Compare with the same sensitivity.'
          : '変更するとマイクを再接続します。選択は保存されます。同じ感度で比較してください。'}
      </p>
      {shown === 'pitchy' && (
        <p className="text-xs text-gray-400">
          {isEnglishCopy
            ? 'Pitchy uses an 85ms analysis window (171ms with Low register). This differs from the 5ms update interval. Accuracy on your instrument needs comparison.'
            : 'Pitchyの解析窓は約85ms（低音読み取りONで約171ms）です。5msの更新間隔とは別です。楽器での認識精度を比較してください。'}
        </p>
      )}
      {isPolyphonicVoiceEngine(shown) && (
        <p className="text-xs text-gray-400">
          {isEnglishCopy
            ? 'Polyphonic models send each detected pitch as its own key on and off. EffeTune here is not the JIT-MPE paper model.'
            : '多声モデルは検出した各音を、そのまま鍵のON/OFFとして送ります。ここのEffeTuneはJIT-MPE論文のモデルそのものではありません。'}
        </p>
      )}
    </div>
  );
};
