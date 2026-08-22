/**
 * Subject Color Palette & Styling Utility
 * Maps subject names/codes to harmonious, distinctive color tokens.
 * Complies 100% with the Purple Ban (no violet/purple tokens).
 */

export interface SubjectColorStyle {
  bg: string;
  bgLight: string;
  border: string;
  borderLeft: string;
  text: string;
  badge: string;
  accent: string;
  dotColor: string;
}

const DEFAULT_STYLE: SubjectColorStyle = {
  bg: 'bg-blue-50/80 dark:bg-blue-950/30',
  bgLight: 'bg-blue-500/10',
  border: 'border-blue-200/80 dark:border-blue-800/40',
  borderLeft: 'border-l-blue-500',
  text: 'text-blue-700 dark:text-blue-300',
  badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20',
  accent: '#3b82f6',
  dotColor: 'bg-blue-500',
};

const SUBJECT_STYLES = {
  // Toán học (Blue)
  math: {
    bg: 'bg-blue-50/80 dark:bg-blue-950/30',
    bgLight: 'bg-blue-500/10',
    border: 'border-blue-200/80 dark:border-blue-800/40',
    borderLeft: 'border-l-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20',
    accent: '#3b82f6',
    dotColor: 'bg-blue-500',
  },
  // Vật lý (Emerald)
  physics: {
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    bgLight: 'bg-emerald-500/10',
    border: 'border-emerald-200/80 dark:border-emerald-800/40',
    borderLeft: 'border-l-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    accent: '#10b981',
    dotColor: 'bg-emerald-500',
  },
  // Hóa học (Amber)
  chemistry: {
    bg: 'bg-amber-50/80 dark:bg-amber-950/30',
    bgLight: 'bg-amber-500/10',
    border: 'border-amber-200/80 dark:border-amber-800/40',
    borderLeft: 'border-l-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/20',
    accent: '#f59e0b',
    dotColor: 'bg-amber-500',
  },
  // Sinh học (Teal)
  biology: {
    bg: 'bg-teal-50/80 dark:bg-teal-950/30',
    bgLight: 'bg-teal-500/10',
    border: 'border-teal-200/80 dark:border-teal-800/40',
    borderLeft: 'border-l-teal-500',
    text: 'text-teal-700 dark:text-teal-300',
    badge: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/20',
    accent: '#14b8a6',
    dotColor: 'bg-teal-500',
  },
  // Tiếng Anh / Ngoại ngữ (Cyan)
  english: {
    bg: 'bg-cyan-50/80 dark:bg-cyan-950/30',
    bgLight: 'bg-cyan-500/10',
    border: 'border-cyan-200/80 dark:border-cyan-800/40',
    borderLeft: 'border-l-cyan-500',
    text: 'text-cyan-700 dark:text-cyan-300',
    badge: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
    accent: '#06b6d4',
    dotColor: 'bg-cyan-500',
  },
  // Ngữ văn (Rose)
  literature: {
    bg: 'bg-rose-50/80 dark:bg-rose-950/30',
    bgLight: 'bg-rose-500/10',
    border: 'border-rose-200/80 dark:border-rose-800/40',
    borderLeft: 'border-l-rose-500',
    text: 'text-rose-700 dark:text-rose-300',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20',
    accent: '#f43f5e',
    dotColor: 'bg-rose-500',
  },
  // Lịch sử / Địa lý (Orange)
  history_geo: {
    bg: 'bg-orange-50/80 dark:bg-orange-950/30',
    bgLight: 'bg-orange-500/10',
    border: 'border-orange-200/80 dark:border-orange-800/40',
    borderLeft: 'border-l-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/20',
    accent: '#f97316',
    dotColor: 'bg-orange-500',
  },
  // Tin học (Slate)
  informatics: {
    bg: 'bg-slate-50/80 dark:bg-slate-900/40',
    bgLight: 'bg-slate-500/10',
    border: 'border-slate-200/80 dark:border-slate-700/40',
    borderLeft: 'border-l-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/20',
    accent: '#64748b',
    dotColor: 'bg-slate-500',
  },
  // Học kèm 1-1 / Nhóm nhỏ (Sky)
  tutoring: {
    bg: 'bg-sky-50/80 dark:bg-sky-950/30',
    bgLight: 'bg-sky-500/10',
    border: 'border-sky-200/80 dark:border-sky-800/40',
    borderLeft: 'border-l-sky-500',
    text: 'text-sky-700 dark:text-sky-300',
    badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20',
    accent: '#0ea5e9',
    dotColor: 'bg-sky-500',
  },
} satisfies Record<string, SubjectColorStyle>;

/**
 * Get color style for a subject by name or code
 */
export function getSubjectColor(subjectNameOrCode?: string | null, isTutoring?: boolean): SubjectColorStyle {
  if (isTutoring) {
    return SUBJECT_STYLES.tutoring;
  }

  if (!subjectNameOrCode) {
    return DEFAULT_STYLE;
  }

  const normalized = subjectNameOrCode
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.includes('toan') || normalized.includes('math')) {
    return SUBJECT_STYLES.math;
  }
  if (normalized.includes('ly') || normalized.includes('physic')) {
    return SUBJECT_STYLES.physics;
  }
  if (normalized.includes('hoa') || normalized.includes('chem')) {
    return SUBJECT_STYLES.chemistry;
  }
  if (normalized.includes('sinh') || normalized.includes('bio')) {
    return SUBJECT_STYLES.biology;
  }
  if (normalized.includes('anh') || normalized.includes('eng')) {
    return SUBJECT_STYLES.english;
  }
  if (normalized.includes('van') || normalized.includes('lit')) {
    return SUBJECT_STYLES.literature;
  }
  if (normalized.includes('su') || normalized.includes('dia') || normalized.includes('hist') || normalized.includes('geo')) {
    return SUBJECT_STYLES.history_geo;
  }
  if (normalized.includes('tin') || normalized.includes('info') || normalized.includes('code')) {
    return SUBJECT_STYLES.informatics;
  }
  if (normalized.includes('kem') || normalized.includes('tutor')) {
    return SUBJECT_STYLES.tutoring;
  }

  return DEFAULT_STYLE;
}
