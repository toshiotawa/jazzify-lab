import SwiftUI

struct SubscriptionView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var store = StoreManager.shared
    @Environment(\.dismiss) private var dismiss

    private var locale: AppLocale { appState.locale }

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(hex: "0f172a"), .black],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        headerSection
                        if appState.isPremium {
                            activeSubscriptionSection
                        } else if !appState.canShowIAP {
                            lemonActiveSection
                        } else {
                            purchaseSection
                        }
                        legalSection
                    }
                    .padding()
                }
            }
            .navigationTitle(locale == .ja ? "サブスクリプション" : "Subscription")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(locale == .ja ? "閉じる" : "Done") {
                        dismiss()
                    }
                }
            }
            .task {
                await store.loadProduct()
            }
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(spacing: 12) {
            Image(systemName: "crown.fill")
                .font(.system(size: 48))
                .foregroundStyle(
                    LinearGradient(colors: [.purple, .pink], startPoint: .leading, endPoint: .trailing)
                )

            Text("Jazzify Premium")
                .font(.title.bold())
                .foregroundStyle(.white)

            VStack(spacing: 4) {
                featureRow(icon: "music.note.list", text: locale == .ja ? "全レッスンにアクセス" : "Access all lessons")
                featureRow(icon: "gamecontroller.fill", text: locale == .ja ? "全ファンタジーステージ" : "All Fantasy stages")
                featureRow(icon: "chart.bar.fill", text: locale == .ja ? "詳細な統計情報" : "Detailed statistics")
                featureRow(icon: "pianokeys", text: locale == .ja ? "全楽曲でプレイ" : "Play all songs")
            }
        }
        .padding(.top, 20)
    }

    private func featureRow(icon: String, text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(.purple)
                .frame(width: 20)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.white)
            Spacer()
        }
        .padding(.horizontal, 24)
    }

    // MARK: - Already Active

    private var activeSubscriptionSection: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundStyle(.green)
                Text(locale == .ja ? "現在プレミアムプランをご利用中です" : "You are currently on the Premium plan")
                    .foregroundStyle(.white)
            }
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.green.opacity(0.1))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.green.opacity(0.3), lineWidth: 1)
            )

            if let billing = appState.billingStatus, billing.provider == .apple {
                Button {
                    guard let url = URL(string: "https://apps.apple.com/account/subscriptions") else { return }
                    UIApplication.shared.open(url)
                } label: {
                    Label(
                        locale == .ja ? "Appleで管理" : "Manage in Apple Settings",
                        systemImage: "apple.logo"
                    )
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                }
                .buttonStyle(.bordered)
                .tint(.blue)
            }
        }
    }

    private var lemonActiveSection: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.orange)
                Text(locale == .ja
                     ? "Web版で課金中のため、アプリ内購入はご利用いただけません。"
                     : "In-app purchase is unavailable because you have an active subscription via the web.")
                    .font(.subheadline)
                    .foregroundStyle(.white)
            }
            .padding()
            .background(Color.orange.opacity(0.1))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.orange.opacity(0.3), lineWidth: 1)
            )
        }
    }

    // MARK: - Purchase

    private var purchaseSection: some View {
        VStack(spacing: 16) {
            if let product = store.product {
                VStack(spacing: 8) {
                    Text(product.displayPrice)
                        .font(.system(size: 36, weight: .bold))
                        .foregroundStyle(.white)
                    Text(locale == .ja ? "/ 月" : "/ month")
                        .font(.subheadline)
                        .foregroundStyle(.gray)

                    if let introOffer = product.subscription?.introductoryOffer {
                        Text(locale == .ja
                             ? "最初の\(introOffer.period.value)日間は無料"
                             : "Free for the first \(introOffer.period.value) days")
                            .font(.subheadline.bold())
                            .foregroundStyle(.green)
                    }
                }

                Button {
                    Task {
                        try? await store.purchase()
                        await appState.refreshBillingStatus()
                    }
                } label: {
                    Group {
                        switch store.purchaseState {
                        case .purchasing:
                            ProgressView()
                                .tint(.white)
                        default:
                            Text(locale == .ja ? "プレミアムに登録" : "Subscribe to Premium")
                                .font(.headline)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                }
                .buttonStyle(.borderedProminent)
                .tint(.purple)
                .disabled(store.purchaseState == .purchasing)

                Button {
                    Task {
                        await store.restorePurchases()
                        await appState.refreshBillingStatus()
                    }
                } label: {
                    Text(locale == .ja ? "購入を復元" : "Restore Purchases")
                        .font(.subheadline)
                }
                .buttonStyle(.bordered)
                .tint(.gray)

                if case .failed(let message) = store.purchaseState {
                    Text(message)
                        .font(.caption)
                        .foregroundStyle(.red)
                }

                if store.purchaseState == .pending {
                    Text(locale == .ja
                         ? "購入の承認待ちです。承認後に有効になります。"
                         : "Your purchase is pending approval. It will activate once approved.")
                        .font(.caption)
                        .foregroundStyle(.orange)
                }
            } else {
                ProgressView()
                    .tint(.purple)
                Text(locale == .ja ? "読み込み中..." : "Loading...")
                    .font(.subheadline)
                    .foregroundStyle(.gray)
            }
        }
    }

    // MARK: - Legal

    private var legalSection: some View {
        VStack(spacing: 8) {
            Text(locale == .ja
                 ? "サブスクリプションは自動的に更新されます。更新日の24時間前までにキャンセルすることで、次回の請求を停止できます。"
                 : "Subscriptions automatically renew. You can cancel at least 24 hours before the renewal date to stop the next charge.")
                .font(.caption2)
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)

            HStack(spacing: 16) {
                Link(locale == .ja ? "利用規約" : "Terms of Service",
                     destination: URL(string: "https://jazzify.jp/terms")!)
                    .font(.caption2)

                Link(locale == .ja ? "プライバシーポリシー" : "Privacy Policy",
                     destination: URL(string: "https://jazzify.jp/privacy")!)
                    .font(.caption2)
            }
        }
        .padding(.top, 8)
    }
}
