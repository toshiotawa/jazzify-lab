import SwiftUI
import StoreKit

struct SubscriptionView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var store = StoreManager.shared
    @Environment(\.dismiss) private var dismiss
    @State private var eligibleForIntroOffer = false

    private var locale: AppLocale { appState.locale }

    /// 購入ブロックでトライアル説明を出すか（フッター文言の切替にも使用）
    private var showIntroPaywallDetails: Bool {
        guard appState.canShowIAP,
              !appState.isPremium,
              let product = store.product,
              product.subscription?.introductoryOffer != nil
        else { return false }
        return eligibleForIntroOffer
    }

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
                    VStack(spacing: 18) {
                        if let bannerKind = appState.paymentIssueBannerKind {
                            PaymentIssueBannerView(kind: bannerKind, locale: locale)
                                .padding(.horizontal, 4)
                        }
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
            .navigationTitle(locale == .ja ? "サブスクリプション" : "Subscriptions")
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
                featureRow(icon: "flame.fill", text: locale == .ja ? "デイリーチャレンジの全難易度を解放" : "All Daily Challenge difficulty levels unlocked")
                featureRow(icon: "chart.bar.fill", text: locale == .ja ? "詳細な統計情報" : "Detailed statistics")
            }
        }
        .padding(.top, 12)
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

            activeSubscriptionProductDetails

            if let billing = appState.billingStatus, billing.provider == .apple {
                Text(locale == .ja
                     ? "サブスクリプションの確認・解約は、設定 → Apple ID → サブスクリプションから行えます。"
                     : "To view or cancel your subscription, go to Settings → Apple ID → Subscriptions.")
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    /// 審査・ユーザー向けに、購読中でも App Store 表示のプラン名・期間・価格を表示する
    private var activeSubscriptionProductDetails: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let product = store.product {
                Text(locale == .ja ? "現在のプラン" : "Current plan")
                    .font(.caption)
                    .foregroundStyle(.gray)

                Text(product.displayName)
                    .font(.headline)
                    .foregroundStyle(.white)

                if let period = product.subscription?.subscriptionPeriod {
                    Text(locale == .ja
                         ? "購読期間: \(subscriptionPeriodLabelJa(period))"
                         : "Subscription period: \(subscriptionPeriodLabelEn(period))")
                        .font(.subheadline)
                        .foregroundStyle(.gray)
                }

                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(product.displayPrice)
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.white)
                    Text(locale == .ja ? "/ 月" : "/ month")
                        .font(.subheadline)
                        .foregroundStyle(.gray)
                }

                if let ends = store.currentSubscription?.expirationDate {
                    Text(locale == .ja
                         ? "現在の期間の終了: \(formatSubscriptionDate(ends))"
                         : "Current period ends: \(formatSubscriptionDate(ends))")
                        .font(.caption)
                        .foregroundStyle(.gray)
                }

                Text(locale == .ja
                     ? "表示価格は国・地域により異なる場合があります。最新はApp Storeの表示に従います。"
                     : "Pricing may vary by region. See the App Store for the current price in your country or region.")
                    .font(.caption2)
                    .foregroundStyle(.gray.opacity(0.9))
            } else if store.isLoadingProduct {
                ProgressView()
                    .tint(.purple)
                Text(locale == .ja ? "プラン情報を読み込み中…" : "Loading plan details…")
                    .font(.caption)
                    .foregroundStyle(.gray)
            } else if let failure = store.productFetchFailure {
                VStack(spacing: 10) {
                    Text(productFetchFailureMessage(failure))
                        .font(.caption)
                        .foregroundStyle(.gray)
                        .multilineTextAlignment(.leading)
                    Button {
                        Task { await store.loadProduct() }
                    } label: {
                        Text(locale == .ja ? "再試行" : "Try Again")
                            .font(.subheadline.bold())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)
                }
            } else {
                ProgressView()
                    .tint(.purple)
                Text(locale == .ja ? "プラン情報を読み込み中…" : "Loading plan details…")
                    .font(.caption)
                    .foregroundStyle(.gray)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.06))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.12), lineWidth: 1)
        )
    }

    private func formatSubscriptionDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        formatter.locale = locale == .ja ? Locale(identifier: "ja_JP") : Locale(identifier: "en_US_POSIX")
        return formatter.string(from: date)
    }

    private func subscriptionPeriodLabelJa(_ period: Product.SubscriptionPeriod) -> String {
        let value = period.value
        switch period.unit {
        case .day:
            return value == 1 ? "1日" : "\(value)日"
        case .week:
            return value == 1 ? "1週間" : "\(value)週間"
        case .month:
            return value == 1 ? "1か月" : "\(value)か月"
        case .year:
            return value == 1 ? "1年" : "\(value)年"
        @unknown default:
            return "（期間）"
        }
    }

    private func subscriptionPeriodLabelEn(_ period: Product.SubscriptionPeriod) -> String {
        let value = period.value
        switch period.unit {
        case .day:
            return value == 1 ? "1 day" : "\(value) days"
        case .week:
            return value == 1 ? "1 week" : "\(value) weeks"
        case .month:
            return value == 1 ? "1 month" : "\(value) months"
        case .year:
            return value == 1 ? "1 year" : "\(value) years"
        @unknown default:
            return "period"
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
                let showIntroDetails = showIntroPaywallDetails

                VStack(spacing: 10) {
                    if showIntroDetails, let introOffer = product.subscription?.introductoryOffer {
                        Text(locale == .ja
                             ? introTrialHeadlineJa(introOffer)
                             : introTrialHeadlineEn(introOffer))
                            .font(.headline)
                            .foregroundStyle(.green)
                            .multilineTextAlignment(.center)

                        Text(locale == .ja
                             ? thenPriceLineJa(displayPrice: product.displayPrice)
                             : thenPriceLineEn(displayPrice: product.displayPrice))
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.95))
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    if !showIntroDetails {
                        Text(locale == .ja
                             ? nonTrialPriceNoteJa(displayPrice: product.displayPrice)
                             : nonTrialPriceNoteEn(displayPrice: product.displayPrice))
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.95))
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    VStack(spacing: 4) {
                        Text(product.displayPrice)
                            .font(.system(size: 36, weight: .bold))
                            .foregroundStyle(.white)
                        Text(locale == .ja ? "/ 月" : "/ month")
                            .font(.subheadline)
                            .foregroundStyle(.gray)
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
                            Text(
                                purchaseButtonTitle(
                                    showIntroDetails: showIntroDetails,
                                    introOffer: product.subscription?.introductoryOffer
                                )
                            )
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
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
                .buttonStyle(.plain)
                .foregroundStyle(.white)
                .background(Color.white.opacity(0.14))
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.white.opacity(0.38), lineWidth: 1)
                )

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
            } else if store.isLoadingProduct {
                ProgressView()
                    .tint(.purple)
                Text(locale == .ja ? "読み込み中..." : "Loading...")
                    .font(.subheadline)
                    .foregroundStyle(.gray)
            } else if let failure = store.productFetchFailure {
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                    Text(productFetchFailureMessage(failure))
                        .font(.subheadline)
                        .foregroundStyle(.gray)
                        .multilineTextAlignment(.center)

                    Button {
                        Task { await store.loadProduct() }
                    } label: {
                        Text(locale == .ja ? "再試行" : "Try Again")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.purple)
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

    private func productFetchFailureMessage(_ failure: ProductFetchFailure) -> String {
        switch failure {
        case .timedOut:
            return locale == .ja
                ? "読み込みがタイムアウトしました。ネットワークを確認してから再試行してください。"
                : "The request timed out. Check your network connection and try again."
        case .noProducts:
            return locale == .ja
                ? "サブスクリプション情報を読み込めませんでした。しばらくしてから再試行するか、App Store の表示をご確認ください。"
                : "Unable to load subscription options. Please try again in a moment, or verify your App Store settings."
        case .storeError(let message):
            return locale == .ja
                ? "読み込みに失敗しました: \(message)"
                : "Could not load subscription information: \(message)"
        }
    }

    // MARK: - Legal

    private var legalSection: some View {
        VStack(spacing: 8) {
            Text(legalFooterNote)
                .font(.caption2)
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)

            HStack(spacing: 16) {
                Link(locale == .ja ? "利用規約" : "Terms of Use",
                     destination: Config.termsIosURL)
                    .font(.caption2)

                Link(locale == .ja ? "プライバシーポリシー" : "Privacy Policy",
                     destination: Config.privacyIosURL)
                    .font(.caption2)
            }
        }
        .padding(.top, 8)
    }

    /// 下部は1行のみ（トライアル時は無料終了前のキャンセル、それ以外は更新前のキャンセル）
    private var legalFooterNote: String {
        if showIntroPaywallDetails {
            return locale == .ja
                ? "無料期間終了の24時間前までにキャンセルすると、次回の請求は発生しません。"
                : "Cancel at least 24 hours before the trial ends to avoid the next charge."
        }
        return locale == .ja
            ? "更新日の24時間前までにキャンセルしない限り、自動更新されます。"
            : "Auto-renews unless canceled at least 24 hours before renewal."
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

    private func purchaseButtonTitle(showIntroDetails: Bool, introOffer: Product.SubscriptionOffer?) -> String {
        guard showIntroDetails, let offer = introOffer else {
            return locale == .ja ? "プレミアムに登録" : "Subscribe to Premium"
        }
        let unit = offer.period.unit
        let value = offer.period.value
        if locale == .ja {
            switch unit {
            case .day:
                return "\(value)日間の無料トライアルを開始"
            case .week:
                return value == 1 ? "1週間の無料トライアルを開始" : "\(value)週間の無料トライアルを開始"
            case .month:
                return value == 1 ? "1か月の無料トライアルを開始" : "\(value)か月の無料トライアルを開始"
            case .year:
                return value == 1 ? "1年の無料トライアルを開始" : "\(value)年の無料トライアルを開始"
            @unknown default:
                return "無料トライアルを開始"
            }
        }
        switch unit {
        case .day:
            return "Start \(value)-day free trial"
        case .week:
            return value == 1 ? "Start 1-week free trial" : "Start \(value)-week free trial"
        case .month:
            return value == 1 ? "Start 1-month free trial" : "Start \(value)-month free trial"
        case .year:
            return value == 1 ? "Start 1-year free trial" : "Start \(value)-year free trial"
        @unknown default:
            return "Start free trial"
        }
    }

    /// 緑見出し用（例: 7日間無料）
    private func introTrialHeadlineJa(_ offer: Product.SubscriptionOffer) -> String {
        let unit = offer.period.unit
        let value = offer.period.value
        switch unit {
        case .day:
            return "\(value)日間無料"
        case .week:
            return value == 1 ? "1週間無料" : "\(value)週間無料"
        case .month:
            return value == 1 ? "1か月無料" : "\(value)か月無料"
        case .year:
            return value == 1 ? "1年無料" : "\(value)年無料"
        @unknown default:
            return "無料トライアル"
        }
    }

    private func introTrialHeadlineEn(_ offer: Product.SubscriptionOffer) -> String {
        let unit = offer.period.unit
        let value = offer.period.value
        switch unit {
        case .day:
            return value == 1 ? "1-day free trial" : "\(value)-day free trial"
        case .week:
            return value == 1 ? "1-week free trial" : "\(value)-week free trial"
        case .month:
            return value == 1 ? "1-month free trial" : "\(value)-month free trial"
        case .year:
            return value == 1 ? "1-year free trial" : "\(value)-year free trial"
        @unknown default:
            return "Free trial"
        }
    }

    /// 価格の直前の1行（トライアル時）
    private func thenPriceLineJa(displayPrice: String) -> String {
        "その後は月額\(displayPrice)。キャンセルしない限り自動更新されます"
    }

    private func thenPriceLineEn(displayPrice: String) -> String {
        "Then \(displayPrice)/month, auto-renews unless canceled"
    }

    /// 非トライアル時・価格の直前の1行
    private func nonTrialPriceNoteJa(displayPrice: String) -> String {
        "月額\(displayPrice)。キャンセルしない限り自動更新されます"
    }

    private func nonTrialPriceNoteEn(displayPrice: String) -> String {
        "\(displayPrice)/month, auto-renews unless canceled"
    }
}
