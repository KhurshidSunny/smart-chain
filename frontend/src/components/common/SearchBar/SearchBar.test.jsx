import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
    const mockOnSearch = jest.fn();
    const suggestions = ['Order123', 'ProductABC', 'CustomerXYZ'];

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('renders with placeholder', () => {
        render(<SearchBar onSearch={mockOnSearch} placeholder="Search Orders" />);
        expect(screen.getByPlaceholderText('Search Orders')).toBeInTheDocument();
    });

    it('triggers search on Enter key', () => {
        render(<SearchBar onSearch={mockOnSearch} />);
        const input = screen.getByPlaceholderText('Search...');
        fireEvent.change(input, { target: { value: 'Order123' } });
        fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
        expect(mockOnSearch).toHaveBeenCalledWith('Order123');
        expect(input).toHaveValue('');
    });

    it('clears input when clear button clicked', () => {
        render(<SearchBar onSearch={mockOnSearch} />);
        const input = screen.getByPlaceholderText('Search...');
        fireEvent.change(input, { target: { value: 'Test' } });
        fireEvent.click(screen.getByLabelText('clear search'));
        expect(input).toHaveValue('');
    });

    it('shows suggestions when typing', () => {
        render(<SearchBar onSearch={mockOnSearch} suggestions={suggestions} />);
        const input = screen.getByPlaceholderText('Search...');
        fireEvent.change(input, { target: { value: 'ord' } });
        expect(screen.getByText('Order123')).toBeInTheDocument();
        expect(screen.queryByText('ProductABC')).not.toBeInTheDocument();
    });

    it('triggers search on suggestion click', () => {
        render(<SearchBar onSearch={mockOnSearch} suggestions={suggestions} />);
        const input = screen.getByPlaceholderText('Search...');
        fireEvent.change(input, { target: { value: 'ord' } });
        fireEvent.click(screen.getByText('Order123'));
        expect(mockOnSearch).toHaveBeenCalledWith('Order123');
        expect(input).toHaveValue('');
    });

    it('shows recent searches when input is empty', () => {
        localStorage.setItem('recentSearches', JSON.stringify(['Order123', 'TestSearch']));
        render(<SearchBar onSearch={mockOnSearch} />);
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
        expect(screen.getByText('Order123')).toBeInTheDocument();
        expect(screen.getByText('TestSearch')).toBeInTheDocument();
    });

    it('hides suggestions when query is cleared', () => {
        render(<SearchBar onSearch={mockOnSearch} suggestions={suggestions} />);
        const input = screen.getByPlaceholderText('Search...');
        fireEvent.change(input, { target: { value: 'ord' } });
        expect(screen.getByText('Order123')).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText('clear search'));
        expect(screen.queryByText('Order123')).not.toBeInTheDocument();
    });

    it('limits recent searches to 5 and updates localStorage', () => {
        localStorage.setItem(
            'recentSearches',
            JSON.stringify(['Search1', 'Search2', 'Search3', 'Search4', 'Search5'])
        );
        render(<SearchBar onSearch={mockOnSearch} />);
        const input = screen.getByPlaceholderText('Search...');
        fireEvent.change(input, { target: { value: 'NewSearch' } });
        fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });
        expect(mockOnSearch).toHaveBeenCalledWith('NewSearch');
        const updatedSearches = JSON.parse(localStorage.getItem('recentSearches'));
        expect(updatedSearches).toEqual([
            'NewSearch',
            'Search1',
            'Search2',
            'Search3',
            'Search4',
        ]);
        expect(updatedSearches.length).toBe(5);
    });
});