import { describe, it, expect, vi, afterEach } from 'vitest';
import type { PlatformWindow } from '@/platform';
import * as platform from '@/platform';
import { requestWebPlaybackAudioSession } from './iosbridge';

describe('requestWebPlaybackAudioSession', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('no-op when not in iOS WebView', () => {
    expect(() => requestWebPlaybackAudioSession()).not.toThrow();
  });

  it('sets navigator.audioSession.type to playback when iOS WebView and audioSession exists', () => {
    const audioSession = { type: 'auto' };
    vi.spyOn(platform, 'getWindow').mockReturnValue({
      navigator: { audioSession },
    } as Pick<PlatformWindow, 'navigator'> as PlatformWindow);
    vi.stubGlobal('window', {
      ...window,
      location: { search: '', hash: '#ios?platform=ios' },
      webkit: { messageHandlers: { gameCallback: { postMessage: vi.fn() } } },
    });
    requestWebPlaybackAudioSession();
    expect(audioSession.type).toBe('playback');
  });
});
