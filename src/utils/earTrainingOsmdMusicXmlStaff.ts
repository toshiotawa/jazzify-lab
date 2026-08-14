/** 音符（`<pitch>`）を含む `<part>` の数。2 パート（G+F）譜でも段数 2 とみなす。 */
const countPartsWithPitchNotes = (xml: string): number => {
  let count = 0;
  for (const m of xml.matchAll(/<part\b[^>]*>([\s\S]*?)<\/part>/gi)) {
    const partBody = m[1] ?? '';
    if (/<note\b[^>]*>[\s\S]*?<pitch>/i.test(partBody)) {
      count += 1;
    }
  }
  return count;
};

/** `<staves>` / note `<staff>` / 音符パート数から段数を推定（最低 1）。 */
export const detectMaxStaffLayersFromMusicXml = (xml: string): number => {
  let maxFromStaves = 0;
  for (const m of xml.matchAll(/<staves>\s*(\d+)\s*<\/staves>/gi)) {
    const n = Number.parseInt(m[1], 10);
    if (Number.isFinite(n) && n > maxFromStaves) {
      maxFromStaves = n;
    }
  }

  let maxFromNoteStaff = 0;
  for (const m of xml.matchAll(/<note\b[^>]*>[\s\S]*?<\/note>/gi)) {
    const block = m[0];
    for (const sm of block.matchAll(/<staff>\s*(\d+)\s*<\/staff>/gi)) {
      const n = Number.parseInt(sm[1], 10);
      if (Number.isFinite(n) && n > maxFromNoteStaff) {
        maxFromNoteStaff = n;
      }
    }
  }

  const partsWithNotes = countPartsWithPitchNotes(xml);

  return Math.max(1, maxFromStaves, maxFromNoteStaff, partsWithNotes);
};
