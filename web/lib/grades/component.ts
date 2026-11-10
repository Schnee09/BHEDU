export type GradeComponent = 'oral' | 'fifteen_min' | 'one_period' | 'midterm' | 'final';

const COMPONENT_ALIASES: Record<string, GradeComponent> = {
  oral: 'oral',
  mieng: 'oral',
  fifteen_min: 'fifteen_min',
  '15': 'fifteen_min',
  '15_phut': 'fifteen_min',
  one_period: 'one_period',
  '1_tiet': 'one_period',
  '45_phut': 'one_period',
  midterm: 'midterm',
  giua_ky: 'midterm',
  final: 'final',
  cuoi_ky: 'final',
};

export function normalizeGradeComponent(value: unknown): GradeComponent | null {
  if (typeof value !== 'string') return null;

  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  return COMPONENT_ALIASES[normalized] ?? null;
}
