/**
 * 音声再生ユーティリティ
 */

// 効果音のパス定義
export const SFX_PATHS = {
  FIRE: '/data/fire.mp3',
  ICE: '/data/ice.mp3',
  THUNDER: '/data/thunder.mp3',
  ENEMY_ATTACK: '/data/enemy_attack.mp3'
} as const;

// 音声ファイルのキャッシュ
const audioCache = new Map<string, HTMLAudioElement>();

/**
 * 音声ファイルをプリロード
 */
export const preloadAudio = async (path: string): Promise<void> => {
  if (audioCache.has(path)) {
    return;
  }

  try {
    const audio = new Audio(path);
    audio.preload = 'auto';
    
    // ロード完了を待つ
    await new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', resolve, { once: true });
      audio.addEventListener('error', reject, { once: true });
      audio.load();
    });
    
    audioCache.set(path, audio);
  } catch (error) {
    console.error(`Failed to preload audio: ${path}`, error);
  }
};

/**
 * すべての効果音をプリロード
 */
export const preloadAllSFX = async (): Promise<void> => {
  const paths = Object.values(SFX_PATHS);
  await Promise.all(paths.map(path => preloadAudio(path)));
};

/**
 * 効果音を再生
 * @param path 音声ファイルのパス
 * @param volume 音量 (0.0 - 1.0)
 */
export const playSFX = async (path: string, volume: number = 1.0): Promise<void> => {
  try {
    // キャッシュから取得、なければ新規作成
    let audio = audioCache.get(path);
    
    if (!audio) {
      audio = new Audio(path);
      audioCache.set(path, audio);
    }
    
    // 複数同時再生に対応するため、クローンを作成
    const audioClone = audio.cloneNode() as HTMLAudioElement;
    audioClone.volume = Math.max(0, Math.min(1, volume)); // 0-1の範囲に制限
    
    // 再生終了後にメモリを解放
    audioClone.addEventListener('ended', () => {
      audioClone.remove();
    }, { once: true });
    
    // 再生
    await audioClone.play();
  } catch (error) {
    console.error(`Failed to play SFX: ${path}`, error);
  }
};

/**
 * ランダムな魔法効果音を選択
 */
export const getRandomMagicSFX = (): string => {
  const magicSounds = [SFX_PATHS.FIRE, SFX_PATHS.ICE, SFX_PATHS.THUNDER];
  return magicSounds[Math.floor(Math.random() * magicSounds.length)];
};