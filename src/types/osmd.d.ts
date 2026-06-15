declare module 'opensheetmusicdisplay' {
  /** 0: note highlight, 1: thin line, 2: short line on stave, 3: current measure, 4: measure to left of notes */
  export type CursorType = 0 | 1 | 2 | 3 | 4;

  export interface CursorOptions {
    type: CursorType;
    color: string;
    alpha: number;
    follow: boolean;
  }

  export interface MusicPartManagerIterator {
    readonly EndReached: boolean;
    readonly CurrentMeasureIndex: number;
  }

  export interface Cursor {
    readonly iterator: MusicPartManagerIterator;
    show(): void;
    hide(): void;
    next(): void;
    reset(): void;
    update(): void;
  }

  export interface IOSMDOptions {
    autoResize?: boolean;
    backend?: 'svg' | 'canvas';
    drawTitle?: boolean;
    drawComposer?: boolean;
    drawLyricist?: boolean;
    drawPartNames?: boolean;
    drawingParameters?: string;
    renderSingleHorizontalStaffline?: boolean;
    stretchLastSystemLine?: boolean;
    pageFormat?: string;
    pageBackgroundColor?: string;
    defaultColorMusic?: string;
    defaultColorNotehead?: string;
    defaultColorStem?: string;
    defaultColorRest?: string;
    defaultColorLabel?: string;
    defaultColorTitle?: string;
    defaultColorLyrics?: string;
    cursorsOptions?: CursorOptions[];
  }

  export interface GraphicalNote {
    sourceNote: {
      NoteTie?: {
        StartNote: boolean;
      };
      Pitch?: {
        FundamentalNote: number;
        Accidental?: number;
      };
      TransposedPitch?: {
        FundamentalNote: number;
        Accidental?: number;
      };
    };
    PositionAndShape: {
      AbsolutePosition: {
        x: number;
        y: number;
      };
    };
  }

  export interface GraphicalVoiceEntry {
    notes: GraphicalNote[];
  }

  export interface GraphicalStaffEntry {
    graphicalVoiceEntries: GraphicalVoiceEntry[];
  }

  export interface GraphicalMeasure {
    staffEntries: GraphicalStaffEntry[];
    PositionAndShape?: {
      AbsolutePosition?: {
        x?: number;
        y?: number;
      };
    };
  }

  export interface GraphicalStaffLine {
    Measures: GraphicalMeasure[];
  }

  export interface MusicSystem {
    StaffLines: GraphicalStaffLine[];
  }

  export interface MusicPage {
    MusicSystems: MusicSystem[];
  }

  export interface GraphicSheet {
    MusicPages: MusicPage[];
    BoundingBox?: {
      width?: number;
      height?: number;
    };
  }

  export interface MusicSheet {
    Transpose: number;
  }

  export class TransposeCalculator {
    constructor();
  }

  export class OpenSheetMusicDisplay {
    constructor(container: HTMLElement, options?: IOSMDOptions);
    load(url: string): Promise<void>;
    render(): void;
    updateGraphic(): void;
    clear(): void;
    enableOrDisableCursors(enable: boolean): void;
    GraphicSheet: GraphicSheet;
    Sheet: MusicSheet;
    TransposeCalculator?: TransposeCalculator;
    cursors: Cursor[];
    cursor: Cursor;
  }
}
