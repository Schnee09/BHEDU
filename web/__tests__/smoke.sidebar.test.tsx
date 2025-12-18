import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';
import '@testing-library/jest-dom';

// Mock next/navigation functions used by Sidebar
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/students',
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock useProfile hook to supply a profile so Sidebar renders
jest.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ profile: { full_name: 'Admin User', role: 'admin' } }),
}));

describe('Sidebar smoke', () => {
  it('renders sidebar and shows Students link for admin role', () => {
    const { container } = render(<Sidebar />);

    // Check for the students link by href (label may be localized)
    const studentsAnchor = container.querySelector('a[href="/dashboard/students"]');
    expect(studentsAnchor).toBeInTheDocument();
  });
});
