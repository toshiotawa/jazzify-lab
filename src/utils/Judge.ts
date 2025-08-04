/**
 * Judge - 判定ロジック
 */
export interface JudgeResult {
  isHit: boolean;
  timing: 'early' | 'perfect' | 'late' | 'miss';
  offsetMs: number;
}

export class Judge {
  private hitWindowActive: boolean = false;
  private inputAccepted: boolean = false;
  private currentBar: number = 1;
  private currentBeat: number = 1;
  
  constructor() {
    this.reset();
  }
  
  /**
   * タイミング判定
   * @param offsetMs タイミングのズレ（ミリ秒）
   * @param windowMs 判定ウィンドウ（ミリ秒）
   */
  judge(offsetMs: number, windowMs: number = 300): JudgeResult {
    const inWindow = Math.abs(offsetMs) <= windowMs;
    
    if (!inWindow) {
      return {
        isHit: false,
        timing: 'miss',
        offsetMs
      };
    }
    
    // 判定ウィンドウ内
    let timing: 'early' | 'perfect' | 'late';
    if (Math.abs(offsetMs) <= 50) {
      timing = 'perfect';
    } else if (offsetMs < 0) {
      timing = 'early';
    } else {
      timing = 'late';
    }
    
    return {
      isHit: true,
      timing,
      offsetMs
    };
  }
  
  /**
   * 状態をリセット
   */
  reset(): void {
    this.hitWindowActive = false;
    this.inputAccepted = false;
    this.currentBar = 1;
    this.currentBeat = 1;
  }
  
  /**
   * ループ時のリセット
   */
  resetForLoop(): void {
    this.reset();
  }
  
  /**
   * 現在の小節・拍を更新
   */
  updatePosition(bar: number, beat: number): void {
    this.currentBar = bar;
    this.currentBeat = beat;
  }
  
  /**
   * 入力を受け付ける
   */
  acceptInput(): void {
    this.inputAccepted = true;
  }
  
  /**
   * 判定ウィンドウを有効化
   */
  activateWindow(): void {
    this.hitWindowActive = true;
  }
  
  /**
   * 判定ウィンドウを無効化
   */
  deactivateWindow(): void {
    this.hitWindowActive = false;
    this.inputAccepted = false;
  }
}