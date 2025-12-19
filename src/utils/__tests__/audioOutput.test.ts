import { describe, expect, it, vi } from 'vitest';
import { applyAudioOutputDevice } from '@/utils/audioOutput';

vi.mock('@/utils/logger', () => ({
  log: {
    warn: vi.fn()
  }
}));

describe('applyAudioOutputDevice', () => {
  it('deviceId が null の場合は true を返す', async () => {
    const context = {} as unknown as AudioContext;
    await expect(applyAudioOutputDevice(context, null)).resolves.toBe(true);
  });

  it('AudioContext に setSinkId がない場合は false を返す', async () => {
    const context = {} as unknown as AudioContext;
    await expect(applyAudioOutputDevice(context, 'default')).resolves.toBe(false);
  });

  it('setSinkId が成功した場合は true を返す', async () => {
    const setSinkId = vi.fn<[string], Promise<void>>().mockResolvedValue(undefined);
    const context = { setSinkId } as unknown as AudioContext;
    await expect(applyAudioOutputDevice(context, 'device-1')).resolves.toBe(true);
    expect(setSinkId).toHaveBeenCalledWith('device-1');
  });

  it('setSinkId が失敗した場合は false を返す', async () => {
    const setSinkId = vi.fn<[string], Promise<void>>().mockRejectedValue(new Error('fail'));
    const context = { setSinkId } as unknown as AudioContext;
    await expect(applyAudioOutputDevice(context, 'device-2')).resolves.toBe(false);
    expect(setSinkId).toHaveBeenCalledWith('device-2');
  });
});

