import { fireEvent, render, screen } from '@testing-library/react';
import { AttendanceFilters } from '../AttendanceFilters';

const translate = (key: string) => key;

function renderFilters(overrides: Partial<React.ComponentProps<typeof AttendanceFilters>> = {}) {
  const props: React.ComponentProps<typeof AttendanceFilters> = {
    classes: [],
    selectedClass: '',
    setSelectedClass: jest.fn(),
    dateRange: 'custom',
    setDateRange: jest.fn(),
    startDate: '2026-11-01',
    setStartDate: jest.fn(),
    endDate: '2026-11-12',
    setEndDate: jest.fn(),
    statusFilter: '',
    setStatusFilter: jest.fn(),
    viewMode: 'overview',
    setViewMode: jest.fn(),
    t: translate,
    ...overrides,
  };

  render(<AttendanceFilters {...props} />);
  return props;
}

describe('AttendanceFilters custom date range', () => {
  it('shows labeled date inputs and updates their values', () => {
    const props = renderFilters();

    fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-10-31' } });

    expect(props.setStartDate).toHaveBeenCalledWith('2026-10-01');
    expect(props.setEndDate).toHaveBeenCalledWith('2026-10-31');
  });

  it('explains an inverted date range', () => {
    renderFilters({ startDate: '2026-11-12', endDate: '2026-11-01' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ngày bắt đầu không được sau ngày kết thúc.'
    );
  });
});
