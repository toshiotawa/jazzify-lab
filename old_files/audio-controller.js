import init, { 
    analyze_pitch, 
    alloc, 
    free, 
    get_memory,
    init_pitch_detector,
    get_ring_buffer_ptr,
    get_ring_buffer_size,
    process_audio_block
} from '../../wasm/pitch_detector.js';

// 初期化後に WASM のメモリを取得する
let wasmMemory;
let wasmInstance;
init().then((instance) => {
    console.log("WASM モジュールが初期化されました");
    wasmInstance = instance;
    wasmMemory = get_memory();
    // 以後、wasmMemory.buffer を利用してください。
});

// iOSデバイス検出ユーティリティ
const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

class AudioController {
    constructor(onNoteOn, onNoteOff) {
        console.log('[iOS Debug] AudioController constructor called');
        // 基本設定
        this.onNoteOn = onNoteOn;
        this.onNoteOff = onNoteOff;
        
        this.audioContext = null;
        this.mediaStream = null;
        this.currentDeviceId = null;
        this.isProcessing = false;
        this.activeNote = null;
        this.onConnectionChange = null;
        this.errorDisplays = new Map();
        this.pauseProcessing = false;

        // PYINアルゴリズム用のパラメータ
        this.sampleRate = null;  // AudioContext作成時に設定
        this.bufferSize = 512;  // Optimized for ultra-low latency while maintaining detection quality
        this.minFrequency = 27.5;  // A0
        this.maxFrequency = 4186.01; // C8
        this.amplitudeThreshold = 0.1; // 速いパッセージ検出のため閾値を下げる
        this.consecutiveFramesThreshold = 1; // 速いパッセージ検出のため1に設定
        this.noteOnThreshold = 0.05;
        this.noteOffThreshold = 0.03;
        this.maxAllowedPitchChange = 1.5; // PYINは精度が高いのでより厳しく
        this.lowFrequencyThreshold = 200.0;
        this.lowFrequencyAmplitudeThreshold = 0.08;
        
        // Adaptive buffer size parameters
        this.adaptiveBuffering = true;
        this.lowFreqBufferSize = 1024;  // Reduced for ultra-low latency while maintaining low frequency capability
        this.veryLowFreqThreshold = 100.0;  // Threshold for using larger buffer
        
        // バッファとピッチ履歴
        this.samples = new Float32Array(this.bufferSize);
        this.lowFreqSamples = new Float32Array(this.lowFreqBufferSize);  // Larger buffer for low frequencies
        this.pitchHistory = [];
        this.pitchHistorySize = 3; // Reduced for ultra-low latency response
        
        // ノート状態
        this.lastDetectedNote = -1;
        this.consecutiveFrames = 0;
        this.lastStableNote = -1;
        this.currentNote = -1;
        this.lastNoteOnTime = 0;
        this.lastDetectedFrequency = 0;
        this.isNoteOn = false;
        
        // PYINパラメータ
        this.pyinThreshold = 0.1;   // 速いパッセージ検出のため感度向上
        // 無音時の誤検出を減らすための閾値。計測された最大振幅がこれ以下なら無音と判定
        this.silenceThreshold = 0.01;

        // 周波数テーブルの初期化
        this.noteFrequencies = new Map();
        this.initializeNoteFrequencies();
        
        // デバッグ表示の初期化
        this.addDebugDisplay();

        // HMMプロセッサの追加
        this.hmmProcessor = new HMMProcessor();
        
        // 確率分布追跡用バッファ
        this.pitchProbabilityBuffer = [];
        
        // PYINの信頼度を保持
        this.lastPitchConfidence = 0.0;
        
        // iOS環境フラグ
        this.isIOSDevice = isIOS();
        if (this.isIOSDevice) {
            console.log('iOS環境を検出しました。特別なオーディオ処理を適用します。');
        }
    }

    // 周波数テーブルの初期化（A0からC8まで - 88鍵盤全体）
    initializeNoteFrequencies() {
        // A0(21)からC8(108)までの範囲に拡張
        for (let i = 21; i <= 108; i++) {
            const frequency = 440 * Math.pow(2, (i - 69) / 12);
            this.noteFrequencies.set(i, frequency);
        }
    }

    async connectDevice(deviceId) {
        try {
            console.log('オーディオデバイス接続を開始:', deviceId);
            
            // 既存の接続を切断 (ただしiOSではAudioContextは保持)
            if (this.mediaStream) {
                // メディアストリームだけ停止する
                this.mediaStream.getTracks().forEach(track => {
                    console.log('既存のオーディオトラックを停止:', track.kind, track.label);
                    track.stop();
                });
                this.mediaStream = null;
            }
            
            // 既存のAudioContextがあるか確認（iOS向け）
            let needNewContext = true;
            if (this.isIOSDevice && this.audioContext) {
                if (this.audioContext.state === 'suspended') {
                    try {
                        console.log('iOS: 既存のAudioContextを再開します');
                        await this.audioContext.resume();
                        needNewContext = false;
                    } catch (e) {
                        console.warn('既存のAudioContextの再開に失敗しました:', e);
                        // 失敗した場合は新しいコンテキストを作成
                        needNewContext = true;
                    }
                } else if (this.audioContext.state === 'running') {
                    console.log('iOS: 既存のAudioContextは既に実行中です');
                    needNewContext = false;
                }
            }

            // ★★★ getUserMedia の存在確認を追加 ★★★
            if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
                console.warn('navigator.mediaDevices.getUserMedia is not supported in this environment.');
                this.showError('Microphone access is not supported.');
                this.notifyConnectionChange(false);
                return false;
            }

            // デバイスのアクセス許可を取得（明示的にユーザーメディアを要求）
            console.log('マイク許可を要求...');
            try {
                this.mediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: deviceId ? { exact: deviceId } : undefined,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: false
                });
                console.log('マイク許可を取得しました:', 
                    this.mediaStream.getAudioTracks().map(t => t.label).join(', '));
            } catch (getUserMediaError) {
                console.error('[iOS Debug] getUserMedia failed:', getUserMediaError);
                this.showError(`Failed to access microphone: ${getUserMediaError.message}`);
                this.notifyConnectionChange(false);
                return false;
            }

            // AudioContextの作成または再利用
            if (needNewContext || !this.audioContext) {
                if (this.audioContext && !this.isIOSDevice) {
                    console.log('既存のAudioContextを閉じます');
                    await this.audioContext.close();
                }
                console.log('新しいAudioContextを作成します');
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.sampleRate = this.audioContext.sampleRate;
                console.log('[iOS Debug] New AudioContext created. State:', this.audioContext.state, 'Sample Rate:', this.sampleRate);
            } else {
                // 既存のAudioContextを再利用する際にサンプルレートを更新
                this.sampleRate = this.audioContext.sampleRate;
                console.log('[iOS Debug] Using existing AudioContext. State:', this.audioContext.state, 'Sample Rate:', this.sampleRate);
            }

            // オーディオソースの作成
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            console.log('MediaStreamSourceを作成しました');

            // ブラウザに応じた処理を選択
            if (window.AudioWorkletNode) {
                console.log('AudioWorkletを使用します');
                await this.setupAudioWorklet(source);
            } else {
                console.log('ScriptProcessorNodeを使用します');
                this.createScriptProcessorFallback(source);
            }

            // 現在のデバイスIDを記録
            const tracks = this.mediaStream.getAudioTracks();
            if (tracks.length > 0) {
                const settings = tracks[0].getSettings();
                this.currentDeviceId = settings.deviceId || deviceId;
                
                // すべてのオーディオデバイス選択リストを同期
                document.querySelectorAll('.audio-devices').forEach(select => {
                    select.value = this.currentDeviceId;
                });
                console.log('デバイスセレクトボックスを同期しました');
            }

            this.notifyConnectionChange(true);
            this.hideError();
            console.log('オーディオデバイス接続完了:', deviceId);
            
            // デバイスリストを更新
            await this.updateDeviceList();
            
            return true;
        } catch (error) {
            console.error('オーディオデバイス接続エラー:', error);
            this.showError('Failed to connect to audio device. Please ensure microphone permissions are granted.');
            return false;
        }
    }

    async setupAudioWorklet(source) {
        try {
            console.log('Setting up AudioWorklet, sample rate:', this.audioContext.sampleRate);
            
            // Wait for WASM to be ready
            if (!wasmMemory) {
                console.log('Waiting for WASM to initialize...');
                await new Promise(resolve => {
                    const checkWasm = () => {
                        if (wasmMemory) {
                            resolve();
                        } else {
                            setTimeout(checkWasm, 10);
                        }
                    };
                    checkWasm();
                });
            }
            
            // Initialize WASM pitch detector with sample rate
            console.log('Initializing WASM pitch detector');
            init_pitch_detector(this.audioContext.sampleRate);
            
            await this.audioContext.audioWorklet.addModule('js/audio/audio-worklet-processor.js');
            this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');
            
            // Get ring buffer pointer and size from WASM
            const ringBufferPtr = get_ring_buffer_ptr();
            const ringSize = get_ring_buffer_size();
            
            console.log('Ring buffer ptr:', ringBufferPtr, 'size:', ringSize);
            
            // Store reference for WorkletNode to access WASM memory
            this.ringBufferPtr = ringBufferPtr;
            this.ringSize = ringSize;
            this.writeIndex = 0;
            
            // Initialize AudioWorklet with ring buffer info (without memory object)
            this.workletNode.port.postMessage({
                type: 'init',
                ptr: ringBufferPtr,
                ringSize: ringSize
            });
            
            this.workletNode.port.onmessage = (e) => {
                console.log('Received message from AudioWorklet:', e.data.type);
                if (e.data.type === 'samples') {
                    // Process samples with new low-latency method
                    this.processLowLatencySamples(e.data.samples);
                } else if (e.data.samples) {
                    // Fallback to old method if needed
                    console.log('Using fallback processAudioData');
                    this.processAudioData(e.data.samples);
                } else {
                    console.log('Unknown message type:', e.data);
                }
            };
            
            source.connect(this.workletNode);
            this.workletNode.connect(this.audioContext.destination);
            this.isProcessing = true;
            console.log('AudioWorkletNode設定完了 (リングバッファモード)');
        } catch (workletError) {
            console.warn('AudioWorklet初期化エラー、ScriptProcessorにフォールバック:', workletError);
            this.createScriptProcessorFallback(source);
        }
    }

    // スクリプトプロセッサのフォールバック用メソッドを追加
    createScriptProcessorFallback(source) {
        // audioContextがnullの場合は再作成
        if (!this.audioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            
            if (this.audioContext.state !== 'running') {
                this.audioContext.resume();
            }
            
            this.sampleRate = this.audioContext.sampleRate;
            // sourceも再作成が必要
            if (this.mediaStream) {
                source = this.audioContext.createMediaStreamSource(this.mediaStream);
            } else {
                console.error('メディアストリームが存在しません');
                throw new Error('メディアストリームが利用できません');
            }
        }

        // 一部のブラウザではcreateScriptProcessorが非推奨または利用不可
        if (typeof this.audioContext.createScriptProcessor !== 'function') {
            console.warn('ScriptProcessorNodeがサポートされていません。AnalyserNodeフォールバックを使用します');
            // AnalyserNodeを使ったフォールバック
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = this.bufferSize * 2;
            source.connect(this.analyserNode);
            
            // データ取得用のタイマーを設定
            this.analyserTimer = setInterval(() => {
                const dataArray = new Float32Array(this.bufferSize);
                this.analyserNode.getFloatTimeDomainData(dataArray);
                this.processAudioData(dataArray);
            }, 100); // 100msごとに処理
            
            return;
        }

        this.scriptNode = this.audioContext.createScriptProcessor(
            this.bufferSize,
            1,
            1
        );
        this.scriptNode.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            this.processAudioData(inputData);
        };
        source.connect(this.scriptNode);
        this.scriptNode.connect(this.audioContext.destination);
        console.log('ScriptProcessorNode設定完了');
    }

    processAudioData(inputData) {
        if (!this.isProcessing) return;

        // 累積バッファに今回のサンプルを追加
        if (!this.accumulatedSamples) {
            this.accumulatedSamples = new Float32Array(0);
        }
        const newBuffer = new Float32Array(this.accumulatedSamples.length + inputData.length);
        newBuffer.set(this.accumulatedSamples);
        newBuffer.set(inputData, this.accumulatedSamples.length);
        this.accumulatedSamples = newBuffer;

        // 累積サンプル数が bufferSize 以上になったらブロック毎に処理
        while (this.accumulatedSamples.length >= this.bufferSize) {
            // 先頭 bufferSize サンプルを切り出す
            const block = this.accumulatedSamples.subarray(0, this.bufferSize);
            this._processBlock(block);

            // プロセス済みのサンプルを除去
            const remaining = new Float32Array(this.accumulatedSamples.length - this.bufferSize);
            remaining.set(this.accumulatedSamples.subarray(this.bufferSize));
            this.accumulatedSamples = remaining;
        }
        
        // Adaptive buffering for low frequencies
        if (this.adaptiveBuffering && this.accumulatedSamples.length >= this.lowFreqBufferSize) {
            // Check if we might be dealing with low frequencies
            const preliminaryBlock = this.accumulatedSamples.subarray(0, this.bufferSize);
            const maxAmplitude = this.calculateMaxAmplitude(preliminaryBlock);
            
            if (maxAmplitude > this.noteOnThreshold) {
                // Perform a quick spectral analysis to check if low frequency content is present
                const spectral = this.analyzeSpectralContent(preliminaryBlock);
                if (spectral.centroid < this.veryLowFreqThreshold) {
                    // Use larger buffer for low frequency detection
                    const largeBlock = this.accumulatedSamples.subarray(0, this.lowFreqBufferSize);
                    this._processLowFreqBlock(largeBlock);
                    
                    // Remove processed samples
                    const remaining = new Float32Array(this.accumulatedSamples.length - this.lowFreqBufferSize);
                    remaining.set(this.accumulatedSamples.subarray(this.lowFreqBufferSize));
                    this.accumulatedSamples = remaining;
                }
            }
        }
    }

    _processLowFreqBlock(block) {
        // Process low frequency content with larger buffer
        this.lowFreqSamples.set(block);
        
        // Calculate maximum amplitude
        const maxAmplitude = this.calculateMaxAmplitude(this.lowFreqSamples);
        
        // Update note state
        this.updateNoteState(maxAmplitude);
        
        if (!this.isNoteOn) {
            this.resetDetection();
            return;
        }
        
        // Analyze with larger buffer for better low frequency resolution
        const spectral = this.analyzeSpectralContent(this.lowFreqSamples);
        const pitchResult = this.analyzePitchLowFreq(this.lowFreqSamples, spectral);
        const frequency = pitchResult.frequency;
        const confidence = pitchResult.confidence;
        const observationProbs = pitchResult.observationProbs;
        
        // Record confidence
        this.lastPitchConfidence = confidence;
        
        this.processDetectedFrequency(frequency, observationProbs, confidence);
    }

    _processBlock(block) {
        // このブロックはthis.bufferSize の長さ（2048）になっている前提
        this.samples.set(block);

        // 最大振幅を計算（最適化コードはそのまま）
        let maxAmplitude = 0;
        let i = 0;
        for (; i < this.bufferSize - 3; i += 4) {
            maxAmplitude = Math.max(maxAmplitude, 
                Math.max(
                    Math.max(Math.abs(this.samples[i]), Math.abs(this.samples[i + 1])),
                    Math.max(Math.abs(this.samples[i + 2]), Math.abs(this.samples[i + 3]))
                )
            );
        }
        for (; i < this.bufferSize; i++) {
            maxAmplitude = Math.max(maxAmplitude, Math.abs(this.samples[i]));
        }
        
        // ノートの状態を更新
        this.updateNoteState(maxAmplitude);

        if (!this.isNoteOn) {
            this.resetDetection();
            return;
        }

        // PYINアルゴリズムで周波数を検出
        const spectral = this.analyzeSpectralContent(this.samples);
        const pitchResult = this.analyzePitch(this.samples, spectral);
        const frequency = pitchResult.frequency;
        const confidence = pitchResult.confidence;
        const observationProbs = pitchResult.observationProbs;
        
        // 信頼度の記録（デバッグ用）
        this.lastPitchConfidence = confidence;
        
        this.processDetectedFrequency(frequency, observationProbs, confidence);
    }

    processDetectedFrequency(frequency, observationProbs, confidence) {
        // PYIN の検出結果が信頼性が低い場合、spectral 分析を補完として使用
        if (frequency <= 0 || confidence < 0.4) {
            const spectral = this.analyzeSpectralContent(this.samples);
            if (spectral.peaks.length > 0) {
                frequency = spectral.peaks[0].frequency;
                // スペクトル分析の信頼度を補正
                confidence = Math.min(0.7, spectral.clarity);
            } else {
                this.resetDetection();
                return;
            }
        }
        
        const currentTime = performance.now() / 1000;
        // 無音時の誤検出を防ぐため、計測された最大振幅が silenceThreshold 未満なら処理をスキップ
        const currentMaxAmplitude = this.calculateMaxAmplitude(this.samples);
        if (currentMaxAmplitude < this.silenceThreshold) {
            this.resetDetection();
            return;
        }

        // PYIN と spectral から候補となるノート番号を取得
        const pyinCandidate = this.getClosestNote(frequency);
        const spectralData = this.analyzeSpectralContent(this.samples);
        const spectralCandidate = spectralData.peaks.length > 0
            ? this.getClosestNote(spectralData.peaks[0].frequency)
            : pyinCandidate;
        
        // より信頼性の高い情報を使用
        let candidate;
        if (confidence > 0.7) {
            // PYIN の信頼度が高い場合はその結果を優先
            candidate = pyinCandidate;
        } else if (this.currentNote !== -1) {
            // 現在のノートの継続性を優先
            if (pyinCandidate === this.currentNote || spectralCandidate === this.currentNote) {
                candidate = this.currentNote;
            } else {
                // 両方の候補から信頼性の高い方を選択
                candidate = pyinCandidate;
            }
        } else {
            candidate = pyinCandidate;
        }

        // 低周波数域の特別処理
        if (frequency < this.lowFrequencyThreshold) {
            const currentAmplitude = this.calculateMaxAmplitude(this.samples);
            if (currentAmplitude < this.lowFrequencyAmplitudeThreshold) {
                return;
            }
        }

        // ピッチ履歴の更新
        this.updatePitchHistory(candidate, confidence);

        // 急激な音変化に対する処理
        if (this.currentNote !== -1 && candidate !== this.currentNote) {
            const previousFrequency = this.noteFrequencies.get(this.currentNote) || 0;
            const semitoneDiff = previousFrequency > 0
                ? Math.abs(12 * Math.log2(frequency / previousFrequency))
                : 0;

            if (semitoneDiff > this.maxAllowedPitchChange) {
                if (semitoneDiff > this.maxAllowedPitchChange * 0.8) {
                    // 急激な変化の場合は、一度ノートオフを発行してから新しいノートオン
                    this.handleNoteDetection(-1);
                    this.handleNoteDetection(candidate);
                } else {
                    this.handleNoteDetection(candidate);
                }
                this.currentNote = candidate;
                this.lastNoteOnTime = currentTime;
                return;
            }
        }

        // 周波数安定性のチェック（連続フレームごとに安定しているか確認）
        if (this.isFrequencyWithinTolerance(frequency, this.noteFrequencies.get(candidate))) {
            if (candidate === this.lastStableNote) {
                this.consecutiveFrames++;
                if (this.consecutiveFrames >= this.consecutiveFramesThreshold) {
                    if (candidate !== this.currentNote) {
                        this.handleNoteDetection(candidate);
                        this.currentNote = candidate;
                        this.lastNoteOnTime = currentTime;
                    }
                }
            } else {
                this.consecutiveFrames = 1;
                this.lastStableNote = candidate;
            }
        }

        // HMM状態更新
        if (observationProbs) {
            this.hmmProcessor.update(observationProbs);
        }
        
        // 最尤状態を取得
        const hmmNote = this.hmmProcessor.getMostProbableNote();
        const finalNote = this.resolveNoteConflict(hmmNote, candidate);
        
        // 最終的な音符の決定と処理
        if (finalNote !== this.currentNote && this.isPitchStable(finalNote)) {
            this.handleNoteDetection(finalNote);
            this.currentNote = finalNote;
            this.lastNoteOnTime = currentTime;
        }
    }

    // ピッチ履歴の更新
    updatePitchHistory(note, confidence) {
        this.pitchHistory.push({
            note: note,
            confidence: confidence,
            timestamp: performance.now()
        });
        
        // 履歴のサイズを制限
        if (this.pitchHistory.length > this.pitchHistorySize) {
            this.pitchHistory.shift();
        }
    }

    // ピッチが安定しているかどうかを判定
    isPitchStable(note) {
        // 履歴が不十分な場合は安定していないと見なす
        if (this.pitchHistory.length < 2) {
            return false;
        }
        
        // 直近の履歴のうち、同じノートが多数を占めるか確認 (ultra-low latency)
        const recentHistory = this.pitchHistory.slice(-2);
        const matchingNotes = recentHistory.filter(entry => entry.note === note);
        
        // 高信頼度のエントリが多いほど安定と見なす
        const totalConfidence = matchingNotes.reduce((sum, entry) => sum + entry.confidence, 0);
        const avgConfidence = totalConfidence / matchingNotes.length || 0;
        
        return matchingNotes.length >= 1 && avgConfidence > 0.5; // Reduced thresholds for faster response
    }

    updateNoteState(amplitude) {
        if (!this.isNoteOn && amplitude > this.noteOnThreshold) {
            this.isNoteOn = true;
        }
        else if (this.isNoteOn && amplitude < this.noteOffThreshold) {
            this.isNoteOn = false;
        }
    }

    resetDetection() {
        if (this.currentNote !== -1) {
            this.handleNoteDetection(-1);
        }
        this.lastDetectedNote = -1;
        this.consecutiveFrames = 0;
        this.lastStableNote = -1;
        this.currentNote = -1;
    }
    
    // Handle detected pitch from ring buffer
    handleDetectedPitch(frequency) {
        // シーク・ループ時は音程検出を一時停止して処理を軽量化
        if (this.isSeekingOrLooping()) {
            return;
        }
        
        // Convert frequency to MIDI note
        const midiNote = this.getClosestNote(frequency);
        
        // Update pitch history
        this.pitchHistory.push(midiNote);
        if (this.pitchHistory.length > this.pitchHistorySize) {
            this.pitchHistory.shift();
        }
        
        // Check for stable note
        const stableNote = this.getStableNote();
        if (stableNote !== -1) {
            if (this.currentNote !== stableNote) {
                // Note change detected
                if (this.currentNote !== -1) {
                    this.onNoteOff?.(this.currentNote);
                }
                this.currentNote = stableNote;
                this.onNoteOn?.(stableNote);
            }
        }
        
        this.lastDetectedFrequency = frequency;
        this.isNoteOn = true;
    }
    
    // シーク・ループ状態をチェック
    isSeekingOrLooping() {
        if (window.gameInstance) {
            const now = Date.now();
            const isInSeekCooldown = (now - window.gameInstance.lastSeekTime) < window.gameInstance.seekCooldownTime;
            return window.gameInstance.isJustAfterSeek || 
                   window.gameInstance.isInLoop || 
                   window.gameInstance.isSkipping || 
                   isInSeekCooldown;
        }
        return false;
    }
    
    // Handle no pitch detected
    handleNoPitch() {
        // Add -1 to history to indicate no pitch
        this.pitchHistory.push(-1);
        if (this.pitchHistory.length > this.pitchHistorySize) {
            this.pitchHistory.shift();
        }
        
        // Check if we should trigger note off
        const silentFrames = this.pitchHistory.filter(p => p === -1).length;
        if (silentFrames >= this.consecutiveFramesThreshold && this.currentNote !== -1) {
            this.onNoteOff?.(this.currentNote);
            this.currentNote = -1;
            this.isNoteOn = false;
        }
        
        this.lastDetectedFrequency = 0;
    }
    
    // Get stable note from pitch history
    getStableNote() {
        if (this.pitchHistory.length < 2) { // Reduced for ultra-low latency
            return -1;
        }
        
        // Use smaller window for faster response
        const windowSize = Math.min(4, this.pitchHistory.length);
        const recentHistory = this.pitchHistory.slice(-windowSize);
        
        // Count occurrences of each note in recent history
        const noteCounts = new Map();
        for (const note of recentHistory) {
            if (note !== -1) {
                noteCounts.set(note, (noteCounts.get(note) || 0) + 1);
            }
        }
        
        // Find the most common note with reduced threshold for faster response
        let mostCommonNote = -1;
        let maxCount = 0;
        const minRequiredCount = Math.ceil(windowSize * 0.5); // 50% consensus for faster response
        
        for (const [note, count] of noteCounts) {
            if (count > maxCount && count >= minRequiredCount) {
                // Check if this note is close to recent detections (±1 semitone tolerance)
                const isConsistent = recentHistory.slice(-2).some(recentNote => 
                    recentNote !== -1 && Math.abs(recentNote - note) <= 1
                );
                
                if (isConsistent) {
                    mostCommonNote = note;
                    maxCount = count;
                }
            }
        }
        
        return mostCommonNote;
    }

    // Pause/resume audio processing during seeks for better performance
    pauseProcessingForSeek() {
        this.pauseProcessing = true;
        setTimeout(() => {
            this.pauseProcessing = false;
        }, 100);
    }
    
    // Process samples with low-latency ring buffer approach
    processLowLatencySamples(samples) {
        
        // Skip processing during seeks to improve seek performance
        if (this.pauseProcessing) {
            console.log('Audio processing paused during seek');
            return;
        }
        
        if (!wasmMemory) {
            this.processAudioData(samples);
            return;
        }
        
        if (!this.ringBufferPtr || !this.ringSize) {
            console.log('Ring buffer not initialized, ptr:', this.ringBufferPtr, 'size:', this.ringSize);
            this.processAudioData(samples);
            return;
        }
        
        // Get fresh memory buffer (it may have been reallocated)
        const currentMemory = get_memory();
        
        // Validate pointer range
        const requiredBytes = this.ringBufferPtr + (this.ringSize * 4); // 4 bytes per float32
        if (requiredBytes > currentMemory.buffer.byteLength) {
            console.error('Ring buffer pointer out of bounds!', requiredBytes, '>', currentMemory.buffer.byteLength);
            this.processAudioData(samples);
            return;
        }
        
        const ringBuffer = new Float32Array(currentMemory.buffer, this.ringBufferPtr, this.ringSize);
        
        // Check input signal level
        let maxAmplitude = 0;
        let rms = 0;
        for (let i = 0; i < samples.length; i++) {
            maxAmplitude = Math.max(maxAmplitude, Math.abs(samples[i]));
            rms += samples[i] * samples[i];
        }
        rms = Math.sqrt(rms / samples.length);
        
        
        // Copy samples to ring buffer
        for (let i = 0; i < samples.length; i++) {
            ringBuffer[this.writeIndex] = samples[i];
            this.writeIndex = (this.writeIndex + 1) % this.ringSize;
        }
        
        // Verify the copy worked
        const verifyIndex = (this.writeIndex - 1 + this.ringSize) % this.ringSize;
        
        // Process every 32 samples (HOP_SIZE) for ultra-low latency
        if ((this.writeIndex & 0x1F) === 0) {
            const frequency = process_audio_block(this.writeIndex);
            
            if (frequency > 0 && frequency >= this.minFrequency && frequency <= this.maxFrequency) {
                this.handleDetectedPitch(frequency);
            } else {
                this.handleNoPitch();
            }
        }
    }

    getClosestNote(frequency) {
        let closestNote = 48;  // C2
        let minDifference = Infinity;

        for (const [note, noteFreq] of this.noteFrequencies) {
            const difference = Math.abs(frequency - noteFreq);
            if (difference < minDifference) {
                minDifference = difference;
                closestNote = note;
            }
        }

        return closestNote;
    }

    isFrequencyWithinTolerance(detectedFreq, noteFreq) {
        // セント値を使用して周波数の差を計算（CSと同じ方法）
        const cents = 1200 * Math.log2(detectedFreq / noteFreq);
        // 低周波数域では許容範囲を広く
        const tolerance = (detectedFreq < this.lowFrequencyThreshold) ? 50 : 100;
        return Math.abs(cents) <= tolerance;
    }

    calculateMaxAmplitude(samples) {
        let maxAmplitude = 0;
        let i = 0;
        // CSと同じ4サンプルずつの最適化
        for (; i < samples.length - 3; i += 4) {
            maxAmplitude = Math.max(maxAmplitude, 
                Math.max(
                    Math.max(Math.abs(samples[i]), Math.abs(samples[i + 1])),
                    Math.max(Math.abs(samples[i + 2]), Math.abs(samples[i + 3]))
                )
            );
        }
        // 残りのサンプル
        for (; i < samples.length; i++) {
            maxAmplitude = Math.max(maxAmplitude, Math.abs(samples[i]));
        }
        return maxAmplitude;
    }

    calculateObservationProbs(candidates, spectral) {
        const probs = new Array(108 - 21 + 1).fill(0.0001); // ゼロ除算防止のため微小値を設定
        
        // 各候補の確率を計算
        candidates.forEach(candidate => {
            const idx = candidate.midiNote - 21;
            
            // 基本確率（YINの信頼度）
            let prob = candidate.confidence;
            
            // スペクトル純度による補正
            prob *= spectral.clarity;
            
            // 低音域の振幅チェック
            if (candidate.frequency < this.lowFrequencyThreshold) {
                const ampFactor = Math.min(1, 
                    this.currentMaxAmplitude / this.lowFrequencyAmplitudeThreshold
                );
                prob *= ampFactor;
            }
            
            probs[idx] = prob;
        });
        
        // 正規化
        const sum = probs.reduce((a, b) => a + b, 0);
        return probs.map(p => p / sum);
    }

    resolveNoteConflict(hmmNote, currentCandidate) {
        // 周波数差が2半音以内ならHMMの結果を優先
        const diff = Math.abs(hmmNote - currentCandidate);
        return diff <= 2 ? hmmNote : currentCandidate;
    }

    setupAudioControls() {
        const controls = [
            {
                select: document.querySelector('#settings-audio-devices'),
                error: document.querySelector('#settings-modal .audio-error')
            },
            {
                select: document.querySelector('#initial-audio-devices'),
                error: document.querySelector('#input-select-modal .audio-error')
            }
        ];

        // デバイスリストの更新関数
        const updateDeviceList = async () => {
            try {
                console.log('オーディオデバイスリストを更新します');
                
                // 選択されている入力方法を確認
                const initialInputMethod = document.querySelector('input[name="initial-input-method"]:checked');
                const settingsInputMethod = document.querySelector('input[name="input-method"]:checked');
                
                // MIDI入力が選択されている場合は処理をスキップ
                if ((initialInputMethod && initialInputMethod.value === 'midi') || 
                    (settingsInputMethod && settingsInputMethod.value === 'midi')) {
                    console.log('MIDI入力が選択されているため、マイク許可処理をスキップします');
                    
                    // ★★★ enumerateDevices の存在確認を追加 (MIDI選択時もデバイスリストは更新試行するため) ★★★
                    if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') {
                        console.warn('navigator.mediaDevices.enumerateDevices is not supported in this environment. Cannot update audio device list.');
                        // controls.forEach(({ select }) => {
                        // if (!select) return;
                        // select.innerHTML = '<option value="">Audio device listing not supported</option>';
                        // });
                        // return; // リスト更新を中止
                        // エラー表示は updateDeviceList のメイン処理に任せる
                    }

                    // セレクトボックスは更新するが、許可は要求しない
                    const devices = (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function')
                        ? await navigator.mediaDevices.enumerateDevices()
                        : [];
                    const audioInputs = devices.filter(device => device.kind === 'audioinput');

                    controls.forEach(({ select }) => {
                        if (!select) return;
                        
                        // 現在の選択を保持
                        const currentValue = select.value;
                        
                        // リストをクリアして更新（ただし許可は要求しない）
                        select.innerHTML = '<option value="">No audio device connected</option>';
                        
                        audioInputs.forEach(device => {
                            const option = document.createElement('option');
                            option.value = device.deviceId;
                            option.text = device.label || `Microphone ${device.deviceId.slice(0, 4)}`;
                            option.selected = device.deviceId === currentValue;
                            select.appendChild(option);
                        });
                    });
                    
                    // iOSでは最初のデバイスを自動選択（UIの明示的な選択を促進）
                    if (this.isIOSDevice && select.options.length > 1 && !select.value) {
                        // 'default'デバイスがあればそれを選択、なければ最初の非空オプション
                        const defaultOption = Array.from(select.options).find(opt => opt.value === 'default');
                        if (defaultOption) {
                            select.value = 'default';
                        } else if (select.options[1].value) {
                            select.value = select.options[1].value;
                        }
                        console.log('iOS: デフォルトマイクを自動選択:', select.value);
                    }
                    
                    return;
                }
                
                // iOS向けの特別処理: AudioContextを事前に初期化
                if (this.isIOSDevice && !this.audioContext) {
                    console.log('iOS: AudioContextをプリロードします');
                    try {
                        // 許可ダイアログを表示せずにAudioContextを初期化
                        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        // 一時停止しておく
                        await this.audioContext.suspend();
                        // プリロード時にサンプルレートを取得して保持
                        this.sampleRate = this.audioContext.sampleRate;
                        console.log('iOS: AudioContextをプリロード完了');
                    } catch (e) {
                        console.warn('iOS: AudioContextのプリロードに失敗:', e);
                    }
                }
                
                // ★★★ enumerateDevices の存在確認を追加 ★★★
                if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') {
                    console.warn('navigator.mediaDevices.enumerateDevices is not supported in this environment.');
                    this.showError('Audio device listing is not supported.');
                    // 接続されているデバイスがない状態としてUIを更新
                    controls.forEach(({ select }) => {
                        if (select) {
                            select.innerHTML = '<option value="">Audio device listing not supported</option>';
                        }
                    });
                    this.currentDeviceId = null;
                    this.notifyConnectionChange(false);
                    return;
                }
                
                // デバイスリストを取得
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices.filter(device => device.kind === 'audioinput');

                // デバイスラベルがない場合（許可が得られていない場合）、最初にgetUserMediaを呼ぶ
                if (audioInputs.length > 0 && !audioInputs[0].label) {
                    console.log('マイク許可が必要なため、getUserMediaを実行します');
                    // ★★★ getUserMedia の存在確認を追加 ★★★
                    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
                        console.warn('navigator.mediaDevices.getUserMedia is not supported in this environment. Cannot obtain microphone permission to get device labels.');
                        // ラベルなしで続行、またはエラー表示
                        this.showError('Cannot get microphone permission to list device names.');
                    } else {
                        try {
                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            // すぐにストリームを停止
                            stream.getTracks().forEach(track => track.stop());
                            // 許可を得た後、再度デバイスリストを取得
                            const refreshedDevices = await navigator.mediaDevices.enumerateDevices();
                            const refreshedAudioInputs = refreshedDevices.filter(device => device.kind === 'audioinput');
                            
                            if (refreshedAudioInputs.length > 0) {
                                // デバイスリストが更新されたら使用する
                                audioInputs.length = 0;
                                refreshedAudioInputs.forEach(device => audioInputs.push(device));
                            }
                        } catch (err) {
                            console.warn('マイク許可の取得に失敗:', err);
                        }
                    }
                }

                controls.forEach(({ select }) => {
                    if (!select) return;
                    
                    // 現在の選択を保持
                    const currentValue = select.value;
                    
                    // リストをクリアして更新
                    select.innerHTML = '<option value="">No audio device connected</option>';
                    
                    // デバイス名に基づいて重複を排除（iOSでは同一デバイスが複数回表示される場合がある）
                    const uniqueDevices = new Map();
                    audioInputs.forEach(device => {
                        // デバイスIDがある場合のみ追加（空のIDは追加しない）
                        if (device.deviceId) {
                            const key = device.label || device.deviceId;
                            // まだ追加されていなければ追加
                            if (!uniqueDevices.has(key)) {
                                uniqueDevices.set(key, device);
                            }
                        }
                    });
                    
                    // 重複のないデバイスリストを作成
                    Array.from(uniqueDevices.values()).forEach(device => {
                        const option = document.createElement('option');
                        option.value = device.deviceId;
                        option.text = device.label || `Microphone ${device.deviceId.slice(0, 4)}`;
                        option.selected = device.deviceId === currentValue || 
                                         (currentValue === '' && device.deviceId === 'default');
                        select.appendChild(option);
                    });
                    
                    // iOSでは最初のデバイスを自動選択（UIの明示的な選択を促進）
                    if (this.isIOSDevice && select.options.length > 1 && !select.value) {
                        // 'default'デバイスがあればそれを選択、なければ最初の非空オプション
                        const defaultOption = Array.from(select.options).find(opt => opt.value === 'default');
                        if (defaultOption) {
                            select.value = 'default';
                        } else if (select.options[1].value) {
                            select.value = select.options[1].value;
                        }
                        console.log('iOS: デフォルトマイクを自動選択:', select.value);
                    }
                });
                
                console.log('オーディオデバイスリスト更新完了');
            } catch (error) {
                console.error('オーディオデバイスリスト更新エラー:', error);
            }
        };

        // 初期デバイスリストを取得
        updateDeviceList();

        // デバイスの変更を監視
        if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
            navigator.mediaDevices.addEventListener('devicechange', updateDeviceList);
        } else {
            console.warn('navigator.mediaDevices.addEventListener is not supported in this environment. Device change detection will be disabled.');
            // 必要であれば、ポーリングなどの代替手段をここに実装することも検討できます。
        }

        // セレクトボックスのイベントリスナーを設定
        controls.forEach(({ select, error }) => {
            if (!select) return;

            this.errorDisplays.set(select.id, error);

            select.addEventListener('change', async (e) => {
                const selectedId = e.target.value;
                try {
                    if (selectedId) {
                        // iOS特有の対応: 選択変更時に自動的に接続しない
                        if (!this.isIOSDevice) {
                            await this.connectDevice(selectedId);
                            controls.forEach(control => {
                                if (control.select && control.select !== e.target) {
                                    control.select.value = selectedId;
                                }
                            });
                        } else {
                            console.log('iOS: デバイスが選択されました。Continueボタンで接続してください:', selectedId);
                            // 他のセレクトボックスと同期のみ
                            controls.forEach(control => {
                                if (control.select && control.select !== e.target) {
                                    control.select.value = selectedId;
                                }
                            });
                        }
                    } else {
                        // 空の選択の場合、切断するかiOSでは無視
                        if (!this.isIOSDevice) {
                            await this.disconnectDevice();
                        } else {
                            console.log('iOS: 空のデバイス選択は無視されます');
                        }
                    }
                } catch (error) {
                    console.error('デバイス接続エラー:', error);
                    this.showError('Failed to connect to device. Please ensure microphone permissions are granted.');
                    select.value = this.currentDeviceId || '';
                }
            });
        });
    }

    showError(message, selectId = null) {
        if (selectId) {
            const errorDisplay = this.errorDisplays.get(selectId);
            if (errorDisplay) {
                errorDisplay.textContent = message;
                errorDisplay.style.display = 'block';
            }
        } else {
            this.errorDisplays.forEach(display => {
                if (display) {
                    display.textContent = message;
                    display.style.display = 'block';
                }
            });
        }
    }

    hideError(selectId = null) {
        if (selectId) {
            const errorDisplay = this.errorDisplays.get(selectId);
            if (errorDisplay) {
                errorDisplay.style.display = 'none';
            }
        } else {
            this.errorDisplays.forEach(display => {
                if (display) {
                    display.style.display = 'none';
                }
            });
        }
    }

    async updateDeviceList() {
        try {
            // ★★★ enumerateDevices の存在確認を追加 ★★★
            if (!navigator.mediaDevices || typeof navigator.mediaDevices.enumerateDevices !== 'function') {
                console.warn('navigator.mediaDevices.enumerateDevices is not supported. Cannot update device list.');
                document.querySelectorAll('.audio-devices').forEach(deviceSelect => {
                    deviceSelect.innerHTML = '<option value="">Audio device listing not supported</option>';
                });
                this.currentDeviceId = null;
                this.notifyConnectionChange(false);
                return;
            }

            // デバイスリストを取得
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            document.querySelectorAll('.audio-devices').forEach(deviceSelect => {
                const currentSelection = deviceSelect.value;
                deviceSelect.innerHTML = '<option value="">No audio device connected</option>';

                // オーディオ入力デバイスのみをフィルタリング
                const audioInputs = devices ? devices.filter(device => device.kind === 'audioinput') : [];

                audioInputs.forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    // ラベルがない場合は「許可が必要」と表示
                    option.textContent = device.label || 'Microphone (Permission needed)';
                    option.selected = device.deviceId === this.currentDeviceId;
                    deviceSelect.appendChild(option);
                });

                if (this.currentDeviceId && 
                    !Array.from(deviceSelect.options).some(opt => opt.value === this.currentDeviceId)) {
                    deviceSelect.value = '';
                    this.currentDeviceId = null;
                    this.notifyConnectionChange(false);
                }
            });
        } catch (error) {
            console.error('Failed to enumerate devices:', error);
            this.showError('Failed to get audio device list');
        }
    }

    notifyConnectionChange(connected) {
        if (this.onConnectionChange && typeof this.onConnectionChange === 'function') {
            this.onConnectionChange(connected);
        }
    }

    async disconnectDevice() {
        console.log('オーディオデバイス切断を開始します');
        this.isProcessing = false;
        
        // ノードの切断を明示的に行う
        if (this.workletNode) {
            console.log('WorkletNodeを切断します');
            this.workletNode.disconnect();
            this.workletNode.port.close();
            this.workletNode = null;
        }
        
        if (this.scriptNode) {
            console.log('ScriptNodeを切断します');
            this.scriptNode.disconnect();
            this.scriptNode = null;
        }
        
        // AnalyserNodeとタイマーのクリーンアップ
        if (this.analyserNode) {
            console.log('AnalyserNodeを切断します');
            this.analyserNode.disconnect();
            this.analyserNode = null;
        }
        
        if (this.analyserTimer) {
            console.log('AnalyserTimerを停止します');
            clearInterval(this.analyserTimer);
            this.analyserTimer = null;
        }
        
        if (this.mediaStream) {
            console.log('MediaStreamトラックを停止します:', 
                this.mediaStream.getTracks().length + '個のトラック');
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        // iOS向けのAudioContext処理
        if (this.audioContext) {
            if (this.isIOSDevice) {
                // iOSでは閉じずに一時停止
                console.log('iOS: AudioContextを一時停止します');
                try {
                    await this.audioContext.suspend();
                    console.log('iOS: AudioContext一時停止完了. 状態:', this.audioContext.state);
                } catch (e) {
                    console.error('AudioContextの一時停止に失敗:', e);
                }
            } else {
                // iOS以外では完全にクローズ
                console.log('非iOS: AudioContextを閉じます');
                try {
                    await this.audioContext.close();
                    this.audioContext = null;
                    console.log('AudioContext削除完了');
                } catch (e) {
                    console.error('AudioContextの削除に失敗:', e);
                }
            }
        }
        
        if (this.activeNote !== null) {
            console.log('アクティブノートをリセット:', this.activeNote);
            this.onNoteOff?.(this.activeNote);
            this.activeNote = null;
        }
        
        this.currentDeviceId = null;
        this.notifyConnectionChange(false);
        console.log('オーディオデバイス切断完了');
    }

    freqToMIDI(frequency) {
        // 基準となる周波数テーブルを作成（A0からC8まで）
        if (!this.frequencyTable) {
            this.frequencyTable = new Map();
            for (let note = 21; note <= 108; note++) {
                const freq = 440 * Math.pow(2, (note - 69) / 12);
                this.frequencyTable.set(note, freq);
            }
        }

        // 最も近い周波数を持つノートを探す
        let closestNote = null;
        let minDiff = Infinity;
        let tolerance = frequency * 0.03;  // 3%の許容範囲

        for (const [note, referenceFreq] of this.frequencyTable) {
            const diff = Math.abs(frequency - referenceFreq);
            if (diff < minDiff && diff < tolerance) {
                minDiff = diff;
                closestNote = note;
            }
        }

        return closestNote;
    }

    // MIDIノート番号を音名に変換するヘルパーメソッド
    midiNoteToName(note) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(note / 12) - 1;
        const noteName = noteNames[note % 12];
        return `${noteName}${octave}`;
    }

    // デバッグ用のUIを追加
    addDebugDisplay() {
        // デバッグ表示を無効化
        return; // この行を追加して早期リターン
        
        const debugDiv = document.createElement('div');
        debugDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            z-index: 9999;
            min-width: 200px;
        `;
        document.body.appendChild(debugDiv);
        this.debugDisplay = debugDiv;
    }

    // 最頻値のオクターブを取得
    getMostCommonOctave() {
        const octaveCounts = new Map();
        this.pitchHistory.forEach(note => {
            const octave = Math.floor(note.note / 12) - 1;
            octaveCounts.set(octave, (octaveCounts.get(octave) || 0) + 1);
        });

        let maxCount = 0;
        let mostCommonOctave = 4; // デフォルト値
        
        for (const [octave, count] of octaveCounts) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonOctave = octave;
            }
        }

        return mostCommonOctave;
    }

    getMode(arr) {
        const counts = new Map();
        let maxCount = 0;
        let mode = arr[0];

        for (const num of arr) {
            const count = (counts.get(num) || 0) + 1;
            counts.set(num, count);
            
            if (count > maxCount) {
                maxCount = count;
                mode = num;
            }
        }

        return mode;
    }

    // スペクトルピークの検出
    findSpectralPeaks(acf) {
        const peaks = [];
        const minPeakHeight = Math.max(...acf) * 0.1; // 最大値の10%以上を対象
        
        // 極大値の検出
        for (let i = 1; i < acf.length - 1; i++) {
            if (acf[i] > acf[i-1] && acf[i] > acf[i+1] && acf[i] > minPeakHeight) {
                // 周波数の計算
                const frequency = this.sampleRate / i;
                
                // 有効な周波数範囲内のみを対象
                if (frequency >= this.minFrequency && frequency <= this.maxFrequency) {
                    peaks.push({
                        frequency,
                        magnitude: acf[i],
                        index: i
                    });
                }
            }
        }
        
        // マグニチュードで降順ソート
        return peaks.sort((a, b) => b.magnitude - a.magnitude);
    }

    // スペクトル重心の計算
    calculateSpectralCentroid(peaks) {
        if (peaks.length === 0) return 0;
        
        let weightedSum = 0;
        let magnitudeSum = 0;
        
        peaks.forEach(peak => {
            weightedSum += peak.frequency * peak.magnitude;
            magnitudeSum += peak.magnitude;
        });
        
        return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    }

    // スペクトル広がりの計算
    calculateSpectralSpread(peaks, centroid) {
        if (peaks.length === 0) return 0;
        
        let weightedSum = 0;
        let magnitudeSum = 0;
        
        peaks.forEach(peak => {
            const diff = peak.frequency - centroid;
            weightedSum += (diff * diff) * peak.magnitude;
            magnitudeSum += peak.magnitude;
        });
        
        return magnitudeSum > 0 ? Math.sqrt(weightedSum / magnitudeSum) : 0;
    }

    // ピッチインデックスの検出
    findPitchIndex(yinBuffer) {
        const threshold = 0.1; // YINアルゴリズムの閾値
        
        // 最小インデックスの計算（最高周波数に対応）
        const minIndex = Math.floor(this.sampleRate / this.maxFrequency);
        // 最大インデックスの計算（最低周波数に対応）
        const maxIndex = Math.floor(this.sampleRate / this.minFrequency);
        
        let minValue = 1;
        let minValueIndex = 0;
        
        // 閾値を下回る最初の谷を探す
        for (let i = minIndex; i < Math.min(maxIndex, yinBuffer.length); i++) {
            if (yinBuffer[i] < threshold) {
                while (i + 1 < yinBuffer.length && yinBuffer[i + 1] < yinBuffer[i]) {
                    i++;
                }
                return i;
            } else if (yinBuffer[i] < minValue) {
                minValue = yinBuffer[i];
                minValueIndex = i;
            }
        }
        
        return minValue < 0.5 ? minValueIndex : 0;
    }

    // ピッチ検出の信頼度計算
    calculatePitchConfidence(yinBuffer, minIndex) {
        if (minIndex === 0) return 0;
        
        // 周辺の値との比較
        const windowSize = 5;
        let sum = 0;
        let count = 0;
        
        for (let i = Math.max(0, minIndex - windowSize); 
             i < Math.min(yinBuffer.length, minIndex + windowSize); i++) {
            if (i !== minIndex) {
                sum += yinBuffer[i];
                count++;
            }
        }
        
        const avgSurrounding = sum / count;
        const minValue = yinBuffer[minIndex];
        
        // 信頼度の計算（0-1の範囲）
        return Math.max(0, Math.min(1, 1 - (minValue / avgSurrounding)));
    }

    analyzeSpectralContent(inputData) {
        // 自己相関に基づくスペクトル分析
        const acf = new Float32Array(this.bufferSize / 2);
        for (let lag = 0; lag < acf.length; lag++) {
            let sum = 0;
            for (let i = 0; i < inputData.length - lag; i++) {
                sum += inputData[i] * inputData[i + lag];
            }
            acf[lag] = sum;
        }

        // スペクトル特性の抽出
        const peaks = this.findSpectralPeaks(acf);
        const centroid = this.calculateSpectralCentroid(peaks);
        const spread = this.calculateSpectralSpread(peaks, centroid);

        return {
            peaks,
            centroid,
            spread,
            clarity: peaks.length > 0 ? peaks[0].magnitude / spread : 0
        };
    }

    analyzePitch(inputData, spectral) {
        const dataLength = inputData.length;
        const byteLength = dataLength * Float32Array.BYTES_PER_ELEMENT;
        const ptr = alloc(byteLength);
        const wasmArray = new Float32Array(get_memory().buffer, ptr, dataLength);
        wasmArray.set(inputData);
        
        // PYINアルゴリズムでピッチ検出
        const frequency = analyze_pitch(ptr, byteLength, this.sampleRate, this.pyinThreshold);
        free(ptr);
        
        // 検出結果から候補とそのMIDIノートを取得
        const midiNote = this.getClosestNote(frequency);
        
        // 信頼度の計算（PYINの信頼度は周波数の安定性から推定）
        const confidence = frequency > 0 ? this.calculatePYINConfidence(inputData, frequency) : 0;
        
        // 候補の作成
        const candidate = { 
            frequency: frequency, 
            confidence: confidence, 
            midiNote: midiNote 
        };
        
        // 観測確率の計算
        const observationProbs = this.calculateObservationProbs([candidate], spectral);
        
        return {
            frequency: frequency,
            confidence: confidence,
            candidates: [candidate],
            observationProbs: observationProbs
        };
    }
    
    analyzePitchLowFreq(inputData, spectral) {
        // Optimized pitch detection for low frequencies using larger buffer
        const dataLength = inputData.length;
        const byteLength = dataLength * Float32Array.BYTES_PER_ELEMENT;
        const ptr = alloc(byteLength);
        const wasmArray = new Float32Array(get_memory().buffer, ptr, dataLength);
        wasmArray.set(inputData);
        
        // Use lower threshold for low frequency detection
        const lowFreqThreshold = this.pyinThreshold * 0.7;
        
        // PYIN with adjusted parameters for low frequencies
        const frequency = analyze_pitch(ptr, byteLength, this.sampleRate, lowFreqThreshold);
        free(ptr);
        
        // If PYIN fails or gives unreliable results, try harmonic product spectrum
        let finalFrequency = frequency;
        let confidence = frequency > 0 ? this.calculatePYINConfidence(inputData, frequency) : 0;
        
        if (frequency <= 0 || confidence < 0.3) {
            // Fallback to harmonic product spectrum for low frequencies
            const hpsResult = this.harmonicProductSpectrum(inputData);
            if (hpsResult.frequency > 0 && hpsResult.frequency < this.veryLowFreqThreshold) {
                finalFrequency = hpsResult.frequency;
                confidence = hpsResult.confidence;
            }
        }
        
        // Get MIDI note
        const midiNote = this.getClosestNote(finalFrequency);
        
        // Create candidate
        const candidate = { 
            frequency: finalFrequency, 
            confidence: confidence, 
            midiNote: midiNote 
        };
        
        // Calculate observation probabilities
        const observationProbs = this.calculateObservationProbs([candidate], spectral);
        
        return {
            frequency: finalFrequency,
            confidence: confidence,
            candidates: [candidate],
            observationProbs: observationProbs
        };
    }

    // Harmonic Product Spectrum for low frequency detection
    harmonicProductSpectrum(samples) {
        const fftSize = 8192; // Large FFT size for better low frequency resolution
        const paddedSamples = new Float32Array(fftSize);
        
        // Copy samples and apply window
        const windowedSamples = new Float32Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            // Hann window
            const window = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (samples.length - 1));
            windowedSamples[i] = samples[i] * window;
        }
        paddedSamples.set(windowedSamples);
        
        // Compute FFT (simplified DFT for demonstration - in production use Web Audio API or WASM FFT)
        const spectrum = this.computeFFTMagnitude(paddedSamples);
        
        // Harmonic Product Spectrum
        const numHarmonics = 5;
        const hps = new Float32Array(spectrum.length);
        
        // Initialize with original spectrum
        for (let i = 0; i < spectrum.length; i++) {
            hps[i] = spectrum[i];
        }
        
        // Multiply downsampled versions
        for (let h = 2; h <= numHarmonics; h++) {
            for (let i = 0; i < spectrum.length / h; i++) {
                hps[i] *= spectrum[i * h];
            }
        }
        
        // Find peak in HPS
        let maxIndex = 0;
        let maxValue = 0;
        const minBin = Math.floor(20 * fftSize / this.sampleRate); // Start from 20 Hz
        const maxBin = Math.floor(this.veryLowFreqThreshold * fftSize / this.sampleRate);
        
        for (let i = minBin; i < maxBin && i < hps.length / numHarmonics; i++) {
            if (hps[i] > maxValue) {
                maxValue = hps[i];
                maxIndex = i;
            }
        }
        
        // Convert bin to frequency
        const frequency = maxIndex * this.sampleRate / fftSize;
        
        // Calculate confidence based on peak prominence
        let confidence = 0;
        if (maxIndex > 0) {
            const neighbors = [];
            for (let i = Math.max(minBin, maxIndex - 2); i <= Math.min(maxBin, maxIndex + 2); i++) {
                if (i !== maxIndex) {
                    neighbors.push(hps[i]);
                }
            }
            const avgNeighbor = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
            confidence = Math.min(1, (maxValue - avgNeighbor) / maxValue);
        }
        
        return { frequency, confidence };
    }
    
    // Simplified FFT magnitude computation (for demonstration)
    computeFFTMagnitude(samples) {
        // In production, use Web Audio API's AnalyserNode or WASM-based FFT
        // This is a simplified version for the concept
        const n = samples.length;
        const magnitude = new Float32Array(n / 2);
        
        // Use AnalyserNode if available
        if (this.audioContext && typeof this.audioContext.createAnalyser === 'function') {
            const analyser = this.audioContext.createAnalyser();
            analyser.fftSize = n;
            const freqData = new Float32Array(analyser.frequencyBinCount);
            
            // Create a buffer source for analysis
            const buffer = this.audioContext.createBuffer(1, samples.length, this.sampleRate);
            buffer.copyToChannel(samples, 0);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(analyser);
            
            // Get frequency data
            analyser.getFloatFrequencyData(freqData);
            
            // Convert from dB to linear magnitude
            for (let i = 0; i < freqData.length; i++) {
                magnitude[i] = Math.pow(10, freqData[i] / 20);
            }
        } else {
            // Fallback: simple DFT (slow but works)
            for (let k = 0; k < n / 2; k++) {
                let real = 0;
                let imag = 0;
                for (let t = 0; t < n; t++) {
                    const angle = -2 * Math.PI * k * t / n;
                    real += samples[t] * Math.cos(angle);
                    imag += samples[t] * Math.sin(angle);
                }
                magnitude[k] = Math.sqrt(real * real + imag * imag);
            }
        }
        
        return magnitude;
    }

    // PYINの信頼度計算（入力信号とその周波数から信頼度を計算）
    calculatePYINConfidence(samples, frequency) {
        if (frequency <= 0) return 0;
        
        // 周期性の検証によって信頼度を推定
        const period = Math.floor(this.sampleRate / frequency);
        if (period <= 0 || period >= samples.length / 2) return 0;
        
        // 自己相関による周期性の検証
        let sumCoefficient = 0;
        let sumEnergy = 0;
        const maxLag = Math.min(period * 2, samples.length / 2);
        
        for (let i = 0; i < maxLag; i++) {
            sumCoefficient += Math.abs(samples[i] * samples[i + period]);
            sumEnergy += samples[i] * samples[i];
        }
        
        // 周期性の強さを0～1の値として返す
        return sumEnergy > 0 ? Math.min(1, sumCoefficient / sumEnergy) : 0;
    }

    handleNoteDetection(detectedNote) {
        //console.log('[iOS Debug] handleNoteDetection called with note:', detectedNote, 'lastDetectedNote:', this.lastDetectedNote);
        if (detectedNote !== this.lastDetectedNote) {
            if (this.lastDetectedNote !== -1) {
                //console.log('[iOS Debug] Calling onNoteOff for note:', this.lastDetectedNote);
                this.onNoteOff?.(this.lastDetectedNote);
            }

            if (detectedNote !== -1) {
               // console.log('[iOS Debug] Calling onNoteOn for note:', detectedNote);
                this.onNoteOn?.(detectedNote);
               // console.log(`Note Down: ${detectedNote}`);
            }

            this.lastDetectedNote = detectedNote;
        }
    }
}

// 新しいHMMプロセッサクラスの追加
class HMMProcessor {
    constructor(minNote = 21, maxNote = 108) {
        this.minNote = minNote;
        this.maxNote = maxNote;
        this.numStates = maxNote - minNote + 1;
        this.transitionProb = this.calculateTransitionProbabilities();
        this.currentStateProbs = new Array(this.numStates).fill(1 / this.numStates);
    }

    // 状態遷移確率の計算（音楽的な期待に基づく）
    calculateTransitionProbabilities() {
        const probMatrix = Array(this.numStates).fill().map(() => 
            Array(this.numStates).fill(0)
        );

        const sameNoteProb = 0.6;
        const stepProb = 0.3;
        const largeJumpProb = 0.1;

        for (let i = 0; i < this.numStates; i++) {
            // 同一音維持
            probMatrix[i][i] = sameNoteProb;
            
            // 半音～2全音程度の移動
            for (let j = Math.max(0, i-4); j <= Math.min(this.numStates-1, i+4); j++) {
                if (j !== i) {
                    probMatrix[i][j] = stepProb / 8;
                }
            }
            
            // 大きな跳躍
            const remainingProb = 1 - (sameNoteProb + stepProb);
            const largeJumpNotes = this.numStates - 9;
            for (let j = 0; j < this.numStates; j++) {
                if (Math.abs(i - j) > 4) {
                    probMatrix[i][j] += remainingProb / largeJumpNotes;
                }
            }
        }

        return probMatrix;
    }

    // 観測確率の更新
    update(observations) {
        // 前向きアルゴリズムによる状態確率の更新
        const newProbs = new Array(this.numStates).fill(0);
        
        for (let j = 0; j < this.numStates; j++) {
            let sum = 0;
            for (let i = 0; i < this.numStates; i++) {
                sum += this.currentStateProbs[i] * this.transitionProb[i][j];
            }
            // 観測確率を乗算
            newProbs[j] = sum * observations[j];
        }
        
        // 正規化
        const total = newProbs.reduce((a, b) => a + b, 0);
        this.currentStateProbs = newProbs.map(p => p / total);
    }

    // 最尤状態の取得
    getMostProbableNote() {
        let maxProb = -Infinity;
        let bestNote = -1;
        
        for (let i = 0; i < this.numStates; i++) {
            if (this.currentStateProbs[i] > maxProb) {
                maxProb = this.currentStateProbs[i];
                bestNote = this.minNote + i;
            }
        }
        
        return bestNote;
    }
}

export default AudioController;