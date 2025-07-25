/*
 * FantasySoundManager
 * ---------------------------------------------
 * 効果音（SE）のロードと再生、音量管理を一括で行うシングルトンクラス。
 *  - 4 種の効果音をプリロード（fire / ice / thunder / enemy_attack）
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
    thunder:       { base: new Audio(), ready: false }
  };

  /** マスターボリューム (0‑1) */
  private _volume = 0.8;
  /** 初期化済みフラグ */
  private isInited = false;

  // ─────────────────────────────────────────────
  // public static wrappers – 使いやすいように static 経由のエイリアスを用意
  public static async init(defaultVolume = 0.8) { return this.instance._init(defaultVolume); }
  public static playMagic(type: MagicSeType) { return this.instance._playMagic(type); }
  public static playEnemyAttack() { return this.instance._playSe('enemy_attack'); }
  public static setVolume(v: number) { return this.instance._setVolume(v); }
  public static getVolume() { return this.instance._volume; }

  // ─────────────────────────────────────────────
  // private constructor – outsider cannot new
  private constructor () {/* nop */}

  // ─────────────────────────────────────────────
  // private helpers
  private _init(defaultVolume: number): Promise<void> {
    if (this.isInited) {
      // ボリューム値だけ同期する
      this._setVolume(defaultVolume);
      return Promise.resolve();
    }

    this._volume = defaultVolume;

    // 事前ロード – ユーザー操作後の初回呼び出しが推奨（Autoplay 制限対策）
    const path = (file: string) => `/sounds/${file}`;

    const load = (key: keyof typeof this.audioMap, file: string) => new Promise<void>((res, rej) => {
      const a = this.audioMap[key].base;
      a.src = path(file);
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
      load('thunder',       'thunder.mp3')
    ];

    return Promise.all(promises).then(() => {
      this.isInited = true;
      console.debug('[FantasySoundManager] init complete');
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
    this._playSe(type);
  }

  private _playSe(key: keyof typeof this.audioMap) {
    const entry = this.audioMap[key];
    if (!entry) return;

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
      // Safari では remove() のみで OK、Chrome は detach で GC 対象
      node.src = '';
    });
    // play() は Promise—but 例外無視
    node.play().catch(() => {/* autoplay 制限等で失敗しても握りつぶす */});
  }
}

// default export as singleton shortcuts
export default FantasySoundManager;
