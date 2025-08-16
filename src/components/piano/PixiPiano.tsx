import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { MIDIController, playNote, stopNote, initializeAudioSystem } from '@/utils/MidiController';

// シンプルなPIXI鍵盤（遅延読み込み + スクロール対応）
// - iPhone風枠の下半分に収まる前提
// - 横スクロールで全域移動、初期位置はC4付近
// - クリック/タッチで発音、MIDIでもハイライト・発音

const MIN_NOTE = 21;   // A0
const MAX_NOTE = 108;  // C8

// 黒鍵の種類（mod12）
const BLACK_NOTES = new Set([1, 3, 6, 8, 10]);

// 黒鍵の前の白鍵（mod12 -> 直前白鍵のmod12）
const BLACK_PREV_WHITE: Record<number, number> = {
	1: 0,  // C# -> C
	3: 2,  // D# -> D
	6: 5,  // F# -> F
	8: 7,  // G# -> G
	10: 9  // A# -> A
};

// C4 のMIDI番号
const MIDDLE_C = 60;

type PixiModule = typeof import('pixi.js');

type KeyGraphic = {
	bg: any; // base graphics
	overlay: any; // overlay graphics for highlight
	isBlack: boolean;
	width: number;
	height: number;
};

const PixiPiano: React.FC = () => {
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const canvasHostRef = useRef<HTMLDivElement | null>(null);
	const appRef = useRef<any>(null);
	const pixiRef = useRef<PixiModule | null>(null);
	const keyMapRef = useRef<Map<number, KeyGraphic>>(new Map());
	const [isVisible, setIsVisible] = useState(false);
	const [isReady, setIsReady] = useState(false);

	const selectedMidiDevice = useGameStore((s) => s.settings.selectedMidiDevice);
	const [midiController] = useState(() => new MIDIController({
		onNoteOn: (note: number) => setKeyActive(note, true),
		onNoteOff: (note: number) => setKeyActive(note, false),
		playMidiSound: true
	}));

	// 可視化された時だけPIXIを読み込む
	useEffect(() => {
		const el = wrapperRef.current;
		if (!el) return;
		const io = new IntersectionObserver((entries) => {
			for (const e of entries) {
				if (e.isIntersecting) {
					setIsVisible(true);
				}
			}
		}, { threshold: 0.1 });
		io.observe(el);
		return () => io.disconnect();
	}, []);

	// PIXI初期化（可視化後）
	useEffect(() => {
		if (!isVisible || isReady) return;
		let destroyed = false;

		(async () => {
			try {
				const [{ Application, Graphics }] = await Promise.all([
					import('pixi.js'),
				]);
				pixiRef.current = { Application, Graphics } as unknown as PixiModule;

				if (destroyed) return;

				const host = canvasHostRef.current!;
				const wrapper = wrapperRef.current!;

				// レイアウト寸法
				const hostRect = host.getBoundingClientRect();
				const height = Math.max(120, Math.floor(hostRect.height));
				const whiteKeyWidth = Math.max(28, Math.floor(height * 0.28));
				const blackKeyWidth = Math.floor(whiteKeyWidth * 0.6);
				const blackKeyHeight = Math.floor(height * 0.66);

				const totalWhiteKeys = countWhiteKeysInRange(MIN_NOTE, MAX_NOTE);
				const pianoWidth = totalWhiteKeys * whiteKeyWidth;

				// Canvas生成
				const app = new (pixiRef.current as any).Application({
					width: pianoWidth,
					height,
					antialias: true,
					backgroundAlpha: 1,
					background: 0xffffff,
				});
				appRef.current = app;
				host.innerHTML = '';
				host.style.width = `${pianoWidth}px`;
				host.style.height = `${height}px`;
				host.appendChild(app.view as HTMLCanvasElement);

				// 白鍵描画
				let whiteIndex = 0;
				for (let midi = MIN_NOTE; midi <= MAX_NOTE; midi++) {
					const isBlack = BLACK_NOTES.has(midi % 12);
					if (!isBlack) {
						const x = whiteIndex * whiteKeyWidth;
						const bg = new (pixiRef.current as any).Graphics();
						bg.beginFill(0xffffff);
						bg.lineStyle(1, 0xcccccc);
						bg.drawRect(x, 0, whiteKeyWidth, height);
						bg.endFill();
						bg.eventMode = 'static';
						bg.cursor = 'pointer';
						bg.on('pointerdown', () => handleKeyDown(midi));
						bg.on('pointerup', () => handleKeyUp(midi));
						bg.on('pointerupoutside', () => handleKeyUp(midi));
						bg.on('pointerout', () => handleKeyUp(midi));

						const overlay = new (pixiRef.current as any).Graphics();
						overlay.beginFill(0xffc107, 0.35); // 暖色系の薄いハイライト
						overlay.lineStyle(0, 0x000000, 0);
						overlay.drawRect(x + 1, 1, whiteKeyWidth - 2, height - 2);
						overlay.endFill();
						overlay.visible = false;

						app.stage.addChild(bg);
						app.stage.addChild(overlay);
						keyMapRef.current.set(midi, { bg, overlay, isBlack: false, width: whiteKeyWidth, height });
						whiteIndex++;
					}
				}

				// 白鍵X位置の取得関数
				const whiteMidiToX = (midi: number): number => {
					let idx = 0;
					for (let n = MIN_NOTE; n <= midi; n++) {
						if (!BLACK_NOTES.has(n % 12)) idx++;
					}
					return (idx - 1) * whiteKeyWidth;
				};

				// 黒鍵描画（白鍵の上に）
				for (let midi = MIN_NOTE; midi <= MAX_NOTE; midi++) {
					if (BLACK_NOTES.has(midi % 12)) {
						const prevWhiteMod = BLACK_PREV_WHITE[midi % 12];
						let prevMidi = midi - 1;
						while (prevMidi >= MIN_NOTE && (prevMidi % 12) !== prevWhiteMod) prevMidi--;
						if (prevMidi < MIN_NOTE) continue;
						const baseX = whiteMidiToX(prevMidi);
						const x = Math.floor(baseX + whiteKeyWidth * 0.65);
						const bg = new (pixiRef.current as any).Graphics();
						bg.beginFill(0x222222);
						bg.lineStyle(1, 0x111111);
						bg.drawRect(x - Math.floor(blackKeyWidth / 2), 0, blackKeyWidth, blackKeyHeight);
						bg.endFill();
						bg.zIndex = 10;
						bg.eventMode = 'static';
						bg.cursor = 'pointer';
						bg.on('pointerdown', () => handleKeyDown(midi));
						bg.on('pointerup', () => handleKeyUp(midi));
						bg.on('pointerupoutside', () => handleKeyUp(midi));
						bg.on('pointerout', () => handleKeyUp(midi));

						const overlay = new (pixiRef.current as any).Graphics();
						overlay.beginFill(0x448aff, 0.45); // 青系の薄いハイライト
						overlay.lineStyle(0, 0x000000, 0);
						overlay.drawRect(x - Math.floor(blackKeyWidth / 2) + 1, 1, blackKeyWidth - 2, blackKeyHeight - 2);
						overlay.endFill();
						overlay.zIndex = 11;
						overlay.visible = false;

						app.stage.addChild(bg);
						app.stage.addChild(overlay);
						keyMapRef.current.set(midi, { bg, overlay, isBlack: true, width: blackKeyWidth, height: blackKeyHeight });
					}
				}

				// zIndex 有効化
				(app.stage as any).sortableChildren = true;

				// 初期スクロール位置（C4）
				const c4x = whiteMidiToX(MIDDLE_C);
				wrapper.scrollLeft = Math.max(0, c4x - wrapper.clientWidth / 2 + whiteKeyWidth / 2);

				setIsReady(true);
			} catch (e) {
				console.error('Failed to initialize PixiPiano', e);
			}
		})();

		return () => {
			destroyed = true;
			try {
				if (appRef.current) {
					appRef.current.destroy(true, { children: true });
					appRef.current = null;
				}
				keyMapRef.current.clear();
			} catch {}
		};
	}, [isVisible, isReady]);

	// MIDIデバイス接続
	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				await midiController.initialize();
				if (!mounted) return;
				if (selectedMidiDevice) {
					await midiController.connectDevice(selectedMidiDevice);
				}
			} catch (e) {
				console.warn('MIDI init/connect skipped or failed', e);
			}
		})();
		return () => { mounted = false; };
	}, [midiController, selectedMidiDevice]);

	// クリック/タッチでノートオン・オフ
	const handleKeyDown = (midi: number) => {
		initializeAudioSystem().catch(() => {});
		playNote(midi).catch(() => {});
		setKeyActive(midi, true);
	};

	const handleKeyUp = (midi: number) => {
		stopNote(midi);
		setKeyActive(midi, false);
	};

	const setKeyActive = (midi: number, active: boolean) => {
		const key = keyMapRef.current.get(midi);
		if (!key) return;
		try {
			key.overlay.visible = active;
		} catch {}
	};

	return (
		<div ref={wrapperRef} className="w-full h-full overflow-x-auto overflow-y-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
			<div ref={canvasHostRef} className="h-full" />
		</div>
	);
};

function countWhiteKeysInRange(min: number, max: number): number {
	let count = 0;
	for (let m = min; m <= max; m++) {
		if (!BLACK_NOTES.has(m % 12)) count++;
	}
	return count;
}

export default PixiPiano;