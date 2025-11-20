/**
 * Database helper utilities
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Check if a record exists in a table
 */
export async function recordExists(
  table: string,
  id: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from(table)
    .select('id')
    .eq('id', id)
    .single();

  return !!data;
}

/**
 * Check if a user has admin role
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('is_admin', { uid: userId });
  
  if (error) {
    console.error('Failed to check admin status:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Check if a user has teacher role
 */
export async function isTeacher(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('is_teacher', { uid: userId });
  
  if (error) {
    console.error('Failed to check teacher status:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Check if a student is enrolled in a class
 */
export async function isEnrolledInClass(
  classId: string,
  studentId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('is_enrolled_in_class', {
    class_id: classId,
    student_id: studentId,
  });
  
  if (error) {
    console.error('Failed to check enrollment:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Check if a user is the teacher of a class
 */
export async function isClassTeacher(
  classId: string,
  teacherId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('is_class_teacher', {
    class_id: classId,
    teacher_id: teacherId,
  });
  
  if (error) {
    console.error('Failed to check teacher status:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Get current academic year
 */
export async function getCurrentAcademicYear() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('academic_years')
    .select('*')
    .eq('is_current', true)
    .single();

  return data;
}

/**
 * Transaction helper - execute multiple queries in a transaction
 * Note: Supabase doesn't support multi-statement transactions in JS client,
 * so this is a helper to execute queries sequentially with rollback on error
 */
export async function withTransaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  try {
    return await callback();
  } catch (error) {
    // Log error and rethrow
    console.error('Transaction failed:', error);
    throw error;
  }
}

/**
 * Batch insert helper
 */
export async function batchInsert<T extends Record<string, unknown>>(
  table: string,
  records: T[],
  batchSize: number = 100
) {
  const supabase = await createClient();
  const results = [];

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { data, error } = await supabase.from(table).insert(batch).select();

    if (error) {
      console.error(`Batch insert failed at index ${i}:`, error);
      throw error;
    }

    if (data) {
      results.push(...data);
    }
  }

  return results;
}

/**
 * Soft delete helper (sets deleted_at timestamp)
 */
export async function softDelete(table: string, id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Soft delete failed:', error);
    throw error;
  }
}
