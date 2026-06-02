import {
  DEFAULT_SURVIVAL_BGM_SETTINGS,
  fetchSurvivalBgmSettings,
  resolveSurvivalBgmUrl,
  toSurvivalBgmSettingsMap,
  type SurvivalBgmSettingsMap,
  type SurvivalStageType,
} from '@/platform/supabaseSurvival';

export interface TutorialAudioTrackDef {
  url?: string;
  resolveFrom?: SurvivalStageType;
  defaultLoop?: boolean;
  defaultVolume?: number;
}

export type TutorialAudioTracksMap = Record<string, TutorialAudioTrackDef>;

interface ActivePlayer {
  audio: HTMLAudioElement;
  trackId: string;
}

export class TutorialAudioController {
  private readonly players = new Map<string, ActivePlayer>();
  private bgmSettings: SurvivalBgmSettingsMap = DEFAULT_SURVIVAL_BGM_SETTINGS;
  private tracks: TutorialAudioTracksMap = {};
  private disposed = false;

  setTracks(tracks: TutorialAudioTracksMap): void {
    this.tracks = tracks;
  }

  async ensureBgmSettings(): Promise<void> {
    try {
      const rows = await fetchSurvivalBgmSettings();
      this.bgmSettings = toSurvivalBgmSettingsMap(rows);
    } catch {
      this.bgmSettings = DEFAULT_SURVIVAL_BGM_SETTINGS;
    }
  }

  resolveTrackUrl(trackId: string): string | null {
    const def = this.tracks[trackId];
    if (!def) return null;
    if (typeof def.url === 'string' && def.url.trim() !== '') {
      return def.url.trim();
    }
    if (def.resolveFrom) {
      return resolveSurvivalBgmUrl(def.resolveFrom, this.bgmSettings);
    }
    return null;
  }

  playAudio(
    trackId: string,
    options?: { loop?: boolean; volume?: number },
  ): void {
    if (this.disposed) return;
    const url = this.resolveTrackUrl(trackId);
    if (!url) return;

    const def = this.tracks[trackId];
    const loop = options?.loop ?? def?.defaultLoop ?? true;
    const volume = options?.volume ?? def?.defaultVolume ?? 0.45;

    this.stopAudio(trackId);

    const audio = new Audio(url);
    audio.loop = loop;
    audio.volume = Math.max(0, Math.min(1, volume));
    this.players.set(trackId, { audio, trackId });
    void audio.play().catch(() => {
      /* autoplay policy */
    });
  }

  /** 既存要素を再利用して先頭から再生し、`playing` まで待つ（demo 拍同期用）。 */
  restartFromStart(
    trackId: string,
    options?: { loop?: boolean; volume?: number },
  ): Promise<void> {
    if (this.disposed) {
      return Promise.resolve();
    }
    const url = this.resolveTrackUrl(trackId);
    if (!url) {
      return Promise.resolve();
    }

    const def = this.tracks[trackId];
    const loop = options?.loop ?? def?.defaultLoop ?? true;
    const volume = options?.volume ?? def?.defaultVolume ?? 0.45;
    const clampedVolume = Math.max(0, Math.min(1, volume));

    const existing = this.players.get(trackId);
    if (existing) {
      const { audio } = existing;
      audio.loop = loop;
      audio.volume = clampedVolume;
      audio.currentTime = 0;
      return this.waitForPlaying(audio);
    }

    const audio = new Audio(url);
    audio.loop = loop;
    audio.volume = clampedVolume;
    this.players.set(trackId, { audio, trackId });
    return this.waitForPlaying(audio);
  }

  private waitForPlaying(audio: HTMLAudioElement): Promise<void> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        audio.removeEventListener('playing', onPlaying);
        window.clearTimeout(fallbackId);
        resolve();
      };
      const onPlaying = (): void => {
        finish();
      };
      audio.addEventListener('playing', onPlaying, { once: true });
      const fallbackId = window.setTimeout(finish, 120);
      void audio.play().catch(() => {
        finish();
      });
    });
  }

  stopAudio(trackId: string): void {
    const active = this.players.get(trackId);
    if (!active) return;
    try {
      active.audio.pause();
      active.audio.src = '';
    } catch {
      /* noop */
    }
    this.players.delete(trackId);
  }

  stopAllAudio(): void {
    for (const trackId of [...this.players.keys()]) {
      this.stopAudio(trackId);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.stopAllAudio();
  }
}
