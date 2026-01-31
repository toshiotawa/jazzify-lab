import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MIDIController, playNote, stopNote } from '@/utils/MidiController';

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

// 3D効果用の定数
const KEY_3D_DEPTH = 8; // 鍵盤の奥行き（px）
const KEY_PRESSED_DEPTH = 4; // 押下時の奥行き（px）

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

  const setNoteActive = (note: number, active: boolean) => {
    setActiveNotes(prev => {
      const next = new Set(prev);
      if (active) next.add(note); else next.delete(note);
      return next;
    });
  };

  const handlePointerDown = (note: number) => (e: React.PointerEvent) => {
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    isPointerDownRef.current = true;
    pointerIdToNoteRef.current.set(e.pointerId, note);
    setNoteActive(note, true);
    // velocityは固定（やや強め）
    playNote(note, 64);
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent) => {
    const map = pointerIdToNoteRef.current;
    const note = map.get(e.pointerId);
    if (note != null) {
      setNoteActive(note, false);
      stopNote(note);
      map.delete(e.pointerId);
    }
    if (map.size === 0) isPointerDownRef.current = false;
  };

  const handlePointerEnter = (note: number) => (e: React.PointerEvent) => {
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
  };

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

  // 隣の鍵盤が押下されているかチェック
  const isNeighborPressed = (noteIndex: number, direction: 'left' | 'right'): boolean => {
    const neighborIndex = direction === 'left' ? noteIndex - 1 : noteIndex + 1;
    if (neighborIndex < 0 || neighborIndex >= whiteKeys.length) return false;
    return activeNotes.has(whiteKeys[neighborIndex]);
  };

  return (
    <div className="w-full select-none" style={{ height: `${heightPx}px`, touchAction: 'none' }}>
      <div className="relative h-full bg-slate-900">
        {/* 白鍵レイヤー */}
        <div className="absolute inset-0 flex" style={{ paddingBottom: `${KEY_3D_DEPTH}px` }}>
          {whiteKeys.map((note, index) => {
            const isActive = activeNotes.has(note);
            const currentDepth = isActive ? KEY_PRESSED_DEPTH : KEY_3D_DEPTH;
            const leftNeighborPressed = isNeighborPressed(index, 'left');
            const rightNeighborPressed = isNeighborPressed(index, 'right');
            // 押下時に見える側面の高さ
            const sideVisibleHeight = KEY_3D_DEPTH - KEY_PRESSED_DEPTH;
            
            return (
              <div
                key={note}
                className="flex-1 relative"
                onPointerDown={handlePointerDown(note)}
                onPointerUp={handlePointerUpOrCancel}
                onPointerCancel={handlePointerUpOrCancel}
                onPointerLeave={handlePointerUpOrCancel}
                onPointerEnter={handlePointerEnter(note)}
                role="button"
                aria-label={`MIDI ${note}`}
              >
                {/* 左側面（押下時、左隣が押下されていない場合）- 鍵盤下端の段差 */}
                {isActive && !leftNeighborPressed && (
                  <div
                    className="absolute left-0 w-[2px] bg-gradient-to-r from-slate-500 to-slate-400"
                    style={{ 
                      bottom: `${currentDepth}px`,
                      height: `${sideVisibleHeight}px`
                    }}
                  />
                )}
                {/* 右側面（押下時、右隣が押下されていない場合）- 鍵盤下端の段差 */}
                {isActive && !rightNeighborPressed && (
                  <div
                    className="absolute right-0 w-[2px] bg-gradient-to-r from-slate-400 to-slate-600"
                    style={{ 
                      bottom: `${currentDepth}px`,
                      height: `${sideVisibleHeight}px`
                    }}
                  />
                )}
                {/* 鍵盤上面（上端固定） */}
                <div
                  className={`absolute left-0 right-0 top-0 rounded-b-md border border-slate-400 transition-all duration-75 ${
                    isActive
                      ? 'bg-gradient-to-b from-slate-200 to-slate-300'
                      : 'bg-gradient-to-b from-white to-slate-100'
                  }`}
                  style={{
                    bottom: `${currentDepth}px`,
                  }}
                />
                {/* 手前の側面（3D効果） */}
                <div
                  className="absolute left-0 right-0 bottom-0 bg-gradient-to-b from-slate-300 to-slate-500 border-x border-b border-slate-500 rounded-b-sm"
                  style={{ height: `${currentDepth}px` }}
                />
              </div>
            );
          })}
        </div>
        {/* 黒鍵レイヤー */}
        <div className="absolute inset-0 pointer-events-none">
          {blackKeys.map((note) => {
            const isActive = activeNotes.has(note);
            const left = getBlackLeftPercent(note);
            const currentDepth = isActive ? KEY_PRESSED_DEPTH : KEY_3D_DEPTH;
            const blackKeyHeight = 65; // 黒鍵の高さ（%）
            // 押下時に見える側面の高さ
            const sideVisibleHeight = KEY_3D_DEPTH - KEY_PRESSED_DEPTH;
            
            return (
              <div
                key={note}
                className="absolute -translate-x-1/2 pointer-events-auto"
                style={{
                  left: `${left}%`,
                  width: '9%',
                  top: 0,
                  height: `${blackKeyHeight}%`,
                }}
                onPointerDown={handlePointerDown(note)}
                onPointerUp={handlePointerUpOrCancel}
                onPointerCancel={handlePointerUpOrCancel}
                onPointerLeave={handlePointerUpOrCancel}
                onPointerEnter={handlePointerEnter(note)}
                role="button"
                aria-label={`MIDI ${note}`}
              >
                {/* 左側面（押下時）- 鍵盤下端の段差 */}
                {isActive && (
                  <div
                    className="absolute left-0 w-[2px] bg-gradient-to-r from-black to-slate-800"
                    style={{ 
                      bottom: `${currentDepth}px`,
                      height: `${sideVisibleHeight}px`
                    }}
                  />
                )}
                {/* 右側面（押下時）- 鍵盤下端の段差 */}
                {isActive && (
                  <div
                    className="absolute right-0 w-[2px] bg-gradient-to-r from-slate-800 to-black"
                    style={{ 
                      bottom: `${currentDepth}px`,
                      height: `${sideVisibleHeight}px`
                    }}
                  />
                )}
                {/* 黒鍵上面（上端固定） */}
                <div
                  className={`absolute left-0 right-0 top-0 rounded-b-md border border-slate-800 transition-all duration-75 ${
                    isActive
                      ? 'bg-gradient-to-b from-slate-600 to-slate-700'
                      : 'bg-gradient-to-b from-slate-900 to-black'
                  }`}
                  style={{ 
                    bottom: `${currentDepth}px` 
                  }}
                />
                {/* 黒鍵の手前側面 */}
                <div
                  className="absolute left-0 right-0 bottom-0 bg-gradient-to-b from-slate-800 to-black border-x border-b border-black rounded-b-sm"
                  style={{ height: `${currentDepth}px` }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OnScreenPiano;