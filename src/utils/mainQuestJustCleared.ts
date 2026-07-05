/** path ルートと hash ルートの justCleared パラメータを統一解決する */
export function resolveJustClearedLessonSongId(input: {
  routeLessonId: string | undefined;
  routeJustCleared: string | null;
  hashJustCleared: string | null;
}): string | null {
  if (input.routeLessonId) {
    return input.routeJustCleared;
  }
  return input.hashJustCleared;
}
