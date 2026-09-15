import Foundation

/// Web `twoHandVoicingIntermediateCourse.ts` の A-B-A / B-A-B 表（Drop2 II-V-I）。
enum TrainingTwoHandVoicingTables {
    static let allMajorKeys: [String] = ["C","F","Bb","Eb","Ab","Db","Gb","B","E","A","D","G"]

    static func abaSet(key: String) -> (keyFifths: Int, ii: (name: String, notes: [String]), v: (name: String, notes: [String]), i: (name: String, notes: [String]))? {
        switch key {
        case "C": return (0, (name: "Dm7(9)", notes: ["C4","F4","A4","E5"]), (name: "G7(9.13)", notes: ["B3","F4","A4","E5"]), (name: "CM7(9)", notes: ["B3","E4","G4","D5"]))
        case "F": return (-1, (name: "Gm7(9)", notes: ["F3","Bb3","D4","A4"]), (name: "C7(9.13)", notes: ["E3","Bb3","D4","A4"]), (name: "FM7(9)", notes: ["E3","A3","C4","G4"]))
        case "Bb": return (-2, (name: "Cm7(9)", notes: ["Bb3","Eb4","G4","D5"]), (name: "F7(9.13)", notes: ["A3","Eb4","G4","D5"]), (name: "BbM7(9)", notes: ["A3","D4","F4","C5"]))
        case "Eb": return (-3, (name: "Fm7(9)", notes: ["Eb4","Ab4","C5","G5"]), (name: "Bb7(9.13)", notes: ["D4","Ab4","C5","G5"]), (name: "EbM7(9)", notes: ["D4","G4","Bb4","F5"]))
        case "Ab": return (-4, (name: "Bbm7(9)", notes: ["Ab3","Db4","F4","C5"]), (name: "Eb7(9.13)", notes: ["G3","Db4","F4","C5"]), (name: "AbM7(9)", notes: ["G3","C4","Eb4","Bb4"]))
        case "Db": return (-5, (name: "Ebm7(9)", notes: ["Db4","Gb4","Bb4","F5"]), (name: "Ab7(9.13)", notes: ["C4","Gb4","Bb4","F5"]), (name: "DbM7(9)", notes: ["C4","F4","Ab4","Eb5"]))
        case "Gb": return (-6, (name: "Abm7(9)", notes: ["Gb3","Cb4","Eb4","Bb4"]), (name: "Db7(9.13)", notes: ["F3","Cb4","Eb4","Bb4"]), (name: "GbM7(9)", notes: ["F3","Bb3","Db4","Ab4"]))
        case "B": return (5, (name: "C#m7(9)", notes: ["B3","E4","G#4","D#5"]), (name: "F#7(9.13)", notes: ["A#3","E4","G#4","D#5"]), (name: "BM7(9)", notes: ["A#3","D#4","F#4","C#5"]))
        case "E": return (4, (name: "F#m7(9)", notes: ["E4","A4","C#5","G#5"]), (name: "B7(9.13)", notes: ["D#4","A4","C#5","G#5"]), (name: "EM7(9)", notes: ["D#4","G#4","B4","F#5"]))
        case "A": return (3, (name: "Bm7(9)", notes: ["A3","D4","F#4","C#5"]), (name: "E7(9.13)", notes: ["G#3","D4","F#4","C#5"]), (name: "AM7(9)", notes: ["G#3","C#4","E4","B4"]))
        case "D": return (2, (name: "Em7(9)", notes: ["D4","G4","B4","F#5"]), (name: "A7(9.13)", notes: ["C#4","G4","B4","F#5"]), (name: "DM7(9)", notes: ["C#4","F#4","A4","E5"]))
        case "G": return (1, (name: "Am7(9)", notes: ["G3","C4","E4","B4"]), (name: "D7(9.13)", notes: ["F#3","C4","E4","B4"]), (name: "GM7(9)", notes: ["F#3","B3","D4","A4"]))
        default: return nil
        }
    }

    static func babSet(key: String) -> (keyFifths: Int, ii: (name: String, notes: [String]), v: (name: String, notes: [String]), i: (name: String, notes: [String]))? {
        switch key {
        case "C": return (0, (name: "Dm7(9)", notes: ["F3","C4","E4","A4"]), (name: "G7(9.13)", notes: ["F3","B3","E4","A4"]), (name: "CM7(9)", notes: ["E3","B3","D4","G4"]))
        case "F": return (-1, (name: "Gm7(9)", notes: ["Bb3","F4","A4","D5"]), (name: "C7(9.13)", notes: ["Bb3","E4","A4","D5"]), (name: "FM7(9)", notes: ["A3","E4","G4","C5"]))
        case "Bb": return (-2, (name: "Cm7(9)", notes: ["Eb3","Bb3","D4","G4"]), (name: "F7(9.13)", notes: ["Eb3","A3","D4","G4"]), (name: "BbM7(9)", notes: ["D3","A3","C4","F4"]))
        case "Eb": return (-3, (name: "Fm7(9)", notes: ["Ab3","Eb4","G4","C5"]), (name: "Bb7(9.13)", notes: ["Ab3","D4","G4","C5"]), (name: "EbM7(9)", notes: ["G3","D4","F4","Bb4"]))
        case "Ab": return (-4, (name: "Bbm7(9)", notes: ["Db4","Ab4","C5","F5"]), (name: "Eb7(9.13)", notes: ["Db4","G4","C5","F5"]), (name: "AbM7(9)", notes: ["C4","G4","Bb4","Eb5"]))
        case "Db": return (-5, (name: "Ebm7(9)", notes: ["Gb3","Db4","F4","Bb4"]), (name: "Ab7(9.13)", notes: ["Gb3","C4","F4","Bb4"]), (name: "DbM7(9)", notes: ["F3","C4","Eb4","Ab4"]))
        case "Gb": return (-6, (name: "Abm7(9)", notes: ["Cb4","Gb4","Bb4","Eb5"]), (name: "Db7(9.13)", notes: ["Cb4","F4","Bb4","Eb5"]), (name: "GbM7(9)", notes: ["Bb3","F4","Ab4","Db5"]))
        case "B": return (5, (name: "C#m7(9)", notes: ["E3","B3","D#4","G#4"]), (name: "F#7(9.13)", notes: ["E3","A#3","D#4","G#4"]), (name: "BM7(9)", notes: ["D#3","A#3","C#4","F#4"]))
        case "E": return (4, (name: "F#m7(9)", notes: ["A3","E4","G#4","C#5"]), (name: "B7(9.13)", notes: ["A3","D#4","G#4","C#5"]), (name: "EM7(9)", notes: ["G#3","D#4","F#4","B4"]))
        case "A": return (3, (name: "Bm7(9)", notes: ["D3","A3","C#4","F#4"]), (name: "E7(9.13)", notes: ["D3","G#3","C#4","F#4"]), (name: "AM7(9)", notes: ["C#3","G#3","B3","E4"]))
        case "D": return (2, (name: "Em7(9)", notes: ["G3","D4","F#4","B4"]), (name: "A7(9.13)", notes: ["G3","C#4","F#4","B4"]), (name: "DM7(9)", notes: ["F#3","C#4","E4","A4"]))
        case "G": return (1, (name: "Am7(9)", notes: ["C4","G4","B4","E5"]), (name: "D7(9.13)", notes: ["C4","F#4","B4","E5"]), (name: "GM7(9)", notes: ["B3","F#4","A4","D5"]))
        default: return nil
        }
    }
}
