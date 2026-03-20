/**
 * Name and Email Utilities for Vietnamese Names
 */

/**
 * Normalizes Vietnamese text by removing accents and handling special characters
 */
export function normalizeVietnamese(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Generates an email slug based on the pattern [first_name][initials]
 * Example: "Nguyễn Cao Quốc Bảo" -> "baoncq"
 */
export function generateUserEmailSlug(fullName: string): string {
  const normalized = normalizeVietnamese(fullName);
  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'user';
  if (parts.length === 1) return parts[0] ?? 'user';

  const firstName = parts[parts.length - 1] ?? 'user'; // Vietnamese "Tên" is the last word
  const initials = parts
    .slice(0, parts.length - 1) // Everything except the first name
    .map((p) => p[0] ?? '') // Take the first letter of each part
    .join('');

  return `${firstName}${initials}`;
}

/**
 * Splits a full name into first_name and last_name for database storage.
 * Note: In Vietnamese database schema, we often store:
 * first_name = The given name (e.g., "Bảo")
 * last_name = The surname + middle names (e.g., "Nguyễn Cao Quốc")
 */
export function splitFullName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0] ?? '', last_name: '' };
  }

  const firstName = parts[parts.length - 1] ?? '';
  const lastName = parts.slice(0, parts.length - 1).join(' ');

  return { first_name: firstName, last_name: lastName };
}
/**
 * Formats a name in Vietnamese order: Surname + Middle + Given Name
 */
export function formatVietnameseName(firstName?: string | null, lastName?: string | null): string {
  if (!firstName && !lastName) return '';
  if (!lastName) return firstName || '';
  if (!firstName) return lastName || '';
  return `${lastName} ${firstName}`.trim();
}

/**
 * Robust name resolver that tries full_name first, then first+last, then fallback
 */
export function getDisplayName(
  profile?: {
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null
): string {
  if (!profile) return 'Chưa có';

  // Prioritize structured fields to ensure standard Vietnamese order
  const formatted = formatVietnameseName(profile.first_name, profile.last_name);
  if (formatted) return formatted;

  if (profile.full_name && profile.full_name.trim()) {
    return profile.full_name.trim();
  }

  return 'Chưa có';
}
