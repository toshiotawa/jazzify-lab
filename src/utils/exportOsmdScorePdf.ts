import type { EarTrainingPhrase } from '@/types';
import type { IOSMDOptions, OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { fetchEarTrainingStageById } from '@/platform/supabaseEarTraining';
import { toCdnProxyUrl } from '@/utils/cdnProxy';
import { normalizeChordOsmdMusicXml } from '@/utils/earTrainingChordOsmd';
import {
  collectOsmdPhraseMusicXmlUrls,
  sanitizeOsmdScorePdfFileName,
  type OsmdScorePdfSection,
} from '@/utils/osmdScorePdfExport';
import { ensureMusicXmlDeclaration, stripLyricsFromMusicXml } from '@/utils/musicXmlMapper';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 12;

type OsmdPrintInstance = OpenSheetMusicDisplay & {
  EngravingRules?: Record<string, unknown>;
  rules?: Record<string, unknown>;
};

const applyOsmdPrintEngravingRules = (osmd: OsmdPrintInstance): void => {
  const rules = osmd.EngravingRules ?? osmd.rules;
  if (!rules) {
    return;
  }
  rules.NewSystemAtXMLNewSystemAttribute = true;
  rules.NewPageAtXMLNewPageAttribute = true;
};

const buildOsmdPrintOptions = (): IOSMDOptions => ({
  backend: 'svg',
  autoResize: false,
  drawTitle: false,
  drawComposer: false,
  drawLyricist: false,
  drawPartNames: false,
  drawMeasureNumbers: true,
  drawingParameters: 'compacttight',
  renderSingleHorizontalStaffline: false,
  pageFormat: 'A4_P',
  pageBackgroundColor: '#ffffff',
  defaultColorMusic: '#000000',
  defaultColorNotehead: '#000000',
  defaultColorStem: '#000000',
  defaultColorRest: '#000000',
  defaultColorLabel: '#000000',
  defaultColorTitle: '#000000',
  defaultColorLyrics: '#000000',
});

const waitNextPaint = async (): Promise<void> => {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
};

const preparePrintMusicXml = (
  musicXmlText: string,
  showScoreLyrics: boolean,
): string => {
  const normalized = ensureMusicXmlDeclaration(normalizeChordOsmdMusicXml(musicXmlText));
  return showScoreLyrics ? normalized : stripLyricsFromMusicXml(normalized);
};

const collectRenderedSvgs = (container: HTMLElement): SVGSVGElement[] => {
  const svgs = Array.from(container.querySelectorAll('svg'));
  return svgs.filter((svg): svg is SVGSVGElement => svg instanceof SVGSVGElement);
};

const renderSectionSvgs = async (
  OpenSheetMusicDisplayCtor: typeof OpenSheetMusicDisplay,
  musicXmlText: string,
  showScoreLyrics: boolean,
): Promise<SVGSVGElement[]> => {
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.position = 'fixed';
  container.style.left = '-100000px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.background = '#ffffff';
  document.body.appendChild(container);

  try {
    const osmd = new OpenSheetMusicDisplayCtor(container, buildOsmdPrintOptions()) as OsmdPrintInstance;
    applyOsmdPrintEngravingRules(osmd);
    const displayXml = preparePrintMusicXml(musicXmlText, showScoreLyrics);
    await osmd.load(displayXml);
    osmd.render();
    await waitNextPaint();
    const svgs = collectRenderedSvgs(container);
    if (svgs.length === 0) {
      throw new Error('OSMD did not render any score pages.');
    }
    return svgs.map((svg) => svg.cloneNode(true) as SVGSVGElement);
  } finally {
    container.remove();
  }
};

const renderOsmdScoreSectionsToPdfBlob = async (
  sections: readonly OsmdScorePdfSection[],
  showScoreLyrics = false,
): Promise<Blob> => {
  if (sections.length === 0) {
    throw new Error('No score sections to export.');
  }

  const [{ OpenSheetMusicDisplay: OpenSheetMusicDisplayCtor }, { jsPDF }, { svg2pdf }] = await Promise.all([
    import('opensheetmusicdisplay'),
    import('jspdf'),
    import('svg2pdf.js'),
  ]);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const printableWidth = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
  const printableHeight = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;
  let wroteFirstPage = false;

  for (const section of sections) {
    const sectionSvgs = await renderSectionSvgs(
      OpenSheetMusicDisplayCtor,
      section.musicXmlText,
      showScoreLyrics,
    );

    for (const svg of sectionSvgs) {
      if (wroteFirstPage) {
        pdf.addPage();
      }
      await svg2pdf(svg, pdf, {
        x: PDF_MARGIN_MM,
        y: PDF_MARGIN_MM,
        width: printableWidth,
        height: printableHeight,
      });
      wroteFirstPage = true;
    }
  }

  return pdf.output('blob');
};

const triggerPdfBlobDownload = (blob: Blob, fileName: string): void => {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
};

const fetchMusicXmlText = async (url: string): Promise<string> => {
  const response = await fetch(toCdnProxyUrl(url));
  if (!response.ok) {
    throw new Error(String(response.status));
  }
  const text = await response.text();
  if (!text.trim()) {
    throw new Error('empty');
  }
  return text;
};

const loadOsmdScorePdfSections = async (
  phrases: readonly EarTrainingPhrase[] | undefined,
): Promise<readonly OsmdScorePdfSection[]> => {
  if (collectOsmdPhraseMusicXmlUrls(phrases).length === 0) {
    throw new Error('no_music_xml');
  }

  const ordered = (phrases ?? [])
    .slice()
    .sort((left, right) => left.order_index - right.order_index);

  const sections: OsmdScorePdfSection[] = [];
  for (const phrase of ordered) {
    const url = phrase.music_xml_url?.trim();
    if (!url) {
      continue;
    }
    const musicXmlText = await fetchMusicXmlText(url);
    sections.push({
      musicXmlText,
    });
  }

  if (sections.length === 0) {
    throw new Error('no_music_xml');
  }

  return sections;
};

interface DownloadEarTrainingOsmdScorePdfParams {
  stageId: string;
  stageTitle: string;
}

export const downloadEarTrainingOsmdScorePdf = async ({
  stageId,
  stageTitle,
}: DownloadEarTrainingOsmdScorePdfParams): Promise<void> => {
  const stage = await fetchEarTrainingStageById(stageId);
  const sections = await loadOsmdScorePdfSections(stage.phrases);
  const blob = await renderOsmdScoreSectionsToPdfBlob(
    sections,
    stage.show_score_lyrics_in_battle === true,
  );
  triggerPdfBlobDownload(blob, sanitizeOsmdScorePdfFileName(stageTitle));
};
