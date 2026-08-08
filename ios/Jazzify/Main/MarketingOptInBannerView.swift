import SwiftUI

/// 登録時にメルマガ許諾をオフにした既存ユーザーを回収するバナー。
/// Web の `src/components/dashboard/MarketingOptInBanner.tsx` と同じ役割・同じ更新内容。
struct MarketingOptInBannerView: View {
    @EnvironmentObject var appState: AppState

    @State private var isSaving = false
    @State private var isDismissed = UserDefaults.standard.bool(forKey: dismissKey)

    private static let dismissKey = "marketing_opt_in_banner_dismissed_v1"
    private static var dismissKey_: String { dismissKey }

    private var locale: AppLocale { appState.locale }

    private var shouldShow: Bool {
        guard let profile = appState.profile else { return false }
        return profile.marketingEmailOptIn != true && !isDismissed
    }

    var body: some View {
        if shouldShow {
            content
        }
    }

    private var content: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "envelope.fill")
                .font(.title3)
                .foregroundStyle(Color(hex: "7dd3fc"))
                .frame(width: 40, height: 40)
                .background(Color(hex: "0ea5e9").opacity(0.18))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 6) {
                Text(locale == .ja ? "無料PDF「Bluesy Licks 5選」を受け取る" : "Get the free \"5 Bluesy Licks\" PDF")
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)

                Text(MarketingEmailOptIn.description(locale: locale))
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 12) {
                    Button {
                        Task { await optIn() }
                    } label: {
                        Text(saveButtonTitle)
                            .font(.caption.bold())
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color(hex: "0284c7"))
                    .disabled(isSaving)

                    Button {
                        dismiss()
                    } label: {
                        Text(locale == .ja ? "閉じる" : "Dismiss")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                }
                .padding(.top, 2)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(hex: "1e293b"))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color(hex: "0ea5e9").opacity(0.3), lineWidth: 1)
        )
        .cornerRadius(12)
    }

    private var saveButtonTitle: String {
        if isSaving {
            return locale == .ja ? "保存中..." : "Saving..."
        }
        return locale == .ja ? "PDFを受け取る" : "Get the PDF"
    }

    private func dismiss() {
        UserDefaults.standard.set(true, forKey: Self.dismissKey)
        isDismissed = true
    }

    private func optIn() async {
        guard let profile = appState.profile, !isSaving else { return }
        isSaving = true
        defer { isSaving = false }

        do {
            try await SupabaseService.shared.enableMarketingEmailOptIn(
                userId: profile.id,
                consentText: MarketingEmailOptIn.consentText(locale: locale)
            )
        } catch {
            // 保存に失敗したらバナーを残して再試行できるようにする
            return
        }

        appState.profile?.marketingEmailOptIn = true
        Task { await SupabaseService.shared.sendMarketingWelcomeEmail() }
    }
}
