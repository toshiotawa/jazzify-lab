import Foundation

struct DailyChallengeRecordRow: Codable, Sendable {
    let playedOn: String
    let score: Int
    let difficulty: String

    enum CodingKeys: String, CodingKey {
        case playedOn = "played_on"
        case score, difficulty
    }
}
