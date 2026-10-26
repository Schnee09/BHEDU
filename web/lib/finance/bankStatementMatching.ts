export interface StudentMatchCandidate {
  id: string;
  fullName: string;
  studentCode: string | null;
}

export interface StudentMatchSuggestion extends StudentMatchCandidate {
  confidence: number;
  reason: 'student_code' | 'full_name' | 'counterparty_name';
  ambiguous: boolean;
}

export function normalizeMatchText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function containsPhrase(haystack: string, needle: string) {
  return needle.length >= 4 && ` ${haystack} `.includes(` ${needle} `);
}

export function suggestStudentMatch(
  transaction: { description?: string | null; counterpartyName?: string | null },
  students: StudentMatchCandidate[]
): StudentMatchSuggestion | null {
  const description = normalizeMatchText(transaction.description);
  const counterparty = normalizeMatchText(transaction.counterpartyName);
  const combined = `${description} ${counterparty}`.trim();

  const scored = students
    .map((student) => {
      const code = normalizeMatchText(student.studentCode).replace(/\s/g, '');
      const searchable = combined.replace(/\s/g, '');
      const name = normalizeMatchText(student.fullName);
      if (code.length >= 6 && searchable.includes(code)) {
        return { ...student, confidence: 0.99, reason: 'student_code' as const };
      }
      if (name.length >= 6 && containsPhrase(description, name)) {
        return { ...student, confidence: 0.9, reason: 'full_name' as const };
      }
      if (name.length >= 6 && containsPhrase(counterparty, name)) {
        return { ...student, confidence: 0.82, reason: 'counterparty_name' as const };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.confidence - a.confidence);

  const first = scored[0];
  if (!first) return null;
  const ambiguous = scored.some(
    (candidate, index) => index > 0 && candidate.confidence === first.confidence
  );
  return {
    ...first,
    confidence: ambiguous ? Math.min(first.confidence, 0.6) : first.confidence,
    ambiguous,
  };
}
