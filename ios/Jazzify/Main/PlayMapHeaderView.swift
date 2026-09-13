import SwiftUI

struct PlayMapTierProgress: Sendable {
    let cleared: Int
    let total: Int
}

struct PlayMapHeaderView: View {
    let locale: AppLocale
    let mode: PlayMapMode
    let tier: PlayMapTier
    let tierProgress: [PlayMapTier: PlayMapTierProgress]
    let onModeChange: (PlayMapMode) -> Void
    let onTierChange: (PlayMapTier) -> Void

    @Namespace private var tierNamespace

    private var isEnglishCopy: Bool { locale == .en }

    var body: some View {
        VStack(spacing: 8) {
            modeSegment
            tierSegment
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(mode == .codeRun ? Color(hex: "e8a040").opacity(0.25) : Color(hex: "34d399").opacity(0.25), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 18))
        .padding(.horizontal, 12)
        .padding(.top, 8)
    }

    private var modeSegment: some View {
        HStack(spacing: 4) {
            modeButton(
                title: isEnglishCopy ? "Code Run" : "コードラン",
                systemImage: "music.note",
                selected: mode == .codeRun,
                selectedColor: Color(hex: "e8a040")
            ) {
                onModeChange(.codeRun)
            }
            modeButton(
                title: isEnglishCopy ? "Phrase Defense" : "フレーズディフェンス",
                systemImage: "shield.fill",
                selected: mode == .defense,
                selectedColor: Color(hex: "34d399")
            ) {
                onModeChange(.defense)
            }
        }
        .padding(4)
        .background(Color.black.opacity(0.35))
        .clipShape(Capsule())
    }

    private var tierSegment: some View {
        HStack(spacing: 4) {
            ForEach(PlayMapTier.allCases, id: \.rawValue) { tab in
                tierButton(for: tab)
            }
        }
        .padding(4)
        .background(Color.black.opacity(0.35))
        .clipShape(Capsule())
    }

    private func modeButton(
        title: String,
        systemImage: String,
        selected: Bool,
        selectedColor: Color,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: systemImage)
                    .font(.caption.bold())
                Text(title)
                    .font(.caption.bold())
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .foregroundStyle(selected ? Color(hex: "0f172a") : .white.opacity(0.85))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(
                Group {
                    if selected {
                        Capsule().fill(selectedColor)
                    } else {
                        Capsule().fill(Color.clear)
                    }
                }
            )
        }
        .buttonStyle(.plain)
    }

    private func tierButton(for tab: PlayMapTier) -> some View {
        let progress = tierProgress[tab] ?? PlayMapTierProgress(cleared: 0, total: 0)
        let selected = tier == tab
        return Button {
            onTierChange(tab)
        } label: {
            HStack(spacing: 6) {
                Text(tab == .basic ? "Basic" : "Advanced")
                    .font(.caption.bold())
                Text("\(progress.cleared)/\(progress.total)")
                    .font(.caption2.bold())
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(
                        Capsule().fill(selected ? Color.black.opacity(0.08) : Color.white.opacity(0.12))
                    )
            }
            .foregroundStyle(selected ? Color(hex: "0f172a") : .white.opacity(0.85))
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background {
                if selected {
                    Capsule()
                        .fill(Color.white)
                        .matchedGeometryEffect(id: "tierPill", in: tierNamespace)
                }
            }
        }
        .buttonStyle(.plain)
    }
}
