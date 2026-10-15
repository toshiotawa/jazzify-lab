import { useGameStore } from '@/stores/gameStore';

export const VoicePitchEngineControl = ({ isEnglishCopy }: { isEnglishCopy: boolean }) => {
  const engine = useGameStore((state) => state.settings.voicePitchEngine ?? 'pesto');
  const updateSettings = useGameStore((state) => state.updateSettings);

  return (
    <div className="space-y-1">
      <label className="flex items-center justify-between gap-3 text-sm text-purple-200">
        <span>{isEnglishCopy ? 'Pitch detection' : '音程の認識方式'}</span>
        <select
          className="rounded bg-slate-800 p-2 text-white"
          value={engine}
          onChange={(event) => updateSettings({ voicePitchEngine: event.target.value === 'pitchy' ? 'pitchy' : 'pesto' })}
        >
          <option value="pesto">PESTO</option>
          <option value="pitchy">{isEnglishCopy ? 'Pitchy (comparison)' : 'Pitchy（比較用）'}</option>
        </select>
      </label>
      <p className="text-xs text-gray-400">
        {isEnglishCopy
          ? 'Changing this reconnects the microphone. Your choice is saved. Compare with the same sensitivity and update interval.'
          : '変更するとマイクを再接続します。選択は保存されます。同じ感度・更新間隔で比較してください。'}
      </p>
      {engine === 'pitchy' && (
        <p className="text-xs text-gray-400">
          {isEnglishCopy
            ? 'Pitchy uses an 85ms analysis window (171ms with Low register). This differs from the 5/10/20ms update interval. Accuracy on your instrument needs comparison.'
            : 'Pitchyの解析窓は約85ms（低音読み取りONで約171ms）です。5／10／20msの更新間隔とは別です。楽器での認識精度を比較してください。'}
        </p>
      )}
    </div>
  );
};
