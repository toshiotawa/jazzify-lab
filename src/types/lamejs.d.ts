/**
 * lamejs MP3エンコーダーの型定義
 */
declare module 'lamejs' {
  class Mp3Encoder {
    constructor(channels: number, sampleRate: number, bitrate: number);
    encodeBuffer(left: Int16Array, right: Int16Array): Int8Array;
    flush(): Int8Array;
  }

  interface WavHeader {
    dataOffset: number;
    dataLen: number;
    channels: number;
    sampleRate: number;
  }

  const lamejs: {
    Mp3Encoder: typeof Mp3Encoder;
    WavHeader: {
      readHeader(dataView: DataView): WavHeader;
    };
  };

  export default lamejs;
}
