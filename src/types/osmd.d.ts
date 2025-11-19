declare module 'opensheetmusicdisplay' {
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
    defaultColorNotehead?: string;
    defaultColorStem?: string;
    defaultColorRest?: string;
    defaultColorLabel?: string;
    defaultColorTitle?: string;
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
    getSVGElement?: () => SVGGraphicsElement | null;
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
  }
}