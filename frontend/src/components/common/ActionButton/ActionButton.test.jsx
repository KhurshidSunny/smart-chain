import { render, screen, fireEvent } from '@testing-library/react';
import ActionButton from './ActionButton';
import AddIcon from '@mui/icons-material/Add';

describe('ActionButton', () => {
    const defaultProps = {
        label: 'Save',
        onClick: jest.fn(),
    };

    it('renders with label and default styles', () => {
        render(<ActionButton {...defaultProps} />);
        const button = screen.getByRole('button', { name: /save/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('variant', 'contained');
        expect(button).toHaveAttribute('color', 'primary');
    });

    it('displays icon when provided', () => {
        render(<ActionButton {...defaultProps} icon={<AddIcon />} />);
        expect(screen.getByTestId('AddIcon')).toBeInTheDocument(); // Material-UI icons use data-testid
    });

    it('calls onClick when clicked', () => {
        render(<ActionButton {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading indicator and disables button when loading', () => {
        render(<ActionButton {...defaultProps} loading />);
        const button = screen.getByRole('button', { name: /save/i });
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(button).toBeDisabled();
    });

    it('applies disabled state', () => {
        render(<ActionButton {...defaultProps} disabled />);
        expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });

    it('uses custom variant, color, and size', () => {
        render(<ActionButton {...defaultProps} variant="outlined" color="secondary" size="large" />);
        const button = screen.getByRole('button', { name: /save/i });
        expect(button).toHaveAttribute('variant', 'outlined');
        expect(button).toHaveAttribute('color', 'secondary');
        expect(button).toHaveClass('MuiButton-sizeLarge');
    });

    it('applies fullWidth when specified', () => {
        render(<ActionButton {...defaultProps} fullWidth />);
        expect(screen.getByRole('button', { name: /save/i })).toHaveStyle('width: 100%');
    });

    it('applies custom sx styles', () => {
        render(<ActionButton {...defaultProps} sx={{ bgcolor: 'red' }} />);
        expect(screen.getByRole('button', { name: /save/i })).toHaveStyle('background-color: red');
    });

    it('does not call onClick when disabled or loading', () => {
        render(<ActionButton {...defaultProps} disabled />);
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        expect(defaultProps.onClick).not.toHaveBeenCalled();

        render(<ActionButton {...defaultProps} loading />);
        fireEvent.click(screen.getByRole('button', { name: /save/i }));
        expect(defaultProps.onClick).not.toHaveBeenCalled();
    });
});