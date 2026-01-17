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
  // ベース音関連フィールド - ピアノサンプラー + 合成音フォールバック
  private bassSynth: any | null = null;           // 合成音（フォールバック用）
  private pianoSampler: any | null = null;        // Salamander Piano サンプラー
  private pianoSamplerReady = false;              // サンプラー読み込み完了フラグ
  private usePianoSampler = true;                 // ピアノサンプラーを優先使用
  private bassVolume = 0.5; // デフォルト50%
  private bassEnabled = true;
  private lastRootStart = 0; // Tone.js例外対策用
  private bassInitialized = false; // 合成音は即座に初期化完了

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

    // ロード完了Promiseを保存
    this.loadedPromise = Promise.all(promises).then(async () => {
      // ─ BassSynth ─ 合成音を使用（外部ファイル不要で高速起動）
      await this._initializeAudioSystem();

      // 低遅延SE用 Web Audio セットアップ + デコード（バックグラウンド）
      this._setupSeContextAndBuffers(baseUrl).catch(e => 
        console.warn('[FantasySoundManager] SE buffer setup failed:', e)
      );

      // 🎹 ピアノ音源システム（ハイブリッド）
      // Phase 1: 合成音で即座に利用可能（フォールバック）
      // Phase 2: バックグラウンドでSalamanderサンプラーを読み込み
      const Tone = window.Tone as unknown as typeof import('tone');
      if (Tone) {
        // Phase 1: ピアノ風合成音シンセサイザー（FM合成）
        try {
          // FM合成でピアノに近い音色を実現
          // ピアノは打弦楽器のため、素早いアタックと自然な減衰が特徴
          this.bassSynth = new (Tone as any).FMSynth({
            harmonicity: 3,           // 倍音の関係（ピアノらしさに重要）
            modulationIndex: 10,      // FM変調の深さ
            oscillator: {
              type: 'sine'            // キャリア波形
            },
            envelope: {
              attack: 0.001,          // 非常に素早いアタック（打鍵感）
              decay: 0.5,             // 自然な減衰
              sustain: 0.1,           // 低いサステイン（ピアノらしさ）
              release: 1.2            // 長めのリリース（残響感）
            },
            modulation: {
              type: 'square'          // モジュレーター波形（倍音を豊かに）
            },
            modulationEnvelope: {
              attack: 0.002,
              decay: 0.2,
              sustain: 0.2,
              release: 0.5
            }
          }).toDestination();
          this.bassInitialized = true;
          console.debug('[FantasySoundManager] BassSynth (FM Piano) initialized');
        } catch (e) {
          console.warn('[FantasySoundManager] BassSynth creation failed:', e);
        }

        // Phase 2: Salamander Piano サンプラー（バックグラウンド読み込み）
        // 3つの基準音（C2, C3, C4）から全音域を補間
        this._loadPianoSampler(Tone, baseUrl).catch(e => {
          console.debug('[FantasySoundManager] Piano sampler load skipped:', e);
        });
      }
      this._setRootVolume(bassVol);
      this._enableRootSound(bassEnabled);

      this.isInited = true;
      console.debug('[FantasySoundManager] init complete (fast mode)');
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

  // 🔊 ルート音再生（合成音を使用 - ファンタジーモード用）
  private async _playRootNote(rootName: string) {
    // 初期化完了済みの場合は待機をスキップ（高速化）
    if (!this.isInited && this.loadedPromise) {
      // 最大100msだけ待機（それ以上は諦めて続行）
      const timeout = new Promise(res => setTimeout(res, 100));
      await Promise.race([this.loadedPromise, timeout]);
    }

    if (!this.bassEnabled || !this.bassSynth) return;
    
    const Tone = window.Tone as unknown as typeof import('tone');
    if (!Tone) return; // Tone.js未ロードの場合は早期リターン
    
    const n = tonalNote(rootName + '2');        // C2 付近
    if (n.midi == null) return;
    
    // Tone.js 例外対策：必ず前回より >0 の startTime
    let t = Tone.now();
    if (t <= this.lastRootStart) t = this.lastRootStart + 0.001;
    this.lastRootStart = t;
    
    const note = Tone.Frequency(n.midi, 'midi').toNote();
    
    // 🔊 FM合成ピアノ音で再生（低遅延・安定）
    try {
      this.bassSynth.triggerAttackRelease(
        note,
        '4n',   // ピアノらしい長さ
        t
      );
    } catch (e) {
      console.debug('[FantasySoundManager] Root note playback error:', e);
    }
  }

  // 🎹 ピアノサンプラーで任意のノートを再生（将来の拡張用）
  public static async playPianoNote(noteName: string, duration: string = '4n') {
    return this.instance._playPianoNote(noteName, duration);
  }

  private async _playPianoNote(noteName: string, duration: string = '4n') {
    if (!this.pianoSamplerReady || !this.pianoSampler) {
      console.debug('[FantasySoundManager] Piano sampler not ready');
      return;
    }
    
    const Tone = window.Tone as unknown as typeof import('tone');
    if (!Tone) return;
    
    let t = Tone.now();
    if (t <= this.lastRootStart) t = this.lastRootStart + 0.001;
    this.lastRootStart = t;
    
    try {
      this.pianoSampler.triggerAttackRelease(noteName, duration, t);
    } catch (e) {
      console.debug('[FantasySoundManager] Piano note playback error:', e);
    }
  }

  private _setRootVolume(v: number) {
    this.bassVolume = v;
    
    // 合成音の音量を調整
    if (this.bassSynth) {
      // dB変換 + 補正（合成音は少し控えめに）
      const dbValue = v === 0 ? -Infinity : Math.log10(v) * 20 - 3;
      try {
        (this.bassSynth.volume as any).value = dbValue;
      } catch (e) {
        console.debug('[FantasySoundManager] Synth volume set error:', e);
      }
    }
    
    // ピアノサンプラーの音量も同期
    this._syncPianoSamplerVolume();
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
  // Piano Sampler setup (Salamander Grand Piano)
  private async _loadPianoSampler(Tone: typeof import('tone'), baseUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const pianoPath = `${baseUrl}sounds/piano/`;
        
        // Tone.Sampler: 6つの基準音から全音域を自動補間
        // C2-C7 の6サンプルで約380KB（軽量）
        const sampler = new (Tone as any).Sampler({
          urls: {
            C2: 'C2.mp3',
            C3: 'C3.mp3',
            C4: 'C4.mp3',
            C5: 'C5.mp3',
            C6: 'C6.mp3',
            C7: 'C7.mp3',
          },
          baseUrl: pianoPath,
          onload: () => {
            this.pianoSampler = sampler;
            this.pianoSamplerReady = true;
            // 音量を合成音と同じレベルに設定
            this._syncPianoSamplerVolume();
            console.debug('[FantasySoundManager] 🎹 Salamander Piano sampler loaded (6 samples, ~380KB)');
            resolve();
          },
          onerror: (err: Error) => {
            console.debug('[FantasySoundManager] Piano sampler load error, using synthetic fallback:', err.message);
            this.usePianoSampler = false;
            reject(err);
          },
          // 音質とパフォーマンスのバランス設定
          attack: 0,           // 即座にアタック
          release: 0.5,        // 適度なリリース
        }).toDestination();
        
        // タイムアウト設定（5秒で合成音にフォールバック）
        setTimeout(() => {
          if (!this.pianoSamplerReady) {
            console.debug('[FantasySoundManager] Piano sampler timeout, using synthetic fallback');
            this.usePianoSampler = false;
            reject(new Error('Piano sampler load timeout'));
          }
        }, 5000);
        
      } catch (e) {
        console.debug('[FantasySoundManager] Piano sampler setup error:', e);
        this.usePianoSampler = false;
        reject(e);
      }
    });
  }

  // ピアノサンプラーの音量を同期
  private _syncPianoSamplerVolume(): void {
    if (this.pianoSampler) {
      // dB変換（合成音と同じロジック）
      const dbValue = this.bassVolume === 0 ? -Infinity : Math.log10(this.bassVolume) * 20;
      try {
        (this.pianoSampler.volume as any).value = dbValue;
      } catch (e) {
        console.debug('[FantasySoundManager] Piano sampler volume sync error:', e);
      }
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
