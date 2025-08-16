import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { MIDIController, playNote, stopNote } from '@/utils/MidiController';

// PIXIレンダラーは動的にimportして初期バンドルを軽量化
const LazyPIXINotes = React.lazy(() => import('../game/PIXINotesRenderer').then(m => ({ default: m.PIXINotesRenderer })));

interface LPPIXIPianoProps {
  midiDeviceId?: string | null;
  height?: number; // ピアノの高さ
  targetWhiteKeyWidth?: number; // 1白鍵あたりの目標幅(px)
}

const LPPIXIPiano: React.FC<LPPIXIPianoProps> = ({
  midiDeviceId = null,
  height = 160,
  targetWhiteKeyWidth = 36
}) => {
  const scrollWrapRef = useRef<HTMLDivElement | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(() => 52 * targetWhiteKeyWidth); // 88鍵の白鍵は52
  const [rendererReady, setRendererReady] = useState<any>(null);
  const midiControllerRef = useRef<MIDIController | null>(null);

  // 外枠のサイズに応じて（必要であれば）横幅を調整
  useEffect(() => {
    const el = scrollWrapRef.current;
    if (!el) return;
    // ここではcanvasWidthは「コンテンツ幅」として、スクロールさせるために十分広く維持
    // 必要に応じてデバイス幅に比例して白鍵幅を微調整
    const ro = new ResizeObserver(() => {
      const deviceW = el.clientWidth || 360;
      const whiteKeyWidth = Math.max(28, Math.min(targetWhiteKeyWidth, Math.floor(deviceW / 10))); // 目標: 一度に10白鍵前後表示
      setCanvasWidth(52 * whiteKeyWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [targetWhiteKeyWidth]);

  // レンダラー準備時にキーバインド設定
  const handleRendererReady = useCallback((renderer: any | null) => {
    setRendererReady(renderer);
    if (!renderer) return;

    renderer.setKeyCallbacks(
      (note: number) => {
        playNote(note, 95);
      },
      (note: number) => {
        stopNote(note);
      }
    );
  }, []);

  // MIDIの初期化とキーのハイライト連携
  useEffect(() => {
    const controller = new MIDIController({
      onNoteOn: (note: number) => {
        if (rendererReady) rendererReady.highlightKey?.(note, true);
      },
      onNoteOff: (note: number) => {
        if (rendererReady) rendererReady.highlightKey?.(note, false);
      },
      playMidiSound: true
    });
    midiControllerRef.current = controller;

    let cancelled = false;
    controller.initialize().then(async () => {
      if (cancelled) return;
      if (midiDeviceId) {
        try { await controller.connectDevice(midiDeviceId); } catch {}
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
      try { controller.destroy(); } catch {}
      midiControllerRef.current = null;
    };
  }, [midiDeviceId, rendererReady]);

  // デバイス選択変更時の再接続
  useEffect(() => {
    const controller = midiControllerRef.current;
    if (!controller || !midiDeviceId) return;
    (async () => {
      try { await controller.connectDevice(midiDeviceId); } catch {}
    })();
  }, [midiDeviceId]);

  return (
    <div
      ref={scrollWrapRef}
      className="w-full"
      style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x'
      }}
    >
      <Suspense fallback={<div className="text-center text-gray-300 text-sm">PIXIを読み込み中...</div>}>
        <LazyPIXINotes
          activeNotes={[]}
          width={canvasWidth}
          height={height}
          currentTime={0}
          onReady={handleRendererReady}
          className="min-w-full"
        />
      </Suspense>
    </div>
  );
};

export default LPPIXIPiano;