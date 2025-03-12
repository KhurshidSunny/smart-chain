import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from './ErrorMessage';

describe('ErrorMessage', () => {
  const defaultProps = {
    message: 'Something went wrong. Please try again.',
  };

  it('renders error message with default severity and title', () => {
    render(<ErrorMessage {...defaultProps} />);
    expect(screen.getByText('An Error Occurred')).toBeInTheDocument();
    expect(screen.getByText(defaultProps.message)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveAttribute('class', expect.stringContaining('error'));
  });

  it('renders custom title and severity', () => {
    render(<ErrorMessage {...defaultProps} title="Network Error" severity="warning" />);
    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveAttribute('class', expect.stringContaining('warning'));
  });

  it('displays error code when provided', () => {
    render(<ErrorMessage {...defaultProps} errorCode="ERR_001" />);
    expect(screen.getByText('Error Code: ERR_001')).toBeInTheDocument();
  });

  it('renders retry button and calls onRetry when clicked', () => {
    const onRetry = jest.fn();
    render(<ErrorMessage {...defaultProps} onRetry={onRetry} />);
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders custom action button and calls onAction when clicked', () => {
    const onAction = jest.fn();
    render(<ErrorMessage {...defaultProps} actionText="Go Back" onAction={onAction} />);
    const actionButton = screen.getByRole('button', { name: /go back/i });
    expect(actionButton).toBeInTheDocument();
    fireEvent.click(actionButton);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders both retry and action buttons when both are provided', () => {
    const onRetry = jest.fn();
    const onAction = jest.fn();
    render(
      <ErrorMessage
        {...defaultProps}
        onRetry={onRetry}
        retryText="Try Again"
        actionText="Cancel"
        onAction={onAction}
      />
    );
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('does not render action buttons when no handlers are provided', () => {
    render(<ErrorMessage {...defaultProps} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});