import UIKit

/// メインクエストのチャプター画像（Web `public/stage_cards_collection` と同じファイル名・構成）。
///
/// 100 枚超・合計 ~120MB の PNG を Asset Catalog (`Assets.car`) に入れると、
/// 実機で CoreUI の `invalid CSIData` が発生し `UIImage(named:)` が失敗することがある。
/// そのため bundle 内の生 PNG を `UIImage(contentsOfFile:)` で読む。
enum QuestStageCardAssetNames {
    static let bases = [
        "stage_01_cave",
        "stage_02_forest",
        "stage_03_mountain_cliff",
        "stage_04_desert_ruins",
        "stage_05_snowy_mountain",
        "stage_06_dungeon",
        "stage_07_volcano",
        "stage_08_temple_ruins",
        "stage_09_underwater",
        "stage_10_crystal_cave",
        "stage_11_sky_castle",
        "stage_12_graveyard",
        "stage_13_bamboo_forest",
        "stage_14_space_station",
        "stage_15_candy_land",
        "stage_16_autumn_forest",
        "stage_17_magic_library",
        "stage_18_pyramid",
        "stage_19_steampunk_factory",
        "stage_20_shrine",
        "stage_21_castle_interior",
        "stage_22_shipwreck",
        "stage_23_mushroom_kingdom",
        "stage_24_sandstorm",
        "stage_25_ice_palace",
        "stage_26_sakura_garden",
        "stage_27_carnival",
        "stage_28_windmill",
        "stage_29_bioluminescent_cave",
        "stage_30_forge",
        "stage_31_scroll_library",
        "stage_32_botanical_lab",
        "stage_33_moonlit_rooftop",
        "stage_34_treasure_vault",
        "stage_35_waterfall",
        "stage_36_crystal_ball",
        "stage_37_puppet_theater",
        "stage_38_fairy_tower",
        "stage_39_bathhouse",
        "stage_40_observatory",
        "stage_41_lantern_festival",
        "stage_42_stone_bridge",
        "stage_43_frozen_waterfall",
        "stage_44_map_room",
        "stage_45_rope_bridge",
        "stage_46_stone_circle",
        "stage_47_kelp_forest",
        "stage_48_firefly_meadow",
        "stage_49_armor_hall",
        "stage_50_ice_dragon_lair",
    ]

    private static let squareSubdirectory = "stage_cards_collection/square_backgrounds"
    private static let rectangularSubdirectory = "stage_cards_collection/rectangular_cards"

    static func imageName(stageNumber: Int, rectangular: Bool) -> String {
        let count = bases.count
        let index = stageNumber > 0 ? (stageNumber - 1) % count : 0
        let baseName = bases[index]
        return rectangular ? "\(baseName)_card" : "\(baseName)_bg"
    }

    static func uiImage(stageNumber: Int, rectangular: Bool) -> UIImage? {
        let name = imageName(stageNumber: stageNumber, rectangular: rectangular)
        return uiImage(named: name, rectangular: rectangular)
    }

    static func uiImage(named name: String, rectangular: Bool) -> UIImage? {
        let subdirectory = rectangular ? rectangularSubdirectory : squareSubdirectory
        guard let url = Bundle.main.url(forResource: name, withExtension: "png", subdirectory: subdirectory) else {
            return nil
        }
        return UIImage(contentsOfFile: url.path)
    }
}
