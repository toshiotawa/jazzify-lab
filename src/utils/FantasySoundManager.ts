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
    my_attack:     { base: new Audio(), ready: false },
    stage_clear:   { base: new Audio(), ready: false }
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
    stage_clear: null,
  };

  /** マスターボリューム (0‑1) */
  private _volume = 0.8;
  /** 初期化済みフラグ */
  private isInited = false;
  /** ロード完了を待つPromise */
  private loadedPromise: Promise<void> | null = null;

  // ─────────────────────────────────────────────
  // ベース音関連フィールド - 🚀 シンセに変更（外部サーバー不要で即時再生）
  private bassSynth: any | null = null;
  private bassSynthReady = false;
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
  public static playStageClear() { return this.instance._playSe('stage_clear'); }
  public static setVolume(v: number) { return this.instance._setVolume(v); }
  public static getVolume() { return this.instance._volume; }
  public static async playRootNote(rootName: string) {
    return this.instance._playRootNote(rootName);
  }
  public static setRootVolume(v: number) {
    this.instance._setRootVolume(v);
  }
  public static enableRootSound(enabled: boolean) {
    this.instance._enableRootSound(enabled);
  }
  public static async unlock(): Promise<void> { return this.instance._unlock(); }

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
      load('my_attack',     'my_attack.mp3'),
      load('stage_clear',   'stage_clear.mp3')
    ];

    // 🚀 パフォーマンス最適化: 初期化を高速化
    // 効果音のロードはバックグラウンドで完了を待つ
    // ルート音はシンセを使用（外部サーバー不要で即時再生）
    this.loadedPromise = Promise.all(promises).then(async () => {
      // ─ AudioSystem初期化 ─ Tone.jsを先にロードする（シンセに必要）
      await this._initializeAudioSystem();

      // 低遅延SE用 Web Audio セットアップ + デコード（バックグラウンド）
      this._setupSeContextAndBuffers(baseUrl).catch(e =>
        console.warn('[FantasySoundManager] SE buffer setup failed:', e)
      );

      // 🚀 シンセサイザーを初期化（Tone.jsロード後に実行）
      this._initializeBassSynth(bassVol, bassEnabled);

      this.isInited = true;
      console.debug('[FantasySoundManager] init complete (fast mode - using synth for bass)');
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

  private _playSe(key: keyof typeof this.audioMap) {
    console.debug(`[FantasySoundManager] _playSe called with key: ${key}`);

    // 低遅延: Web Audio での即時再生（フォールバックあり）
    if (this.seAudioContext && this.seBuffers[key]) {
      try {
        const ctx = this.seAudioContext;
        if (ctx.state !== 'running') {
          void ctx.resume();
        }
        const src = ctx.createBufferSource();
        src.buffer = this.seBuffers[key]!;
        src.connect(this.seGainNode!);
        src.start(0);
        src.addEventListener('ended', () => {
          try { src.disconnect(); } catch {}
        });
        return;
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
      // 未ロード or 失敗時は何もしない（ユーザー体験阻害しない）
      console.warn(`[FantasySoundManager] Audio not ready for key: ${key}`);
      console.warn(`[FantasySoundManager] Audio state:`, {
        src: base.src,
        readyState: base.readyState,
        networkState: base.networkState,
        error: base.error
      });
      return;
    }

    console.debug(`[FantasySoundManager] Playing sound (fallback): ${key} at volume: ${this._volume}`);

    // 同時再生のため cloneNode()
    const node = base.cloneNode() as HTMLAudioElement;
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

  // 🚀 パフォーマンス最適化: シンセサイザーを使用（外部サーバー不要で即時再生）
  private async _playRootNote(rootName: string) {
    // 初期化完了済みの場合は待機をスキップ（高速化）
    if (!this.isInited && this.loadedPromise) {
      await this.loadedPromise;
    }

    if (!this.bassEnabled || !this.bassSynthReady || !this.bassSynth) return;
    
    const Tone = window.Tone as unknown as typeof import('tone');
    if (!Tone) return; // Tone.js未ロードの場合は早期リターン
    
    const n = tonalNote(rootName + '2');        // C2 付近
    if (n.midi == null) return;
    
    // Tone.js 例外対策：必ず前回より >0 の startTime
    let t = Tone.now();
    if (t <= this.lastRootStart) t = this.lastRootStart + 0.001;
    this.lastRootStart = t;
    
    const note = Tone.Frequency(n.midi, 'midi').toNote();
    // velocity は 1 固定（音量は volume.value で制御）
    this.bassSynth.triggerAttackRelease(
      note,
      '8n',
      t,
      1 // velocity は常に最大
    );
  }
  
  // 🚀 シンセサイザーの初期化（外部サーバー不要で即時利用可能）
  private _initializeBassSynth(bassVol: number, bassEnabled: boolean): void {
    try {
      const Tone = window.Tone as unknown as typeof import('tone');
      if (!Tone) {
        console.warn('[FantasySoundManager] Tone.js not available for bass synth');
        return;
      }
      
      // FMSynthでピアノ風のベル系サウンドを生成（外部サーバー不要）
      // 音量を上げて聴こえやすく
      this.bassSynth = new Tone.FMSynth({
        harmonicity: 2,
        modulationIndex: 8,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.005,
          decay: 0.3,
          sustain: 0.4,
          release: 1.0
        },
        modulation: { type: 'triangle' },
        modulationEnvelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.3,
          release: 0.5
        },
        volume: 0 // デフォルト0dB（後で_setRootVolumeで調整）
      }).toDestination();
      
      this._setRootVolume(bassVol);
      this._enableRootSound(bassEnabled);
      
      this.bassSynthReady = true;
      console.debug('[FantasySoundManager] Bass synth initialized (instant, no external server)');
    } catch (e) {
      console.error('[FantasySoundManager] Bass synth initialization failed:', e);
    }
  }

  private _setRootVolume(v: number) {
    this.bassVolume = v;
    if (this.bassSynth) {
      // シンセの音量を設定（dB）- 音量を上げるため +6dB 補正
      (this.bassSynth.volume as any).value =
        v === 0 ? -Infinity : Math.log10(v) * 20 + 6;
    }
  }

  private _enableRootSound(enabled: boolean) {
    this.bassEnabled = enabled;
  }

  private async _unlock(): Promise<void> {
    try {
      // Tone.js のコンテキストをユーザー操作で開始
      try { await (window as any).Tone?.start?.(); } catch {}

      // SE 用の AudioContext を作成または再開
      if (!this.seAudioContext) {
        this.seAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: 'interactive' });
        this.seGainNode = this.seAudioContext.createGain();
        this.seGainNode.gain.setValueAtTime(this._volume, this.seAudioContext.currentTime);
        this.seGainNode.connect(this.seAudioContext.destination);
      }

      if (this.seAudioContext.state !== 'running') {
        await this.seAudioContext.resume();
      }

      // iOS Safari 向け: 無音バッファを短く再生して完全に解放
      try {
        const ctx = this.seAudioContext;
        const silentBuffer = ctx.createBuffer(1, 1, ctx.sampleRate);
        const src = ctx.createBufferSource();
        src.buffer = silentBuffer;
        src.connect(this.seGainNode || ctx.destination);
        src.start(0);
        src.addEventListener('ended', () => { try { src.disconnect(); } catch {} });
      } catch {}

      // HTMLAudio 経由も許可させるため、ミュートでワンプッシュ（端末依存のため best-effort）
      try {
        Object.values(this.audioMap).forEach(({ base }) => {
          if (!base.src) return;
          const originalMuted = base.muted;
          base.muted = true;
          const p = base.play();
          if (p && typeof p.then === 'function') {
            p.then(() => { base.pause(); base.currentTime = 0; base.muted = originalMuted; }).catch(() => { base.muted = originalMuted; });
          } else {
            try { base.pause(); base.currentTime = 0; } catch {}
            base.muted = originalMuted;
          }
        });
      } catch {}
    } catch (e) {
      console.warn('[FantasySoundManager] unlock failed:', e);
    }
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
      }

      const seFiles: Array<[keyof typeof this.seBuffers, string]> = [
        ['enemy_attack', 'enemy_attack.mp3'],
        ['fire', 'fire.mp3'],
        ['ice', 'ice.mp3'],
        ['thunder', 'thunder.mp3'],
        ['my_attack', 'my_attack.mp3'],
        ['stage_clear', 'stage_clear.mp3'],
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
}

// default export as singleton shortcuts
export default FantasySoundManager;
