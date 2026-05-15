import React, { useCallback, useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay, type IOSMDOptions } from 'opensheetmusicdisplay';
import { cn } from '@/utils/cn';

interface EarTrainingChordOSMDScoreProps {
  musicXmlText: string | null;
  scoreErrorText: string | null;
  activeMeasureNumber: number;
  renderKeyValue: number;
  isEnglishCopy: boolean;
  /** ロビーやリザルト表示中など、譜面を裏に隠したい場合に true。マウントは維持する。 */
  hidden?: boolean;
}

interface OsmdLayout {
  measureCenters: readonly number[];
  scoreWidth: number;
}

const EMPTY_LAYOUT: OsmdLayout = {
  measureCenters: [],
  scoreWidth: 0,
};

const getFiniteNumber = (value: unknown): number | null => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

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

  const noteTailX = ((): number => {
    let maxX = 0;
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
                  const x = getFiniteNumber(note.PositionAndShape?.AbsolutePosition?.x);
                  if (x !== null) {
                    maxX = Math.max(maxX, x * scaleFactor);
                  }
                }
              }
            }
          }
        }
      }
    }
    return maxX;
  })();

  const scoreWidth = Math.max(
    viewportWidth,
    renderedWidth,
    measureCenters[measureCenters.length - 1] ?? 0,
    noteTailX,
  );
  return { measureCenters, scoreWidth };
};

const EarTrainingChordOSMDScore: React.FC<EarTrainingChordOSMDScoreProps> = ({
  musicXmlText,
  scoreErrorText,
  activeMeasureNumber,
  renderKeyValue,
  isEnglishCopy,
  hidden = false,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scoreRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [layout, setLayout] = useState<OsmdLayout>(EMPTY_LAYOUT);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

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
      defaultColorMusic: '#ffffff',
      defaultColorNotehead: '#ffffff',
      defaultColorStem: '#ffffff',
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
  }, [activeMeasureNumber, layout]);

  const statusText = renderError ?? scoreErrorText;

  return (
    <div
      ref={viewportRef}
      aria-hidden={hidden}
      className={cn(
        'ear-training-osmd-score pointer-events-none absolute left-1/2 top-[42%] z-10 h-[min(280px,42vh)] w-[min(860px,86vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden',
        hidden && 'invisible',
      )}
    >
      <div
        ref={scoreRef}
        className={cn(
          'absolute left-0 top-1/2 min-w-full origin-left transition-transform duration-150 ease-out',
          '[&_canvas]:!bg-transparent [&_svg]:!bg-transparent',
        )}
      />
      {(isRendering || statusText) && (
        <div className="absolute inset-0 grid place-items-center text-center text-xs font-semibold text-white/75">
          {statusText ?? (isEnglishCopy ? 'Rendering score...' : '譜面を表示中…')}
        </div>
      )}
    </div>
  );
};

export default EarTrainingChordOSMDScore;
