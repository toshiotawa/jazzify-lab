import SwiftUI

/// サバイバルタブのメインビュー。
///
/// ネイティブの難易度別グリッドから、Web 側で実装されている「魔王城降下マップ」
/// (`#survival`) を WebView で表示する構成へ変更。
/// - iPad: PC 版と同じ 2 カラムレイアウト
/// - iPhone: マップのみ表示し、ステージタップで詳細モーダル
///
/// 本ビューは `MainTabView` のタブの 1 つとして表示される。
/// ステージ選択→ゲーム→マップ復帰のフローはすべて Web 側で完結する。
struct SurvivalView: View {
    @EnvironmentObject var appState: AppState
    @State private var showSurvivalInfo = false
    @State private var showSubscription = false

    private var locale: AppLocale { appState.locale }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "0f172a").ignoresSafeArea()

                if !appState.isPremium {
                    lockedView
                } else {
                    SurvivalMapWebContainer(locale: locale)
                }
            }
            .navigationTitle(locale == .ja ? "サバイバル" : "Survival")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showSurvivalInfo = true } label: {
                        Image(systemName: "info.circle")
                            .foregroundStyle(.gray)
                    }
                }
            }
            .sheet(isPresented: $showSubscription) {
                SubscriptionView()
            }
            .sheet(isPresented: $showSurvivalInfo) {
                FeatureInfoModal(
                    icon: "flame.fill",
                    iconColor: .orange,
                    title: locale == .ja ? "サバイバル" : "Survival",
                    description: locale == .ja
                        ? "コードの構成音を制限時間内に演奏するモードです。全109ステージあり、難易度別（Easy / Normal / Hard / Extreme）に分かれ、各難易度の最後はその範囲のコードを総合する Mixed ステージです。ステージをクリアすると次が解放されます。ヒントモードを使うと構成音が表示されますが、クリア扱いにはなりません。"
                        : "Play chord tones within a time limit. There are 109 stages divided by difficulty (Easy / Normal / Hard / Extreme). Each tier ends with a Mixed stage covering all chord types and all roots for that tier. Clear a stage to unlock the next. Hint mode shows chord tones but clears won't count as official.",
                    locale: locale
                )
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
            }
        }
    }

    // MARK: - Locked

    private var lockedView: some View {
        VStack(spacing: 16) {
            if let bannerKind = appState.paymentIssueBannerKind {
                PaymentIssueBannerView(kind: bannerKind, locale: locale)
            }
            Image(systemName: "lock.fill")
                .font(.system(size: 48))
                .foregroundStyle(.gray)
            Text(locale == .ja
                 ? "サバイバルモードはプレミアムプランで利用できます"
                 : "Survival mode is available with the Premium plan")
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)

            Button {
                showSubscription = true
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "crown.fill")
                    Text(locale == .ja ? "プレミアムに登録" : "Subscribe to Premium")
                }
                .font(.headline)
                .foregroundStyle(.white)
                .padding(.horizontal, 24)
                .padding(.vertical, 14)
                .background(
                    LinearGradient(colors: [.purple, .pink], startPoint: .leading, endPoint: .trailing)
                )
                .cornerRadius(12)
            }
        }
        .padding()
    }
}

/// サバイバルタブ用の WebView コンテナ。
///
/// `GameWebView` はゲーム起動用の fullScreenCover を前提に作られているため、
/// タブ内にそのまま埋め込む場合は `statusBarHidden()` や `OrientationManager`
/// のロック動作が他タブに影響しないよう注意が必要。本ラッパーでは
/// タブ表示時のみ `GameWebView(.webPage(hash: "survival"))` を生成する。
///
/// マップ画面 → ステージ選択 → ゲーム → マップ復帰の遷移は Web 側 (React) で
/// 完結する。`SurvivalMain.handleBackToSelect` は `isIOSWebView && isIOSSurvival`
/// のときのみ `gameEnd` を発火するため、タブ経由のマップ運用では WebView が
/// 閉じられず、画面遷移は React 内に閉じる。
private struct SurvivalMapWebContainer: View {
    let locale: AppLocale

    var body: some View {
        GameWebView(
            mode: .webPage(hash: "survival"),
            locale: locale
        )
    }
}
