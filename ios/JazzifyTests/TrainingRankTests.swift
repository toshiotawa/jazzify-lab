import XCTest
@testable import Jazzify

final class TrainingRankTests: XCTestCase {
    func testScoreToRankMappingForChordLikeTrainings() {
        XCTAssertEqual(TrainingRank.scoreToRank(60, kind: .chord), .S)
        XCTAssertEqual(TrainingRank.scoreToRank(50, kind: .chord), .A)
        XCTAssertEqual(TrainingRank.scoreToRank(40, kind: .chord), .B)
        XCTAssertEqual(TrainingRank.scoreToRank(30, kind: .chord), .C)
        XCTAssertEqual(TrainingRank.scoreToRank(20, kind: .chord), .D)
        XCTAssertEqual(TrainingRank.scoreToRank(10, kind: .chord), .E)
        XCTAssertEqual(TrainingRank.scoreToRank(9, kind: .chord), .F)
    }

    func testScoreToRankMappingForScaleTrainings() {
        XCTAssertEqual(TrainingRank.scoreToRank(30, kind: .scale), .S)
        XCTAssertEqual(TrainingRank.scoreToRank(25, kind: .scale), .A)
        XCTAssertEqual(TrainingRank.scoreToRank(20, kind: .scale), .B)
        XCTAssertEqual(TrainingRank.scoreToRank(15, kind: .scale), .C)
        XCTAssertEqual(TrainingRank.scoreToRank(10, kind: .scale), .D)
        XCTAssertEqual(TrainingRank.scoreToRank(5, kind: .scale), .E)
        XCTAssertEqual(TrainingRank.scoreToRank(4, kind: .scale), .F)
    }

    func testMeetsRequirement() {
        XCTAssertTrue(TrainingRank.meetsRequirement(score: 30, requiredRank: .C, kind: .chord))
        XCTAssertFalse(TrainingRank.meetsRequirement(score: 29, requiredRank: .C, kind: .chord))
        XCTAssertTrue(TrainingRank.meetsRequirement(score: 15, requiredRank: .C, kind: .scale))
        XCTAssertFalse(TrainingRank.meetsRequirement(score: 14, requiredRank: .C, kind: .scale))
    }
}
