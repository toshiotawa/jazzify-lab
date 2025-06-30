// Import WASM module directly in the worklet
// Note: This approach uses a different strategy since we can't pass Memory objects

class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.ringBufferPtr = null;
        this.ringSize = 0;
        this.writeIndex = 0;
        this.initialized = false;
        this.sampleBuffer = [];
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
        
        // Optimized for 64-sample ultra-low latency processing
        // Accumulate samples with minimal overhead
        const currentLength = this.sampleBuffer.length;
        const newLength = currentLength + samples.length;
        
        // Resize buffer if needed (avoid frequent allocations)
        if (this.sampleBuffer.length < newLength) {
            const newBuffer = new Float32Array(Math.max(newLength, this.bufferSize * 2));
            newBuffer.set(this.sampleBuffer);
            this.sampleBuffer = newBuffer;
        }
        
        // Copy new samples efficiently
        this.sampleBuffer.set(samples, currentLength);
        
        // Process in 64-sample chunks immediately
        let processedSamples = 0;
        while (currentLength + samples.length - processedSamples >= this.bufferSize) {
            const samplesToProcess = this.sampleBuffer.slice(processedSamples, processedSamples + this.bufferSize);
            
            // Send samples to main thread for WASM processing
            this.port.postMessage({
                type: 'samples',
                samples: samplesToProcess
            });
            
            processedSamples += this.bufferSize;
        }
        
        // Keep remaining samples for next cycle
        if (processedSamples > 0) {
            const remaining = currentLength + samples.length - processedSamples;
            if (remaining > 0) {
                const newBuffer = new Float32Array(remaining);
                newBuffer.set(this.sampleBuffer.subarray(processedSamples, processedSamples + remaining));
                this.sampleBuffer = newBuffer;
            } else {
                this.sampleBuffer = new Float32Array(0);
            }
        }
        
        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);