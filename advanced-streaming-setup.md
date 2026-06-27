# R2での高度なストリーミング実装

## 必要な技術スタック

### 1. HLS/DASH アダプティブストリーミング
```javascript
// FFmpegでHLS変換（サーバーサイド）
ffmpeg -i input.mp4 \
  -c:v h264 -crf 23 -preset fast \
  -map 0:v:0 -map 0:a:0 \
  -f hls -hls_time 10 -hls_playlist_type vod \
  -master_pl_name master.m3u8 \
  output.m3u8
```

### 2. Cloudflare Workers での動的処理
```javascript
// workers/video-processor.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 画質に応じた動的配信
    if (url.searchParams.has('quality')) {
      const quality = url.searchParams.get('quality');
      const videoKey = `videos/${quality}/${url.pathname}`;
      return await env.R2_BUCKET.get(videoKey);
    }
    
    // アクセス制御
    const token = request.headers.get('Authorization');
    if (!isValidToken(token)) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    return await env.R2_BUCKET.get(url.pathname);
  }
};
```

### 3. 視聴分析システム
```javascript
// 視聴データ収集
const trackVideoAnalytics = {
  play: (videoId) => analytics.track('video_play', { videoId }),
  pause: (videoId, currentTime) => analytics.track('video_pause', { videoId, currentTime }),
  complete: (videoId) => analytics.track('video_complete', { videoId }),
  // ヒートマップ用
  progress: (videoId, percentage) => analytics.track('video_progress', { videoId, percentage })
};
```

## 実装の複雑さ比較

| 機能 | Vimeo/Bunny | R2自前実装 | 実装難易度 |
|------|------------|-----------|----------|
| 基本再生 | ✅ 即座 | ✅ 簡単 | ⭐ |
| 複数画質 | ✅ 自動 | 🔧 要実装 | ⭐⭐⭐ |
| HLS配信 | ✅ 自動 | 🔧 要実装 | ⭐⭐⭐⭐ |
| 視聴分析 | ✅ 組込み | 🔧 要実装 | ⭐⭐⭐ |
| DRM保護 | ✅ 対応 | 🔧 複雑 | ⭐⭐⭐⭐⭐ |
| 自動字幕 | ✅ 一部対応 | 🔧 要実装 | ⭐⭐⭐⭐ |