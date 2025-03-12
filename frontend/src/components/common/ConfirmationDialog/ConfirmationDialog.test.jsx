import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationDialog from './ConfirmationDialog';

describe('ConfirmationDialog', () => {
    const defaultProps = {
        open: true,
        onClose: jest.fn(),
        onConfirm: jest.fn(),
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed?',
    };

    it('renders dialog with title and message', () => {
        render(<ConfirmationDialog {...defaultProps} />);
        expect(screen.getByText('Confirm Action')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    it('calls onClose when cancel button is clicked', () => {
        render(<ConfirmationDialog {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when confirm button is clicked', () => {
        render(<ConfirmationDialog {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
        expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    });

    it('disables buttons and shows loading indicator when loading is true', () => {
        render(<ConfirmationDialog {...defaultProps} loading={true} />);
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('uses custom button text when provided', () => {
        render(
            <ConfirmationDialog
                {...defaultProps}
                confirmText="Yes"
                cancelText="No"
            />
        );
        expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
        render(<ConfirmationDialog {...defaultProps} open={false} />);
        expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });
});