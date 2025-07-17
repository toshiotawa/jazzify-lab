/**
 * 画像圧縮ユーティリティ
 * プロフィール画像: 256px/200KB/WebP
 * 日記画像: 1280px/1MB/WebP
 */

export interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  maxSizeKB: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
}

export const PROFILE_IMAGE_OPTIONS: CompressionOptions = {
  maxWidth: 256,
  maxHeight: 256,
  maxSizeKB: 200,
  quality: 0.8,
  format: 'webp'
};

export const DIARY_IMAGE_OPTIONS: CompressionOptions = {
  maxWidth: 1280,
  maxHeight: 1280,
  maxSizeKB: 1024,
  quality: 0.8,
  format: 'webp'
};

/**
 * 画像ファイルを圧縮
 * @param file 元画像ファイル
 * @param options 圧縮オプション
 * @returns 圧縮された画像Blob
 */
export async function compressImage(file: File, options: CompressionOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // 元画像のサイズを取得
        const { width, height } = img;
        
        // リサイズ後のサイズを計算（アスペクト比を保持）
        const scale = Math.min(options.maxWidth / width, options.maxHeight / height);
        const newWidth = Math.floor(width * scale);
        const newHeight = Math.floor(height * scale);
        
        // キャンバスサイズを設定
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // 画像を描画
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // 圧縮品質を調整しながらファイルサイズを制限
        compressWithQuality(canvas, options, resolve, reject);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // 画像を読み込み
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 品質を調整しながら指定サイズ以下になるまで圧縮
 */
function compressWithQuality(
  canvas: HTMLCanvasElement,
  options: CompressionOptions,
  resolve: (blob: Blob) => void,
  reject: (error: Error) => void,
  currentQuality: number = options.quality
): void {
  const mimeType = `image/${options.format}`;
  
  canvas.toBlob((blob) => {
    if (!blob) {
      reject(new Error('Failed to create blob'));
      return;
    }
    
    const sizeKB = blob.size / 1024;
    
    // 指定サイズ以下であれば完了
    if (sizeKB <= options.maxSizeKB || currentQuality <= 0.1) {
      resolve(blob);
      return;
    }
    
    // 品質を下げて再圧縮
    const newQuality = Math.max(0.1, currentQuality - 0.1);
    compressWithQuality(canvas, options, resolve, reject, newQuality);
  }, mimeType, currentQuality);
}

/**
 * プロフィール画像専用圧縮
 */
export async function compressProfileImage(file: File): Promise<Blob> {
  return compressImage(file, PROFILE_IMAGE_OPTIONS);
}

/**
 * 日記画像専用圧縮
 */
export async function compressDiaryImage(file: File): Promise<Blob> {
  return compressImage(file, DIARY_IMAGE_OPTIONS);
}