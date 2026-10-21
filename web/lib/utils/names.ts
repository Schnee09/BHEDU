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

  const fullName = (profile.full_name || '').trim();
  if (fullName) return fullName;

  const firstName = (profile.first_name || '').trim();
  const lastName = (profile.last_name || '').trim();
  const formatted = formatVietnameseName(firstName, lastName);

  return formatted || 'Chưa có';
}

/**
 * Resolves consistent avatar initials for a user:
 * Rule: First letter of Surname (Họ) + First letter of Given Name (Tên).
 * Example: "Trương Ngọc Anh Thư" -> "TT"
 * Example: "Nguyễn Văn Nam" -> "NN"
 * Example: "Thư" -> "TH"
 */
export function getUserInitials(
  profile?: {
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
  } | null
): string {
  if (!profile) return 'U';

  const firstName = (profile.first_name || '').trim();
  const lastName = (profile.last_name || '').trim();

  if (lastName && firstName) {
    const firstChar = lastName[0] || '';
    const lastChar = firstName[0] || '';
    return `${firstChar}${lastChar}`.toUpperCase();
  }

  const fullName = (profile.full_name || '').trim();
  if (fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0] || '';
      const last = parts[parts.length - 1] || '';
      return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0]) {
      return parts[0].substring(0, 2).toUpperCase();
    }
  }

  return 'U';
}

/**
 * Gets standard avatar image source, checking photo_url then avatar_url
 */
export function getUserAvatarSrc(
  profile?: {
    photo_url?: string | null;
    avatar_url?: string | null;
  } | null
): string | null {
  return profile?.photo_url || profile?.avatar_url || null;
}
