import SwiftUI

struct AnnouncementRichContent: View {
    let markdown: String
    var textColor: Color = .gray
    var textFont: Font = .body
    var imageMaxHeight: CGFloat = 400
    var imageCornerRadius: CGFloat = 8

    private var segments: [AnnouncementMarkdownSegment] {
        AnnouncementMarkdownParsing.parse(markdown)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(Array(segments.enumerated()), id: \.offset) { _, segment in
                segmentRow(segment)
            }
        }
    }

    @ViewBuilder
    private func segmentRow(_ segment: AnnouncementMarkdownSegment) -> some View {
        switch segment {
        case let .text(raw):
            if !raw.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Group {
                    if let attr = try? AttributedString(
                        markdown: raw,
                        options: AttributedString.MarkdownParsingOptions(interpretedSyntax: .full)
                    ) {
                        Text(attr)
                    } else {
                        Text(raw)
                    }
                }
                .foregroundStyle(textColor)
                .font(textFont)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            }

        case let .image(alt, url):
            AnnouncementRemoteImage(
                url: url,
                accessibilityLabel: alt.isEmpty ? nil : alt,
                cornerRadius: imageCornerRadius
            )
            .frame(maxWidth: .infinity)
            .frame(maxHeight: imageMaxHeight)
        }
    }
}

struct AnnouncementRemoteImage: View {
    let url: URL
    var accessibilityLabel: String?
    var cornerRadius: CGFloat = 8

    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .empty:
                ProgressView()
                    .tint(.purple)
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: 120)
            case .success(let image):
                image
                    .resizable()
                    .scaledToFit()
                    .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
                    .modifier(AnnouncementImageAccessibilityModifier(label: accessibilityLabel))
            case .failure:
                Image(systemName: "photo")
                    .font(.largeTitle)
                    .foregroundStyle(.gray.opacity(0.5))
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: 80)
            @unknown default:
                EmptyView()
            }
        }
    }
}

private struct AnnouncementImageAccessibilityModifier: ViewModifier {
    let label: String?

    @ViewBuilder
    func body(content: Content) -> some View {
        if let label, !label.isEmpty {
            content.accessibilityLabel(label)
        } else {
            content
        }
    }
}

struct AnnouncementDashboardThumbnail: View {
    let url: URL
    private let height: CGFloat = 84

    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .empty:
                RoundedRectangle(cornerRadius: 6)
                    .fill(Color.white.opacity(0.06))
                    .frame(height: height)
                    .overlay {
                        ProgressView()
                            .tint(.purple)
                            .scaleEffect(0.85)
                    }
            case .success(let image):
                image
                    .resizable()
                    .scaledToFill()
                    .frame(maxWidth: .infinity)
                    .frame(height: height)
                    .clipped()
                    .clipShape(RoundedRectangle(cornerRadius: 6))
            case .failure:
                RoundedRectangle(cornerRadius: 6)
                    .fill(Color.white.opacity(0.06))
                    .frame(height: height)
                    .overlay {
                        Image(systemName: "photo")
                            .foregroundStyle(.gray.opacity(0.5))
                    }
            @unknown default:
                EmptyView()
            }
        }
    }
}
