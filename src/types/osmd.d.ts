declare module 'opensheetmusicdisplay' {
  export interface IOSMDOptions {
      autoResize?: boolean;
      backend?: 'svg' | 'canvas';
      drawingParameters?: string;
      disableCursor?: boolean;
      followCursor?: boolean;
      autoBeam?: boolean;
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
      drawTimeSignatures?: boolean;
      drawFingerings?: boolean;
      drawLyrics?: boolean;
      drawSlurs?: boolean;
      drawUpToMeasureNumber?: number;
      drawUpToSystemNumber?: number;
      drawUpToPageNumber?: number;
      drawFromMeasureNumber?: number;
      renderSingleHorizontalStaffline?: boolean;
      stretchLastSystemLine?: boolean;
      pageFormat?: string;
      pageBackgroundColor?: string;
      defaultColorNotehead?: string;
      defaultColorStem?: string;
      defaultColorRest?: string;
      defaultColorLabel?: string;
      defaultColorTitle?: string;
      fillEmptyMeasuresWithWholeRest?: number;
      tupletsRatioed?: boolean;
      tupletsBracketed?: boolean;
      tripletsBracketed?: boolean;
      autoGenerateMultipleRestMeasuresFromRestMeasures?: boolean;
      preferredSkyBottomLineBatchCalculatorBackend?: number;
      skyBottomLineBatchMinMeasures?: number;
    }

    export interface IOSMDEngravingRules {
      AutoBeamNotes?: boolean;
      AutoBeamTabs?: boolean;
      RenderLyrics?: boolean;
      RenderChordSymbols?: boolean;
      RenderFingerings?: boolean;
      RenderMeasureNumbers?: boolean;
      RenderMeasureNumbersOnlyAtSystemStart?: boolean;
      RenderRehearsalMarks?: boolean;
      RenderMultipleRestMeasures?: boolean;
      AutoGenerateMultipleRestMeasuresFromRestMeasures?: boolean;
      RenderArpeggios?: boolean;
      RenderGlissandi?: boolean;
      RenderSlurs?: boolean;
      RenderPedals?: boolean;
      RenderStringNumbersClassical?: boolean;
      TupletsBracketed?: boolean;
      TripletsBracketed?: boolean;
      TupletsRatioed?: boolean;
      RenderSingleHorizontalStaffline?: boolean;
      RenderXMeasuresPerLineAkaSystem?: number;
      PreferredSkyBottomLineBatchCalculatorBackend?: number;
      SkyBottomLineBatchMinMeasures?: number;
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
      EngravingRules: IOSMDEngravingRules;
  }
}