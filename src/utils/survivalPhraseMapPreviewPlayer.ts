/**
 * Phrases 降下マップ: ステージ登録の模範演奏 URL をワンショット再生（ループなし）。
 */
import { SurvivalMapAudio } from '@/utils/SurvivalMapAudio';

const CDN_HOST = 'https://jazzify-cdn.com';

const toProxyUrl = (url: string): string => {
  if (url.startsWith(CDN_HOST)) {
    return `/cdn-proxy${url.slice(CDN_HOST.length)}`;
  }
  return url;
};

type PlayCompletion = {
  readonly resolve: () => void;
  readonly reject: (err: Error) => void;
};

export class SurvivalPhraseMapPreviewPlayer {
  private audio: HTMLAudioElement | null = null;

  private playToken = 0;

  private playCompletion: PlayCompletion | null = null;

  private abortCurrentPlayback(restoreMapBgm: boolean): void {
    const el = this.audio;
    this.audio = null;
    if (el) {
      el.onended = null;
      el.onerror = null;
      try {
        el.pause();
      } catch {
        /* ignore */
      }
      try {
        el.src = '';
      } catch {
        /* ignore */
      }
    }
    if (restoreMapBgm) {
      SurvivalMapAudio.restoreBgmAfterPhrasePreview();
    }
  }

  /**
   * 試聴を再生し、`ended` または `error` / `play()` 拒否で解決／拒否する。
   * 呼び出し側はユーザー操作（ボタン onClick）内から呼ぶこと（モバイル自動再生制約）。
   */
  play(url: string): Promise<void> {
    this.stop({ restoreMapBgm: true });

    const token = this.playToken;

    return new Promise((resolve, reject) => {
      this.playCompletion = { resolve, reject };

      const el = new Audio();
      el.src = toProxyUrl(url);
      el.loop = false;
      el.preload = 'auto';
      el.crossOrigin = 'anonymous';
      this.audio = el;

      SurvivalMapAudio.duckBgmForPhrasePreview();

      const finishOk = (): void => {
        if (this.playToken !== token) {
          return;
        }
        const c = this.playCompletion;
        this.playCompletion = null;
        this.abortCurrentPlayback(true);
        c?.resolve();
      };

      const finishErr = (): void => {
        if (this.playToken !== token) {
          return;
        }
        const c = this.playCompletion;
        this.playCompletion = null;
        this.abortCurrentPlayback(true);
        c?.reject(new Error('Survival phrase preview playback failed'));
      };

      el.onended = () => {
        finishOk();
      };
      el.onerror = () => {
        finishErr();
      };

      void el.play().catch(() => {
        finishErr();
      });
    });
  }

  /**
   * 試聴を中断（ステージ切替・画面離脱・ゲーム開始時）。
   */
  stop(options?: { readonly restoreMapBgm?: boolean }): void {
    const restoreMapBgm = options?.restoreMapBgm ?? true;
    const c = this.playCompletion;
    this.playCompletion = null;
    this.playToken += 1;
    this.abortCurrentPlayback(restoreMapBgm);
    c?.resolve();
  }

  dispose(): void {
    this.stop({ restoreMapBgm: true });
  }
}
