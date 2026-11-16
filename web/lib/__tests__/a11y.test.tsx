import { render, screen } from '@testing-library/react';
import { AccessibleTooltip, SkipToMainContent } from '@/lib/a11y';

describe('accessibility helpers', () => {
  it('connects each tooltip to a stable, unique description id', () => {
    const { container } = render(
      <>
        <AccessibleTooltip content="Lưu thay đổi">
          <button type="button">Lưu</button>
        </AccessibleTooltip>
        <AccessibleTooltip content="Hủy thay đổi">
          <button type="button">Hủy</button>
        </AccessibleTooltip>
      </>
    );

    const tooltips = screen.getAllByRole('tooltip');
    const describedElements = container.querySelectorAll('[aria-describedby]');

    expect(tooltips).toHaveLength(2);
    expect(describedElements).toHaveLength(2);
    expect(tooltips[0]?.id).toBeTruthy();
    expect(tooltips[1]?.id).toBeTruthy();
    expect(tooltips[0]?.id).not.toBe(tooltips[1]?.id);
    expect(describedElements[0]?.getAttribute('aria-describedby')).toBe(tooltips[0]?.id);
    expect(describedElements[1]?.getAttribute('aria-describedby')).toBe(tooltips[1]?.id);
  });

  it('provides a Vietnamese skip link to the main content', () => {
    render(<SkipToMainContent />);

    expect(screen.getByRole('link', { name: 'Chuyển đến nội dung chính' })).toHaveAttribute(
      'href',
      '#main-content'
    );
  });
});
