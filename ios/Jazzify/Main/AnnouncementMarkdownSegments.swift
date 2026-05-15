import Foundation

enum AnnouncementMarkdownSegment: Equatable {
    case text(String)
    case image(alt: String, url: URL)
}

private let announcementImageMarkdownPattern = #"!\[([^\]]*)\]\(([^)]+)\)"#

enum AnnouncementMarkdownParsing {
    static func parse(_ markdown: String) -> [AnnouncementMarkdownSegment] {
        guard !markdown.isEmpty else { return [] }

        guard let regex = try? NSRegularExpression(pattern: announcementImageMarkdownPattern, options: []) else {
            return [.text(markdown)]
        }

        let ns = markdown as NSString
        let fullRange = NSRange(location: 0, length: ns.length)
        let matches = regex.matches(in: markdown, options: [], range: fullRange)

        if matches.isEmpty {
            return [.text(markdown)]
        }

        var segments: [AnnouncementMarkdownSegment] = []
        var cursor = 0

        for match in matches {
            let matchRange = match.range

            if matchRange.location > cursor {
                let textRange = NSRange(location: cursor, length: matchRange.location - cursor)
                let text = ns.substring(with: textRange)
                if !text.isEmpty {
                    segments.append(.text(text))
                }
            }

            if match.numberOfRanges >= 3 {
                let alt = ns.substring(with: match.range(at: 1))
                let urlString = ns
                    .substring(with: match.range(at: 2))
                    .trimmingCharacters(in: .whitespacesAndNewlines)

                if let url = URL(string: urlString),
                   let scheme = url.scheme?.lowercased(),
                   scheme == "http" || scheme == "https"
                {
                    segments.append(.image(alt: alt, url: url))
                } else {
                    let raw = ns.substring(with: match.range(at: 0))
                    segments.append(.text(raw))
                }
            }

            cursor = matchRange.location + matchRange.length
        }

        if cursor < ns.length {
            let tail = ns.substring(from: cursor)
            if !tail.isEmpty {
                segments.append(.text(tail))
            }
        }

        return segments.isEmpty ? [.text(markdown)] : segments
    }

    /// ダッシュボード等のプレビュー用: 画像 Markdown 記法を除去して整形する。
    static func plainPreview(from markdown: String) -> String {
        guard !markdown.isEmpty else { return "" }

        guard let regex = try? NSRegularExpression(pattern: announcementImageMarkdownPattern, options: []) else {
            return markdown
        }

        let range = NSRange(location: 0, length: (markdown as NSString).length)
        let stripped = regex.stringByReplacingMatches(in: markdown, options: [], range: range, withTemplate: "")

        return stripped
            .split(whereSeparator: \.isNewline)
            .map { String($0).trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
            .joined(separator: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func firstImageURL(in markdown: String) -> URL? {
        for segment in parse(markdown) {
            if case let .image(_, url) = segment {
                return url
            }
        }
        return nil
    }
}
