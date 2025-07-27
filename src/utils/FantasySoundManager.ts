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

  /** マスターボリューム (0‑1) */
  private _volume = 0.8;
  /** 初期化済みフラグ */
  private isInited = false;

  // ─────────────────────────────────────────────
  // ベース音関連フィールド
  private static bassSynth: any | null = null;
  private static bassVolume = 0.8;
  private static bassEnabled = true;

  // ─────────────────────────────────────────────
  // public static wrappers – 使いやすいように static 経由のエイリアスを用意
  public static async init(defaultVolume = 0.8, bassVol = 0.8, bassEnabled = true) { 
    return this.instance._init(defaultVolume, bassVol, bassEnabled); 
  }
  public static playMagic(type: MagicSeType) { return this.instance._playMagic(type); }
  public static playEnemyAttack() { return this.instance._playSe('enemy_attack'); }
  public static playMyAttack() { return this.instance._playSe('my_attack'); }
  public static setVolume(v: number) { return this.instance._setVolume(v); }
  public static getVolume() { return this.instance._volume; }

  // ─────────────────────────────────────────────
  // ベース音関連のstaticメソッド
  public static playRootNote(rootName: string) {
    if (!FantasySoundManager.bassEnabled || !FantasySoundManager.bassSynth) return;
    const Tone = window.Tone as typeof import('tone');
    const n = tonalNote(rootName + '2');        // C2 付近
    if (n.midi == null) return;
    FantasySoundManager.bassSynth.triggerAttackRelease(
      Tone.Frequency(n.midi, 'midi').toNote(),
      '8n',
      undefined,
      FantasySoundManager.bassVolume
    );
  }

  public static setRootVolume(v: number) {
    FantasySoundManager.bassVolume = v;
    if (FantasySoundManager.bassSynth) {
      (FantasySoundManager.bassSynth.volume as any).value =
        v === 0 ? -Infinity : Math.log10(v) * 20;
    }
  }

  public static enableRootSound(enabled: boolean) {
    FantasySoundManager.bassEnabled = enabled;
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

    return Promise.all(promises).then(async () => {
      // ─ BassSynth ─
      await this._initializeAudioSystem();
      const Tone = window.Tone as typeof import('tone');
      FantasySoundManager.bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'square' },
        filter:     { Q: 2, type: 'lowpass', rolloff: -24 },
        envelope:   { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.4 }
      }).toDestination();
      FantasySoundManager.setRootVolume(bassVol);
      FantasySoundManager.bassEnabled = bassEnabled;

      this.isInited = true;
      console.debug('[FantasySoundManager] init complete');
      // 初期化完了後の状態をログ出力
      Object.entries(this.audioMap).forEach(([key, entry]) => {
        console.debug(`[FantasySoundManager] ${key}: ready=${entry.ready}`);
      });
    });
  }

  private async _initializeAudioSystem(): Promise<void> {
    return new Promise((resolve) => {
      const initializeAudioSystem = async () => {
        try {
          const Tone = window.Tone as typeof import('tone');
          if (Tone.context.state !== 'running') {
            await Tone.context.resume();
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
  }

  private _playMagic(type: MagicSeType) {
    // magic type -> key mapping is 1:1
    console.debug(`[FantasySoundManager] playMagic called with type: ${type}`);
    // 魔法タイプに関わらず、常にmy_attackを再生
    this._playSe('my_attack');
  }

  private _playSe(key: keyof typeof this.audioMap) {
    console.debug(`[FantasySoundManager] _playSe called with key: ${key}`);
    
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

    console.debug(`[FantasySoundManager] Playing sound: ${key} at volume: ${this._volume}`);

    // 同時再生のため cloneNode()
    const node = base.cloneNode() as HTMLAudioElement;
    node.volume = this._volume;
    // onended で解放
    node.addEventListener('ended', () => {
      // Safari では remove() のみで OK、Chrome は detach で GC 対象
      node.src = '';
    });
    // play() は Promise—but 例外無視
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
}

// default export as singleton shortcuts
export default FantasySoundManager;
