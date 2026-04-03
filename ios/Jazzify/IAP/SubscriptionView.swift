import SwiftUI
import StoreKit

struct SubscriptionView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var store = StoreManager.shared
    @Environment(\.dismiss) private var dismiss
    @State private var eligibleForIntroOffer = false

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
                        if !appState.canShowIAP {
                            lemonActiveSection
                        } else if appState.isPremium {
                            activeSubscriptionSection
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
            .task(id: store.product?.id) {
                guard let product = store.product, let sub = product.subscription else {
                    eligibleForIntroOffer = false
                    return
                }
                eligibleForIntroOffer = await sub.isEligibleForIntroOffer
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
                featureRow(icon: "gamecontroller.fill", text: locale == .ja ? "全サバイバルステージ" : "All Survival stages")
                featureRow(icon: "chart.bar.fill", text: locale == .ja ? "詳細な統計情報" : "Detailed statistics")
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
            VStack(spacing: 8) {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                    Text(locale == .ja ? "Web版で手続き済み" : "Subscribed via Web")
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                    Spacer()
                }

                Text(locale == .ja
                     ? "Web版でサブスクリプションの手続き済みのため、アプリ内購入はご利用いただけません。サブスクリプションの管理はWeb版から行ってください。"
                     : "Your subscription was purchased on the web. In-app purchase is not available. Please manage your subscription from the web version.")
                    .font(.caption)
                    .foregroundStyle(.gray)
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
            if store.subscriptionBelongsToOtherAccount {
                appleLinkedToOtherAccountSection
            }

            if let product = store.product {
                VStack(spacing: 8) {
                    Text(product.displayPrice)
                        .font(.system(size: 36, weight: .bold))
                        .foregroundStyle(.white)
                    Text(locale == .ja ? "/ 月" : "/ month")
                        .font(.subheadline)
                        .foregroundStyle(.gray)

                    if eligibleForIntroOffer, let introOffer = product.subscription?.introductoryOffer {
                        Text(locale == .ja
                             ? introTrialLabelJa(introOffer)
                             : introTrialLabelEn(introOffer))
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
                     destination: Config.termsIosURL)
                    .font(.caption2)

                Link(locale == .ja ? "プライバシーポリシー" : "Privacy Policy",
                     destination: Config.privacyIosURL)
                    .font(.caption2)
            }
        }
        .padding(.top, 8)
    }

    private var appleLinkedToOtherAccountSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "person.crop.circle.badge.exclamationmark")
                    .foregroundStyle(.orange)
                Text(locale == .ja ? "別の会員に紐づいた購読" : "Subscription linked to another account")
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
                Spacer()
            }
            Text(locale == .ja
                 ? "この Apple ID のサブスクリプションは、別の Jazzify アカウントで購入されています。購入時にログインしていたアカウントでログインするか、必要に応じて「購入を復元」をお試しください。"
                 : "This Apple ID’s subscription was purchased with a different Jazzify account. Sign in with that account, or try Restore Purchases if needed.")
                .font(.caption)
                .foregroundStyle(.gray)
        }
        .padding()
        .background(Color.orange.opacity(0.12))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange.opacity(0.35), lineWidth: 1)
        )
    }

    private func introTrialLabelJa(_ offer: Product.SubscriptionOffer) -> String {
        let unit = offer.period.unit
        let value = offer.period.value
        switch unit {
        case .day:
            return "最初の\(value)日間は無料"
        case .week:
            return "最初の\(value)週間は無料"
        case .month:
            return "最初の\(value)か月は無料"
        case .year:
            return "最初の\(value)年は無料"
        @unknown default:
            return "無料トライアルあり"
        }
    }

    private func introTrialLabelEn(_ offer: Product.SubscriptionOffer) -> String {
        let unit = offer.period.unit
        let value = offer.period.value
        switch unit {
        case .day:
            return value == 1 ? "Free for the first day" : "Free for the first \(value) days"
        case .week:
            return value == 1 ? "Free for the first week" : "Free for the first \(value) weeks"
        case .month:
            return value == 1 ? "Free for the first month" : "Free for the first \(value) months"
        case .year:
            return value == 1 ? "Free for the first year" : "Free for the first \(value) years"
        @unknown default:
            return "Includes a free trial"
        }
    }
}
