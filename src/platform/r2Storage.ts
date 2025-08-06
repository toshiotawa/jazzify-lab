import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 configuration from environment variables
const R2_ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://jazzify-cdn.com';

// Initialize S3 client for R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Helper function to generate unique filenames
function generateUniqueFileName(originalName: string, prefix: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop() || 'bin';
  return `${prefix}_${timestamp}_${randomString}.${ext}`;
}

// Upload avatar to R2
export async function uploadAvatarToR2(file: File, userId: string): Promise<string> {
  try {
    const ext = file.type.includes('png') ? 'png' : 'jpg';
    const key = `avatars/${userId}.${ext}`;
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000', // 1 year cache
    });
    
    await s3Client.send(command);
    
    // Return the public URL
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('R2 avatar upload error:', error);
    throw new Error('アバターのアップロードに失敗しました');
  }
}

// Upload diary image to R2
export async function uploadDiaryImageToR2(file: File, userId: string, diaryId: string): Promise<string> {
  try {
    const ext = file.name.split('.').pop() || 'webp';
    const key = `diary-images/${userId}/${diaryId}.${ext}`;
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: file.type || 'image/webp',
      CacheControl: 'public, max-age=2592000', // 30 days cache
    });
    
    await s3Client.send(command);
    
    // Return the public URL
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('R2 diary image upload error:', error);
    throw new Error('日記画像のアップロードに失敗しました');
  }
}

// Upload song file to R2
export async function uploadSongFileToR2(
  file: File, 
  songId: string, 
  fileType: 'audio' | 'xml' | 'json'
): Promise<string> {
  try {
    let ext: string;
    switch (fileType) {
      case 'audio':
        ext = 'mp3';
        break;
      case 'xml':
        ext = 'xml';
        break;
      case 'json':
        ext = 'json';
        break;
    }
    
    const key = `song-files/${songId}/${fileType}.${ext}`;
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: file.type || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000', // 1 year cache
    });
    
    await s3Client.send(command);
    
    // Return the public URL
    return `${R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('R2 song file upload error:', error);
    throw new Error(`${fileType}ファイルのアップロードに失敗しました`);
  }
}

// Delete avatar from R2
export async function deleteAvatarFromR2(userId: string): Promise<void> {
  try {
    const possibleKeys = [
      `avatars/${userId}.jpg`,
      `avatars/${userId}.png`,
    ];
    
    for (const key of possibleKeys) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
        });
        await s3Client.send(command);
      } catch (error) {
        // Ignore if file doesn't exist
      }
    }
  } catch (error) {
    console.error('R2 avatar deletion error:', error);
    // Don't throw error for deletion failures
  }
}

// Delete diary image from R2
export async function deleteDiaryImageFromR2(userId: string, diaryId: string): Promise<void> {
  try {
    const possibleKeys = [
      `diary-images/${userId}/${diaryId}.webp`,
      `diary-images/${userId}/${diaryId}.jpg`,
      `diary-images/${userId}/${diaryId}.jpeg`,
      `diary-images/${userId}/${diaryId}.png`,
    ];
    
    for (const key of possibleKeys) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
        });
        await s3Client.send(command);
      } catch (error) {
        // Ignore if file doesn't exist
      }
    }
  } catch (error) {
    console.error('R2 diary image deletion error:', error);
    // Don't throw error for deletion failures
  }
}

// Delete song files from R2
export async function deleteSongFilesFromR2(songId: string): Promise<void> {
  try {
    const keys = [
      `song-files/${songId}/audio.mp3`,
      `song-files/${songId}/xml.xml`,
      `song-files/${songId}/json.json`,
    ];
    
    for (const key of keys) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
        });
        await s3Client.send(command);
      } catch (error) {
        // Ignore if file doesn't exist
      }
    }
  } catch (error) {
    console.error('R2 song files deletion error:', error);
    // Don't throw error for deletion failures
  }
}

// Generate a presigned URL for private file access (if needed in the future)
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('R2 presigned URL generation error:', error);
    throw new Error('ファイルURLの生成に失敗しました');
  }
}