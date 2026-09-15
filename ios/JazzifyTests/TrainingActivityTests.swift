import XCTest
@testable import Jazzify

final class TrainingActivityTests: XCTestCase {
    func testLocalDateKeyRespectsTimezone() {
        // 2026-09-15T20:00:00Z → Tokyo は 16日、New York は 15日
        let date = Date(timeIntervalSince1970: 1_789_502_400)
        XCTAssertEqual(TrainingActivity.localDateKey(date, timezone: "Asia/Tokyo"), "2026-09-16")
        XCTAssertEqual(TrainingActivity.localDateKey(date, timezone: "America/New_York"), "2026-09-15")
    }

    func testSundayStartWeek() {
        // 2026-09-15 は火曜日
        let week = TrainingActivity.sundayStartWeek(todayKey: "2026-09-15")
        XCTAssertEqual(week.map(\.key), [
            "2026-09-13", "2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18", "2026-09-19",
        ])
        XCTAssertEqual(week.first?.weekdayIndex, 0)
        XCTAssertEqual(week.last?.dayOfMonth, 19)
    }

    func testSundayStartWeekCrossesMonthBoundary() {
        // 2026-10-01 は木曜日 → 週は 9/27 開始
        let week = TrainingActivity.sundayStartWeek(todayKey: "2026-10-01")
        XCTAssertEqual(week.first?.key, "2026-09-27")
        XCTAssertEqual(week.last?.key, "2026-10-03")
    }

    func testCountActiveDaysAndWeeklyPercent() {
        let week = TrainingActivity.sundayStartWeek(todayKey: "2026-09-15")
        let active: Set<String> = ["2026-09-13", "2026-09-15", "2026-09-12"]
        XCTAssertEqual(TrainingActivity.countActiveDays(in: week, activeDays: active), 2)
        XCTAssertEqual(TrainingActivity.weeklyGoalPercent(activeDaysThisWeek: 2), 67)
        XCTAssertEqual(TrainingActivity.weeklyGoalPercent(activeDaysThisWeek: 5), 100)
        XCTAssertEqual(TrainingActivity.weeklyGoalPercent(activeDaysThisWeek: 0), 0)
    }

    func testStreakIncludesTodayWhenPlayed() {
        let active: Set<String> = ["2026-09-13", "2026-09-14", "2026-09-15"]
        XCTAssertEqual(TrainingActivity.computeStreak(activeDays: active, todayKey: "2026-09-15"), 3)
    }

    func testStreakStartsFromYesterdayWhenTodayNotPlayed() {
        let active: Set<String> = ["2026-09-13", "2026-09-14"]
        XCTAssertEqual(TrainingActivity.computeStreak(activeDays: active, todayKey: "2026-09-15"), 2)
        XCTAssertEqual(TrainingActivity.computeStreak(activeDays: ["2026-09-10"], todayKey: "2026-09-15"), 0)
    }

    func testBuildMonthCalendar() {
        // 2026-09-01 は火曜日 → 先頭2セル空、30日 → 5週
        let weeks = TrainingActivity.buildMonthCalendar(monthKey: "2026-09")
        XCTAssertEqual(weeks.count, 5)
        XCTAssertEqual(weeks[0][0].key, nil)
        XCTAssertEqual(weeks[0][1].key, nil)
        XCTAssertEqual(weeks[0][2].key, "2026-09-01")
        XCTAssertEqual(weeks[4][0].key, "2026-09-27")
        XCTAssertEqual(weeks[4][3].key, "2026-09-30")
        XCTAssertNil(weeks[4][4].key)
        XCTAssertTrue(weeks.allSatisfy { $0.count == 7 })
    }

    func testMonthRangeAndShift() {
        let range = TrainingActivity.monthRange(monthKey: "2026-02")
        XCTAssertEqual(range?.from, "2026-02-01")
        XCTAssertEqual(range?.to, "2026-02-28")
        XCTAssertEqual(TrainingActivity.shiftMonth("2026-12", by: 1), "2027-01")
        XCTAssertEqual(TrainingActivity.shiftMonth("2026-01", by: -1), "2025-12")
        XCTAssertEqual(TrainingActivity.monthKey(fromDateKey: "2026-09-15"), "2026-09")
    }

    func testResolveUserTimezonePrefersProfileThenCountry() {
        XCTAssertEqual(TrainingActivity.countryToTimezone("jp"), "Asia/Tokyo")
        XCTAssertNil(TrainingActivity.countryToTimezone("ZZ"))
        XCTAssertNil(TrainingActivity.countryToTimezone(nil))

        let profile = Profile(
            id: UUID(), email: "", nickname: "", avatarUrl: nil, rank: .free, xp: 0, level: 1,
            preferredLocale: nil, timezone: "Europe/London", country: "JP", signupPlatform: nil,
            isAdmin: false, marketingEmailOptIn: nil, simpleEnharmonicDisplay: nil, instrument: nil
        )
        XCTAssertEqual(TrainingActivity.resolveUserTimezone(profile: profile), "Europe/London")

        var byCountry = profile
        byCountry.timezone = "  "
        XCTAssertEqual(TrainingActivity.resolveUserTimezone(profile: byCountry), "Asia/Tokyo")
    }
}
