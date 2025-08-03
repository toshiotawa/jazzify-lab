import type { RawProgressionEvent, CompiledProgressionEvent } from '@/types/progression'

export function compileProgression(
  raw: RawProgressionEvent[],
  timeSig: number
): CompiledProgressionEvent[] {
  if (raw.length === 0) return []

  // bar/beat → 絶対拍
  const abs = raw
    .map(r => ({
      chord: r.chord,
      appearAtBeat: (r.bar - 1) * timeSig + r.beat
    }))
    .sort((a, b) => a.appearAtBeat - b.appearAtBeat)

  // 受付窓計算
  const compiled: CompiledProgressionEvent[] = abs.map((e, i) => {
    const next = abs[(i + 1) % abs.length]
    const acceptFrom = e.appearAtBeat - 0.5
    const acceptUntil = next.appearAtBeat - 0.5
    return { ...e, acceptFrom, acceptUntil }
  })

  return compiled
}