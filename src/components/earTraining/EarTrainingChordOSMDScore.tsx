import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OpenSheetMusicDisplay, type GraphicalNote, type IOSMDOptions } from 'opensheetmusicdisplay';
import type { ChordOsmdRhythmTarget, ChordOsmdTargetVisualState } from '@/utils/earTrainingChordOsmd';
import { getChordOsmdTargetNoteCount } from '@/utils/earTrainingChordOsmd';
import { cn } from '@/utils/cn';

interface EarTrainingChordOSMDScoreProps {
  musicXmlText: string | null;
  scoreErrorText: string | null;
  activeMeasureNumber: number;
  targets: readonly ChordOsmdRhythmTarget[];
  targetStates: ReadonlyMap<string, ChordOsmdTargetVisualState>;
  renderKeyValue: number;
  isEnglishCopy: boolean;
}

interface ScoreNotePosition {
  x: number;
  y: number;
}

interface TargetHighlightPosition extends ScoreNotePosition {
  id: string;
}

interface OsmdLayout {
  measureCenters: readonly number[];
  notePositions: readonly ScoreNotePosition[];
  scoreWidth: number;
}

const EMPTY_LAYOUT: OsmdLayout = {
  measureCenters: [],
  notePositions: [],
  scoreWidth: 0,
};

const NOTE_HIGHLIGHT_COLOR = '#f39800';
const NOTE_COMPLETED_COLOR = '#22c55e';
const NOTE_FAILED_COLOR = '#ef4444';

const getFiniteNumber = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

const collectGraphicalNotes = (osmd: OpenSheetMusicDisplay, scaleFactor: number): ScoreNotePosition[] => {
  const positions: ScoreNotePosition[] = [];
  const pages = osmd.GraphicSheet?.MusicPages ?? [];
  for (const page of pages) {
    for (const system of page.MusicSystems ?? []) {
      for (const staffLine of system.StaffLines ?? []) {
        for (const measure of staffLine.Measures ?? []) {
          for (const entry of measure.staffEntries ?? []) {
            for (const voiceEntry of entry.graphicalVoiceEntries ?? []) {
              for (const note of voiceEntry.notes ?? []) {
                if (!note.sourceNote?.Pitch && !note.sourceNote?.TransposedPitch) {
                  continue;
                }
                const absolute = note.PositionAndShape?.AbsolutePosition;
                const x = getFiniteNumber(absolute?.x);
                const y = getFiniteNumber(absolute?.y);
                if (x !== null && y !== null) {
                  positions.push({ x: x * scaleFactor, y: y * scaleFactor });
                }
              }
            }
          }
        }
      }
    }
  }
  return positions.sort((a, b) => {
    if (Math.abs(a.x - b.x) > 0.5) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });
};

const collectMeasureCenters = (
  osmd: OpenSheetMusicDisplay,
  surface: Element | null,
  viewportWidth: number,
): OsmdLayout => {
  const boundingWidth = getFiniteNumber(osmd.GraphicSheet?.BoundingBox?.width) ?? 0;
  const renderedWidth = surface?.getBoundingClientRect().width ?? 0;
  const scaleFactor = boundingWidth > 0 && renderedWidth > 0 ? renderedWidth / boundingWidth : 10;
  const starts: number[] = [];
  const pages = osmd.GraphicSheet?.MusicPages ?? [];
  for (const page of pages) {
    for (const system of page.MusicSystems ?? []) {
      const staffLine = (system.StaffLines ?? [])[0];
      if (!staffLine) {
        continue;
      }
      for (const measure of staffLine.Measures ?? []) {
        const x = getFiniteNumber(measure.PositionAndShape?.AbsolutePosition?.x);
        if (x !== null) {
          starts.push(x * scaleFactor);
        }
      }
    }
  }

  const measureCenters: number[] = [];
  for (let index = 0; index < starts.length; index += 1) {
    const current = starts[index];
    const previousWidth = current - (starts[index - 1] ?? 0);
    const next = starts[index + 1] ?? (current + Math.max(150, previousWidth));
    measureCenters.push((current + next) / 2);
  }

  const notePositions = collectGraphicalNotes(osmd, scaleFactor);
  const scoreWidth = Math.max(
    viewportWidth,
    renderedWidth,
    measureCenters[measureCenters.length - 1] ?? 0,
    notePositions[notePositions.length - 1]?.x ?? 0,
  );
  return { measureCenters, notePositions, scoreWidth };
};

const buildTargetHighlightPositions = (
  targets: readonly ChordOsmdRhythmTarget[],
  notePositions: readonly ScoreNotePosition[],
): TargetHighlightPosition[] => {
  const highlights: TargetHighlightPosition[] = [];
  let noteIndex = 0;
  for (const target of targets) {
    const count = getChordOsmdTargetNoteCount(target);
    for (let index = 0; index < count; index += 1) {
      const position = notePositions[noteIndex];
      noteIndex += 1;
      if (position) {
        highlights.push({ id: target.id, x: position.x, y: position.y });
      }
    }
  }
  return highlights;
};

const targetStateColor = (state: ChordOsmdTargetVisualState): string | null => {
  if (state === 'completed') {
    return NOTE_COMPLETED_COLOR;
  }
  if (state === 'active') {
    return NOTE_HIGHLIGHT_COLOR;
  }
  if (state === 'failed') {
    return NOTE_FAILED_COLOR;
  }
  return null;
};

const EarTrainingChordOSMDScore: React.FC<EarTrainingChordOSMDScoreProps> = ({
  musicXmlText,
  scoreErrorText,
  activeMeasureNumber,
  targets,
  targetStates,
  renderKeyValue,
  isEnglishCopy,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [layout, setLayout] = useState<OsmdLayout>(EMPTY_LAYOUT);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [scoreOffset, setScoreOffset] = useState(0);

  const renderScore = useCallback(async () => {
    const score = scoreRef.current;
    if (!score || !musicXmlText) {
      setLayout(EMPTY_LAYOUT);
      return;
    }

    setIsRendering(true);
    setRenderError(null);
    score.replaceChildren();
    osmdRef.current?.clear();
    osmdRef.current = null;

    const options: IOSMDOptions = {
      backend: 'svg',
      autoResize: false,
      drawTitle: false,
      drawComposer: false,
      drawLyricist: false,
      drawPartNames: false,
      drawingParameters: 'compacttight',
      renderSingleHorizontalStaffline: true,
      pageFormat: 'Endless',
      pageBackgroundColor: 'transparent',
      defaultColorMusic: '#ffffff',
      defaultColorNotehead: '#ffffff',
      defaultColorStem: '#ffffff',
      defaultColorRest: '#ffffff',
      defaultColorLabel: '#ffffff',
      defaultColorTitle: '#ffffff',
      defaultColorLyrics: '#ffffff',
    };

    try {
      const osmd = new OpenSheetMusicDisplay(score, options);
      osmdRef.current = osmd;
      await osmd.load(musicXmlText);
      osmd.render();
      const surface = score.querySelector('svg, canvas');
      const viewportWidth = viewportRef.current?.clientWidth ?? 0;
      setLayout(collectMeasureCenters(osmd, surface, viewportWidth));
    } catch {
      setRenderError(isEnglishCopy ? 'Could not render MusicXML.' : 'MusicXMLを表示できませんでした');
      setLayout(EMPTY_LAYOUT);
    } finally {
      setIsRendering(false);
    }
  }, [isEnglishCopy, musicXmlText]);

  useEffect(() => {
    void renderScore();
    return () => {
      osmdRef.current?.clear();
      osmdRef.current = null;
    };
  }, [renderKeyValue, renderScore]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const score = scoreRef.current;
    if (!viewport || !score) {
      return;
    }
    const index = Math.max(0, Math.floor(activeMeasureNumber) - 1);
    const center = layout.measureCenters[index] ?? layout.measureCenters[0] ?? viewport.clientWidth / 2;
    const maxOffset = Math.max(0, layout.scoreWidth - viewport.clientWidth);
    const offset = Math.max(0, Math.min(maxOffset, center - viewport.clientWidth / 2));
    score.style.transform = `translate3d(${-offset}px, -50%, 0)`;
    setScoreOffset(offset);
  }, [activeMeasureNumber, layout]);

  const highlights = useMemo(
    () => buildTargetHighlightPositions(targets, layout.notePositions),
    [layout.notePositions, targets],
  );

  const visibleHighlights = highlights
    .map(highlight => ({
      ...highlight,
      color: targetStateColor(targetStates.get(highlight.id) ?? 'idle'),
    }))
    .filter((highlight): highlight is TargetHighlightPosition & { color: string } => highlight.color !== null);

  const statusText = renderError ?? scoreErrorText;

  return (
    <div
      ref={viewportRef}
      className="ear-training-osmd-score pointer-events-none absolute left-1/2 top-[42%] z-10 h-[min(280px,42vh)] w-[min(860px,86vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
    >
      <div
        ref={scoreRef}
        className={cn(
          'absolute left-0 top-1/2 min-w-full origin-left transition-transform duration-150 ease-out',
          '[&_canvas]:!bg-transparent [&_svg]:!bg-transparent',
        )}
      />
      <svg
        aria-hidden="true"
        className="absolute left-0 top-1/2 overflow-visible transition-transform duration-150 ease-out"
        style={{ transform: `translate3d(${-scoreOffset}px, -50%, 0)` }}
        width={Math.max(layout.scoreWidth, viewportRef.current?.clientWidth ?? 0)}
        height="100%"
        viewBox={`0 0 ${Math.max(layout.scoreWidth, viewportRef.current?.clientWidth ?? 0)} 280`}
      >
        {visibleHighlights.map((highlight, index) => (
          <g key={`${highlight.id}-${index}`} transform={`translate(${highlight.x}, ${highlight.y})`}>
            <ellipse
              cx={0}
              cy={0}
              rx={10}
              ry={7}
              fill={highlight.color}
              opacity={0.72}
            />
            <ellipse
              cx={0}
              cy={0}
              rx={13}
              ry={10}
              fill="none"
              stroke={highlight.color}
              strokeWidth={2}
              opacity={0.95}
            />
          </g>
        ))}
      </svg>
      {(isRendering || statusText) && (
        <div className="absolute inset-0 grid place-items-center text-center text-xs font-semibold text-white/75">
          {statusText ?? (isEnglishCopy ? 'Rendering score...' : '譜面を表示中…')}
        </div>
      )}
    </div>
  );
};

export default EarTrainingChordOSMDScore;
