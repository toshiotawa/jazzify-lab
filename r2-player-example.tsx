import React, { useState, useRef } from 'react';
import Plyr from 'plyr-react';
import 'plyr-react/plyr.css';

// R2 + Plyr.jsを使った高機能プレイヤー
export const VideoPlayer = ({ videoUrl }) => {
  const [quality, setQuality] = useState('720');
  
  // 複数画質のURLを生成
  const sources = [
    { src: `${videoUrl}?quality=1080`, size: 1080 },
    { src: `${videoUrl}?quality=720`, size: 720 },
    { src: `${videoUrl}?quality=480`, size: 480 },
  ];

  const plyrProps = {
    source: {
      type: 'video',
      sources: sources,
    },
    options: {
      controls: [
        'play-large', 'play', 'progress', 'current-time',
        'mute', 'volume', 'captions', 'settings', 'fullscreen'
      ],
      settings: ['quality', 'speed'],
      speed: { selected: 1, options: [0.5, 1, 1.5, 2] },
    },
  };

  return <Plyr {...plyrProps} />;
};

// 動画アップロード＆エンコード処理
export const VideoUploader = () => {
  const handleUpload = async (file) => {
    // 1. R2にオリジナルをアップロード
    const uploadUrl = await getPresignedUrl(file.name);
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
    });

    // 2. Cloudflare Workersでエンコードジョブをトリガー
    await fetch('/api/encode', {
      method: 'POST',
      body: JSON.stringify({ 
        fileName: file.name,
        qualities: ['1080p', '720p', '480p'] 
      }),
    });
  };

  return (
    <input 
      type="file" 
      accept="video/*" 
      onChange={(e) => handleUpload(e.target.files[0])}
    />
  );
};