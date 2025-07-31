import { RhythmAudioController } from './audio';
import { 
  buildRandomGenerator, 
  buildProgressionPlayer, 
  RhythmQuestion, 
  RhythmFantasyStage,
  RandomPatternGenerator,
  ProgressionPatternPlayer 
} from './generator';
import { RhythmJudgeEngine, JudgeResult } from './judge';
import { useRhythmStore } from './store';
import * as Tone from 'tone';

export interface RhythmGameCallbacks {
  onAttackSuccess(monsterId: string, chord: string, result: JudgeResult): void;
  onAttackFail(monsterId: string, chord: string, result: JudgeResult): void;
  onQuestionSpawn(question: RhythmQuestion): void;
  onAllEnemyDefeated(): void;
}

export class RhythmGameManager {
  private audio = new RhythmAudioController();
  private questions: RhythmQuestion[] = [];
  private currentQuestionIndex = 0;
  private tickerId = 0;
  private judgeEngine: RhythmJudgeEngine;
  private generator: RandomPatternGenerator | ProgressionPatternPlayer | null = null;
  private currentMeasure = 1;
  private lastSpawnedMeasure = 0;
  private spawnedQuestions = new Set<string>();
  
  constructor(
    private stage: RhythmFantasyStage,
    private callbacks: RhythmGameCallbacks
  ) {
    this.judgeEngine = new RhythmJudgeEngine(
      this.onJudgeSuccess.bind(this),
      this.onJudgeFail.bind(this)
    );
    
    // Initialize generator based on rhythm pattern
    if (stage.rhythm_pattern === 'progression' && stage.chord_progression_data) {
      this.generator = buildProgressionPlayer(stage);
    } else {
      this.generator = new RandomPatternGenerator(stage);
    }
  }
  
  async start(): Promise<void> {
    const bpm = this.stage.bpm || 120;
    const timeSig = this.stage.time_signature || 4;
    const loopMeasures = this.stage.loop_measures || 8;
    const measureLen = (60 / bpm) * timeSig;
    
    // Configure rhythm store
    useRhythmStore.getState().setConfig({
      bpm,
      timeSig,
      measureLen,
      loopMeasures
    });
    
    // Generate questions for the first loop
    this.generateQuestionsForLoop();
    
    // Start audio playback
    if (this.stage.mp3_url) {
      await this.audio.loadAndPlay(this.stage.mp3_url);
    }
    
    // Start update loop
    this.tick();
  }
  
  stop(): void {
    cancelAnimationFrame(this.tickerId);
    this.audio.stop();
    this.judgeEngine.reset();
  }
  
  private generateQuestionsForLoop(): void {
    this.questions = [];
    const loopMeasures = this.stage.loop_measures || 8;
    
    if (this.generator instanceof RandomPatternGenerator) {
      // Generate one question per measure (starting from measure 2)
      for (let m = 2; m <= loopMeasures; m++) {
        const question = this.generator.next(m);
        this.questions.push(question);
      }
    } else if (this.generator instanceof ProgressionPatternPlayer) {
      // Use all progression data
      let question = this.generator.next();
      while (question) {
        this.questions.push(question);
        question = this.generator.next();
      }
      this.generator.reset();
    }
  }
  
  private tick = (): void => {
    const state = useRhythmStore.getState();
    state.tick(Tone.now());
    
    if (state.playing) {
      const now = state.now;
      const measureLen = state.measureLen;
      
      // Calculate current measure
      this.currentMeasure = Math.floor(now / measureLen) + 1;
      
      // Check for question spawning (1 measure before the beat)
      for (const question of this.questions) {
        const spawnTime = question.absSec - measureLen;
        const spawnWindow = 0.05; // 50ms window
        
        if (Math.abs(now - spawnTime) < spawnWindow && 
            !this.hasSpawnedQuestion(question)) {
          this.spawnQuestion(question);
        }
      }
      
      // Update judge engine timing
      this.judgeEngine.checkTiming();
    }
    
    this.tickerId = requestAnimationFrame(this.tick);
  };
  
  private hasSpawnedQuestion(question: RhythmQuestion): boolean {
    return this.spawnedQuestions.has(question.id);
  }
  
  private spawnQuestion(question: RhythmQuestion): void {
    this.spawnedQuestions.add(question.id);
    this.judgeEngine.setCurrentQuestion(question);
    this.callbacks.onQuestionSpawn(question);
  }
  
  handleNoteOn(midiNote: number): void {
    this.judgeEngine.handleNoteOn(midiNote);
  }
  
  handleNoteOff(midiNote: number): void {
    this.judgeEngine.handleNoteOff(midiNote);
  }
  
  private onJudgeSuccess(question: RhythmQuestion, result: JudgeResult): void {
    // TODO: Map question to monster ID
    const monsterId = `monster_${question.measure}`;
    this.callbacks.onAttackSuccess(monsterId, question.chord, result);
  }
  
  private onJudgeFail(question: RhythmQuestion, result: JudgeResult): void {
    // TODO: Map question to monster ID
    const monsterId = `monster_${question.measure}`;
    this.callbacks.onAttackFail(monsterId, question.chord, result);
  }
  
  dispose(): void {
    this.stop();
    this.audio.dispose();
  }
}