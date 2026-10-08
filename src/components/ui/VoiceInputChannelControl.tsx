import { useGameStore } from '@/stores/gameStore';

export const VoiceInputChannelControl = ({ isEnglishCopy }: { isEnglishCopy: boolean }) => {
  const inputChannel = useGameStore((state) => state.settings.voiceInputChannel ?? 1);
  const updateSettings = useGameStore((state) => state.updateSettings);

  return (
    <div className="space-y-1">
      <label className="block text-sm text-purple-200">
        <span>{isEnglishCopy ? 'Microphone input channel' : 'マイク入力チャンネル'}</span>
        <select
          className="select select-bordered select-sm w-full mt-1"
          value={inputChannel}
          onChange={(event) => updateSettings({ voiceInputChannel: event.target.value === '2' ? 2 : 1 })}
        >
          <option value="1">{isEnglishCopy ? 'Input 1 / Left (mono supported)' : '入力1 / 左（モノラルにも対応）'}</option>
          <option value="2">{isEnglishCopy ? 'Input 2 / Right (stereo required)' : '入力2 / 右（2チャンネル取得が必要）'}</option>
        </select>
      </label>
      <p className="text-xs text-gray-400">
        {isEnglishCopy
          ? 'Select the channel carrying your instrument. Changing it reconnects the microphone. The device routing determines which physical input reaches each channel.'
          : '演奏音の入るチャンネルを選択してください。変更するとマイクを再接続します。物理入力との対応は機器のルーティングによります。'}
      </p>
    </div>
  );
};
