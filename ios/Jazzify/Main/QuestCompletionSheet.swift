import SwiftUI

extension View {
    /// Deployment target は iOS 16.0。`presentationBackground` は 16.4+ のため、それ未満は本体背景で代替する。
    @ViewBuilder
    func jazzifyPresentationBackground(_ color: Color) -> some View {
        if #available(iOS 16.4, *) {
            self
                .background(color)
                .presentationBackground(color)
        } else {
            self.background(color)
        }
    }
}

private enum ChapterPremiumUpsellCopy {
    static func label(locale: AppLocale) -> String {
        locale == .ja ? "チャプター 1 完了" : "CHAPTER 1 COMPLETE"
    }

    static func heading(locale: AppLocale) -> String {
        locale == .ja
            ? "ドとソで、ジャズの返事ができた！"
            : "You can answer jazz with Do and Sol!"
    }

    static func body(locale: AppLocale) -> String {
        locale == .ja
            ? "ドとソだけで聴いて返す。アドリブの最初の一歩をクリアしました。"
            : "Hear and answer with Do and Sol. You cleared the first step of improvising."
    }

    static func nextChapterLabel(locale: AppLocale) -> String {
        locale == .ja ? "次のチャプター" : "Next chapter"
    }

    static func nextChapterTitle(locale: AppLocale) -> String {
        locale == .ja ? "Cブルースのコードをつかむ" : "Get a Grip on C Blues Chords"
    }

    static func nextChapterBody(locale: AppLocale) -> String {
        locale == .ja
            ? "コードの響きと進行をつかむ。使える要素を増やしながら、自分のフレーズへ進みます。"
            : "Learn chord colors and the blues progression. Add more tools and build your own phrases."
    }

    static func continueLabel(locale: AppLocale) -> String {
        locale == .ja ? "次のチャプターへ" : "Continue to the next chapter"
    }

    static func stayLabel(locale: AppLocale) -> String {
        locale == .ja ? "あとでホームに戻る" : "Return home later"
    }
}

struct QuestCompletionSheet: View {
    let model: QuestCompletionSheetModel
    let locale: AppLocale
    let onStay: () -> Void
    let onContinue: (() -> Void)?
    let onPremium: (() -> Void)?

    private var isJapanese: Bool { locale == .ja }

    private var heading: String {
        switch model.kind {
        case .chapterCompletePremiumUpsell:
            return ChapterPremiumUpsellCopy.heading(locale: locale)
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
        case .chapterCompletePremiumUpsell:
            return ChapterPremiumUpsellCopy.body(locale: locale)
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
        if model.kind == .chapterCompletePremiumUpsell {
            return ChapterPremiumUpsellCopy.stayLabel(locale: locale)
        }
        return model.kind == .chapterCompleteOnly
            ? "OK"
            : (isJapanese ? "このまま留まる" : "Stay on this page")
    }

    var body: some View {
        VStack(spacing: 20) {
            if model.kind == .chapterCompletePremiumUpsell {
                premiumUpsellContent
            } else {
                standardContent
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .presentationDetents([.medium, .large])
        .jazzifyPresentationBackground(Color(hex: "0f172a"))
        .preferredColorScheme(.dark)
    }

    @ViewBuilder
    private var premiumUpsellContent: some View {
        Text(ChapterPremiumUpsellCopy.label(locale: locale))
            .font(.caption.weight(.semibold))
            .foregroundStyle(Color(hex: "6ee7b7"))
            .textCase(.uppercase)
            .tracking(1.5)

        Text("🎉")
            .font(.system(size: 44))

        Text(heading)
            .font(.title3.bold())
            .foregroundStyle(.white)
            .multilineTextAlignment(.center)

        Text(bodyText)
            .font(.subheadline)
            .foregroundStyle(.white.opacity(0.7))
            .multilineTextAlignment(.center)

        VStack(alignment: .leading, spacing: 8) {
            Text(ChapterPremiumUpsellCopy.nextChapterLabel(locale: locale))
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color(hex: "93c5fd"))
                .textCase(.uppercase)

            Text(ChapterPremiumUpsellCopy.nextChapterTitle(locale: locale))
                .font(.headline)
                .foregroundStyle(.white)
                .multilineTextAlignment(.leading)

            Text(ChapterPremiumUpsellCopy.nextChapterBody(locale: locale))
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.72))
                .multilineTextAlignment(.leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )

        if model.kind == .chapterCompletePremiumUpsell, let onPremium {
            Button(ChapterPremiumUpsellCopy.continueLabel(locale: locale), action: onPremium)
                .buttonStyle(.borderedProminent)
                .frame(maxWidth: .infinity)
        }

        Button(stayLabel, action: onStay)
            .buttonStyle(.plain)
            .font(.subheadline)
            .foregroundStyle(.white.opacity(0.55))
    }

    @ViewBuilder
    private var standardContent: some View {
        Text("🎉")
            .font(.system(size: 44))
        Text(heading)
            .font(.title3.bold())
            .foregroundStyle(.white)
            .multilineTextAlignment(.center)
        Text(bodyText)
            .font(.subheadline)
            .foregroundStyle(.white.opacity(0.7))
            .multilineTextAlignment(.center)
        if let next = model.nextLesson,
           model.kind != .chapterCompleteOnly {
            Text(next.localizedTitle(locale))
                .font(.subheadline.bold())
                .foregroundStyle(Color(hex: "93c5fd"))
                .multilineTextAlignment(.center)
        }
        HStack(spacing: 12) {
            Button(stayLabel, action: onStay)
                .buttonStyle(.bordered)
                .frame(maxWidth: .infinity)
            if model.kind != .chapterCompleteOnly,
               let onContinue {
                Button(isJapanese ? "次へ進む" : "Continue", action: onContinue)
                    .buttonStyle(.borderedProminent)
                    .frame(maxWidth: .infinity)
            }
        }
    }
}
