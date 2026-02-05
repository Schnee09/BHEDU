/**
 * Grade Helper Utilities
 * Provides common logic for grade conversions and formatting.
 */

/**
 * Convert percentage (0-100) to Vietnamese letter grade
 */
export function percentageToLetterGrade(percentage: number): string {
    // Vietnamese 10-point scale: 9-10 (A+), 8.5-8.9 (A), 8.0-8.4 (A-), etc.
    // Assuming input percentage is 0-100, we divide by 10.
    const score = percentage / 10;

    if (score >= 9.0) return "A+";
    if (score >= 8.5) return "A";
    if (score >= 8.0) return "A-";
    if (score >= 7.5) return "B+";
    if (score >= 7.0) return "B";
    if (score >= 6.5) return "B-";
    if (score >= 6.0) return "C+";
    if (score >= 5.5) return "C";
    if (score >= 5.0) return "C-";
    if (score >= 4.0) return "D";
    return "F";
}

/**
 * Get CSS color class for a letter grade
 */
export function getLetterGradeColor(letterGrade: string): string {
    if (!letterGrade) return "text-gray-500";

    const grade = letterGrade.toUpperCase();
    if (grade.startsWith("A")) return "text-green-600 dark:text-green-400";
    if (grade.startsWith("B")) return "text-emerald-600 dark:text-emerald-400";
    if (grade.startsWith("C")) return "text-amber-600 dark:text-amber-400";
    if (grade.startsWith("D")) return "text-orange-600 dark:text-orange-400";
    if (grade === "F") return "text-red-600 dark:text-red-400";

    return "text-gray-600 dark:text-gray-400";
}
