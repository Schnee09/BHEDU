/**
 * Input validation utilities for API routes and server actions
 */

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_CONTENT_LENGTH = 50000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateTitle(title: unknown): string {
  if (typeof title !== 'string' || !title.trim()) {
    throw new ValidationError('Title is required and must be a non-empty string');
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new ValidationError(`Title must not exceed ${MAX_TITLE_LENGTH} characters`);
  }
  return title.trim();
}

export function validateDescription(description: unknown): string {
  if (typeof description !== 'string') {
    throw new ValidationError('Description must be a string');
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new ValidationError(`Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`);
  }
  return description.trim();
}

export function validateContent(content: unknown): string {
  if (typeof content !== 'string') {
    throw new ValidationError('Content must be a string');
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new ValidationError(`Content must not exceed ${MAX_CONTENT_LENGTH} characters`);
  }
  return content.trim();
}

export function validateUUID(id: unknown): string {
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    throw new ValidationError('Invalid UUID format');
  }
  return id;
}

export function validateBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new ValidationError('Value must be a boolean');
}

export function validatePositiveInteger(value: unknown): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new ValidationError('Value must be a positive integer');
  }
  return num;
}
