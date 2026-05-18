import SwiftUI

struct MidiKeyboardBuyingGuideView: View {
    let locale: AppLocale

    private var navigationTitleText: String {
        locale == .ja ? "MIDIキーボードの選び方" : "Choosing a MIDI Keyboard"
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "0f172a"), .black],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    conclusionCard
                    sizeGuideCard
                    recommendSection
                    disclaimerCard
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 18)
                .padding(.bottom, 12)
            }
        }
        .navigationTitle(navigationTitleText)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbarBackground(Color(hex: "0f172a"), for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }

    // MARK: - Conclusion

    private var japaneseConclusionParagraph49: Text {
        Text("このアプリをしっかり楽しむなら、").foregroundColor(.white)
            + Text("49鍵以上").bold().foregroundColor(Color.purple)
            + Text("のMIDIキーボードがおすすめです。").foregroundColor(.white)
    }

    private var japaneseConclusionParagraph61Line1: Text {
        Text("迷ったら ").foregroundColor(.white)
            + Text("61鍵").bold().foregroundColor(Color.purple)
    }

    private var japaneseConclusionParagraph61Line2: Text {
        Text(" を選んでください。コード練習や左手・右手を使った練習、ジャズのボイシング練習にはちょうどよい広さです。")
            .foregroundColor(.white)
    }

    private var japaneseConclusionParagraph61: Text {
        japaneseConclusionParagraph61Line1 + japaneseConclusionParagraph61Line2
    }

    private var englishIntroPartA: Text {
        Text("For Jazzify practice, aim for ").foregroundColor(.white)
            + Text("49 keys or more").bold().foregroundColor(Color.purple)
            + Text(". If unsure, ").foregroundColor(.white)
    }

    private var englishIntroPartB: Text {
        Text("pick 61").bold().foregroundColor(Color.purple)
            + Text("—balanced for chords, left-hand shells, melodies, and voicings.").foregroundColor(.white)
    }

    private var englishConclusionParagraphIntro: Text {
        englishIntroPartA + englishIntroPartB
    }

    private var englishConclusionParagraph88: Text {
        Text("Choose ").foregroundColor(.white)
            + Text("88 keys").bold().foregroundColor(Color.purple)
            + Text(" when piano-style practice or DAW/production use matters.").foregroundColor(.white)
    }

    private var englishSummaryPartA: Text {
        Text("Summary: unsure → ").foregroundColor(Color.white.opacity(0.92))
            + Text("61").bold().foregroundColor(Color.purple)
            + Text("; budget starter → ").foregroundColor(Color.white.opacity(0.92))
            + Text("at least 49").bold().foregroundColor(Color.purple)
    }

    private var englishSummaryPartB: Text {
        Text("; ").foregroundColor(Color.white.opacity(0.92))
            + Text("88").bold().foregroundColor(Color.purple)
            + Text(" for full-range workflows.").foregroundColor(Color.white.opacity(0.92))
    }

    private var englishConclusionParagraphSummary: Text {
        englishSummaryPartA + englishSummaryPartB
    }

    private var conclusionCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(locale == .ja ? "まず結論" : "The short answer")
                .font(.caption)
                .foregroundColor(.gray)

            if locale == .ja {
                conclusionCardJapaneseBody
            } else {
                conclusionCardEnglishBody
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(cardBackground)
    }

    @ViewBuilder
    private var conclusionCardJapaneseBody: some View {
        japaneseConclusionParagraph49
            .font(.subheadline)
            .fixedSize(horizontal: false, vertical: true)

        japaneseConclusionParagraph61
            .font(.subheadline)
            .fixedSize(horizontal: false, vertical: true)

        Text("25〜37鍵でも接続はできますが、鍵が少なく両手を使った練習や広い音域での練習では窮屈に感じることがあります。")
            .font(.subheadline)
            .foregroundColor(.gray)
            .fixedSize(horizontal: false, vertical: true)

        Text("88鍵は、本格的なピアノ練習やほかの音楽制作にも使いたい方向けです。")
            .font(.subheadline)
            .foregroundColor(.gray)
            .fixedSize(horizontal: false, vertical: true)

        Text("迷ったら61鍵。安く始めるなら49鍵以上。88鍵は本格派向け。")
            .font(.subheadline.weight(.semibold))
            .foregroundColor(Color.white.opacity(0.92))
            .fixedSize(horizontal: false, vertical: true)
    }

    @ViewBuilder
    private var conclusionCardEnglishBody: some View {
        englishConclusionParagraphIntro
            .font(.subheadline)
            .fixedSize(horizontal: false, vertical: true)

        Text("25–37 key boards work for quick tests but feel cramped for comfortable two-hand jazz drills.")
            .font(.subheadline)
            .foregroundColor(.gray)
            .fixedSize(horizontal: false, vertical: true)

        englishConclusionParagraph88
            .font(.subheadline)
            .fixedSize(horizontal: false, vertical: true)

        englishConclusionParagraphSummary
            .font(.subheadline.weight(.semibold))
            .fixedSize(horizontal: false, vertical: true)
    }

    private var cardBackground: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(Color(hex: "1e293b"))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.08), lineWidth: 1)
            )
    }

    // MARK: - Size guide table

    private var sizeGuideCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(locale == .ja ? "鍵の数による位置づけ" : "How many keys")
                .font(.headline)
                .foregroundColor(.white)

            if locale == .ja {
                sizeRow(keys: "25〜37鍵", role: "お試し・持ち運び用", detail: "使えるが、ジャズピアノ練習には狭い")
                Divider().overlay(Color.white.opacity(0.1))
                sizeRow(keys: "49鍵", role: "最低おすすめライン", detail: "まず楽しむならここから")
                Divider().overlay(Color.white.opacity(0.1))
                sizeRow(keys: "61鍵", role: "一番おすすめ", detail: "迷ったらこれ")
                Divider().overlay(Color.white.opacity(0.1))
                sizeRow(keys: "88鍵", role: "本格派・ピアノ兼用", detail: "他用途もあるなら選ぶ価値あり")
            } else {
                sizeRow(keys: "25–37", role: "Try / portable", detail: "OK to test, cramped for jazz piano practice")
                Divider().overlay(Color.white.opacity(0.1))
                sizeRow(keys: "49", role: "Minimum we recommend", detail: "Where fun practice starts without feeling squeezed")
                Divider().overlay(Color.white.opacity(0.1))
                sizeRow(keys: "61", role: "Best default pick", detail: "If you are unsure, choose this range")
                Divider().overlay(Color.white.opacity(0.1))
                sizeRow(keys: "88", role: "Full piano layouts", detail: "Worth it when piano practice or DAW use matters")
            }
        }
        .padding(16)
        .background(cardBackground)
    }

    private func sizeRow(keys: String, role: String, detail: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(keys)
                    .font(.subheadline.bold())
                    .foregroundColor(Color.purple)
                Spacer(minLength: 8)
                Text(role)
                    .font(.caption)
                    .foregroundColor(Color.white.opacity(0.92))
                    .multilineTextAlignment(.trailing)
            }
            Text(detail)
                .font(.caption)
                .foregroundColor(.gray)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Recommendations

    private var recommendSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(locale == .ja ? "参考になる機種例" : "Example keyboards")
                .font(.headline)
                .foregroundColor(.white)

            Text(locale == .ja
                 ? "M-Audio Keystation は、シンプルなUSB‑MIDIコントローラーとして説明しやすいシリーズの一例です。以下はこのアプリ向けに用途だけ分けた案です。"
                 : "The M‑Audio Keystation line is one straightforward family of USB MIDI controllers—these tiers match how Jazzify expects you to practice.")
                .font(.subheadline)
                .foregroundColor(.gray)
                .fixedSize(horizontal: false, vertical: true)

            recommendCard(
                imageAsset: "midi_recommend_32keys",
                title: "Keystation Mini 32",
                badge: locale == .ja ? "まず試したい／持ち運び" : "Try it / ultra portable",
                body: locale == .ja
                    ? "コンパクトで省スペース。ただしジャズピアノの両手ボイシング練習には狭めと考えてください。"
                    : "Compact footprint. Treat it as a trial board—hands will feel cramped for full jazz spreads."
            )

            recommendCard(
                imageAsset: "midi_recommend_61keys",
                title: locale == .ja ? "Keystation 61 MK3" : "Keystation 61 MK3",
                badge: locale == .ja ? "迷ったらこれ" : "Default pick",
                body: locale == .ja
                    ? "コード練習と左右の役割分担のバランスが取りやすく、このアプリには一番フィットします。"
                    : "Balanced range for chords, walking bass shells, melodies, and comping drills—our best‑fit tier."
            )

            recommendCard(
                imageAsset: "midi_recommend_88keys",
                title: locale == .ja ? "Keystation 88 MK3" : "Keystation 88 MK3",
                badge: locale == .ja ? "フルレンジ／ほか用途も使いたい人" : "Full 88‑key span",
                body: locale == .ja
                    ? "全部の鍵が使えるため、両手で広く音域を取る練習や、ピアノと同じ段数に慣れるのに向いています。制作ソフトとも兼用しやすいです。設置場所と予算に余裕がある人におすすめです。"
                    : "All 88 keys help wide voicings and getting used to the same key count as an acoustic piano. Handy shared with production software too. Needs more desk space and budget."
            )
        }
    }

    private func recommendCard(imageAsset: String, title: String, badge: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(imageAsset)
                .resizable()
                .scaledToFit()
                .frame(maxWidth: .infinity)
                .padding(10)
                .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.04)))

            Text(badge.uppercased())
                .font(.caption2.bold())
                .foregroundColor(Color.green.opacity(0.9))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    Capsule().fill(Color.green.opacity(0.15))
                )

            Text(title)
                .font(.title3.bold())
                .foregroundColor(.white)

            Text(body)
                .font(.subheadline)
                .foregroundColor(.gray)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .background(cardBackground)
    }

    // MARK: - Disclaimer

    private var disclaimerCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label(
                locale == .ja ? "必ず読んでほしいポイント" : "Important to know",
                systemImage: "exclamationmark.triangle.fill"
            )
            .font(.headline)
            .foregroundColor(Color.orange.opacity(0.95))

            if locale == .ja {
                Text("MIDIキーボードは、それ単体で音が鳴る電子ピアノではありません。iPhone / iPad / PC / Mac などに接続し、対応アプリやソフト音源から音を出します。このアプリでも、対応するMIDIキーボードを接続したうえで練習します。")
                    .font(.subheadline)
                    .foregroundColor(Color.white.opacity(0.9))
                    .fixedSize(horizontal: false, vertical: true)

                Text("製品によってはパッケージにも「ソフトウェア楽器などを演奏するためのUSB‑MIDIコントローラー」と書かれています。その意味で MIDIキーボードは音色生成装置ではなく、音源などを動かすコントローラーです。")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                Text("A MIDI keyboard is not automatically a standalone digital piano—it needs a computer, tablet, phone, or host app feeding it sounds. Jazzify listens to your controller after it is routed through Core MIDI/USB.")
                    .font(.subheadline)
                    .foregroundColor(Color.white.opacity(0.9))
                    .fixedSize(horizontal: false, vertical: true)

                Text("Many boxes describe these boards as controllers for virtual instruments. Think “remote for software instruments,” not a built‑in piano speaker.")
                    .font(.caption)
                    .foregroundColor(.gray)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(16)
        .background(cardBackground)
    }
}
