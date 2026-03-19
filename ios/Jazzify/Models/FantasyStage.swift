import Foundation

struct FantasyStage: Codable, Identifiable, Sendable {
    let id: UUID
    let stageNumber: String?
    let name: String
    let nameEn: String?
    let description: String?
    let descriptionEn: String?
    let difficulty: String?
    let requiredRank: String?
    let sortOrder: Int?

    enum CodingKeys: String, CodingKey {
        case id, name, description
        case stageNumber = "stage_number"
        case nameEn = "name_en"
        case descriptionEn = "description_en"
        case difficulty = "stage_tier"
        case requiredRank = "required_rank"
        case sortOrder = "sort_order"
    }

    func localizedName(_ locale: AppLocale) -> String {
        locale == .en ? (nameEn ?? name) : name
    }

    func localizedDescription(_ locale: AppLocale) -> String? {
        locale == .en ? (descriptionEn ?? description) : description
    }

    var rankNumber: Int? {
        guard let sn = stageNumber, let dashIndex = sn.firstIndex(of: "-") else { return nil }
        return Int(sn[sn.startIndex..<dashIndex])
    }

    var isUnlockedForFree: Bool {
        guard let rank = rankNumber, let sn = stageNumber else { return false }
        let stage = sn.split(separator: "-").last.flatMap { Int($0) } ?? 0
        return rank == 1 && stage <= 3
    }
}
