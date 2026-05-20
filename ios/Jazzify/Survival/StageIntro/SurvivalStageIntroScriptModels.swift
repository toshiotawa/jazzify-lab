import Foundation

/// Web / Supabase の `survival_stage_intro_scripts.script` と同等。
struct SurvivalStageIntroScriptPayload: Codable, Sendable {
    let lineDurationSeconds: Double
    let lines: [SurvivalStageIntroLinePayload]
}

struct SurvivalStageIntroLinePayload: Codable, Sendable {
    let atSeconds: Double
    let text: SurvivalStageIntroLocalizedTextPayload
}

struct SurvivalStageIntroLocalizedTextPayload: Codable, Sendable {
    let ja: String
    let en: String
}

enum SurvivalStageIntroBundledPayloads {
    private static let lineDuration: Double =
        Double(SurvivalTutorialV3Constants.dialogueLineSeconds)

    private static func line(_ at: Double, ja: String, en: String) -> SurvivalStageIntroLinePayload {
        SurvivalStageIntroLinePayload(
            atSeconds: at,
            text: SurvivalStageIntroLocalizedTextPayload(ja: ja, en: en)
        )
    }

    static func payload(for category: SurvivalMapCategory) -> SurvivalStageIntroScriptPayload {
        switch category {
        case .lesson:
            return basic()
        case .basic:
            return basic()
        case .songs:
            return songs()
        case .phrases:
            return phrases()
        }
    }

    /// Basic / Songs 共通構成（進行コード系）
    private static func chordMapBody(courseLine: SurvivalStageIntroLinePayload) -> SurvivalStageIntroScriptPayload {
        SurvivalStageIntroScriptPayload(
            lineDurationSeconds: lineDuration,
            lines: [
                line(2, ja: "また会ったね、ファイだよ。", en: "Hey again — it's Fai."),
                courseLine,
                line(10, ja: "ブロックごとの最終ステージにボスがいるよ。", en: "Each block ends with a boss stage."),
                line(
                    14,
                    ja: "HINTありモードと挑戦モードが切り替えられる。クリア記録は挑戦モードのみだよ。",
                    en: "Switch between HINT practice and performance mode. Clears are saved in performance mode only."
                ),
                line(18, ja: "バーチャルスティックで移動しよう。", en: "Move with the virtual stick."),
                line(22, ja: "光っている鍵盤の色を演奏しよう。", en: "Play the highlighted key colors on the keyboard."),
                line(
                    26,
                    ja: "正解したら緑色になるよ。（正解したら次の音へ）",
                    en: "Correct notes turn green. (Then you move to the next note.)"
                ),
                line(
                    30,
                    ja: "5秒以内に正解し続けるとコンボゲージが溜まるよ。",
                    en: "Keep answering within 5 seconds to build the combo gauge."
                ),
                line(
                    34,
                    ja: "コンボゲージがMAXになるとゲージ技が発動するよ。",
                    en: "When the combo gauge maxes out, your gauge skill triggers."
                ),
                line(38, ja: "90秒間生き残ったらクリアだ。", en: "Survive for 90 seconds to clear."),
                line(42, ja: "全ステージ制覇目指して頑張ろう。", en: "Let's aim to conquer every stage!"),
            ]
        )
    }

    static func basic() -> SurvivalStageIntroScriptPayload {
        chordMapBody(
            courseLine: line(
                6,
                ja: "ここは Basic コース。コードの種類ごとに基礎を鍛える場所だよ。",
                en: "This is the Basic course — train fundamentals chord by chord."
            )
        )
    }

    static func songs() -> SurvivalStageIntroScriptPayload {
        chordMapBody(
            courseLine: line(
                6,
                ja: "ここは Songs コース。ジャズスタンダードのコード進行を演奏する場所だよ。",
                en: "This is the Songs course — play jazz standard progressions."
            )
        )
    }

    static func phrases() -> SurvivalStageIntroScriptPayload {
        SurvivalStageIntroScriptPayload(
            lineDurationSeconds: lineDuration,
            lines: [
                line(2, ja: "また会ったね、ファイだよ。", en: "Hey again — it's Fai."),
                line(
                    6,
                    ja: "ここは Phrases コース。小節ごとにコードを演奏するフレーズモードだよ。",
                    en: "This is the Phrases course — chord-by-measure phrase battles."
                ),
                line(10, ja: "ブロックごとの最終ステージにボスがいるよ。", en: "Each block ends with a boss stage."),
                line(
                    14,
                    ja: "HINTありモードと挑戦モードが切り替えられる。クリア記録は挑戦モードのみだよ。",
                    en: "Switch between HINT practice and performance mode. Clears are saved in performance mode only."
                ),
                line(18, ja: "バーチャルスティックで移動しよう。", en: "Move with the virtual stick."),
                line(22, ja: "光っている鍵盤の色を演奏しよう。", en: "Play the highlighted key colors on the keyboard."),
                line(
                    26,
                    ja: "小節が弾けると強い攻撃が発動するよ。",
                    en: "Clear a measure to unleash a strong attack."
                ),
                line(30, ja: "90秒間生き残ったらクリアだ。", en: "Survive for 90 seconds to clear."),
                line(34, ja: "全ステージ制覇目指して頑張ろう。", en: "Let's aim to conquer every stage!"),
            ]
        )
    }
}
