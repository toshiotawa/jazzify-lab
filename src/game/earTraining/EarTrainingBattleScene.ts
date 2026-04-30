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

const EMPTY_CALLBACKS: EarTrainingBattleCallbacks = {
  onStart: () => undefined,
  onBack: () => undefined,
  onOpenSettings: () => undefined,
  onPracticeModeChange: () => undefined,
  onPianoKeyDown: () => undefined,
  onPianoKeyUp: () => undefined,
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

    this.drawUtilityButton(width - 118, 58, 46, '設定', () => this.callbacks.onOpenSettings());
    this.drawUtilityButton(width - 66, 58, 46, '戻る', () => this.callbacks.onBack());
    this.drawChordHud(width, 104);

    if (snapshot.practiceMode) {
      const practice = this.add.text(width / 2 + 60, 26, '練習', {
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
    return { container, image };
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
    const text = this.add.text(width / 2, y, `Phrase ${snapshot.phraseIndex + 1} / ${snapshot.totalPhrases}`, {
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

    if (snapshot.lastRank) {
      const rank = this.add.text(width / 2, height * 0.38, `Rank ${snapshot.lastRank}`, {
        color: '#fde68a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: '900',
      }).setOrigin(0.5, 0.5);
      this.hudLayer.add(rank);
    }

    this.drawModeButton(width / 2 - 82, height * 0.46, 'バトル', !snapshot.practiceMode, () => this.callbacks.onPracticeModeChange(false));
    this.drawModeButton(width / 2 + 12, height * 0.46, '練習', snapshot.practiceMode, () => this.callbacks.onPracticeModeChange(true));
    this.drawStartButton(width / 2, height * 0.56, snapshot.startButtonLabel);

    if (snapshot.lessonProgressText) {
      const progress = this.add.text(width / 2, height * 0.68, snapshot.lessonProgressText, {
        color: '#bbf7d0',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: '700',
      }).setOrigin(0.5, 0.5);
      this.hudLayer.add(progress);
    }
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

  private playCorrectEffect(command: EarTrainingBattleEffectCommand): void {
    if (!this.effectLayer) {
      return;
    }
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const orb = this.add.circle(width * 0.46, height - 246, 14, 0xa5f3fc, 1);
    const label = this.add.text(width * 0.46, height - 246, command.label ?? '♪', {
      color: '#020617',
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fontStyle: '900',
    }).setOrigin(0.5, 0.5);
    this.effectLayer.add([orb, label]);
    this.tweens.add({
      targets: [orb, label],
      x: width * 0.73,
      y: height * 0.43,
      scale: 0.35,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        orb.destroy();
        label.destroy();
        this.showDamage(width * 0.78, height * 0.34, command.damage, true);
        this.enemyView?.container.setX(width * 0.77 + 18);
        this.tweens.add({ targets: this.enemyView?.container, x: width * 0.77, duration: 120 });
      },
    });
  }

  private playCompleteEffect(command: EarTrainingBattleEffectCommand): void {
    if (!this.effectLayer) {
      return;
    }
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const beam = this.add.rectangle(width * 0.27, height * 0.43, 94, 16, 0x67e8f9, 1);
    beam.setStrokeStyle(2, 0xecfeff, 0.9);
    this.effectLayer.add(beam);
    this.cameras.main.shake(180, 0.006);
    this.tweens.add({
      targets: beam,
      x: width * 0.78,
      scaleX: 2.2,
      alpha: 0,
      duration: 720,
      ease: 'Quart.easeOut',
      onComplete: () => {
        beam.destroy();
        this.showDamage(width * 0.78, height * 0.3, command.damage, true);
      },
    });
  }

  private playEnemyAttackEffect(command: EarTrainingBattleEffectCommand, heavy: boolean): void {
    if (!this.effectLayer) {
      return;
    }
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    this.enemyView?.container.setX(width * 0.77 - 28);
    this.tweens.add({ targets: this.enemyView?.container, x: width * 0.77, duration: 180, ease: 'Back.easeOut' });
    const slash = this.add.rectangle(width * 0.75, height * 0.43, heavy ? 128 : 78, heavy ? 22 : 15, 0xfb7185, 1);
    slash.setStrokeStyle(2, 0xfdf2f8, 0.82);
    this.effectLayer.add(slash);
    this.cameras.main.shake(heavy ? 240 : 150, heavy ? 0.012 : 0.007);
    this.tweens.add({
      targets: slash,
      x: width * 0.24,
      scaleX: 1.6,
      alpha: 0,
      duration: heavy ? 700 : 520,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        slash.destroy();
        this.showDamage(width * 0.22, height * 0.3, command.damage, false);
        this.flashPlayer();
      },
    });
  }

  private showDamage(x: number, y: number, damage: number | undefined, enemySide: boolean): void {
    if (!this.effectLayer || damage === undefined || damage <= 0) {
      return;
    }
    const text = this.add.text(x, y, `-${damage}`, {
      color: enemySide ? '#fde68a' : '#fecaca',
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      fontStyle: '900',
      stroke: '#020617',
      strokeThickness: 5,
    }).setOrigin(0.5, 0.5);
    this.effectLayer.add(text);
    this.tweens.add({
      targets: text,
      y: y - 42,
      alpha: 0,
      duration: 760,
      onComplete: () => text.destroy(),
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
