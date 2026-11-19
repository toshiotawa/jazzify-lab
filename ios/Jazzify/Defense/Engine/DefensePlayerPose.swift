import Foundation

enum DefensePlayerPose {
    static let idleAssetNames = (1...4).map { "pixel-hero-idle-\($0)" }
    static let slashAssetNames = (1...4).map { "pixel-hero-slash-\($0)" }
    static let guardAssetName = "pixel-hero-guard-d"
    static let skillAssetNames = [
        "pixel-hero-skill-1", "pixel-hero-skill-2", "pixel-hero-cast",
        "pixel-hero-skill-3", "pixel-hero-skill-4", "pixel-hero-slash-4"
    ]

    static let sceneAssetNames = idleAssetNames + slashAssetNames + [guardAssetName] + skillAssetNames
    static let idleFrameSec: TimeInterval = 0.28

    private static func slashAssetName(age: TimeInterval) -> String {
        let frame = Int(age / DefenseEnemyConfig.slashSec * Double(slashAssetNames.count))
        return slashAssetNames[min(slashAssetNames.count - 1, frame)]
    }

    static func idleAssetName(elapsedSec: TimeInterval) -> String {
        let frame = Int(floor(elapsedSec / idleFrameSec + 1e-9))
        return idleAssetNames[frame % idleAssetNames.count]
    }

    /// Training mode: slash > guard > idle cycle (no skill poses).
    static func trainingAssetName(
        elapsedSec: TimeInterval,
        slashUntilSec: TimeInterval,
        guardPoseUntilSec: TimeInterval
    ) -> String {
        if slashUntilSec > 0 {
            let remaining = slashUntilSec - elapsedSec
            if remaining > 0, remaining <= DefenseEnemyConfig.slashSec {
                return slashAssetName(age: DefenseEnemyConfig.slashSec - remaining)
            }
        }

        if guardPoseUntilSec > 0, elapsedSec < guardPoseUntilSec {
            return guardAssetName
        }

        return idleAssetName(elapsedSec: elapsedSec)
    }

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
                return slashAssetName(age: slashAge)
            }
        }

        if runtime.guardPoseUntilSec > 0 && runtime.elapsedSec < runtime.guardPoseUntilSec {
            return guardAssetName
        }

        return idleAssetName(elapsedSec: runtime.elapsedSec)
    }
}
