export interface MonsterDef {
  id: string;        // 例: "monster_01"
  name: string;      // 例: "スライム"
  name_en: string;   // 例: "Slime"
  iconFile: string;  // 例: "monster_01.png"
}

export const MONSTERS: MonsterDef[] = Array.from({ length: 63 }, (_, i) => {
  const id = `monster_${String(i + 1).padStart(2, '0')}`;
  return { 
    id, 
    name: `モンスター${i + 1}`,
    name_en: `Monster ${i + 1}`,
    iconFile: `${id}.png` 
  };
});

// ステージで使用するモンスターIDをシャッフルして取得
export function getStageMonsterIds(count: number): string[] {
  const shuffled = [...MONSTERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(m => m.id);
}