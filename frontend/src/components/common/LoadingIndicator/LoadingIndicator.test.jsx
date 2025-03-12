import { render, screen } from '@testing-library/react';
import LoadingIndicator from './LoadingIndicator';

describe('LoadingIndicator', () => {
    it('renders with default props', () => {
        render(<LoadingIndicator />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toHaveAttribute('class', expect.stringContaining('primary'));
    });

    it('renders custom size and color', () => {
        render(<LoadingIndicator size={60} color="secondary" />);
        const progress = screen.getByRole('progressbar');
        expect(progress).toHaveStyle(`width: 60px`);
        expect(progress).toHaveAttribute('class', expect.stringContaining('secondary'));
    });

    it('renders without message when message is empty', () => {
        render(<LoadingIndicator message="" />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    it('renders custom message', () => {
        render(<LoadingIndicator message="Please wait..." />);
        expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    it('renders full-screen with overlay when fullScreen is true', () => {
        render(<LoadingIndicator fullScreen />);
        const container = screen.getByRole('progressbar').parentElement.parentElement;
        expect(container).toHaveStyle({
            position: 'fixed',
            width: '100vw',
            height: '100vh',
        });
        expect(container).toHaveStyle('background-color: rgba(0, 0, 0, 0.2)');
    });

    it('applies custom thickness', () => {
        render(<LoadingIndicator thickness={6} />);
        const progress = screen.getByRole('progressbar');
        expect(progress).toHaveAttribute('class', expect.stringContaining('6')); // Thickness is reflected in class or style
    });
});