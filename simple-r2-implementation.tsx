// シンプルで実用的なR2実装例

import React, { useState, useEffect } from 'react';

// 1. BGM管理コンポーネント
export const BGMPlayer = ({ trackId }) => {
  const [audio] = useState(() => new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  
  const bgmUrl = `https://your-r2-bucket.r2.dev/bgm/${trackId}.mp3`;
  
  useEffect(() => {
    audio.src = bgmUrl;
    audio.loop = true;
    audio.volume = 0.5;
    
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [trackId]);
  
  const togglePlay = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  return (
    <button onClick={togglePlay}>
      {isPlaying ? '⏸️ 一時停止' : '▶️ 再生'}
    </button>
  );
};

// 2. 動画プレイヤー（プログレッシブダウンロード対応）
export const VideoPlayer = ({ videoId, poster }) => {
  const [loading, setLoading] = useState(true);
  
  const videoUrl = `https://your-r2-bucket.r2.dev/videos/${videoId}.mp4`;
  const posterUrl = `https://your-r2-bucket.r2.dev/thumbnails/${poster}`;
  
  return (
    <div className="video-container">
      {loading && <div className="loading">読み込み中...</div>}
      <video
        controls
        poster={posterUrl}
        onLoadedData={() => setLoading(false)}
        preload="metadata" // 最初の数秒だけプリロード
        style={{ width: '100%', maxWidth: '800px' }}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
    </div>
  );
};

// 3. R2アップロード（Presigned URL使用）
export const FileUploader = () => {
  const uploadToR2 = async (file) => {
    // バックエンドからPresigned URLを取得
    const response = await fetch('/api/get-upload-url', {
      method: 'POST',
      body: JSON.stringify({ 
        fileName: file.name,
        contentType: file.type 
      }),
    });
    
    const { uploadUrl } = await response.json();
    
    // R2に直接アップロード
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    alert('アップロード完了！');
  };
  
  return (
    <input
      type="file"
      onChange={(e) => uploadToR2(e.target.files[0])}
      accept="audio/*,video/*"
    />
  );
};

// 4. バックエンドAPI例（Node.js/Next.js）
export async function generatePresignedUrl(fileName, contentType) {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  
  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    ContentType: contentType,
  });
  
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}