// Import WASM module directly in the worklet
// Note: This approach uses a different strategy since we can't pass Memory objects

class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.ringBufferPtr = null;
        this.ringSize = 0;
        this.writeIndex = 0;
        this.initialized = false;
        this.sampleBuffer = new Float32Array(256); // 初期バッファを確保
        this.sampleBufferUsed = 0; // 使用中のサンプル数を追跡
        this.bufferSize = 64; // Ultra-low latency buffer size
        
        // Wait for initialization message from main thread
        this.port.onmessage = (event) => {
            if (event.data.type === 'init') {
                this.ringBufferPtr = event.data.ptr;
                this.ringSize = event.data.ringSize;
                this.initialized = true;
            } else if (event.data.type === 'samples') {
                // Handle sample data sent from main thread
                this.processSamples(event.data.samples);
            }
        };
    }
    
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input[0]) {
            return true;
        }
        
        const samples = input[0];
        const samplesLength = samples.length;
        
        // 必要に応じてバッファを拡張
        const neededSize = this.sampleBufferUsed + samplesLength;
        if (this.sampleBuffer.length < neededSize) {
            const newBuffer = new Float32Array(Math.max(neededSize * 2, 512));
            newBuffer.set(this.sampleBuffer.subarray(0, this.sampleBufferUsed));
            this.sampleBuffer = newBuffer;
        }
        
        // 新しいサンプルをバッファに追加
        this.sampleBuffer.set(samples, this.sampleBufferUsed);
        this.sampleBufferUsed += samplesLength;
        
        // bufferSize (64) サンプルごとに処理
        while (this.sampleBufferUsed >= this.bufferSize) {
            // 処理するサンプルを抽出
            const samplesToProcess = this.sampleBuffer.slice(0, this.bufferSize);
            
            // メインスレッドに送信
            this.port.postMessage({
                type: 'samples',
                samples: samplesToProcess
            });
            
            // 残りのサンプルを前にシフト
            this.sampleBuffer.copyWithin(0, this.bufferSize, this.sampleBufferUsed);
            this.sampleBufferUsed -= this.bufferSize;
        }
        
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);