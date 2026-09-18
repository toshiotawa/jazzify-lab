import Foundation

struct TrainingTimezoneOption: Identifiable, Sendable, Equatable {
    let value: String
    let labelJa: String
    let labelEn: String

    var id: String { value }

    func label(_ locale: AppLocale) -> String {
        locale == .en ? labelEn : labelJa
    }
}

struct TrainingWeekDayCell: Identifiable, Sendable, Equatable {
    let key: String
    let dayOfMonth: Int
    let weekdayIndex: Int

    var id: String { key }
}

struct TrainingCalendarDayCell: Identifiable, Sendable, Equatable {
    /// 月外の空セルは nil
    let key: String?
    let dayOfMonth: Int?
    /// 空セルにも安定 ID を与えるための週内位置
    let slot: Int

    var id: Int { slot }
}

/// Web `src/utils/trainingActivity.ts` と同じ日付キー計算（`yyyy-MM-dd` / `yyyy-MM`、日曜始まり）
enum TrainingActivity {
    static let weeklyTarget = 3
    static let fallbackTimezone = "Asia/Tokyo"

    static let timezoneOptions: [TrainingTimezoneOption] = [
        TrainingTimezoneOption(value: "Asia/Tokyo", labelJa: "日本 (Asia/Tokyo)", labelEn: "Japan (Asia/Tokyo)"),
        TrainingTimezoneOption(value: "America/New_York", labelJa: "米国東部 (America/New_York)", labelEn: "US Eastern (America/New_York)"),
        TrainingTimezoneOption(value: "America/Los_Angeles", labelJa: "米国西部 (America/Los_Angeles)", labelEn: "US Pacific (America/Los_Angeles)"),
        TrainingTimezoneOption(value: "Europe/London", labelJa: "英国 (Europe/London)", labelEn: "UK (Europe/London)"),
        TrainingTimezoneOption(value: "Europe/Berlin", labelJa: "ドイツ (Europe/Berlin)", labelEn: "Germany (Europe/Berlin)"),
        TrainingTimezoneOption(value: "Australia/Sydney", labelJa: "オーストラリア (Australia/Sydney)", labelEn: "Australia (Australia/Sydney)"),
        TrainingTimezoneOption(value: "Asia/Seoul", labelJa: "韓国 (Asia/Seoul)", labelEn: "Korea (Asia/Seoul)"),
        TrainingTimezoneOption(value: "Asia/Taipei", labelJa: "台湾 (Asia/Taipei)", labelEn: "Taiwan (Asia/Taipei)"),
    ]

    private static let countryTimezone: [String: String] = [
        "JP": "Asia/Tokyo",
        "US": "America/New_York",
        "GB": "Europe/London",
        "AU": "Australia/Sydney",
        "KR": "Asia/Seoul",
        "TW": "Asia/Taipei",
        "DE": "Europe/Berlin",
        "FR": "Europe/Paris",
    ]

    private static let utcCalendar: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC") ?? .current
        return calendar
    }()

    static func countryToTimezone(_ country: String?) -> String? {
        guard let country, !country.isEmpty else { return nil }
        return countryTimezone[country.uppercased()]
    }

    static func detectDeviceTimezone() -> String {
        TimeZone.current.identifier
    }

    static func resolveUserTimezone(profile: Profile?) -> String {
        if let tz = profile?.timezone?.trimmingCharacters(in: .whitespacesAndNewlines), !tz.isEmpty {
            return tz
        }
        return countryToTimezone(profile?.country) ?? detectDeviceTimezone()
    }

    /// `date` を `timezone` のローカル日付 `yyyy-MM-dd` に変換
    static func localDateKey(_ date: Date, timezone: String) -> String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: timezone) ?? TimeZone(identifier: fallbackTimezone) ?? .current
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        return formatDateKey(year: parts.year ?? 1970, month: parts.month ?? 1, day: parts.day ?? 1)
    }

    static func monthKey(fromDateKey dateKey: String) -> String {
        String(dateKey.prefix(7))
    }

    static func sundayStartWeek(todayKey: String) -> [TrainingWeekDayCell] {
        guard let today = parseDateKey(todayKey) else { return [] }
        let weekdayIndex = (utcCalendar.component(.weekday, from: today) - 1)
        let sunday = addDays(today, -weekdayIndex)
        var cells: [TrainingWeekDayCell] = []
        cells.reserveCapacity(7)
        for offset in 0..<7 {
            let date = addDays(sunday, offset)
            cells.append(TrainingWeekDayCell(
                key: formatDateKey(date),
                dayOfMonth: utcCalendar.component(.day, from: date),
                weekdayIndex: offset
            ))
        }
        return cells
    }

    static func countActiveDays(in week: [TrainingWeekDayCell], activeDays: Set<String>) -> Int {
        var count = 0
        for cell in week where activeDays.contains(cell.key) {
            count += 1
        }
        return count
    }

    static func isTodayStreakUpdated(activeDays: Set<String>, todayKey: String) -> Bool {
        activeDays.contains(todayKey)
    }

    /// 今日を含む（今日未プレイなら昨日までの）連続プレイ日数
    static func computeStreak(activeDays: Set<String>, todayKey: String) -> Int {
        guard var cursor = parseDateKey(todayKey) else { return 0 }
        if !activeDays.contains(todayKey) {
            cursor = addDays(cursor, -1)
        }
        var streak = 0
        while activeDays.contains(formatDateKey(cursor)) {
            streak += 1
            cursor = addDays(cursor, -1)
        }
        return streak
    }

    static func weeklyGoalPercent(activeDaysThisWeek: Int, weeklyTarget: Int = weeklyTarget) -> Int {
        guard weeklyTarget > 0 else { return 0 }
        return min(100, Int((Double(activeDaysThisWeek) / Double(weeklyTarget) * 100).rounded()))
    }

    /// 日曜始まり・7列で埋めた月カレンダー（`monthKey` は `yyyy-MM`）
    static func buildMonthCalendar(monthKey: String) -> [[TrainingCalendarDayCell]] {
        guard let (year, month) = parseMonthKey(monthKey),
              let firstDay = utcCalendar.date(from: DateComponents(year: year, month: month, day: 1)),
              let daysInMonth = utcCalendar.range(of: .day, in: .month, for: firstDay)?.count
        else { return [] }

        let startOffset = utcCalendar.component(.weekday, from: firstDay) - 1
        var weeks: [[TrainingCalendarDayCell]] = []
        var currentWeek: [TrainingCalendarDayCell] = []
        currentWeek.reserveCapacity(7)

        for slot in 0..<startOffset {
            currentWeek.append(TrainingCalendarDayCell(key: nil, dayOfMonth: nil, slot: slot))
        }
        for day in 1...daysInMonth {
            currentWeek.append(TrainingCalendarDayCell(
                key: formatDateKey(year: year, month: month, day: day),
                dayOfMonth: day,
                slot: currentWeek.count
            ))
            if currentWeek.count == 7 {
                weeks.append(currentWeek)
                currentWeek = []
            }
        }
        if !currentWeek.isEmpty {
            while currentWeek.count < 7 {
                currentWeek.append(TrainingCalendarDayCell(key: nil, dayOfMonth: nil, slot: currentWeek.count))
            }
            weeks.append(currentWeek)
        }
        return weeks
    }

    static func monthRange(monthKey: String) -> (from: String, to: String)? {
        guard let (year, month) = parseMonthKey(monthKey),
              let firstDay = utcCalendar.date(from: DateComponents(year: year, month: month, day: 1)),
              let daysInMonth = utcCalendar.range(of: .day, in: .month, for: firstDay)?.count
        else { return nil }
        return (
            from: formatDateKey(year: year, month: month, day: 1),
            to: formatDateKey(year: year, month: month, day: daysInMonth)
        )
    }

    static func shiftMonth(_ monthKey: String, by delta: Int) -> String {
        guard let (year, month) = parseMonthKey(monthKey),
              let base = utcCalendar.date(from: DateComponents(year: year, month: month, day: 1)),
              let shifted = utcCalendar.date(byAdding: .month, value: delta, to: base)
        else { return monthKey }
        let parts = utcCalendar.dateComponents([.year, .month], from: shifted)
        return String(format: "%04d-%02d", parts.year ?? year, parts.month ?? month)
    }

    static func weekdayLabels(_ locale: AppLocale) -> [String] {
        locale == .en
            ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            : ["日", "月", "火", "水", "木", "金", "土"]
    }

    static func monthLabel(_ monthKey: String, locale: AppLocale) -> String {
        guard let (year, month) = parseMonthKey(monthKey) else { return monthKey }
        if locale == .en {
            let names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            let name = (1...12).contains(month) ? names[month - 1] : String(month)
            return "\(name) \(year)"
        }
        return "\(year)年\(month)月"
    }

    /// `yyyy-MM-dd` → 表示用の `M/d`
    static func shortDayLabel(_ dateKey: String) -> String {
        let parts = dateKey.split(separator: "-")
        guard parts.count == 3, let month = Int(parts[1]), let day = Int(parts[2]) else { return dateKey }
        return "\(month)/\(day)"
    }

    // MARK: - Private

    private static func parseDateKey(_ key: String) -> Date? {
        let parts = key.split(separator: "-")
        guard parts.count == 3,
              let year = Int(parts[0]), let month = Int(parts[1]), let day = Int(parts[2])
        else { return nil }
        return utcCalendar.date(from: DateComponents(year: year, month: month, day: day))
    }

    private static func parseMonthKey(_ key: String) -> (Int, Int)? {
        let parts = key.split(separator: "-")
        guard parts.count >= 2, let year = Int(parts[0]), let month = Int(parts[1]), (1...12).contains(month) else {
            return nil
        }
        return (year, month)
    }

    private static func addDays(_ date: Date, _ days: Int) -> Date {
        utcCalendar.date(byAdding: .day, value: days, to: date) ?? date
    }

    private static func formatDateKey(_ date: Date) -> String {
        let parts = utcCalendar.dateComponents([.year, .month, .day], from: date)
        return formatDateKey(year: parts.year ?? 1970, month: parts.month ?? 1, day: parts.day ?? 1)
    }

    private static func formatDateKey(year: Int, month: Int, day: Int) -> String {
        String(format: "%04d-%02d-%02d", year, month, day)
    }
}
