/*
 * FantasySoundManager
 * ---------------------------------------------
 * 効果音（SE）のロードと再生、音量管理を一括で行うシングルトンクラス。
 *  - 4 種の効果音をプリロード（fire / ice / thunder / enemy_attack）
 *  - 同時再生に対応するため、再生時は cloneNode() した HTMLAudioElement を使用
 *  - マスターボリューム(0‑1)を保持し、リアルタイムで変更可能
 *  - ユーティリティ関数（playMagic, playEnemyAttack, setVolume, getVolume, init）を公開
 *  - 初期化時に非同期ロードを行うため、init() は Promise<void> を返す
 *
 *   公開 API
 *   ---------
 *     await FantasySoundManager.init(0.8)  // デフォルト 0.8 (80%)
 *     FantasySoundManager.playMagic('fire') // フレア／インフェルノ
 *     FantasySoundManager.playMagic('ice')  // フロスト／ブリザード
 *     FantasySoundManager.playMagic('thunder') // スパーク／サンダー・ストライク
 *     FantasySoundManager.playEnemyAttack()   // 敵の攻撃音
 *     FantasySoundManager.setVolume(0.5)      // 50% に変更（リアルタイム）
 *     const v = FantasySoundManager.getVolume()
 *
 *   使い方 (例)
 *   ------------
 *   import { FantasySoundManager as FSM } from '@/utils/FantasySoundManager';
 *   
 *   await FSM.init();          // アプリ起動直後などで 1 回だけ呼ぶ
 *   FSM.playMagic('fire');     // 魔法発動時
 *   FSM.playEnemyAttack();     // 敵攻撃時
 *
 *   // 設定モーダルのスライダー変更時
 *   FSM.setVolume(newVolume);  // 0‑1 の値を渡す
 */

// 追加 import
import { note as tonalNote } from 'tonal';

export type MagicSeType = 'fire' | 'ice' | 'thunder';

interface LoadedAudio {
  /** プリロード済みのベース Audio インスタンス（再生には clone する） */
  base: HTMLAudioElement;
  /** 読み込み完了を示すフラグ */
  ready: boolean;
}

export class FantasySoundManager {
  // ─────────────────────────────────────────────
  // singleton
  private static _instance: FantasySoundManager | null = null;
  public static get instance(): FantasySoundManager {
    if (!this._instance) this._instance = new FantasySoundManager();
    return this._instance;
  }

  // ─────────────────────────────────────────────
  // fields
  private readonly audioMap: Record<string, LoadedAudio> = {
    enemy_attack: { base: new Audio(), ready: false },
    fire:          { base: new Audio(), ready: false },
    ice:           { base: new Audio(), ready: false },
    thunder:       { base: new Audio(), ready: false },
    my_attack:     { base: new Audio(), ready: false }
  };

  /** Web Audio (SE用) */
  private seAudioContext: AudioContext | null = null;
  private seGainNode: GainNode | null = null;
  private seBuffers: Record<string, AudioBuffer | null> = {
    enemy_attack: null,
    fire: null,
    ice: null,
    thunder: null,
    my_attack: null,
  };
  private seUnlocked: boolean = false;

  /** マスターボリューム (0‑1) */
  private _volume = 0.8;
  /** 初期化済みフラグ */
  private isInited = false;
  /** ロード完了を待つPromise */
  private loadedPromise: Promise<void> | null = null;

  // ─────────────────────────────────────────────
  // ベース音関連フィールド - globalSamplerを上書きしない独自のsampler
  private bassSampler: any | null = null;
  private bassVolume = 0.5; // デフォルト50%
  private bassEnabled = true;
  private lastRootStart = 0; // Tone.js例外対策用

  // ─────────────────────────────────────────────
  // public static wrappers – 使いやすいように static 経由のエイリアスを用意
  public static async init(defaultVolume = 0.8, bassVol = 0.5, bassEnabled = true) { 
    return this.instance._init(defaultVolume, bassVol, bassEnabled); 
  }
  public static playMagic(type: MagicSeType) { return this.instance._playMagic(type); }
  public static playEnemyAttack() { return this.instance._playSe('enemy_attack'); }
  public static playMyAttack() { return this.instance._playSe('my_attack'); }
  public static setVolume(v: number) { return this.instance._setVolume(v); }
  public static getVolume() { return this.instance._volume; }

  // ─────────────────────────────────────────────
  // ベース音関連のstaticメソッド - 非同期対応
  public static async playRootNote(rootName: string) {
    return this.instance._playRootNote(rootName);
  }

  public static setRootVolume(v: number) {
    this.instance._setRootVolume(v);
  }

  public static enableRootSound(enabled: boolean) {
    this.instance._enableRootSound(enabled);
  }

  // ─────────────────────────────────────────────
  // private constructor – outsider cannot new
  private constructor () {/* nop */}

  // ─────────────────────────────────────────────
  // private helpers
  private _init(defaultVolume: number, bassVol: number, bassEnabled: boolean): Promise<void> {
    if (this.isInited) {
      // ボリューム値だけ同期する
      this._setVolume(defaultVolume);
      return Promise.resolve();
    }

    this._volume = defaultVolume;

    // 事前ロード – ユーザー操作後の初回呼び出しが推奨（Autoplay 制限対策）
    const baseUrl = import.meta.env.BASE_URL || '/';
    const path = (file: string) => `${baseUrl}sounds/${file}`;
    
    console.debug('[FantasySoundManager] Loading sounds with baseUrl:', baseUrl);

    const load = (key: keyof typeof this.audioMap, file: string) => new Promise<void>((res, rej) => {
      const a = this.audioMap[key].base;
      const fullPath = path(file);
      console.debug(`[FantasySoundManager] Loading ${key}: ${fullPath}`);
      a.src = fullPath;
      a.preload = 'auto';
      a.load();
      a.volume = this._volume;
      a.addEventListener('canplaythrough', () => {
        this.audioMap[key].ready = true;
        res();
      });
      a.addEventListener('error', (e) => {
        console.warn(`[FantasySoundManager] failed to load ${file}`, e);
        // エラーでも resolve – 再生時にフォールバック
        res();
      });
    });

    const promises = [
      load('enemy_attack', 'enemy_attack.mp3'),
      load('fire',          'fire.mp3'),
      load('ice',           'ice.mp3'),
      load('thunder',       'thunder.mp3'),
      load('my_attack',     'my_attack.mp3')
    ];

    // ロード完了Promiseを保存
    this.loadedPromise = Promise.all(promises).then(async () => {
      // ─ BassSynth ─ - globalSamplerを上書きしない独自のsampler
      await this._initializeAudioSystem();

      // 低遅延SE用 Web Audio セットアップ + デコード
      await this._setupSeContextAndBuffers(baseUrl);

      const Tone = window.Tone as typeof import('tone');
      this.bassSampler = new Tone.Sampler({
        urls: {
          "A1": "A1.mp3",
          "C2": "C2.mp3",
          "D#2": "Ds2.mp3",
          "F#2": "Fs2.mp3",
          "A2": "A2.mp3",
          "C3": "C3.mp3",
          "D#3": "Ds3.mp3",
          "F#3": "Fs3.mp3",
          "A3": "A3.mp3",
          "C4": "C4.mp3"
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/"
      }).toDestination();
      this._setRootVolume(bassVol);
      this._enableRootSound(bassEnabled);

      this.isInited = true;
      console.debug('[FantasySoundManager] init complete');
      // 初期化完了後の状態をログ出力
      Object.entries(this.audioMap).forEach(([key, entry]) => {
        console.debug(`[FantasySoundManager] ${key}: ready=${entry.ready}`);
      });
    });

    return this.loadedPromise;
  }

  private async _initializeAudioSystem(): Promise<void> {
    return new Promise((resolve) => {
      const initializeAudioSystem = async () => {
        try {
          // Tone を確実にロードし、低遅延設定を適用
          let Tone: typeof import('tone');
          if (!(window as any).Tone) {
            try {
              Tone = await import('tone');
              (window as any).Tone = Tone;
            } catch (e) {
              console.warn('[FantasySoundManager] Failed to dynamic import tone:', e);
            }
          }
          Tone = (window as any).Tone;

          if (Tone) {
            // まだ lookAhead が有効なら、最小化した新しい Context に切り替える
            try {
              const currentContext: any = (Tone as any).getContext ? (Tone as any).getContext() : (Tone as any).context;
              const currentLookAhead = currentContext?.lookAhead ?? 0.1;
              if (!currentContext || currentLookAhead > 0) {
                const optimizedContext = new (Tone as any).Context({
                  latencyHint: 'interactive',
                  lookAhead: 0,
                });
                (Tone as any).setContext(optimizedContext);
              }
              if ((Tone as any).context?.state !== 'running') {
                await (Tone as any).context.resume();
              }
            } catch (e) {
              console.warn('[FantasySoundManager] Tone context optimization failed:', e);
            }
          }
          resolve();
        } catch (error) {
          console.warn('[FantasySoundManager] Audio system initialization failed:', error);
          resolve(); // エラーでも続行
        }
      };
      initializeAudioSystem();
    });
  }

  private _setVolume(v: number) {
    // clamp 0‑1
    this._volume = Math.max(0, Math.min(1, v));
    // すでにロード済みの base にも反映
    Object.values(this.audioMap).forEach(obj => {
      obj.base.volume = this._volume;
    });
    // Web Audio の SE ゲインにも反映
    if (this.seGainNode) {
      this.seGainNode.gain.setValueAtTime(this._volume, this.seAudioContext!.currentTime);
    }
  }

  private _playMagic(type: MagicSeType) {
    // magic type -> key mapping is 1:1
    console.debug(`[FantasySoundManager] playMagic called with type: ${type}`);
    // 魔法タイプに関わらず、常にmy_attackを再生
    this._playSe('my_attack');
  }

  private async _playSe(key: keyof typeof this.audioMap) {
    console.debug(`[FantasySoundManager] _playSe called with key: ${key}`);

    // 低遅延: Web Audio での即時再生（フォールバックあり）
    if (this.seAudioContext && this.seBuffers[key]) {
      try {
        const ctx = this.seAudioContext;
        if (ctx.state !== 'running') {
          try {
            await ctx.resume();
          } catch (e) {
            console.warn('[FantasySoundManager] ctx.resume() failed:', e);
          }
        }
        if (ctx.state === 'running') {
          const src = ctx.createBufferSource();
          src.buffer = this.seBuffers[key]!;
          src.connect(this.seGainNode!);
          src.start(0);
          src.addEventListener('ended', () => {
            try { src.disconnect(); } catch {}
          });
          return;
        } else {
          console.warn('[FantasySoundManager] SE AudioContext not running, falling back to HTMLAudio.');
          // fall through to HTMLAudio
        }
      } catch (e) {
        console.warn('[FantasySoundManager] WebAudio SE playback failed. Falling back to HTMLAudio.', e);
      }
    }
    
    const entry = this.audioMap[key];
    if (!entry) {
      console.warn(`[FantasySoundManager] Audio entry not found for key: ${key}`);
      return;
    }

    const base = entry.base;
    if (!entry.ready) {
      // 未ロード時でも再生を試みる（モバイルでcanplaythroughが遅い対策）
      console.warn(`[FantasySoundManager] Audio not fully ready for key: ${key} (trying early playback)`);
      console.warn(`[FantasySoundManager] Audio state:`, {
        src: base.src,
        readyState: base.readyState,
        networkState: base.networkState,
        error: base.error
      });
    }

    console.debug(`[FantasySoundManager] Playing sound (fallback HTMLAudio): ${key} at volume: ${this._volume}`);

    // 同時再生のため cloneNode()
    const node = base.cloneNode(true) as HTMLAudioElement;
    node.volume = this._volume;
    // onended で解放
    node.addEventListener('ended', () => {
      node.src = '';
    });
    const playPromise = node.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.debug(`[FantasySoundManager] Successfully played ${key}`);
        })
        .catch((error) => {
          console.warn(`[FantasySoundManager] Failed to play ${key}:`, error);
          console.warn(`[FantasySoundManager] Audio state:`, {
            src: node.src,
            readyState: node.readyState,
            networkState: node.networkState,
            error: node.error
          });
        });
    }
  }

  // ベース音関連のprivateメソッド
  private async _playRootNote(rootName: string) {
    // 先に初期化の完了を待つ（未完了だと bassSampler が null で早期 return してしまう）
    if (this.loadedPromise) {
      await this.loadedPromise;
    }

    if (!this.bassEnabled || !this.bassSampler) return;
    
    const Tone = window.Tone as typeof import('tone');
    const n = tonalNote(rootName + '2');        // C2 付近
    if (n.midi == null) return;
    
    // Tone.js 例外対策：必ず前回より >0 の startTime
    let t = Tone.now();
    if (t <= this.lastRootStart) t = this.lastRootStart + 0.001;
    this.lastRootStart = t;
    
    const note = Tone.Frequency(n.midi, 'midi').toNote();
    this.bassSampler.triggerAttackRelease(
      note,
      '8n',
      t,
      this.bassVolume // velocity 相当
    );
  }

  private _setRootVolume(v: number) {
    this.bassVolume = v;
    if (this.bassSampler) {
      (this.bassSampler.volume as any).value =
        v === 0 ? -Infinity : Math.log10(v) * 20;
    }
  }

  private _enableRootSound(enabled: boolean) {
    this.bassEnabled = enabled;
  }

  // ─────────────────────────────────────────────
  // Web Audio (SE) setup
  private async _setupSeContextAndBuffers(baseUrl: string): Promise<void> {
    try {
      if (!this.seAudioContext) {
        this.seAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: 'interactive' });
        this.seGainNode = this.seAudioContext.createGain();
        this.seGainNode.gain.setValueAtTime(this._volume, this.seAudioContext.currentTime);
        this.seGainNode.connect(this.seAudioContext.destination);
        this._installMobileUnlockHandlers();
      }

      const seFiles: Array<[keyof typeof this.seBuffers, string]> = [
        ['enemy_attack', 'enemy_attack.mp3'],
        ['fire', 'fire.mp3'],
        ['ice', 'ice.mp3'],
        ['thunder', 'thunder.mp3'],
        ['my_attack', 'my_attack.mp3'],
      ];

      await Promise.all(seFiles.map(async ([key, file]) => {
        try {
          const url = `${baseUrl}sounds/${file}`;
          const resp = await fetch(url);
          const arr = await resp.arrayBuffer();
          const buf = await this.seAudioContext!.decodeAudioData(arr.slice(0));
          this.seBuffers[key] = buf;
        } catch (e) {
          console.warn(`[FantasySoundManager] Failed to decode SE buffer: ${key}`, e);
        }
      }));
    } catch (e) {
      console.warn('[FantasySoundManager] SE AudioContext setup failed:', e);
    }
  }

  private _installMobileUnlockHandlers() {
    if (!this.seAudioContext || this.seUnlocked) return;

    const tryUnlock = async () => {
      try {
        if (this.seAudioContext && this.seAudioContext.state !== 'running') {
          await this.seAudioContext.resume();
        }
        const ToneAny: any = (window as any).Tone;
        if (ToneAny?.start) {
          try { await ToneAny.start(); } catch {}
        }
      } catch {}

      if (this.seAudioContext?.state === 'running') {
        this.seUnlocked = true;
      }
    };

    // ユーザー操作で確実に解放する
    const opts: AddEventListenerOptions & EventListenerOptions = { once: true, passive: true } as any;
    window.addEventListener('pointerdown', tryUnlock, opts);
    window.addEventListener('touchstart', tryUnlock, opts);
    window.addEventListener('click', tryUnlock, opts);
    window.addEventListener('keydown', tryUnlock, opts);
  }
}

// default export as singleton shortcuts
export default FantasySoundManager;
