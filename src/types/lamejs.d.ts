/**
 * @breezystack/lamejs MP3エンコーダーの型定義
 */
declare module '@breezystack/lamejs' {
  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, bitrate: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Uint8Array;
    flush(): Uint8Array;
  }

  export interface WavHeaderResult {
    dataOffset: number;
    dataLen: number;
    channels: number;
    sampleRate: number;
  }

  export const WavHeader: {
    readHeader(dataView: DataView): WavHeaderResult;
  };
}
