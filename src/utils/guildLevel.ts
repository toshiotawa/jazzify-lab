export function calcGuildLevelDetail(totalXp: number): { level: number; remainder: number; nextLevelXp: number } {
  let level = 1;
  let xp = totalXp;
  const consume = (need: number) => {
    if (xp >= need) {
      xp -= need;
      level += 1;
      return true;
    }
    return false;
  };
  for (let i = 1; i < 10; i++) {
    if (!consume(6000)) return { level, remainder: xp, nextLevelXp: 6000 };
  }
  for (let i = 10; i < 50; i++) {
    if (!consume(150000)) return { level, remainder: xp, nextLevelXp: 150000 };
  }
  const per = 300000;
  while (consume(per)) {
    // loop
  }
  return { level, remainder: xp, nextLevelXp: per };
}

