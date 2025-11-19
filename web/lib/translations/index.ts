import viTranslations from './vi.json';

type TranslationKey = string;

const translations: Record<string, typeof viTranslations> = {
  vi: viTranslations,
};

// Helper function to get nested translation
function getNestedTranslation(obj: any, path: string): string {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the key if translation not found
    }
  }
  
  return typeof result === 'string' ? result : path;
}

export function useTranslation(locale: string = 'vi') {
  const t = (key: TranslationKey): string => {
    const translation = translations[locale] || translations['vi'];
    return getNestedTranslation(translation, key);
  };

  return { t, locale };
}

// Direct translation function for non-React contexts
export function translate(key: TranslationKey, locale: string = 'vi'): string {
  const translation = translations[locale] || translations['vi'];
  return getNestedTranslation(translation, key);
}

// Grade classification helper
export function getGradeClassification(grade: number, locale: string = 'vi'): string {
  if (grade >= 8) return translate('grade.excellent', locale);
  if (grade >= 6.5) return translate('grade.good', locale);
  if (grade >= 5) return translate('grade.average', locale);
  return translate('grade.weak', locale);
}

// Conduct classification helper
export function getConductLabel(conduct: string, locale: string = 'vi'): string {
  const conductMap: Record<string, string> = {
    'excellent': 'grade.conductExcellent',
    'good': 'grade.conductGood',
    'fair': 'grade.conductFair',
    'average': 'grade.conductAverage',
    'weak': 'grade.conductWeak',
  };
  
  return translate(conductMap[conduct] || conduct, locale);
}

// Grade component type labels
export function getComponentLabel(component: string, locale: string = 'vi'): string {
  const componentMap: Record<string, string> = {
    'oral': 'grade.oral',
    'fifteen_min': 'grade.fifteenMin',
    'one_period': 'grade.onePeriod',
    'midterm': 'grade.midterm',
    'final': 'grade.final',
  };
  
  return translate(componentMap[component] || component, locale);
}
