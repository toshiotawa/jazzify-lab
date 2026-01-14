/**
 * 音声処理ユーティリティ
 * - カウント音（クリック）の生成
 * - 音声へのカウント追加
 * - MP3への変換
 */

import lamejs from 'lamejs';

/**
 * クリック音を生成
 * @param audioContext AudioContext
 * @param sampleRate サンプルレート
 * @param duration 音の長さ（秒）
 * @param frequency 周波数（Hz）
 * @returns Float32Array
 */
function generateClickSound(
  sampleRate: number,
  duration: number = 0.05,
  frequency: number = 1000
): Float32Array {
  const samples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(samples);
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    // 短いサイン波 + エンベロープ
    const envelope = Math.exp(-t * 40); // 急激な減衰
    buffer[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.8;
  }
  
  return buffer;
}

/**
 * BPMから4拍分のカウント音声を生成
 * @param sampleRate サンプルレート
 * @param bpm BPM（テンポ）
 * @param beatCount 拍数（デフォルト4拍）
 * @returns Float32Array（ステレオ対応のため2チャンネル分）
 */
export function generateCountInAudio(
  sampleRate: number,
  bpm: number,
  beatCount: number = 4
): Float32Array {
  const secondsPerBeat = 60 / bpm;
  const totalDuration = secondsPerBeat * beatCount;
  const totalSamples = Math.floor(sampleRate * totalDuration);
  
  const buffer = new Float32Array(totalSamples);
  const clickSound = generateClickSound(sampleRate, 0.05, 1200);
  
  for (let beat = 0; beat < beatCount; beat++) {
    const beatStartSample = Math.floor(beat * secondsPerBeat * sampleRate);
    
    // クリック音を配置
    for (let i = 0; i < clickSound.length && beatStartSample + i < totalSamples; i++) {
      buffer[beatStartSample + i] += clickSound[i];
    }
  }
  
  // クリッピング防止
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.max(-1, Math.min(1, buffer[i]));
  }
  
  return buffer;
}

/**
 * FileからAudioBufferをデコード
 * @param file 音声ファイル
 * @returns AudioBuffer
 */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } finally {
    await audioContext.close();
  }
}

/**
 * AudioBufferの先頭にカウント音を追加
 * @param originalBuffer 元のAudioBuffer
 * @param countInBuffer カウント音のFloat32Array
 * @param sampleRate サンプルレート
 * @returns 結合したAudioBuffer
 */
export async function prependCountInToAudio(
  originalBuffer: AudioBuffer,
  countInBuffer: Float32Array,
  sampleRate: number
): Promise<AudioBuffer> {
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  
  try {
    const newLength = countInBuffer.length + originalBuffer.length;
    const channelCount = originalBuffer.numberOfChannels;
    
    const newBuffer = audioContext.createBuffer(channelCount, newLength, sampleRate);
    
    for (let channel = 0; channel < channelCount; channel++) {
      const newChannelData = newBuffer.getChannelData(channel);
      
      // カウント音を先頭に配置（モノラルをすべてのチャンネルにコピー）
      for (let i = 0; i < countInBuffer.length; i++) {
        newChannelData[i] = countInBuffer[i];
      }
      
      // 元の音声を後ろに配置
      const originalData = originalBuffer.getChannelData(channel);
      for (let i = 0; i < originalBuffer.length; i++) {
        newChannelData[countInBuffer.length + i] = originalData[i];
      }
    }
    
    return newBuffer;
  } finally {
    await audioContext.close();
  }
}

/**
 * AudioBufferをMP3にエンコード
 * @param audioBuffer AudioBuffer
 * @param bitrate ビットレート（kbps）
 * @returns MP3のBlob
 */
export async function encodeToMp3(
  audioBuffer: AudioBuffer,
  bitrate: number = 192
): Promise<Blob> {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const samples = audioBuffer.length;
  
  // ステレオまたはモノラル
  const encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
  
  // チャンネルデータを取得
  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = channels > 1 ? audioBuffer.getChannelData(1) : leftChannel;
  
  // Float32 (-1 to 1) を Int16 (-32768 to 32767) に変換
  const leftInt16 = new Int16Array(samples);
  const rightInt16 = new Int16Array(samples);
  
  for (let i = 0; i < samples; i++) {
    leftInt16[i] = Math.max(-32768, Math.min(32767, Math.floor(leftChannel[i] * 32767)));
    rightInt16[i] = Math.max(-32768, Math.min(32767, Math.floor(rightChannel[i] * 32767)));
  }
  
  // エンコード
  const mp3Data: Int8Array[] = [];
  const blockSize = 1152; // lamejs推奨ブロックサイズ
  
  for (let i = 0; i < samples; i += blockSize) {
    const end = Math.min(i + blockSize, samples);
    const leftBlock = leftInt16.subarray(i, end);
    const rightBlock = rightInt16.subarray(i, end);
    
    const mp3buf = encoder.encodeBuffer(leftBlock, rightBlock);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }
  
  // フラッシュ
  const remaining = encoder.flush();
  if (remaining.length > 0) {
    mp3Data.push(remaining);
  }
  
  // Int8ArrayをUint8Arrayに変換してBlobを作成
  const totalLength = mp3Data.reduce((acc, buf) => acc + buf.length, 0);
  const mp3Array = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of mp3Data) {
    mp3Array.set(new Uint8Array(buf.buffer, buf.byteOffset, buf.length), offset);
    offset += buf.length;
  }
  
  return new Blob([mp3Array], { type: 'audio/mpeg' });
}

export interface ProcessAudioOptions {
  /** MP3に変換するかどうか */
  convertToMp3: boolean;
  /** カウントを追加するかどうか */
  addCountIn: boolean;
  /** BPM（カウント追加時に必要） */
  bpm?: number;
  /** カウント拍数（デフォルト4） */
  countBeats?: number;
  /** MP3ビットレート（kbps、デフォルト192） */
  mp3Bitrate?: number;
}

export interface ProcessAudioResult {
  /** 処理後のファイル */
  file: File;
  /** カウント追加した場合の追加時間（秒） */
  countInDuration?: number;
}

/**
 * 音声ファイルを処理（カウント追加・MP3変換）
 * @param file 元の音声ファイル
 * @param options 処理オプション
 * @returns 処理後のファイル
 */
export async function processAudioFile(
  file: File,
  options: ProcessAudioOptions
): Promise<ProcessAudioResult> {
  const { convertToMp3, addCountIn, bpm, countBeats = 4, mp3Bitrate = 192 } = options;
  
  // 何も処理しない場合はそのまま返す
  if (!convertToMp3 && !addCountIn) {
    return { file };
  }
  
  // カウント追加にはBPMが必要
  if (addCountIn && (!bpm || bpm <= 0)) {
    throw new Error('カウント追加にはBPMの設定が必要です');
  }
  
  // 音声をデコード
  let audioBuffer = await decodeAudioFile(file);
  const sampleRate = audioBuffer.sampleRate;
  let countInDuration: number | undefined;
  
  // カウント追加
  if (addCountIn && bpm) {
    const countInBuffer = generateCountInAudio(sampleRate, bpm, countBeats);
    countInDuration = countInBuffer.length / sampleRate;
    audioBuffer = await prependCountInToAudio(audioBuffer, countInBuffer, sampleRate);
  }
  
  // MP3変換
  if (convertToMp3) {
    const mp3Blob = await encodeToMp3(audioBuffer, mp3Bitrate);
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const newFile = new File([mp3Blob], `${baseName}.mp3`, { type: 'audio/mpeg' });
    return { file: newFile, countInDuration };
  }
  
  // カウント追加のみ（WAV出力）
  // AudioBufferをWAVに変換
  const wavBlob = audioBufferToWav(audioBuffer);
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const ext = file.name.match(/\.([^.]+)$/)?.[1] || 'wav';
  const newFile = new File([wavBlob], `${baseName}_with_count.${ext}`, { type: file.type || 'audio/wav' });
  
  return { file: newFile, countInDuration };
}

/**
 * AudioBufferをWAV形式のBlobに変換
 * @param buffer AudioBuffer
 * @returns WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);
  
  // WAVヘッダー
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmtチャンクサイズ
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // インターリーブしたサンプルデータを書き込み
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const intSample = Math.floor(sample * 32767);
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
