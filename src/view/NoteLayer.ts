/**
 * ノーツ表示レイヤークラス
 */

import * as PIXI from 'pixi.js';
import { Note } from '../stores/NoteStore';

export class NoteLayer extends PIXI.Container {
  private noteSprites: Map<string, PIXI.Sprite> = new Map();
  private app: PIXI.Application;
  
  constructor(app: PIXI.Application) {
    super();
    this.app = app;
  }
  
  /**
   * ノーツを追加
   */
  addNote(note: Note, x: number, y: number): void {
    const sprite = new PIXI.Sprite();
    
    // ノーツタイプに応じた見た目を設定
    switch (note.type) {
      case 'don':
        sprite.tint = 0xff0000; // 赤
        break;
      case 'kat':
        sprite.tint = 0x0000ff; // 青
        break;
      case 'long':
        sprite.tint = 0xffff00; // 黄
        break;
    }
    
    sprite.position.set(x, y);
    sprite.anchor.set(0.5);
    
    // ユニークなキーを生成
    const key = `${note.bar}-${note.beat}-${note.type}`;
    this.noteSprites.set(key, sprite);
    this.addChild(sprite);
  }
  
  /**
   * ノーツを削除
   */
  removeNote(note: Note): void {
    const key = `${note.bar}-${note.beat}-${note.type}`;
    const sprite = this.noteSprites.get(key);
    
    if (sprite) {
      this.removeChild(sprite);
      sprite.destroy();
      this.noteSprites.delete(key);
    }
  }
  
  /**
   * 指定位置のノーツを取得
   */
  getNoteAt(bar: number, beat: number): PIXI.Sprite | undefined {
    // 全タイプをチェック
    const types = ['don', 'kat', 'long'];
    for (const type of types) {
      const key = `${bar}-${beat}-${type}`;
      const sprite = this.noteSprites.get(key);
      if (sprite) return sprite;
    }
    return undefined;
  }
  
  /**
   * 全ノーツをクリア
   */
  clear(): void {
    this.noteSprites.forEach(sprite => {
      sprite.destroy();
    });
    this.noteSprites.clear();
    this.removeChildren();
  }
  
  /**
   * Container破棄を徹底（メモリリーク対策）
   */
  dispose(): void {
    // 全ての子要素を削除してから破棄
    this.removeChildren().forEach(c => c.destroy());
    this.noteSprites.clear();
    this.destroy();
  }
  
  /**
   * フレーム更新
   */
  update(deltaTime: number): void {
    // ノーツの移動などのアニメーション処理
    this.noteSprites.forEach((sprite, key) => {
      // 左にスクロール（例）
      sprite.x -= 200 * deltaTime; // 200 pixels per second
      
      // 画面外に出たら削除
      if (sprite.x < -50) {
        this.removeChild(sprite);
        sprite.destroy();
        this.noteSprites.delete(key);
      }
    });
  }
}