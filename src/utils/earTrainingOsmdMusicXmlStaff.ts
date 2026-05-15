/** `<staves>` と `<note>…</note>` 直下の `<staff>` から段数を推定（いずれか大きい方、最低 1）。 */
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

  return Math.max(1, maxFromStaves, maxFromNoteStaff);
};
