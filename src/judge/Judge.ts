/**
 * 判定システムクラス
 */

export type JudgeResult = 'perfect' | 'great' | 'good' | 'miss' | false;

export interface JudgeConfig {
  perfectWindow: number;  // ms
  greatWindow: number;    // ms
  goodWindow: number;     // ms
  maxWindow: number;      // ms (300ms as per document)
}

export class Judge {
  private config: JudgeConfig;
  private hitWindowActive: boolean = false;
  private inputAccepted: boolean = false;
  private currentBar: number = 0;
  private currentBeat: number = 0;
  
  constructor(config?: Partial<JudgeConfig>) {
    this.config = {
      perfectWindow: 50,
      greatWindow: 100,
      goodWindow: 200,
      maxWindow: 300,
      ...config
    };
  }
  
  /**
   * ループ時のリセット処理
   */
  reset(): void {
    this.hitWindowActive = false;
    this.inputAccepted = false;
    this.currentBar = 0;
    this.currentBeat = 0;
  }
  
  /**
   * 現在位置を更新
   */
  updatePosition(bar: number, beat: number): void {
    // 新しい拍に入った場合、判定ウィンドウをリセット
    if (bar !== this.currentBar || beat !== this.currentBeat) {
      this.hitWindowActive = false;
      this.inputAccepted = false;
    }
    this.currentBar = bar;
    this.currentBeat = beat;
  }
  
  /**
   * ノーツの判定
   * @param noteTime ノーツの正確なタイミング（ms）
   * @param inputTime 入力タイミング（ms）
   * @returns 判定結果
   */
  judge(noteTime: number, inputTime: number): JudgeResult {
    const offsetMs = inputTime - noteTime;
    const absOffset = Math.abs(offsetMs);
    
    // 判定ウィンドウ外の場合は早期リターン（バッファを貯めない）
    const inWindow = absOffset <= this.config.maxWindow;
    if (!inWindow) return false;
    
    // 既に入力を受け付けている場合
    if (this.inputAccepted) {
      return false;
    }
    
    // 判定実行
    let result: JudgeResult;
    if (absOffset <= this.config.perfectWindow) {
      result = 'perfect';
    } else if (absOffset <= this.config.greatWindow) {
      result = 'great';
    } else if (absOffset <= this.config.goodWindow) {
      result = 'good';
    } else {
      result = 'miss';
    }
    
    // 成功判定の場合、次の入力を受け付けないようにする
    if (result !== 'miss') {
      this.inputAccepted = true;
      this.hitWindowActive = true;
    }
    
    return result;
  }
  
  /**
   * ヒット判定がアクティブかどうか
   */
  isHitWindowActive(): boolean {
    return this.hitWindowActive;
  }
  
  /**
   * 入力が既に受け付けられているか
   */
  isInputAccepted(): boolean {
    return this.inputAccepted;
  }
}