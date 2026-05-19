import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TutorialAudioController } from './TutorialAudioController';

describe('TutorialAudioController', () => {
  const playMock = vi.fn().mockResolvedValue(undefined);
  const pauseMock = vi.fn();
  const AudioCtor = vi.fn(function MockAudio(this: {
    loop: boolean;
    volume: number;
    src: string;
    play: typeof playMock;
    pause: typeof pauseMock;
  }) {
    this.loop = false;
    this.volume = 1;
    this.src = '';
    this.play = playMock;
    this.pause = pauseMock;
  });

  beforeEach(() => {
    playMock.mockClear();
    pauseMock.mockClear();
    AudioCtor.mockClear();
    global.Audio = AudioCtor as unknown as typeof Audio;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('plays a track with explicit url', () => {
    const controller = new TutorialAudioController();
    controller.setTracks({
      drum: { url: 'https://example.com/drum.mp3', defaultLoop: true, defaultVolume: 0.3 },
    });

    controller.playAudio('drum');

    expect(AudioCtor).toHaveBeenCalledWith('https://example.com/drum.mp3');
    expect(playMock).toHaveBeenCalled();
  });

  it('stops a single track', () => {
    const controller = new TutorialAudioController();
    controller.setTracks({
      a: { url: 'https://example.com/a.mp3' },
    });
    controller.playAudio('a');
    controller.stopAudio('a');

    expect(pauseMock).toHaveBeenCalled();
  });

  it('dispose prevents further playback', () => {
    const controller = new TutorialAudioController();
    controller.setTracks({ a: { url: 'https://example.com/a.mp3' } });
    controller.playAudio('a');
    controller.dispose();
    controller.playAudio('a');

    expect(AudioCtor).toHaveBeenCalledTimes(1);
  });
});
