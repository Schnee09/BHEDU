import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';
import { CustomizationProvider } from '@/contexts/CustomizationContext';
import '@testing-library/jest-dom';

// Mock next/navigation functions used by Sidebar
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/students',
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock useProfile hook to supply a profile so Sidebar renders
const mockProfile = { full_name: 'Admin User', role: 'admin' };
jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ profile: mockProfile, loading: false }),
}));

// Mock supabase client to avoid cookie errors in JSDOM
const mockSupabase = {
  auth: {
    signOut: jest.fn(async () => ({ error: null })),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
};
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('Sidebar smoke', () => {
  it('renders sidebar and shows Students link for admin role', () => {
    const { container } = render(
      <CustomizationProvider>
        <Sidebar />
      </CustomizationProvider>
    );

    // Check for the students link by href (label may be localized)
    const studentsAnchor = container.querySelector('a[href="/dashboard/students"]');
    expect(studentsAnchor).toBeInTheDocument();
  });
});
