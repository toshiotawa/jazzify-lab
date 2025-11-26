/**
 * ピッチ検出用 AudioWorklet プロセッサ
 * 低レイテンシでメインスレッドにサンプルを送信
 */

class PitchDetectionProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // サンプルバッファ（ピッチ検出に必要なサンプル数を蓄積）
    this.buffer = new Float32Array(2048);
    this.bufferIndex = 0;
    
    // 処理間隔: 512サンプルごとに送信（約10.7ms @ 48kHz）
    this.hopSize = 512;
    this.samplesSinceLastSend = 0;
    
    // 有効/無効フラグ
    this.enabled = false;
    
    // メインスレッドからのメッセージを受信
    this.port.onmessage = (event) => {
      if (event.data.type === 'enable') {
        this.enabled = true;
      } else if (event.data.type === 'disable') {
        this.enabled = false;
        this.bufferIndex = 0;
        this.samplesSinceLastSend = 0;
      } else if (event.data.type === 'setHopSize') {
        this.hopSize = event.data.hopSize;
      }
    };
  }
  
  process(inputs, outputs, parameters) {
    // 無効な場合はスキップ
    if (!this.enabled) {
      return true;
    }
    
    const input = inputs[0];
    if (!input || !input[0]) {
      return true;
    }
    
    const samples = input[0];
    const samplesLength = samples.length;
    
    // サンプルをバッファに追加
    for (let i = 0; i < samplesLength; i++) {
      // リングバッファとして使用
      this.buffer[this.bufferIndex] = samples[i];
      this.bufferIndex = (this.bufferIndex + 1) % this.buffer.length;
      this.samplesSinceLastSend++;
      
      // hopSizeごとにメインスレッドに送信
      if (this.samplesSinceLastSend >= this.hopSize) {
        this.samplesSinceLastSend = 0;
        
        // 最新の2048サンプルを取得（リングバッファから順序を復元）
        const orderedBuffer = new Float32Array(this.buffer.length);
        for (let j = 0; j < this.buffer.length; j++) {
          orderedBuffer[j] = this.buffer[(this.bufferIndex + j) % this.buffer.length];
        }
        
        // メインスレッドに送信
        this.port.postMessage({
          type: 'samples',
          samples: orderedBuffer,
          timestamp: currentTime
        });
      }
    }
    
    return true;
  }
}

registerProcessor('pitch-detection-processor', PitchDetectionProcessor);
