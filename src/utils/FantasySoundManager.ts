/**
 * ファンタジーモード用サウンドマネージャー
 * 効果音の読み込みと再生を管理
 */

export interface SoundEffects {
  enemyAttack: HTMLAudioElement;
  fire: HTMLAudioElement;
  ice: HTMLAudioElement;
  thunder: HTMLAudioElement;
}

class FantasySoundManager {
  private sounds: Partial<SoundEffects> = {};
  private loadPromises: Map<string, Promise<void>> = new Map();
  private volume: number = 0.8; // デフォルト音量 80%

  /**
   * 音声ファイルを読み込む
   */
  private async loadSound(key: keyof SoundEffects, path: string): Promise<void> {
    // 既に読み込み中の場合は既存のPromiseを返す
    const existingPromise = this.loadPromises.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      
      audio.addEventListener('canplaythrough', () => {
        this.sounds[key] = audio;
        resolve();
      }, { once: true });
      
      audio.addEventListener('error', (e) => {
        console.error(`Failed to load sound ${key}:`, e);
        reject(new Error(`Failed to load sound ${key}`));
      }, { once: true });
      
      // 読み込み開始
      audio.load();
    });

    this.loadPromises.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * すべての効果音を初期化
   */
  async initialize(): Promise<void> {
    const loadPromises = [
      this.loadSound('enemyAttack', '/data/enemy_attack.mp3'),
      this.loadSound('fire', '/data/fire.mp3'),
      this.loadSound('ice', '/data/ice.mp3'),
      this.loadSound('thunder', '/data/thunder.mp3')
    ];

    try {
      await Promise.all(loadPromises);
      console.log('✅ Fantasy sound effects loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load some sound effects:', error);
    }
  }

  /**
   * 音量を設定
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // 既存のすべての音声要素の音量を更新
    Object.values(this.sounds).forEach(audio => {
      if (audio) {
        audio.volume = this.volume;
      }
    });
  }

  /**
   * 効果音を再生
   */
  async play(soundKey: keyof SoundEffects): Promise<void> {
    const audio = this.sounds[soundKey];
    if (!audio) {
      console.warn(`Sound ${soundKey} not loaded`);
      return;
    }

    try {
      // 音声をクローンして同時再生を可能にする
      const clone = audio.cloneNode(true) as HTMLAudioElement;
      clone.volume = this.volume;
      
      // 再生終了後にメモリから削除
      clone.addEventListener('ended', () => {
        clone.remove();
      }, { once: true });
      
      await clone.play();
    } catch (error) {
      console.error(`Failed to play sound ${soundKey}:`, error);
    }
  }

  /**
   * 魔法タイプに応じた効果音を再生
   */
  async playMagicSound(magicName: string, isSpecial: boolean = false): Promise<void> {
    // 魔法名から効果音を判定
    let soundKey: keyof SoundEffects | null = null;
    
    // フレア系（火属性）
    if (magicName.includes('フレア') || magicName.includes('インフェルノ') || magicName.includes('火')) {
      soundKey = 'fire';
    }
    // フロスト系（氷属性）
    else if (magicName.includes('フロスト') || magicName.includes('ブリザード') || magicName.includes('氷')) {
      soundKey = 'ice';
    }
    // スパーク系（雷属性）
    else if (magicName.includes('スパーク') || magicName.includes('サンダー') || magicName.includes('雷')) {
      soundKey = 'thunder';
    }
    else {
      // デフォルトはファイア
      soundKey = 'fire';
    }

    if (soundKey) {
      await this.play(soundKey);
    }
  }

  /**
   * 敵の攻撃音を再生
   */
  async playEnemyAttack(): Promise<void> {
    await this.play('enemyAttack');
  }

  /**
   * リソースのクリーンアップ
   */
  destroy(): void {
    Object.values(this.sounds).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.remove();
      }
    });
    this.sounds = {};
    this.loadPromises.clear();
  }
}

// シングルトンインスタンス
export const fantasySoundManager = new FantasySoundManager();