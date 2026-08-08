import Combine
import Foundation

/// 称号獲得状態の共有ストア。UserDefaults に永続化し TopView / 一覧画面で再利用する。
@MainActor
final class AchievementBadgeStore: ObservableObject {
    static let shared = AchievementBadgeStore()

    @Published private(set) var earnedById: [String: SupabaseService.UserBadgeRow] = [:]
    @Published private(set) var isRefreshing = false
    @Published private(set) var hasLoadedFromServer = false

    var earnedCount: Int { earnedById.count }

    private static let userDefaultsKey = "AchievementBadgeStore.earnedBadges.v1"
    private var didSyncThisSession = false

    private init() {
        earnedById = Self.loadPersisted()
    }

    func refresh(userId: UUID, forceSync: Bool, usesEnglishUi: Bool) async {
        if isRefreshing { return }
        isRefreshing = true
        defer {
            isRefreshing = false
            hasLoadedFromServer = true
        }

        let shouldSync = forceSync || !didSyncThisSession
        if shouldSync {
            didSyncThisSession = true
        }

        async let syncTask: [SupabaseService.UserBadgeRow] = {
            guard shouldSync else { return [] }
            do {
                return try await SupabaseService.shared.syncUserBadges()
            } catch {
                return []
            }
        }()

        async let fetchTask: [SupabaseService.UserBadgeRow] = {
            do {
                return try await SupabaseService.shared.fetchUserBadges(userId: userId)
            } catch {
                return []
            }
        }()

        let (synced, fetched) = await (syncTask, fetchTask)
        if !synced.isEmpty {
            PlayerLevelHub.shared.ingestAchievementBadges(synced, usesEnglishUi: usesEnglishUi)
        }
        applyBadges(merge(synced: synced, fetched: fetched))
    }

    func applyBadges(_ badges: [SupabaseService.UserBadgeRow]) {
        earnedById = Dictionary(uniqueKeysWithValues: badges.map { ($0.badgeId, $0) })
        persist()
    }

    func ingestGranted(_ badges: [SupabaseService.UserBadgeRow]) {
        guard !badges.isEmpty else { return }
        var merged = earnedById
        for badge in badges {
            merged[badge.badgeId] = badge
        }
        earnedById = merged
        persist()
    }

    func clear() {
        earnedById = [:]
        hasLoadedFromServer = false
        UserDefaults.standard.removeObject(forKey: Self.userDefaultsKey)
    }

    private func merge(
        synced: [SupabaseService.UserBadgeRow],
        fetched: [SupabaseService.UserBadgeRow]
    ) -> [SupabaseService.UserBadgeRow] {
        var byId = Dictionary(uniqueKeysWithValues: fetched.map { ($0.badgeId, $0) })
        for badge in synced {
            byId[badge.badgeId] = badge
        }
        return byId.values.sorted { $0.earnedAt < $1.earnedAt }
    }

    private func persist() {
        let badges = earnedById.values.sorted { $0.earnedAt < $1.earnedAt }
        guard let data = try? JSONEncoder().encode(badges) else { return }
        UserDefaults.standard.set(data, forKey: Self.userDefaultsKey)
    }

    private static func loadPersisted() -> [String: SupabaseService.UserBadgeRow] {
        guard let data = UserDefaults.standard.data(forKey: userDefaultsKey),
              let badges = try? JSONDecoder().decode([SupabaseService.UserBadgeRow].self, from: data) else {
            return [:]
        }
        return Dictionary(uniqueKeysWithValues: badges.map { ($0.badgeId, $0) })
    }
}
