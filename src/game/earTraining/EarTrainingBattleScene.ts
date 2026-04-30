import Phaser from 'phaser';
import type {
  EarTrainingBattleCallbacks,
  EarTrainingBattleEffectCommand,
  EarTrainingBattleSceneHandle,
  EarTrainingBattleSnapshot,
} from './types';
import { EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS } from '@/utils/constants';

const PIANO_MIN_MIDI = 48;
const PIANO_MAX_MIDI = 72;
const WHITE_PITCH_CLASSES = new Set([0, 2, 4, 5, 7, 9, 11]);

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

const pitchClass = (midiNote: number): number => ((midiNote % 12) + 12) % 12;

const isWhiteKey = (midiNote: number): boolean => WHITE_PITCH_CLASSES.has(pitchClass(midiNote));

const getPianoHeight = (height: number): number => Math.max(116, Math.min(148, height * 0.2));

const noteLabel = (midiNote: number): string => {
  const labels = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return labels[pitchClass(midiNote)] ?? '';
};

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

interface PianoKeyView {
  midiNote: number;
  body: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text | null;
}

interface CharacterView {
  container: Phaser.GameObjects.Container;
  aura: Phaser.GameObjects.Arc;
  body: Phaser.GameObjects.Arc;
  image: Phaser.GameObjects.Image | null;
}

export class EarTrainingBattleScene extends Phaser.Scene implements EarTrainingBattleSceneHandle {
  private callbacks: EarTrainingBattleCallbacks = EMPTY_CALLBACKS;
  private snapshot: EarTrainingBattleSnapshot | null = null;
  private activeKeys = new Set<number>();
  private loadingTextureKeys = new Set<string>();
  private backgroundLayer: Phaser.GameObjects.Container | null = null;
  private characterLayer: Phaser.GameObjects.Container | null = null;
  private effectLayer: Phaser.GameObjects.Container | null = null;
  private hudLayer: Phaser.GameObjects.Container | null = null;
  private phraseLayer: Phaser.GameObjects.Container | null = null;
  private inputLayer: Phaser.GameObjects.Container | null = null;
  private playerView: CharacterView | null = null;
  private enemyView: CharacterView | null = null;
  private pianoKeys: PianoKeyView[] = [];
  private pressedPointerKey: number | null = null;
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

  highlightKey(midiNote: number, active: boolean): void {
    if (active) {
      this.activeKeys.add(midiNote);
    } else {
      this.activeKeys.delete(midiNote);
    }
    this.paintPianoKeys();
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
    this.inputLayer = this.add.container(0, 0);
    const effectLayer = this.effectLayer ?? this.add.container(0, 0);
    this.effectLayer = effectLayer;

    this.drawBackground(width, height);
    this.drawHud(width);
    this.drawCharacters(width, height);
    this.drawPhraseSlots(width, height);
    this.drawLobbyOverlay(width, height);
    this.drawPiano(width, height);
    this.children.bringToTop(effectLayer);
  }

  private clearScene(): void {
    this.backgroundLayer?.destroy(true);
    this.characterLayer?.destroy(true);
    this.hudLayer?.destroy(true);
    this.phraseLayer?.destroy(true);
    this.inputLayer?.destroy(true);
    this.playerView = null;
    this.enemyView = null;
    this.pianoKeys = [];
  }

  private drawBackground(width: number, height: number): void {
    if (!this.backgroundLayer) {
      return;
    }

    const background = this.add.graphics();
    background.fillGradientStyle(0x050614, 0x11104a, 0x12081f, 0x2e115d, 1);
    background.fillRect(0, 0, width, height);
    background.fillStyle(0x38bdf8, 0.08);
    background.fillCircle(width * 0.5, height * 0.22, Math.min(width, height) * 0.38);
    background.fillStyle(0xf97316, 0.07);
    background.fillCircle(width * 0.82, height * 0.35, Math.min(width, height) * 0.26);
    background.lineStyle(1, 0xffffff, 0.06);
    for (let x = 0; x < width; x += 56) {
      background.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += 56) {
      background.lineBetween(0, y, width, y);
    }
    background.fillStyle(0x000000, 0.35);
    background.fillRect(0, height * 0.72, width, height * 0.28);
    this.backgroundLayer.add(background);
  }

  private drawHud(width: number): void {
    const snapshot = this.snapshot;
    if (!snapshot || !this.hudLayer) {
      return;
    }

    const hudHeight = 88;
    const hudBg = this.add.rectangle(0, 0, width, hudHeight, 0x020617, 0.66).setOrigin(0, 0);
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

    this.drawChordHud(width, 112);
    this.drawUtilityButton(width - 118, 92, 46, '設定', () => this.callbacks.onOpenSettings());
    this.drawUtilityButton(width - 66, 92, 46, '戻る', () => this.callbacks.onBack());

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

    const midiStatus = this.add.text(width - 118, 124, snapshot.isMidiConnected ? 'MIDI ON' : 'MIDI OFF', {
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
    const maxItems = Math.max(1, Math.floor((width - 190) / 82));
    const chords = snapshot.chords.slice(0, maxItems);
    if (chords.length === 0) {
      return;
    }

    const itemWidth = Math.min(78, (width - 190) / chords.length);
    const startX = (width - itemWidth * chords.length) / 2;
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
    const pianoHeight = getPianoHeight(height);
    const characterBaseY = Math.max(230, height - pianoHeight - 170);
    this.playerView = this.createCharacter(width * 0.23, characterBaseY, true, snapshot.playerAvatarUrl, false);
    this.enemyView = this.createCharacter(width * 0.77, characterBaseY, false, snapshot.enemyAvatarUrl, snapshot.enemyAvatarFlipX);
  }

  private createCharacter(x: number, y: number, isPlayer: boolean, avatarUrl: string, avatarFlipX: boolean): CharacterView {
    const container = this.add.container(x, y);
    const auraColor = isPlayer ? 0x22c55e : 0xf43f5e;
    const aura = this.add.circle(0, -78, 86, auraColor, 0.16);
    aura.setStrokeStyle(2, auraColor, 0.42);
    const body = this.add.circle(0, -78, 66, isPlayer ? 0x064e3b : 0x4c0519, 0.92);
    body.setStrokeStyle(3, isPlayer ? 0x86efac : 0xfda4af, 0.72);
    const textureKey = hashText(avatarUrl);
    const shouldFlipX = !isPlayer && (avatarFlipX || EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS.has(avatarUrl));
    const image = this.textures.exists(textureKey)
      ? this.add.image(0, -78, textureKey).setDisplaySize(116, 116)
      : null;
    image?.setFlipX(shouldFlipX);
    const fallback = this.add.text(0, -78, isPlayer ? 'P' : 'E', {
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontSize: '42px',
      fontStyle: '900',
    }).setOrigin(0.5, 0.5);
    fallback.setVisible(!image);

    container.add([aura, body]);
    if (image) {
      container.add(image);
    }
    container.add(fallback);
    this.characterLayer?.add(container);
    return { container, aura, body, image };
  }

  private drawPhraseSlots(width: number, height: number): void {
    const snapshot = this.snapshot;
    if (!snapshot || !this.phraseLayer) {
      return;
    }
    const slots = snapshot.phraseSlots.length > 0 ? snapshot.phraseSlots : ['_'];
    const slotSize = Phaser.Math.Clamp((width - 48) / Math.max(8, slots.length), 34, 54);
    const gap = 7;
    const totalWidth = slots.length * slotSize + (slots.length - 1) * gap;
    const startX = Math.max(16, (width - totalWidth) / 2);
    const y = height - getPianoHeight(height) - slotSize - 18;

    slots.forEach((_slot, index) => {
      const revealed = index < snapshot.revealedNotes.length;
      const current = index === snapshot.currentNoteIndex && snapshot.gameState === 'playingPhrase';
      const x = startX + index * (slotSize + gap);
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
    });
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

  private drawPiano(width: number, height: number): void {
    if (!this.inputLayer) {
      return;
    }
    const pianoHeight = getPianoHeight(height);
    const y = height - pianoHeight;
    const base = this.add.rectangle(0, y, width, pianoHeight, 0x020617, 0.96).setOrigin(0, 0);
    base.setStrokeStyle(1, 0xffffff, 0.12);
    this.inputLayer.add(base);

    const whiteNotes = Array.from({ length: PIANO_MAX_MIDI - PIANO_MIN_MIDI + 1 }, (_, index) => PIANO_MIN_MIDI + index)
      .filter(isWhiteKey);
    const whiteIndexByMidi = new Map<number, number>();
    const whiteWidth = width / whiteNotes.length;
    whiteNotes.forEach((midiNote, index) => {
      whiteIndexByMidi.set(midiNote, index);
      const x = index * whiteWidth;
      const body = this.add.rectangle(x + 1, y + 12, whiteWidth - 2, pianoHeight - 20, 0xf8fafc, 1).setOrigin(0, 0);
      body.setStrokeStyle(1, 0x0f172a, 0.38);
      this.registerPianoKey(body, midiNote);
      const label = this.add.text(x + whiteWidth / 2, y + pianoHeight - 24, noteLabel(midiNote), {
        color: '#0f172a',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: '900',
      }).setOrigin(0.5, 0.5);
      this.inputLayer?.add([body, label]);
      this.pianoKeys.push({ midiNote, body, label });
    });

    for (let midiNote = PIANO_MIN_MIDI; midiNote <= PIANO_MAX_MIDI; midiNote += 1) {
      if (isWhiteKey(midiNote)) {
        continue;
      }
      let previousWhiteMidi = midiNote - 1;
      while (previousWhiteMidi >= PIANO_MIN_MIDI && !isWhiteKey(previousWhiteMidi)) {
        previousWhiteMidi -= 1;
      }
      const previousWhiteIndex = whiteIndexByMidi.get(previousWhiteMidi);
      if (previousWhiteIndex === undefined) {
        continue;
      }
      const x = (previousWhiteIndex + 1) * whiteWidth;
      const body = this.add.rectangle(x, y + 12, whiteWidth * 0.62, pianoHeight * 0.58, 0x020617, 1).setOrigin(0.5, 0);
      body.setStrokeStyle(1, 0x94a3b8, 0.32);
      this.registerPianoKey(body, midiNote);
      this.inputLayer.add(body);
      this.pianoKeys.push({ midiNote, body, label: null });
    }

    this.paintPianoKeys();
  }

  private registerPianoKey(body: Phaser.GameObjects.Rectangle, midiNote: number): void {
    body.setInteractive({ useHandCursor: true });
    body.on('pointerdown', () => {
      this.pressedPointerKey = midiNote;
      this.highlightKey(midiNote, true);
      this.callbacks.onPianoKeyDown(midiNote);
    });
    body.on('pointerup', () => this.releasePointerKey(midiNote));
    body.on('pointerout', () => this.releasePointerKey(midiNote));
  }

  private releasePointerKey(midiNote: number): void {
    if (this.pressedPointerKey !== midiNote) {
      return;
    }
    this.pressedPointerKey = null;
    this.highlightKey(midiNote, false);
    this.callbacks.onPianoKeyUp(midiNote);
  }

  private paintPianoKeys(): void {
    this.pianoKeys.forEach(key => {
      const active = this.activeKeys.has(key.midiNote);
      const white = isWhiteKey(key.midiNote);
      key.body.setFillStyle(active ? 0x38bdf8 : white ? 0xf8fafc : 0x020617, 1);
      key.body.setStrokeStyle(active ? 2 : 1, active ? 0xa5f3fc : white ? 0x0f172a : 0x94a3b8, active ? 0.95 : 0.38);
      key.label?.setColor(active ? '#083344' : '#0f172a');
    });
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
    this.playerView.body.setFillStyle(0xef4444, 0.96);
    this.tweens.add({
      targets: this.playerView.body,
      alpha: 0.35,
      yoyo: true,
      repeat: 3,
      duration: 80,
      onComplete: () => this.playerView?.body.setAlpha(1),
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
