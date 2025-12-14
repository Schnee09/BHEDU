// Jest setup file
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config({ path: '.env.local' });

// Setup @testing-library/jest-dom matchers
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('@testing-library/jest-dom');

// React 18+/19: silence act() warnings by declaring act environment.
// Individual tests can still opt-in/out; this is safe for our hooks/component tests.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock Next.js headers and cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
  headers: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

// Set test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
