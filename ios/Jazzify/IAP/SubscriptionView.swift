import SwiftUI
import StoreKit

struct SubscriptionView: View {
    @EnvironmentObject var appState: AppState
    @StateObject private var store = StoreManager.shared
    @Environment(\.dismiss) private var dismiss
    @State private var introEligibleProductIDs: Set<String> = []
    @State private var introEligibilityChecked = false
    @State private var selectedPlanID: String?

    private var locale: AppLocale { appState.locale }

    private static let paywallAccent = Color(hex: "2dd4bf")

    private var selectedProduct: Product? {
        if let id = selectedPlanID {
            if id == Config.iapYearlyProductID { return store.yearlyProduct }
            if id == Config.iapProductID { return store.monthlyProduct }
        }
        return store.yearlyProduct ?? store.monthlyProduct
    }

    private var hasAnyProduct: Bool {
        store.monthlyProduct != nil || store.yearlyProduct != nil
    }

    private var loadedProducts: [Product] {
        [store.monthlyProduct, store.yearlyProduct].compactMap { $0 }
    }

    /// 選択プラン向けにトライアルUIを出すか（当該プランの intro offer × 当該プランの StoreKit 資格）
    private func showsIntroPaywallDetails(for product: Product) -> Bool {
        guard appState.canShowIAP,
              !appState.isPremium,
              product.subscription?.introductoryOffer != nil,
              introEligibleProductIDs.contains(product.id)
        else { return false }
        return true
    }

    /// 購入ブロックでトライアル説明を出すか（フッター文言の切替にも使用）
    private var showIntroPaywallDetails: Bool {
        guard let product = selectedProduct else { return false }
        return showsIntroPaywallDetails(for: product)
    }

    private var introEligibilityTaskID: String {
        "\(store.monthlyProduct?.id ?? "")|\(store.yearlyProduct?.id ?? "")"
    }

    private var isCheckingIntroEligibility: Bool {
        hasAnyProduct && selectedProduct != nil && !introEligibilityChecked
    }

    /// サブスクリプショングループ内に検証済みトランザクションが存在するか
    private func hasTransactionHistory(inGroup groupID: String, cache: inout [String: Bool]) async -> Bool {
        if let cached = cache[groupID] {
            return cached
        }
        var found = false
        for await result in Transaction.all {
            guard case .verified(let txn) = result else { continue }
            if txn.subscriptionGroupID == groupID {
                found = true
                break
            }
        }
        cache[groupID] = found
        return found
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
                        if !appState.canShowIAP {
                            lemonPathHeaderSection
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
                await store.loadProducts()
                await appState.refreshBillingIfNeeded()
            }
            .task(id: introEligibilityTaskID) {
                introEligibilityChecked = false
                introEligibleProductIDs = []
                await appState.refreshBillingIfNeeded()
                guard !loadedProducts.isEmpty else {
                    introEligibilityChecked = true
                    ensureDefaultPlanSelection()
                    return
                }
                var groupHistoryCache: [String: Bool] = [:]
                var eligibleIDs: Set<String> = []
                for product in loadedProducts {
                    guard let sub = product.subscription,
                          sub.introductoryOffer != nil
                    else { continue }
                    var eligible = await sub.isEligibleForIntroOffer
                    if !eligible {
                        // isEligibleForIntroOffer の偽陰性対策: グループ履歴ゼロなら eligible
                        eligible = !(await hasTransactionHistory(
                            inGroup: sub.subscriptionGroupID,
                            cache: &groupHistoryCache
                        ))
                    }
                    guard eligible else { continue }
                    eligibleIDs.insert(product.id)
                }
                introEligibleProductIDs = eligibleIDs
                introEligibilityChecked = true
                ensureDefaultPlanSelection()
            }
        }
    }

    // MARK: - Lemon Path Header (unchanged style)

    private var lemonPathHeaderSection: some View {
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
                featureRow(icon: "music.note.list", text: locale == .ja ? "メインクエスト全チャプター・目的別コースなどすべてのクエスト" : "All Main Quest chapters, topic courses, and quests")
                featureRow(icon: "gamecontroller.fill", text: locale == .ja ? "全サバイバルステージ" : "All Survival stages")
                featureRow(icon: "chart.bar.fill", text: locale == .ja ? "詳細な統計情報" : "Detailed statistics")
            }
        }
        .padding(.top, 12)
    }

    private func featureRow(icon: String, text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(Self.paywallAccent)
                .frame(width: 20)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.white)
            Spacer()
        }
        .padding(.horizontal, 4)
    }

    // MARK: - Already Active

    private var activeSubscriptionSection: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Text(locale == .ja ? "Jazzify Premiumをご利用中です" : "You're on Jazzify Premium")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)

                Text(locale == .ja
                     ? "すべてのクエスト・ゲームモード・学習記録が利用できます"
                     : "All quests, game modes, and learning records are available")
                    .font(.subheadline)
                    .foregroundStyle(.gray)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 8)

            activePlanCard

            VStack(alignment: .leading, spacing: 10) {
                Text(locale == .ja ? "ご利用中の特典" : "Your Premium benefits")
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)

                featureRow(icon: "music.note.list", text: locale == .ja ? "メインクエスト全チャプター・目的別コースなどすべてのクエスト" : "All Main Quest chapters, topic courses, and quests")
                featureRow(icon: "gamecontroller.fill", text: locale == .ja ? "全サバイバルステージ" : "All Survival stages")
                featureRow(icon: "chart.bar.fill", text: locale == .ja ? "詳細な統計情報" : "Detailed statistics")
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.06))
            .cornerRadius(12)

            Button {
                dismiss()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "music.note")
                    Text(locale == .ja ? "学習を続ける" : "Continue Learning")
                        .font(.headline)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.subheadline.bold())
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .padding(.horizontal, 16)
            }
            .buttonStyle(.borderedProminent)
            .tint(Self.paywallAccent)

            if let billing = appState.billingStatus, billing.provider == .apple {
                Text(locale == .ja
                     ? "解約・プラン変更は、設定 → Apple ID → サブスクリプションから行えます。"
                     : "To cancel or change your plan, go to Settings → Apple ID → Subscriptions.")
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            if activeSubscriptionProduct != nil {
                Text(locale == .ja
                     ? "表示価格は国・地域により異なる場合があります。最新はApp Storeの表示に従います。"
                     : "Pricing may vary by region. See the App Store for the current price in your country or region.")
                    .font(.caption2)
                    .foregroundStyle(.gray.opacity(0.9))
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var activeSubscriptionProduct: Product? {
        if let productID = store.currentSubscription?.productID {
            if productID == Config.iapYearlyProductID { return store.yearlyProduct }
            if productID == Config.iapProductID { return store.monthlyProduct }
        }
        return store.yearlyProduct ?? store.monthlyProduct
    }

    private var activePlanCard: some View {
        Group {
            if let product = activeSubscriptionProduct {
                VStack(alignment: .leading, spacing: 12) {
                    Text(locale == .ja ? "利用中" : "Active")
                        .font(.caption2.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.green.opacity(0.2))
                        .foregroundStyle(.green)
                        .cornerRadius(4)

                    HStack(spacing: 10) {
                        Image(systemName: "crown.fill")
                            .font(.title2)
                            .foregroundStyle(Self.paywallAccent)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(planName(for: product))
                                .font(.headline)
                                .foregroundStyle(.white)

                            HStack(alignment: .firstTextBaseline, spacing: 4) {
                                Text(product.displayPrice)
                                    .font(.system(size: 24, weight: .bold))
                                    .foregroundStyle(.white)
                                Text(pricePeriodSuffix(for: product))
                                    .font(.subheadline)
                                    .foregroundStyle(.gray)
                            }
                        }
                    }

                    if let ends = store.currentSubscription?.expirationDate {
                        Text(locale == .ja
                             ? "次回更新日 \(formatSubscriptionDate(ends))"
                             : "Next renewal: \(formatSubscriptionDate(ends))")
                            .font(.subheadline)
                            .foregroundStyle(.gray)
                    }

                    HStack(spacing: 6) {
                        Image(systemName: "arrow.triangle.2.circlepath")
                            .font(.caption)
                            .foregroundStyle(.gray)
                        Text(locale == .ja
                             ? "自動更新中・いつでもストア側で管理できます"
                             : "Auto-renewing. Manage anytime in the App Store.")
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
                        .stroke(Self.paywallAccent.opacity(0.5), lineWidth: 1.5)
                )
            } else if store.isLoadingProduct {
                VStack(spacing: 8) {
                    ProgressView()
                        .tint(Self.paywallAccent)
                    Text(locale == .ja ? "プラン情報を読み込み中…" : "Loading plan details…")
                        .font(.caption)
                        .foregroundStyle(.gray)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.white.opacity(0.06))
                .cornerRadius(12)
            } else if let failure = store.productFetchFailure {
                VStack(spacing: 10) {
                    Text(productFetchFailureMessage(failure))
                        .font(.caption)
                        .foregroundStyle(.gray)
                        .multilineTextAlignment(.leading)
                    Button {
                        Task { await store.loadProducts() }
                    } label: {
                        Text(locale == .ja ? "再試行" : "Try Again")
                            .font(.subheadline.bold())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Self.paywallAccent)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.white.opacity(0.06))
                .cornerRadius(12)
            } else {
                VStack(spacing: 8) {
                    ProgressView()
                        .tint(Self.paywallAccent)
                    Text(locale == .ja ? "プラン情報を読み込み中…" : "Loading plan details…")
                        .font(.caption)
                        .foregroundStyle(.gray)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.white.opacity(0.06))
                .cornerRadius(12)
            }
        }
    }

    private func formatSubscriptionDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        formatter.locale = locale == .ja ? Locale(identifier: "ja_JP") : Locale(identifier: "en_US_POSIX")
        return formatter.string(from: date)
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
        VStack(spacing: 20) {
            purchaseHeaderSection

            if store.subscriptionBelongsToOtherAccount {
                appleLinkedToOtherAccountSection
            }

            if hasAnyProduct, let product = selectedProduct {
                planSelectionSection

                VStack(spacing: 10) {
                    Text(purchaseSubtitle(for: product))
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.95))
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Button {
                    Task {
                        try? await store.purchase(product)
                        await appState.refreshBillingStatus()
                    }
                } label: {
                    Group {
                        switch store.purchaseState {
                        case .purchasing:
                            ProgressView()
                                .tint(.white)
                        default:
                            HStack(spacing: 8) {
                                Image(systemName: "music.note")
                                Text(purchaseButtonTitle(for: product))
                                .font(.headline)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.subheadline.bold())
                            }
                            .padding(.horizontal, 16)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                }
                .buttonStyle(.borderedProminent)
                .tint(Self.paywallAccent)
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
                    .tint(Self.paywallAccent)
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
                        Task { await store.loadProducts() }
                    } label: {
                        Text(locale == .ja ? "再試行" : "Try Again")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 48)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Self.paywallAccent)
                }
            } else {
                ProgressView()
                    .tint(Self.paywallAccent)
                Text(locale == .ja ? "読み込み中..." : "Loading...")
                    .font(.subheadline)
                    .foregroundStyle(.gray)
            }
        }
        .onAppear {
            ensureDefaultPlanSelection()
        }
    }

    private var purchaseHeaderSection: some View {
        VStack(spacing: 16) {
            VStack(spacing: 8) {
                Text(locale == .ja ? "もっと弾ける。もっと続く。" : "Play more. Keep going.")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)

                Text(locale == .ja
                     ? "Jazzify Premiumで、全クエスト・ゲームモード・学習記録を開放"
                     : "Unlock all quests, game modes, and learning records with Jazzify Premium")
                    .font(.subheadline)
                    .foregroundStyle(.gray)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 8)

            VStack(spacing: 8) {
                featureRow(icon: "music.note.list", text: locale == .ja ? "メインクエスト全チャプター・目的別コースなどすべてのクエスト" : "All Main Quest chapters, topic courses, and quests")
                featureRow(icon: "gamecontroller.fill", text: locale == .ja ? "全サバイバルステージ" : "All Survival stages")
                featureRow(icon: "chart.bar.fill", text: locale == .ja ? "詳細な統計情報" : "Detailed statistics")
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white.opacity(0.06))
            .cornerRadius(12)
        }
    }

    private var planSelectionSection: some View {
        HStack(alignment: .top, spacing: 12) {
            if let monthly = store.monthlyProduct {
                planCard(product: monthly, isYearly: false, isSelected: selectedPlanID == monthly.id)
            }
            if let yearly = store.yearlyProduct {
                planCard(
                    product: yearly,
                    isYearly: true,
                    isSelected: selectedPlanID == yearly.id,
                    monthlyProduct: store.monthlyProduct
                )
            }
        }
    }

    private func planCard(
        product: Product,
        isYearly: Bool,
        isSelected: Bool,
        monthlyProduct: Product? = nil
    ) -> some View {
        Button {
            selectedPlanID = product.id
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                if isYearly {
                    Text(locale == .ja ? "おすすめ" : "Best Value")
                        .font(.caption2.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.yellow)
                        .foregroundStyle(.black)
                        .cornerRadius(4)
                } else {
                    Spacer()
                        .frame(height: 22)
                }

                Text(planName(for: product))
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)

                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text(product.displayPrice)
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(.white)
                    Text(pricePeriodSuffix(for: product))
                        .font(.caption)
                        .foregroundStyle(.gray)
                }

                if isYearly {
                    Text(monthlyEquivalentText(yearly: product))
                        .font(.caption)
                        .foregroundStyle(Self.paywallAccent)

                    if let monthly = monthlyProduct, let savings = yearlySavingsText(monthly: monthly, yearly: product) {
                        Text(savings)
                            .font(.caption2.bold())
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Self.paywallAccent.opacity(0.2))
                            .foregroundStyle(Self.paywallAccent)
                            .cornerRadius(4)
                    }
                }

                if showsIntroPaywallDetails(for: product),
                   let offer = product.subscription?.introductoryOffer {
                    Text(introTrialBadge(offer))
                        .font(.caption2.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.green.opacity(0.2))
                        .foregroundStyle(.green)
                        .cornerRadius(4)
                } else if !isYearly {
                    Text(locale == .ja ? "いつでも解約できます" : "Cancel anytime")
                        .font(.caption)
                        .foregroundStyle(.gray)
                }

                Spacer(minLength: 0)

                HStack {
                    Spacer()
                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .font(.title3)
                        .foregroundStyle(isSelected ? Self.paywallAccent : .gray)
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, minHeight: 160, alignment: .topLeading)
            .background(Color.white.opacity(isSelected ? 0.1 : 0.06))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(
                        isSelected ? Self.paywallAccent : Color.white.opacity(0.12),
                        lineWidth: isSelected ? 2 : 1
                    )
            )
        }
        .buttonStyle(.plain)
    }

    private func ensureDefaultPlanSelection() {
        if let id = selectedPlanID {
            if id == Config.iapYearlyProductID, store.yearlyProduct != nil { return }
            if id == Config.iapProductID, store.monthlyProduct != nil { return }
        }
        selectedPlanID = store.yearlyProduct?.id ?? store.monthlyProduct?.id
    }

    private func planName(for product: Product) -> String {
        guard let period = product.subscription?.subscriptionPeriod else {
            return product.displayName
        }
        switch period.unit {
        case .month:
            return locale == .ja ? "月額プラン" : "Monthly Plan"
        case .year:
            return locale == .ja ? "年額プラン" : "Yearly Plan"
        default:
            return product.displayName
        }
    }

    private func pricePeriodSuffix(for product: Product) -> String {
        guard let unit = product.subscription?.subscriptionPeriod.unit else {
            return locale == .ja ? "/ 月" : "/ month"
        }
        switch unit {
        case .month:
            return locale == .ja ? "/ 月" : "/ month"
        case .year:
            return locale == .ja ? "/ 年" : "/ year"
        default:
            return ""
        }
    }

    private func monthlyEquivalentText(yearly: Product) -> String {
        let monthly = yearly.price / 12
        let formatted = monthly.formatted(yearly.priceFormatStyle)
        return locale == .ja ? "月あたり \(formatted)" : "\(formatted)/month"
    }

    private func yearlySavingsText(monthly: Product, yearly: Product) -> String? {
        let savings = monthly.price * 12 - yearly.price
        guard savings > 0 else { return nil }
        let formatted = savings.formatted(yearly.priceFormatStyle)
        return locale == .ja ? "年間\(formatted)お得" : "Save \(formatted)/year"
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

    private func purchaseButtonTitle(for product: Product) -> String {
        let periodUnit = product.subscription?.subscriptionPeriod.unit ?? .month
        let displayPrice = product.displayPrice

        if isCheckingIntroEligibility {
            return locale == .ja ? "プランを確認する" : "Review Plan"
        }

        if showIntroPaywallDetails, let offer = product.subscription?.introductoryOffer {
            return introTrialCTA(offer)
        }

        if locale == .ja {
            switch periodUnit {
            case .year:
                return "年額\(displayPrice)で始める"
            default:
                return "月額\(displayPrice)で始める"
            }
        }
        switch periodUnit {
        case .year:
            return "Start for \(displayPrice)/year"
        default:
            return "Start for \(displayPrice)/month"
        }
    }

    private func purchaseSubtitle(for product: Product) -> String {
        let periodUnit = product.subscription?.subscriptionPeriod.unit ?? .month
        let displayPrice = product.displayPrice

        if isCheckingIntroEligibility {
            return locale == .ja
                ? "価格と無料トライアルの有無はApp Storeの確認画面で表示されます。"
                : "Pricing and free trial availability will be shown on the App Store confirmation screen."
        }

        if showIntroPaywallDetails {
            if locale == .ja {
                switch periodUnit {
                case .year:
                    return "無料期間後は年額\(displayPrice)。いつでもApp Storeで解約できます。"
                default:
                    return "無料期間後は月額\(displayPrice)。いつでもApp Storeで解約できます。"
                }
            }
            switch periodUnit {
            case .year:
                return "After the free period, \(displayPrice)/year. Cancel anytime in the App Store."
            default:
                return "After the free period, \(displayPrice)/month. Cancel anytime in the App Store."
            }
        }

        if locale == .ja {
            switch periodUnit {
            case .year:
                return "年額\(displayPrice)。いつでもApp Storeで解約できます。"
            default:
                return "月額\(displayPrice)。いつでもApp Storeで解約できます。"
            }
        }
        switch periodUnit {
        case .year:
            return "\(displayPrice)/year. Cancel anytime in the App Store."
        default:
            return "\(displayPrice)/month. Cancel anytime in the App Store."
        }
    }

    /// プランカード用の短いトライアル表記（例: 7日間無料）
    private func introTrialBadge(_ offer: Product.SubscriptionOffer) -> String {
        let unit = offer.period.unit
        let value = offer.period.value
        if locale == .ja {
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
        switch unit {
        case .day:
            return value == 1 ? "1-day free" : "\(value)-day free"
        case .week:
            return value == 1 ? "1-week free" : "\(value)-week free"
        case .month:
            return value == 1 ? "1-month free" : "\(value)-month free"
        case .year:
            return value == 1 ? "1-year free" : "\(value)-year free"
        @unknown default:
            return "Free trial"
        }
    }

    /// トライアル対象者向けCTA（例: 7日間無料で始める）
    private func introTrialCTA(_ offer: Product.SubscriptionOffer) -> String {
        let unit = offer.period.unit
        let value = offer.period.value
        if locale == .ja {
            switch unit {
            case .day:
                return "\(value)日間無料で始める"
            case .week:
                return value == 1 ? "1週間無料で始める" : "\(value)週間無料で始める"
            case .month:
                return value == 1 ? "1か月無料で始める" : "\(value)か月無料で始める"
            case .year:
                return value == 1 ? "1年無料で始める" : "\(value)年無料で始める"
            @unknown default:
                return "無料で始める"
            }
        }
        switch unit {
        case .day:
            return value == 1 ? "Start free for 1 day" : "Start free for \(value) days"
        case .week:
            return value == 1 ? "Start free for 1 week" : "Start free for \(value) weeks"
        case .month:
            return value == 1 ? "Start free for 1 month" : "Start free for \(value) months"
        case .year:
            return value == 1 ? "Start free for 1 year" : "Start free for \(value) years"
        @unknown default:
            return "Start for free"
        }
    }
}
