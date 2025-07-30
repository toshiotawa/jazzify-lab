export interface SyncStatus {
  inSync: boolean;
  drift: number; // ズレの量（ms）
  correction?: number; // 補正量（ms）
}

export class SyncMonitor {
  private syncCheckInterval = 1000; // 1秒ごとにチェック
  private maxDrift = 50; // 最大許容ズレ（ms）
  private lastCheckTime = 0;
  private gameStartTime: number;
  private musicStartTime: number;
  
  constructor(gameStartTime: number, musicStartTime: number) {
    this.gameStartTime = gameStartTime;
    this.musicStartTime = musicStartTime;
  }
  
  /**
   * 音楽とゲームの同期をチェック
   */
  checkSync(
    audioCurrentTime: number,
    gameCurrentTime: number,
    bpm: number
  ): SyncStatus {
    // 音楽の経過時間（ms）
    const musicElapsedMs = audioCurrentTime * 1000;
    
    // ゲームの経過時間（ms）
    const gameElapsedMs = gameCurrentTime - this.gameStartTime;
    
    // ズレを計算
    const drift = Math.abs(musicElapsedMs - gameElapsedMs);
    
    if (drift > this.maxDrift) {
      // 補正が必要
      const correction = musicElapsedMs - gameElapsedMs;
      
      return {
        inSync: false,
        drift,
        correction
      };
    }
    
    return {
      inSync: true,
      drift
    };
  }
  
  /**
   * 自動補正を適用
   */
  autoCorrect(currentOffset: number, correction: number, smoothFactor = 0.1): number {
    // 徐々に補正を適用（急激な変化を避ける）
    return currentOffset + (correction * smoothFactor);
  }
  
  /**
   * 同期チェックのタイミングかどうか
   */
  shouldCheckSync(currentTime: number): boolean {
    if (currentTime - this.lastCheckTime >= this.syncCheckInterval) {
      this.lastCheckTime = currentTime;
      return true;
    }
    return false;
  }
  
  /**
   * デバッグ情報を取得
   */
  getDebugInfo(audioTime: number, gameTime: number): {
    musicTime: number;
    gameTime: number;
    drift: number;
    status: string;
  } {
    const musicElapsedMs = audioTime * 1000;
    const gameElapsedMs = gameTime - this.gameStartTime;
    const drift = Math.abs(musicElapsedMs - gameElapsedMs);
    
    return {
      musicTime: musicElapsedMs,
      gameTime: gameElapsedMs,
      drift,
      status: drift <= this.maxDrift ? 'SYNC' : 'DRIFT'
    };
  }
}