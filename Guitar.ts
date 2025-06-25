import { platform } from '../../platform/index.js';

// PIXIをグローバル変数として扱う（型安全性よりも機能優先）
declare const PIXI: any;

// 型定義
interface InstrumentType {
    name: string;
    strings: number;
    tuning: Record<number, number>;
    stringThickness: number[];
    fretboardColor: number;
    hasFrets: boolean;
}

interface InstrumentTypes {
    guitar: InstrumentType;
    bass4: InstrumentType;
    bass5: InstrumentType;
    bass6: InstrumentType;
}

interface FretPosition {
    string: number;
    fret: number;
    priority: number;
    originalNote?: number;
    octaveShift?: number;
}

interface ColorSettings {
    fretboard: number;
    string: number;
    fret: number;
    nut: number;
    marker: number;
    chargingCircle: number;
    chargingCircleFill: number;
}

interface NoteData {
    id: string;
    pitch: number;
    time: number;
    appearTime: number;
}

interface ChargingCircle {
    innerCircle: any;
    outerCircle: any;
    approachCircle: any;
    noteData: NoteData;
    chargeProgress: number;
    isApproachCircleDestroyed: boolean;
    timingFlashRing?: any;
    timingFlashStartTime?: number;
    addChild: (child: any) => void;
    removeChild: (child: any) => void;
    children: any[];
    scale: { set: (value: number) => void };
    alpha: number;
    destroy: (options?: any) => void;
    [key: string]: any; // 任意のプロパティを許可
}

export default class Guitar {
    private gameInstance: any;
    private container: any = null;
    private fretboardContainer: any = null;
    private app: any = null;
    private chargingCircles: Map<string, ChargingCircle> = new Map();
    private noteToFretMap: Map<string, FretPosition> = new Map();
    
    // 運指最適化のための状態追跡
    private lastPosition: FretPosition | null = null;
    private positionHistory: FretPosition[] = [];
    private readonly maxHistoryLength: number = 4;
    private anchorPosition: FretPosition | null = null;
    
    // 楽器タイプ設定
    private readonly instrumentTypes: InstrumentTypes;
    private currentInstrumentType: keyof InstrumentTypes = 'guitar';
    private tuning: Record<number, number>;
    
    // フレットボード設定
    private readonly fretCount: number = 24;
    private readonly fretWidth: number = 40;
    private readonly stringSpacing: number = 30;
    private readonly nutWidth: number = 8;
    private fretboardHeight: number = 0;
    private openStringWidth: number = 60;
    
    // フレットマーカー位置
    private readonly fretMarkers: number[] = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    private readonly doubleFretMarkers: number[] = [12, 24];
    
    // 色設定
    private readonly colors: ColorSettings;
    
    // 状態管理
    private isVisible: boolean = false;
    private resizeHandlerAdded: boolean = false;
    
    // UI要素
    private settingsButton: any = null;
    private settingsModal: any = null;
    private backgroundSprite: any = null;
    private guitarParticleContainer: any = null;

    constructor(gameInstance: any) {
        console.log('🎸 Guitar.ts constructor called!', { gameInstance: !!gameInstance });
        this.gameInstance = gameInstance;
        
        // 楽器タイプ設定
        this.instrumentTypes = {
            guitar: {
                name: 'Guitar',
                strings: 6,
                tuning: {
                    1: 64, // E4 (1弦 - 最も高い)
                    2: 59, // B3 (2弦)
                    3: 55, // G3 (3弦)
                    4: 50, // D3 (4弦)
                    5: 45, // A2 (5弦)
                    6: 40  // E2 (6弦 - 最も低い)
                },
                stringThickness: [1, 1.3, 1.6, 1.9, 2.2, 2.5],
                fretboardColor: 0x8B4513, // サドルブラウン（木目調）
                hasFrets: true
            },
            bass4: {
                name: '4-String Bass',
                strings: 4,
                tuning: {
                    1: 43, // G2 (1弦)
                    2: 38, // D2 (2弦)
                    3: 33, // A1 (3弦)
                    4: 28  // E1 (4弦)
                },
                stringThickness: [2.5, 3.0, 3.5, 4.0],
                fretboardColor: 0x654321, // ダークブラウン（木目調）
                hasFrets: true
            },
            bass5: {
                name: '5-String Bass',
                strings: 5,
                tuning: {
                    1: 43, // G2 (1弦)
                    2: 38, // D2 (2弦)
                    3: 33, // A1 (3弦)
                    4: 28, // E1 (4弦)
                    5: 23  // B0 (5弦)
                },
                stringThickness: [2.5, 3.0, 3.5, 4.0, 4.5],
                fretboardColor: 0x654321, // ダークブラウン（木目調）
                hasFrets: true
            },
            bass6: {
                name: '6-String Bass',
                strings: 6,
                tuning: {
                    1: 48, // C3 (1弦)
                    2: 43, // G2 (2弦)
                    3: 38, // D2 (3弦)
                    4: 33, // A1 (4弦)
                    5: 28, // E1 (5弦)
                    6: 23  // B0 (6弦)
                },
                stringThickness: [2.5, 2.8, 3.1, 3.4, 3.7, 4.0],
                fretboardColor: 0x654321, // ダークブラウン（木目調）
                hasFrets: true
            }
        };
        
        // 色設定
        this.colors = {
            fretboard: 0xD2691E,  // チョコレート色
            string: 0xFFFFFF,     // 白
            fret: 0xC0C0C0,       // シルバー
            nut: 0x000000,        // 黒
            marker: 0xFFD700,     // 金色
            chargingCircle: 0xFF6B6B,
            chargingCircleFill: 0xFF4444
        };
        
        // 初期楽器設定
        this.tuning = this.getCurrentInstrument().tuning;
        this.updateFretboardHeight();
        
        console.log('🎸 Guitar.ts constructor completed!');
    }

    // 現在の楽器設定を取得
    private getCurrentInstrument(): InstrumentType {
        return this.instrumentTypes[this.currentInstrumentType];
    }

    // フレットボード高さを更新
    private updateFretboardHeight(): void {
        const instrument = this.getCurrentInstrument();
        this.fretboardHeight = instrument.strings * this.stringSpacing + 40;
    }

    // 色の明度を調整するヘルパー関数
    private adjustColor(r: number, g: number, b: number, factor: number): number {
        const newR = Math.min(255, Math.max(0, Math.floor(r * factor)));
        const newG = Math.min(255, Math.max(0, Math.floor(g * factor)));
        const newB = Math.min(255, Math.max(0, Math.floor(b * factor)));
        return (newR << 16) | (newG << 8) | newB;
    }
    
    // 木材風グラデーションを作成
    private createWoodGradient(baseColor: number): number {
        // ベース色から明るい/暗いバリエーションを作成
        const r = (baseColor >> 16) & 0xFF;
        const g = (baseColor >> 8) & 0xFF;
        const b = baseColor & 0xFF;
        
        // 木材の自然な色合いの変化
        const lightColor = this.adjustColor(r, g, b, 1.2);
        const darkColor = this.adjustColor(r, g, b, 0.8);
        
        return baseColor; // PIXI.jsの制限により単色を返すが、後でテクスチャで改善可能
    }
    
    // グロッシーオーバーレイを作成
    private createGlossyOverlay(): number {
        return 0xFFFFFF; // 白のオーバーレイでグロッシー効果
    }
    
    // 弦のメタリックグラデーションを作成
    private createStringGradient(): number {
        return 0xC0C0C0; // シルバー基調
    }

    // 初期化メソッド
    public initialize(): any {
        console.log('🎸 Guitar.initialize() called');
        
        try {
            // 既に初期化されている場合はスキップ
            if (this.app && this.container) {
                console.log('🎸 Guitar already initialized, skipping...');
                return this.container;
            }

            // ギター専用キャンバス要素を取得
            const guitarCanvas = platform.getElementById('guitar-canvas');
            if (!guitarCanvas) {
                throw new Error('🎸 Guitar canvas element not found');
            }
            console.log('🎸 Guitar canvas found:', guitarCanvas);

            // 既存のPIXIアプリケーションを破棄（重複防止）
            if (this.app && typeof this.app.destroy === 'function') {
                this.app.destroy(true, true);
                this.app = null;
            }

            // 既存のキャンバス内容をクリア（重複防止）
            guitarCanvas.innerHTML = '';

            // ギター専用のPIXIアプリケーションを作成
            const windowObj = platform.getWindow();
            this.app = new PIXI.Application({
                width: windowObj.innerWidth,
                height: windowObj.innerHeight * 0.7, // 画面の70%の高さ
                backgroundColor: 0x001122, // 深い紺色の背景基準色
                powerPreference: 'low-power',
                antialias: true,
                autoDensity: true,
                resolution: windowObj.devicePixelRatio || 1,
            });
            console.log('🎸 PIXI Application created');

            // ギターキャンバスにPIXIビューを追加
            const pixiCanvas = this.app.view || this.app.canvas;
            if (pixiCanvas) {
                guitarCanvas.appendChild(pixiCanvas);
                console.log('🎸 PIXI canvas added to guitar canvas');
            } else {
                throw new Error('🎸 PIXI canvas not available');
            }
            
            // グラデーション背景を作成
            this.createGuitarGradientBackground();
            
            // メインコンテナ
            this.container = new PIXI.Container();
            this.app.stage.addChild(this.container);
            console.log('🎸 Main container created');
            
            // フレットボード背景
            this.fretboardContainer = new PIXI.Container();
            this.container.addChild(this.fretboardContainer);
            console.log('🎸 Fretboard container created');
            
            // フレットボードを描画
            this.drawFretboard();
            console.log('🎸 Fretboard drawn');
            
            // 設定ボタンを作成
            this.createSettingsButton();
            
            // 初期位置とサイズ調整
            this.updatePosition();
            
            // リサイズイベントの設定（重複登録防止）
            if (!this.resizeHandlerAdded) {
                try {
                    const windowObj = platform.getWindow();
                    if (windowObj && typeof windowObj.addEventListener === 'function') {
                        windowObj.addEventListener('resize', this.resize.bind(this));
                    } else {
                        // フォールバック: プラットフォーム抽象化レイヤー経由
                        platform.addEventListener(windowObj, 'resize', this.resize.bind(this));
                    }
                    this.resizeHandlerAdded = true;
                } catch (error) {
                    console.warn('🎸 Failed to add resize event listener:', error);
                }
            }
            
            console.log('🎸 Guitar initialized successfully with independent PIXI app');
            
            return this.container;
        } catch (error) {
            console.error('🎸 Failed to initialize guitar:', error);
            throw error;
        }
    }

    // グラデーション背景を作成
    private createGuitarGradientBackground(): void {
        const windowObj = platform.getWindow();
        const width = windowObj.innerWidth;
        const height = windowObj.innerHeight * 0.7;
        
        // 既存の背景スプライトをクリア
        if (this.backgroundSprite && this.app) {
            this.app.stage.removeChild(this.backgroundSprite);
        }
        if (this.guitarParticleContainer && this.app) {
            this.app.stage.removeChild(this.guitarParticleContainer);
        }
        
        // 静的な複雑グラデーション背景を作成
        this.createGuitarComplexBackground(width, height);
    }

    // ギター用複雑背景
    private createGuitarComplexBackground(width: number, height: number): void {
        const canvas = platform.createElement('canvas');
        const canvasElement = canvas.nativeElement as any; // 型キャスト
        canvasElement.width = width;
        canvasElement.height = height;
        const ctx = canvasElement.getContext('2d');
        
        // ベース：ビビッドなオーロラ放射状グラデーション
        const auroraGradient = ctx.createRadialGradient(
            width * 0.3, height * 0.7, 0,
            width * 0.5, height * 0.3, Math.max(width, height) * 0.9
        );
        auroraGradient.addColorStop(0, '#0088cc');
        auroraGradient.addColorStop(0.15, '#00aaff');
        auroraGradient.addColorStop(0.3, '#0066cc');
        auroraGradient.addColorStop(0.5, '#003388');
        auroraGradient.addColorStop(0.7, '#001155');
        auroraGradient.addColorStop(0.85, '#000a33');
        auroraGradient.addColorStop(1, '#000000');
        
        ctx.fillStyle = auroraGradient;
        ctx.fillRect(0, 0, width, height);
        
        // テクスチャとしてPIXIに追加
        const texture = PIXI.Texture.from(canvasElement);
        this.backgroundSprite = new PIXI.Sprite(texture);
        this.backgroundSprite.width = width;
        this.backgroundSprite.height = height;
        this.backgroundSprite.alpha = 0.75;
        
        if (this.app) {
            this.app.stage.addChildAt(this.backgroundSprite, 0);
        }
    }

    // 木目パターンを描画
    private drawWoodGrain(graphics: any, x: number, y: number, width: number, height: number, baseColor: number): void {
        // ベース色から木目の色を計算
        const r = (baseColor >> 16) & 0xFF;
        const g = (baseColor >> 8) & 0xFF;
        const b = baseColor & 0xFF;
        
        // 木目のライン数
        const grainLines = 15 + Math.floor(Math.random() * 10);
        
        for (let i = 0; i < grainLines; i++) {
            // 各木目ラインの位置と太さをランダムに
            const lineY = y + (height / grainLines) * i + Math.random() * (height / grainLines);
            const lineThickness = 0.5 + Math.random() * 2;
            
            // 色の明暗をランダムに変化
            const colorVariation = 0.7 + Math.random() * 0.6;
            const grainColor = this.adjustColor(r, g, b, colorVariation);
            
            // 波打つような木目を描画
            graphics.lineStyle(lineThickness, grainColor, 0.3);
            graphics.moveTo(x, lineY);
            
            // ベジェ曲線で自然な木目を表現
            const segments = 5;
            for (let j = 0; j < segments; j++) {
                const segmentWidth = width / segments;
                const cp1x = x + segmentWidth * j + segmentWidth * 0.3;
                const cp1y = lineY + (Math.random() - 0.5) * 5;
                const cp2x = x + segmentWidth * j + segmentWidth * 0.7;
                const cp2y = lineY + (Math.random() - 0.5) * 5;
                const endx = x + segmentWidth * (j + 1);
                const endy = lineY + (Math.random() - 0.5) * 3;
                
                graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endx, endy);
            }
        }
        
        // 縦方向の木目も少し追加
        const verticalGrains = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < verticalGrains; i++) {
            const lineX = x + Math.random() * width;
            const lineThickness = 0.3 + Math.random() * 1;
            const colorVariation = 0.8 + Math.random() * 0.4;
            const grainColor = this.adjustColor(r, g, b, colorVariation);
            
            graphics.lineStyle(lineThickness, grainColor, 0.2);
            graphics.moveTo(lineX, y);
            
            // 縦の木目も少し波打たせる
            const segments = 8;
            for (let j = 0; j < segments; j++) {
                const segmentHeight = height / segments;
                const cp1x = lineX + (Math.random() - 0.5) * 3;
                const cp1y = y + segmentHeight * j + segmentHeight * 0.3;
                const cp2x = lineX + (Math.random() - 0.5) * 3;
                const cp2y = y + segmentHeight * j + segmentHeight * 0.7;
                const endx = lineX + (Math.random() - 0.5) * 2;
                const endy = y + segmentHeight * (j + 1);
                
                graphics.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endx, endy);
            }
        }
    }

    // フレットマーカーを描画
    private drawFretMarkers(): void {
        const markerGraphics = new PIXI.Graphics();
        markerGraphics.beginFill(this.colors.marker, 0.3);
        
        this.fretMarkers.forEach(fret => {
            const x = this.nutWidth + (fret - 0.5) * this.fretWidth;
            
            if (this.doubleFretMarkers.includes(fret)) {
                // ダブルドット
                markerGraphics.drawCircle(x, this.fretboardHeight * 0.35, 8);
                markerGraphics.drawCircle(x, this.fretboardHeight * 0.65, 8);
            } else {
                // シングルドット
                markerGraphics.drawCircle(x, this.fretboardHeight * 0.5, 8);
            }
        });
        
        markerGraphics.endFill();
        this.fretboardContainer.addChild(markerGraphics);
    }
    
    // フレット番号を描画
    private drawFretNumbers(): void {
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            align: 'center',
            stroke: 0x000000,
            strokeThickness: 1
        });
        
        // 主要なフレットのみ表示
        const importantFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
        importantFrets.forEach(fret => {
            const text = new PIXI.Text(fret.toString(), style);
            text.anchor.set(0.5, 0.5);
            text.x = this.nutWidth + (fret - 0.5) * this.fretWidth;
            text.y = this.fretboardHeight - 10;
            this.fretboardContainer.addChild(text);
        });
    }
    
    // 解放弦ラベルを描画
    private drawOpenStringLabels(): void {
        const instrument = this.getCurrentInstrument();
        const noteNames = this.getOpenStringNoteNames();
        
        // ラベル用コンテナ（最前面に表示）
        const labelContainer = new PIXI.Container();
        
        for (let string = 1; string <= instrument.strings; string++) {
            // 各ラベル用のコンテナ
            const labelGroup = new PIXI.Container();
            
            // 背景を作成
            const bg = new PIXI.Graphics();
            bg.beginFill(0x000000, 0.6); // 半透明の黒背景
            bg.drawRoundedRect(-18, -12, 36, 24, 4);
            bg.endFill();
            labelGroup.addChild(bg);
            
            // テキストラベル
            const label = new PIXI.Text(noteNames[string - 1], {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0xFFFFFF,
                align: 'center'
            });
            
            label.anchor.set(0.5, 0.5);
            labelGroup.addChild(label);
            
            // 位置設定
            labelGroup.x = -this.openStringWidth / 2;
            labelGroup.y = this.getStringY(string);
            
            labelContainer.addChild(labelGroup);
        }
        
        // 最前面に追加（Z-order的に一番上）
        this.fretboardContainer.addChild(labelContainer);
    }

    // フレットボードを描画
    private drawFretboard(): void {
        if (!this.fretboardContainer) return;
        
        // フレットボードをクリア
        this.fretboardContainer.removeChildren();
        
        // 現在の楽器設定を取得
        const instrument = this.getCurrentInstrument();
        this.tuning = instrument.tuning;
        this.colors.fretboard = instrument.fretboardColor;
        
        // 解放弦エリアの幅を追加
        this.openStringWidth = 60;
        
        // 背景を描画
        const background = new PIXI.Graphics();
        const boardWidth = this.fretCount * this.fretWidth + this.nutWidth + this.openStringWidth;
        
        // ベース色を描画（角丸）
        background.beginFill(instrument.fretboardColor);
        background.drawRoundedRect(-this.openStringWidth, 0, boardWidth, this.fretboardHeight, 15);
        background.endFill();
        
        this.fretboardContainer.addChild(background);
        
        // 木目パターンを追加
        const woodGrain = new PIXI.Graphics();
        this.drawWoodGrain(woodGrain, -this.openStringWidth, 0, boardWidth, this.fretboardHeight, instrument.fretboardColor);
        this.fretboardContainer.addChild(woodGrain);
        
        // グラデーションツヤ効果のオーバーレイ
        const glossy = new PIXI.Graphics();
        const glossyHeight = this.fretboardHeight * 0.4;
        const gradientSteps = 10;
        for (let i = 0; i < gradientSteps; i++) {
            const y = (glossyHeight / gradientSteps) * i;
            const height = glossyHeight / gradientSteps;
            const alpha = 0.15 * (1 - i / gradientSteps); // 上から下へフェードアウト
            glossy.beginFill(0xFFFFFF, alpha);
            glossy.drawRect(-this.openStringWidth, y, boardWidth, height);
            glossy.endFill();
        }
        this.fretboardContainer.addChild(glossy);
        
        // 下部にグラデーションシャドウ
        const shadow = new PIXI.Graphics();
        const shadowStart = this.fretboardHeight * 0.7;
        const shadowHeight = this.fretboardHeight * 0.3;
        const shadowSteps = 10;
        for (let i = 0; i < shadowSteps; i++) {
            const y = shadowStart + (shadowHeight / shadowSteps) * i;
            const height = shadowHeight / shadowSteps;
            const alpha = 0.05 + 0.15 * (i / shadowSteps); // 下へ行くほど濃く
            shadow.beginFill(0x000000, alpha);
            shadow.drawRect(-this.openStringWidth, y, boardWidth, height);
            shadow.endFill();
        }
        this.fretboardContainer.addChild(shadow);
        
        // 解放弦エリアの背景
        const openStringArea = new PIXI.Graphics();
        openStringArea.beginFill(0x333333, 0.7); // 少し暗い背景
        openStringArea.drawRect(-this.openStringWidth, 0, this.openStringWidth, this.fretboardHeight);
        openStringArea.endFill();
        this.fretboardContainer.addChild(openStringArea);
        
        // フレットマーカー（フレットがある楽器のみ）
        if (instrument.hasFrets) {
            this.drawFretMarkers();
        }
        
        // 弦を描画
        const stringCount = instrument.strings;
        for (let string = 1; string <= stringCount; string++) {
            const stringContainer = new PIXI.Container();
            const thickness = instrument.stringThickness[string - 1];
            const y = this.getStringY(string);
            
            // メイン弦（シャドウ効果）
            const stringShadow = new PIXI.Graphics();
            stringShadow.lineStyle(thickness + 1, 0x000000, 0.3);
            stringShadow.moveTo(-this.openStringWidth, y + 1);
            stringShadow.lineTo(this.fretCount * this.fretWidth + this.nutWidth, y + 1);
            stringContainer.addChild(stringShadow);
            
            // メイン弦（メタリックグラデーション）
            const stringLine = new PIXI.Graphics();
            const stringGradient = this.createStringGradient();
            stringLine.lineStyle(thickness, stringGradient);
            stringLine.moveTo(-this.openStringWidth, y);
            stringLine.lineTo(this.fretCount * this.fretWidth + this.nutWidth, y);
            stringContainer.addChild(stringLine);
            
            // ハイライト
            const stringHighlight = new PIXI.Graphics();
            stringHighlight.lineStyle(Math.max(1, thickness * 0.3), 0xFFFFFF, 0.6);
            stringHighlight.moveTo(-this.openStringWidth, y - thickness * 0.25);
            stringHighlight.lineTo(this.fretCount * this.fretWidth + this.nutWidth, y - thickness * 0.25);
            stringContainer.addChild(stringHighlight);
            
            this.fretboardContainer.addChild(stringContainer);
        }
        
        // フレット（フレットがある楽器のみ）
        if (instrument.hasFrets) {
            for (let fret = 0; fret <= this.fretCount; fret++) {
                const fretLine = new PIXI.Graphics();
                fretLine.lineStyle(fret === 0 ? 4 : 2, fret === 0 ? this.colors.nut : this.colors.fret);
                const x = this.nutWidth + fret * this.fretWidth;
                fretLine.moveTo(x, 30);
                fretLine.lineTo(x, this.fretboardHeight - 30);
                this.fretboardContainer.addChild(fretLine);
            }
        } else {
            // ナット（ゼロフレット）のみ描画
            const nutLine = new PIXI.Graphics();
            nutLine.lineStyle(4, this.colors.nut);
            const x = this.nutWidth;
            nutLine.moveTo(x, 30);
            nutLine.lineTo(x, this.fretboardHeight - 30);
            this.fretboardContainer.addChild(nutLine);
        }
        
        // 解放弦ラベル（弦の上に表示されるよう最後に追加）
        this.drawOpenStringLabels();
        
        // フレット番号（フレットがある楽器のみ）
        if (instrument.hasFrets) {
            this.drawFretNumbers();
        }
    }

    // 弦のY座標を取得
    private getStringY(string: number): number {
        return 30 + (string - 1) * this.stringSpacing;
    }

    // 設定ボタンを作成
    private createSettingsButton(): void {
        const buttonContainer = new PIXI.Container();
        
        const button = new PIXI.Graphics();
        button.beginFill(0x333333, 0.8);
        button.drawRoundedRect(0, 0, 40, 40, 8);
        button.endFill();
        
        buttonContainer.addChild(button);
        buttonContainer.interactive = true;
        buttonContainer.buttonMode = true;
        
        // クリックイベント
        buttonContainer.on('pointerdown', () => {
            this.showSettingsModal();
        });
        
        this.settingsButton = buttonContainer;
        if (this.container) {
            this.container.addChild(buttonContainer);
        }
    }

    // 位置とサイズの更新
    private updatePosition(): void {
        if (!this.container || !this.app) return;

        const windowObj = platform.getWindow();
        const canvasWidth = windowObj.innerWidth;
        const fretboardWidth = this.fretCount * this.fretWidth + this.nutWidth;

        const maxWidth = canvasWidth * 0.9;
        const scale = Math.min(maxWidth / fretboardWidth, 1);

        // キャンバス高さ = フレットボード高さ * スケール + 余白 と 画面70% の大きい方
        const minCanvasHeight = Math.floor(windowObj.innerHeight * 0.7);
        const canvasHeight = Math.max(Math.ceil(this.fretboardHeight * scale + 60), minCanvasHeight);

        // レンダラーをリサイズ
        this.app.renderer.resize(canvasWidth, canvasHeight);
        
        // <canvas> 要素とラッパー div の高さも同期
        const pixiCanvas = this.app.view || this.app.canvas;
        if (pixiCanvas && pixiCanvas.style) {
            pixiCanvas.style.height = `${canvasHeight}px`;
        }
        
        const guitarCanvas = platform.getElementById('guitar-canvas');
        if (guitarCanvas) {
            guitarCanvas.style.height = `${canvasHeight}px`;
            guitarCanvas.style.flex = `1 1 auto`;
            guitarCanvas.style.backgroundColor = '#001122';
        }

        this.container.scale.set(scale);
        this.container.x = canvasWidth / 2;
        this.container.y = canvasHeight / 2;

        if (this.fretboardContainer) {
            this.fretboardContainer.x = -fretboardWidth / 2;
            this.fretboardContainer.y = -this.fretboardHeight / 2;
        }

        // 設定ボタンの位置を右上に配置
        if (this.settingsButton) {
            this.settingsButton.x = fretboardWidth / 2 + 20;
            this.settingsButton.y = -this.fretboardHeight / 2 - 20;
        }
    }

    // リサイズ処理
    private resize(): void {
        if (!this.app) return;
        
        // アニメーション要素をクリーンアップ（アニメーションなしモード）
        if (this.guitarParticleContainer) {
            this.app.stage.removeChild(this.guitarParticleContainer);
            this.guitarParticleContainer = null;
        }
        
        // 背景スプライトを更新
        if (this.backgroundSprite) {
            this.backgroundSprite.destroy();
        }
        this.createGuitarGradientBackground();
        
        // ウィンドウ幅の変化に応じてポジションを再計算
        this.updatePosition();
    }

    // 表示
    public show(): void {
        const guitarCanvas = platform.getElementById('guitar-canvas');
        if (guitarCanvas) {
            guitarCanvas.style.display = 'block';
            guitarCanvas.style.visibility = 'visible';
            guitarCanvas.style.opacity = '1';
            this.isVisible = true;
            
            if (this.app) {
                this.app.ticker.start();
                this.app.render();
            }
            
            this.updatePosition();
        }
    }

    // 非表示
    public hide(): void {
        const guitarCanvas = platform.getElementById('guitar-canvas');
        if (guitarCanvas) {
            guitarCanvas.style.display = 'none';
            guitarCanvas.style.visibility = 'hidden';
            guitarCanvas.style.opacity = '0';
            this.isVisible = false;
            
            if (this.app) {
                this.app.ticker.stop();
            }
            
            this.clear();
        }
    }

    // クリア（シーク・ループ時のミス判定なし版・高速化）
    public clear(): void {
        // バッチ処理で高速化
        const circlesToRemove: any[] = [];
        const circlesToDestroy: any[] = [];
        
        this.chargingCircles.forEach((circle, noteId) => {
            if (circle && !circle.destroyed) {
                circlesToRemove.push(circle);
                circlesToDestroy.push(circle);
            }
        });
        
        // バッチでDOMから削除
        circlesToRemove.forEach(circle => {
            if (circle.parent === this.fretboardContainer) {
                this.fretboardContainer.removeChild(circle);
            }
        });
        
        // バッチで破棄（非同期）
        Promise.resolve().then(() => {
            circlesToDestroy.forEach(circle => {
                try {
                    circle.destroy({ children: true });
                } catch (error) {
                    console.warn('Error destroying guitar circle:', error);
                }
            });
        });
        
        // マップとデータ構造のクリア（同期・高速）
        this.chargingCircles.clear();
        this.noteToFretMap.clear();
        this.positionHistory = [];
        this.anchorPosition = null;
    }

    // MIDIノート番号から最適なフレット位置を計算（スコアベース最適化）
    public getOptimalFretPosition(midiNote: number, noteData?: any): FretPosition | null {
        let originalNote = midiNote;
        let positions: FretPosition[] = [];
        let octaveOffset = 0;
        
        // 元のノートで可能なポジションを検索
        positions = this.findPositionsForNote(originalNote);
        
        // 音域外の場合、オクターブシフトを試行
        if (positions.length === 0) {
            const shiftCandidates = [-1, 1, -2, 2, -3, 3];
            for (const shift of shiftCandidates) {
                const shiftedNote = originalNote + (shift * 12);
                positions = this.findPositionsForNote(shiftedNote);

                if (positions.length > 0) {
                    octaveOffset = shift;
                    const instrumentName = this.getCurrentInstrument().name;
                    console.log(`${instrumentName}モード: 音域外のため ${shift > 0 ? '+' : ''}${shift}オクターブシフト適用 (${originalNote} → ${shiftedNote})`);
                    break;
                }
            }
        }
        
        if (positions.length === 0) {
            return null;
        }
        
        // 各ポジションのスコアを計算して最適化
        const scoredPositions = positions.map(pos => {
            const score = this.calculatePositionScore(pos, midiNote, noteData);
            return {
                ...pos,
                score: score,
                originalNote: originalNote,
                octaveShift: octaveOffset
            };
        });
        
        // スコアの高い順にソート
        scoredPositions.sort((a, b) => b.score - a.score);
        
        // 最高スコアのポジションを返す
        return scoredPositions[0];
    }

    // 指定されたMIDIノート番号で実際にフレット位置を検索
    private findPositionsForNote(midiNote: number): FretPosition[] {
        const positions: FretPosition[] = [];
        const instrument = this.getCurrentInstrument();
        const stringCount = instrument.strings;
        
        // 各弦でチェック（低弦から高弦の順で優先度）
        for (let string = stringCount; string >= 1; string--) {
            const openStringNote = this.tuning[string];
            if (!openStringNote) continue;
            
            const fret = midiNote - openStringNote;
            
            // フレットの有無に応じて範囲をチェック
            let isValidFret = false;
            if (instrument.hasFrets) {
                isValidFret = fret >= 0 && fret <= this.fretCount;
            } else {
                isValidFret = fret === 0;
            }
            
            if (isValidFret) {
                positions.push({
                    string: string,
                    fret: fret,
                    priority: fret === 0 ? 0 : string
                });
            }
        }
        
        return positions.sort((a, b) => a.priority - b.priority);
    }

    // ポジションスコア計算（運指最適化）
    private calculatePositionScore(position: FretPosition, midiNote: number, noteData?: any): number {
        let score = 0;
        
        // 1. ポジション移動距離ペナルティ
        if (this.lastPosition) {
            const fretMovement = Math.abs(position.fret - this.lastPosition.fret);
            score -= fretMovement * 2;
            
            const stringDistance = Math.abs(position.string - this.lastPosition.string);
            if (stringDistance > 1) {
                score -= stringDistance * 3;
            }
        }
        
        // 2. 開放弦ボーナス
        if (position.fret === 0) {
            score += 2;
        }
        
        // 3. 4連続同方向移動の抑制
        const consecutivePenalty = this.calculateConsecutiveDirectionPenalty(position);
        score -= consecutivePenalty;
        
        return score;
    }

    // 4連続同方向移動の抑制
    private calculateConsecutiveDirectionPenalty(position: FretPosition): number {
        if (this.positionHistory.length < 3) return 0;
        
        const recentHistory = this.positionHistory.slice(-3);
        recentHistory.push(position);
        
        if (!recentHistory.every(pos => pos.string === recentHistory[0].string)) {
            return 0;
        }
        
        const directions: number[] = [];
        for (let i = 1; i < recentHistory.length; i++) {
            const fretDiff = recentHistory[i].fret - recentHistory[i-1].fret;
            if (fretDiff > 0) directions.push(1);
            else if (fretDiff < 0) directions.push(-1);
            else directions.push(0);
        }
        
        const isConsecutiveSameDirection = 
            directions.length === 3 && 
            directions[0] !== 0 && 
            directions.every(dir => dir === directions[0]);
        
        if (isConsecutiveSameDirection) {
            return 20.0;
        }
        
        return 0;
    }

    // ポジション履歴の更新
    private updatePositionHistory(position: FretPosition): void {
        this.positionHistory.push(position);
        
        if (this.positionHistory.length > this.maxHistoryLength) {
            this.positionHistory.shift();
        }
    }

    // ノートを追加（充電アニメーション開始）
    public addNote(noteData: NoteData): void {
        console.log('🎸 Guitar.addNote called:', {
            noteId: noteData.id,
            pitch: noteData.pitch,
            time: noteData.time,
            appearTime: noteData.appearTime,
            isVisible: this.isVisible,
            fretboardContainer: !!this.fretboardContainer,
            appInitialized: !!this.app
        });
        
        try {
            const position = this.getOptimalFretPosition(noteData.pitch, noteData);
            console.log('🎸 Position calculated:', position);
            
            if (!position) {
                console.warn('🎸 No valid position found for note:', noteData.pitch);
                return;
            }
            
            this.lastPosition = position;
            this.updatePositionHistory(position);
            this.noteToFretMap.set(noteData.id, position);
            
            const circle = this.createChargingCircle(position, noteData);
            console.log('🎸 Charging circle created:', !!circle);
            
            if (circle) {
                this.chargingCircles.set(noteData.id, circle);
                console.log('🎸 Note added successfully. Total notes:', this.chargingCircles.size);
            }
        } catch (error) {
            console.error('🎸 Error adding guitar note:', error);
        }
    }

    // 充電サークルを作成
    private createChargingCircle(position: FretPosition, noteData: NoteData): ChargingCircle | null {
        console.log('🎸 createChargingCircle called:', {
            position,
            noteData,
            fretboardContainer: !!this.fretboardContainer,
            nutWidth: this.nutWidth,
            fretWidth: this.fretWidth,
            openStringWidth: this.openStringWidth
        });
        
        if (!this.fretboardContainer) {
            console.error('🎸 fretboardContainer is null!');
            return null;
        }
        
        const container = new PIXI.Container();
        
        const x = this.nutWidth + position.fret * this.fretWidth;
        const y = this.getStringY(position.string);
        
        console.log('🎸 Note position calculated:', { x, y, fret: position.fret, string: position.string });
        
        // 外側の円（ターゲット枠）- オクターブシフト時は色を変更、ブラー効果追加
        const outerCircle = new PIXI.Graphics();
        const circleColor = position.octaveShift !== 0 ? 0xFFDD44 : this.colors.chargingCircle;
        outerCircle.lineStyle(4, circleColor, 0.8);
        outerCircle.drawCircle(0, 0, 20);
        
        // ブラーフィルターを追加
        const blurFilter = new PIXI.BlurFilter();
        blurFilter.blur = 1.5;
        outerCircle.filters = [blurFilter];
        container.addChild(outerCircle);
        
        // 内側の円（充電部分）- オクターブシフト時は色を変更、グロー効果追加
        const innerCircle = new PIXI.Graphics();
        const fillColor = position.octaveShift !== 0 ? 0xFFCC22 : this.colors.chargingCircleFill;
        innerCircle.beginFill(fillColor, 0.8);
        innerCircle.drawCircle(0, 0, 0);
        innerCircle.endFill();
        
        // グロー効果を追加
        const glowFilter = new PIXI.BlurFilter();
        glowFilter.blur = 1.0;
        innerCircle.filters = [glowFilter];
        container.addChild(innerCircle);
        
        // USU!風の縮む円（アプローチサークル）- よりぼやけた効果
        const approachCircle = new PIXI.Graphics();
        const approachColor = position.octaveShift !== 0 ? 0xFFDD44 : 0x00DDFF;
        approachCircle.lineStyle(3, approachColor, 0.6);
        approachCircle.drawCircle(0, 0, 60); // 初期サイズは大きく
        
        // より強いブラーフィルターを追加
        const approachBlurFilter = new PIXI.BlurFilter();
        approachBlurFilter.blur = 2.0;
        approachCircle.filters = [approachBlurFilter];
        container.addChild(approachCircle);
        
        // ノート名表示（オクターブシフト情報も含む）
        try {
            if (this.gameInstance && 
                this.gameInstance.state && 
                this.gameInstance.state.noteNames && 
                this.gameInstance.state.noteNames.display) {
                
                let noteName = '';
                if (this.gameInstance.getNoteNameFromPitch && typeof this.gameInstance.getNoteNameFromPitch === 'function') {
                    noteName = this.gameInstance.getNoteNameFromPitch(noteData.pitch);
                } else {
                    // フォールバック: 基本的な音名表示
                    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    noteName = noteNames[noteData.pitch % 12];
                }
                
                // オクターブシフトの表示を追加
                if (position.octaveShift && position.octaveShift !== 0) {
                    const shiftIndicator = position.octaveShift > 0 ? `+${position.octaveShift}` : `${position.octaveShift}`;
                    noteName += `(${shiftIndicator})`;
                }
                
                if (noteName) {
                    const text = new PIXI.Text(noteName, {
                        fontFamily: 'Arial',
                        fontSize: 12,
                        fill: position.octaveShift !== 0 ? 0xFFDD44 : 0xFFFFFF, // オクターブシフト時は黄色
                        align: 'center'
                    });
                    text.anchor.set(0.5, 0.5);
                    container.addChild(text);
                }
            }
        } catch (error) {
            console.warn('Error adding note name to guitar note:', error);
        }
        
        container.position.set(x, y);
        (container as any).innerCircle = innerCircle;
        (container as any).outerCircle = outerCircle;
        (container as any).approachCircle = approachCircle;
        (container as any).noteData = noteData;
        (container as any).chargeProgress = 0;
        (container as any).isApproachCircleDestroyed = false;
        
        console.log('🎸 Adding container to fretboardContainer...');
        this.fretboardContainer.addChild(container);
        console.log('🎸 Container added. fretboardContainer children count:', this.fretboardContainer.children.length);
        
        return container as ChargingCircle;
    }

    // ノートを削除
    public removeNote(noteId: string): void {
        const circle = this.chargingCircles.get(noteId);
        if (circle && !circle.destroyed) {
            this.chargingCircles.delete(noteId);
            this.noteToFretMap.delete(noteId);
            circle.destroy({ children: true });
        }
    }

    // ノートをヒット（判定成功）
    public hitNote(noteId: string): void {
        const circle = this.chargingCircles.get(noteId);
        if (circle && this.fretboardContainer) {
            // バーストエフェクト
            const burstEffect = new PIXI.Graphics();
            burstEffect.lineStyle(3, 0x00FF00, 1);
            burstEffect.drawCircle(0, 0, 20);
            
            burstEffect.position.set(circle.x, circle.y);
            this.fretboardContainer.addChild(burstEffect);
            
            this.removeNote(noteId);
            
            // エフェクトアニメーション
            const startTime = Date.now();
            const duration = 200;
            const animateEffect = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                if (progress < 1 && burstEffect.parent) {
                    const scale = 1 + progress * 1.5;
                    burstEffect.scale.set(scale);
                    burstEffect.alpha = 1 - progress;
                    requestAnimationFrame(animateEffect);
                } else {
                    if (burstEffect.parent) {
                        this.fretboardContainer!.removeChild(burstEffect);
                    }
                    burstEffect.destroy();
                }
            };
            
            animateEffect();
        }
    }

    // ノートをミス
    public missNote(noteId: string): void {
        this.removeNote(noteId);
    }

    // ノートをミス（スキップ・シーク時はカウントしない版）
    public missNoteQuiet(noteId: string): void {
        // ミスカウントを行わない削除
        this.removeNote(noteId);
    }

    // 充電アニメーションの更新
    public updateChargingCircles(currentTime: number): void {
        this.chargingCircles.forEach((circle, noteId) => {
            const noteData = circle.noteData;
            const progress = (currentTime - noteData.appearTime) / (noteData.time - noteData.appearTime);
            
            if (progress >= 0) {
                const clampedProgress = Math.min(progress, 1.0);

                // 充電アニメーション（オクターブシフト時は色を維持）
                circle.chargeProgress = clampedProgress;
                circle.innerCircle.clear();
                const position = this.noteToFretMap.get(noteId);
                const fillColor = (position && position.octaveShift !== 0) ? 0xFFCC22 : this.colors.chargingCircleFill;
                circle.innerCircle.beginFill(fillColor, 0.7);
                circle.innerCircle.drawCircle(0, 0, 20 * clampedProgress);
                circle.innerCircle.endFill();
                
                // USU!風の縮む円アニメーション
                if (circle.approachCircle && !circle.isApproachCircleDestroyed) {
                    if (progress >= 1.0) {
                        // 演奏タイミングに達したら強い視覚的フィードバック
                        circle.approachCircle.clear();
                        circle.approachCircle.visible = false;
                        circle.isApproachCircleDestroyed = true; // 復活を防ぐフラグ
                        
                        // 演奏タイミング用のフラッシュリングエフェクトを作成
                        if (!circle.timingFlashRing) {
                            const flashRing = new PIXI.Graphics();
                            const flashColor = (position && position.octaveShift !== 0) ? 0xFFDD44 : 0x00FFFF;
                            flashRing.lineStyle(6, flashColor, 1.0);
                            flashRing.drawCircle(0, 0, 25);
                            
                            // 強いグロー効果
                            const flashGlowFilter = new PIXI.BlurFilter();
                            flashGlowFilter.blur = 3.0;
                            flashRing.filters = [flashGlowFilter];
                            
                            circle.addChild(flashRing);
                            circle.timingFlashRing = flashRing;
                            circle.timingFlashStartTime = Date.now();
                        }
                        
                        // 外側の円も強調
                        if (circle.outerCircle) {
                            const flashColor = (position && position.octaveShift !== 0) ? 0xFFDD44 : 0x00FFFF;
                            circle.outerCircle.clear();
                            circle.outerCircle.lineStyle(6, flashColor, 1.0);
                            circle.outerCircle.drawCircle(0, 0, 20);
                        }
                    } else {
                        const approachRadius = 60 - (40 * progress);
                        circle.approachCircle.visible = true;
                        circle.approachCircle.clear();
                        const approachColor = (position && position.octaveShift !== 0) ? 0xFFDD44 : 0x00DDFF;
                        circle.approachCircle.lineStyle(3, approachColor, 0.6);
                        circle.approachCircle.drawCircle(0, 0, approachRadius);
                    }
                }
                
                // 演奏タイミングのフラッシュリングアニメーション
                if (circle.timingFlashRing && circle.timingFlashStartTime) {
                    const flashElapsed = Date.now() - circle.timingFlashStartTime;
                    const flashDuration = 300; // 0.3秒
                    const flashProgress = Math.min(flashElapsed / flashDuration, 1.0);
                    
                    if (flashProgress < 1.0) {
                        // 拡大しながらフェードアウト
                        const scale = 1 + flashProgress * 1.5; // 2.5倍まで拡大
                        const alpha = 1 - flashProgress;
                        circle.timingFlashRing.scale.set(scale);
                        circle.timingFlashRing.alpha = alpha;
                    } else {
                        // アニメーション終了、エフェクトを削除
                        circle.removeChild(circle.timingFlashRing);
                        circle.timingFlashRing.destroy();
                        circle.timingFlashRing = null;
                        circle.timingFlashStartTime = null;
                    }
                }
                
                // 満充電に近づくとパルスアニメーション（アプローチサークル以外に適用）
                if (clampedProgress > 0.8) {
                    const pulse = 1 + Math.sin((clampedProgress - 0.8) * 50) * 0.15;
                    // アプローチサークル以外の要素のみにパルス効果を適用
                    if (circle.innerCircle) {
                        circle.innerCircle.scale.set(pulse);
                    }
                    if (circle.outerCircle) {
                        circle.outerCircle.scale.set(pulse);
                    }
                    // ノート名テキストがあれば同様に適用
                    circle.children.forEach((child: any) => {
                        if (child instanceof PIXI.Text) {
                            child.scale.set(pulse);
                        }
                    });
                    // アプローチサークルはパルス効果の影響を受けないようにリセット
                    if (circle.approachCircle) {
                        circle.approachCircle.scale.set(1);
                    }
                } else {
                    // スケールをリセット
                    if (circle.innerCircle && circle.innerCircle.scale.x !== 1) {
                         circle.innerCircle.scale.set(1);
                    }
                    if (circle.outerCircle && circle.outerCircle.scale.x !== 1) {
                        circle.outerCircle.scale.set(1);
                    }
                    circle.children.forEach((child: any) => {
                        if (child instanceof PIXI.Text && child.scale.x !== 1) {
                            child.scale.set(1);
                        }
                    });
                }
            }
        });
    }

    // 楽器を切り替え
    public switchInstrument(instrumentType: keyof InstrumentTypes): void {
        if (this.currentInstrumentType === instrumentType) return;
        
        console.log(`楽器を切り替え: ${this.currentInstrumentType} → ${instrumentType}`);
        this.currentInstrumentType = instrumentType;
        
        // フレットボードの高さを更新
        this.updateFretboardHeight();
        
        // 既存のノートをクリア
        this.clear();
        
        // フレットボードを再描画
        this.drawFretboard();
        
        // 位置を更新
        this.updatePosition();
        
        // 最適化状態をリセット
        this.lastPosition = null;
        this.positionHistory = [];
        this.anchorPosition = null;
    }

    // 楽器タイプに応じた開放弦の音名を取得
    private getOpenStringNoteNames(): string[] {
        const noteNameMap: Record<keyof InstrumentTypes, string[]> = {
            guitar: ['E', 'B', 'G', 'D', 'A', 'E'],
            bass4: ['G', 'D', 'A', 'E'],
            bass5: ['G', 'D', 'A', 'E', 'B'],
            bass6: ['C', 'G', 'D', 'A', 'E', 'B']
        };
        return noteNameMap[this.currentInstrumentType] || [];
    }

    // 設定モーダルを表示
    private showSettingsModal(): void {
        if (this.settingsModal) {
            this.hideSettingsModal();
            return;
        }
        
        if (!this.app) return;
        
        // モーダル背景
        const modalContainer = new PIXI.Container();
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.5);
        overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        overlay.endFill();
        modalContainer.addChild(overlay);
        
        // モーダルボックス
        const modalBox = new PIXI.Container();
        const box = new PIXI.Graphics();
        box.beginFill(0x2a2a2a, 0.95);
        box.lineStyle(2, 0xFFFFFF, 0.3);
        box.drawRoundedRect(0, 0, 300, 200, 10);
        box.endFill();
        modalBox.addChild(box);
        
        // タイトル
        const title = new PIXI.Text('Instrument Selection', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFFFFF,
            align: 'center'
        });
        title.x = 150;
        title.y = 20;
        title.anchor.set(0.5, 0);
        modalBox.addChild(title);
        
        // 楽器オプションを作成
        const instruments = Object.keys(this.instrumentTypes) as (keyof InstrumentTypes)[];
        let yOffset = 60;
        
        instruments.forEach((key, index) => {
            const instrument = this.instrumentTypes[key];
            const optionContainer = new PIXI.Container();
            
            // オプション背景
            const optionBg = new PIXI.Graphics();
            const isSelected = key === this.currentInstrumentType;
            optionBg.beginFill(isSelected ? 0x555555 : 0x333333, 0.8);
            optionBg.drawRoundedRect(20, yOffset + index * 35, 260, 30, 5);
            optionBg.endFill();
            
            // オプションテキスト
            const optionText = new PIXI.Text(instrument.name, {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: isSelected ? 0xFFDD44 : 0xFFFFFF,
                align: 'center'
            });
            optionText.x = 150;
            optionText.y = yOffset + index * 35 + 15;
            optionText.anchor.set(0.5, 0.5);
            
            // インタラクティブ設定
            optionContainer.interactive = true;
            optionContainer.buttonMode = true;
            optionContainer.cursor = 'pointer';
            
            optionContainer.on('pointerdown', () => {
                this.switchInstrument(key);
                this.hideSettingsModal();
            });
            
            optionContainer.addChild(optionBg);
            optionContainer.addChild(optionText);
            modalBox.addChild(optionContainer);
        });
        
        // モーダルを中央に配置
        modalBox.x = (this.app.screen.width - 300) / 2;
        modalBox.y = (this.app.screen.height - 200) / 2;
        
        modalContainer.addChild(modalBox);
        
        // オーバーレイクリックで閉じる
        overlay.interactive = true;
        overlay.on('pointerdown', () => {
            this.hideSettingsModal();
        });
        
        this.settingsModal = modalContainer;
        this.app.stage.addChild(modalContainer);
    }
    
    // 設定モーダルを非表示
    private hideSettingsModal(): void {
        if (this.settingsModal && this.app) {
            this.app.stage.removeChild(this.settingsModal);
            this.settingsModal.destroy({ children: true });
            this.settingsModal = null;
        }
    }

    // 追加のユーティリティメソッド
    public getCurrentInstrumentType(): keyof InstrumentTypes {
        return this.currentInstrumentType;
    }

    public isInitialized(): boolean {
        return this.app !== null && this.container !== null;
    }

    public getVisibility(): boolean {
        return this.isVisible;
    }
} 