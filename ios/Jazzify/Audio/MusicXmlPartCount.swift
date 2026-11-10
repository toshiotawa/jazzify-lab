import Foundation

enum MusicXmlPartCount {
    /// `<part>` の数。`<score-part>` は数えない。読めないときは nil。
    static func count(_ xml: String) -> Int? {
        guard !xml.isEmpty else { return nil }
        guard let regex = try? NSRegularExpression(pattern: #"<(?:[A-Za-z_][\w.-]*:)?part(?=[\s>/])"#) else {
            return nil
        }
        let range = NSRange(xml.startIndex..<xml.endIndex, in: xml)
        return regex.numberOfMatches(in: xml, range: range)
    }
}
