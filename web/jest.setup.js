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

// Mock window.matchMedia
// Some test runners/workers may execute setup in a different global context.
// Guard access to `window` to avoid ReferenceError in non-jsdom environments.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Set test environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

// Minimal Response polyfill for Node/Jest environment where the Web
// Response global might not be available. This satisfies tests that call
// Response.json(...) or construct new Response(...).
if (typeof globalThis.Response === 'undefined') {
  class ResponsePolyfill {
    constructor(body = null, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.headers = init.headers || {};
    }

    async json() {
      try {
        return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
      } catch (e) {
        return this.body;
      }
    }

    text() {
      return Promise.resolve(
        typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
      );
    }

    static json(body, init = {}) {
      return new ResponsePolyfill(body, init);
    }
  }

  // Attach to global scope
  // eslint-disable-next-line no-undef
  globalThis.Response = ResponsePolyfill; // globalThis to support different jest workers
}
