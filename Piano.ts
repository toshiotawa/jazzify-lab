import { platform } from "../../platform/index.js";

// ピアノ関連の型定義
interface KeyEvent {
    pitch: number;
    velocity?: number;
}

interface KeyPosition {
    x: number;
    width: number;
}

interface EventListener {
    (data: any): void;
}

export default class Piano {
    private minNote: number = 21;
    private maxNote: number = 108;
    private whiteKeyWidth: number = 24;
    private blackKeyWidth: number = 14;
    private totalWhiteKeys: number;
    private eventListeners: Map<string, Set<EventListener>>;
    private activeKeys: Set<number>;
    private isMIDIEnabled: boolean = false;
    private keyElementsCache: Map<number, HTMLElement>;
    private requestAnimationFrameId: number | null = null;
    private pendingKeyUpdates: Map<number, boolean>;
    private batchUpdateScheduled: boolean = false;
    private isPortrait: boolean;
    private pianoContainer: HTMLElement | null = null;
    private handleMouseMove: (e: MouseEvent) => void;

    constructor() {
        this.totalWhiteKeys = this.calculateTotalWhiteKeys();
        this.eventListeners = new Map();
        this.activeKeys = new Set();
        this.keyElementsCache = new Map();
        this.pendingKeyUpdates = new Map();
        
        const windowObj = platform.getWindow();
        this.isPortrait = windowObj.innerHeight > windowObj.innerWidth;

        this.handleMouseMove = this.createMouseMoveHandler();
        this.initializePianoKeys();
        this.setupEventHandlers();
        this.setupResizeHandlers();
    }

    private calculateTotalWhiteKeys(): number {
        let count = 0;
        for (let note = this.minNote; note <= this.maxNote; note++) {
            if (!this.isBlackKey(note)) {
                count++;
            }
        }
        return count;
    }

    private isBlackKey(midiNote: number): boolean {
        const noteInOctave = midiNote % 12;
        return [1, 3, 6, 8, 10].includes(noteInOctave);
    }

    private setupEventHandlers(): void {
        this.on("noteOn", (note: number) => {
            if (this.isNoteInRange(note)) {
                this.activeKeys.add(note);
                this.scheduleKeyUpdate(note, true);
            }
        });
        
        this.on("noteOff", (note: number) => {
            this.activeKeys.delete(note);
            this.scheduleKeyUpdate(note, false);
        });
    }

    private setupResizeHandlers(): void {
        const debouncedResize = this.debounce(this.handleResize.bind(this), 100);
        platform.addEventListener(platform.getWindow(), "resize", debouncedResize);
        
        platform.addEventListener(platform.getWindow(), "orientationchange", () => {
            this.handleOrientationChange();
            setTimeout(() => this.handleOrientationChange(), 300);
            setTimeout(() => this.handleOrientationChange(), 600);
        });
        
        this.handleResize();
    }

    private debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
        let timeout: number | undefined;
        return function executedFunction(...args: Parameters<T>) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = window.setTimeout(later, wait);
        };
    }

    private handleResize(): void {
        const windowObj = platform.getWindow();
        const newIsPortrait = windowObj.innerHeight > windowObj.innerWidth;
        
        if (this.isPortrait !== newIsPortrait) {
            this.isPortrait = newIsPortrait;
            this.handleOrientationChange();
            return;
        }
        
        this.updateBlackKeyPositions();
        this.adjustForScreenSize();
        this.adjustPianoScale();
    }

    // その他のメソッドは同様にTypeScript化...
    
    on(eventName: string, callback: EventListener): void {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, new Set());
        }
        this.eventListeners.get(eventName)!.add(callback);
    }

    off(eventName: string, callback: EventListener): void {
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName)!.delete(callback);
        }
    }

    private emit(eventName: string, data: any): void {
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName)!.forEach(callback => callback(data));
        }
    }

    private isNoteInRange(midiNote: number): boolean {
        return midiNote >= this.minNote && midiNote <= this.maxNote;
    }

    private scheduleKeyUpdate(note: number, isActive: boolean): void {
        this.pendingKeyUpdates.set(note, isActive);
        
        if (!this.batchUpdateScheduled) {
            this.batchUpdateScheduled = true;
            requestAnimationFrame(() => this.processBatchKeyUpdates());
        }
    }

    private processBatchKeyUpdates(): void {
        const keysToUpdate = new Map<any, boolean>();
        
        this.pendingKeyUpdates.forEach((isActive, note) => {
            let key = this.keyElementsCache.get(note);
            if (!key) {
                key = platform.querySelector(`[data-pitch="${note}"]`) as any;
                if (key) {
                    this.keyElementsCache.set(note, key);
                }
            }
            if (key) {
                keysToUpdate.set(key, isActive);
            }
        });

        keysToUpdate.forEach((isActive, key) => {
            if (isActive) {
                key.classList.add("active");
            } else {
                key.classList.remove("active");
            }
        });

        this.pendingKeyUpdates.clear();
        this.batchUpdateScheduled = false;
    }

    private initializePianoKeys(): void {
        const initializeWhenReady = () => {
            if (platform.getDocument().readyState === "loading") {
                platform.addEventListener(platform.getDocument(), "DOMContentLoaded", () => {
                    this.actualInitializePianoKeys();
                });
            } else {
                this.actualInitializePianoKeys();
            }
        };
        
        initializeWhenReady();
    }

    private actualInitializePianoKeys(): void {
        console.log('DEBUG: actualInitializePianoKeys() called');
        
        this.pianoContainer = platform.getElementById('piano') as any;
        if (!this.pianoContainer) {
            console.error('Piano container not found - creating it');
            
            // piano要素を自動作成
            const pianoContainerParent = platform.getElementById('piano-container');
            if (pianoContainerParent) {
                const newPianoElement = platform.createElement('div');
                newPianoElement.id = 'piano';
                pianoContainerParent.appendChild(newPianoElement);
                this.pianoContainer = newPianoElement as any;
                console.log('DEBUG: Piano element created');
            } else {
                console.error('DEBUG: piano-container not found, cannot proceed');
                return;
            }
        }
        
        console.log('DEBUG: Piano container found, initializing keys...');
        
        // piano-content-wrapperがなければ作成する
        let pianoContentWrapper = platform.getElementById('piano-content-wrapper');
        if (!pianoContentWrapper) {
            pianoContentWrapper = platform.createElement('div');
            pianoContentWrapper.id = 'piano-content-wrapper';
            (this.pianoContainer as any).parentNode.insertBefore(pianoContentWrapper, this.pianoContainer);
            (pianoContentWrapper as any).appendChild(this.pianoContainer);
            console.log('DEBUG: Piano content wrapper created');
        }
        
        (this.pianoContainer as any).innerHTML = '';
        this.keyElementsCache.clear(); // キャッシュをクリア

        // Create piano keys
        let whiteKeyCount = 0;
        let blackKeyCount = 0;
        
        for (let note = this.minNote; note <= this.maxNote; note++) {
            const key = this.createKey(note);
            if (key) {
                (this.pianoContainer as any).appendChild(key);
                this.keyElementsCache.set(note, key);
                
                if (key.classList.contains('white')) {
                    whiteKeyCount++;
                } else if (key.classList.contains('black')) {
                    blackKeyCount++;
                }
            } else {
                console.warn(`DEBUG: Failed to create key for note ${note}`);
            }
        }
        
        console.log(`DEBUG: Piano keys created - White: ${whiteKeyCount}, Black: ${blackKeyCount}, Total: ${whiteKeyCount + blackKeyCount}`);
        
        // DOMに反映されるまで少し待つ
        setTimeout(() => {
            const verifyWhiteKeys = platform.querySelectorAll('.piano-key.white');
            const verifyBlackKeys = platform.querySelectorAll('.piano-key.black');
            console.log(`DEBUG: Piano keys verification - White: ${verifyWhiteKeys.length}, Black: ${verifyBlackKeys.length}`);
            
            // ピアノコンテナの状態を確認
            const pianoRect = (this.pianoContainer as any).getBoundingClientRect();
            console.log(`DEBUG: Piano container dimensions: ${pianoRect.width}x${pianoRect.height}`);
            console.log(`DEBUG: Piano container visible:`, pianoRect.width > 0 && pianoRect.height > 0);
            
            // 白鍵の可視性を確認
            if (verifyWhiteKeys.length > 0) {
                const firstKeyRect = verifyWhiteKeys[0].getBoundingClientRect();
                console.log(`DEBUG: First white key dimensions: ${firstKeyRect.width}x${firstKeyRect.height}`);
                console.log(`DEBUG: First white key style:`, verifyWhiteKeys[0].style.backgroundColor, verifyWhiteKeys[0].style.border);
            }
        }, 10);

        // スタイルの設定
        const windowObj = platform.getWindow();
        const isMobile = windowObj.innerWidth <= 768;
        const isVerySmall = windowObj.innerWidth <= 380;
        
        (this.pianoContainer as any).style.display = 'flex';
        (this.pianoContainer as any).style.position = 'relative';
        (this.pianoContainer as any).style.height = '100%';
        (this.pianoContainer as any).style.backgroundColor = '#fff';
        (this.pianoContainer as any).style.overflow = 'hidden';
        
        // 基本的なピアノキースタイルを適用
        this.applyBasicPianoStyles();

        // マウスとタッチイベントの設定
        this.bindEventListeners();
        
        // 初回の黒鍵位置を設定
        this.updateBlackKeyPositions();
        
        // 画面サイズに応じた調整を適用
        this.adjustForScreenSize();
        
        // 鍵盤スケールの調整
        this.adjustPianoScale();
        
        console.log('DEBUG: Piano initialization completed successfully');
    }



    private createWhiteKey(note: number, index: number): any {
        const key = platform.createElement('div');
        key.className = 'piano-key white-key';
        key.setAttribute('data-pitch', note.toString());
        key.style.left = `${index * this.whiteKeyWidth}px`;
        key.style.width = `${this.whiteKeyWidth}px`;
        key.style.height = '120px';
        key.style.position = 'absolute';
        key.style.backgroundColor = '#ffffff';
        key.style.border = '1px solid #ccc';
        key.style.borderRadius = '0 0 4px 4px';
        key.style.cursor = 'pointer';

        // クリックイベント
        key.addEventListener('mousedown', () => this.handleKeyPress(note));
        key.addEventListener('mouseup', () => this.handleKeyRelease(note));
        key.addEventListener('mouseleave', () => this.handleKeyRelease(note));

        return key;
    }

    private createBlackKey(note: number): any {
        const key = platform.createElement('div');
        key.className = 'piano-key black-key';
        key.setAttribute('data-pitch', note.toString());
        key.style.width = `${this.blackKeyWidth}px`;
        key.style.height = '80px';
        key.style.position = 'absolute';
        key.style.backgroundColor = '#333333';
        key.style.border = '1px solid #222';
        key.style.borderRadius = '0 0 2px 2px';
        key.style.cursor = 'pointer';
        key.style.zIndex = '2';

        // 黒鍵の位置計算
        const position = this.calculateBlackKeyPosition(note);
        key.style.left = `${position}px`;

        // クリックイベント
        key.addEventListener('mousedown', () => this.handleKeyPress(note));
        key.addEventListener('mouseup', () => this.handleKeyRelease(note));
        key.addEventListener('mouseleave', () => this.handleKeyRelease(note));

        return key;
    }

    private calculateBlackKeyPosition(note: number): number {
        const noteInOctave = note % 12;
        let whiteKeyIndex = 0;
        
        // この黒鍵より前の白鍵の数を数える
        for (let n = this.minNote; n < note; n++) {
            if (!this.isBlackKey(n)) {
                whiteKeyIndex++;
            }
        }

        // 黒鍵のオフセット
        const blackKeyOffsets = {
            1: 0.7,   // C#
            3: 1.7,   // D#
            6: 2.8,   // F#
            8: 3.8,   // G#
            10: 4.8   // A#
        };

        const offset = blackKeyOffsets[noteInOctave as keyof typeof blackKeyOffsets] || 0;
        const octaveStart = whiteKeyIndex - (whiteKeyIndex % 7);
        
        return (octaveStart + offset) * this.whiteKeyWidth - (this.blackKeyWidth / 2);
    }

    // 統一されたキー作成メソッド（元のpiano.jsベース）
    private createKey(midiNote: number): any {
        try {
            const isBlackKey = this.isBlackKey(midiNote);
            const key = platform.createElement('div');
            
            if (!key) {
                console.error('Failed to create key element for note:', midiNote);
                return null;
            }
            
            key.setAttribute('data-pitch', midiNote.toString());
            key.className = isBlackKey ? 'piano-key black' : 'piano-key white';
            
            // 白鍵の場合の境界線クラス追加
            if (!isBlackKey) {
                const noteInOctave = midiNote % 12;
                if (noteInOctave === 11 || noteInOctave === 4) {
                    key.classList.add('boundary-left');
                }
                if (noteInOctave === 0 || noteInOctave === 5) {
                    key.classList.add('boundary-right');
                }
            }
            // 黒鍵の場合
            else {
                key.style.position = 'absolute';
            }
            
            // イベントリスナーを追加
            key.addEventListener('mousedown', () => this.handleKeyPress(midiNote));
            key.addEventListener('mouseup', () => this.handleKeyRelease(midiNote));
            key.addEventListener('mouseleave', () => this.handleKeyRelease(midiNote));
            
            return key;
        } catch (error) {
            console.error('Error creating piano key for note', midiNote, ':', error);
            return null;
        }
    }

    // 黒鍵位置更新（元のpiano.jsの実装）
    private updateBlackKeyPositions(): void {
        const blackKeys = platform.querySelectorAll('.piano-key.black');
        const pianoContainer = platform.getElementById('piano');
        
        if (!pianoContainer) return;
        
        const containerRect = pianoContainer.getBoundingClientRect();
        const windowObj = platform.getWindow();
        const isMobile = windowObj.innerWidth <= 768;
        const isVerySmall = windowObj.innerWidth <= 380;
        const isPortrait = windowObj.innerHeight > windowObj.innerWidth;
        
        // 画面サイズに基づいて黒鍵の幅の比率を決定
        let blackKeyWidthRatio = 0.6; // デフォルトは白鍵の60%
        if (isMobile) blackKeyWidthRatio = 0.5;
        if (isVerySmall) blackKeyWidthRatio = 0.4;
        
        if (isMobile && isPortrait) {
            blackKeyWidthRatio = 0.45;
            if (isVerySmall) blackKeyWidthRatio = 0.35;
        }
        
        // 白鍵のリスト（一度だけ計算）
        const whiteKeys: Record<number, DOMRect> = {};
        platform.querySelectorAll('.piano-key.white').forEach(key => {
            const pitch = parseInt(key.getAttribute('data-pitch') || '0');
            whiteKeys[pitch] = key.getBoundingClientRect();
        });
        
        blackKeys.forEach(blackKey => {
            const midiNote = parseInt(blackKey.getAttribute('data-pitch') || '0');
            const noteInOctave = midiNote % 12;
            
            // 隣接する白鍵のMIDIノート番号を計算
            let prevWhiteNote, nextWhiteNote;
            switch (noteInOctave) {
                case 1:  // C#
                    prevWhiteNote = midiNote - 1;
                    nextWhiteNote = midiNote + 1;
                    break;
                case 3:  // D#
                    prevWhiteNote = midiNote - 1;
                    nextWhiteNote = midiNote + 1;
                    break;
                case 6:  // F#
                    prevWhiteNote = midiNote - 1;
                    nextWhiteNote = midiNote + 1;
                    break;
                case 8:  // G#
                    prevWhiteNote = midiNote - 1;
                    nextWhiteNote = midiNote + 1;
                    break;
                case 10: // A#
                    prevWhiteNote = midiNote - 1;
                    nextWhiteNote = midiNote + 1;
                    break;
                default:
                    return;
            }

            const prevRect = whiteKeys[prevWhiteNote];
            const nextRect = whiteKeys[nextWhiteNote];
            
            if (!prevRect || !nextRect) return;

            // 中央位置を計算（コンテナからの相対位置）
            const center = (
                (prevRect.right - containerRect.left) + 
                (nextRect.left - containerRect.left)
            ) / 2;
            
            // 黒鍵の幅を白鍵の幅に基づいて計算
            const whiteKeyWidth = prevRect.width;
            const blackKeyWidth = whiteKeyWidth * blackKeyWidthRatio;
            
            // スタイルを更新
            blackKey.style.width = `${blackKeyWidth}px`;
            blackKey.style.left = `${center - (blackKeyWidth / 2)}px`;
        });
    }

    // 基本ピアノスタイル適用（元のpiano.jsベース）
    private applyBasicPianoStyles(): void {
        // CSS変数を設定
        const documentElement = platform.getDocument().documentElement;
        (documentElement.style as any).setProperty('--white-key-width', '2.86%');
        (documentElement.style as any).setProperty('--black-key-width', '1.7%');

        const whiteKeys = platform.querySelectorAll('.piano-key.white');
        const blackKeys = platform.querySelectorAll('.piano-key.black');

        // 白鍵のスタイル
        whiteKeys.forEach(key => {
            key.style.width = '2.86%';
            key.style.height = '100%';
            key.style.backgroundColor = '#ffffff';
            key.style.border = '1px solid #ccc';
            key.style.borderTop = '1px solid #999';
            key.style.borderBottom = '1px solid #666';
            key.style.display = 'inline-block';
            key.style.position = 'relative';
            key.style.cursor = 'pointer';
            key.style.userSelect = 'none';
            key.style.transition = 'background-color 0.1s ease';
        });

        // 黒鍵のスタイル
        blackKeys.forEach(key => {
            key.style.width = '1.7%';
            key.style.height = '55%';
            key.style.backgroundColor = '#2c2c2c';
            key.style.border = '1px solid #000';
            key.style.position = 'absolute';
            key.style.top = '0';
            key.style.zIndex = '2';
            key.style.cursor = 'pointer';
            key.style.userSelect = 'none';
            key.style.transition = 'background-color 0.1s ease';
            key.style.borderRadius = '0 0 3px 3px';
        });

        // アクティブ状態のスタイル追加
        try {
            const style = platform.createElement('style');
            style.textContent = `
                .piano-key.white.active {
                    background-color: #e0e0e0 !important;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2) !important;
                }
                .piano-key.black.active {
                    background-color: #1a1a1a !important;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5) !important;
                }
                .piano-key:hover {
                    filter: brightness(0.95);
                }
            `;
            (platform.getDocument().head as any).appendChild(style);
        } catch (error) {
            console.warn('Failed to add dynamic styles:', error);
        }

        console.log(`✅ Piano styling completed: ${whiteKeys.length} white keys, ${blackKeys.length} black keys`);
    }

    private adjustForScreenSize(): void {
        // 画面サイズに応じた調整
        const windowObj = platform.getWindow();
        const pianoContainer = platform.getElementById('piano-container');
        if (pianoContainer) {
            if (windowObj.innerWidth <= 768) {
                pianoContainer.style.height = '120px';
            } else {
                pianoContainer.style.height = '150px';
            }
        }
    }

    private adjustPianoScale(): void {
        // ピアノスケール調整
        const windowObj = platform.getWindow();
        const pianoContainer = platform.getElementById('piano');
        if (pianoContainer && windowObj.innerWidth <= 480) {
            pianoContainer.style.transform = 'scale(0.9)';
            pianoContainer.style.transformOrigin = 'left top';
        }
    }

    private handleOrientationChange(): void {
        // 向き変更処理の実装
        const windowObj = platform.getWindow();
        this.isPortrait = windowObj.innerHeight > windowObj.innerWidth;
        
        // 少し遅延をかけて再レイアウト
        setTimeout(() => {
            this.updateBlackKeyPositions();
            this.adjustForScreenSize();
        }, 100);
    }

    // イベントリスナーのバインド（元のpiano.jsベース）
    private bindEventListeners(): void {
        if (!this.pianoContainer) return;

        // レンダリングに影響を与えないようにタッチデータを追跡する変数
        let touchStartY: number;
        let touchStartX: number;
        let isSwiping = false;
        let activeTouch: number | null = null;
        let lastTouchedKey: any = null;
        let touchMoveThrottled = false;
        const touchThrottleDelay = 16; // 約60FPSに制限

        // マウスイベントの最適化
        (this.pianoContainer as any).addEventListener('mousedown', (e: MouseEvent) => {
            if (e.button !== 0) return; // 左クリックのみ処理
            
            const key = (e.target as any).closest('.piano-key');
            if (key) {
                const pitch = parseInt(key.getAttribute('data-pitch'));
                this.handleKeyPress(pitch);
                
                // マウス移動のキャプチャを開始（ドラッグ処理用）
                platform.addEventListener(platform.getDocument(), 'mousemove', this.handleMouseMove);
            }
        });

        platform.addEventListener(platform.getDocument(), 'mouseup', () => {
            // マウス移動のキャプチャを停止
            platform.removeEventListener(platform.getDocument(), 'mousemove', this.handleMouseMove);
            
            // activeKeysをループで処理（コピーして反復）
            const currentActiveKeys = [...this.activeKeys];
            currentActiveKeys.forEach(pitch => {
                this.handleKeyRelease(pitch);
            });
        });

        // タッチイベントの最適化 - パフォーマンス強化
        (this.pianoContainer as any).addEventListener('touchstart', (e: TouchEvent) => {
            e.preventDefault(); // デフォルトの動作を防止
            if (e.touches.length === 0) return;

            const touch = e.touches[0];
            touchStartY = touch.clientY;
            touchStartX = touch.clientX;
            activeTouch = touch.identifier;
            isSwiping = false;
            
            const key = platform.elementFromPoint(touch.clientX, touch.clientY)?.closest('.piano-key');
            if (key) {
                lastTouchedKey = key;
                const pitch = parseInt(key.getAttribute('data-pitch') || '0');
                this.handleKeyPress(pitch);
            }
        }, { passive: false });

        (this.pianoContainer as any).addEventListener('touchmove', (e: TouchEvent) => {
            if (!activeTouch || touchMoveThrottled) return;
            
            // タッチイベントをスロットリング（パフォーマンス向上）
            touchMoveThrottled = true;
            setTimeout(() => { touchMoveThrottled = false; }, touchThrottleDelay);
            
            const touchIndex = Array.from(e.touches).findIndex(t => t.identifier === activeTouch);
            if (touchIndex === -1) return;
            
            const touch = e.touches[touchIndex];
            const deltaY = Math.abs(touch.clientY - touchStartY);
            const deltaX = Math.abs(touch.clientX - touchStartX);
            
            // スワイプ判定のしきい値を下げて反応性を向上
            if (deltaY > 5 || deltaX > 5) {
                if (!isSwiping) {
                    isSwiping = true;
                    // スワイプ開始時に押されていたキーを解放
                    if (lastTouchedKey) {
                        const pitch = parseInt(lastTouchedKey.getAttribute('data-pitch'));
                        this.handleKeyRelease(pitch);
                        lastTouchedKey = null;
                    }
                }
                
                // スワイプ中の新しいキータッチを処理
                const key = platform.elementFromPoint(touch.clientX, touch.clientY)?.closest('.piano-key');
                if (key && key !== lastTouchedKey) {
                    lastTouchedKey = key;
                    const pitch = parseInt(key.getAttribute('data-pitch') || '0');
                    this.handleKeyPress(pitch);
                }
            }
        }, { passive: true });

        (this.pianoContainer as any).addEventListener('touchend', (e: TouchEvent) => {
            if (lastTouchedKey) {
                const pitch = parseInt(lastTouchedKey.getAttribute('data-pitch'));
                this.handleKeyRelease(pitch);
            }
            
            // 状態をリセット
            activeTouch = null;
            lastTouchedKey = null;
            isSwiping = false;
        }, { passive: true });

        (this.pianoContainer as any).addEventListener('touchcancel', () => {
            if (lastTouchedKey) {
                const pitch = parseInt(lastTouchedKey.getAttribute('data-pitch'));
                this.handleKeyRelease(pitch);
            }
            
            // 状態をリセット
            activeTouch = null;
            lastTouchedKey = null;
            isSwiping = false;
        }, { passive: true });
    }

    private createMouseMoveHandler(): (e: MouseEvent) => void {
        return (e: MouseEvent) => {
            const key = platform.elementFromPoint(e.clientX, e.clientY)?.closest(".piano-key") as any;
            if (key) {
                const pitch = parseInt(key.getAttribute("data-pitch")!);
                if (!this.activeKeys.has(pitch)) {
                    this.handleKeyPress(pitch);
                }
            }
        };
    }

    private handleKeyPress(pitch: number): void {
        if (!this.isNoteInRange(pitch)) return;
        this.activeKeys.add(pitch);
        this.scheduleKeyUpdate(pitch, true);
        this.emit("keyPress", pitch);
    }

    private handleKeyRelease(pitch: number): void {
        if (!this.isNoteInRange(pitch)) return;
        this.activeKeys.delete(pitch);
        this.scheduleKeyUpdate(pitch, false);
        this.emit("keyRelease", pitch);
    }

    show(): void {
        const pianoContainer = platform.getElementById("piano-container");
        if (pianoContainer) {
            pianoContainer.style.display = "block";
        }
    }

    hide(): void {
        const pianoContainer = platform.getElementById("piano-container");
        if (pianoContainer) {
            pianoContainer.style.display = "none";
        }
    }

    setMIDIEnabled(enabled: boolean): void {
        this.isMIDIEnabled = enabled;
        const pianoElement = platform.getElementById("piano");
        if (pianoElement) {
            pianoElement.classList.toggle("midi-enabled", enabled);
        }
    }
}
