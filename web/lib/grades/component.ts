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

export interface ComponentAverages {
  oral: number | null;
  fifteen_min: number | null;
  one_period: number | null;
  midterm: number | null;
  final: number | null;
}

export function calculateComponentAverage(components: ComponentAverages): number | null {
  const hasLegacyComponents =
    components.oral !== null || components.fifteen_min !== null || components.one_period !== null;

  if (!hasLegacyComponents) {
    if (components.midterm !== null && components.final !== null) {
      return (components.midterm + components.final) / 2;
    }
    return components.midterm ?? components.final;
  }

  const weightedComponents: Array<[number | null, number]> = [
    [components.oral, 1],
    [components.fifteen_min, 1],
    [components.one_period, 2],
    [components.midterm, 2],
    [components.final, 3],
  ];
  let weightedTotal = 0;
  let totalWeight = 0;
  for (const [score, weight] of weightedComponents) {
    if (score !== null) {
      weightedTotal += score * weight;
      totalWeight += weight;
    }
  }
  return totalWeight > 0 ? weightedTotal / totalWeight : null;
}
