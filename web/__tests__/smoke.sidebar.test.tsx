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
    render(<Sidebar />);

    // Check for Students link text - should be present for admin
    const studentsLink = screen.getByText(/Students/i);
    expect(studentsLink).toBeInTheDocument();
  });
});
