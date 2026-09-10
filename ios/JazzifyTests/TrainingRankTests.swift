import XCTest
@testable import Jazzify

final class TrainingRankTests: XCTestCase {
    func testScoreToRankMapping() {
        XCTAssertEqual(TrainingRank.scoreToRank(60), .S)
        XCTAssertEqual(TrainingRank.scoreToRank(50), .A)
        XCTAssertEqual(TrainingRank.scoreToRank(40), .B)
        XCTAssertEqual(TrainingRank.scoreToRank(30), .C)
        XCTAssertEqual(TrainingRank.scoreToRank(20), .D)
        XCTAssertEqual(TrainingRank.scoreToRank(10), .E)
        XCTAssertEqual(TrainingRank.scoreToRank(9), .F)
    }

    func testMeetsRequirement() {
        XCTAssertTrue(TrainingRank.meetsRequirement(score: 30, requiredRank: .C))
        XCTAssertFalse(TrainingRank.meetsRequirement(score: 29, requiredRank: .C))
    }
}
