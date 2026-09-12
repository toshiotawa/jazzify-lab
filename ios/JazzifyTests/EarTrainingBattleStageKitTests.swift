import SpriteKit
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
            + EarTrainingBattleStageKit.floorAirAboveKeyboard
        XCTAssertEqual(EarTrainingBattleStageKit.chordPadFloorClearance, EarTrainingBattleStageKit.floorAirAboveKeyboard)
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

    func testInstallBattleBackdropAddsCeilingLightingLayers() {
        let layer = SKNode()
        EarTrainingBattleStageKit.installBattleBackdrop(
            into: layer,
            size: CGSize(width: 800, height: 390),
            keyboardHeight: EarTrainingBattleStageKit.chordPadKeyboardHeight,
            clearanceFromKeyboard: EarTrainingBattleStageKit.chordPadFloorClearance
        )
        // backdrop + local vignette + 2 cones + 2 pools + 2 floor shadows + final vignette
        XCTAssertGreaterThanOrEqual(layer.children.count, 8)
    }

    func testStaffOverlayPlacementPlacesStaffBelowLabelBand() {
        let sceneHeight: CGFloat = 390
        let hudHeight: CGFloat = 64
        let keyboardHeight: CGFloat = 88

        let withLabel = EarTrainingBattleStaffBandLayout.staffOverlayPlacement(
            sceneHeight: sceneHeight,
            hudHeight: hudHeight,
            hasLabelBand: true,
            keyboardHeight: keyboardHeight
        )
        let withoutLabel = EarTrainingBattleStaffBandLayout.staffOverlayPlacement(
            sceneHeight: sceneHeight,
            hudHeight: hudHeight,
            hasLabelBand: false,
            keyboardHeight: keyboardHeight
        )

        let labelStaffTop = withLabel.centerY - withLabel.height / 2
        let expectedMinTop = hudHeight + EarTrainingBattleStaffBandLayout.chordOrPromptLabelBand
        XCTAssertEqual(labelStaffTop, expectedMinTop, accuracy: 0.5)
        XCTAssertGreaterThan(withLabel.centerY, withoutLabel.centerY)
    }

    func testStaffOverlayPlacementClearsKeyboardBand() {
        let sceneHeight: CGFloat = 390
        let placement = EarTrainingBattleStaffBandLayout.staffOverlayPlacement(
            sceneHeight: sceneHeight,
            hudHeight: 64,
            hasLabelBand: true,
            keyboardHeight: 88
        )
        let staffBottom = placement.centerY + placement.height / 2
        XCTAssertLessThanOrEqual(staffBottom, sceneHeight - 88 + 0.5)
    }
}
