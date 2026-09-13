import SwiftUI

struct PlayMapTierProgress: Sendable {
    let cleared: Int
    let total: Int
}

struct PlayMapTierBarView: View {
    let locale: AppLocale
    let mode: PlayMapMode
    let tier: PlayMapTier
    let tierProgress: [PlayMapTier: PlayMapTierProgress]
    let onTierChange: (PlayMapTier) -> Void

    @Namespace private var tierNamespace

    private var isCodeRun: Bool { mode == .codeRun }

    var body: some View {
        HStack {
            Spacer(minLength: 0)
            tierSegment
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }

    private var tierSegment: some View {
        HStack(spacing: 4) {
            ForEach(PlayMapTier.allCases, id: \.rawValue) { tab in
                tierButton(for: tab)
            }
        }
        .padding(4)
        .background(Color.black.opacity(0.55))
        .overlay(
            Capsule().stroke(
                isCodeRun ? Color(hex: "e8a040").opacity(0.25) : Color(hex: "34d399").opacity(0.25),
                lineWidth: 1
            )
        )
        .clipShape(Capsule())
    }

    private func tierButton(for tab: PlayMapTier) -> some View {
        let progress = tierProgress[tab] ?? PlayMapTierProgress(cleared: 0, total: 0)
        let selected = tier == tab
        let selectedColor = isCodeRun ? Color(hex: "e8a040") : Color(hex: "34d399")
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
                        .fill(selectedColor)
                        .matchedGeometryEffect(id: "tierPill", in: tierNamespace)
                }
            }
        }
        .buttonStyle(.plain)
    }
}
