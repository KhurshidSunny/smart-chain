import { render, screen } from '@testing-library/react';
import StatusIndicator from './StatusIndicator';

describe('StatusIndicator', () => {
    it('renders with default status when no status provided', () => {
        render(<StatusIndicator />);
        const chip = screen.getByText('Unknown');
        expect(chip).toBeInTheDocument();
        expect(chip).toHaveStyle('background-color: rgb(224, 224, 224)'); // grey.300
        expect(chip).toHaveStyle('color: rgb(0, 0, 0)'); // black
    });

    it('renders completed status with green background', () => {
        render(<StatusIndicator status="Completed" />);
        const chip = screen.getByText('Completed');
        expect(chip).toBeInTheDocument();
        expect(chip).toHaveStyle('background-color: rgb(46, 125, 50)'); // success.main
        expect(chip).toHaveStyle('color: rgb(255, 255, 255)'); // white
    });

    it('renders inProgress status with yellow background', () => {
        render(<StatusIndicator status="In Progress" />);
        const chip = screen.getByText('In Progress');
        expect(chip).toBeInTheDocument();
        expect(chip).toHaveStyle('background-color: rgb(237, 108, 2)'); // warning.main
        expect(chip).toHaveStyle('color: rgb(0, 0, 0)'); // black
    });

    it('renders pending status with blue background', () => {
        render(<StatusIndicator status="Pending" />);
        const chip = screen.getByText('Pending');
        expect(chip).toBeInTheDocument();
        expect(chip).toHaveStyle('background-color: rgb(2, 136, 209)'); // info.main
        expect(chip).toHaveStyle('color: rgb(255, 255, 255)'); // white
    });

    it('renders error status with red background', () => {
        render(<StatusIndicator status="Error" />);
        const chip = screen.getByText('Error');
        expect(chip).toBeInTheDocument();
        expect(chip).toHaveStyle('background-color: rgb(211, 47, 47)'); // error.main
        expect(chip).toHaveStyle('color: rgb(255, 255, 255)'); // white
    });

    it('renders cancelled status with grey background', () => {
        render(<StatusIndicator status="Cancelled" />);
        const chip = screen.getByText('Cancelled');
        expect(chip).toBeInTheDocument();
        expect(chip).toHaveStyle('background-color: rgb(158, 158, 158)'); // grey.500
        expect(chip).toHaveStyle('color: rgb(255, 255, 255)'); // white
    });

    it('uses custom label when provided', () => {
        render(<StatusIndicator status="Completed" label="Done" />);
        expect(screen.getByText('Done')).toBeInTheDocument();
        expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    });

    it('displays tooltip with custom text', () => {
        render(<StatusIndicator status="Pending" tooltip="Awaiting Action" />);
        const chip = screen.getByText('Pending');
        expect(chip).toHaveAttribute('aria-label', 'Status: Pending');
        expect(screen.getByTitle('Awaiting Action')).toBeInTheDocument();
    });

    it('normalizes status with spaces and case', () => {
        render(<StatusIndicator status="In PROGRESS" />);
        const chip = screen.getByText('In PROGRESS');
        expect(chip).toHaveStyle('background-color: rgb(237, 108, 2)'); // warning.main
    });
});