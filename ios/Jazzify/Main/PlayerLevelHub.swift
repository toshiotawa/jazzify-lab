import Foundation
import SwiftUI

/// Web 版のトーストに相当。`award_player_xp` の結果でトップバー用スナップショットも更新する。
@MainActor
final class PlayerLevelHub: ObservableObject {
    static let shared = PlayerLevelHub()

    struct LevelSnapshot: Equatable {
        var level: Int
        var totalXp: Int64
        var inLevelXp: Int
        var nextLevelXp: Int
    }

    struct ToastItem: Identifiable, Equatable {
        let id = UUID()
        let title: String
        let subtitle: String
    }

    @Published private(set) var snapshot: LevelSnapshot?
    @Published private(set) var toasts: [ToastItem] = []

    private var toastTimers: [UUID: Task<Void, Never>] = [:]

    private init() {}

    func applyLevelPayload(_ dto: SupabaseService.PlayerXpLevelPayload) {
        snapshot = LevelSnapshot(
            level: dto.level,
            totalXp: dto.totalXp,
            inLevelXp: dto.inLevelXp,
            nextLevelXp: dto.nextLevelXp
        )
    }

    func refreshFromServer() async {
        do {
            let dto = try await SupabaseService.shared.fetchPlayerLevelState()
            applyLevelPayload(dto)
        } catch {
            /* 非致命 */
        }
    }

    /// - Parameter usesEnglishUi: アプリ設定の表示言語（`AppLocale.en` のとき英語文言）。端末ロケールは使わない。
    func ingestAwardResponse(_ raw: SupabaseService.PlayerXpAwardPayload, usesEnglishUi: Bool) {
        applyLevelPayload(
            SupabaseService.PlayerXpLevelPayload(
                level: raw.newLevel,
                totalXp: raw.totalXp,
                inLevelXp: raw.inLevelXp,
                nextLevelXp: raw.nextLevelXp
            )
        )

        guard raw.gainedXp > 0 else { return }

        let ja = !usesEnglishUi
        let gainTitle = ja ? "経験値" : "Experience"
        let gainBody = ja ? "+\(raw.gainedXp) EXP を獲得しました" : "You earned +\(raw.gainedXp) EXP."
        enqueueToast(ToastItem(title: gainTitle, subtitle: gainBody))

        if raw.leveledUp {
            let upTitle = ja ? "レベルアップ" : "Level up!"
            let upBody = ja
                ? "レベル \(raw.newLevel) にレベルアップ！"
                : "You've reached Level \(raw.newLevel)!"
            enqueueToast(ToastItem(title: upTitle, subtitle: upBody))
        }
    }

    private func enqueueToast(_ item: ToastItem) {
        toasts.append(item)
        let id = item.id
        toastTimers[id]?.cancel()
        toastTimers[id] = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 3_800_000_000)
            await MainActor.run {
                self?.toasts.removeAll { $0.id == id }
                self?.toastTimers[id] = nil
            }
        }
    }
}

struct PlayerXpToastOverlay: View {
    @ObservedObject private var hub = PlayerLevelHub.shared

    var body: some View {
        VStack(spacing: 10) {
            ForEach(hub.toasts) { item in
                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                        .font(.caption.bold())
                        .foregroundStyle(.cyan)
                    Text(item.subtitle)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(hex: "1e293b").opacity(0.98))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.cyan.opacity(0.35), lineWidth: 1)
                )
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.35), radius: 10, y: 4)
                .padding(.horizontal, 16)
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .padding(.top, 12)
        .allowsHitTesting(false)
        .animation(.spring(response: 0.45, dampingFraction: 0.85), value: hub.toasts)
    }
}
