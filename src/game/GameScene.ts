/**
 * ゲームシーンクラス
 * BGMループイベントの処理と全サブシステムの管理
 */

import * as PIXI from 'pixi.js';
import { BGMManager } from '../utils/BGMManager';
import { NoteStore } from '../stores/NoteStore';
import { Judge } from '../judge/Judge';
import { EnemyView } from '../view/EnemyView';
import { NoteLayer } from '../view/NoteLayer';

export interface GameSettings {
  carryOverSp?: boolean;  // SPゲージをループ時に引き継ぐか
}

export interface Player {
  sp: number;
  maxSp: number;
}

export interface Enemy {
  hp: number;
  maxHp: number;
  attackCoolDown: number;
  resetLoopState: () => void;
}

export interface ScoreData {
  notes: any[];
  progression?: any[];
  progressionData?: any[];
}

export class GameScene {
  private app: PIXI.Application;
  private bgm: BGMManager;
  private noteStore: NoteStore;
  private judge: Judge;
  private enemyView: EnemyView;
  private noteLayer: NoteLayer;
  private player: Player;
  private enemy: Enemy;
  private settings: GameSettings;
  private systems: Array<{ resetForLoop: () => void }> = [];
  
  constructor(app: PIXI.Application, bgm: BGMManager, settings: GameSettings = {}) {
    this.app = app;
    this.bgm = bgm;
    this.settings = settings;
    
    // プレイヤー初期化
    this.player = {
      sp: 0,
      maxSp: 100
    };
    
    // 敵初期化
    this.enemy = {
      hp: 100,
      maxHp: 100,
      attackCoolDown: 0,
      resetLoopState: () => {
        this.enemy.attackCoolDown = 0;
      }
    };
    
    // サブシステム初期化
    this.noteStore = new NoteStore();
    this.judge = new Judge();
    this.enemyView = new EnemyView();
    this.noteLayer = new NoteLayer(app);
    
    // システムリストに登録
    this.systems = [
      { resetForLoop: () => this.judge.reset() },
      { resetForLoop: () => this.enemy.resetLoopState() },
      { resetForLoop: () => this.enemyView.resetLoopState() }
    ];
    
    // BGMループイベントのリスナー設定
    this.setupLoopHandler();
    
    // シーンに追加
    this.app.stage.addChild(this.noteLayer);
    this.app.stage.addChild(this.enemyView);
  }
  
  /**
   * BGMループイベントハンドラーの設定
   */
  private setupLoopHandler(): void {
    this.bgm.on('loop', () => {
      console.log('🔄 GameScene: BGM Loop detected, resetting systems...');
      
      // 全サブシステムのリセット
      this.systems.forEach(s => s.resetForLoop());
      
      // ノーツストアの再生成
      const scoreData = this.getCurrentScoreData();
      this.noteStore.dispose();
      this.noteStore.init(scoreData);
      
      // ノーツレイヤーのクリア
      this.noteLayer.clear();
      
      // SPゲージの処理
      if (!this.settings.carryOverSp) {
        this.player.sp = 0;
      }
      
      // フレーム欠け防止のため、即座に更新を呼ぶ
      this.app.ticker.update();
    });
  }
  
  /**
   * 現在の譜面データを取得（仮実装）
   */
  private getCurrentScoreData(): ScoreData {
    // 実際の実装では、現在のステージやレベルに応じた譜面データを返す
    return {
      notes: [],
      progression: [],
      progressionData: []
    };
  }
  
  /**
   * 譜面データをロード
   */
  loadScoreData(scoreData: ScoreData): void {
    this.noteStore.dispose();
    this.noteStore.init(scoreData);
  }
  
  /**
   * フレーム更新
   */
  update(deltaTime: number): void {
    // BGMの更新
    this.bgm.update(deltaTime);
    
    // 現在位置の取得
    const { bar, beat } = this.bgm.getTimePos();
    
    // 判定システムの位置更新
    this.judge.updatePosition(bar, beat);
    
    // ノーツレイヤーの更新
    this.noteLayer.update(deltaTime);
    
    // 敵の状態更新
    this.enemyView.updateState({
      hp: this.enemy.hp,
      maxHp: this.enemy.maxHp,
      isAngry: this.enemy.attackCoolDown > 0
    });
  }
  
  /**
   * 再挑戦時の処理（Factory パターンで全Store/View再生成）
   */
  retry(scoreData: ScoreData): void {
    console.log('🔄 GameScene: Retry - recreating all stores and views');
    
    // 既存のリソースを破棄
    this.dispose();
    
    // 新しいインスタンスを生成
    this.noteStore = new NoteStore();
    this.judge = new Judge();
    this.noteLayer = new NoteLayer(this.app);
    this.enemyView = new EnemyView();
    
    // シーンに再追加
    this.app.stage.addChild(this.noteLayer);
    this.app.stage.addChild(this.enemyView);
    
    // データをロード
    this.loadScoreData(scoreData);
    
    // プレイヤー状態をリセット
    this.player.sp = 0;
    this.enemy.hp = this.enemy.maxHp;
    this.enemy.attackCoolDown = 0;
  }
  
  /**
   * シーンの破棄
   */
  dispose(): void {
    // BGMイベントリスナーの削除
    this.bgm.removeAllListeners('loop');
    
    // 各コンポーネントの破棄
    this.noteStore.dispose();
    this.noteLayer.dispose();
    this.enemyView.dispose();
    
    // ステージからの削除
    this.app.stage.removeChildren();
  }
}