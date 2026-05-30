import SwiftUI

struct QuestCompletionSheet: View {
    let model: QuestCompletionSheetModel
    let locale: AppLocale
    let onStay: () -> Void
    let onContinue: (() -> Void)?

    private var isJapanese: Bool { locale == .ja }

    private var heading: String {
        switch model.kind {
        case .chapterCompleteWithNext, .chapterCompleteOnly:
            return isJapanese
                ? "チャプター \(model.chapterNumber) 完了！"
                : "Chapter \(model.chapterNumber) complete!"
        case .nextQuest, .none:
            return isJapanese ? "クエスト完了！" : "Quest complete!"
        }
    }

    private var bodyText: String {
        switch model.kind {
        case .chapterCompleteWithNext:
            return isJapanese
                ? "おめでとうございます！次のクエストに進みますか？"
                : "Congratulations! Ready for the next quest?"
        case .chapterCompleteOnly:
            return isJapanese
                ? "チャプタークリアおめでとうございます！"
                : "Congratulations on clearing this chapter!"
        case .nextQuest, .none:
            return isJapanese ? "次のクエストに進みますか？" : "Go to the next quest?"
        }
    }

    private var stayLabel: String {
        model.kind == .chapterCompleteOnly
            ? "OK"
            : (isJapanese ? "このまま留まる" : "Stay on this page")
    }

    var body: some View {
        VStack(spacing: 20) {
            Text("🎉")
                .font(.system(size: 44))
            Text(heading)
                .font(.title3.bold())
                .multilineTextAlignment(.center)
            Text(bodyText)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            if let next = model.nextLesson, model.kind != .chapterCompleteOnly {
                Text(next.localizedTitle(locale))
                    .font(.subheadline.bold())
                    .foregroundStyle(Color(hex: "93c5fd"))
                    .multilineTextAlignment(.center)
            }
            HStack(spacing: 12) {
                Button(stayLabel, action: onStay)
                    .buttonStyle(.bordered)
                    .frame(maxWidth: .infinity)
                if model.kind != .chapterCompleteOnly, let onContinue {
                    Button(isJapanese ? "次へ進む" : "Continue", action: onContinue)
                        .buttonStyle(.borderedProminent)
                        .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(24)
        .presentationDetents([.medium])
    }
}
