import { writeFileSync } from 'node:fs';
import {
  ABA_VOICINGS_BY_KEY,
  BAB_VOICINGS_BY_KEY,
  ALL_MAJOR_KEYS,
} from '../src/utils/twoHandVoicingIntermediateCourse.ts';

const fmtChord = (c) =>
  `(name: "${c.displayName.replace(/"/g, '')}", notes: ${JSON.stringify([...c.notes])})`;

const emitMethod = (fn, table) => {
  const lines = ALL_MAJOR_KEYS.map((key) => {
    const s = table[key];
    return `        case "${key}": return (${s.keyFifths}, ${fmtChord(s.ii)}, ${fmtChord(s.v)}, ${fmtChord(s.i)})`;
  });
  return [
    `    static func ${fn}(key: String) -> (keyFifths: Int, ii: (name: String, notes: [String]), v: (name: String, notes: [String]), i: (name: String, notes: [String]))? {`,
    '        switch key {',
    ...lines,
    '        default: return nil',
    '        }',
    '    }',
  ].join('\n');
};

const content = `import Foundation

/// Web \`twoHandVoicingIntermediateCourse.ts\` の A-B-A / B-A-B 表（Drop2 II-V-I）。
enum TrainingTwoHandVoicingTables {
    static let allMajorKeys: [String] = ${JSON.stringify([...ALL_MAJOR_KEYS])}

${emitMethod('abaSet', ABA_VOICINGS_BY_KEY)}

${emitMethod('babSet', BAB_VOICINGS_BY_KEY)}
}
`;

writeFileSync('ios/Jazzify/Training/Engine/TrainingTwoHandVoicingTables.swift', content);
