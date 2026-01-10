# ファンタジーモード リズムタイプ実装計画書

## 概要
ファンタジーモードに『リズムタイプ』を追加し、従来のモードを『クイズタイプ』として分類します。
リズムタイプでは音楽（MP3ファイル）に合わせてリズミカルにコードを入力するゲームプレイを実現します。

## 主要な変更点

### 1. モードの分類
- 既存のモード → **クイズタイプ**
- 新規追加 → **リズムタイプ**
  - コードランダムパターン（1小節に1回コードが出題）
  - コードプログレッションパターン（順番に出題、4体同時出現）

### 2. 共通機能の追加
- **Readyフェーズ**: ゲーム開始から曲開始までの準備期間
- **MP3再生**: `/demo-1.mp3`をクイズ・リズム両方で再生
- **判定タイミング**: 攻撃ゲージ8割地点（前後200ms受付）
- **ループ機能**: 指定小節数で0秒地点にループ

## データベース変更

### fantasy_stages テーブルの拡張

```diff
-- fantasy_stages テーブルに新しいカラムを追加
ALTER TABLE fantasy_stages
+ ADD COLUMN game_type VARCHAR(10) DEFAULT 'quiz' CHECK (game_type IN ('quiz', 'rhythm')),
+ ADD COLUMN rhythm_pattern VARCHAR(20) CHECK (rhythm_pattern IN ('random', 'progression')),
+ ADD COLUMN bpm INTEGER DEFAULT 120,
+ ADD COLUMN time_signature INTEGER DEFAULT 4 CHECK (time_signature IN (3, 4)),
+ ADD COLUMN loop_measures INTEGER DEFAULT 8,
+ ADD COLUMN chord_progression_data JSONB; -- プログレッションパターン用のデータ

-- 既存のmodeカラムとの関係性の整理
-- mode: 'single' | 'progression' は出題方式を表す（クイズタイプで使用）
-- game_type: 'quiz' | 'rhythm' はゲームタイプを表す
-- rhythm_pattern: 'random' | 'progression' はリズムタイプのサブタイプ
```

### chord_progression_data の構造

```json
{
  "chords": [
    {
      "chord": "CM7",
      "measure": 1,
      "beat": 1.0
    },
    {
      "chord": "G7",
      "measure": 1,
      "beat": 3.0
    },
    {
      "chord": "Am7",
      "measure": 2,
      "beat": 1.0
    },
    {
      "chord": "FM7",
      "measure": 2,
      "beat": 3.0
    }
  ]
}
```

## コンポーネント変更

### 1. FantasyGameEngine.tsx の変更

```diff
// 型定義の追加
interface FantasyStage {
  // ... 既存のプロパティ
+ gameType: 'quiz' | 'rhythm';
+ rhythmPattern?: 'random' | 'progression';
+ bpm?: number;
+ timeSignature?: 3 | 4;
+ loopMeasures?: number;
+ chordProgressionData?: ChordProgressionData;
}

+interface ChordProgressionData {
+  chords: Array<{
+    chord: string;
+    measure: number;
+    beat: number;
+  }>;
+}

interface FantasyGameState {
  // ... 既存のプロパティ
+ isReady: boolean; // Readyフェーズのフラグ
+ currentMeasure: number; // 現在の小節
+ currentBeat: number; // 現在の拍
+ audioStartTime: number; // 音楽開始時刻
+ nextChordIndex: number; // プログレッションパターン用のインデックス
}

// ゲームエンジンのロジック変更
const useFantasyGameEngine = () => {
  // ... 既存のコード
  
+ // 音楽同期用のタイマー
+ const audioTimeRef = useRef<number>(0);
+ const audioRef = useRef<HTMLAudioElement | null>(null);
  
+ // Readyフェーズの処理
+ const startReadyPhase = useCallback(() => {
+   dispatch({ type: 'SET_READY_PHASE', isReady: true });
+   
+   // 3秒後に音楽開始
+   setTimeout(() => {
+     dispatch({ type: 'SET_READY_PHASE', isReady: false });
+     startMusic();
+   }, 3000);
+ }, []);
  
+ // 音楽再生の処理
+ const startMusic = useCallback(() => {
+   if (!audioRef.current) {
+     audioRef.current = new Audio('/demo-1.mp3');
+     audioRef.current.loop = false; // 手動でループ制御
+   }
+   
+   audioRef.current.currentTime = 0;
+   audioRef.current.play();
+   dispatch({ type: 'SET_AUDIO_START_TIME', time: Date.now() });
+ }, []);
  
+ // 判定タイミングの計算（8割地点）
+ const calculateJudgmentTiming = useCallback((monster: MonsterState) => {
+   const targetTime = monster.gauge * stage.enemyGaugeSeconds * 0.8;
+   return targetTime;
+ }, [stage]);
  
  // ... 既存のコード
};
```

### 2. FantasyGameScreen.tsx の変更

```diff
const FantasyGameScreen: React.FC<FantasyGameScreenProps> = ({
  // ... 既存のprops
}) => {
  // ... 既存のstate
  
+ // Readyフェーズの表示
+ const [showReady, setShowReady] = useState(false);
  
  // ... 既存のコード
  
  return (
    <div className="relative h-screen flex flex-col bg-gray-900">
+     {/* Readyフェーズのオーバーレイ */}
+     {showReady && (
+       <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
+         <div className="text-6xl font-bold text-white animate-pulse">
+           READY...
+         </div>
+       </div>
+     )}
      
      {/* ヘッダー部分 */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        {/* ... 既存のヘッダー */}
+       {/* 判定タイミングマーカーの追加 */}
+       <div className="relative">
+         {activeMonsters.map(monster => (
+           <div
+             key={monster.id}
+             className="absolute h-2 bg-yellow-400"
+             style={{
+               left: '80%',
+               width: '2px',
+               zIndex: 10
+             }}
+           />
+         ))}
+       </div>
      </div>
      
      {/* ... 既存のコンテンツ */}
    </div>
  );
};
```

### 3. FantasyPIXIRenderer.tsx の変更

```diff
// PIXIレンダラーにリズムタイプ用の視覚効果を追加
export class FantasyPIXIInstance {
  // ... 既存のコード
  
+ // 判定タイミングマーカーの描画
+ private drawJudgmentMarker(monster: MonsterState) {
+   const marker = new PIXI.Graphics();
+   marker.beginFill(0xFFFF00, 0.8);
+   marker.drawRect(0, 0, 4, 40);
+   marker.endFill();
+   
+   // ゲージの80%地点に配置
+   const gaugeWidth = 200; // ゲージの幅
+   marker.x = gaugeWidth * 0.8;
+   marker.y = monster.position === 'A' ? 100 : 200; // 位置に応じて調整
+   
+   this.monsterContainer.addChild(marker);
+ }
  
+ // ビートインジケーターの追加（リズムタイプ用）
+ private createBeatIndicator() {
+   const indicator = new PIXI.Graphics();
+   indicator.beginFill(0x00FF00, 0.5);
+   indicator.drawCircle(0, 0, 20);
+   indicator.endFill();
+   
+   // ビートに合わせてアニメーション
+   this.app.ticker.add(() => {
+     const scale = 1 + Math.sin(Date.now() * 0.01) * 0.2;
+     indicator.scale.set(scale);
+   });
+   
+   return indicator;
+ }
}
```

### 4. 新規ファイル: RhythmManager.ts

```typescript
// src/utils/RhythmManager.ts
export class RhythmManager {
  private audio: HTMLAudioElement;
  private bpm: number;
  private timeSignature: number;
  private loopMeasures: number;
  private startTime: number = 0;
  
  constructor(
    audioUrl: string,
    bpm: number,
    timeSignature: number,
    loopMeasures: number
  ) {
    this.audio = new Audio(audioUrl);
    this.bpm = bpm;
    this.timeSignature = timeSignature;
    this.loopMeasures = loopMeasures;
    
    // ループ処理の設定
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate.bind(this));
  }
  
  // 現在の小節と拍を計算
  getCurrentPosition(): { measure: number; beat: number } {
    const currentTime = this.audio.currentTime;
    const beatDuration = 60 / this.bpm; // 1拍の秒数
    const measureDuration = beatDuration * this.timeSignature; // 1小節の秒数
    
    const totalBeats = currentTime / beatDuration;
    const measure = Math.floor(totalBeats / this.timeSignature) + 1;
    const beat = (totalBeats % this.timeSignature) + 1;
    
    return { measure, beat };
  }
  
  // ループ処理
  private handleTimeUpdate() {
    const measureDuration = (60 / this.bpm) * this.timeSignature;
    const loopDuration = measureDuration * this.loopMeasures;
    
    if (this.audio.currentTime >= loopDuration) {
      this.audio.currentTime = 0;
    }
  }
  
  // 判定タイミングかどうかをチェック
  isJudgmentTiming(targetBeat: number, tolerance: number = 0.2): boolean {
    const { beat } = this.getCurrentPosition();
    const beatDuration = 60 / this.bpm;
    const currentTime = this.audio.currentTime;
    const targetTime = (targetBeat - 1) * beatDuration;
    
    return Math.abs(currentTime % (beatDuration * this.timeSignature) - targetTime) <= tolerance;
  }
  
  play() {
    this.startTime = Date.now();
    this.audio.play();
  }
  
  pause() {
    this.audio.pause();
  }
  
  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
}
```

### 5. コードプログレッションパターンの実装

```typescript
// FantasyGameEngine.tsx に追加
interface ProgressionMonsterState extends MonsterState {
  questionIndex: number; // 現在の問題番号（1から開始）
  column: 'A' | 'B' | 'C' | 'D'; // 固定列
}

// 補充ロジックの実装
const handleProgressionCorrect = (monsterId: string) => {
  const monster = activeMonsters.find(m => m.id === monsterId);
  if (!monster) return;
  
  // 次の問題番号を計算
  const totalQuestions = stage.chordProgressionData?.chords.length || 0;
  const currentIndex = (monster as ProgressionMonsterState).questionIndex;
  let nextIndex = currentIndex + 4; // 4体同時なので+4
  
  // ループ処理
  if (nextIndex > totalQuestions) {
    nextIndex = ((nextIndex - 1) % totalQuestions) + 1;
  }
  
  // 新しいモンスターを同じ列に配置
  const newMonster: ProgressionMonsterState = {
    ...createNewMonster(),
    column: (monster as ProgressionMonsterState).column,
    questionIndex: nextIndex,
    chordTarget: getChordByIndex(nextIndex)
  };
  
  // モンスターを置き換え
  dispatch({
    type: 'REPLACE_MONSTER',
    monsterId,
    newMonster
  });
};
```

## 実装上の懸念事項への対応

### 1. 0秒地点のコード処理
```typescript
// 初期化時に最初のコードの判定タイミングを計算
const initializeFirstChord = () => {
  const firstChord = chordProgressionData.chords[0];
  if (firstChord.beat === 1 && firstChord.measure === 1) {
    // 0秒地点の場合、ゲージを80%から開始
    const initialGauge = 0.8;
    dispatch({
      type: 'SET_INITIAL_GAUGE',
      gauge: initialGauge
    });
  }
};
```

### 2. 無限リピート時の攻撃ゲージ
```typescript
// ループ時にゲージをリセットしない
const handleLoop = () => {
  // 音楽位置のみリセット、ゲージは継続
  audioRef.current.currentTime = 0;
  // モンスターのゲージは現在の値を維持
};
```

## テスト項目

1. **Readyフェーズ**
   - 3秒間の表示確認
   - ゲージの動作確認

2. **リズムタイプ**
   - コードランダムパターンの動作
   - プログレッションパターンの補充ロジック
   - 判定タイミング（前後200ms）

3. **音楽同期**
   - MP3ファイルの再生
   - ループ処理
   - BPMに基づくタイミング計算

4. **共通機能**
   - クイズタイプでのMP3再生
   - 判定マーカーの表示

## 実装順序

1. データベーススキーマの更新
2. RhythmManagerクラスの実装
3. FantasyGameEngineへのリズムタイプ対応追加
4. FantasyGameScreenのUI更新
5. PIXIレンダラーの視覚効果追加
6. テストとデバッグ

## 今後の拡張性

- 複数のMP3ファイル対応
- BPM自動検出
- より複雑なリズムパターン
- ビジュアルエフェクトの充実