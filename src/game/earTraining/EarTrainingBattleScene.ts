import Phaser from 'phaser';
import type {
  EarTrainingBattleCallbacks,
  EarTrainingBattleEffectCommand,
  EarTrainingBattleSceneHandle,
  EarTrainingBattleSnapshot,
} from './types';
import { EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS } from '@/utils/constants';

const PIANO_OVERLAY_HEIGHT = 120;
const HUD_HEIGHT = 150;
const PHRASE_INTRO_FADE_MS = 2600;
const FLOOR_CLEARANCE_FROM_PIANO = 100;
const FLOOR_BAND_OVERLAP = 16;
const CHARACTER_DISPLAY_SIZE = 116;
const CHARACTER_SHADOW_WIDTH = 104;
const CHARACTER_SHADOW_HEIGHT = 22;
const JAZZ_WALL_TILE_KEY = 'ear-training-jazz-wall-tile';
const JAZZ_FLOOR_TILE_KEY = 'ear-training-jazz-floor-tile';
const JAZZ_WALL_TILE_SIZE = 64;
const JAZZ_FLOOR_TILE_WIDTH = 96;
const JAZZ_FLOOR_TILE_HEIGHT = 48;
const EFFECT_ASSET_PATH = '/ear-training/tutorial-earcopy-test/';
const FUKIDASHI_ASSET_KEY = 'ear-training-fukidashi';
const FUKIDASHI_ASSET_URL = `${EFFECT_ASSET_PATH}fukidashi.png`;
const ENEMY_KNOCKBACK_AFTER_DAMAGE_DELAY_MS = 16;

type BattleEffectSpriteName = 'cloud' | 'fireRing' | 'fireball' | 'lightning' | 'meteor' | 'snowflake';
type CharacterSide = 'player' | 'enemy';

interface BattleEffectSpriteAsset {
  key: string;
  url: string;
}

const BATTLE_EFFECT_SPRITE_ASSETS: Record<BattleEffectSpriteName, BattleEffectSpriteAsset> = {
  cloud: {
    key: 'ear-training-effect-cloud',
    url: `${EFFECT_ASSET_PATH}effect-cloud-transparent.png`,
  },
  fireRing: {
    key: 'ear-training-effect-fire-ring',
    url: `${EFFECT_ASSET_PATH}effect-fire-ring-transparent.png`,
  },
  fireball: {
    key: 'ear-training-effect-fireball',
    url: `${EFFECT_ASSET_PATH}effect-fireball-transparent.png`,
  },
  lightning: {
    key: 'ear-training-effect-lightning',
    url: `${EFFECT_ASSET_PATH}effect-lightning-transparent.png`,
  },
  meteor: {
    key: 'ear-training-effect-meteor',
    url: `${EFFECT_ASSET_PATH}effect-meteor-transparent.png`,
  },
  snowflake: {
    key: 'ear-training-effect-snowflake',
    url: `${EFFECT_ASSET_PATH}effect-snowflake-transparent.png`,
  },
};

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
  private phraseIntroText: Phaser.GameObjects.Text | null = null;
  private lastPhraseIntroKey: string | null = null;
  private lastEffectId: number | null = null;
  private isReady = false;

  constructor() {
    super({ key: 'EarTrainingBattleScene' });
  }

  preload(): void {
    this.loadBattleEffectSprites();
  }

  create(): void {
    this.isReady = true;
    this.cameras.main.setBackgroundColor('#070817');
    this.scale.on('resize', this.handleResize, this);
    this.rebuildScene();
    if (this.snapshot) {
      this.loadAvatarTextures(this.snapshot);
    }
  }

  shutdown(): void {
    this.isReady = false;
    this.scale.off('resize', this.handleResize, this);
  }

  setCallbacks(callbacks: EarTrainingBattleCallbacks): void {
    this.callbacks = callbacks;
  }

  updateSnapshot(snapshot: EarTrainingBattleSnapshot): void {
    this.snapshot = snapshot;
    if (!this.isReady) {
      return;
    }
    this.rebuildScene();
    this.loadAvatarTextures(snapshot);
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

  private handleResize = (): void => {
    this.rebuildScene();
  };

  private loadBattleEffectSprites(): void {
    Object.values(BATTLE_EFFECT_SPRITE_ASSETS).forEach(asset => {
      if (this.textures.exists(asset.key)) {
        return;
      }
      this.load.image(asset.key, asset.url);
    });
    if (!this.textures.exists(FUKIDASHI_ASSET_KEY)) {
      this.load.image(FUKIDASHI_ASSET_KEY, FUKIDASHI_ASSET_URL);
    }
  }

  private rebuildScene(): void {
    this.clearScene();

    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);

    this.backgroundLayer = this.add.container(0, 0);
    this.characterLayer = this.add.container(0, 0);
    this.hudLayer = this.add.container(0, 0);
    this.phraseLayer = this.add.container(0, 0);
    const effectLayer = this.effectLayer ?? this.add.container(0, 0);
    this.effectLayer = effectLayer;

    this.drawBackground(width, height);
    this.drawHud(width);
    this.drawCharacters(width, height);
    this.drawPhraseIntro(width, height);
    this.drawPhraseSlots(width, height);
    this.drawLobbyOverlay(width, height);
    this.children.bringToTop(effectLayer);
  }

  private clearScene(): void {
    this.backgroundLayer?.destroy(true);
    this.characterLayer?.destroy(true);
    this.hudLayer?.destroy(true);
    this.phraseLayer?.destroy(true);
    this.playerView = null;
    this.enemyView = null;
  }

  private drawBackground(width: number, height: number): void {
    if (!this.backgroundLayer) {
      return;
    }

    this.ensureJazzClubBackgroundTextures();

    const floorY = getFloorY(height);
    const wallHeight = Math.max(0, floorY - FLOOR_BAND_OVERLAP);
    const floorHeight = Math.max(0, height - floorY + FLOOR_BAND_OVERLAP);
    const wall = this.add.tileSprite(0, 0, width, wallHeight, JAZZ_WALL_TILE_KEY).setOrigin(0, 0);
    const floor = this.add.tileSprite(0, floorY - FLOOR_BAND_OVERLAP, width, floorHeight, JAZZ_FLOOR_TILE_KEY).setOrigin(0, 0);
    const background = this.add.graphics();
    background.fillGradientStyle(0x050614, 0x0f102e, 0x18091d, 0x2a0d2f, 0.64);
    background.fillRect(0, 0, width, height);
    background.fillStyle(0x020617, 0.2);
    background.fillRect(0, 0, width, HUD_HEIGHT + 28);
    background.fillStyle(0x000000, 0.18);
    background.fillRect(0, floorY - FLOOR_BAND_OVERLAP, width, floorHeight);
    background.lineStyle(2, 0xfbbf24, 0.16);
    background.lineBetween(0, floorY, width, floorY);
    background.fillStyle(0x000000, 0.2);
    background.fillEllipse(width * 0.23, floorY + 6, 168, 28);
    background.fillEllipse(width * 0.77, floorY + 6, 168, 28);
    this.backgroundLayer.add([wall, floor, background]);
  }

  private ensureJazzClubBackgroundTextures(): void {
    if (!this.textures.exists(JAZZ_WALL_TILE_KEY)) {
      const wallTexture = this.add.graphics();
      wallTexture.fillStyle(0x160818, 1);
      wallTexture.fillRect(0, 0, JAZZ_WALL_TILE_SIZE, JAZZ_WALL_TILE_SIZE);
      wallTexture.fillStyle(0x24102b, 0.78);
      wallTexture.fillRect(2, 2, JAZZ_WALL_TILE_SIZE - 4, JAZZ_WALL_TILE_SIZE - 4);
      wallTexture.fillStyle(0x110614, 0.42);
      wallTexture.fillRect(0, 0, JAZZ_WALL_TILE_SIZE, 8);
      wallTexture.lineStyle(1, 0xfde68a, 0.06);
      wallTexture.lineBetween(0, 0, 0, JAZZ_WALL_TILE_SIZE);
      wallTexture.lineBetween(JAZZ_WALL_TILE_SIZE - 1, 0, JAZZ_WALL_TILE_SIZE - 1, JAZZ_WALL_TILE_SIZE);
      wallTexture.lineStyle(1, 0xffffff, 0.035);
      wallTexture.lineBetween(8, 12, JAZZ_WALL_TILE_SIZE - 8, 12);
      wallTexture.lineBetween(8, JAZZ_WALL_TILE_SIZE - 12, JAZZ_WALL_TILE_SIZE - 8, JAZZ_WALL_TILE_SIZE - 12);
      wallTexture.generateTexture(JAZZ_WALL_TILE_KEY, JAZZ_WALL_TILE_SIZE, JAZZ_WALL_TILE_SIZE);
      wallTexture.destroy();
    }

    if (!this.textures.exists(JAZZ_FLOOR_TILE_KEY)) {
      const floorTexture = this.add.graphics();
      floorTexture.fillStyle(0x12070a, 1);
      floorTexture.fillRect(0, 0, JAZZ_FLOOR_TILE_WIDTH, JAZZ_FLOOR_TILE_HEIGHT);
      floorTexture.fillStyle(0x26100d, 0.92);
      floorTexture.fillRect(0, 0, JAZZ_FLOOR_TILE_WIDTH, 15);
      floorTexture.fillStyle(0x1f0d0b, 0.92);
      floorTexture.fillRect(0, 16, JAZZ_FLOOR_TILE_WIDTH, 15);
      floorTexture.fillStyle(0x2f1510, 0.82);
      floorTexture.fillRect(0, 32, JAZZ_FLOOR_TILE_WIDTH, 16);
      floorTexture.lineStyle(1, 0xf59e0b, 0.08);
      floorTexture.lineBetween(0, 15, JAZZ_FLOOR_TILE_WIDTH, 15);
      floorTexture.lineBetween(0, 31, JAZZ_FLOOR_TILE_WIDTH, 31);
      floorTexture.lineStyle(1, 0x000000, 0.18);
      floorTexture.lineBetween(0, 0, 0, JAZZ_FLOOR_TILE_HEIGHT);
      floorTexture.lineBetween(JAZZ_FLOOR_TILE_WIDTH - 1, 0, JAZZ_FLOOR_TILE_WIDTH - 1, JAZZ_FLOOR_TILE_HEIGHT);
      floorTexture.generateTexture(JAZZ_FLOOR_TILE_KEY, JAZZ_FLOOR_TILE_WIDTH, JAZZ_FLOOR_TILE_HEIGHT);
      floorTexture.destroy();
    }
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

    this.drawUtilityButton(width - 118, 58, 46, snapshot.hudLabels.settings, () => this.callbacks.onOpenSettings());
    this.drawUtilityButton(width - 66, 58, 46, snapshot.hudLabels.backShort, () => this.callbacks.onBack());
    this.drawChordHud(width, 104);

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
    const labelText = this.add.text(x, y, `${hp}/${maxHp}`, {
      color: isPlayer ? '#bbf7d0' : '#ffe4e6',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      fontStyle: '900',
    }).setOrigin(0, 0);
    const frame = this.add.rectangle(x, y + 24, width, 12, 0x020617, 0.9).setOrigin(0, 0);
    frame.setStrokeStyle(1, 0xffffff, 0.14);
    const fill = this.add.rectangle(x + 2, y + 26, Math.max(0, (width - 4) * percent), 8, barColor, 1).setOrigin(0, 0);
    this.hudLayer.add([labelText, frame, fill]);
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

  private drawUtilityButton(x: number, y: number, width: number, label: string, onClick: () => void): void {
    if (!this.hudLayer) {
      return;
    }
    const button = this.add.rectangle(x, y, width, 28, 0x020617, 0.72).setOrigin(0, 0);
    button.setStrokeStyle(1, 0xffffff, 0.16);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', onClick);
    const text = this.add.text(x + width / 2, y + 14, label, {
      color: '#e2e8f0',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
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
    return { container, image, fallback };
  }

  private drawEnemyAttackGauge(x: number, y: number): void {
    const snapshot = this.snapshot;
    if (!snapshot || !this.characterLayer) {
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
    this.characterLayer.add([label, frame, fill]);
  }

  private drawDemoBubble(x: number, y: number): void {
    if (!this.characterLayer || !this.textures.exists(FUKIDASHI_ASSET_KEY)) {
      return;
    }

    const bubbleX = Phaser.Math.Clamp(x + 62, 56, Math.max(320, this.scale.width) - 56);
    const bubble = this.add.image(bubbleX, y + 18, FUKIDASHI_ASSET_KEY)
      .setOrigin(0.5, 0.72)
      .setDisplaySize(112, 84)
      .setAlpha(0.96);
    this.characterLayer.add(bubble);
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

    const introKey = `${snapshot.phraseIndex}:${snapshot.totalPhrases}`;
    if (this.lastPhraseIntroKey === introKey) {
      return;
    }

    this.lastPhraseIntroKey = introKey;
    this.phraseIntroText?.destroy();
    const y = Math.max(HUD_HEIGHT + 42, getFloorY(height) - 220);
    const text = this.add.text(width / 2, y, snapshot.phraseIntroLine, {
      color: '#fef3c7',
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: '900',
      stroke: '#020617',
      strokeThickness: 5,
    }).setOrigin(0.5, 0.5);
    text.setAlpha(0.95);
    this.phraseIntroText = text;
    this.effectLayer.add(text);
    this.tweens.add({
      targets: text,
      y: y - 24,
      alpha: 0,
      duration: PHRASE_INTRO_FADE_MS,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        text.destroy();
        if (this.phraseIntroText === text) {
          this.phraseIntroText = null;
        }
      },
    });
  }

  private drawPhraseSlots(width: number, height: number): void {
    const snapshot = this.snapshot;
    if (!snapshot || !this.phraseLayer) {
      return;
    }
    const slots = snapshot.phraseSlots.length > 0 ? snapshot.phraseSlots : ['_'];
    const slotSize = Phaser.Math.Clamp((width - 48) / Math.min(Math.max(8, slots.length), 11), 34, 54);
    const gap = 7;
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

    visibleSlots.forEach((_slot, visibleIndex) => {
      const index = firstVisibleIndex + visibleIndex;
      const revealed = index < snapshot.revealedNotes.length;
      const current = index === snapshot.currentNoteIndex && snapshot.gameState === 'playingPhrase';
      const x = startX + visibleIndex * (slotSize + gap);
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

    if (snapshot.resultState === 'win' && snapshot.resultRankLine) {
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
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const anchors = this.getBattleAnchors(width, height);
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
    const anchors = this.getBattleAnchors(width, height);
    const label = command.label ?? 'Good';
    const isSuperPerfect = label === 'Perfect' && (command.phraseNoteCount ?? 0) >= 6;
    const displayLabel = isSuperPerfect ? 'Awesome!' : label;
    this.showFloatingResultText(displayLabel, anchors.player.x, anchors.player.resultTextY, this.getRankColor(displayLabel));

    if (isSuperPerfect) {
      this.playMeteorEffect(command, anchors);
      return;
    }
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
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const anchors = this.getBattleAnchors(width, height);
    if (heavy) {
      this.showFloatingResultText(command.label ?? 'Fail', anchors.player.x, anchors.player.resultTextY, '#fecaca');
    }
    this.knockCharacter('enemy', -18, 170);
    const slash = this.add.rectangle(anchors.enemy.x - 28, anchors.enemy.bodyY, heavy ? 128 : 78, heavy ? 22 : 15, 0xfb7185, 1);
    slash.setStrokeStyle(2, 0xfdf2f8, 0.82);
    slash.setRotation(-0.18);
    this.effectLayer.add(slash);
    this.cameras.main.shake(heavy ? 240 : 150, heavy ? 0.012 : 0.007);
    this.tweens.add({
      targets: slash,
      x: anchors.player.x,
      y: anchors.player.bodyY,
      scaleX: 1.6,
      alpha: 0,
      duration: heavy ? 700 : 520,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        slash.destroy();
        this.flashPlayer();
        this.showImpactBurst(anchors.player.x, anchors.player.bodyY, 0xfb7185, heavy);
        this.knockCharacter('player', heavy ? -52 : -32, heavy ? 290 : 210, () => this.callbacks.onEffectImpact(command.id));
      },
    });
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
      player: createAnchors(width * 0.23),
      enemy: createAnchors(width * 0.77),
    };
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
    this.zoomToPlayer(anchors, 1080, () => this.launchMeteor(command, anchors));
    this.createMagicCircle(anchors.player.x, anchors.player.footY - 12, 190, 0xf97316);
    this.createMagicCircle(anchors.player.x, anchors.player.footY - 12, 138, 0xfef08a);
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

  private zoomToPlayer(anchors: BattleAnchors, holdMs: number, onReturned?: () => void): void {
    const camera = this.cameras.main;
    camera.pan(anchors.player.x, anchors.player.bodyY, 240, 'Sine.easeInOut');
    this.tweens.add({
      targets: camera,
      zoom: 1.98,
      duration: 280,
      ease: 'Sine.easeOut',
    });
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

  private createMagicCircle(x: number, y: number, size: number, color: number): void {
    if (!this.effectLayer) {
      return;
    }
    const circle = this.add.graphics();
    circle.lineStyle(3, color, 0.86);
    circle.strokeCircle(0, 0, size / 2);
    circle.lineStyle(2, 0xfef3c7, 0.72);
    circle.strokeCircle(0, 0, size * 0.32);
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      circle.lineBetween(
        Math.cos(angle) * size * 0.18,
        Math.sin(angle) * size * 0.18,
        Math.cos(angle + Math.PI) * size * 0.44,
        Math.sin(angle + Math.PI) * size * 0.44,
      );
    }
    circle.setPosition(x, y);
    this.effectLayer.add(circle);
    this.tweens.add({
      targets: circle,
      angle: 180,
      scale: 1.18,
      alpha: 0,
      duration: 920,
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
    const startX = view.container.x;
    const startY = view.container.y;
    const pushDuration = Math.max(80, Math.floor(duration * 0.38));
    const returnDuration = Math.max(120, duration - pushDuration);
    const rotation = distance >= 0 ? 4 : -4;
    this.tweens.add({
      targets: view.container,
      x: startX + distance,
      y: startY - 10,
      angle: rotation,
      duration: pushDuration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: view.container,
          x: startX,
          y: startY,
          angle: 0,
          duration: returnDuration,
          ease: 'Back.easeOut',
          onComplete: () => {
            view.container.setPosition(startX, startY);
            view.container.setAngle(0);
            onComplete?.();
          },
        });
      },
    });
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
      this.rebuildScene();
    });
    this.load.start();
  }
}
