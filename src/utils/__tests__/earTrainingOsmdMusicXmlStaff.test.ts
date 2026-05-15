import { detectMaxStaffLayersFromMusicXml } from '@/utils/earTrainingOsmdMusicXmlStaff';

describe('detectMaxStaffLayersFromMusicXml', () => {
  it('単一譜で <staves> も note 直下 <staff> も無いときは 1', () => {
    expect(
      detectMaxStaffLayersFromMusicXml(
        `<part><measure><note><pitch><step>C</step></pitch></note></measure></part>`,
      ),
    ).toBe(1);
  });

  it('<staves>2</staves> を検出', () => {
    expect(
      detectMaxStaffLayersFromMusicXml(`<attributes><staves>2</staves></attributes>`),
    ).toBe(2);
  });

  it('<staves>1</staves> と note の <staff>2</staff> の最大を取る', () => {
    const xml =
      `<attributes><staves>1</staves></attributes>` +
      `<note><pitch><step>C</step></pitch><staff>2</staff></note>`;
    expect(detectMaxStaffLayersFromMusicXml(xml)).toBe(2);
  });

  it('複数 note で staff 番号の最大値を取る', () => {
    const xml =
      `<note><staff>1</staff></note>` +
      `<note><staff>3</staff></note>`;
    expect(detectMaxStaffLayersFromMusicXml(xml)).toBe(3);
  });
});
