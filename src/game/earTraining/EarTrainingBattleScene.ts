import Phaser from 'phaser';
import type {
  EarTrainingBattleCallbacks,
  EarTrainingBattleEffectCommand,
  EarTrainingBattleSceneHandle,
  EarTrainingBattleSnapshot,
} from './types';
import { EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS } from '@/utils/constants';
import {
  clampBattleCharacterX,
  getBattleCharacterMinDistance,
  getBattleCharacterMotionRange,
  type BattleCharacterMotionRange,
} from './battleCharacterMotion';

const PIANO_OVERLAY_HEIGHT = 88;
const HUD_HEIGHT = 150;
const PHRASE_INTRO_FADE_MS = 2600;
const PHRASE_INTRO_EMPHASIS_FADE_MS = 3900;
const FLOOR_CLEARANCE_FROM_PIANO = 100;
const CHARACTER_DISPLAY_SIZE = 116;
const CHARACTER_SHADOW_WIDTH = 104;
const CHARACTER_SHADOW_HEIGHT = 22;
const PLAYER_QUOTE_PAD_X = 10;
const PLAYER_QUOTE_PAD_Y = 6;
/** 足元コンテナ直上のキャラ表示下端から吹き出しルートまでの余白（大きくすると画面上で吹き出しが上がる）。 */
const PLAYER_QUOTE_GAP_BELOW_SPRITE_PX = 12 + 18;
const PLAYER_QUOTE_CORNER_RADIUS = 8;
const PLAYER_QUOTE_TAIL_HEIGHT = 10;
const PLAYER_QUOTE_BG_ALPHA = 0.7;
const PLAYER_QUOTE_FONT_PX = 16;
const JAZZ_BACKDROP_EDGE_COLOR = 0x0e0705;
const JAZZ_GOLD_TRIM = 0xd58a2a;
const EFFECT_ASSET_PATH = '/ear-training/tutorial-earcopy-test/';
const FUKIDASHI_ASSET_KEY = 'ear-training-fukidashi';
const FUKIDASHI_ASSET_URL = `${EFFECT_ASSET_PATH}fukidashi.webp`;
const MAGIC_CIRCLE_ASSET_KEY = 'ear-training-effect-magic-circle';
const MAGIC_CIRCLE_ASSET_URL = '/data/27304123.webp';
const ENEMY_ATTACK_HAMMER_ASSET_KEY = 'ear-training-enemy-attack-hammer';
const ENEMY_ATTACK_HAMMER_ASSET_URL = '/hammer.svg';
const ENEMY_KNOCKBACK_AFTER_DAMAGE_DELAY_MS = 16;
const CORRECT_PLAYER_POSE_DURATION_MS = 300;
const SKILL_PLAYER_POSE_FRAME_MS = 80;
const AWESOME_MAGIC_CIRCLE_ALPHA = 0.68;
const MIN_SCENE_REBUILD_INTERVAL_MS = 50;
const AUTO_IDLE_MIN_MS = 1000;
const AUTO_IDLE_MAX_MS = 2500;
const RECOVER_IDLE_MIN_MS = 500;
const RECOVER_IDLE_MAX_MS = 1200;
const ACTION_RESUME_IDLE_MS = 900;

type BattleEffectSpriteName = 'cloud' | 'fireRing' | 'fireball' | 'lightning' | 'meteor' | 'snowflake';
type CharacterSide = 'player' | 'enemy';
type BattleCharacterMotionState = 'idle' | 'walk' | 'cast' | 'attack' | 'hit' | 'knockback' | 'recover' | 'dead';
type JazzStagePropName = 'doubleBass' | 'piano' | 'drumKit';
type PlayerAvatarPoseName =
  | 'correct3'
  | 'cast'
  | 'skill1'
  | 'skill2'
  | 'skill3'
  | 'skill4'
  | 'skill5'
  | 'skill6';

interface BattleEffectSpriteAsset {
  key: string;
  url: string;
}

interface JazzStagePropAsset extends BattleEffectSpriteAsset {
  alpha: number;
}

const BATTLE_EFFECT_SPRITE_ASSETS: Record<BattleEffectSpriteName, BattleEffectSpriteAsset> = {
  cloud: {
    key: 'ear-training-effect-cloud',
    url: `${EFFECT_ASSET_PATH}effect-cloud-transparent.webp`,
  },
  fireRing: {
    key: 'ear-training-effect-fire-ring',
    url: `${EFFECT_ASSET_PATH}effect-fire-ring-transparent.webp`,
  },
  fireball: {
    key: 'ear-training-effect-fireball',
    url: `${EFFECT_ASSET_PATH}effect-fireball-transparent.webp`,
  },
  lightning: {
    key: 'ear-training-effect-lightning',
    url: `${EFFECT_ASSET_PATH}effect-lightning-transparent.webp`,
  },
  meteor: {
    key: 'ear-training-effect-meteor',
    url: `${EFFECT_ASSET_PATH}effect-meteor-transparent.webp`,
  },
  snowflake: {
    key: 'ear-training-effect-snowflake',
    url: `${EFFECT_ASSET_PATH}effect-snowflake-transparent.webp`,
  },
};

const JAZZ_STAGE_PROP_ASSETS: Record<JazzStagePropName, JazzStagePropAsset> = {
  doubleBass: {
    key: 'ear-training-bg-double-bass',
    url: `${EFFECT_ASSET_PATH}bg-double-bass.webp`,
    alpha: 0.82,
  },
  piano: {
    key: 'ear-training-bg-upright-piano',
    url: `${EFFECT_ASSET_PATH}bg-upright-piano.webp`,
    alpha: 0.82,
  },
  drumKit: {
    key: 'ear-training-bg-drum-kit',
    url: `${EFFECT_ASSET_PATH}bg-drum-kit.webp`,
    alpha: 0.84,
  },
};

const PLAYER_AVATAR_POSE_ASSETS: Record<PlayerAvatarPoseName, BattleEffectSpriteAsset> = {
  correct3: {
    key: 'ear-training-player-pose-correct-3',
    url: '/data/correct3.webp',
  },
  cast: {
    key: 'ear-training-player-pose-cast',
    url: '/data/eishou.png',
  },
  skill1: {
    key: 'ear-training-player-pose-skill-1',
    url: '/data/Frame1.webp',
  },
  skill2: {
    key: 'ear-training-player-pose-skill-2',
    url: '/data/Frame2.webp',
  },
  skill3: {
    key: 'ear-training-player-pose-skill-3',
    url: '/data/Frame3.webp',
  },
  skill4: {
    key: 'ear-training-player-pose-skill-4',
    url: '/data/Frame4.webp',
  },
  skill5: {
    key: 'ear-training-player-pose-skill-5',
    url: '/data/Frame5.webp',
  },
  skill6: {
    key: 'ear-training-player-pose-skill-6',
    url: '/data/Frame6.webp',
  },
};

const SKILL_PLAYER_POSE_SEQUENCE: PlayerAvatarPoseName[] = ['skill1', 'skill2', 'skill3', 'skill4', 'skill5'];

const EMPTY_CALLBACKS: EarTrainingBattleCallbacks = {
  onStart: () => undefined,
  onBack: () => undefined,
  onOpenSettings: () => undefined,
  onPracticeModeChange: () => undefined,
  onPianoKeyDown: () => undefined,
  onPianoKeyUp: () => undefined,
  onEffectImpact: () => undefined,
};

const clampPercent = (value: number, max: number): number => {
  if (max <= 0) {
    return 0;
  }
  return Phaser.Math.Clamp(value / max, 0, 1);
};

const getPianoHeight = (): number => PIANO_OVERLAY_HEIGHT;

const getFloorY = (height: number): number => Math.max(260, height - getPianoHeight() - FLOOR_CLEARANCE_FROM_PIANO);

const colorForHp = (percent: number, high: number, middle: number, low: number): number => {
  if (percent > 0.5) {
    return high;
  }
  if (percent > 0.25) {
    return middle;
  }
  return low;
};

const hashText = (value: string): string => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return `ear-training-avatar-${Math.abs(hash)}`;
};

interface CharacterView {
  container: Phaser.GameObjects.Container;
  image: Phaser.GameObjects.Image | null;
  fallback: Phaser.GameObjects.Text;
  motion: CharacterMotion;
}

interface CharacterMotion {
  side: CharacterSide;
  state: BattleCharacterMotionState;
  range: BattleCharacterMotionRange;
  targetX: number;
  idleEvent: Phaser.Time.TimerEvent | null;
  motionTween: Phaser.Tweens.Tween | null;
  resumeEvent: Phaser.Time.TimerEvent | null;
  token: number;
}

interface CharacterAnchors {
  x: number;
  footY: number;
  bodyY: number;
  headY: number;
  castY: number;
  resultTextY: number;
}

interface BattleAnchors {
  player: CharacterAnchors;
  enemy: CharacterAnchors;
}

export class EarTrainingBattleScene extends Phaser.Scene implements EarTrainingBattleSceneHandle {
  private callbacks: EarTrainingBattleCallbacks = EMPTY_CALLBACKS;
  private snapshot: EarTrainingBattleSnapshot | null = null;
  private loadingTextureKeys = new Set<string>();
  private backgroundLayer: Phaser.GameObjects.Container | null = null;
  private characterLayer: Phaser.GameObjects.Container | null = null;
  private effectLayer: Phaser.GameObjects.Container | null = null;
  private hudLayer: Phaser.GameObjects.Container | null = null;
  private phraseLayer: Phaser.GameObjects.Container | null = null;
  private playerView: CharacterView | null = null;
  private enemyView: CharacterView | null = null;
  private cachedPlayerQuoteText: string | null = null;
  private playerQuoteBubbleRoot: Phaser.GameObjects.Container | null = null;
  private phraseIntroText: Phaser.GameObjects.Text | null = null;
  private lastPhraseIntroKey: string | null = null;
  private lastEffectId: number | null = null;
  private readonly osmdHammerNodesByEffectId = new Map<number, Phaser.GameObjects.Image>();
  private lastPhraseRunId: number | null = null;
  private playerPoseToken = 0;
  private activePlayerPoseName: PlayerAvatarPoseName | null = null;
  private pendingSceneRebuild = false;
  private isReady = false;
  private lastBackgroundSizeKey: string | null = null;
  private lastCharacterBuildKey: string | null = null;
  private lastSceneRebuildAt = 0;
  private sceneRebuildTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super({ key: 'EarTrainingBattleScene' });
  }

  preload(): void {
    this.loadBattleEffectSprites();
  }

  create(): void {
    this.isReady = true;
    this.cameras.main.setBackgroundColor('#0e0705');
    this.scale.on('resize', this.handleResize, this);
    this.rebuildScene();
    if (this.snapshot) {
      this.loadAvatarTextures(this.snapshot);
    }
  }

  shutdown(): void {
    this.isReady = false;
    this.pendingSceneRebuild = false;
    this.clearOsmdHammers();
    this.stopAllCharacterMotion();
    this.sceneRebuildTimer?.remove(false);
    this.sceneRebuildTimer = null;
    this.scale.off('resize', this.handleResize, this);
  }

  setCallbacks(callbacks: EarTrainingBattleCallbacks): void {
    this.callbacks = callbacks;
  }

  updateSnapshot(snapshot: EarTrainingBattleSnapshot): void {
    const previousPhraseRunId = this.lastPhraseRunId;
    this.snapshot = snapshot;
    this.lastPhraseRunId = snapshot.phraseRunId;
    if (previousPhraseRunId !== null && previousPhraseRunId !== snapshot.phraseRunId) {
      this.playerPoseToken += 1;
      this.activePlayerPoseName = null;
      this.clearOsmdHammers();
      this.restorePlayerPose();
    }
    if (!this.isReady) {
      return;
    }
    this.queueSceneRebuild();
    this.loadAvatarTextures(snapshot);
    this.syncCharacterLifeState(snapshot);
  }

  triggerEffect(command: EarTrainingBattleEffectCommand): void {
    if (!this.isReady) {
      return;
    }
    if (this.lastEffectId === command.id) {
      return;
    }
    this.lastEffectId = command.id;

    if (command.kind === 'correct') {
      this.playCorrectEffect(command);
      return;
    }
    if (command.kind === 'quotaReached') {
      this.playQuotaReachedEffect();
      return;
    }
    if (command.kind === 'osmdHammer') {
      this.playOsmdHammerEffect(command);
      return;
    }
    if (command.kind === 'osmdHammerReflect') {
      this.playOsmdHammerReflectEffect(command);
      return;
    }
    if (command.kind === 'osmdMeteor') {
      this.playOsmdMeteorEffect(command);
      return;
    }
    if (command.kind === 'voicingCast') {
      this.playVoicingCastEffect();
      return;
    }
    if (command.kind === 'complete') {
      this.playCompleteEffect(command);
      return;
    }
    if (command.kind === 'fail') {
      this.playEnemyAttackEffect(command, true);
      return;
    }
    this.playEnemyAttackEffect(command, false);
  }

  highlightKey(_midiNote: number, _active: boolean): void {
    void _midiNote;
    void _active;
  }

  setPlayerQuote(text: string | null): void {
    const normalized = text?.trim() ? text.trim() : null;
    if (normalized === this.cachedPlayerQuoteText) {
      return;
    }
    this.cachedPlayerQuoteText = normalized;
    this.layoutPlayerQuoteBubble();
  }

  private handleResize = (): void => {
    this.clearBackgroundScene();
    this.queueSceneRebuild();
  };

  private loadBattleEffectSprites(): void {
    Object.values(BATTLE_EFFECT_SPRITE_ASSETS).forEach(asset => {
      if (this.textures.exists(asset.key)) {
        return;
      }
      this.load.image(asset.key, asset.url);
    });
    if (!this.textures.exists(MAGIC_CIRCLE_ASSET_KEY)) {
      this.load.image(MAGIC_CIRCLE_ASSET_KEY, MAGIC_CIRCLE_ASSET_URL);
    }
    if (!this.textures.exists(ENEMY_ATTACK_HAMMER_ASSET_KEY)) {
      this.load.image(ENEMY_ATTACK_HAMMER_ASSET_KEY, ENEMY_ATTACK_HAMMER_ASSET_URL);
    }
    Object.values(JAZZ_STAGE_PROP_ASSETS).forEach(asset => {
      if (this.textures.exists(asset.key)) {
        return;
      }
      this.load.image(asset.key, asset.url);
    });
    if (!this.textures.exists(FUKIDASHI_ASSET_KEY)) {
      this.load.image(FUKIDASHI_ASSET_KEY, FUKIDASHI_ASSET_URL);
    }
    Object.values(PLAYER_AVATAR_POSE_ASSETS).forEach(asset => {
      if (this.textures.exists(asset.key)) {
        return;
      }
      this.load.image(asset.key, asset.url);
    });
  }

  private rebuildScene(): void {
    this.pendingSceneRebuild = false;
    this.lastSceneRebuildAt = this.time.now;

    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const backgroundSizeKey = `${width}x${height}`;

    if (!this.backgroundLayer || this.lastBackgroundSizeKey !== backgroundSizeKey) {
      this.clearBackgroundScene();
      this.backgroundLayer = this.add.container(0, 0);
      this.drawBackground(width, height);
      this.lastBackgroundSizeKey = backgroundSizeKey;
    }

    this.rebuildCharactersIfNeeded(width, height);
    if (this.snapshot) {
      this.syncCharacterLifeState(this.snapshot);
    }
    this.clearUiScene();
    this.hudLayer = this.add.container(0, 0);
    this.phraseLayer = this.add.container(0, 0);
    const effectLayer = this.effectLayer ?? this.add.container(0, 0);
    this.effectLayer = effectLayer;

    this.drawHud(width);
    this.drawCharacterStatus(width, height);
    this.drawPhraseIntro(width, height);
    this.drawCountInOverlay(width, height);
    this.drawPhraseSlots(width, height);
    this.drawLobbyOverlay(width, height);
    this.children.bringToTop(effectLayer);
  }

  private queueSceneRebuild(): void {
    if (this.pendingSceneRebuild) {
      return;
    }
    this.pendingSceneRebuild = true;
    const elapsedMs = this.time.now - this.lastSceneRebuildAt;
    const delayMs = Math.max(0, MIN_SCENE_REBUILD_INTERVAL_MS - elapsedMs);
    this.sceneRebuildTimer = this.time.delayedCall(delayMs, () => {
      this.sceneRebuildTimer = null;
      if (!this.isReady || !this.pendingSceneRebuild) {
        return;
      }
      this.lastSceneRebuildAt = this.time.now;
      this.rebuildScene();
    });
  }

  private rebuildCharactersIfNeeded(width: number, height: number): void {
    const snapshot = this.snapshot;
    let nextBuildKey: string | null = null;
    if (snapshot) {
      const playerTextureReady = this.textures.exists(hashText(snapshot.playerAvatarUrl)) ? 1 : 0;
      const enemyTextureReady = this.textures.exists(hashText(snapshot.enemyAvatarUrl)) ? 1 : 0;
      nextBuildKey = [
        `${width}x${height}`,
        snapshot.playerAvatarUrl,
        playerTextureReady,
        snapshot.enemyAvatarUrl,
        enemyTextureReady,
        snapshot.enemyAvatarFlipX ? 1 : 0,
        snapshot.fixedCharacterPositions ? 1 : 0,
      ].join(':');
    }
    if (this.characterLayer && this.lastCharacterBuildKey === nextBuildKey) {
      return;
    }
    this.clearCharacterScene();
    if (!snapshot) {
      return;
    }
    this.characterLayer = this.add.container(0, 0);
    this.drawCharacters(width, height);
    this.lastCharacterBuildKey = nextBuildKey;
    if (this.activePlayerPoseName) {
      this.applyPlayerPose(this.activePlayerPoseName);
    }
  }

  private clearCharacterScene(): void {
    this.stopAllCharacterMotion();
    this.characterLayer?.destroy(true);
    this.characterLayer = null;
    this.playerView = null;
    this.enemyView = null;
    this.playerQuoteBubbleRoot = null;
    this.lastCharacterBuildKey = null;
  }

  private clearUiScene(): void {
    this.hudLayer?.destroy(true);
    this.phraseLayer?.destroy(true);
    this.hudLayer = null;
    this.phraseLayer = null;
  }

  private clearBackgroundScene(): void {
    this.backgroundLayer?.destroy(true);
    this.backgroundLayer = null;
    this.lastBackgroundSizeKey = null;
  }

  private drawBackground(width: number, height: number): void {
    if (!this.backgroundLayer) {
      return;
    }

    const floorY = getFloorY(height);
    const backdrop = this.add.graphics();
    this.drawJazzBarBackdrop(backdrop, width, height, floorY);

    const localVignette = this.add.graphics();
    this.drawLocalSpotlightVignette(localVignette, width, height, floorY);
    localVignette.setBlendMode('MULTIPLY');

    const spotlights = this.add.graphics();
    this.drawStageSpotlights(spotlights, width, height, floorY);
    spotlights.setBlendMode('ADD');

    const floorPools = this.add.graphics();
    this.drawFloorLightPools(floorPools, width, floorY);
    floorPools.setBlendMode('ADD');

    this.backgroundLayer.add([backdrop, localVignette, spotlights, floorPools]);
    this.addJazzStagePropSprites(width, floorY);
    this.drawStageFloorShadows(width, floorY);

    const vignette = this.add.graphics();
    this.drawFinalStageVignette(vignette, width, height);
    this.backgroundLayer.add(vignette);
  }

  private drawJazzBarBackdrop(graphics: Phaser.GameObjects.Graphics, width: number, height: number, floorY: number): void {
    const wallHeight = Math.max(80, floorY);
    const floorHeight = Math.max(0, height - floorY);
    const lipInset = Math.max(18, width * 0.018);

    graphics.fillStyle(JAZZ_BACKDROP_EDGE_COLOR, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.fillGradientStyle(0x160b08, 0x160b08, 0x2a160e, JAZZ_BACKDROP_EDGE_COLOR, 1);
    graphics.fillRect(0, 0, width, wallHeight);
    this.drawWeakBrickWall(graphics, width, wallHeight);

    this.drawRadialGlow(graphics, width * 0.24, wallHeight * 0.32, width * 0.34, wallHeight * 0.5, 0x000000, 0.16, 10);
    this.drawRadialGlow(graphics, width * 0.76, wallHeight * 0.3, width * 0.31, wallHeight * 0.45, 0x000000, 0.15, 10);
    this.drawRadialGlow(graphics, width * 0.5, wallHeight * 0.62, width * 0.28, wallHeight * 0.4, 0x000000, 0.2, 12);

    const shelfTop = Math.max(HUD_HEIGHT + 16, wallHeight * 0.22);
    const shelfHeight = Math.max(28, wallHeight * 0.13);
    graphics.fillStyle(0x080403, 0.28);
    graphics.fillRoundedRect(width * 0.35, shelfTop, width * 0.3, shelfHeight, 10);
    graphics.fillStyle(0x1e1009, 0.42);
    graphics.fillRect(width * 0.37, shelfTop + shelfHeight * 0.38, width * 0.26, 5);
    for (let index = 0; index < 14; index += 1) {
      const bottleX = width * 0.38 + index * width * 0.018;
      const bottleHeight = 10 + (index % 4) * 4;
      graphics.fillStyle(index % 3 === 0 ? 0xd58a2a : 0x5f2f18, 0.2);
      graphics.fillRoundedRect(bottleX, shelfTop + shelfHeight * 0.34 - bottleHeight, width * 0.008, bottleHeight, 2);
    }

    this.drawWallSconce(graphics, width * 0.18, Math.max(72, wallHeight * 0.22));
    this.drawWallSconce(graphics, width * 0.82, Math.max(72, wallHeight * 0.22));

    graphics.fillGradientStyle(0x24120b, 0x24120b, 0x3a2114, 0x24120b, 0.97);
    graphics.fillRect(0, floorY, width, floorHeight);
    graphics.lineStyle(1, 0x382018, 0.28);
    for (let index = 1; index < 8; index += 1) {
      const lineY = floorY + (floorHeight * index) / 8;
      graphics.lineBetween(0, lineY, width, lineY + 10);
    }
    graphics.lineStyle(1, 0x000000, 0.12);
    for (let index = 0; index < 12; index += 1) {
      const x = (width * index) / 12;
      graphics.lineBetween(x, floorY, x + width * 0.05, height);
    }

    const barSkirtHeight = Math.min(PIANO_OVERLAY_HEIGHT + 56, Math.max(12, height - floorY));
    graphics.fillGradientStyle(0x3a2114, 0x3a2114, 0x24120b, 0x24120b, 0.96);
    graphics.fillRect(0, height - barSkirtHeight, width, barSkirtHeight);
    graphics.lineStyle(1.5, JAZZ_GOLD_TRIM, 0.28);
    graphics.lineBetween(lipInset, height - barSkirtHeight + 2, width - lipInset, height - barSkirtHeight + 2);
    graphics.lineStyle(1.5, JAZZ_GOLD_TRIM, 0.22);
    graphics.lineBetween(lipInset + 10, floorY - 3, width - lipInset - 10, floorY - 3);
    graphics.lineStyle(2, 0xb46928, 0.15);
    graphics.lineBetween(lipInset + 4, floorY + 2, width - lipInset - 4, floorY + 2);
  }

  private drawWeakBrickWall(graphics: Phaser.GameObjects.Graphics, width: number, wallHeight: number): void {
    if (wallHeight <= 56) {
      return;
    }

    const sidePad = width * 0.045;
    const topPad = wallHeight * 0.048;
    const bottomPad = wallHeight * 0.088;
    const brickAreaHeight = wallHeight - topPad - bottomPad;
    const brickHeight = Math.max(21, brickAreaHeight / 15);
    const brickWidth = Math.max(72, brickHeight * 2.85);
    let row = 0;
    for (let y = topPad; y < topPad + brickAreaHeight; y += brickHeight + 5) {
      const stagger = (row % 2) * brickWidth * 0.5;
      for (let x = sidePad - brickWidth + stagger; x < width - sidePad + brickWidth; x += brickWidth) {
        graphics.fillStyle(0x593015, 0.15);
        graphics.fillRect(Math.round(x), Math.round(y), Math.max(2, brickWidth - 6), Math.max(2, brickHeight - 5));
        graphics.lineStyle(0.75, 0x140d09, 0.11);
        graphics.strokeRect(Math.round(x), Math.round(y), Math.max(2, brickWidth - 6), Math.max(2, brickHeight - 5));
      }
      row += 1;
    }
  }

  private drawLocalSpotlightVignette(graphics: Phaser.GameObjects.Graphics, width: number, height: number, floorY: number): void {
    graphics.fillStyle(0x000000, 0.16);
    graphics.fillRect(0, 0, width, height);
    this.drawRadialGlow(graphics, width * 0.23, floorY - 36, width * 0.24, height * 0.24, 0xffffff, 0.18, 10);
    this.drawRadialGlow(graphics, width * 0.77, floorY - 36, width * 0.24, height * 0.24, 0xffffff, 0.2, 10);
    this.drawRadialGlow(graphics, width * 0.5, floorY * 0.36, width * 0.22, height * 0.28, 0x000000, 0.16, 10);
  }

  private drawStageSpotlights(graphics: Phaser.GameObjects.Graphics, width: number, height: number, floorY: number): void {
    this.drawSpotlightCone(graphics, width, height, floorY, width * 0.23, width * 0.02, 0xffd29b, 0.11);
    this.drawSpotlightCone(graphics, width, height, floorY, width * 0.77, -width * 0.02, 0xffc8af, 0.13);
  }

  private drawSpotlightCone(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    floorY: number,
    centerX: number,
    apexShift: number,
    color: number,
    alpha: number,
  ): void {
    const apexY = Math.min(2, floorY - 36);
    const halfTop = width * 0.014;
    const halfBottom = width * 0.072;
    const apexX = centerX + apexShift;
    graphics.fillStyle(color, alpha * 0.42);
    graphics.fillTriangle(apexX - halfTop, apexY, apexX + halfTop, apexY, centerX + halfBottom, floorY + 4);
    graphics.fillTriangle(apexX - halfTop, apexY, centerX - halfBottom, floorY + 4, centerX + halfBottom, floorY + 4);
    graphics.fillStyle(color, alpha * 0.18);
    graphics.fillTriangle(apexX - halfTop * 0.35, apexY, apexX + halfTop * 0.35, apexY, centerX, height);
    this.drawRadialGlow(graphics, centerX, floorY - CHARACTER_DISPLAY_SIZE * 0.4, halfBottom * 1.2, height * 0.28, color, alpha * 0.3, 8);
  }

  private drawFloorLightPools(graphics: Phaser.GameObjects.Graphics, width: number, floorY: number): void {
    this.drawRadialGlow(graphics, width * 0.23, floorY - 6, 88, 17, 0xffd29b, 0.13, 8);
    this.drawRadialGlow(graphics, width * 0.77, floorY - 6, 88, 17, 0xffc8af, 0.15, 8);
  }

  private drawWallSconce(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
    this.drawRadialGlow(graphics, x, y, 64, 42, 0xd58a2a, 0.18, 9);
    graphics.fillStyle(0x3a2114, 0.8);
    graphics.fillRoundedRect(x - 9, y - 4, 18, 12, 4);
    graphics.fillStyle(0xf8d48a, 0.5);
    graphics.fillEllipse(x, y - 7, 18, 10);
  }

  private drawStageFloorShadows(width: number, floorY: number): void {
    if (!this.backgroundLayer) {
      return;
    }
    const leftShadow = this.add.ellipse(width * 0.23, floorY + 6, 168, 28, 0x000000, 0.17);
    const rightShadow = this.add.ellipse(width * 0.77, floorY + 6, 168, 28, 0x000000, 0.17);
    this.backgroundLayer.add([leftShadow, rightShadow]);
  }

  private drawFinalStageVignette(graphics: Phaser.GameObjects.Graphics, width: number, height: number): void {
    graphics.fillStyle(0x000000, 0.13);
    graphics.fillRect(0, 0, width, HUD_HEIGHT * 0.65);
    this.drawRadialGlow(graphics, 0, 0, width * 0.62, height * 0.62, 0x000000, 0.2, 12);
    this.drawRadialGlow(graphics, width, 0, width * 0.62, height * 0.62, 0x000000, 0.2, 12);
    this.drawRadialGlow(graphics, 0, height, width * 0.62, height * 0.62, 0x000000, 0.22, 12);
    this.drawRadialGlow(graphics, width, height, width * 0.62, height * 0.62, 0x000000, 0.22, 12);
  }

  private drawRadialGlow(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    color: number,
    alpha: number,
    steps: number,
  ): void {
    for (let index = steps; index > 0; index -= 1) {
      const progress = index / steps;
      graphics.fillStyle(color, alpha * progress * progress);
      graphics.fillEllipse(x, y, radiusX * 2 * progress, radiusY * 2 * progress);
    }
  }

  private addJazzStagePropSprites(width: number, floorY: number): void {
    if (!this.backgroundLayer) {
      return;
    }

    this.addStageBackgroundSprite('doubleBass', width * 0.075, floorY, width * 0.12, 0.5, 1);
    this.addStageBackgroundSprite('piano', width * 0.352, floorY, width * 0.15, 0.5, 1);

    const drumMaxWidth = Math.max(1, Math.floor(width * 0.158));
    const drumHalfWidth = drumMaxWidth * 0.5;
    const enemyApproxRightEdgeX = width * 0.77 + CHARACTER_DISPLAY_SIZE * 0.48;
    const drumMaxCenterX = width - 16 - drumHalfWidth;
    const minimumCenterPastEnemy = enemyApproxRightEdgeX + drumHalfWidth * 0.32 + 10;
    const preferredDrumCenterX = width * 0.91;
    const drumCenterX = Math.min(Math.max(preferredDrumCenterX, Math.min(minimumCenterPastEnemy, drumMaxCenterX)), drumMaxCenterX);
    this.addStageBackgroundSprite('drumKit', drumCenterX, floorY, drumMaxWidth, 0.5, 1);
  }

  private addStageBackgroundSprite(
    propName: JazzStagePropName,
    x: number,
    y: number,
    maxWidth: number,
    originX: number,
    originY: number,
  ): void {
    const asset = JAZZ_STAGE_PROP_ASSETS[propName];
    const frame = this.textures.getFrame(asset.key);
    if (!this.backgroundLayer || !frame || frame.width <= 1 || frame.height <= 1) {
      return;
    }
    const sprite = this.add.image(x, y, asset.key).setOrigin(originX, originY);
    const displayWidth = Math.max(1, Math.floor(maxWidth));
    sprite.setDisplaySize(displayWidth, Math.max(1, displayWidth * (frame.height / frame.width)));
    sprite.setAlpha(asset.alpha);
    this.backgroundLayer.add(sprite);
  }

  private drawHud(width: number): void {
    const snapshot = this.snapshot;
    if (!snapshot || !this.hudLayer) {
      return;
    }

    const hudBg = this.add.rectangle(0, 0, width, HUD_HEIGHT, 0x020617, 0.66).setOrigin(0, 0);
    hudBg.setStrokeStyle(1, 0xffffff, 0.08);
    this.hudLayer.add(hudBg);

    this.drawHpBar(18, 16, Math.max(118, width * 0.29), snapshot.playerHp, snapshot.playerMaxHp, true);
    this.drawHpBar(width - Math.max(118, width * 0.29) - 18, 16, Math.max(118, width * 0.29), snapshot.enemyHp, snapshot.enemyMaxHp, false);

    const time = this.add.text(width / 2, 18, snapshot.timeLabel, {
      color: snapshot.timeLabel === '∞' ? '#67e8f9' : '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      fontStyle: '900',
    }).setOrigin(0.5, 0);
    this.hudLayer.add(time);

    const utilBtnW = 58;
    const utilBtnH = 36;
    const utilRightPad = 12;
    const utilGap = 10;
    const utilBackX = width - utilRightPad - utilBtnW;
    const utilSettingsX = utilBackX - utilGap - utilBtnW;
    this.drawUtilityButton(
      utilSettingsX,
      56,
      utilBtnW,
      utilBtnH,
      snapshot.hudLabels.settings,
      () => this.callbacks.onOpenSettings(),
    );
    this.drawUtilityButton(
      utilBackX,
      56,
      utilBtnW,
      utilBtnH,
      snapshot.hudLabels.backShort,
      () => this.callbacks.onBack(),
    );
    if (!snapshot.chordHudHidden) {
      this.drawChordHud(width, 104);
    }

    if (snapshot.practiceMode) {
      const practice = this.add.text(width / 2 + 60, 26, snapshot.hudLabels.practiceBadge, {
        color: '#083344',
        backgroundColor: '#67e8f9',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: '900',
        padding: { x: 8, y: 3 },
      }).setOrigin(0, 0);
      this.hudLayer.add(practice);
    }

    const midiStatus = this.add.text(18, 64, snapshot.isMidiConnected ? 'MIDI ON' : 'MIDI OFF', {
      color: snapshot.isMidiConnected ? '#bbf7d0' : '#94a3b8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: '900',
    }).setOrigin(0, 0);
    this.hudLayer.add(midiStatus);
  }

  private drawHpBar(x: number, y: number, width: number, hp: number, maxHp: number, isPlayer: boolean): void {
    if (!this.hudLayer) {
      return;
    }
    const percent = clampPercent(hp, maxHp);
    const barColor = isPlayer
      ? colorForHp(percent, 0x34d399, 0xfbbf24, 0xef4444)
      : colorForHp(percent, 0xfb7185, 0xf59e0b, 0xbe123c);
    const frame = this.add.rectangle(x, y, width, 12, 0x020617, 0.9).setOrigin(0, 0);
    frame.setStrokeStyle(1, 0xffffff, 0.14);
    const fill = this.add.rectangle(x + 2, y + 2, Math.max(0, (width - 4) * percent), 8, barColor, 1).setOrigin(0, 0);
    this.hudLayer.add([frame, fill]);
  }

  private drawChordHud(width: number, y: number): void {
    const snapshot = this.snapshot;
    if (!snapshot || !this.hudLayer) {
      return;
    }
    if (snapshot.chords.length === 0) {
      return;
    }

    const itemWidth = 82;
    const leftMargin = 16;
    const rightMargin = 16;
    const availableWidth = Math.max(itemWidth, width - leftMargin - rightMargin);
    const visibleCount = Math.max(1, Math.min(snapshot.chords.length, Math.floor(availableWidth / itemWidth)));
    const activeIndex = snapshot.chords.findIndex(chord => chord.active);
    const firstVisibleIndex = Phaser.Math.Clamp(
      activeIndex >= 0 ? activeIndex - visibleCount + 1 : 0,
      0,
      Math.max(0, snapshot.chords.length - visibleCount),
    );
    const chords = snapshot.chords.slice(firstVisibleIndex, firstVisibleIndex + visibleCount);
    const startX = Math.max(leftMargin, leftMargin + (availableWidth - itemWidth * chords.length) / 2);
    chords.forEach((chord, index) => {
      const x = startX + index * itemWidth;
      const bg = this.add.rectangle(x + itemWidth / 2, y + 13, itemWidth - 6, 26, chord.active ? 0xfacc15 : 0x020617, chord.active ? 1 : 0.72);
      bg.setStrokeStyle(1, chord.active ? 0xfef08a : 0xffffff, chord.active ? 0.9 : 0.12);
      const text = this.add.text(x + itemWidth / 2, y + 13, chord.name, {
        color: chord.active ? '#020617' : '#e2e8f0',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: '900',
      }).setOrigin(0.5, 0.5);
      this.hudLayer?.add([bg, text]);
    });
  }

  private drawUtilityButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void,
  ): void {
    if (!this.hudLayer) {
      return;
    }
    const button = this.add.rectangle(x, y, width, height, 0x020617, 0.72).setOrigin(0, 0);
    button.setStrokeStyle(1, 0xffffff, 0.16);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', onClick);
    const text = this.add.text(x + width / 2, y + height / 2, label, {
      color: '#e2e8f0',
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: '900',
    }).setOrigin(0.5, 0.5);
    this.hudLayer.add([button, text]);
  }

  private drawCharacters(width: number, height: number): void {
    const snapshot = this.snapshot;
    if (!snapshot || !this.characterLayer) {
      return;
    }
    const floorY = getFloorY(height);
    this.playerView = this.createCharacter(width * 0.23, floorY, true, snapshot.playerAvatarUrl, false);
    this.enemyView = this.createCharacter(width * 0.77, floorY, false, snapshot.enemyAvatarUrl, snapshot.enemyAvatarFlipX);
    if (!snapshot.fixedCharacterPositions) {
      this.startCharacterAutoMotion(this.playerView, AUTO_IDLE_MIN_MS, AUTO_IDLE_MAX_MS);
      this.startCharacterAutoMotion(this.enemyView, AUTO_IDLE_MIN_MS, AUTO_IDLE_MAX_MS);
    }
    this.layoutPlayerQuoteBubble();
  }

  private layoutPlayerQuoteBubble(): void {
    if (!this.isReady) {
      return;
    }
    const view = this.playerView;
    if (!view) {
      return;
    }
    const text = this.cachedPlayerQuoteText;
    if (!text) {
      this.playerQuoteBubbleRoot?.setVisible(false);
      return;
    }

    const footContainer = view.container;
    const existingRoot = this.playerQuoteBubbleRoot;
    if (!existingRoot || existingRoot.parentContainer !== footContainer) {
      existingRoot?.destroy(true);
      const root = this.make.container({ x: 0, y: -CHARACTER_DISPLAY_SIZE - PLAYER_QUOTE_GAP_BELOW_SPRITE_PX, add: false });
      footContainer.add(root);
      this.playerQuoteBubbleRoot = root;
    }

    const root = this.playerQuoteBubbleRoot;
    if (!root) {
      return;
    }
    root.removeAll(true);

    const label = this.make.text({
      x: 0,
      y: 0,
      text,
      style: {
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontSize: `${PLAYER_QUOTE_FONT_PX}px`,
        fontStyle: 'bold',
        color: '#ffffff',
      },
      add: false,
    });
    label.setOrigin(0.5, 0.5);

    const bubbleWidth = label.width + PLAYER_QUOTE_PAD_X * 2;
    const bubbleHeight = label.height + PLAYER_QUOTE_PAD_Y * 2;
    const tailH = PLAYER_QUOTE_TAIL_HEIGHT;

    const bubble = this.make.graphics({ x: 0, y: 0 }, false);
    bubble.fillStyle(0x000000, PLAYER_QUOTE_BG_ALPHA);
    bubble.fillRoundedRect(-bubbleWidth / 2, -tailH - bubbleHeight, bubbleWidth, bubbleHeight, PLAYER_QUOTE_CORNER_RADIUS);

    const tail = this.make.graphics({ x: 0, y: 0 }, false);
    tail.fillStyle(0x000000, PLAYER_QUOTE_BG_ALPHA);
    tail.fillTriangle(-7, -tailH, 7, -tailH, 0, 6);

    root.add([tail, bubble, label]);
    label.setY(-tailH - bubbleHeight / 2);

    root.setVisible(true);
  }

  private drawCharacterStatus(width: number, height: number): void {
    const snapshot = this.snapshot;
    if (!snapshot) {
      return;
    }
    if (snapshot.attackGaugeHidden) {
      return;
    }
    const floorY = getFloorY(height);
    this.drawEnemyAttackGauge(width * 0.77, Math.max(HUD_HEIGHT + 12, floorY - 166));
    if (snapshot.demoLoopActive) {
      this.drawDemoBubble(width * 0.77, Math.max(HUD_HEIGHT + 46, floorY - CHARACTER_DISPLAY_SIZE - 38));
    }
  }

  private createCharacter(x: number, y: number, isPlayer: boolean, avatarUrl: string, avatarFlipX: boolean): CharacterView {
    const container = this.add.container(x, y);
    const textureKey = hashText(avatarUrl);
    const shouldFlipX = !isPlayer && (avatarFlipX || EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS.has(avatarUrl));
    const shadow = this.add.ellipse(0, 4, CHARACTER_SHADOW_WIDTH, CHARACTER_SHADOW_HEIGHT, 0x000000, 0.34);
    const image = this.textures.exists(textureKey)
      ? this.add.image(0, 0, textureKey).setOrigin(0.5, 1).setDisplaySize(CHARACTER_DISPLAY_SIZE, CHARACTER_DISPLAY_SIZE)
      : null;
    image?.setFlipX(shouldFlipX);
    const fallback = this.add.text(0, 0, isPlayer ? 'P' : 'E', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '42px',
      fontStyle: '900',
    }).setOrigin(0.5, 1);
    fallback.setVisible(!image);

    container.add(shadow);
    if (image) {
      container.add(image);
    }
    container.add(fallback);
    this.characterLayer?.add(container);
    return {
      container,
      image,
      fallback,
      motion: {
        side: isPlayer ? 'player' : 'enemy',
        state: 'idle',
        range: getBattleCharacterMotionRange(isPlayer ? 'player' : 'enemy', Math.max(320, this.scale.width)),
        targetX: x,
        idleEvent: null,
        motionTween: null,
        resumeEvent: null,
        token: 0,
      },
    };
  }

  private drawEnemyAttackGauge(x: number, y: number): void {
    const snapshot = this.snapshot;
    if (!snapshot || !this.hudLayer) {
      return;
    }
    const width = 126;
    const percent = Phaser.Math.Clamp(snapshot.enemyAttackGaugePercent, 0, 1);
    const label = this.add.text(x, y - 12, 'ATTACK', {
      color: percent >= 0.92 ? '#fecaca' : '#fda4af',
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fontStyle: '900',
    }).setOrigin(0.5, 0.5);
    const frame = this.add.rectangle(x, y + 4, width, 12, 0x020617, 0.84).setOrigin(0.5, 0.5);
    frame.setStrokeStyle(1, percent >= 0.92 ? 0xfca5a5 : 0xfb7185, 0.78);
    const fill = this.add.rectangle(x - width / 2 + 2, y + 4, Math.max(0, (width - 4) * percent), 8, 0xfb7185, 0.95).setOrigin(0, 0.5);
    this.hudLayer.add([label, frame, fill]);
  }

  private drawDemoBubble(x: number, y: number): void {
    if (!this.hudLayer || !this.textures.exists(FUKIDASHI_ASSET_KEY)) {
      return;
    }

    const bubbleX = Phaser.Math.Clamp(x + 62, 56, Math.max(320, this.scale.width) - 56);
    const bubble = this.add.image(bubbleX, y + 18, FUKIDASHI_ASSET_KEY)
      .setOrigin(0.5, 0.72)
      .setDisplaySize(112, 84)
      .setAlpha(0.96);
    this.hudLayer.add(bubble);
  }

  private drawPhraseIntro(width: number, height: number): void {
    const snapshot = this.snapshot;
    if (!snapshot || !this.effectLayer || snapshot.totalPhrases <= 0) {
      return;
    }
    if (snapshot.showLobbyControls) {
      this.phraseIntroText?.destroy();
      this.phraseIntroText = null;
      this.lastPhraseIntroKey = null;
      return;
    }

    const introTrimmed = snapshot.phraseIntroLine.trim();
    if (!introTrimmed) {
      this.phraseIntroText?.destroy();
      this.phraseIntroText = null;
      this.lastPhraseIntroKey = null;
      return;
    }

    const emphasis = Boolean(snapshot.phraseIntroEmphasis);
    const introKey = `${snapshot.phraseIntroSeq}:${snapshot.phraseIndex}:${snapshot.totalPhrases}`;
    if (this.lastPhraseIntroKey === introKey) {
      return;
    }

    this.lastPhraseIntroKey = introKey;
    this.phraseIntroText?.destroy();
    // 中央のコード譜オーバーレイ（画面高の約42%付近）と重ならないよう、HUD直下〜画面上部寄りに固定
    const y = Math.max(HUD_HEIGHT + 20, Math.round(height * 0.3));
    const fadeMs = emphasis ? PHRASE_INTRO_EMPHASIS_FADE_MS : PHRASE_INTRO_FADE_MS;
    const text = this.add.text(width / 2, y, introTrimmed, {
      color: '#fef3c7',
      fontFamily: 'Arial, sans-serif',
      fontSize: emphasis ? '34px' : '22px',
      fontStyle: '900',
      stroke: '#020617',
      strokeThickness: emphasis ? 7 : 5,
    }).setOrigin(0.5, 0.5);
    text.setAlpha(0.95);
    this.phraseIntroText = text;
    this.effectLayer.add(text);
    this.tweens.add({
      targets: text,
      y: y - (emphasis ? 12 : 24),
      alpha: 0,
      duration: fadeMs,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        text.destroy();
        if (this.phraseIntroText === text) {
          this.phraseIntroText = null;
        }
      },
    });
  }

  private drawCountInOverlay(width: number, height: number): void {
    const snapshot = this.snapshot;
    if (
      !snapshot
      || !this.effectLayer
      || snapshot.showLobbyControls
      || snapshot.gameState !== 'countIn'
      || snapshot.countInValue <= 0
    ) {
      return;
    }

    const radius = Phaser.Math.Clamp(Math.round(Math.min(width, height) * 0.08), 44, 70);
    const x = width / 2;
    const y = Math.round(height * 0.42);
    const halo = this.add.circle(x, y, radius + 10, 0xf59e0b, 0.18);
    const circle = this.add.circle(x, y, radius, 0x020617, 0.72);
    circle.setStrokeStyle(2, 0xfde68a, 0.72);
    const text = this.add.text(x, y, String(snapshot.countInValue), {
      color: '#fde68a',
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.round(radius * 1.08)}px`,
      fontStyle: '900',
      stroke: '#020617',
      strokeThickness: 5,
    }).setOrigin(0.5, 0.54);
    this.effectLayer.add([halo, circle, text]);
  }

  private playQuotaReachedEffect(): void {
    if (!this.effectLayer) {
      return;
    }
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const cx = width / 2;
    const cy = Math.max(HUD_HEIGHT + 40, Math.round(height * 0.35));
    const duration = 700;
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      const dot = this.add.circle(cx, cy, 6, 0xfacc15, 1);
      dot.setStrokeStyle(0, 0x000000, 0);
      this.effectLayer.add(dot);
      this.tweens.add({
        targets: dot,
        x: cx + Math.cos(angle) * 80,
        y: cy + Math.sin(angle) * 80,
        alpha: 0,
        scaleX: 0.4,
        scaleY: 0.4,
        duration,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          dot.destroy();
        },
      });
    }
  }

  private drawPhraseSlots(width: number, height: number): void {
    const snapshot = this.snapshot;
    if (!snapshot || !this.phraseLayer) {
      return;
    }
    if (snapshot.phraseSlotsHidden) {
      return;
    }
    const slots = snapshot.phraseSlots.length > 0 ? snapshot.phraseSlots : ['_'];
    const slotSize = Phaser.Math.Clamp((width - 48) / Math.min(Math.max(8, slots.length), 11), 22, 36);
    const gap = 5;
    const availableWidth = Math.max(slotSize, width - 40);
    const visibleCount = Math.max(1, Math.min(slots.length, Math.floor((availableWidth + gap) / (slotSize + gap))));
    const focusedIndex = Phaser.Math.Clamp(snapshot.currentNoteIndex, 0, Math.max(0, slots.length - 1));
    const firstVisibleIndex = Phaser.Math.Clamp(
      focusedIndex - Math.floor(visibleCount / 2),
      0,
      Math.max(0, slots.length - visibleCount),
    );
    const visibleSlots = slots.slice(firstVisibleIndex, firstVisibleIndex + visibleCount);
    const totalWidth = visibleSlots.length * slotSize + (visibleSlots.length - 1) * gap;
    const startX = Math.max(16, (width - totalWidth) / 2);
    const y = height - getPianoHeight() - slotSize - 18;
    const isCircleMode = snapshot.slotKind === 'circle';

    visibleSlots.forEach((_slot, visibleIndex) => {
      const index = firstVisibleIndex + visibleIndex;
      const x = startX + visibleIndex * (slotSize + gap);
      if (isCircleMode) {
        const completed = Boolean(snapshot.chordCompleted[index]);
        const bgColor = completed ? 0x10b981 : 0x020617;
        const box = this.add.rectangle(
          x,
          y,
          slotSize,
          slotSize,
          bgColor,
          completed ? 0.32 : 0.78,
        ).setOrigin(0, 0);
        box.setStrokeStyle(
          1,
          completed ? 0xa7f3d0 : 0xffffff,
          completed ? 0.9 : 0.14,
        );
        const ring = this.add.circle(
          x + slotSize / 2,
          y + slotSize / 2,
          slotSize * 0.32,
          completed ? 0x10b981 : 0x020617,
          completed ? 0.95 : 0,
        );
        ring.setStrokeStyle(
          completed ? 4 : 3,
          completed ? 0xbbf7d0 : 0x64748b,
          completed ? 0.95 : 0.85,
        );
        this.phraseLayer?.add([box, ring]);
        return;
      }

      const revealed = index < snapshot.revealedNotes.length;
      const current = index === snapshot.currentNoteIndex && snapshot.gameState === 'playingPhrase';
      const bgColor = current ? 0x22d3ee : revealed ? 0x10b981 : 0x020617;
      const textColor = current ? '#ecfeff' : revealed ? '#d1fae5' : '#64748b';
      const box = this.add.rectangle(x, y, slotSize, slotSize, bgColor, current ? 0.38 : revealed ? 0.28 : 0.78).setOrigin(0, 0);
      box.setStrokeStyle(current ? 3 : 1, current ? 0xa5f3fc : 0xffffff, current ? 0.9 : 0.14);
      const text = this.add.text(x + slotSize / 2, y + slotSize / 2, revealed ? snapshot.revealedNotes[index] : '_', {
        color: textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.floor(slotSize * 0.45)}px`,
        fontStyle: '900',
      }).setOrigin(0.5, 0.5);
      this.phraseLayer?.add([box, text]);
      if (current) {
        this.tweens.add({ targets: box, alpha: 0.92, yoyo: true, repeat: -1, duration: 360 });
      }
    });

    if (firstVisibleIndex > 0) {
      const left = this.add.text(startX - 12, y + slotSize / 2, '‹', {
        color: '#94a3b8',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: '900',
      }).setOrigin(0.5, 0.5);
      this.phraseLayer?.add(left);
    }
    if (firstVisibleIndex + visibleCount < slots.length) {
      const right = this.add.text(startX + totalWidth + 12, y + slotSize / 2, '›', {
        color: '#94a3b8',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        fontStyle: '900',
      }).setOrigin(0.5, 0.5);
      this.phraseLayer?.add(right);
    }
  }

  private drawLobbyOverlay(width: number, height: number): void {
    const snapshot = this.snapshot;
    if (!snapshot || !this.hudLayer || !snapshot.showLobbyControls) {
      return;
    }

    const overlay = this.add.rectangle(0, 0, width, height, 0x020617, 0.62).setOrigin(0, 0);
    this.hudLayer.add(overlay);

    const rulesTrimmed = snapshot.quizRulesLine?.trim() ?? '';
    if (rulesTrimmed) {
      const rulesY = snapshot.resultState ? height * 0.42 : height * 0.34;
      const rules = this.add.text(width / 2, rulesY, rulesTrimmed, {
        color: '#e2e8f0',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '700',
        align: 'center',
        wordWrap: { width: Math.min(520, width - 48) },
      }).setOrigin(0.5, 0.5);
      this.hudLayer.add(rules);
    }

    const resultLabel = this.getResultLabel(snapshot.resultState);
    if (resultLabel) {
      const result = this.add.text(width / 2, height * 0.3, resultLabel, {
        color: this.getResultColor(snapshot.resultState),
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        fontStyle: '900',
        stroke: '#020617',
        strokeThickness: 6,
      }).setOrigin(0.5, 0.5);
      this.hudLayer.add(result);
    }

    if (snapshot.resultRankLine && snapshot.resultState) {
      const rank = this.add.text(width / 2, height * 0.38, snapshot.resultRankLine, {
        color: '#fde68a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        fontStyle: '900',
      }).setOrigin(0.5, 0.5);
      this.hudLayer.add(rank);
    }

    this.drawModeButton(width / 2 - 82, height * 0.46, snapshot.hudLabels.battleMode, !snapshot.practiceMode, () => this.callbacks.onPracticeModeChange(false));
    this.drawModeButton(width / 2 + 12, height * 0.46, snapshot.hudLabels.practiceMode, snapshot.practiceMode, () => this.callbacks.onPracticeModeChange(true));
    this.drawStartButton(width / 2, height * 0.56, snapshot.startButtonLabel);
    this.drawLobbyBackButton(width / 2, height * 0.66);

    if (snapshot.lessonProgressText) {
      const progress = this.add.text(width / 2, height * 0.75, snapshot.lessonProgressText, {
        color: '#bbf7d0',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '700',
      }).setOrigin(0.5, 0.5);
      this.hudLayer.add(progress);
    }
  }

  private getResultLabel(resultState: EarTrainingBattleSnapshot['resultState']): string | null {
    const labels = this.snapshot?.hudLabels;
    if (!labels) {
      return null;
    }
    if (resultState === 'win') {
      return labels.resultWin;
    }
    if (resultState === 'lose') {
      return labels.resultLose;
    }
    if (resultState === 'timeOver') {
      return labels.resultTimeOver;
    }
    return null;
  }

  private getResultColor(resultState: EarTrainingBattleSnapshot['resultState']): string {
    if (resultState === 'win') {
      return '#fde68a';
    }
    if (resultState === 'timeOver') {
      return '#bae6fd';
    }
    return '#fecaca';
  }

  private drawModeButton(x: number, y: number, label: string, active: boolean, onClick: () => void): void {
    const snapshot = this.snapshot;
    if (!this.hudLayer || !snapshot) {
      return;
    }
    const button = this.add.rectangle(x, y, 76, 34, active ? 0x38bdf8 : 0x020617, active ? 0.95 : 0.8).setOrigin(0, 0);
    button.setStrokeStyle(1, active ? 0xa5f3fc : 0xffffff, active ? 0.95 : 0.18);
    if (snapshot.canChangePracticeMode) {
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', onClick);
    }
    const text = this.add.text(x + 38, y + 17, label, {
      color: active ? '#020617' : '#e2e8f0',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: '900',
    }).setOrigin(0.5, 0.5);
    this.hudLayer.add([button, text]);
  }

  private drawStartButton(x: number, y: number, label: string): void {
    if (!this.hudLayer) {
      return;
    }
    const button = this.add.rectangle(x, y, 190, 66, 0xf59e0b, 1);
    button.setStrokeStyle(3, 0xfef3c7, 0.9);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.callbacks.onStart());
    const text = this.add.text(x, y, label, {
      color: '#020617',
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: '900',
    }).setOrigin(0.5, 0.5);
    this.tweens.add({ targets: button, scale: 1.04, yoyo: true, repeat: -1, duration: 620 });
    this.hudLayer.add([button, text]);
  }

  private drawLobbyBackButton(x: number, y: number): void {
    if (!this.hudLayer) {
      return;
    }

    const button = this.add.rectangle(x, y, 154, 40, 0x020617, 0.86);
    button.setStrokeStyle(2, 0xffffff, 0.24);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => this.callbacks.onBack());
    const lobbyBackLabel = this.snapshot?.hudLabels.lobbyBack ?? 'Back';
    const text = this.add.text(x, y, lobbyBackLabel, {
      color: '#e2e8f0',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: '900',
    }).setOrigin(0.5, 0.5);
    this.hudLayer.add([button, text]);
  }

  private playCorrectEffect(command: EarTrainingBattleEffectCommand): void {
    if (!this.effectLayer) {
      return;
    }
    this.holdCharacterForAction('player', 'cast', 720);
    this.showCorrectPlayerPose();
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const anchors = this.getBattleAnchors(width, height);
    if (command.originPoint) {
      this.playEnergyToPlayer(command.originPoint.x, command.originPoint.y, anchors);
    }
    const fireball = this.createEffectSprite('fireball', anchors.player.x + 44, anchors.player.castY, 78);
    fireball.setAngle(-24);
    const glow = this.add.circle(anchors.player.x + 44, anchors.player.castY, 22, 0xf97316, 0.34);
    const tail = [
      this.add.circle(anchors.player.x + 14, anchors.player.castY + 6, 8, 0xfb923c, 0.72),
      this.add.circle(anchors.player.x - 10, anchors.player.castY + 10, 5, 0xef4444, 0.52),
    ];
    this.effectLayer.add([glow, ...tail]);
    this.tweens.add({
      targets: [glow, ...tail],
      x: anchors.enemy.x,
      y: anchors.enemy.bodyY,
      scale: 0.72,
      duration: 540,
      ease: 'Cubic.easeIn',
    });
    this.tweens.add({
      targets: fireball,
      x: anchors.enemy.x,
      y: anchors.enemy.bodyY,
      angle: 16,
      displayWidth: 96,
      displayHeight: 96,
      duration: 540,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        fireball.destroy();
        glow.destroy();
        tail.forEach(part => part.destroy());
        this.flashEnemy();
        this.showImpactBurst(anchors.enemy.x, anchors.enemy.bodyY, 0xfb923c, false);
        this.showEnemyDamageText(command.damage, anchors.enemy);
        this.callbacks.onEffectImpact(command.id);
        this.knockEnemyAfterDamage(24, 170);
      },
    });
  }

  private playCompleteEffect(command: EarTrainingBattleEffectCommand): void {
    if (!this.effectLayer) {
      return;
    }
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const label = command.label ?? 'Good';
    const isSuperPerfect = label === 'Perfect' && (command.phraseNoteCount ?? 0) >= 6;
    const displayLabel = isSuperPerfect ? 'Awesome!' : label;
    this.holdCharacterForAction('player', 'attack', isSuperPerfect ? 1780 : 1120);
    const anchors = this.getBattleAnchors(width, height);
    this.showFloatingResultText(displayLabel, anchors.player.x, anchors.player.resultTextY, this.getRankColor(displayLabel));

    if (isSuperPerfect) {
      this.playMeteorEffect(command, anchors);
      return;
    }
    if (command.originPoint) {
      this.playEnergyToPlayer(command.originPoint.x, command.originPoint.y, anchors);
    }
    this.showPlayerPoseSequence(SKILL_PLAYER_POSE_SEQUENCE, SKILL_PLAYER_POSE_FRAME_MS, false);
    if (label === 'Perfect') {
      this.playLightningEffect(command, anchors);
      return;
    }
    if (label === 'Great') {
      this.playSnowflakeEffect(command, anchors);
      return;
    }
    this.playGoodCompleteEffect(command, anchors);
  }

  private playEnemyAttackEffect(command: EarTrainingBattleEffectCommand, heavy: boolean): void {
    if (!this.effectLayer) {
      return;
    }
    this.holdCharacterForAction('enemy', 'attack', heavy ? 980 : 760);
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const anchors = this.getBattleAnchors(width, height);
    if (heavy) {
      this.showFloatingResultText(command.label ?? 'Fail', anchors.player.x, anchors.player.resultTextY, '#fecaca');
    }
    const hammerSize = heavy ? 104 : 76;
    const hammer = this.add.image(
      anchors.enemy.x - 28,
      anchors.enemy.bodyY,
      ENEMY_ATTACK_HAMMER_ASSET_KEY,
    ).setOrigin(0.5, 0.5).setDisplaySize(hammerSize, hammerSize);
    hammer.setAngle(-18);
    this.effectLayer.add(hammer);
    this.cameras.main.shake(heavy ? 240 : 150, heavy ? 0.012 : 0.007);
    this.tweens.add({
      targets: hammer,
      x: anchors.player.x,
      y: anchors.player.bodyY,
      angle: heavy ? 1062 : 702,
      duration: heavy ? 700 : 520,
      ease: 'Linear',
      onComplete: () => {
        hammer.destroy();
        this.flashPlayer();
        this.showImpactBurst(anchors.player.x, anchors.player.bodyY, 0xfb7185, heavy);
        this.callbacks.onEffectImpact(command.id);
        this.knockCharacter('player', heavy ? -52 : -32, heavy ? 290 : 210);
      },
    });
  }

  private playOsmdHammerEffect(command: EarTrainingBattleEffectCommand): void {
    if (!this.effectLayer) {
      return;
    }
    this.holdCharacterForAction('enemy', 'attack', 760);
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const anchors = this.getBattleAnchors(width, height);
    const travelMs = Math.max(120, Math.round((command.travelDurationSec ?? 0.72) * 1000));
    const hammer = this.add.image(
      anchors.enemy.x - 28,
      anchors.enemy.bodyY - 8,
      ENEMY_ATTACK_HAMMER_ASSET_KEY,
    ).setOrigin(0.5, 0.5).setDisplaySize(76, 76);
    hammer.setAngle(-18);
    this.osmdHammerNodesByEffectId.set(command.id, hammer);
    this.effectLayer.add(hammer);
    this.tweens.add({
      targets: hammer,
      x: anchors.player.x,
      y: anchors.player.bodyY,
      angle: 720,
      duration: travelMs,
      ease: 'Linear',
      onComplete: () => {
        if (this.osmdHammerNodesByEffectId.get(command.id) !== hammer) {
          hammer.destroy();
          return;
        }
        this.osmdHammerNodesByEffectId.delete(command.id);
        hammer.destroy();
        this.flashPlayer();
        this.showImpactBurst(anchors.player.x, anchors.player.bodyY, 0xfb7185, false);
        this.callbacks.onEffectImpact(command.id);
        this.knockCharacter('player', -28, 180);
      },
    });
  }

  private playOsmdHammerReflectEffect(command: EarTrainingBattleEffectCommand): void {
    if (!this.effectLayer) {
      return;
    }
    this.holdCharacterForAction('player', 'cast', 620);
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const anchors = this.getBattleAnchors(width, height);
    const relatedId = command.relatedEffectId;
    const hammer = relatedId === undefined ? undefined : this.osmdHammerNodesByEffectId.get(relatedId);
    if (hammer && relatedId !== undefined) {
      this.osmdHammerNodesByEffectId.delete(relatedId);
      this.tweens.killTweensOf(hammer);
      hammer.setPosition(anchors.player.x, anchors.player.bodyY);
    }
    const reflected = hammer ?? this.add.image(
      anchors.player.x,
      anchors.player.bodyY,
      ENEMY_ATTACK_HAMMER_ASSET_KEY,
    ).setOrigin(0.5, 0.5).setDisplaySize(82, 82);
    if (!hammer) {
      this.effectLayer.add(reflected);
    }
    reflected.setAngle(18);
    this.showPlayerPose('cast', CORRECT_PLAYER_POSE_DURATION_MS);
    this.tweens.add({
      targets: reflected,
      x: anchors.enemy.x,
      y: anchors.enemy.bodyY,
      angle: -560,
      displayWidth: 92,
      displayHeight: 92,
      duration: 360,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        reflected.destroy();
        this.flashEnemy();
        this.showImpactBurst(anchors.enemy.x, anchors.enemy.bodyY, 0xfacc15, false);
        this.showEnemyDamageText(command.damage, anchors.enemy);
        this.callbacks.onEffectImpact(command.id);
        this.knockEnemyAfterDamage(22, 160);
      },
    });
  }

  private playOsmdMeteorEffect(command: EarTrainingBattleEffectCommand): void {
    if (!this.effectLayer) {
      return;
    }
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const anchors = this.getBattleAnchors(width, height);
    this.holdCharacterForAction('player', 'attack', 1320);
    this.showFloatingResultText(command.label ?? 'Bonus', anchors.player.x, anchors.player.resultTextY, '#fef08a');
    this.createCastEffect(anchors.player.x, anchors.player.castY, 1.8);
    this.launchMeteor(command, anchors);
  }

  private getBattleAnchors(width: number, height: number): BattleAnchors {
    const floorY = getFloorY(height);
    const createAnchors = (x: number): CharacterAnchors => ({
      x,
      footY: floorY,
      bodyY: floorY - CHARACTER_DISPLAY_SIZE * 0.52,
      headY: floorY - CHARACTER_DISPLAY_SIZE * 0.96,
      castY: floorY - CHARACTER_DISPLAY_SIZE * 0.42,
      resultTextY: floorY - CHARACTER_DISPLAY_SIZE * 1.12,
    });
    return {
      player: createAnchors(this.playerView?.container.x ?? width * 0.23),
      enemy: createAnchors(this.enemyView?.container.x ?? width * 0.77),
    };
  }

  /** コード名（オーバーレイ）→ プレイヤーへ短い緑のオーブを飛ばす軽量演出。140ms で完結。 */
  private playEnergyToPlayer(originX: number, originY: number, anchors: BattleAnchors): void {
    if (!this.effectLayer) {
      return;
    }
    const targetX = anchors.player.x;
    const targetY = anchors.player.castY;
    const orb = this.add.circle(originX, originY, 7, 0x86efac, 0.95);
    orb.setStrokeStyle(2, 0xbbf7d0, 0.9);
    const tail = this.add.circle(originX, originY, 14, 0x22c55e, 0.36);
    this.effectLayer.add([tail, orb]);
    this.tweens.add({
      targets: [orb, tail],
      x: targetX,
      y: targetY,
      alpha: 0,
      duration: 140,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        orb.destroy();
        tail.destroy();
      },
    });
  }

  private playGoodCompleteEffect(command: EarTrainingBattleEffectCommand, anchors: BattleAnchors): void {
    this.createCastEffect(anchors.player.x, anchors.player.castY, 1.35);
    const ring = this.createEffectSprite('fireRing', anchors.player.x + 42, anchors.player.castY, 64);
    ring.setAlpha(0.92);
    this.tweens.add({
      targets: ring,
      x: anchors.enemy.x,
      y: anchors.enemy.bodyY,
      angle: 540,
      displayWidth: 176,
      displayHeight: 176,
      alpha: 1,
      duration: 680,
      ease: 'Quart.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: ring,
          displayWidth: 226,
          displayHeight: 226,
          alpha: 0,
          duration: 260,
          ease: 'Cubic.easeOut',
          onComplete: () => ring.destroy(),
        });
        this.applyCompletionImpact(
          anchors,
          0xfacc15,
          84,
          330,
          0xfef08a,
          command.damage,
          () => this.callbacks.onEffectImpact(command.id),
        );
      },
    });
  }

  private playSnowflakeEffect(command: EarTrainingBattleEffectCommand, anchors: BattleAnchors): void {
    this.createCastEffect(anchors.player.x, anchors.player.castY, 1.6);
    const snowflakeGuide = this.createSnowflake(anchors.player.x + 42, anchors.player.castY, 38);
    const snowflake = this.createEffectSprite('snowflake', anchors.player.x + 42, anchors.player.castY, 72);
    this.effectLayer?.add(snowflakeGuide);
    this.tweens.add({
      targets: snowflake,
      x: anchors.enemy.x,
      y: anchors.enemy.bodyY,
      angle: 720,
      displayWidth: 154,
      displayHeight: 154,
      duration: 860,
      ease: 'Cubic.easeInOut',
    });
    this.tweens.add({
      targets: snowflakeGuide,
      x: anchors.enemy.x,
      y: anchors.enemy.bodyY,
      angle: 720,
      scale: 1.08,
      duration: 860,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        snowflake.destroy();
        snowflakeGuide.destroy();
        this.applyCompletionImpact(
          anchors,
          0x93c5fd,
          106,
          360,
          0x7dd3fc,
          command.damage,
          () => this.callbacks.onEffectImpact(command.id),
        );
      },
    });
  }

  private playLightningEffect(command: EarTrainingBattleEffectCommand, anchors: BattleAnchors): void {
    this.createCastEffect(anchors.player.x, anchors.player.castY, 1.9);
    const cloudBase = this.createCloud(anchors.enemy.x, anchors.enemy.headY - 28);
    const cloud = this.createEffectSprite('cloud', anchors.enemy.x, anchors.enemy.headY - 32, 148);
    cloud.setAlpha(0.9);
    this.effectLayer?.add(cloudBase);
    this.time.delayedCall(470, () => {
      const lightningGuide = this.createLightning(anchors.enemy.x, anchors.enemy.headY - 18, anchors.enemy.bodyY + 8, 0xfef08a);
      const lightning = this.createEffectSprite('lightning', anchors.enemy.x, anchors.enemy.bodyY - 34, 190);
      lightning.setAngle(4);
      this.effectLayer?.add(lightningGuide);
      this.applyCompletionImpact(
        anchors,
        0xfef08a,
        122,
        390,
        0xfef08a,
        command.damage,
        () => this.callbacks.onEffectImpact(command.id),
      );
      this.tweens.add({
        targets: [cloudBase, cloud, lightningGuide, lightning],
        alpha: 0,
        duration: 420,
        delay: 260,
        onComplete: () => {
          cloudBase.destroy();
          cloud.destroy();
          lightningGuide.destroy();
          lightning.destroy();
        },
      });
    });
  }

  private playMeteorEffect(command: EarTrainingBattleEffectCommand, anchors: BattleAnchors): void {
    this.zoomToPlayer(
      anchors,
      1080,
      () => this.showPlayerPoseSequence(SKILL_PLAYER_POSE_SEQUENCE, SKILL_PLAYER_POSE_FRAME_MS, false),
      () => this.launchMeteor(command, anchors),
    );
    this.createMagicCircle(anchors.player.x, anchors.player.footY - 12, 220);
    this.createCastEffect(anchors.player.x, anchors.player.castY, 2.65);
    this.createPlayerSparkles(anchors.player.x, anchors.player.bodyY, 1380, 0xfef08a, true);
    this.showChantText(anchors.player.x, anchors.player.headY - 38, 'Awesome!');
  }

  private launchMeteor(command: EarTrainingBattleEffectCommand, anchors: BattleAnchors): void {
    const meteorStartY = Math.max(HUD_HEIGHT + 8, anchors.enemy.headY - 230);
    const meteor = this.createEffectSprite('meteor', anchors.enemy.x - 148, meteorStartY, 230);
    meteor.setAngle(-8);
    this.tweens.add({
      targets: meteor,
      x: anchors.enemy.x,
      y: anchors.enemy.bodyY,
      displayWidth: 352,
      displayHeight: 352,
      angle: 10,
      duration: 980,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        meteor.destroy();
        this.applyCompletionImpact(
          anchors,
          0xf97316,
          172,
          460,
          0xffedd5,
          command.damage,
          () => this.callbacks.onEffectImpact(command.id),
        );
      },
    });
  }

  private applyCompletionImpact(
    anchors: BattleAnchors,
    color: number,
    knockbackDistance: number,
    knockbackDuration: number,
    tintColor: number,
    damage: number | undefined,
    onImpact: () => void,
  ): void {
    this.flashEnemy();
    this.tintEnemy(tintColor, knockbackDuration + 260);
    this.showImpactBurst(anchors.enemy.x, anchors.enemy.bodyY, color, true);
    this.showScreenFlash(color, 0.16);
    this.showCompletionAura(anchors.enemy.x, anchors.enemy.bodyY, color);
    this.showEnemyDamageText(damage, anchors.enemy);
    onImpact();
    this.restorePlayerPose();
    this.knockEnemyAfterDamage(knockbackDistance, knockbackDuration);
  }

  private createEffectSprite(spriteName: BattleEffectSpriteName, x: number, y: number, displaySize: number): Phaser.GameObjects.Image {
    const asset = BATTLE_EFFECT_SPRITE_ASSETS[spriteName];
    const sprite = this.add.image(x, y, asset.key).setOrigin(0.5, 0.5).setDisplaySize(displaySize, displaySize);
    this.effectLayer?.add(sprite);
    return sprite;
  }

  private showCompletionAura(x: number, y: number, color: number): void {
    if (!this.effectLayer) {
      return;
    }
    const aura = this.add.circle(x, y, 60, color, 0.14);
    aura.setStrokeStyle(5, color, 0.82);
    this.effectLayer.add(aura);
    this.tweens.add({
      targets: aura,
      scale: 2.15,
      alpha: 0,
      duration: 820,
      ease: 'Cubic.easeOut',
      onComplete: () => aura.destroy(),
    });
  }

  private createCastEffect(x: number, y: number, power: number): void {
    if (!this.effectLayer) {
      return;
    }
    const ring = this.add.circle(x, y, 30 * power, 0x38bdf8, 0.12);
    ring.setStrokeStyle(2 + power, 0xa5f3fc, 0.9);
    this.effectLayer.add(ring);
    this.tweens.add({
      targets: ring,
      scale: 1.5,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8;
      const spark = this.add.circle(x, y, 3 + power, 0xfef3c7, 0.86);
      this.effectLayer.add(spark);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 44 * power,
        y: y + Math.sin(angle) * 30 * power,
        alpha: 0,
        duration: 440,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  private zoomToPlayer(anchors: BattleAnchors, holdMs: number, onZoomedIn?: () => void, onReturned?: () => void): void {
    const camera = this.cameras.main;
    camera.pan(anchors.player.x, anchors.player.bodyY, 180, 'Sine.easeInOut');
    this.tweens.add({
      targets: camera,
      zoom: 1.98,
      duration: 180,
      ease: 'Sine.easeOut',
      onComplete: () => {
        onZoomedIn?.();
        this.time.delayedCall(holdMs, () => {
          camera.pan(this.scale.width / 2, this.scale.height / 2, 340, 'Sine.easeInOut');
          this.tweens.add({
            targets: camera,
            zoom: 1,
            duration: 340,
            ease: 'Sine.easeInOut',
            onComplete: () => {
              camera.setZoom(1);
              camera.centerOn(this.scale.width / 2, this.scale.height / 2);
              onReturned?.();
            },
          });
        });
      },
    });
  }

  private createPlayerSparkles(x: number, y: number, durationMs: number, color: number, intense: boolean): void {
    if (!this.effectLayer) {
      return;
    }
    const burstCount = intense ? 18 : 8;
    const sparklesPerBurst = intense ? 5 : 3;
    const intervalMs = Math.max(48, Math.floor(durationMs / burstCount));
    for (let burstIndex = 0; burstIndex < burstCount; burstIndex += 1) {
      this.time.delayedCall(burstIndex * intervalMs, () => {
        for (let sparkIndex = 0; sparkIndex < sparklesPerBurst; sparkIndex += 1) {
          const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
          const startRadius = Phaser.Math.FloatBetween(18, intense ? 72 : 52);
          const endRadius = startRadius + Phaser.Math.FloatBetween(28, intense ? 92 : 54);
          const startX = x + Math.cos(angle) * startRadius;
          const startY = y + Math.sin(angle) * startRadius;
          const sparkle = this.add.star(startX, startY, 5, intense ? 3 : 2, intense ? 8 : 6, color, 0.94);
          sparkle.setStrokeStyle(1, 0xffffff, 0.82);
          this.effectLayer?.add(sparkle);
          this.tweens.add({
            targets: sparkle,
            x: x + Math.cos(angle) * endRadius,
            y: y + Math.sin(angle) * endRadius,
            angle: Phaser.Math.Between(-180, 180),
            scale: intense ? 1.65 : 1.25,
            alpha: 0,
            duration: intense ? 640 : 420,
            ease: 'Cubic.easeOut',
            onComplete: () => sparkle.destroy(),
          });
        }
      });
    }
  }

  private showChantText(x: number, y: number, label: string): void {
    if (!this.effectLayer) {
      return;
    }
    const text = this.add.text(x, y, label, {
      color: '#fef08a',
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      stroke: '#7c2d12',
      strokeThickness: 6,
    }).setOrigin(0.5, 0.5);
    this.effectLayer.add(text);
    this.tweens.add({
      targets: text,
      y: y - 34,
      scale: 1.32,
      alpha: 0,
      duration: 1380,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  private createMagicCircle(x: number, y: number, size: number): void {
    if (!this.effectLayer) {
      return;
    }
    const circle = this.add.image(x, y, MAGIC_CIRCLE_ASSET_KEY).setOrigin(0.5, 0.5).setDisplaySize(size, size);
    circle.setAlpha(AWESOME_MAGIC_CIRCLE_ALPHA);
    circle.setBlendMode('ADD');
    this.effectLayer.add(circle);
    this.tweens.add({
      targets: circle,
      angle: 180,
      scale: 1.14,
      alpha: 0,
      duration: 1080,
      ease: 'Cubic.easeOut',
      onComplete: () => circle.destroy(),
    });
  }

  private createSnowflake(x: number, y: number, size: number): Phaser.GameObjects.Graphics {
    const snowflake = this.add.graphics();
    snowflake.setPosition(x, y);
    snowflake.lineStyle(5, 0xe0f2fe, 0.96);
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * index) / 3;
      const endX = Math.cos(angle) * size;
      const endY = Math.sin(angle) * size;
      snowflake.lineBetween(-endX, -endY, endX, endY);
      snowflake.lineBetween(endX * 0.68, endY * 0.68, Math.cos(angle + 0.52) * size * 0.82, Math.sin(angle + 0.52) * size * 0.82);
      snowflake.lineBetween(endX * 0.68, endY * 0.68, Math.cos(angle - 0.52) * size * 0.82, Math.sin(angle - 0.52) * size * 0.82);
    }
    snowflake.lineStyle(2, 0x38bdf8, 0.95);
    snowflake.strokeCircle(0, 0, size * 0.46);
    return snowflake;
  }

  private createCloud(x: number, y: number): Phaser.GameObjects.Container {
    const cloud = this.add.container(x, y);
    const parts = [
      this.add.ellipse(-28, 4, 52, 30, 0xe0f2fe, 0.86),
      this.add.ellipse(0, -4, 66, 38, 0xf8fafc, 0.92),
      this.add.ellipse(32, 5, 56, 30, 0xbae6fd, 0.86),
      this.add.rectangle(0, 14, 88, 18, 0xe0f2fe, 0.82),
    ];
    cloud.add(parts);
    this.tweens.add({
      targets: cloud,
      y: y - 8,
      yoyo: true,
      repeat: 1,
      duration: 240,
      ease: 'Sine.easeInOut',
    });
    return cloud;
  }

  private createLightning(x: number, startY: number, endY: number, color: number): Phaser.GameObjects.Graphics {
    const lightning = this.add.graphics();
    lightning.lineStyle(7, color, 1);
    lightning.lineBetween(x, startY, x - 18, startY + 34);
    lightning.lineBetween(x - 18, startY + 34, x + 16, startY + 70);
    lightning.lineBetween(x + 16, startY + 70, x - 8, endY);
    lightning.lineStyle(3, 0xffffff, 0.95);
    lightning.lineBetween(x + 2, startY, x - 12, startY + 34);
    lightning.lineBetween(x - 12, startY + 34, x + 18, startY + 70);
    lightning.lineBetween(x + 18, startY + 70, x - 4, endY);
    return lightning;
  }

  private showFloatingResultText(label: string, x: number, y: number, color: string): void {
    if (!this.effectLayer) {
      return;
    }
    const text = this.add.text(x, y, label, {
      color,
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: '900',
      stroke: '#020617',
      strokeThickness: 6,
    }).setOrigin(0.5, 0.5);
    this.effectLayer.add(text);
    this.tweens.add({
      targets: text,
      y: y - 58,
      alpha: 0,
      scale: 1.18,
      duration: 920,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  private showEnemyDamageText(damage: number | undefined, anchors: CharacterAnchors): void {
    if (!this.effectLayer || damage === undefined) {
      return;
    }
    const displayDamage = Math.round(Math.abs(damage));
    if (displayDamage <= 0) {
      return;
    }
    const text = this.add.text(anchors.x + 28, anchors.headY + 18, `${displayDamage}`, {
      color: '#fecaca',
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      stroke: '#450a0a',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5);
    this.effectLayer.add(text);
    this.tweens.add({
      targets: text,
      y: anchors.headY - 18,
      x: anchors.x + 38,
      alpha: 0,
      scale: 1.08,
      duration: 720,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  private showImpactBurst(x: number, y: number, color: number, large: boolean): void {
    if (!this.effectLayer) {
      return;
    }
    const ring = this.add.circle(x, y, large ? 46 : 24, color, 0.16);
    ring.setStrokeStyle(large ? 7 : 3, 0xffffff, large ? 0.9 : 0.72);
    this.effectLayer.add(ring);
    this.tweens.add({
      targets: ring,
      scale: large ? 2.25 : 1.6,
      alpha: 0,
      duration: large ? 740 : 420,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });

    const sparkCount = large ? 22 : 9;
    for (let index = 0; index < sparkCount; index += 1) {
      const angle = (Math.PI * 2 * index) / sparkCount;
      const spark = this.add.circle(x, y, large ? 5 : 3, color, 0.9);
      this.effectLayer.add(spark);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * (large ? 104 : 44),
        y: y + Math.sin(angle) * (large ? 68 : 30),
        alpha: 0,
        duration: large ? 680 : 360,
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  private showScreenFlash(color: number, alpha: number): void {
    if (!this.effectLayer) {
      return;
    }
    const flash = this.add.rectangle(
      0,
      0,
      Math.max(320, this.scale.width),
      Math.max(480, this.scale.height),
      color,
      alpha,
    ).setOrigin(0, 0);
    this.effectLayer.add(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 360,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  private tintEnemy(color: number, duration: number): void {
    if (!this.enemyView) {
      return;
    }
    this.enemyView.image?.setTint(color);
    this.enemyView.fallback.setColor(`#${color.toString(16).padStart(6, '0')}`);
    this.time.delayedCall(duration, () => {
      this.enemyView?.image?.clearTint();
      this.enemyView?.fallback.setColor('#ffffff');
    });
  }

  private stopAllCharacterMotion(): void {
    if (this.playerView) {
      this.stopCharacterMotion(this.playerView);
    }
    if (this.enemyView) {
      this.stopCharacterMotion(this.enemyView);
    }
  }

  private clearOsmdHammers(): void {
    this.osmdHammerNodesByEffectId.forEach(hammer => {
      this.tweens.killTweensOf(hammer);
      hammer.destroy();
    });
    this.osmdHammerNodesByEffectId.clear();
  }

  private stopCharacterMotion(view: CharacterView): void {
    view.motion.token += 1;
    view.motion.idleEvent?.remove(false);
    view.motion.resumeEvent?.remove(false);
    view.motion.motionTween?.stop();
    view.motion.idleEvent = null;
    view.motion.resumeEvent = null;
    view.motion.motionTween = null;
  }

  private startCharacterAutoMotion(
    view: CharacterView | null,
    idleMinMs: number,
    idleMaxMs: number,
  ): void {
    if (!view || view.motion.state === 'dead') {
      return;
    }

    this.stopCharacterMotion(view);
    view.motion.state = 'idle';
    view.motion.targetX = clampBattleCharacterX(view.container.x, view.motion.range);
    view.container.setPosition(view.motion.targetX, getFloorY(Math.max(480, this.scale.height)));
    view.container.setAngle(0);

    const token = view.motion.token;
    const delayMs = Phaser.Math.Between(idleMinMs, idleMaxMs);
    view.motion.idleEvent = this.time.delayedCall(delayMs, () => {
      if (view.motion.token !== token || view.motion.state !== 'idle') {
        return;
      }
      this.startCharacterWalk(view);
    });
  }

  private startCharacterWalk(view: CharacterView): void {
    if (view.motion.state === 'dead') {
      return;
    }

    this.stopCharacterMotion(view);
    view.motion.state = 'walk';
    view.motion.targetX = this.pickCharacterTargetX(view);
    const currentX = clampBattleCharacterX(view.container.x, view.motion.range);
    const distance = Math.abs(view.motion.targetX - currentX);
    if (distance < 2) {
      this.startCharacterAutoMotion(view, RECOVER_IDLE_MIN_MS, RECOVER_IDLE_MAX_MS);
      return;
    }

    view.container.setPosition(currentX, getFloorY(Math.max(480, this.scale.height)));
    const token = view.motion.token;
    view.motion.motionTween = this.tweens.add({
      targets: view.container,
      x: view.motion.targetX,
      duration: Math.max(140, Math.round((distance / view.motion.range.speed) * 1000)),
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (view.motion.token !== token || view.motion.state !== 'walk') {
          return;
        }
        view.motion.motionTween = null;
        this.startCharacterAutoMotion(view, AUTO_IDLE_MIN_MS, AUTO_IDLE_MAX_MS);
      },
    });
  }

  private pickCharacterTargetX(view: CharacterView): number {
    const otherX = this.getOtherCharacterX(view.motion.side);
    const minDistance = getBattleCharacterMinDistance(Math.max(320, this.scale.width));
    const rangeSpan = view.motion.range.maxX - view.motion.range.minX;
    const homeSpread = Math.min(84, rangeSpan * 0.78);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const offset = Phaser.Math.FloatBetween(-homeSpread, homeSpread);
      const candidate = clampBattleCharacterX(view.motion.range.homeX + offset, view.motion.range);
      if (otherX === null || Math.abs(candidate - otherX) >= minDistance) {
        return candidate;
      }
    }

    if (otherX === null) {
      return view.motion.range.homeX;
    }

    const fallback = view.motion.side === 'player'
      ? Math.min(view.motion.range.maxX, otherX - minDistance)
      : Math.max(view.motion.range.minX, otherX + minDistance);
    return clampBattleCharacterX(fallback, view.motion.range);
  }

  private getOtherCharacterX(side: CharacterSide): number | null {
    if (side === 'player') {
      return this.enemyView?.container.x ?? null;
    }
    return this.playerView?.container.x ?? null;
  }

  private holdCharacterForAction(side: CharacterSide, state: 'cast' | 'attack', durationMs: number): void {
    const view = side === 'player' ? this.playerView : this.enemyView;
    if (!view || view.motion.state === 'dead') {
      return;
    }

    this.stopCharacterMotion(view);
    view.motion.state = state;
    view.container.setPosition(clampBattleCharacterX(view.container.x, view.motion.range), getFloorY(Math.max(480, this.scale.height)));
    view.container.setAngle(0);

    const token = view.motion.token;
    view.motion.resumeEvent = this.time.delayedCall(durationMs, () => {
      if (view.motion.token !== token || view.motion.state !== state) {
        return;
      }
      this.startCharacterAutoMotion(view, ACTION_RESUME_IDLE_MS, ACTION_RESUME_IDLE_MS);
    });
  }

  private scheduleCharacterRecover(view: CharacterView, onComplete?: () => void): void {
    view.motion.state = 'recover';
    view.motion.motionTween = null;
    const token = view.motion.token;
    view.motion.resumeEvent = this.time.delayedCall(360, () => {
      if (view.motion.token !== token || view.motion.state !== 'recover') {
        return;
      }
      this.startCharacterAutoMotion(view, RECOVER_IDLE_MIN_MS, RECOVER_IDLE_MAX_MS);
    });
    onComplete?.();
  }

  private syncCharacterLifeState(snapshot: EarTrainingBattleSnapshot): void {
    this.syncCharacterDeadState(this.playerView, snapshot.playerHp <= 0);
    this.syncCharacterDeadState(this.enemyView, snapshot.enemyHp <= 0);
  }

  private syncCharacterDeadState(view: CharacterView | null, dead: boolean): void {
    if (!view) {
      return;
    }
    if (dead) {
      if (view.motion.state !== 'dead') {
        this.stopCharacterMotion(view);
        view.motion.state = 'dead';
        view.container.setAngle(0);
      }
      return;
    }
    if (view.motion.state === 'dead') {
      view.motion.state = 'idle';
      if (!this.snapshot?.fixedCharacterPositions) {
        this.startCharacterAutoMotion(view, RECOVER_IDLE_MIN_MS, RECOVER_IDLE_MAX_MS);
      }
    }
  }

  private getRankColor(label: string): string {
    if (label === 'Awesome!' || label === 'Perfect') {
      return '#fef08a';
    }
    if (label === 'Great') {
      return '#bfdbfe';
    }
    if (label === 'Good') {
      return '#bbf7d0';
    }
    return '#fecaca';
  }

  private knockCharacter(side: CharacterSide, distance: number, duration: number, onComplete?: () => void): void {
    const view = side === 'player' ? this.playerView : this.enemyView;
    if (!view) {
      onComplete?.();
      return;
    }
    if (view.motion.state === 'dead') {
      onComplete?.();
      return;
    }
    if (this.snapshot?.fixedCharacterPositions) {
      this.stopCharacterMotion(view);
      view.motion.state = 'idle';
      const floorY = getFloorY(Math.max(480, this.scale.height));
      const homeX = clampBattleCharacterX(view.motion.range.homeX, view.motion.range);
      view.container.setPosition(homeX, floorY);
      view.container.setAngle(0);
      onComplete?.();
      return;
    }

    this.stopCharacterMotion(view);
    view.motion.state = 'knockback';
    const floorY = getFloorY(Math.max(480, this.scale.height));
    const startX = clampBattleCharacterX(view.container.x, view.motion.range);
    const targetX = clampBattleCharacterX(startX + distance, view.motion.range);
    view.container.setPosition(startX, floorY);
    view.container.setAngle(0);
    const pushDuration = Math.max(80, Math.floor(duration * 0.65));
    const returnDuration = Math.max(120, duration - pushDuration);
    const rotation = distance >= 0 ? 4 : -4;
    const pushTween = this.tweens.add({
      targets: view.container,
      x: targetX,
      y: floorY - 10,
      angle: rotation,
      duration: pushDuration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        const returnTween = this.tweens.add({
          targets: view.container,
          y: floorY,
          angle: 0,
          duration: returnDuration,
          ease: 'Back.easeOut',
          onComplete: () => {
            view.container.setPosition(targetX, floorY);
            view.container.setAngle(0);
            this.scheduleCharacterRecover(view, onComplete);
          },
        });
        view.motion.motionTween = returnTween;
      },
    });
    view.motion.motionTween = pushTween;
  }

  private knockEnemyAfterDamage(distance: number, duration: number): void {
    this.time.delayedCall(ENEMY_KNOCKBACK_AFTER_DAMAGE_DELAY_MS, () => {
      this.knockCharacter('enemy', distance, duration);
    });
  }

  private flashEnemy(): void {
    if (!this.enemyView) {
      return;
    }
    this.tweens.add({
      targets: this.enemyView.container,
      alpha: 0.35,
      yoyo: true,
      repeat: 2,
      duration: 70,
      onComplete: () => this.enemyView?.container.setAlpha(1),
    });
  }

  private flashPlayer(): void {
    if (!this.playerView) {
      return;
    }
    this.tweens.add({
      targets: this.playerView.container,
      alpha: 0.35,
      yoyo: true,
      repeat: 3,
      duration: 80,
      onComplete: () => this.playerView?.container.setAlpha(1),
    });
  }

  private showCorrectPlayerPose(): void {
    this.showPlayerPose('correct3', CORRECT_PLAYER_POSE_DURATION_MS);
  }

  private playVoicingCastEffect(): void {
    this.holdCharacterForAction('player', 'cast', CORRECT_PLAYER_POSE_DURATION_MS);
    this.showPlayerPose('cast', CORRECT_PLAYER_POSE_DURATION_MS);
  }

  private showPlayerPoseSequence(poseNames: PlayerAvatarPoseName[], frameDurationMs: number, restoreOnComplete: boolean): void {
    const [firstPoseName, ...remainingPoseNames] = poseNames;
    if (!firstPoseName) {
      return;
    }
    const token = this.setPlayerPose(firstPoseName);
    if (!token) {
      return;
    }
    remainingPoseNames.forEach((poseName, index) => {
      this.time.delayedCall(frameDurationMs * (index + 1), () => {
        if (this.playerPoseToken !== token) {
          return;
        }
        this.applyPlayerPose(poseName);
      });
    });
    if (!restoreOnComplete) {
      return;
    }
    this.time.delayedCall(frameDurationMs * poseNames.length, () => this.restorePlayerPose(token));
  }

  private showPlayerPose(poseName: PlayerAvatarPoseName, durationMs?: number): void {
    const token = this.setPlayerPose(poseName);
    if (!token || durationMs === undefined) {
      return;
    }
    this.time.delayedCall(durationMs, () => this.restorePlayerPose(token));
  }

  private setPlayerPose(poseName: PlayerAvatarPoseName): number | null {
    if (!this.applyPlayerPose(poseName)) {
      return null;
    }
    const token = this.playerPoseToken + 1;
    this.playerPoseToken = token;
    return token;
  }

  private applyPlayerPose(poseName: PlayerAvatarPoseName): boolean {
    const view = this.playerView;
    const asset = PLAYER_AVATAR_POSE_ASSETS[poseName];
    if (!view || !this.textures.exists(asset.key)) {
      return false;
    }
    let image = view.image;
    if (!image) {
      image = this.add.image(0, 0, asset.key).setOrigin(0.5, 1);
      view.image = image;
      view.container.add(image);
    }
    image
      .setTexture(asset.key)
      .setFlipX(false)
      .setDisplaySize(CHARACTER_DISPLAY_SIZE, CHARACTER_DISPLAY_SIZE);
    view.fallback.setVisible(false);
    this.activePlayerPoseName = poseName;
    return true;
  }

  private restorePlayerPose(token?: number): void {
    if (token !== undefined && token !== this.playerPoseToken) {
      return;
    }
    const view = this.playerView;
    const avatarUrl = this.snapshot?.playerAvatarUrl;
    if (!view || !avatarUrl) {
      return;
    }
    const defaultTextureKey = hashText(avatarUrl);
    if (!this.textures.exists(defaultTextureKey)) {
      return;
    }
    let image = view.image;
    if (!image) {
      image = this.add.image(0, 0, defaultTextureKey).setOrigin(0.5, 1);
      view.image = image;
      view.container.add(image);
    }
    this.activePlayerPoseName = null;
    this.playerPoseToken = 0;
    image
      .setTexture(defaultTextureKey)
      .setFlipX(false)
      .setDisplaySize(CHARACTER_DISPLAY_SIZE, CHARACTER_DISPLAY_SIZE);
    view.fallback.setVisible(false);
  }

  private loadAvatarTextures(snapshot: EarTrainingBattleSnapshot): void {
    const queuedKeys: string[] = [];
    [snapshot.playerAvatarUrl, snapshot.enemyAvatarUrl].forEach(url => {
      if (!url) {
        return;
      }
      const key = hashText(url);
      if (this.textures.exists(key) || this.loadingTextureKeys.has(key)) {
        return;
      }
      this.loadingTextureKeys.add(key);
      queuedKeys.push(key);
      this.load.image(key, url);
    });
    if (queuedKeys.length === 0) {
      return;
    }
    this.load.once('complete', () => {
      queuedKeys.forEach(key => this.loadingTextureKeys.delete(key));
      this.queueSceneRebuild();
    });
    this.load.start();
  }
}
