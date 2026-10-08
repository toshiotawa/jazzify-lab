import { useGameStore } from '@/stores/gameStore';

export const VoiceEchoCancellationControl = ({ isEnglishCopy }: { isEnglishCopy: boolean }) => {
  const enabled = useGameStore((state) => state.settings.voiceEchoCancellation ?? true);
  const updateSettings = useGameStore((state) => state.updateSettings);

  return (
    <div className="space-y-1">
      <label className="flex items-center justify-between gap-3 text-sm text-purple-200">
        <span>{isEnglishCopy ? 'Echo cancellation' : 'エコーキャンセル'}</span>
        <input
          type="checkbox"
          className="toggle toggle-primary toggle-sm"
          checked={enabled}
          onChange={(event) => updateSettings({ voiceEchoCancellation: event.target.checked })}
        />
      </label>
      <p className="text-xs text-gray-400">
        {isEnglishCopy
          ? 'If playing stops being recognized at the same volume, try OFF with headphones. Changing this reconnects the microphone.'
          : '同じ音量で演奏しても認識が途切れる場合は、ヘッドホンを使ってOFFを試してください。変更するとマイクを再接続します。'}
      </p>
    </div>
  );
};
