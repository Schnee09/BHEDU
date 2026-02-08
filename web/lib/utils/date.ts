/**
 * Date Utility Functions
 *
 * Standardized date logic to be shared across the application.
 */

/**
 * Get the start of the week for a given date.
 * Typically Monday (Vietnamese standard).
 */
export function getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - (day === 0 ? 6 : day - 1);
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * Check if a date is today.
 */
export function isToday(date: Date): boolean {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
}

/**
 * Generate dates for a whole week starting from a given date.
 */
export function getWeekDates(currentDate: Date): Date[] {
    const start = getStartOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);
        return date;
    });
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
    return date.toISOString().split("T")[0];
}

/**
 * Format date to VN string (DD/MM/YYYY)
 */
export function formatDateVN(date: Date): string {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}
