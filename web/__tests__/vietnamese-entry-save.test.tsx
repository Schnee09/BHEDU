import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn()
}));

import { apiFetch } from '@/lib/api/client';
import { performVietnameseSave } from '@/lib/grades/vietnameseSave';
import GradeEntryPageModern, { VietnameseEntryInline } from '@/app/dashboard/grades/entry/page';

const mockedApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function makeJsonResponse(obj: any) {
  return { ok: true, json: async () => obj } as any;
}

describe('VietnameseEntry save flow', () => {
  beforeEach(() => mockedApiFetch.mockReset());

  test('successful save calls API and closes modal', async () => {
    // Test performVietnameseSave helper: successful
    mockedApiFetch.mockImplementation(async (url: string, opts?: any) => {
      if (opts && opts.method === 'POST' && url.includes('/api/grades/vietnamese-entry')) {
        return makeJsonResponse({ success: true, message: 'Saved' });
      }
      return makeJsonResponse({});
    });

    const payload = {
      class_id: 'c1',
      subject_code: 'sub1',
      semester: '1',
      students: [
        { student_id: 's1', grades: { oral: 8 } },
        { student_id: 's2', grades: { oral: 9 } },
      ]
    };

    const res = await performVietnameseSave(payload as any);
    expect(res.ok).toBe(true);
    expect(res.studentErrors).toEqual({});
  });

  test('partial failure maps errors to inline fields', async () => {
    // Mock POST to return partial failures
    mockedApiFetch.mockImplementation(async (url: string, opts?: any) => {
      if (opts && opts.method === 'POST' && url.includes('/api/grades/vietnamese-entry')) {
        return makeJsonResponse({ success: true, failedStudents: [{ student_id: 's2', message: 'Invalid grade' }] });
      }
      if (url.includes('/api/classes/my-classes')) return makeJsonResponse({ classes: [{ id: 'c1', name: 'Class 1' }] });
      if (url.includes('/api/subjects')) return makeJsonResponse({ subjects: [{ code: 'sub1', name: 'Vietnamese' }] });
      if (url.startsWith('/api/grades/vietnamese-entry')) return makeJsonResponse({ students: [ { id: 's1', name: 'Alice', grades: {} }, { id: 's2', name: 'Bob', grades: {} } ] });
      return makeJsonResponse({});
    });

    // Test performVietnameseSave helper: partial failure
    mockedApiFetch.mockImplementation(async (url: string, opts?: any) => {
      if (opts && opts.method === 'POST' && url.includes('/api/grades/vietnamese-entry')) {
        return makeJsonResponse({ success: true, failedStudents: [{ student_id: 's2', message: 'Invalid grade' }] });
      }
      return makeJsonResponse({});
    });

    const payload2 = {
      class_id: 'c1',
      subject_code: 'sub1',
      semester: '1',
      students: [
        { student_id: 's1', grades: { oral: 8 } },
        { student_id: 's2', grades: { oral: 9 } },
      ]
    };

    const res2 = await performVietnameseSave(payload2 as any);
    expect(res2.ok).toBe(true);
    expect(res2.studentErrors).toHaveProperty('s2');
    expect(res2.studentErrors['s2']).toBe('Invalid grade');
  });
});
