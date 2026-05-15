import SwiftUI

struct AnnouncementDetailView: View {
    @EnvironmentObject var appState: AppState
    let announcement: AnnouncementRow

    private var locale: AppLocale { appState.locale }

    var body: some View {
        ZStack {
            Color(hex: "0f172a").ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text(announcement.localizedTitle(locale))
                        .font(.headline)
                        .foregroundStyle(.white)
                        .fixedSize(horizontal: false, vertical: true)

                    Text(announcement.createdAt.formatted(date: .abbreviated, time: .omitted))
                        .font(.caption2)
                        .foregroundStyle(.gray.opacity(0.6))

                    AnnouncementRichContent(markdown: announcement.localizedContent(locale))

                    if let urlString = announcement.linkUrl, let url = URL(string: urlString) {
                        let label = linkLabel(urlString: urlString)
                        Link(destination: url) {
                            HStack(spacing: 4) {
                                Text(label)
                                    .font(.subheadline)
                                Image(systemName: "arrow.up.right.square")
                                    .font(.caption)
                            }
                            .foregroundStyle(.blue)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
            }
        }
        .navigationTitle(locale == .ja ? "詳細" : "Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
    }

    private func linkLabel(urlString: String) -> String {
        if locale == .en, let en = announcement.linkTextEn, !en.isEmpty { return en }
        return announcement.linkText ?? urlString
    }
}
