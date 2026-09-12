import SwiftUI

struct DiscordCommunitySectionView: View {
    @Environment(\.openURL) private var openURL

    let locale: AppLocale
    let userId: UUID

    @State private var membership: DiscordMembership?
    @State private var isLoading = true
    @State private var isLinking = false
    @State private var alertMessage: String?

    private var isEnglishCopy: Bool { locale == .en }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "bubble.left.and.bubble.right.fill")
                    .foregroundStyle(.indigo)
                Text(isEnglishCopy ? "Members-only Discord Server" : "有料会員専用Discordサーバー")
                    .font(.headline)
                    .foregroundStyle(.white)
            }

            Text(isEnglishCopy
                 ? "Connect with other Jazzify members, share practice logs, and join voice channels."
                 : "他の Jazzify 会員と交流したり、練習日記を共有したり、音声チャンネルに参加できます。")
                .font(.subheadline)
                .foregroundStyle(.gray)
                .fixedSize(horizontal: false, vertical: true)

            if isLoading {
                Text(isEnglishCopy ? "Loading Discord status..." : "Discord 連携状態を確認中...")
                    .font(.caption)
                    .foregroundStyle(.gray)
            } else if let membership {
                Button {
                    if let url = URL(string: "https://discord.com/channels/\(membership.guildId)") {
                        openURL(url)
                    }
                } label: {
                    Label(
                        isEnglishCopy ? "Open Discord" : "Discordを開く",
                        systemImage: "arrow.up.right.square"
                    )
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color.indigo)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .buttonStyle(.plain)
            } else {
                Button {
                    Task { await handleJoin() }
                } label: {
                    Label(
                        isLinking
                            ? (isEnglishCopy ? "Redirecting..." : "移動中...")
                            : (isEnglishCopy ? "Join Discord Server" : "Discordサーバーに参加する"),
                        systemImage: "bubble.left.and.bubble.right.fill"
                    )
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color.indigo.opacity(isLinking ? 0.6 : 1))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .buttonStyle(.plain)
                .disabled(isLinking)
            }

            Text(isEnglishCopy
                 ? "If your membership expires, you will be removed from the server automatically."
                 : "有料会員でなくなると、自動的にサーバーから退出となります。")
                .font(.caption2)
                .foregroundStyle(.gray)
        }
        .padding(16)
        .background(Color(hex: "1e293b"))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.indigo.opacity(0.35), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .task { await reloadMembership() }
        .alert(
            isEnglishCopy ? "Discord error" : "Discord エラー",
            isPresented: Binding(
                get: { alertMessage != nil },
                set: { if !$0 { alertMessage = nil } }
            )
        ) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(alertMessage ?? "")
        }
    }

    private func reloadMembership() async {
        isLoading = true
        defer { isLoading = false }
        do {
            membership = try await SupabaseService.shared.fetchMyDiscordMembership(userId: userId)
        } catch {
            alertMessage = isEnglishCopy
                ? "Failed to load Discord status: \(error.localizedDescription)"
                : "Discord 連携状態の取得に失敗しました: \(error.localizedDescription)"
        }
    }

    private func handleJoin() async {
        isLinking = true
        defer { isLinking = false }
        do {
            let authorizeUrl = try await SupabaseService.shared.startDiscordLink(locale: locale)
            await MainActor.run {
                openURL(authorizeUrl)
            }
        } catch {
            alertMessage = isEnglishCopy
                ? "Failed to start Discord link: \(error.localizedDescription)"
                : "Discord 連携の開始に失敗しました: \(error.localizedDescription)"
        }
    }
}

struct DiscordMembership: Decodable, Sendable {
    let userId: UUID
    let discordUserId: String
    let guildId: String

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case discordUserId = "discord_user_id"
        case guildId = "guild_id"
    }
}
