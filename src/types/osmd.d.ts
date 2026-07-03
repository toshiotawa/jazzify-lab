declare module 'opensheetmusicdisplay' {
  export interface IOSMDOptions {
    autoResize?: boolean;
    backend?: 'svg' | 'canvas';
    drawTitle?: boolean;
    drawComposer?: boolean;
    drawLyricist?: boolean;
    drawPartNames?: boolean;
    drawMeasureNumbers?: boolean;
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
    PositionAndShape?: {
      AbsolutePosition?: { x?: number; y?: number };
      Size?: { width?: number; height?: number };
      BorderMarginTop?: number;
      BorderMarginBottom?: number;
    };
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

  export enum TextAlignmentEnum {
    LeftTop = 0,
    LeftCenter = 1,
    LeftBottom = 2,
    CenterTop = 3,
    CenterCenter = 4,
    CenterBottom = 5,
    RightTop = 6,
    RightCenter = 7,
    RightBottom = 8,
  }

  export class Label {
    constructor(text: string, alignment?: TextAlignmentEnum);
    text: string;
    fontStyle?: unknown;
    fontHeight?: number;
    textAlignment: TextAlignmentEnum;
  }

  export class PointF2D {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }

  export class GraphicalLabel {
    constructor(
      label: Label,
      fontHeight: number,
      textAlignment: TextAlignmentEnum,
      rules: unknown,
      boundingBoxParent: unknown,
    );
    Label: Label;
    PositionAndShape: {
      RelativePosition: PointF2D;
      BorderMarginLeft: number;
      BorderMarginRight: number;
      BorderMarginTop: number;
      BorderMarginBottom: number;
      MarginSize: { width: number };
    };
    setLabelPositionAndShapeBorders: () => void;
  }

  export class OpenSheetMusicDisplay {
    constructor(container: HTMLElement, options?: IOSMDOptions);
    load(url: string): Promise<void>;
    render(): void;
    updateGraphic(): void;
    clear(): void;
    GraphicSheet: GraphicSheet & {
      calculator?: unknown;
      GetCalculator?: unknown;
    };
    Sheet: MusicSheet;
    TransposeCalculator?: TransposeCalculator;
    EngravingRules?: Record<string, unknown>;
    rules?: Record<string, unknown>;
    Zoom?: number;
    zoom?: number;
  }
}
