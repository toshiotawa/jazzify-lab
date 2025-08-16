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

  const hasUserScrolledRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);

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

  // 初期位置をC4中央にスクロール
  const centerToC4 = useCallback(() => {
    const container = scrollWrapRef.current;
    if (!container) return;

    const contentWidth = canvasWidth;
    const viewportWidth = container.clientWidth || 0;
    if (viewportWidth <= 0 || contentWidth <= viewportWidth) return;

    const TOTAL_WHITE_KEYS = 52;
    const C4_WHITE_INDEX = 23; // A0=0 ... C4=23 （ゲーム/ファンタジーと同仕様）
    const whiteKeyWidth = contentWidth / TOTAL_WHITE_KEYS;
    const c4CenterX = (C4_WHITE_INDEX + 0.5) * whiteKeyWidth;
    const desiredScroll = Math.max(0, Math.min(contentWidth - viewportWidth, c4CenterX - viewportWidth / 2));

    isProgrammaticScrollRef.current = true;
    container.scrollLeft = desiredScroll;
    // 少し遅延してフラグ解除（iOS Safariの二度スクロール対策）
    setTimeout(() => { isProgrammaticScrollRef.current = false; }, 50);
  }, [canvasWidth]);

  useEffect(() => {
    // 初回と幅変更時にセンタリング（ユーザーがスクロール済みなら抑制）
    if (!hasUserScrolledRef.current) {
      const r1 = requestAnimationFrame(() => centerToC4());
      const r2 = requestAnimationFrame(() => centerToC4()); // iOS対策で二重
      return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }
  }, [centerToC4, canvasWidth]);

  // スクロールでユーザー操作を検知
  useEffect(() => {
    const el = scrollWrapRef.current;
    if (!el) return;
    const onScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      hasUserScrolledRef.current = true;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

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