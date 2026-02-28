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
import Soundfont from 'soundfont-player';

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
  // ベース音関連フィールド - GM音源 + 合成音フォールバック
  private bassSynth: any | null = null;           // 合成音（フォールバック用）
  private pianoSampler: any | null = null;        // Salamander Piano サンプラー（Tone.js）
  private pianoSamplerReady = false;              // Tone.jsサンプラー読み込み完了フラグ
  private usePianoSampler = true;                 // ピアノサンプラーを優先使用
  private gmAcousticPiano: Soundfont.Player | null = null;  // GM音源アコースティックピアノ
  private gmElectricPiano: Soundfont.Player | null = null;  // GM音源エレクトリックピアノ
  private gmPianoReady = false;                             // GM音源読み込み完了フラグ
  private gmAudioContext: AudioContext | null = null;
  // ミックスバランス（0.0 = アコースティックのみ、1.0 = エレクトリックのみ、0.5 = 半々）
  private gmMixBalance = 0.4;  // アコースティック60% + エレクトリック40%
  // アクティブなノート（停止用に追跡）
  private activeGMNotes: Map<number, { acoustic?: any; electric?: any; gainNode?: GainNode }> = new Map();
  private gmMasterGain: GainNode | null = null;
  private gmDryGain: GainNode | null = null;
  private gmWetGain: GainNode | null = null;
  private gmConvolver: ConvolverNode | null = null;
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
  
  // GM音源でMIDIノートを再生（ピアノ演奏用）
  public static playGMNote(midiNote: number, velocity: number = 1.0) {
    return this.instance._playGMNote(midiNote, velocity);
  }
  
  // GM音源のノートを停止
  public static stopGMNote(midiNote: number) {
    return this.instance._stopGMNote(midiNote);
  }
  
  // BGM用: ノートを指定時間鳴らして自然にフェードアウト（手動停止不要）
  public static playBgmNote(midiNote: number, velocity: number, durationSec: number) {
    return this.instance._playBgmGMNote(midiNote, velocity, durationSec);
  }
  
  // GM音源が利用可能かどうか
  public static isGMReady(): boolean {
    return this.instance.gmPianoReady && this.instance.gmAcousticPiano !== null;
  }
  
  // GM音源のピアノ音量を設定（0-1）
  public static setGMPianoVolume(volume: number) {
    this.instance._setGMPianoVolume(volume);
  }
  public static setRootVolume(v: number) {
    this.instance._setRootVolume(v);
  }
  public static enableRootSound(enabled: boolean) {
    this.instance._enableRootSound(enabled);
  }
  public static async unlock(): Promise<void> { return this.instance._unlock(); }
  
  /**
   * ルート音システムのウォームアップ
   * ゲーム開始前に呼び出して、最初のルート音が遅延しないようにする
   */
  public static async warmupRootSound(): Promise<void> {
    return this.instance._warmupRootSound();
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

    const load = (key: keyof typeof this.audioMap, file: string) => new Promise<void>((res) => {
      const a = this.audioMap[key].base;
      const fullPath = path(file);
      let resolved = false;
      const done = (ready: boolean) => {
        if (resolved) return;
        resolved = true;
        if (ready) this.audioMap[key].ready = true;
        res();
      };
      a.src = fullPath;
      a.preload = 'auto';
      a.volume = this._volume;
      // iOS Safari: readyState >= 4 ならロード済み（イベント発火不要）
      if (a.readyState >= 4) { done(true); return; }
      a.addEventListener('canplaythrough', () => done(true), { once: true });
      a.addEventListener('error', () => done(false), { once: true });
      a.load();
      // iOS Autoplay制限で canplaythrough が発火しないケースへの安全弁
      setTimeout(() => done(false), 3000);
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
      this._setupSeContextAndBuffers(baseUrl).catch(() => {
        // SE buffer setup failed - ignored
      });

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
        } catch {
          // BassSynth creation failed - ignored
        }

        // Phase 2: Salamander Piano サンプラー（バックグラウンド読み込み）
        // 6つの基準音（C2-C7）から全音域を補間
        this._loadPianoSampler(Tone, baseUrl).catch(() => {
          // Piano sampler load skipped
        });
      }

      // Phase 3: GM音源ピアノ（soundfont-player）を読み込み
      // CDNから必要な音だけオンデマンドで取得（軽量・高品質）
      // 読み込み完了を待つ（最大8秒）
      try {
        await Promise.race([
          this._loadGMPiano(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('GM Piano load timeout')), 8000))
        ]);
      } catch {
        // GM Piano load skipped
      }
      this._setRootVolume(bassVol);
      this._enableRootSound(bassEnabled);

      this.isInited = true;
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
            } catch {
              // Failed to dynamic import tone - ignored
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
            } catch {
              // Tone context optimization failed - ignored
            }
          }
          resolve();
        } catch {
          // Audio system initialization failed - continue anyway
          resolve();
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

  private _playMagic(_type: MagicSeType) {
    // 魔法タイプに関わらず、常にmy_attackを再生
    this._playSe('my_attack');
  }

  private _playSe(key: keyof typeof this.audioMap) {
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
      } catch {
        // WebAudio再生失敗、HTMLAudioにフォールバック
      }
    }
    
    const entry = this.audioMap[key];
    if (!entry) {
      return;
    }

    const base = entry.base;
    if (!entry.ready) {
      // 未ロード or 失敗時は何もしない（ユーザー体験阻害しない）
      return;
    }

    // 同時再生のため cloneNode()
    const node = base.cloneNode() as HTMLAudioElement;
    node.volume = this._volume;
    // onended で解放
    node.addEventListener('ended', () => {
      node.src = '';
    });
    const playPromise = node.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 再生失敗は無視
      });
    }
  }

  // 🎸 ルート音再生（Web Audio API直接使用 - クリック音完全防止）
  // 🚀 パフォーマンス最適化: setTimeout不使用、Web Audio APIスケジューリングのみ
  // 🚀 クリック音防止: linearRampでスムーズなフェードイン/フェードアウト
  private _playRootNote(rootName: string) {
    // 初期化が完了していない場合は無視
    if (!this.isInited || !this.bassEnabled) return;
    
    const n = tonalNote(rootName + '2');        // C2 付近
    if (n.midi == null) return;
    
    // Web Audio APIコンテキストを取得または作成（初回のみ）
    if (!this.rootAudioContext) {
      try {
        this.rootAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: 'interactive' });
        this.rootMasterGain = this.rootAudioContext.createGain();
        this.rootMasterGain.connect(this.rootAudioContext.destination);
        this._syncRootBassVolume();
      } catch {
        return;
      }
    }
    
    const ctx = this.rootAudioContext;
    if (!ctx || !this.rootMasterGain) return;
    
    // AudioContextがsuspended状態ならresumeする（非ブロッキング、待機しない）
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    const now = ctx.currentTime;
    const frequency = 440 * Math.pow(2, (n.midi - 69) / 12);
    
    // 🚀 前のオシレーターはWeb Audio APIのstop()でスケジュール停止（setTimeoutなし）
    // onended イベントで自動クリーンアップされる
    if (this.activeRootOscillator && this.activeRootGain) {
      try {
        // 30ms後に停止をスケジュール（フェードアウト完了後）
        this.activeRootGain.gain.linearRampToValueAtTime(0, now + 0.03);
        this.activeRootOscillator.stop(now + 0.035);
      } catch { /* 既に停止済み */ }
    }
    
    try {
      // 新しいオシレーターを作成
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = frequency;
      
      // 個別のゲインノード
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      
      osc.connect(gainNode);
      gainNode.connect(this.rootMasterGain);
      
      // エンベロープ（すべてスケジュール済み、メインスレッド負荷なし）
      const totalDuration = 0.4; // 400ms
      gainNode.gain.linearRampToValueAtTime(1.0, now + 0.01);      // 10ms attack
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.12);      // 110ms後にdecay
      gainNode.gain.linearRampToValueAtTime(0, now + totalDuration); // 400ms後にfade out完了
      
      osc.start(now);
      osc.stop(now + totalDuration + 0.01);
      
      // onendedでクリーンアップ（Web Audioスレッドで実行、メインスレッド負荷なし）
      osc.onended = () => {
        try {
          osc.disconnect();
          gainNode.disconnect();
        } catch { /* ignore */ }
      };
      
      this.activeRootOscillator = osc;
      this.activeRootGain = gainNode;
      
    } catch { /* ignore */ }
  }
  
  // 🎸 ルート音用 Web Audio API リソース
  private rootAudioContext: AudioContext | null = null;
  private rootMasterGain: GainNode | null = null;
  private activeRootOscillator: OscillatorNode | null = null;
  private activeRootGain: GainNode | null = null;
  
  // ルート音ベースの音量を同期
  private _syncRootBassVolume(): void {
    if (this.rootMasterGain && this.rootAudioContext) {
      // gmPianoVolumeとbassVolumeの両方を考慮
      const effectiveVolume = Math.max(this.gmPianoVolume, this.bassVolume);
      // 音量を0.3〜1.0の範囲で調整（小さすぎると聞こえない）
      const normalizedVolume = 0.3 + effectiveVolume * 0.7;
      try {
        this.rootMasterGain.gain.setValueAtTime(normalizedVolume, this.rootAudioContext.currentTime);
      } catch {
        // エラーは無視
      }
    }
    
    // 旧Tone.jsシンセがある場合も同期（互換性維持）
    if (this.rootBassSynth) {
      const effectiveVolume = Math.max(this.gmPianoVolume, this.bassVolume);
      const dbValue = effectiveVolume === 0 ? -Infinity : Math.log10(effectiveVolume) * 20 + 6;
      try {
        (this.rootBassSynth.volume as any).value = dbValue;
      } catch {
        // エラーは無視
      }
    }
  }
  
  // 🎸 ルート音用シンセ（旧Tone.js版 - 互換性のために残す）
  private rootBassSynth: any | null = null;

  // GM音源でMIDIノートを再生（ピアノ演奏用）
  private async _playGMNote(midiNote: number, velocity: number = 1.0) {
    if (!this.gmPianoReady || !this.gmAudioContext || !this.gmAcousticPiano) {
      return;
    }
    
    try {
      if (this.gmAudioContext.state === 'suspended') {
        await this.gmAudioContext.resume();
      }
      
      this._stopGMNote(midiNote);
      
      const ctx = this.gmAudioContext;
      const currentTime = ctx.currentTime;
      const volumeBoost = 8.0;
      const baseGain = velocity * volumeBoost * this.gmPianoVolume;
      const acousticGain = baseGain * (1 - this.gmMixBalance * 0.5);
      const electricGain = baseGain * this.gmMixBalance;
      
      const noteGain = ctx.createGain();
      noteGain.gain.value = 1.0;
      noteGain.connect(this.gmMasterGain || ctx.destination);
      
      const activeNodes: { acoustic?: any; electric?: any; gainNode?: GainNode } = { gainNode: noteGain };
      
      if (acousticGain > 0) {
        activeNodes.acoustic = this.gmAcousticPiano.play(midiNote.toString(), currentTime, {
          gain: acousticGain,
          duration: 10.0,
          destination: noteGain
        } as any);
      }
      
      if (this.gmElectricPiano && electricGain > 0) {
        activeNodes.electric = this.gmElectricPiano.play(midiNote.toString(), currentTime, {
          gain: electricGain,
          duration: 10.0,
          destination: noteGain
        } as any);
      }
      
      this.activeGMNotes.set(midiNote, activeNodes);
    } catch {
      // GM note playback error - ignore
    }
  }

  // GM音源のノートを即時停止
  private _stopGMNote(midiNote: number) {
    const activeNodes = this.activeGMNotes.get(midiNote);
    if (!activeNodes) return;
    this.activeGMNotes.delete(midiNote);

    try {
      if (activeNodes.acoustic?.stop) activeNodes.acoustic.stop();
      if (activeNodes.electric?.stop) activeNodes.electric.stop();
      if (activeNodes.gainNode) activeNodes.gainNode.disconnect();
    } catch { /* ignore */ }
  }

  // BGM用: 指定durationで再生し自然にフェードアウト（手動stop不要）
  private _playBgmGMNote(midiNote: number, velocity: number, durationSec: number) {
    if (!this.gmPianoReady || !this.gmAudioContext || !this.gmAcousticPiano) return;

    try {
      const ctx = this.gmAudioContext;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const currentTime = ctx.currentTime;
      const volumeBoost = 8.0;
      const baseGain = velocity * volumeBoost * this.gmPianoVolume;
      const acousticGain = baseGain * (1 - this.gmMixBalance * 0.5);
      const electricGain = baseGain * this.gmMixBalance;

      const noteGain = ctx.createGain();
      noteGain.gain.value = 1.0;
      noteGain.connect(this.gmMasterGain || ctx.destination);

      const fadeStart = currentTime + durationSec;
      const fadeTime = 0.35;
      noteGain.gain.setValueAtTime(1.0, fadeStart);
      noteGain.gain.linearRampToValueAtTime(0, fadeStart + fadeTime);

      const totalDuration = durationSec + fadeTime + 0.05;

      if (acousticGain > 0) {
        this.gmAcousticPiano.play(midiNote.toString(), currentTime, {
          gain: acousticGain,
          duration: totalDuration,
          destination: noteGain
        } as any);
      }

      if (this.gmElectricPiano && electricGain > 0) {
        this.gmElectricPiano.play(midiNote.toString(), currentTime, {
          gain: electricGain,
          duration: totalDuration,
          destination: noteGain
        } as any);
      }

      setTimeout(() => {
        try { noteGain.disconnect(); } catch { /* ignore */ }
      }, totalDuration * 1000 + 100);
    } catch {
      // BGM note playback error - ignore
    }
  }

  // GM音源のピアノ音量を内部的に保持
  private gmPianoVolume = 1.0;

  // GM音源のピアノ音量を設定（0-1）
  private _setGMPianoVolume(volume: number) {
    this.gmPianoVolume = Math.max(0, Math.min(1, volume));
    // ルート音用ベースシンセの音量も同期
    this._syncRootBassVolume();
  }

  private _createReverbImpulse(context: AudioContext, duration = 1.8, decay = 2.5): AudioBuffer {
    const sampleRate = context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = context.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  // GM音源（Acoustic + Electric Piano）の読み込み
  private async _loadGMPiano(): Promise<void> {
    try {
      if (!this.gmAudioContext) {
        this.gmAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      this.gmMasterGain = this.gmAudioContext.createGain();
      this.gmDryGain = this.gmAudioContext.createGain();
      this.gmWetGain = this.gmAudioContext.createGain();
      this.gmConvolver = this.gmAudioContext.createConvolver();

      this.gmMasterGain.connect(this.gmAudioContext.destination);

      const soundfontOptions: any = {
        soundfont: 'MusyngKite',
        format: 'mp3',
        destination: this.gmMasterGain
      };

      const [acoustic, electric] = await Promise.all([
        Soundfont.instrument(
          this.gmAudioContext,
          'acoustic_grand_piano',
          soundfontOptions
        ),
        Soundfont.instrument(
          this.gmAudioContext,
          'electric_piano_1',
          soundfontOptions
        )
      ]);
      
      this.gmAcousticPiano = acoustic;
      this.gmElectricPiano = electric;
      this.gmPianoReady = true;
    } catch {
      this.gmPianoReady = false;
    }
  }

  // 🎹 ピアノサンプラーで任意のノートを再生（将来の拡張用）
  public static async playPianoNote(noteName: string, duration: string = '4n') {
    return this.instance._playPianoNote(noteName, duration);
  }

  private async _playPianoNote(noteName: string, duration: string = '4n') {
    if (!this.pianoSamplerReady || !this.pianoSampler) {
      return;
    }
    
    const Tone = window.Tone as unknown as typeof import('tone');
    if (!Tone) return;
    
    let t = Tone.now();
    if (t <= this.lastRootStart) t = this.lastRootStart + 0.001;
    this.lastRootStart = t;
    
    try {
      this.pianoSampler.triggerAttackRelease(noteName, duration, t);
    } catch {
      // Piano note playback error - ignored
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
      } catch {
        // Synth volume set error - ignored
      }
    }
    
    // ピアノサンプラーの音量も同期
    this._syncPianoSamplerVolume();
    
    // ルート音用ベースシンセの音量も同期
    this._syncRootBassVolume();
  }

  private _enableRootSound(enabled: boolean) {
    this.bassEnabled = enabled;
  }

  /**
   * ルート音システムのウォームアップ
   * AudioContextを事前に初期化し、無音のオシレーターを短時間再生して
   * 最初の実際の音が遅延しないようにする
   */
  private async _warmupRootSound(): Promise<void> {
    try {
      // rootAudioContextが未初期化の場合は作成
      if (!this.rootAudioContext) {
        this.rootAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: 'interactive' });
        this.rootMasterGain = this.rootAudioContext.createGain();
        this.rootMasterGain.connect(this.rootAudioContext.destination);
        this._syncRootBassVolume();
      }
      
      const ctx = this.rootAudioContext;
      if (!ctx || !this.rootMasterGain) return;
      
      // AudioContextがsuspended状態ならresumeする
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      // 無音のオシレーターを短時間再生してシステムをウォームアップ
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = 440; // A4
      
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0; // 無音（音量0）
      
      osc.connect(gainNode);
      gainNode.connect(this.rootMasterGain);
      
      // 非常に短い時間（10ms）だけ再生してWebAudioシステムを起動
      osc.start(now);
      osc.stop(now + 0.01);
      
      osc.onended = () => {
        try {
          osc.disconnect();
          gainNode.disconnect();
        } catch { /* ignore */ }
      };
    } catch {
      // ウォームアップ失敗は無視（メインの機能には影響しない）
    }
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

      // GM音源用のAudioContextもresumeする
      if (this.gmAudioContext && this.gmAudioContext.state !== 'running') {
        await this.gmAudioContext.resume();
      }

      // ルート音用のAudioContextを事前作成（初回 playRootNote のブロッキングを防止）
      if (!this.rootAudioContext) {
        try {
          this.rootAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: 'interactive' });
          this.rootMasterGain = this.rootAudioContext.createGain();
          this.rootMasterGain.connect(this.rootAudioContext.destination);
          this._syncRootBassVolume();
        } catch { /* ignore */ }
      }
      if (this.rootAudioContext && this.rootAudioContext.state !== 'running') {
        await this.rootAudioContext.resume();
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
    } catch {
      // unlock failed - ignored
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
            resolve();
          },
          onerror: (err: Error) => {
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
            this.usePianoSampler = false;
            reject(new Error('Piano sampler load timeout'));
          }
        }, 5000);
        
      } catch (e) {
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
      } catch {
        // Piano sampler volume sync error - ignored
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
        } catch {
          // Failed to decode SE buffer - ignored
        }
      }));
    } catch {
      // SE AudioContext setup failed - ignored
    }
  }
}

// default export as singleton shortcuts
export default FantasySoundManager;
