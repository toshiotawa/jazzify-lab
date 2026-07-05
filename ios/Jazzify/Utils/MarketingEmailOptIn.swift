import Foundation

/// メルマガ許諾チェックボックスの表示文言・同意証跡。
/// Web版 `src/utils/marketingEmailOptIn.ts` と内容を揃える。
enum MarketingEmailOptIn {
    static let labelJa = "無料PDF「Bluesy Licks 5選」と、Jazzifyの練習ヒントをメールで受け取る"
    static let labelEn = "Get the free \"5 Bluesy Licks\" PDF and Jazzify practice tips by email"

    static let descriptionJa =
        "登録後、PDFと3日間の練習メールをお送りします。※いつでも配信停止できます。チェックしなくても無料登録できます。"
    static let descriptionEn =
        "After signing up, we'll email you the PDF and a 3-day practice series. Unsubscribe anytime. You can sign up without checking this box."

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
