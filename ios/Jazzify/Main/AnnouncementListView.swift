import SwiftUI

struct AnnouncementListView: View {
    @EnvironmentObject var appState: AppState
    @State private var announcements: [AnnouncementRow] = []
    @State private var expandedIds: Set<UUID> = []
    @State private var isLoading = true

    private var locale: AppLocale { appState.locale }

    var body: some View {
        ZStack {
            Color(hex: "0f172a").ignoresSafeArea()

            if isLoading {
                ProgressView()
                    .tint(.purple)
            } else if announcements.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "bell.slash")
                        .font(.largeTitle)
                        .foregroundStyle(.gray)
                    Text(locale == .ja ? "お知らせはありません" : "No announcements")
                        .foregroundStyle(.gray)
                }
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(announcements) { item in
                            announcementItem(item)
                        }
                    }
                    .padding()
                }
            }
        }
        .navigationTitle(locale == .ja ? "お知らせ一覧" : "Announcements")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .task { await loadAnnouncements() }
    }

    private func announcementItem(_ item: AnnouncementRow) -> some View {
        let isExpanded = expandedIds.contains(item.id)

        return VStack(alignment: .leading, spacing: 8) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    if isExpanded {
                        expandedIds.remove(item.id)
                    } else {
                        expandedIds.insert(item.id)
                    }
                }
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(item.localizedTitle(locale))
                            .font(.subheadline.bold())
                            .foregroundStyle(.white)
                            .multilineTextAlignment(.leading)
                        Text(item.createdAt.formatted(date: .abbreviated, time: .omitted))
                            .font(.caption2)
                            .foregroundStyle(.gray.opacity(0.6))
                    }
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundStyle(.gray)
                }
            }

            if isExpanded {
                Text(item.localizedContent(locale))
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .transition(.opacity.combined(with: .move(edge: .top)))

                if let urlString = item.linkUrl, let url = URL(string: urlString) {
                    let label = {
                        if locale == .en, let en = item.linkTextEn, !en.isEmpty { return en }
                        return item.linkText ?? urlString
                    }()
                    Link(destination: url) {
                        HStack(spacing: 4) {
                            Text(label)
                                .font(.caption)
                            Image(systemName: "arrow.up.right.square")
                                .font(.caption2)
                        }
                        .foregroundStyle(.blue)
                    }
                }
            }
        }
        .padding(16)
        .background(Color(hex: "1e293b"))
        .cornerRadius(12)
    }

    private func loadAnnouncements() async {
        isLoading = true
        defer { isLoading = false }

        do {
            announcements = try await SupabaseService.shared.fetchAllActiveAnnouncements(locale: locale)
        } catch {
            announcements = []
        }
    }
}
