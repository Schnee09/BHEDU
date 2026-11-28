import { fireEvent, render, screen } from '@testing-library/react';
import { Pagination } from '@/app/dashboard/admin/_components/Pagination';

describe('admin Pagination', () => {
  it('announces the visible range and changes page', () => {
    const onPageChange = jest.fn();
    render(<Pagination page={2} perPage={20} total={45} onPageChange={onPageChange} />);

    expect(screen.getByText(/Hiển thị/)).toHaveTextContent(
      'Hiển thị 21–40 trong tổng số 45 yêu cầu'
    );
    expect(screen.getByRole('button', { name: 'Trang 2' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('shows a correct empty range without page buttons', () => {
    render(<Pagination page={1} perPage={20} total={0} onPageChange={jest.fn()} />);

    expect(screen.getByText(/Hiển thị/)).toHaveTextContent('Hiển thị 0–0 trong tổng số 0 yêu cầu');
    expect(screen.queryByRole('button', { name: 'Trang sau' })).not.toBeInTheDocument();
  });
});
