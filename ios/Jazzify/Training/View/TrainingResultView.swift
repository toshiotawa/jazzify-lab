import SwiftUI

struct TrainingResultView: View {
    let training: TrainingRow
    let score: Int
    let practiceMode: Bool
    let lessonContext: TrainingLessonContext?
    let locale: AppLocale
    let onRetry: () -> Void
    let onRanking: () -> Void
    let onExit: () -> Void

    @EnvironmentObject var appState: AppState
    @State private var savedRank: TrainingLetterRank = .F
    @State private var rankPosition: Int?
    @State private var saved = false
    @State private var shareImage: UIImage?

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(red: 0.12, green: 0.11, blue: 0.29), Color(red: 0.19, green: 0.18, blue: 0.45)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 16) {
                Text(locale == .ja ? "トレーニング結果" : "Training Result")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.indigo.opacity(0.8))
                Text(training.localizedTitle(locale))
                    .font(.title2.bold())
                Text(appState.profile?.nickname ?? "Player")
                    .foregroundStyle(.secondary)
                Text(savedRank.rawValue)
                    .font(.system(size: 88, weight: .black, design: .rounded))
                    .foregroundStyle(.yellow)
                Text("\(score)")
                    .font(.system(size: 56, weight: .bold, design: .rounded))
                if let rankPosition, !practiceMode {
                    Text(locale == .ja ? "あなたの順位 … \(rankPosition)位" : "Your rank … #\(rankPosition)")
                        .font(.subheadline)
                        .foregroundStyle(.indigo.opacity(0.9))
                }
                if !practiceMode {
                    Text(saved
                         ? (locale == .ja ? "スコアを保存しました" : "Score saved")
                         : (locale == .ja ? "保存中…" : "Saving…"))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                VStack(spacing: 10) {
                    HStack {
                        Button(locale == .ja ? "再挑戦" : "Retry", action: onRetry)
                            .buttonStyle(.borderedProminent)
                        Button(locale == .ja ? "ランキング" : "Ranking", action: onRanking)
                            .buttonStyle(.bordered)
                    }
                    Button(locale == .ja ? "画像保存" : "Save image") {
                        shareImage = renderShareImage()
                        if let shareImage {
                            let controller = UIActivityViewController(activityItems: [shareImage], applicationActivities: nil)
                            UIApplication.shared.firstKeyWindow?.rootViewController?.present(controller, animated: true)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    Button(locale == .ja ? "終了" : "Exit", action: onExit)
                        .buttonStyle(.bordered)
                }
                .padding(.top, 8)
            }
            .padding(24)
        }
        .task { await saveScoreIfNeeded() }
    }

    private func saveScoreIfNeeded() async {
        savedRank = TrainingRank.scoreToRank(score)
        guard !practiceMode, lessonContext == nil else {
            saved = true
            return
        }
        do {
            _ = try await SupabaseService.shared.upsertTrainingScore(trainingId: training.id, score: score)
            savedRank = TrainingRank.scoreToRank(score)
            saved = true
            let summary = try await SupabaseService.shared.fetchMyTrainingSummary()
            rankPosition = summary.first(where: { $0.trainingId == training.id })?.rankPosition
        } catch {
            saved = false
        }
    }

    private func renderShareImage() -> UIImage? {
        let view = VStack(spacing: 20) {
            Text("Jazzify Training").font(.title3.bold())
            Text(training.localizedTitle(locale)).font(.title.bold())
            Text(appState.profile?.nickname ?? "Player")
            Text(savedRank.rawValue).font(.system(size: 120, weight: .black, design: .rounded))
            Text("\(score)").font(.system(size: 72, weight: .bold, design: .rounded))
        }
        .padding(40)
        .frame(width: 1080, height: 1080)
        .background(
            LinearGradient(
                colors: [Color(red: 0.12, green: 0.11, blue: 0.29), Color(red: 0.19, green: 0.18, blue: 0.45)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )

        let renderer = ImageRenderer(content: view)
        renderer.scale = 2
        return renderer.uiImage
    }
}

private extension UIApplication {
    var firstKeyWindow: UIWindow? {
        connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow }
    }
}
