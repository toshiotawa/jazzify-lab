import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Phaser from 'phaser';
import { EarTrainingBattleScene } from '@/game/earTraining/EarTrainingBattleScene';
import type {
  EarTrainingBattleCallbacks,
  EarTrainingBattleEffectCommand,
  EarTrainingBattleSceneHandle,
  EarTrainingBattleSnapshot,
} from '@/game/earTraining/types';

interface EarTrainingPhaserGameProps {
  snapshot: EarTrainingBattleSnapshot;
  effectCommand: EarTrainingBattleEffectCommand | null;
  callbacks: EarTrainingBattleCallbacks;
  className?: string;
}

const EarTrainingPhaserGame = forwardRef<EarTrainingBattleSceneHandle, EarTrainingPhaserGameProps>(({
  snapshot,
  effectCommand,
  callbacks,
  className,
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
    triggerEffect: command => sceneRef.current?.triggerEffect(command),
    highlightKey: (midiNote, active) => sceneRef.current?.highlightKey(midiNote, active),
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
      render: {
        antialias: true,
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
    sceneRef.current?.setCallbacks(callbacks);
  }, [callbacks]);

  useEffect(() => {
    sceneRef.current?.updateSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (!effectCommand) {
      return;
    }
    sceneRef.current?.triggerEffect(effectCommand);
  }, [effectCommand]);

  return <div ref={containerRef} className={className} />;
});

EarTrainingPhaserGame.displayName = 'EarTrainingPhaserGame';

export default EarTrainingPhaserGame;
