import Foundation

enum DefensePlayerPose {
    static let idleAssetNames = [
        "defense_player_idle_1",
        "defense_player_idle_2",
        "defense_player_idle_3",
    ]
    static let slashAssetName = "defense_player_slash"
    static let guardAssetName = "GuardD"
    static let skillAssetNames = [
        "Frame1",
        "Frame2",
        "Frame3",
        "Frame4",
        "Frame5",
        "Frame6",
    ]

    static let sceneAssetNames: [String] = idleAssetNames + [slashAssetName, guardAssetName] + skillAssetNames

    private static let idleFrameSec: TimeInterval = 0.28
    private static let idlePingPong = [0, 1, 2, 1]

    static func assetName(runtime: DefenseRuntimeState) -> String {
        if runtime.skillPoseStartSec >= 0 {
            let skillAge = runtime.elapsedSec - runtime.skillPoseStartSec
            let skillFrame = Int(floor(skillAge / DefenseEnemyConfig.skillPoseFrameSec))
            if skillFrame >= 0 && skillFrame < DefenseEnemyConfig.skillPoseFrameCount {
                return skillAssetNames[skillFrame]
            }
        }

        if runtime.slashAt != DefenseEnemyConfig.noSlash {
            let slashAge = runtime.elapsedSec - runtime.slashAt
            if slashAge >= 0 && slashAge <= DefenseEnemyConfig.slashSec {
                return slashAssetName
            }
        }

        if runtime.guardPoseUntilSec > 0 && runtime.elapsedSec < runtime.guardPoseUntilSec {
            return guardAssetName
        }

        let frame = Int(floor(runtime.elapsedSec / idleFrameSec + 1e-9))
        return idleAssetNames[idlePingPong[frame % idlePingPong.count]]
    }
}
