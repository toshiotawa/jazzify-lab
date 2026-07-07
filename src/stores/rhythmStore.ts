import { create } from 'zustand';

export interface RhythmTiming {
  measure: number;
  beat: number;
  chord: string;
}

interface RhythmState {
  // 基本設定
  isPlaying: boolean;
  startTime: number | null;
  currentTime: number;
  bpm: number;
  timeSignature: number;
  measureCount: number;
  loopMeasures: number;
  
  // 音楽同期
  audioContext: AudioContext | null;
  audioBuffer: AudioBuffer | null;
  audioSource: AudioBufferSourceNode | null;
  
  // 現在の位置
  currentMeasure: number;
  currentBeat: number;
  
  // 判定関連
  judgmentWindowMs: number;
  nextJudgmentTime: number | null;
  currentChord: string | null;
  
  // パターン関連
  rhythmPattern: 'random' | 'progression';
  progressionData: RhythmTiming[] | null;
  currentProgressionIndex: number;
  
  // アクション
  initializeAudio: (audioContext: AudioContext) => Promise<void>;
  startGame: (stageData: any) => void;
  stopGame: () => void;
  updateTime: (deltaTime: number) => void;
  getCurrentPosition: () => { measure: number; beat: number; progress: number };
  checkJudgment: (inputTime: number) => { isValid: boolean; timing: 'perfect' | 'good' | 'miss' };
  getNextChord: () => string | null;
  setProgressionData: (data: RhythmTiming[]) => void;
}

export const useRhythmStore = create<RhythmState>((set, get) => ({
  // 初期状態
  isPlaying: false,
  startTime: null,
  currentTime: 0,
  bpm: 120,
  timeSignature: 4,
  measureCount: 8,
  loopMeasures: 8,
  
  audioContext: null,
  audioBuffer: null,
  audioSource: null,
  
  currentMeasure: 1,
  currentBeat: 1,
  
  judgmentWindowMs: 200,
  nextJudgmentTime: null,
  currentChord: null,
  
  rhythmPattern: 'random',
  progressionData: null,
  currentProgressionIndex: 0,
  
  initializeAudio: async (audioContext: AudioContext) => {
    set({ audioContext });
  },
  
  startGame: (stageData: any) => {
    const state = get();
    const startTime = performance.now();
    
    // ステージデータから設定を取得
    const bpm = stageData.bpm || 120;
    const timeSignature = stageData.time_signature || 4;
    const measureCount = stageData.measure_count || 8;
    const loopMeasures = stageData.loop_measures || 8;
    const rhythmPattern = stageData.rhythm_pattern || 'random';
    
    // 音楽を再生
    if (state.audioContext && stageData.mp3_url) {
      // MP3をロードして再生する処理（別途実装）
      loadAndPlayAudio(state.audioContext, stageData.mp3_url, get, set);
    }
    
    set({
      isPlaying: true,
      startTime,
      currentTime: 0,
      bpm,
      timeSignature,
      measureCount,
      loopMeasures,
      rhythmPattern,
      currentMeasure: 1,
      currentBeat: 1,
      currentProgressionIndex: 0,
    });
    
    // 最初のコードを設定
    if (rhythmPattern === 'random') {
      set({ currentChord: getRandomChord(stageData.allowed_chords) });
    } else if (rhythmPattern === 'progression' && state.progressionData) {
      set({ currentChord: state.progressionData[0]?.chord || null });
    }
  },
  
  stopGame: () => {
    const state = get();
    
    // 音楽を停止
    if (state.audioSource) {
      state.audioSource.stop();
      state.audioSource.disconnect();
    }
    
    set({
      isPlaying: false,
      startTime: null,
      currentTime: 0,
      audioSource: null,
      currentMeasure: 1,
      currentBeat: 1,
      currentChord: null,
      nextJudgmentTime: null,
    });
  },
  
  updateTime: (deltaTime: number) => {
    const state = get();
    if (!state.isPlaying || !state.startTime) return;
    
    const currentTime = state.currentTime + deltaTime;
    const beatDuration = 60000 / state.bpm; // ミリ秒
    const measureDuration = beatDuration * state.timeSignature;
    
    // 現在の小節と拍を計算
    let totalBeats = Math.floor(currentTime / beatDuration);
    let currentMeasure = Math.floor(totalBeats / state.timeSignature) + 1;
    let currentBeat = (totalBeats % state.timeSignature) + 1;
    
    // ループ処理（2小節目から開始）
    if (currentMeasure > state.loopMeasures) {
      const loopTime = (state.loopMeasures - 1) * measureDuration;
      const adjustedTime = currentTime - measureDuration; // 1小節目を除く
      const loopedTime = (adjustedTime % loopTime) + measureDuration;
      
      totalBeats = Math.floor(loopedTime / beatDuration);
      currentMeasure = Math.floor(totalBeats / state.timeSignature) + 1;
      currentBeat = (totalBeats % state.timeSignature) + 1;
    }
    
    // 拍が変わったら次のコードを設定
    if (currentBeat !== state.currentBeat || currentMeasure !== state.currentMeasure) {
      if (state.rhythmPattern === 'random') {
        // ランダムパターン: 各小節の1拍目で新しいコード
        if (currentBeat === 1) {
          set({ currentChord: getRandomChord(get().audioBuffer ? [] : []) }); // allowed_chordsは別途取得
        }
      } else if (state.rhythmPattern === 'progression' && state.progressionData) {
        // プログレッションパターン: データに基づいてコードを設定
        const nextTiming = findNextChordTiming(state.progressionData, currentMeasure, currentBeat);
        if (nextTiming) {
          set({ 
            currentChord: nextTiming.chord,
            currentProgressionIndex: (state.currentProgressionIndex + 1) % state.progressionData.length
          });
        }
      }
      
      // 次の判定タイミングを設定
      const nextJudgmentTime = currentTime + beatDuration * 0.8; // 次の拍の80%の位置
      set({ nextJudgmentTime });
    }
    
    set({ currentTime, currentMeasure, currentBeat });
  },
  
  getCurrentPosition: () => {
    const state = get();
    const beatDuration = 60000 / state.bpm;
    const beatProgress = (state.currentTime % beatDuration) / beatDuration;
    
    return {
      measure: state.currentMeasure,
      beat: state.currentBeat,
      progress: beatProgress,
    };
  },
  
  checkJudgment: (inputTime: number) => {
    const state = get();
    if (!state.nextJudgmentTime) {
      return { isValid: false, timing: 'miss' as const };
    }
    
    const timeDiff = Math.abs(inputTime - state.nextJudgmentTime);
    
    if (timeDiff <= 50) {
      return { isValid: true, timing: 'perfect' as const };
    } else if (timeDiff <= state.judgmentWindowMs) {
      return { isValid: true, timing: 'good' as const };
    } else {
      return { isValid: false, timing: 'miss' as const };
    }
  },
  
  getNextChord: () => {
    return get().currentChord;
  },
  
  setProgressionData: (data: RhythmTiming[]) => {
    set({ progressionData: data });
  },
}));

// ヘルパー関数
function getRandomChord(allowedChords: string[]): string {
  if (!allowedChords || allowedChords.length === 0) {
    return 'C'; // デフォルト
  }
  return allowedChords[Math.floor(Math.random() * allowedChords.length)];
}

function findNextChordTiming(
  progressionData: RhythmTiming[],
  currentMeasure: number,
  currentBeat: number
): RhythmTiming | null {
  // 現在の位置に最も近いコードを探す
  for (const timing of progressionData) {
    if (timing.measure === currentMeasure && timing.beat >= currentBeat) {
      return timing;
    }
  }
  return null;
}

async function loadAndPlayAudio(
  audioContext: AudioContext,
  mp3Url: string,
  get: () => RhythmState,
  set: (state: Partial<RhythmState>) => void
) {
  try {
    const response = await fetch(mp3Url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.loop = true;
    
    // 2小節目から開始するようにループポイントを設定
    const beatDuration = 60 / get().bpm;
    const measureDuration = beatDuration * get().timeSignature;
    source.loopStart = measureDuration; // 1小節目をスキップ
    source.loopEnd = audioBuffer.duration;
    
    source.start(0, 0); // 最初から再生（1小節目のカウントも含む）
    
    set({ audioBuffer, audioSource: source });
  } catch (error) {
    console.error('Failed to load audio:', error);
  }
}