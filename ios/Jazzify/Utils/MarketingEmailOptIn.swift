import Foundation

/// メルマガ許諾チェックボックスの表示文言・同意証跡。
/// Web版 `src/utils/marketingEmailOptIn.ts` と内容を揃える。
enum MarketingEmailOptIn {
    static let labelJa = "無料PDF「Bluesy Licks 5選」と、Jazzifyからの練習ヒント・お知らせをメールで受け取る"
    static let labelEn = "Get the free \"5 Bluesy Licks\" PDF plus Jazzify practice tips and updates by email"

    static let descriptionJa =
        "登録後、特典PDFに加え、練習のヒントやサービスに関するお知らせをお送りします。※いつでも配信停止できます。チェックしなくても無料登録できます。"
    static let descriptionEn =
        "After signing up, we'll email you the PDF, practice tips, and product updates. Unsubscribe anytime. You can sign up without checking this box."

    static func label(locale: AppLocale) -> String {
        locale == .ja ? labelJa : labelEn
    }

    static func description(locale: AppLocale) -> String {
        locale == .ja ? descriptionJa : descriptionEn
    }

    /// 同意の証跡としてDB（profiles.marketing_email_opt_in_text）に保存する文言
    static func consentText(locale: AppLocale) -> String {
        locale == .ja ? "\(labelJa)。\(descriptionJa)" : "\(labelEn). \(descriptionEn)"
    }

    static let source = "ios_signup_wizard"
}
