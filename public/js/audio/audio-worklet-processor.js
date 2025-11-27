// Audio Worklet Processor for low-latency pitch detection
// Sends audio samples to main thread for WASM processing

class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.ringBufferPtr = null;
        this.ringSize = 0;
        this.writeIndex = 0;
        this.initialized = false;
        this.sampleBuffer = new Float32Array(0);
        this.bufferSize = 128; // バッファサイズを増やして安定性向上
        
        // Wait for initialization message from main thread
        this.port.onmessage = (event) => {
            if (event.data.type === 'init') {
                this.ringBufferPtr = event.data.ptr;
                this.ringSize = event.data.ringSize;
                this.initialized = true;
            }
        };
    }
    
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input[0]) {
            return true;
        }
        
        const samples = input[0];
        
        // 新しいサンプルを蓄積
        const newBuffer = new Float32Array(this.sampleBuffer.length + samples.length);
        newBuffer.set(this.sampleBuffer);
        newBuffer.set(samples, this.sampleBuffer.length);
        this.sampleBuffer = newBuffer;
        
        // バッファサイズに達したらサンプルを送信
        while (this.sampleBuffer.length >= this.bufferSize) {
            const samplesToProcess = this.sampleBuffer.slice(0, this.bufferSize);
            
            // Send samples to main thread for WASM processing
            this.port.postMessage({
                type: 'samples',
                samples: samplesToProcess
            });
            
            // 処理済みサンプルを削除
            this.sampleBuffer = this.sampleBuffer.slice(this.bufferSize);
        }
        
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
