/**
 * Student Code Generation Utility
 * 
 * Provides unified functions for generating and validating student codes.
 * Format: HS{YEAR}{4-DIGIT-SEQ} e.g., HS20260001
 */

import { SupabaseClient } from '@supabase/supabase-js';

const STUDENT_CODE_PREFIX = 'HS';
const SEQUENCE_DIGITS = 4;

/**
 * Get the current year for student codes
 */
function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Format a student code from year and sequence number
 */
export function formatStudentCode(year: number, sequence: number): string {
  return `${STUDENT_CODE_PREFIX}${year}${String(sequence).padStart(SEQUENCE_DIGITS, '0')}`;
}

/**
 * Validate student code format
 * Accepts: HS{4-digit year}{4-digit seq} or legacy STU-YYYY-NNNN
 */
export function isValidStudentCode(code: string): boolean {
  // New format: HS20260001
  const newFormat = /^HS\d{4}\d{4}$/;
  // Legacy format: STU-2026-0001
  const legacyFormat = /^STU-\d{4}-\d{4}$/;
  
  return newFormat.test(code) || legacyFormat.test(code);
}

/**
 * Parse a student code to extract year and sequence
 */
export function parseStudentCode(code: string): { year: number; sequence: number } | null {
  // New format: HS20260001
  const newMatch = code.match(/^HS(\d{4})(\d{4})$/);
  if (newMatch) {
    return {
      year: parseInt(newMatch[1]),
      sequence: parseInt(newMatch[2])
    };
  }
  
  // Legacy format: STU-2026-0001
  const legacyMatch = code.match(/^STU-(\d{4})-(\d{4})$/);
  if (legacyMatch) {
    return {
      year: parseInt(legacyMatch[1]),
      sequence: parseInt(legacyMatch[2])
    };
  }
  
  return null;
}

/**
 * Get the next available sequence number for the current year
 */
export async function getNextSequenceNumber(supabase: SupabaseClient): Promise<number> {
  const year = getCurrentYear();
  
  // Query existing student codes for current year
  const { data: students, error } = await supabase
    .from('profiles')
    .select('student_code')
    .eq('role', 'student')
    .or(`student_code.like.HS${year}%,student_code.like.STU-${year}-%`)
    .order('student_code', { ascending: false })
    .limit(200);

  if (error) throw error;

  let maxSequence = 0;

  if (students && students.length > 0) {
    for (const student of students) {
      if (student.student_code) {
        const parsed = parseStudentCode(student.student_code);
        if (parsed && parsed.year === year && parsed.sequence > maxSequence) {
          maxSequence = parsed.sequence;
        }
      }
    }
  }

  return maxSequence + 1;
}

/**
 * Generate the next available student code
 */
export async function generateStudentCode(supabase: SupabaseClient): Promise<string> {
  const year = getCurrentYear();
  const nextSeq = await getNextSequenceNumber(supabase);
  return formatStudentCode(year, nextSeq);
}

/**
 * Generate multiple sequential student codes for bulk creation
 * Returns an array of codes starting from the next available sequence
 */
export async function generateBulkStudentCodes(
  supabase: SupabaseClient, 
  count: number
): Promise<string[]> {
  const year = getCurrentYear();
  const startSeq = await getNextSequenceNumber(supabase);
  
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(formatStudentCode(year, startSeq + i));
  }
  
  return codes;
}
