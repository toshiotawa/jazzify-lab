import Foundation

struct DefenseTutorialStaffDisplay: Equatable, Sendable {
    let groups: [DefenseTutorialStaffGroup]
    let activeGroupId: UUID?
    let correctPitchClassesByGroupId: [UUID: Set<Int>]
}

enum BuildDefenseTutorialStaffDisplay {
    static func build(
        baseGroups: [DefenseTutorialStaffGroup],
        judge: DefensePhraseJudgeState,
        concertPitchClasses: [Int]
    ) -> DefenseTutorialStaffDisplay {
        var correctPitchClassesByGroupId: [UUID: Set<Int>] = [:]
        var activeGroupId: UUID?

        let groups = baseGroups.enumerated().map { index, group -> DefenseTutorialStaffGroup in
            if group.isRest {
                return group
            }
            let stepIndex = index
            let isComplete = judge.correctNoteIndices.contains(stepIndex)
                || stepIndex < judge.targetStepIndex
            let isActive = stepIndex == judge.targetStepIndex
            if isActive {
                activeGroupId = group.id
            }
            if isComplete, let pitchClass = concertPitchClasses[safe: stepIndex] {
                correctPitchClassesByGroupId[group.id] = [pitchClass]
            }
            return group
        }

        return DefenseTutorialStaffDisplay(
            groups: groups,
            activeGroupId: activeGroupId,
            correctPitchClassesByGroupId: correctPitchClassesByGroupId
        )
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        guard indices.contains(index) else { return nil }
        return self[index]
    }
}
