import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Phaser from 'phaser';
import { EarTrainingBattleScene } from '@/game/earTraining/EarTrainingBattleScene';
import type {
  EarTrainingBattleCallbacks,
  EarTrainingBattleEffectCommand,
  EarTrainingBattleSceneHandle,
  EarTrainingBattleSnapshot,
} from '@/game/earTraining/types';
import { playFireMagicSe, preloadFireMagicSe } from '@/utils/earTrainingFireMagicSe';

interface EarTrainingPhaserGameProps {
  snapshot: EarTrainingBattleSnapshot;
  effectCommand: EarTrainingBattleEffectCommand | null;
  callbacks: EarTrainingBattleCallbacks;
  className?: string;
  /** true のとき炎魔法 SE のプリロード・再生を行わない（OSMD リズムバトル等） */
  disableCorrectSe?: boolean;
}

const EarTrainingPhaserGame = forwardRef<EarTrainingBattleSceneHandle, EarTrainingPhaserGameProps>(({
  snapshot,
  effectCommand,
  callbacks,
  className,
  disableCorrectSe = true,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<EarTrainingBattleScene | null>(null);
  const latestSnapshotRef = useRef(snapshot);
  const latestCallbacksRef = useRef(callbacks);

  latestSnapshotRef.current = snapshot;
  latestCallbacksRef.current = callbacks;

  useImperativeHandle(ref, () => ({
    updateSnapshot: nextSnapshot => sceneRef.current?.updateSnapshot(nextSnapshot),
    setEnemyAttackGaugePercent: percent => sceneRef.current?.setEnemyAttackGaugePercent(percent),
    triggerEffect: command => sceneRef.current?.triggerEffect(command),
    highlightKey: (midiNote, active) => sceneRef.current?.highlightKey(midiNote, active),
    setPlayerQuote: (text, options) => sceneRef.current?.setPlayerQuote(text, options),
    setPartnerQuote: (text, options) => sceneRef.current?.setPartnerQuote(text, options),
  }), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const scene = new EarTrainingBattleScene();
    scene.setCallbacks(latestCallbacksRef.current);
    sceneRef.current = scene;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: container,
      backgroundColor: '#070817',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: Math.max(320, container.clientWidth),
        height: Math.max(480, container.clientHeight),
      },
      scene,
      input: {
        activePointers: 3,
      },
      fps: {
        target: 30,
      },
      render: {
        antialias: false,
        pixelArt: false,
      },
    });
    gameRef.current = game;

    const applyInitialSnapshot = () => {
      scene.updateSnapshot(latestSnapshotRef.current);
    };
    applyInitialSnapshot();

    return () => {
      sceneRef.current = null;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (disableCorrectSe) {
      return;
    }
    preloadFireMagicSe();
  }, [disableCorrectSe]);

  useEffect(() => {
    sceneRef.current?.setCallbacks(callbacks);
  }, [callbacks]);

  useEffect(() => {
    sceneRef.current?.updateSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (!effectCommand) {
      return;
    }
    if (
      !disableCorrectSe && (
        effectCommand.kind === 'correct' ||
        effectCommand.kind === 'voicingCast' ||
        effectCommand.kind === 'complete' ||
        effectCommand.kind === 'osmdHammerReflect' ||
        effectCommand.kind === 'osmdMeteor'
      )
    ) {
      playFireMagicSe();
    }
    sceneRef.current?.triggerEffect(effectCommand);
  }, [disableCorrectSe, effectCommand]);

  return <div ref={containerRef} className={className} />;
});

EarTrainingPhaserGame.displayName = 'EarTrainingPhaserGame';

export default EarTrainingPhaserGame;
