import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2クライアントの初期化
const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: import.meta.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME || "jazzify-assets";

// ファイルアップロード
export async function uploadToR2(
  key: string,
  file: File | Blob,
  contentType?: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType || file.type,
    });

    await R2.send(command);
    
    // パブリックURLを返す
    return `${import.meta.env.VITE_R2_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error("Failed to upload file to R2");
  }
}

// ファイル取得
export async function getFromR2(key: string): Promise<Blob> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await R2.send(command);
    
    if (!response.Body) {
      throw new Error("No body in response");
    }

    // ストリームをBlobに変換
    const stream = response.Body as ReadableStream;
    const response2 = new Response(stream);
    return await response2.blob();
  } catch (error) {
    console.error("R2 get error:", error);
    throw new Error("Failed to get file from R2");
  }
}

// ファイル削除
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await R2.send(command);
  } catch (error) {
    console.error("R2 delete error:", error);
    throw new Error("Failed to delete file from R2");
  }
}

// 署名付きURL生成（プライベートファイル用）
export async function getSignedUrlFromR2(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(R2, command, { expiresIn });
  } catch (error) {
    console.error("R2 signed URL error:", error);
    throw new Error("Failed to generate signed URL");
  }
}

// ファイル一覧取得
export async function listFilesFromR2(
  prefix?: string,
  maxKeys: number = 100
): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await R2.send(command);
    
    return (response.Contents || []).map((object) => ({
      key: object.Key!,
      size: object.Size || 0,
      lastModified: object.LastModified || new Date(),
    }));
  } catch (error) {
    console.error("R2 list error:", error);
    throw new Error("Failed to list files from R2");
  }
}

// 音声ファイルアップロード用のヘルパー関数
export async function uploadAudioToR2(
  userId: string,
  audioBlob: Blob,
  filename: string
): Promise<string> {
  const key = `audio/${userId}/${Date.now()}-${filename}`;
  return await uploadToR2(key, audioBlob, "audio/mpeg");
}

// 画像アップロード用のヘルパー関数
export async function uploadImageToR2(
  userId: string,
  imageFile: File
): Promise<string> {
  const key = `images/${userId}/${Date.now()}-${imageFile.name}`;
  return await uploadToR2(key, imageFile, imageFile.type);
}

// MIDIファイルアップロード用のヘルパー関数
export async function uploadMidiToR2(
  userId: string,
  midiBlob: Blob,
  filename: string
): Promise<string> {
  const key = `midi/${userId}/${Date.now()}-${filename}`;
  return await uploadToR2(key, midiBlob, "audio/midi");
}