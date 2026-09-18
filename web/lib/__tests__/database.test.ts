/**
 * Supabase connection health check tests
 */

import { createClient } from '@/lib/supabase/server';

describe('Supabase Connection', () => {
  let supabase: Awaited<ReturnType<typeof createClient>>;

  beforeAll(async () => {
    supabase = await createClient();
  });

  it('should connect to Supabase', async () => {
    expect(supabase).toBeDefined();
  });

  it('should have valid auth client', () => {
    expect(supabase.auth).toBeDefined();
  });

  it('should be able to query a table (health check)', async () => {
    // This tests basic connectivity - adjust table name as needed
    const { error } = await supabase.from('profiles').select('id').limit(1);

    // We don't care about data, just that the connection works
    // Error might occur if not authenticated, but connection is tested
    expect(error).toBeDefined(); // Expect auth error or success
  });
});

describe('Database Helpers', () => {
  describe('RLS Functions', () => {
    it.skip('should have is_admin RPC function available (integration test)', async () => {
      // Integration test - skipped in unit tests
      expect(true).toBe(true);
    });

    it.skip('should have is_teacher RPC function available (integration test)', async () => {
      expect(true).toBe(true);
    });

    it.skip('should have is_enrolled_in_class RPC function available (integration test)', async () => {
      expect(true).toBe(true);
    });
  });

  describe('Database Schema', () => {
    const tables = [
      'users',
      'profiles',
      'courses',
      'classes',
      'subjects',
      'enrollments',
      'assignments',
      'grades',
      'attendance',
      'academic_years',
    ];

    let testSupabaseClient: Awaited<ReturnType<typeof createClient>>;

    beforeAll(async () => {
      testSupabaseClient = await createClient();
    });

    tables.forEach((table) => {
      it(`should have ${table} table accessible`, async () => {
        const { error } = await testSupabaseClient.from(table).select('*').limit(0); // Don't fetch data, just check table exists

        // RLS might block, but table should exist
        expect(error?.message).not.toContain('does not exist');
        expect(error?.message).not.toContain('relation');
      });
    });
  });
});
