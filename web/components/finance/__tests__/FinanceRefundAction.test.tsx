import { fireEvent, render, screen } from '@testing-library/react';
import FinanceRefundAction from '@/components/finance/FinanceRefundAction';

describe('FinanceRefundAction', () => {
  it('does not expose the refund button without finance.refund', () => {
    render(
      <FinanceRefundAction canRefund={false} refundableAmount={500_000} onRefund={jest.fn()} />
    );

    expect(screen.queryByRole('button', { name: 'Hoàn tiền' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Không có quyền hoàn tiền')).toBeInTheDocument();
  });

  it('allows an authorized user to start a refund', () => {
    const onRefund = jest.fn();
    render(<FinanceRefundAction canRefund refundableAmount={500_000} onRefund={onRefund} />);

    fireEvent.click(screen.getByRole('button', { name: 'Hoàn tiền' }));

    expect(onRefund).toHaveBeenCalledTimes(1);
  });

  it('disables the action after the payment has been fully refunded', () => {
    render(<FinanceRefundAction canRefund refundableAmount={0} onRefund={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Đã hoàn hết' })).toBeDisabled();
  });
});
