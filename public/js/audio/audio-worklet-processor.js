/**
 * AudioWorklet Processor - 最適化版
 * 
 * 最適化ポイント:
 * - バッファサイズ増加（48→256）でpostMessage頻度削減
 * - 事前割り当て済みバッファで動的メモリ割り当て排除
 * - 効率的なバッファ管理
 */

class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        // 最適化されたバッファサイズ（256サンプル = 約5.8ms @ 44.1kHz）
        // レイテンシとパフォーマンスのバランスを取る
        this.bufferSize = 256;
        
        // 事前割り当て済みバッファ（動的割り当てを避ける）
        this.sampleBuffer = new Float32Array(this.bufferSize * 2);
        this.currentLength = 0;
        
        // 出力用バッファ（再利用）
        this.outputBuffer = new Float32Array(this.bufferSize);
        
        // 初期化フラグ
        this.initialized = false;
        
        // メッセージハンドラ
        this.port.onmessage = (event) => {
            if (event.data.type === 'init') {
                this.initialized = true;
            }
        };
    }
    
    process(inputs, _outputs, _parameters) {
        const input = inputs[0];
        if (!input || !input[0] || input[0].length === 0) {
            return true;
        }
        
        const samples = input[0];
        const samplesLength = samples.length;
        
        // バッファに追加
        const newLength = this.currentLength + samplesLength;
        
        // バッファ拡張が必要な場合（稀）
        if (newLength > this.sampleBuffer.length) {
            const newBuffer = new Float32Array(newLength * 2);
            newBuffer.set(this.sampleBuffer.subarray(0, this.currentLength));
            this.sampleBuffer = newBuffer;
        }
        
        // サンプルをコピー
        this.sampleBuffer.set(samples, this.currentLength);
        this.currentLength = newLength;
        
        // バッファサイズに達したら送信
        while (this.currentLength >= this.bufferSize) {
            // 出力バッファにコピー
            this.outputBuffer.set(this.sampleBuffer.subarray(0, this.bufferSize));
            
            // メインスレッドに送信
            this.port.postMessage({
                type: 'samples',
                samples: this.outputBuffer
            });
            
            // 残りのサンプルを先頭に移動
            const remaining = this.currentLength - this.bufferSize;
            if (remaining > 0) {
                // 効率的なコピー（同一バッファ内での移動）
                this.sampleBuffer.copyWithin(0, this.bufferSize, this.currentLength);
            }
            this.currentLength = remaining;
        }
        
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
