/**
 * Pitch Detection AudioWorklet Processor
 * 音声データを収集してメインスレッドに送信するプロセッサ
 * 低レイテンシで安定したピッチ検出のためのバッファリング
 */

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // バッファ設定
    // 512サンプル = 約11.6ms @ 44.1kHz (低レイテンシ設定)
    this.bufferSize = 512;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // 有効/無効フラグ
    this.enabled = true;
    
    // メインスレッドからのメッセージ処理
    this.port.onmessage = (event) => {
      if (event.data.type === 'enable') {
        this.enabled = true;
      } else if (event.data.type === 'disable') {
        this.enabled = false;
        this.bufferIndex = 0;
      } else if (event.data.type === 'setBufferSize') {
        // 動的バッファサイズ変更（256, 512, 1024, 2048）
        const newSize = event.data.size;
        if ([256, 512, 1024, 2048].includes(newSize)) {
          this.bufferSize = newSize;
          this.buffer = new Float32Array(this.bufferSize);
          this.bufferIndex = 0;
        }
      }
    };
  }
  
  process(inputs, _outputs, _parameters) {
    // 無効化されている場合は処理しない
    if (!this.enabled) {
      return true;
    }
    
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }
    
    const samples = input[0];
    
    // サンプルをバッファに追加
    for (let i = 0; i < samples.length; i++) {
      this.buffer[this.bufferIndex++] = samples[i];
      
      // バッファが満杯になったらメインスレッドに送信
      if (this.bufferIndex >= this.bufferSize) {
        // Float32Arrayをコピーして送信
        const audioData = new Float32Array(this.buffer);
        
        this.port.postMessage({
          type: 'audioData',
          buffer: audioData,
          sampleRate: sampleRate
        }, [audioData.buffer]);
        
        // バッファをリセット
        this.bufferIndex = 0;
      }
    }
    
    return true;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
