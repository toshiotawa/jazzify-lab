declare module 'opensheetmusicdisplay' {
  export interface IOSMDOptions {
    alignRests?: number;
    autoBeam?: boolean;
    autoBeamOptions?: unknown;
    autoResize?: boolean;
    backend?: 'svg' | 'canvas';
    coloringEnabled?: boolean;
    colorStemsLikeNoteheads?: boolean;
    defaultColorMusic?: string;
    defaultColorNotehead?: string;
    defaultColorStem?: string;
    defaultColorRest?: string;
    defaultColorLabel?: string;
    defaultColorTitle?: string;
    defaultFontFamily?: string;
    defaultFontStyle?: number;
    disableCursor?: boolean;
    followCursor?: boolean;
    drawingParameters?: string;
    drawCredits?: boolean;
    drawTitle?: boolean;
    drawSubtitle?: boolean;
    drawComposer?: boolean;
    drawLyricist?: boolean;
    drawMetronomeMarks?: boolean;
    drawPartNames?: boolean;
    drawPartAbbreviations?: boolean;
    drawMeasureNumbers?: boolean;
    drawMeasureNumbersOnlyAtSystemStart?: boolean;
    measureNumberInterval?: number;
    drawFingerings?: boolean;
    drawLyrics?: boolean;
    drawSlurs?: boolean;
    drawFromMeasureNumber?: number;
    drawUpToMeasureNumber?: number;
    drawUpToSystemNumber?: number;
    drawUpToPageNumber?: number;
    pageFormat?: string;
    pageBackgroundColor?: string;
    renderSingleHorizontalStaffline?: boolean;
    stretchLastSystemLine?: boolean;
    setWantedStemDirectionByXml?: boolean;
    tupletsBracketed?: boolean;
    tripletsBracketed?: boolean;
    autoGenerateMultipleRestMeasuresFromRestMeasures?: boolean;
    spacingFactorSoftmax?: number;
    preferredSkyBottomLineBatchCalculatorBackend?: number;
    skyBottomLineBatchMinMeasures?: number;
  }

  export interface BoundingBoxLike {
    AbsolutePosition?: {
      x: number;
      y: number;
    };
    RelativePosition?: {
      x: number;
      y: number;
    };
    Size?: {
      width: number;
      height: number;
    };
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
      PositionAndShape: BoundingBoxLike;
  }

  export interface GraphicalVoiceEntry {
    notes: GraphicalNote[];
  }

  export interface GraphicalStaffEntry {
    graphicalVoiceEntries: GraphicalVoiceEntry[];
  }

    export interface GraphicalMeasure {
      MeasureNumber?: number;
      parentSourceMeasure?: {
        MeasureNumber?: number;
        measureListIndex?: number;
      };
      PositionAndShape?: BoundingBoxLike;
    staffEntries: GraphicalStaffEntry[];
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
    GraphicSheet: GraphicSheet;
    Sheet: MusicSheet;
    TransposeCalculator?: TransposeCalculator;
  }
}