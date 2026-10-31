export type ImportedGradeComponent = 'midterm' | 'final';

const COMPONENT_ALIASES: Record<string, ImportedGradeComponent> = {
  'giua ky': 'midterm',
  midterm: 'midterm',
  'cuoi ky': 'final',
  final: 'final',
};

export function normalizeImportedGradeComponent(value: string): ImportedGradeComponent | null {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  return COMPONENT_ALIASES[normalized] ?? null;
}
