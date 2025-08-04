/**
 * 敵キャラクター表示クラス
 */

import * as PIXI from 'pixi.js';

export interface EnemyState {
  hp: number;
  maxHp: number;
  attackCoolDown?: number;
  isAngry?: boolean;
}

export class EnemyView extends PIXI.Container {
  private sprite: PIXI.Sprite;
  private hpBar: PIXI.Graphics;
  private rageIcon: PIXI.Sprite | null = null;
  private flashTween: any = null;
  
  constructor() {
    super();
    
    // 敵スプライトの初期化
    this.sprite = new PIXI.Sprite();
    this.addChild(this.sprite);
    
    // HPバーの初期化
    this.hpBar = new PIXI.Graphics();
    this.hpBar.position.set(0, -50);
    this.addChild(this.hpBar);
  }
  
  /**
   * 敵の状態を更新
   */
  updateState(state: EnemyState): void {
    // HPバーの更新
    this.updateHpBar(state.hp, state.maxHp);
    
    // 怒り状態の更新
    if (state.isAngry && !this.rageIcon) {
      this.showRageIcon();
    } else if (!state.isAngry && this.rageIcon) {
      this.hideRageIcon();
    }
  }
  
  /**
   * HPバーを更新
   */
  private updateHpBar(hp: number, maxHp: number): void {
    this.hpBar.clear();
    
    // 背景
    this.hpBar.beginFill(0x333333);
    this.hpBar.drawRect(0, 0, 100, 10);
    this.hpBar.endFill();
    
    // HP
    const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
    const color = hpRatio > 0.5 ? 0x00ff00 : hpRatio > 0.25 ? 0xffff00 : 0xff0000;
    this.hpBar.beginFill(color);
    this.hpBar.drawRect(0, 0, 100 * hpRatio, 10);
    this.hpBar.endFill();
  }
  
  /**
   * ダメージ表示（フラッシュ + 怒りアイコン）
   * 条件分岐を削除し、常にshowRageIconを呼ぶ
   */
  showDamage(): void {
    this.flash();
    this.showRageIcon();  // ← 条件分岐削除
  }
  
  /**
   * フラッシュエフェクト
   */
  private flash(): void {
    // 既存のフラッシュをキャンセル
    if (this.flashTween) {
      this.flashTween.kill();
    }
    
    // 白くフラッシュ
    this.sprite.tint = 0xffffff;
    
    // 元の色に戻す（簡易版）
    setTimeout(() => {
      this.sprite.tint = 0xffffff;
    }, 100);
  }
  
  /**
   * 怒りアイコンを表示
   */
  private showRageIcon(): void {
    if (this.rageIcon) return;
    
    // 怒りアイコンを作成（仮実装）
    this.rageIcon = new PIXI.Sprite();
    this.rageIcon.position.set(50, -30);
    
    // アイコンの設定（テクスチャは後で設定）
    // this.rageIcon.texture = PIXI.Texture.from('rage_icon');
    
    this.addChild(this.rageIcon);
    
    // アニメーション（オプション）
    this.animateRageIcon();
  }
  
  /**
   * 怒りアイコンを非表示
   */
  private hideRageIcon(): void {
    if (!this.rageIcon) return;
    
    this.removeChild(this.rageIcon);
    this.rageIcon.destroy();
    this.rageIcon = null;
  }
  
  /**
   * 怒りアイコンのアニメーション
   */
  private animateRageIcon(): void {
    if (!this.rageIcon) return;
    
    // 簡単なパルスアニメーション
    const baseScale = 1;
    const pulseScale = 1.2;
    let growing = true;
    
    const animate = () => {
      if (!this.rageIcon) return;
      
      if (growing) {
        this.rageIcon.scale.x += 0.01;
        this.rageIcon.scale.y += 0.01;
        if (this.rageIcon.scale.x >= pulseScale) {
          growing = false;
        }
      } else {
        this.rageIcon.scale.x -= 0.01;
        this.rageIcon.scale.y -= 0.01;
        if (this.rageIcon.scale.x <= baseScale) {
          growing = true;
        }
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * ループ時のリセット
   */
  resetLoopState(): void {
    // 怒りアイコンを消す
    this.hideRageIcon();
    
    // その他の状態をリセット
    this.sprite.tint = 0xffffff;
  }
  
  /**
   * リソースの破棄
   */
  dispose(): void {
    this.hideRageIcon();
    this.hpBar.destroy();
    this.sprite.destroy();
    this.destroy();
  }
}