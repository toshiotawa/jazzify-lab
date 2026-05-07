import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { cn } from '@/utils/cn';
import { buildVoicingMusicXml, parseVoicingNoteName } from '@/utils/voicingMusicXml';

interface ChordVoicingStaffProps {
  voicing: readonly string[];
  voicingStaves: readonly number[];
  correctPitchClasses: readonly number[];
  chordKey: string;
  className?: string;
}

const CORRECT_FILL_COLOR = '#22d3ee';
const DEFAULT_FILL_COLOR = '#0f172a';

const computePitchClass = (noteName: string): number | null => {
  try {
    const parsed = parseVoicingNoteName(noteName);
    return ((parsed.midi % 12) + 12) % 12;
  } catch {
    return null;
  }
};

const ChordVoicingStaff: React.FC<ChordVoicingStaffProps> = ({
  voicing,
  voicingStaves,
  correctPitchClasses,
  chordKey,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const noteOrderRef = useRef<number[]>([]);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  const voicingArray = useMemo(() => Array.from(voicing), [voicing]);
  const voicingStavesArray = useMemo(() => Array.from(voicingStaves), [voicingStaves]);
  const correctPitchClassSet = useMemo(
    () => new Set(correctPitchClasses),
    [correctPitchClasses],
  );
  const voicingPitchClasses = useMemo(
    () => voicingArray.map(name => computePitchClass(name)),
    [voicingArray],
  );

  const applyCorrectColors = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const order = noteOrderRef.current;
    const noteElements = container.querySelectorAll<SVGGElement>('g.vf-stavenote');
    noteElements.forEach((noteEl, index) => {
      const voicingIndex = order[index];
      if (voicingIndex === undefined) {
        return;
      }
      const pc = voicingPitchClasses[voicingIndex];
      const isCorrect = pc !== null && pc !== undefined && correctPitchClassSet.has(pc);
      const fill = isCorrect ? CORRECT_FILL_COLOR : DEFAULT_FILL_COLOR;
      noteEl.querySelectorAll<SVGPathElement>('path').forEach(pathEl => {
        pathEl.setAttribute('fill', fill);
      });
    });
  }, [correctPitchClassSet, voicingPitchClasses]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (voicingArray.length === 0 || voicingStavesArray.length === 0) {
      container.innerHTML = '';
      noteOrderRef.current = [];
      setIsRendered(false);
      return;
    }
    let cancelled = false;
    setRenderError(null);
    setIsRendered(false);

    try {
      if (!osmdRef.current) {
        osmdRef.current = new OpenSheetMusicDisplay(container, {
          autoResize: true,
          backend: 'svg',
          drawTitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawPartNames: false,
          defaultColorNotehead: DEFAULT_FILL_COLOR,
          defaultColorStem: DEFAULT_FILL_COLOR,
          defaultColorRest: DEFAULT_FILL_COLOR,
          defaultColorLabel: DEFAULT_FILL_COLOR,
        });
      }
      const { xml, noteOrder } = buildVoicingMusicXml({
        voicing: voicingArray,
        voicingStaves: voicingStavesArray,
      });
      noteOrderRef.current = noteOrder;
      const osmd = osmdRef.current;
      void osmd
        .load(xml)
        .then(() => {
          if (cancelled) {
            return;
          }
          osmd.render();
          setIsRendered(true);
          applyCorrectColors();
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return;
          }
          setRenderError(error instanceof Error ? error.message : '譜面の描画に失敗しました');
        });
    } catch (error) {
      setRenderError(error instanceof Error ? error.message : '譜面の生成に失敗しました');
    }

    return () => {
      cancelled = true;
    };
  }, [applyCorrectColors, chordKey, voicingArray, voicingStavesArray]);

  useEffect(() => {
    if (!isRendered) {
      return;
    }
    applyCorrectColors();
  }, [applyCorrectColors, isRendered]);

  useEffect(() => () => {
    osmdRef.current?.clear();
    osmdRef.current = null;
  }, []);

  return (
    <div className={cn('relative w-full', className)}>
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-lg bg-white"
      />
      {renderError && (
        <div className="absolute inset-x-2 bottom-2 rounded bg-red-900/80 px-3 py-1 text-xs text-red-100">
          {renderError}
        </div>
      )}
    </div>
  );
};

export default ChordVoicingStaff;
