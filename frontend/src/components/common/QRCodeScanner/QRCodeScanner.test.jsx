import { render, screen, fireEvent } from '@testing-library/react';
import QRCodeScanner from './QRCodeScanner';
import Quagga from 'quagga';

// Mock Quagga
jest.mock('quagga', () => ({
    init: jest.fn((config, callback) => callback(null)),
    start: jest.fn(),
    stop: jest.fn(),
    onDetected: jest.fn(),
    onProcessed: jest.fn(),
}));

describe('QRCodeScanner', () => {
    const mockOnScan = jest.fn();
    const mockOnError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders scanner interface', () => {
        render(<QRCodeScanner onScan={mockOnScan} onError={mockOnError} />);
        expect(screen.getByText('QR Code Scanner')).toBeInTheDocument();
        expect(screen.getByText('Start Scanning')).toBeInTheDocument();
        expect(screen.getByLabelText('QR Code')).toBeInTheDocument();
        expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('starts scanning when button clicked', () => {
        render(<QRCodeScanner onScan={mockOnScan} onError={mockOnError} />);
        fireEvent.click(screen.getByText('Start Scanning'));
        expect(Quagga.init).toHaveBeenCalled();
        expect(Quagga.start).toHaveBeenCalled();
        expect(screen.getByText('Stop Scanning')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('stops scanning when stop button clicked', () => {
        render(<QRCodeScanner onScan={mockOnScan} onError={mockOnError} />);
        fireEvent.click(screen.getByText('Start Scanning'));
        fireEvent.click(screen.getByText('Stop Scanning'));
        expect(Quagga.stop).toHaveBeenCalled();
        expect(screen.getByText('Start Scanning')).toBeInTheDocument();
    });

    it('calls onScan with detected code', () => {
        render(<QRCodeScanner onScan={mockOnScan} onError={mockOnError} />);
        fireEvent.click(screen.getByText('Start Scanning'));

        // Simulate QR code detection
        const onDetectedCallback = Quagga.onDetected.mock.calls[0][0];
        onDetectedCallback({ codeResult: { code: 'QR12345' } });

        expect(mockOnScan).toHaveBeenCalledWith('QR12345');
        expect(Quagga.stop).toHaveBeenCalled();
        expect(screen.getByText('Start Scanning')).toBeInTheDocument();
    });

    it('displays error when Quagga fails to initialize', () => {
        Quagga.init.mockImplementation((config, callback) =>
            callback(new Error('Camera access denied'))
        );
        render(<QRCodeScanner onScan={mockOnScan} onError={mockOnError} />);
        fireEvent.click(screen.getByText('Start Scanning'));
        expect(screen.getByText(/Failed to initialize scanner: Camera access denied/i)).toBeInTheDocument();
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('submits manual code and calls onScan', () => {
        render(<QRCodeScanner onScan={mockOnScan} onError={mockOnError} />);
        fireEvent.change(screen.getByLabelText('QR Code'), { target: { value: 'MANUAL123' } });
        fireEvent.click(screen.getByText('Submit'));
        expect(mockOnScan).toHaveBeenCalledWith('MANUAL123');
        expect(screen.getByLabelText('QR Code')).toHaveValue('');
    });

    it('displays error for empty manual submission', () => {
        render(<QRCodeScanner onScan={mockOnScan} onError={mockOnError} />);
        fireEvent.click(screen.getByText('Submit'));
        expect(screen.getByText('Please enter a valid QR code')).toBeInTheDocument();
        expect(mockOnScan).not.toHaveBeenCalled();
    });

    it('disables manual input while scanning', () => {
        render(<QRCodeScanner onScan={mockOnScan} onError={mockOnError} />);
        fireEvent.click(screen.getByText('Start Scanning'));
        expect(screen.getByLabelText('QR Code')).toBeDisabled();
        expect(screen.getByText('Submit')).toBeDisabled();
    });
});