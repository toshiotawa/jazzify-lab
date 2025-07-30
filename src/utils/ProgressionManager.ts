export interface ChordProgressionData {
  chords: Array<{
    chord: string;
    measure: number;
    beat: number;
  }>;
}

export interface ChordAssignment {
  questionNumber: number;
  chord: string;
  timing: TimingInfo;
  column: string;
}

export interface TimingInfo {
  measure: number;
  beat: number;
  cycleNumber: number;
}

interface ProgressionState {
  totalChords: number;          // 総コード数
  currentCycle: number;         // 現在のサイクル（何周目か）
  columnAssignments: Map<string, number>; // 列と問題番号のマッピング
  nextQuestionNumber: number;   // 次に出題する問題番号
  answeredCount: number;        // 回答済みの総数
}

export class ProgressionManager {
  private state: ProgressionState;
  private chordData: ChordProgressionData;
  private loopMeasures: number;

  constructor(chordData: ChordProgressionData, loopMeasures: number) {
    this.chordData = chordData;
    this.loopMeasures = loopMeasures;
    this.state = {
      totalChords: chordData.chords.length,
      currentCycle: 0,
      columnAssignments: new Map([
        ['A', 1], ['B', 2], ['C', 3], ['D', 4]
      ]),
      nextQuestionNumber: 5,
      answeredCount: 0
    };
  }

  // モンスター撃破時の次のコード取得
  getNextChordForColumn(column: string): ChordAssignment {
    const currentAssignment = this.state.columnAssignments.get(column)!;
    const nextNumber = this.getNextQuestionNumber(column);
    
    // 実際のコードインデックスを計算（1ベースを0ベースに変換）
    const chordIndex = (nextNumber - 1) % this.state.totalChords;
    const chord = this.chordData.chords[chordIndex];
    
    // タイミング計算（次のサイクルを考慮）
    const cycleOffset = Math.floor((nextNumber - 1) / this.state.totalChords);
    const timing = this.calculateTiming(chord, cycleOffset);
    
    // 列の割り当てを更新
    this.state.columnAssignments.set(column, nextNumber);
    this.state.answeredCount++;
    
    return {
      questionNumber: nextNumber,
      chord: chord.chord,
      timing: timing,
      column: column
    };
  }

  // 問題番号の計算（補充ロジックに基づく）
  private getNextQuestionNumber(column: string): number {
    // 現在の4体の最大問題番号を取得
    const currentNumbers = Array.from(this.state.columnAssignments.values());
    const maxNumber = Math.max(...currentNumbers);
    
    // 次のセットの開始番号
    const nextSetStart = Math.floor(maxNumber / 4) * 4 + 5;
    
    // 列のオフセット
    const columnOffset = ['A', 'B', 'C', 'D'].indexOf(column);
    
    return nextSetStart + columnOffset;
  }

  // 無限ループを考慮したタイミング計算
  private calculateTiming(
    chordData: { measure: number; beat: number },
    cycleOffset: number
  ): TimingInfo {
    const absoluteMeasure = chordData.measure + (cycleOffset * this.loopMeasures);
    
    return {
      measure: absoluteMeasure,
      beat: chordData.beat,
      cycleNumber: cycleOffset
    };
  }

  // 初期4体のコード情報を取得
  getInitialChords(): ChordAssignment[] {
    const columns = ['A', 'B', 'C', 'D'] as const;
    return columns.map((column, index) => {
      const chordData = this.chordData.chords[index];
      return {
        questionNumber: index + 1,
        chord: chordData.chord,
        timing: {
          measure: chordData.measure,
          beat: chordData.beat,
          cycleNumber: 0
        },
        column: column
      };
    });
  }

  // 現在の状態を取得（デバッグ用）
  getState(): Readonly<ProgressionState> {
    return { ...this.state };
  }
}