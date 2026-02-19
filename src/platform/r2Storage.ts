import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';

// R2クライアントの初期化
const getR2Client = () => {
  const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2の認証情報が設定されていません');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

// バケット名とパブリックURLの取得
const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME || 'jazzify-storage';
const PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://jazzify-cdn.com';

// ファイルサイズの制限
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_SONG_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_DIARY_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_LESSON_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024; // 50MB

// ファイルサイズのチェック
function checkFileSize(file: File, maxSize: number, fileType: string) {
  if (file.size > maxSize) {
    throw new Error(`${fileType}のファイルサイズが制限（${maxSize / 1024 / 1024}MB）を超えています`);
  }
}

// アバター画像のアップロード
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  checkFileSize(file, MAX_AVATAR_SIZE, 'アバター画像');
  
  const client = getR2Client();
  const ext = file.type.includes('png') ? 'png' : 'jpg';
  const key = `avatars/${userId}.${ext}`;
  
  // FileをArrayBufferに変換
  const arrayBuffer = await file.arrayBuffer();
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: new Uint8Array(arrayBuffer),
    ContentType: file.type,
    CacheControl: 'public, max-age=31536000', // 1年間キャッシュ
  });
  
  await client.send(command);
  
  return `${PUBLIC_URL}/${key}`;
}

// 曲ファイルのアップロード
export async function uploadSongFile(
  file: File, 
  songId: string, 
  fileType: 'audio' | 'xml' | 'json'
): Promise<string> {
  checkFileSize(file, MAX_SONG_FILE_SIZE, '曲ファイル');
  
  const client = getR2Client();
  
  // ファイルタイプに応じた拡張子を決定
  let ext: string;
  let contentType: string;
  switch (fileType) {
    case 'audio':
      ext = 'mp3';
      contentType = 'audio/mpeg';
      break;
    case 'xml':
      ext = 'xml';
      contentType = 'application/xml';
      break;
    case 'json':
      ext = 'json';
      contentType = 'application/json';
      break;
  }
  
  const key = `song-files/${songId}/${fileType}.${ext}`;
  
  // FileをArrayBufferに変換
  const arrayBuffer = await file.arrayBuffer();
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: new Uint8Array(arrayBuffer),
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000', // 1年間キャッシュ
  });
  
  await client.send(command);
  
  return `${PUBLIC_URL}/${key}?v=${Date.now()}`;
}

// 曲ファイルの削除
export async function deleteSongFiles(songId: string): Promise<void> {
  const client = getR2Client();
  
  const objects = [
    { Key: `song-files/${songId}/audio.mp3` },
    { Key: `song-files/${songId}/xml.xml` },
    { Key: `song-files/${songId}/json.json` },
  ];
  
  const command = new DeleteObjectsCommand({
    Bucket: BUCKET_NAME,
    Delete: {
      Objects: objects,
    },
  });
  
  await client.send(command);
}

// 日記画像のアップロード
export async function uploadDiaryImage(file: File, userId: string, diaryId: string): Promise<string> {
  checkFileSize(file, MAX_DIARY_IMAGE_SIZE, '日記画像');
  
  const client = getR2Client();
  const ext = file.name.split('.').pop() || 'webp';
  const key = `diary-images/${userId}/${diaryId}.${ext}`;
  
  // FileをArrayBufferに変換
  const arrayBuffer = await file.arrayBuffer();
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: new Uint8Array(arrayBuffer),
    ContentType: file.type || 'image/webp',
    CacheControl: 'public, max-age=31536000', // 1年間キャッシュ
  });
  
  await client.send(command);
  
  return `${PUBLIC_URL}/${key}`;
}

// 日記画像の削除
export async function deleteDiaryImage(userId: string, diaryId: string): Promise<void> {
  const client = getR2Client();
  
  // 拡張子を問わず削除（webp, jpg, jpeg, png）
  const possibleKeys = [
    `diary-images/${userId}/${diaryId}.webp`,
    `diary-images/${userId}/${diaryId}.jpg`,
    `diary-images/${userId}/${diaryId}.jpeg`,
    `diary-images/${userId}/${diaryId}.png`,
  ];
  
  // 各ファイルを削除（存在しないファイルは無視される）
  for (const key of possibleKeys) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      await client.send(command);
    } catch (error) {
      // ファイルが存在しない場合はエラーを無視
      console.log(`ファイル ${key} の削除をスキップしました`);
    }
  }
}

export async function uploadFantasyBgm(file: File, bgmId: string): Promise<string> {
  checkFileSize(file, MAX_SONG_FILE_SIZE, 'BGMファイル');

  const client = getR2Client();
  const key = `fantasy-bgm/${bgmId}.mp3`;

  const arrayBuffer = await file.arrayBuffer();

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: new Uint8Array(arrayBuffer),
    ContentType: 'audio/mpeg',
    CacheControl: 'public, max-age=31536000',
  });

  await client.send(command);

  return `${PUBLIC_URL}/${key}`;
}

export async function deleteFantasyBgm(bgmId: string): Promise<void> {
  const client = getR2Client();
  const key = `fantasy-bgm/${bgmId}.mp3`;
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await client.send(command);
  } catch (error) {
    console.log(`BGM ${key} の削除をスキップしました`);
  }
}

export async function uploadLessonVideo(file: File, lessonId: string): Promise<{ url: string; key: string; contentType: string; size: number; fileName: string; }> {
  checkFileSize(file, MAX_LESSON_VIDEO_SIZE, 'レッスン動画');

  const client = getR2Client();
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const safeExt = ['mp4', 'mov', 'webm', 'm4v'].includes(ext) ? ext : 'mp4';
  const contentType = file.type || (safeExt === 'mov' ? 'video/quicktime' : safeExt === 'webm' ? 'video/webm' : 'video/mp4');
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const key = `lesson-videos/${lessonId}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: new Uint8Array(arrayBuffer),
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000'
  });

  await client.send(command);

  return { url: `${PUBLIC_URL}/${key}`, key, contentType, size: file.size, fileName };
}

export async function deleteLessonVideoByKey(r2Key: string): Promise<void> {
  const client = getR2Client();
  const command = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: r2Key });
  await client.send(command);
}

export async function uploadLessonAttachment(file: File, lessonId: string): Promise<{ url: string; key: string; contentType: string; size: number; fileName: string; }> {
  checkFileSize(file, MAX_ATTACHMENT_SIZE, '添付ファイル');

  const client = getR2Client();
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const contentType = file.type || (
    ext === 'pdf' ? 'application/pdf' :
    ext === 'mp3' ? 'audio/mpeg' :
    ext === 'wav' ? 'audio/wav' :
    ext === 'm4a' ? 'audio/mp4' :
    'application/octet-stream'
  );
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const key = `lesson-attachments/${lessonId}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: new Uint8Array(arrayBuffer),
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000'
  });

  await client.send(command);

  return { url: `${PUBLIC_URL}/${key}`, key, contentType, size: file.size, fileName };
}

export async function deleteLessonAttachmentByKey(r2Key: string): Promise<void> {
  const client = getR2Client();
  const command = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: r2Key });
  await client.send(command);
}