import Foundation
import UIKit
import WebKit

extension EarTrainingMode {
    var supportsScorePdfDownload: Bool {
        self == .chordOSMD || self == .chordPrecision
    }
}

enum OsmdScorePdfExportError: LocalizedError {
    case noMusicXml
    case invalidResponse
    case exportFailed(String)
    case invalidPdfData

    var errorDescription: String? {
        switch self {
        case .noMusicXml:
            return "MusicXML is not registered."
        case .invalidResponse:
            return "Could not load MusicXML."
        case let .exportFailed(message):
            return message
        case .invalidPdfData:
            return "Could not create score PDF."
        }
    }
}

struct OsmdScorePdfSectionInput: Encodable, Sendable {
    let title: String?
    let musicXmlText: String
}

enum OsmdScorePdfExportService {
    static func buildFileName(chapterNumber: Int, questNumber: Int, taskNumber: Int) -> String {
        "Chapter\(chapterNumber)-Quest\(questNumber)-\(taskNumber).pdf"
    }

    static func hideAlternateVoiceRests(_ xmlText: String) -> String {
        guard let root = ChordOsmdXmlParser.parse(xmlText) else {
            return xmlText
        }
        var changed = false
        func visit(_ element: ChordOsmdXmlElement) {
            if element.name == "measure" {
                if hideAlternateVoiceRests(in: element) {
                    changed = true
                }
            }
            for child in element.children {
                if case let .element(inner) = child {
                    visit(inner)
                }
            }
        }
        visit(root)
        guard changed else {
            return xmlText
        }
        let serialized = ChordOsmdXmlSerializer.stringify(root)
        let trimmed = serialized.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.hasPrefix("<?xml") {
            return serialized
        }
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" + serialized
    }

    private static func hideAlternateVoiceRests(in measure: ChordOsmdXmlElement) -> Bool {
        var notes: [ChordOsmdXmlElement] = []
        for child in measure.children {
            guard case let .element(el) = child, el.name == "note" else { continue }
            notes.append(el)
        }

        var hasGuidePitch = false
        var hasPlayPitch = false
        for note in notes {
            guard hasDirectChild(note, "pitch") else { continue }
            let voice = EarTrainingChordOsmdMusicXmlNormalizer.parseNoteVoiceNumber(note)
            if voice == EarTrainingChordOsmdMusicXmlNormalizer.guideVoice {
                hasGuidePitch = true
            }
            if voice == 1 || voice == nil {
                hasPlayPitch = true
            }
        }

        var changed = false
        for note in notes {
            guard hasDirectChild(note, "rest") else { continue }
            let voice = EarTrainingChordOsmdMusicXmlNormalizer.parseNoteVoiceNumber(note)
            let hideRest = (hasGuidePitch && (voice == 1 || voice == nil))
                || (hasPlayPitch && voice == EarTrainingChordOsmdMusicXmlNormalizer.guideVoice)
            guard hideRest else { continue }
            if setAttribute(note, name: "print-object", value: "no") {
                changed = true
            }
        }
        return changed
    }

    private static func hasDirectChild(_ element: ChordOsmdXmlElement, _ name: String) -> Bool {
        element.children.contains { child in
            if case let .element(inner) = child {
                return inner.name == name
            }
            return false
        }
    }

    private static func setAttribute(_ el: ChordOsmdXmlElement, name: String, value: String) -> Bool {
        if let idx = el.attributes.firstIndex(where: { $0.name == name }) {
            if el.attributes[idx].value == value {
                return false
            }
            el.attributes[idx].value = value
            return true
        }
        el.attributes.append((name: name, value: value))
        return true
    }

    static func exportStageScore(
        stageId: UUID,
        chapterNumber: Int,
        questNumber: Int,
        taskNumber: Int
    ) async throws -> URL {
        let detail = try await SupabaseService.shared.fetchEarTrainingStageDetail(stageId: stageId)
        let showScoreLyrics = detail.resolvedShowScoreLyricsInBattle
        var sections: [OsmdScorePdfSectionInput] = []

        for phrase in detail.sortedPhrases() {
            guard let rawURL = phrase.musicXmlUrl?.trimmingCharacters(in: .whitespacesAndNewlines),
                  !rawURL.isEmpty,
                  let url = URL(string: rawURL) else {
                continue
            }

            var request = URLRequest(url: url)
            request.cachePolicy = .reloadIgnoringLocalCacheData
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, (200 ... 299).contains(http.statusCode) else {
                throw OsmdScorePdfExportError.invalidResponse
            }
            guard let text = String(data: data, encoding: .utf8), !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                throw OsmdScorePdfExportError.invalidResponse
            }

            let normalized = EarTrainingChordOsmdMusicXmlNormalizer.normalizeChordOsmdMusicXml(text)
            let withoutLyrics = showScoreLyrics
                ? normalized
                : EarTrainingChordOsmdMusicXmlNormalizer.stripLyricsFromMusicXml(normalized)
            let displayXml = hideAlternateVoiceRests(withoutLyrics)
            sections.append(OsmdScorePdfSectionInput(title: nil, musicXmlText: displayXml))
        }

        guard !sections.isEmpty else {
            throw OsmdScorePdfExportError.noMusicXml
        }

        let fileName = buildFileName(
            chapterNumber: chapterNumber,
            questNumber: questNumber,
            taskNumber: taskNumber
        )
        let pdfData = try await OsmdScorePdfExporter.shared.exportPdf(
            documentTitle: fileName,
            sections: sections,
            showScoreLyrics: showScoreLyrics
        )
        let tempURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("\((fileName as NSString).deletingPathExtension)-\(UUID().uuidString.prefix(8)).pdf")
        try pdfData.write(to: tempURL, options: .atomic)
        return tempURL
    }
}

@MainActor
final class OsmdScorePdfExporter: NSObject {
    static let shared = OsmdScorePdfExporter()

    private static let scriptMessageName = "osmdScorePdfExport"

    private var webView: WKWebView?
    private var htmlReady = false
    private var pendingContinuation: CheckedContinuation<Data, Error>?

    private override init() {
        super.init()
    }

    func exportPdf(
        documentTitle: String,
        sections: [OsmdScorePdfSectionInput],
        showScoreLyrics: Bool
    ) async throws -> Data {
        let webView = try await ensureWebViewReady()
        let payload: [String: Any] = [
            "documentTitle": documentTitle,
            "showScoreLyrics": showScoreLyrics,
            "sections": sections.map { section in
                [
                    "title": section.title as Any,
                    "musicXmlText": section.musicXmlText,
                ]
            },
        ]
        let payloadData = try JSONSerialization.data(withJSONObject: payload)
        guard let payloadJson = String(data: payloadData, encoding: .utf8) else {
            throw OsmdScorePdfExportError.exportFailed("Invalid export payload.")
        }

        return try await withCheckedThrowingContinuation { continuation in
            if pendingContinuation != nil {
                continuation.resume(throwing: OsmdScorePdfExportError.exportFailed("Export already in progress."))
                return
            }
            pendingContinuation = continuation

            let script = "window.OsmdScorePdf.export(\(payloadJson));"
            webView.evaluateJavaScript(script) { _, error in
                if let error {
                    self.finish(with: .failure(OsmdScorePdfExportError.exportFailed(error.localizedDescription)))
                }
            }
        }
    }

    private func ensureWebViewReady() async throws -> WKWebView {
        if let webView, htmlReady {
            return webView
        }

        let configuration = WKWebViewConfiguration()
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        configuration.defaultWebpagePreferences = preferences
        configuration.userContentController.add(self, name: Self.scriptMessageName)

        let view = WKWebView(frame: CGRect(x: 0, y: 0, width: 794, height: 1123), configuration: configuration)
        view.isHidden = true
        attachToKeyWindow(view)
        webView = view
        htmlReady = false

        view.loadHTMLString(Self.printHTML, baseURL: Bundle.main.bundleURL)

        return try await withCheckedThrowingContinuation { continuation in
            loadReadyContinuation = continuation
        }
    }

    private var loadReadyContinuation: CheckedContinuation<WKWebView, Error>?

    private func attachToKeyWindow(_ view: WKWebView) {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first(where: { $0.isKeyWindow }) else {
            return
        }
        view.frame = CGRect(x: -10_000, y: 0, width: 794, height: 1123)
        window.addSubview(view)
    }

    private func finish(with result: Result<Data, Error>) {
        guard let continuation = pendingContinuation else { return }
        pendingContinuation = nil
        switch result {
        case let .success(data):
            continuation.resume(returning: data)
        case let .failure(error):
            continuation.resume(throwing: error)
        }
    }

    private static let printHTML = """
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="opensheetmusicdisplay.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/svg2pdf.js@2.7.0/dist/svg2pdf.min.js"></script>
        <style>
          html, body { margin: 0; padding: 0; background: #ffffff; }
          #printRoot { position: absolute; left: -100000px; top: 0; width: 794px; background: #ffffff; }
        </style>
      </head>
      <body>
        <div id="printRoot"></div>
        <script>
          (function () {
            const A4_WIDTH_MM = 210;
            const A4_HEIGHT_MM = 297;
            const PDF_MARGIN_MM = 12;

            function waitNextPaint() {
              return new Promise(function (resolve) {
                requestAnimationFrame(function () {
                  requestAnimationFrame(resolve);
                });
              });
            }

            function buildOsmd(targetRoot) {
              const ctor = window.opensheetmusicdisplay && window.opensheetmusicdisplay.OpenSheetMusicDisplay;
              if (!ctor) {
                throw new Error('OpenSheetMusicDisplay missing');
              }
              const osmdInst = new ctor(targetRoot, {
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
                defaultColorLyrics: '#000000'
              });
              const rules = osmdInst.EngravingRules || osmdInst.rules;
              if (rules) {
                rules.NewSystemAtXMLNewSystemAttribute = true;
                rules.NewPageAtXMLNewPageAttribute = true;
              }
              return osmdInst;
            }

            async function renderSectionSvgs(musicXmlText) {
              const container = document.getElementById('printRoot');
              container.replaceChildren();
              const osmd = buildOsmd(container);
              await osmd.load(musicXmlText);
              osmd.render();
              await waitNextPaint();
              const svgs = Array.from(container.querySelectorAll('svg'));
              if (!svgs.length) {
                throw new Error('OSMD did not render any score pages.');
              }
              return svgs.map(function (svg) { return svg.cloneNode(true); });
            }

            async function exportScorePdf(payload) {
              const jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
              const svg2pdfFn = window.svg2pdf || (window.svg2pdfjs && window.svg2pdfjs.svg2pdf);
              if (!jsPDFCtor || !svg2pdfFn) {
                throw new Error('PDF libraries missing');
              }
              const sections = payload.sections || [];
              if (!sections.length) {
                throw new Error('No score sections to export.');
              }
              const pdf = new jsPDFCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
              const printableWidth = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
              const printableHeight = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;
              let wroteFirstPage = false;
              for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
                const section = sections[sectionIndex];
                const sectionSvgs = await renderSectionSvgs(section.musicXmlText);
                for (let pageIndex = 0; pageIndex < sectionSvgs.length; pageIndex += 1) {
                  if (wroteFirstPage) {
                    pdf.addPage();
                  }
                  await svg2pdfFn(sectionSvgs[pageIndex], pdf, {
                    x: PDF_MARGIN_MM,
                    y: PDF_MARGIN_MM,
                    width: printableWidth,
                    height: printableHeight
                  });
                  wroteFirstPage = true;
                }
              }
              const dataUri = pdf.output('datauristring');
              const commaIndex = dataUri.indexOf(',');
              if (commaIndex < 0) {
                throw new Error('Invalid PDF output');
              }
              return dataUri.slice(commaIndex + 1);
            }

            window.OsmdScorePdf = {
              export: async function (payload) {
                try {
                  const base64 = await exportScorePdf(payload);
                  window.webkit.messageHandlers.\(Self.scriptMessageName).postMessage({ ok: true, base64: base64 });
                } catch (error) {
                  const message = error && error.message ? String(error.message) : String(error);
                  window.webkit.messageHandlers.\(Self.scriptMessageName).postMessage({ ok: false, error: message });
                }
              }
            };

            window.webkit.messageHandlers.\(Self.scriptMessageName).postMessage({ ok: true, ready: true });
          })();
        </script>
      </body>
    </html>
    """
}

extension OsmdScorePdfExporter: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.scriptMessageName else { return }

        if let body = message.body as? [String: Any], body["ready"] as? Bool == true {
            htmlReady = true
            if let webView, let continuation = loadReadyContinuation {
                loadReadyContinuation = nil
                continuation.resume(returning: webView)
            }
            return
        }

        guard let body = message.body as? [String: Any] else {
            finish(with: .failure(OsmdScorePdfExportError.exportFailed("Invalid export response.")))
            return
        }

        if body["ok"] as? Bool == true, let base64 = body["base64"] as? String {
            guard let data = Data(base64Encoded: base64) else {
                finish(with: .failure(OsmdScorePdfExportError.invalidPdfData))
                return
            }
            finish(with: .success(data))
            return
        }

        let errorMessage = (body["error"] as? String) ?? "Could not create score PDF."
        finish(with: .failure(OsmdScorePdfExportError.exportFailed(errorMessage)))
    }
}
