/**
 * Combines class scopes from independent report filters.
 * `null` means no scope has been applied yet; an empty array means no class matches.
 */
export function intersectClassScopes(current: string[] | null, next: string[]): string[] {
  const uniqueNext = [...new Set(next)];
  if (current === null) return uniqueNext;

  const nextSet = new Set(uniqueNext);
  return current.filter((classId) => nextSet.has(classId));
}
