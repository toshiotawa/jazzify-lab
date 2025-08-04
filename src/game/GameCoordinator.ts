/**
 * ゲームコーディネータークラス
 * 全Store/Viewのファクトリーパターンによる管理
 */

import * as PIXI from 'pixi.js';
import { BGMManager } from '../utils/BGMManager';
import { GameScene, ScoreData } from './GameScene';

export interface StageConfig {
  id: string;
  name: string;
  bpm: number;
  timeSignature: number;
  measureCount: number;
  countIn: number;
  scoreData: ScoreData;
  bgmUrl: string;
}

export class GameCoordinator {
  private app: PIXI.Application;
  private bgmManager: BGMManager;
  private currentScene: GameScene | null = null;
  private currentStage: StageConfig | null = null;
  
  constructor(app: PIXI.Application) {
    this.app = app;
    this.bgmManager = new BGMManager();
  }
  
  /**
   * ステージを開始
   */
  startStage(stage: StageConfig): void {
    console.log(`🎮 Starting stage: ${stage.name}`);
    
    // 既存のシーンをクリーンアップ
    this.cleanup();
    
    // BGMを開始
    this.bgmManager.play(
      stage.bgmUrl,
      stage.bpm,
      stage.timeSignature,
      stage.measureCount,
      stage.countIn
    );
    
    // 新しいシーンを作成（ファクトリーパターン）
    this.currentScene = new GameScene(this.app, this.bgmManager, {
      carryOverSp: false // デフォルト設定
    });
    
    // 譜面データをロード
    this.currentScene.loadScoreData(stage.scoreData);
    
    // 現在のステージを保存
    this.currentStage = stage;
  }
  
  /**
   * 再挑戦（Retry）
   */
  retry(): void {
    if (!this.currentStage) {
      console.error('No current stage to retry');
      return;
    }
    
    console.log('🔄 Retry stage');
    
    // BGMを停止
    this.bgmManager.stop();
    
    // シーンを完全に破棄して再作成
    if (this.currentScene) {
      this.currentScene.dispose();
    }
    
    // 新しいシーンとストアを作成
    this.startStage(this.currentStage);
  }
  
  /**
   * ステージセレクトに戻る
   */
  returnToStageSelect(): void {
    console.log('📋 Returning to stage select');
    
    // 全てをクリーンアップ
    this.cleanup();
    
    // ステージセレクト画面を表示（実装は別途）
    this.showStageSelect();
  }
  
  /**
   * フレーム更新
   */
  update(deltaTime: number): void {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }
  
  /**
   * クリーンアップ処理
   */
  private cleanup(): void {
    // BGMを停止
    this.bgmManager.stop();
    
    // シーンを破棄
    if (this.currentScene) {
      this.currentScene.dispose();
      this.currentScene = null;
    }
    
    // ステージをクリア
    this.currentStage = null;
  }
  
  /**
   * ステージセレクト画面を表示（仮実装）
   */
  private showStageSelect(): void {
    // ステージセレクト画面の表示処理
    // 実際の実装では、UIを表示してユーザーの選択を待つ
  }
  
  /**
   * BGMManagerを取得
   */
  getBGMManager(): BGMManager {
    return this.bgmManager;
  }
  
  /**
   * 現在のシーンを取得
   */
  getCurrentScene(): GameScene | null {
    return this.currentScene;
  }
}