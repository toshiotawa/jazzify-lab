/**
 * ゲームモジュールのエクスポート
 */

// Core components
export { BGMManager } from '../utils/BGMManager';
export type { TimePos } from '../utils/BGMManager';

// Stores
export { NoteStore } from '../stores/NoteStore';
export type { Note } from '../stores/NoteStore';

// Judge system
export { Judge } from '../judge/Judge';
export type { JudgeResult, JudgeConfig } from '../judge/Judge';

// Views
export { EnemyView } from '../view/EnemyView';
export type { EnemyState } from '../view/EnemyView';
export { NoteLayer } from '../view/NoteLayer';

// Game logic
export { GameScene } from './GameScene';
export type { GameSettings, Player, Enemy, ScoreData } from './GameScene';
export { NoteGenerator } from './NoteGenerator';
export type { ProgressionPattern, NoteGeneratorData } from './NoteGenerator';
export { GameCoordinator } from './GameCoordinator';
export type { StageConfig } from './GameCoordinator';