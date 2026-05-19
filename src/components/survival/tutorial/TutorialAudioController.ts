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
