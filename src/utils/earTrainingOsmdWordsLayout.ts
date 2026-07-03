import {
  GraphicalLabel,
  Label,
  PointF2D,
  TextAlignmentEnum,
  type OpenSheetMusicDisplay,
} from 'opensheetmusicdisplay';

/** OSMD PlacementEnum.Below（opensheetmusicdisplay 1.9 非公開のため固定値）。 */
const OSMD_PLACEMENT_BELOW = 1;

const PENDING_DEFAULT_Y_KEY = '__earTrainingPendingDefaultYXml';

interface OsmdPositionAndShape {
  RelativePosition?: { x?: number; y?: number };
  BorderMarginLeft?: number;
  BorderMarginRight?: number;
  BorderMarginTop?: number;
  BorderMarginBottom?: number;
  MarginSize?: { width?: number };
  Size?: { width?: number };
}

interface OsmdGraphicalLabel {
  Label: {
    textAlignment?: number;
    fontStyle?: unknown;
    fontHeight?: number;
  };
  PositionAndShape: OsmdPositionAndShape;
  setLabelPositionAndShapeBorders: () => void;
}

interface OsmdAbstractExpression {
  sourceMultiExpression?: OsmdMultiExpression;
}

interface OsmdStaffLine {
  AbstractExpressions: OsmdAbstractExpression[];
  PositionAndShape: OsmdPositionAndShape;
  SkyBottomLineCalculator?: {
    updateBottomLineInRange: (left: number, right: number, bottom: number) => void;
    updateSkyLineInRange: (left: number, right: number, top: number) => void;
  };
}

interface OsmdGraphicMeasure {
  ParentStaffLine?: OsmdStaffLine;
  beginInstructionsWidth?: number;
  parentSourceMeasure?: unknown;
}

interface OsmdUnknownExpression {
  defaultYXml?: number;
}

interface OsmdMultiExpression {
  MoodList?: unknown[];
  UnknownList?: OsmdUnknownExpression[];
  EntriesList?: Array<{ prefix?: string; label?: string }>;
  getPlacementOfFirstEntry: () => number;
  getFontstyleOfFirstEntry: () => unknown;
}

interface OsmdEngravingRules {
  PlaceWordsInsideStafflineFromXml?: boolean;
  PlaceWordsInsideStafflineYOffset?: number;
  UnknownTextHeight?: number;
  RhythmRightMargin?: number;
  MeasureRightMargin?: number;
}

interface OsmdCalculatorLike {
  calculateMoodAndUnknownExpression: (
    multiExpression: OsmdMultiExpression,
    measureIndex: number,
    staffIndex: number,
  ) => void;
  calculateLabel: (
    staffLine: OsmdStaffLine,
    relativePosition: { x: number; y?: number },
    text: string,
    fontStyle: unknown,
    placement: number,
    fontHeight: number,
    textAlignment?: number,
    spacing?: number,
  ) => OsmdGraphicalLabel;
  graphicalMusicSheet: {
    MeasureList: Array<Array<OsmdGraphicMeasure | undefined>>;
  };
  rules: OsmdEngravingRules;
  [PENDING_DEFAULT_Y_KEY]?: number | null;
}

const getFiniteNumber = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

export const resolveDefaultYLaneY = (defaultYXml: number, yOffset = 0): number => (
  -defaultYXml / 10 + yOffset
);

const staffLineHasMultiExpression = (
  staffLine: OsmdStaffLine,
  multiExpression: OsmdMultiExpression,
): boolean => (
  staffLine.AbstractExpressions.some((expr) => expr.sourceMultiExpression === multiExpression)
);

export const enableEarTrainingOsmdWordsLayoutRules = (osmd: OpenSheetMusicDisplay): void => {
  const zoomable = osmd as OpenSheetMusicDisplay & {
    EngravingRules?: OsmdEngravingRules;
    rules?: OsmdEngravingRules;
  };
  const rules = zoomable.EngravingRules ?? zoomable.rules;
  if (!rules) {
    return;
  }
  rules.PlaceWordsInsideStafflineFromXml = true;
};

const readCalculator = (osmd: OpenSheetMusicDisplay): OsmdCalculatorLike | null => {
  const graphicSheet = osmd.GraphicSheet as {
    calculator?: OsmdCalculatorLike;
    GetCalculator?: OsmdCalculatorLike;
  } | undefined;
  return graphicSheet?.calculator ?? graphicSheet?.GetCalculator ?? null;
};

const createFixedDefaultYLabel = (
  calculator: OsmdCalculatorLike,
  staffLine: OsmdStaffLine,
  relativePosition: { x: number },
  text: string,
  fontStyle: unknown,
  placement: number,
  fontHeight: number,
  textAlignment: number,
  spacing: number,
): OsmdGraphicalLabel => {
  const rules = calculator.rules;
  const label = new Label(text, textAlignment);
  label.fontStyle = fontStyle;
  label.fontHeight = fontHeight;

  const graphicalLabel = new GraphicalLabel(
    label,
    fontHeight,
    label.textAlignment,
    rules,
    staffLine.PositionAndShape,
  ) as OsmdGraphicalLabel;

  const marginScale = 1.1;
  if (placement === OSMD_PLACEMENT_BELOW) {
    graphicalLabel.Label.textAlignment = TextAlignmentEnum.LeftTop;
  }
  graphicalLabel.setLabelPositionAndShapeBorders();
  graphicalLabel.PositionAndShape.BorderMarginBottom =
    (graphicalLabel.PositionAndShape.BorderMarginBottom ?? 0) * marginScale;
  graphicalLabel.PositionAndShape.BorderMarginTop =
    (graphicalLabel.PositionAndShape.BorderMarginTop ?? 0) * marginScale;
  graphicalLabel.PositionAndShape.BorderMarginLeft =
    (graphicalLabel.PositionAndShape.BorderMarginLeft ?? 0) * marginScale;
  graphicalLabel.PositionAndShape.BorderMarginRight =
    (graphicalLabel.PositionAndShape.BorderMarginRight ?? 0) * marginScale;

  let xPos = relativePosition.x;
  let left = xPos + (graphicalLabel.PositionAndShape.BorderMarginLeft ?? 0);
  let right = xPos + (graphicalLabel.PositionAndShape.BorderMarginRight ?? 0);
  const staffWidth = staffLine.PositionAndShape.Size?.width ?? 0;
  const measureRightMargin = rules.MeasureRightMargin ?? 0;
  if (right > staffWidth && staffWidth > 0) {
    right = staffWidth - measureRightMargin;
    const marginWidth = graphicalLabel.PositionAndShape.MarginSize?.width ?? 0;
    xPos = right - marginWidth - (graphicalLabel.PositionAndShape.BorderMarginLeft ?? 0);
    left = xPos + (graphicalLabel.PositionAndShape.BorderMarginLeft ?? 0);
    right = xPos + (graphicalLabel.PositionAndShape.BorderMarginRight ?? 0);
  }

  const pendingDefaultY = calculator[PENDING_DEFAULT_Y_KEY];
  const defaultYXml = getFiniteNumber(pendingDefaultY) ?? 0;
  const yOffset = rules.PlaceWordsInsideStafflineYOffset ?? 0;
  const y = resolveDefaultYLaneY(defaultYXml, yOffset);

  graphicalLabel.PositionAndShape.RelativePosition = new PointF2D(xPos, y);

  const skyCalc = staffLine.SkyBottomLineCalculator;
  if (skyCalc) {
    const bottom = (graphicalLabel.PositionAndShape.BorderMarginBottom ?? 0) + y + spacing;
    if (placement === OSMD_PLACEMENT_BELOW) {
      skyCalc.updateBottomLineInRange(left, right, bottom);
    } else {
      const top = (graphicalLabel.PositionAndShape.BorderMarginTop ?? 0) + y - spacing;
      skyCalc.updateSkyLineInRange(left, right, top);
    }
  }

  return graphicalLabel;
};

/** load 後・render 前に呼ぶ。words の重複排除と default-y レーン配置を有効化する。 */
export const installEarTrainingOsmdWordsLayout = (osmd: OpenSheetMusicDisplay): void => {
  const calculator = readCalculator(osmd);
  if (!calculator) {
    return;
  }

  if (calculator[PENDING_DEFAULT_Y_KEY] === undefined) {
    calculator[PENDING_DEFAULT_Y_KEY] = null;
  }

  const originalMoodAndUnknown = calculator.calculateMoodAndUnknownExpression.bind(calculator);
  const originalCalculateLabel = calculator.calculateLabel.bind(calculator);

  calculator.calculateLabel = (
    staffLine,
    relativePosition,
    text,
    fontStyle,
    placement,
    fontHeight,
    textAlignment = TextAlignmentEnum.CenterBottom,
    spacing = 0,
  ) => {
    const pendingDefaultY = calculator[PENDING_DEFAULT_Y_KEY];
    if (pendingDefaultY === null || pendingDefaultY === undefined) {
      return originalCalculateLabel(
        staffLine,
        relativePosition,
        text,
        fontStyle,
        placement,
        fontHeight,
        textAlignment,
        spacing,
      );
    }
    return createFixedDefaultYLabel(
      calculator,
      staffLine,
      relativePosition,
      text,
      fontStyle,
      placement,
      fontHeight,
      textAlignment,
      spacing,
    );
  };

  calculator.calculateMoodAndUnknownExpression = (
    multiExpression,
    measureIndex,
    staffIndex,
  ) => {
    const measureRow = calculator.graphicalMusicSheet.MeasureList[measureIndex];
    const graphicMeasure = measureRow?.[staffIndex];
    const staffLine = graphicMeasure?.ParentStaffLine;
    if (!staffLine) {
      return;
    }

    const hasWords =
      (multiExpression.MoodList?.length ?? 0) > 0
      || (multiExpression.UnknownList?.length ?? 0) > 0;
    if (!hasWords) {
      return;
    }

    if (staffLineHasMultiExpression(staffLine, multiExpression)) {
      return;
    }

    const defaultYXml = multiExpression.UnknownList?.[0]?.defaultYXml;
    const useFixedDefaultY = typeof defaultYXml === 'number'
      && Number.isFinite(defaultYXml)
      && defaultYXml < 0;

    if (useFixedDefaultY) {
      calculator[PENDING_DEFAULT_Y_KEY] = defaultYXml;
    }

    try {
      originalMoodAndUnknown(multiExpression, measureIndex, staffIndex);
    } finally {
      calculator[PENDING_DEFAULT_Y_KEY] = null;
    }
  };
};
