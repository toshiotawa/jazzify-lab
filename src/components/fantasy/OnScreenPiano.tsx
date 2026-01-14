import React, { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import { MIDIController, playNote, stopNote } from '@/utils/MidiController';

// 🚀 パフォーマンス最適化: 白鍵コンポーネントをメモ化
interface WhiteKeyProps {
  note: number;
  isActive: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerEnter: (e: React.PointerEvent) => void;
}

const WhiteKey = memo<WhiteKeyProps>(({ note, isActive, onPointerDown, onPointerUp, onPointerEnter }) => (
  <div
    className={`flex-1 border border-slate-700 bg-white ${isActive ? 'bg-yellow-200 shadow-inner' : 'bg-gradient-to-b from-white to-slate-100'} relative`}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerUp}
    onPointerLeave={onPointerUp}
    onPointerEnter={onPointerEnter}
    role="button"
    aria-label={`MIDI ${note}`}
  />
));
WhiteKey.displayName = 'WhiteKey';

// 🚀 パフォーマンス最適化: 黒鍵コンポーネントをメモ化
interface BlackKeyProps {
  note: number;
  isActive: boolean;
  left: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerEnter: (e: React.PointerEvent) => void;
}

const BlackKey = memo<BlackKeyProps>(({ note, isActive, left, onPointerDown, onPointerUp, onPointerEnter }) => (
  <div
    className={`absolute -translate-x-1/2 w-[70%] max-w-[70%] h-[65%] top-0 rounded-b-md border border-slate-800 ${isActive ? 'bg-gray-700' : 'bg-black'} shadow-xl`}
    style={{ left: `${left}%` }}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerUp}
    onPointerLeave={onPointerUp}
    onPointerEnter={onPointerEnter}
    role="button"
    aria-label={`MIDI ${note}`}
  />
));
BlackKey.displayName = 'BlackKey';

interface OnScreenPianoProps {
  startMidi?: number; // デフォルト: C3
  endMidi?: number;   // デフォルト: C5
  midiDeviceId?: string | null;
  heightPx?: number;  // デフォルト: 160
}

// 12音階のうち黒鍵に該当するインデックス
const isBlack = (midi: number): boolean => {
  const n = midi % 12;
  return n === 1 || n === 3 || n === 6 || n === 8 || n === 10;
};

// 黒鍵位置の白鍵インデックスからのオフセット（白鍵幅に対する割合）
// C#: 0.66, D#: 1.58, F#: 3.66, G#: 4.58, A#: 5.66 と等価
const blackKeyOffsetBySemitone: Record<number, number> = {
  1: 0.66,  // C#
  3: 1.58,  // D#
  6: 3.66,  // F#
  8: 4.58,  // G#
  10: 5.66  // A#
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const OnScreenPiano: React.FC<OnScreenPianoProps> = ({
  startMidi = 48, // C3
  endMidi = 72,   // C5
  midiDeviceId = null,
  heightPx = 160
}) => {
  // 安全な範囲
  startMidi = clamp(startMidi, 21, 108);
  endMidi = clamp(endMidi, 21, 108);
  if (endMidi < startMidi) [startMidi, endMidi] = [endMidi, startMidi];

  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const pointerIdToNoteRef = useRef<Map<number, number>>(new Map());
  const isPointerDownRef = useRef<boolean>(false);
  const midiControllerRef = useRef<MIDIController | null>(null);

  const whiteKeys = useMemo(() => {
    const list: number[] = [];
    for (let n = startMidi; n <= endMidi; n++) {
      if (!isBlack(n)) list.push(n);
    }
    return list;
  }, [startMidi, endMidi]);

  const blackKeys = useMemo(() => {
    const list: number[] = [];
    for (let n = startMidi; n <= endMidi; n++) {
      if (isBlack(n)) list.push(n);
    }
    return list;
  }, [startMidi, endMidi]);

  // 白鍵のインデックスマップ（位置計算に使用）
  const whiteIndexByMidi = useMemo(() => {
    const map = new Map<number, number>();
    whiteKeys.forEach((note, idx) => map.set(note, idx));
    return map;
  }, [whiteKeys]);

  const totalWhites = whiteKeys.length;

  // 🚀 パフォーマンス最適化: useCallbackでメモ化
  const setNoteActive = useCallback((note: number, active: boolean) => {
    setActiveNotes(prev => {
      const next = new Set(prev);
      if (active) next.add(note); else next.delete(note);
      return next;
    });
  }, []);

  // 🚀 ポインターハンドラーをメモ化（鍵盤コンポーネントに安定した参照を渡す）
  const pointerHandlersRef = useRef<Map<number, {
    down: (e: React.PointerEvent) => void;
    enter: (e: React.PointerEvent) => void;
  }>>(new Map());

  const getPointerHandlers = useCallback((note: number) => {
    if (!pointerHandlersRef.current.has(note)) {
      pointerHandlersRef.current.set(note, {
        down: (e: React.PointerEvent) => {
          try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
          isPointerDownRef.current = true;
          pointerIdToNoteRef.current.set(e.pointerId, note);
          setNoteActive(note, true);
          playNote(note, 64);
        },
        enter: (e: React.PointerEvent) => {
          if (!isPointerDownRef.current) return;
          const map = pointerIdToNoteRef.current;
          const prev = map.get(e.pointerId);
          if (prev === note) return;
          if (prev != null) {
            setNoteActive(prev, false);
            stopNote(prev);
          }
          map.set(e.pointerId, note);
          setNoteActive(note, true);
          playNote(note, 64);
        }
      });
    }
    return pointerHandlersRef.current.get(note)!;
  }, [setNoteActive]);

  const handlePointerUpOrCancel = useCallback((e: React.PointerEvent) => {
    const map = pointerIdToNoteRef.current;
    const note = map.get(e.pointerId);
    if (note != null) {
      setNoteActive(note, false);
      stopNote(note);
      map.delete(e.pointerId);
    }
    if (map.size === 0) isPointerDownRef.current = false;
  }, [setNoteActive]);

  useEffect(() => {
    // MIDI入力でのハイライト + 音を鳴らす
    const controller = new MIDIController({
      onNoteOn: (note: number) => {
        setNoteActive(note, true);
      },
      onNoteOff: (note: number) => {
        setNoteActive(note, false);
      },
      playMidiSound: true,
      ...( { lightAudio: true } as any )
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
      // すべてのアクティブノートを停止
      setActiveNotes(prev => {
        prev.forEach(n => { try { stopNote(n); } catch {} });
        return new Set();
      });
    };
  }, [midiDeviceId]);

  // MIDIデバイス選択変更時の再接続
  useEffect(() => {
    const controller = midiControllerRef.current;
    if (!controller) return;
    (async () => {
      if (!midiDeviceId) return;
      try { await controller.connectDevice(midiDeviceId); } catch {}
    })();
  }, [midiDeviceId]);

  // 黒鍵の左位置（%）を計算
  const getBlackLeftPercent = (midi: number): number => {
    const semitone = midi % 12;
    // その黒鍵が属する直前の白鍵の白鍵インデックス
    let prevWhiteMidi = midi - 1;
    while (prevWhiteMidi >= startMidi && isBlack(prevWhiteMidi)) prevWhiteMidi--;
    const baseIdx = whiteIndexByMidi.get(prevWhiteMidi) ?? 0;
    const offset = blackKeyOffsetBySemitone[semitone] ?? 0.66;
    const leftWhiteIndex = baseIdx + offset;
    const percent = (leftWhiteIndex / totalWhites) * 100;
    return clamp(percent, 0, 100);
  };

  return (
    <div className="w-full select-none" style={{ height: `${heightPx}px`, touchAction: 'none' }}>
      <div className="relative h-full">
        {/* 白鍵レイヤー */}
        <div className="absolute inset-0 flex">
          {whiteKeys.map((note) => {
            const handlers = getPointerHandlers(note);
            return (
              <WhiteKey
                key={note}
                note={note}
                isActive={activeNotes.has(note)}
                onPointerDown={handlers.down}
                onPointerUp={handlePointerUpOrCancel}
                onPointerEnter={handlers.enter}
              />
            );
          })}
        </div>
        {/* 黒鍵レイヤー */}
        <div className="absolute inset-0">
          {blackKeys.map((note) => {
            const handlers = getPointerHandlers(note);
            return (
              <BlackKey
                key={note}
                note={note}
                isActive={activeNotes.has(note)}
                left={getBlackLeftPercent(note)}
                onPointerDown={handlers.down}
                onPointerUp={handlePointerUpOrCancel}
                onPointerEnter={handlers.enter}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 🚀 パフォーマンス最適化: コンポーネント全体をメモ化
export default memo(OnScreenPiano);