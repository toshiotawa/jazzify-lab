import QuickLook
import SwiftUI
import UIKit

// MARK: - Quick Look（レッスン添付の閲覧を Quick Look に固定）

private final class QLPreviewItemBox: NSObject, QLPreviewItem {
    let previewItemURL: URL?
    let previewItemTitle: String?

    init(url: URL, title: String) {
        self.previewItemURL = url
        self.previewItemTitle = title
    }
}

struct LessonAttachmentQuickLookView: UIViewControllerRepresentable {
    let fileURL: URL
    let title: String

    func makeCoordinator() -> Coordinator {
        Coordinator(fileURL: fileURL, title: title)
    }

    func makeUIViewController(context: Context) -> QLPreviewController {
        let controller = QLPreviewController()
        controller.dataSource = context.coordinator
        return controller
    }

    func updateUIViewController(_ uiViewController: QLPreviewController, context: Context) {}

    final class Coordinator: NSObject, QLPreviewControllerDataSource {
        private let item: QLPreviewItemBox

        init(fileURL: URL, title: String) {
            self.item = QLPreviewItemBox(url: fileURL, title: title)
        }

        func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
            1
        }

        func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
            item
        }
    }
}

// MARK: - 共有シート（ファイルに保存・他アプリで開く）

struct LessonAttachmentShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - ダウンロード

enum LessonAttachmentDownloadError: Error {
    case invalidResponse
}

enum LessonAttachmentDownload {
    /// リモート URL を一時ファイルに保存（Quick Look / 共有で利用）
    static func copyToTemporaryFile(from remoteURL: URL, suggestedFileName: String) async throws -> URL {
        let (data, response) = try await URLSession.shared.data(from: remoteURL)
        guard let http = response as? HTTPURLResponse, (200 ... 299).contains(http.statusCode) else {
            throw LessonAttachmentDownloadError.invalidResponse
        }

        let name = suggestedFileName.trimmingCharacters(in: .whitespacesAndNewlines)
        let baseName = (name as NSString).deletingPathExtension
        let ext = (name as NSString).pathExtension
        let safeBase = baseName.isEmpty ? "attachment" : baseName
        let safeExt = ext.isEmpty ? "bin" : ext

        let tempURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("\(safeBase)-\(UUID().uuidString.prefix(8)).\(safeExt)")

        try data.write(to: tempURL, options: .atomic)
        return tempURL
    }
}
