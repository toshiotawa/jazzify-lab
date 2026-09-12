import XCTest
@testable import Jazzify

final class EarTrainingBattleStageKitTests: XCTestCase {
    func testBattleFloorYDefaultsMatchEarTrainingKeyboard() {
        let height: CGFloat = 390
        let explicit = EarTrainingBattleStageKit.battleFloorY(
            sceneHeight: height,
            keyboardHeight: EarTrainingBattleStageKit.pianoVisualTopFromBottom,
            clearanceFromKeyboard: EarTrainingBattleStageKit.floorAirAboveKeyboard
        )
        let implicit = EarTrainingBattleStageKit.battleFloorY(sceneHeight: height)
        XCTAssertEqual(explicit, implicit)
    }

    func testChordPadFloorYClearsKeyboardBand() {
        let height: CGFloat = 390
        let floorY = EarTrainingBattleStageKit.battleFloorY(
            sceneHeight: height,
            keyboardHeight: EarTrainingBattleStageKit.chordPadKeyboardHeight,
            clearanceFromKeyboard: EarTrainingBattleStageKit.chordPadFloorClearance
        )
        let minimumFootY = EarTrainingBattleStageKit.chordPadKeyboardHeight
            + EarTrainingBattleStageKit.chordPadFloorClearance
        XCTAssertGreaterThanOrEqual(floorY, minimumFootY)
    }

    func testChordPadFloorYAboveEarTrainingDefaultOnPseudoLandscape() {
        let pseudoLandscapeHeight: CGFloat = 390
        let earTrainingFloorY = EarTrainingBattleStageKit.battleFloorY(sceneHeight: pseudoLandscapeHeight)
        let chordPadFloorY = EarTrainingBattleStageKit.battleFloorY(
            sceneHeight: pseudoLandscapeHeight,
            keyboardHeight: EarTrainingBattleStageKit.chordPadKeyboardHeight,
            clearanceFromKeyboard: EarTrainingBattleStageKit.chordPadFloorClearance
        )
        XCTAssertGreaterThan(chordPadFloorY, earTrainingFloorY)
    }
}
