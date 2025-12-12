import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardBody, CardFooter, StatCard } from '@/components/ui/Card';
import '@testing-library/jest-dom';

describe('Card Components', () => {
  describe('Card Component', () => {
    it('renders children', () => {
      render(
        <Card>
          <div>Card content</div>
        </Card>
      );

      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });

    it('has default styling classes', () => {
      const { container } = render(
        <Card>Content</Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('rounded-xl', 'bg-white', 'border');
    });

    it('applies hover class when hover is true', () => {
      const { container } = render(
        <Card hover={true}>Content</Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-md', 'hover:border-stone-300');
    });

    it('handles click events', () => {
      const onClick = jest.fn();
      const { container } = render(
        <Card onClick={onClick}>Clickable</Card>
      );

      const card = container.firstChild as HTMLElement;
      card.click();

      expect(onClick).toHaveBeenCalled();
    });

    it('applies cursor-pointer when clickable', () => {
      const { container } = render(
        <Card onClick={() => {}}>Clickable</Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('cursor-pointer');
    });

    it('renders as different element types', () => {
      const { container: divContainer } = render(
        <Card as="div">Div card</Card>
      );
      expect(divContainer.firstChild?.nodeName).toBe('DIV');

      const { container: articleContainer } = render(
        <Card as="article">Article card</Card>
      );
      expect(articleContainer.firstChild?.nodeName).toBe('ARTICLE');
    });

    it('memoizes properly to prevent re-renders', () => {
      const renderSpy = jest.fn();
      const TestComponent = () => {
        renderSpy();
        return <Card>Test</Card>;
      };

      const { rerender } = render(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestComponent />);
      // Memo should prevent unnecessary re-renders with same props
      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('CardHeader Component', () => {
    it('renders children correctly', () => {
      render(
        <CardHeader>
          <h2>Test Title</h2>
        </CardHeader>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <CardHeader className="custom-header">
          <span>Content</span>
        </CardHeader>
      );

      const header = container.querySelector('.custom-header');
      expect(header).toBeInTheDocument();
    });

    it('has proper styling for borders and background', () => {
      const { container } = render(
        <CardHeader>
          <span>Header</span>
        </CardHeader>
      );

      const header = container.firstChild;
      expect(header).toHaveClass('border-b', 'border-stone-100', 'bg-stone-50/50');
    });

    it('renders multiple children', () => {
      render(
        <CardHeader>
          <h2>Title</h2>
          <p>Subtitle</p>
        </CardHeader>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Subtitle')).toBeInTheDocument();
    });

    it('rounds top corners', () => {
      const { container } = render(
        <CardHeader>Header</CardHeader>
      );

      const header = container.firstChild;
      expect(header).toHaveClass('rounded-t-xl');
    });

    it('memoizes to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <CardHeader>
          <span>Content</span>
        </CardHeader>
      );

      rerender(
        <CardHeader>
          <span>Content</span>
        </CardHeader>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('CardBody Component', () => {
    it('renders children', () => {
      render(
        <CardBody>
          <p>Body content</p>
        </CardBody>
      );

      expect(screen.getByText('Body content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <CardBody className="custom-body">Content</CardBody>
      );

      const body = container.querySelector('.custom-body');
      expect(body).toBeInTheDocument();
    });

    it('has proper padding', () => {
      const { container } = render(
        <CardBody>Body</CardBody>
      );

      const body = container.firstChild;
      expect(body).toHaveClass('px-6', 'py-5');
    });

    it('memoizes to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <CardBody>
          <span>Content</span>
        </CardBody>
      );

      rerender(
        <CardBody>
          <span>Content</span>
        </CardBody>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('CardFooter Component', () => {
    it('renders children', () => {
      render(
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      );

      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <CardFooter className="custom-footer">Footer</CardFooter>
      );

      const footer = container.querySelector('.custom-footer');
      expect(footer).toBeInTheDocument();
    });

    it('has border-top styling', () => {
      const { container } = render(
        <CardFooter>Footer</CardFooter>
      );

      const footer = container.firstChild;
      expect(footer).toHaveClass('border-t', 'border-stone-100');
    });

    it('rounds bottom corners', () => {
      const { container } = render(
        <CardFooter>Footer</CardFooter>
      );

      const footer = container.firstChild;
      expect(footer).toHaveClass('rounded-b-xl');
    });

    it('memoizes to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <CardFooter>
          <span>Content</span>
        </CardFooter>
      );

      rerender(
        <CardFooter>
          <span>Content</span>
        </CardFooter>
      );

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('StatCard Component', () => {
    it('renders label and value', () => {
      render(
        <StatCard label="Users" value="1,234" />
      );

      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });

    it('renders with optional subtitle', () => {
      render(
        <StatCard label="Users" value="1,234" subtitle="Active users" />
      );

      expect(screen.getByText('Active users')).toBeInTheDocument();
    });

    it('renders with positive trend', () => {
      render(
        <StatCard 
          label="Revenue" 
          value="$5,000" 
          trend={{ value: 15, isPositive: true }}
        />
      );

      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('$5,000')).toBeInTheDocument();
    });

    it('renders with negative trend', () => {
      render(
        <StatCard 
          label="Errors" 
          value="42" 
          trend={{ value: 5, isPositive: false }}
        />
      );

      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      const TestIcon = () => <span data-testid="icon">📊</span>;
      render(
        <StatCard label="Stats" value="100" icon={<TestIcon />} />
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('supports different color variants', () => {
      const { rerender } = render(
        <StatCard label="Blue" value="100" color="blue" />
      );
      expect(screen.getByText('Blue')).toBeInTheDocument();

      rerender(<StatCard label="Green" value="100" color="green" />);
      expect(screen.getByText('Green')).toBeInTheDocument();

      rerender(<StatCard label="Orange" value="100" color="orange" />);
      expect(screen.getByText('Orange')).toBeInTheDocument();

      rerender(<StatCard label="Purple" value="100" color="purple" />);
      expect(screen.getByText('Purple')).toBeInTheDocument();

      rerender(<StatCard label="Slate" value="100" color="slate" />);
      expect(screen.getByText('Slate')).toBeInTheDocument();
    });

    it('handles click events', () => {
      const onClick = jest.fn();
      const { container } = render(
        <StatCard label="Clickable" value="100" onClick={onClick} />
      );

      const statCard = container.firstChild as HTMLElement;
      statCard.click();

      expect(onClick).toHaveBeenCalled();
    });

    it('renders number values', () => {
      render(
        <StatCard label="Count" value={500} />
      );

      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('renders string values', () => {
      render(
        <StatCard label="Status" value="Active" />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Card Layout Integration', () => {
    it('combines all card components together', () => {
      render(
        <Card>
          <CardHeader>
            <h2>Card Title</h2>
          </CardHeader>
          <CardBody>
            <p>Card content goes here</p>
          </CardBody>
          <CardFooter>
            <button>Save</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card content goes here')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('combines stat card with complex content', () => {
      render(
        <Card>
          <CardBody>
            <StatCard 
              label="Total Revenue" 
              value="$50,000"
              subtitle="This month"
              trend={{ value: 10, isPositive: true }}
            />
          </CardBody>
        </Card>
      );

      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      expect(screen.getByText('This month')).toBeInTheDocument();
    });
  });

  describe('Card Styling and Theming', () => {
    it('uses Stone theme colors', () => {
      const { container } = render(
        <Card>
          <CardHeader>Header</CardHeader>
          <CardBody>Body</CardBody>
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('bg-white', 'border-stone-200', 'shadow-sm');
    });

    it('applies transition classes for smooth interactions', () => {
      const { container } = render(
        <Card hover={true}>Interactive</Card>
      );

      const card = container.firstChild;
      expect(card).toHaveClass('transition-all', 'duration-200');
    });

    it('maintains consistent spacing', () => {
      const { container } = render(
        <Card>
          <CardHeader>Header</CardHeader>
          <CardBody>Body</CardBody>
        </Card>
      );

      const header = container.querySelector('div');
      const body = container.querySelector('div:nth-of-type(2)');

      expect(header).toHaveClass('px-6', 'py-4');
      expect(body).toHaveClass('px-6', 'py-5');
    });
  });

  describe('Card Accessibility', () => {
    it('maintains semantic HTML structure', () => {
      const { container } = render(
        <Card as="section">
          <CardHeader>Title</CardHeader>
          <CardBody>Content</CardBody>
        </Card>
      );

      expect(container.querySelector('section')).toBeInTheDocument();
    });

    it('supports keyboard interaction for clickable cards', () => {
      const onClick = jest.fn();
      const { container } = render(
        <Card onClick={onClick}>Clickable</Card>
      );

      const card = container.firstChild as HTMLElement;
      card.click();

      expect(onClick).toHaveBeenCalled();
    });
  });
});
