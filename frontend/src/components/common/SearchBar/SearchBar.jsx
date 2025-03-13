import React, { useState, useEffect, useRef } from 'react';
import {
    TextField,
    InputAdornment,
    IconButton,
    Popper,
    Paper,
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

const SearchBar = ({ onSearch, placeholder = 'Search...', suggestions = [] }) => {
    const [query, setQuery] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [recentSearches, setRecentSearches] = useState([]);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        const storedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
        setRecentSearches(storedSearches);
    }, []);

    useEffect(() => {
        if (query.trim()) {
            const filtered = suggestions.filter((suggestion) =>
                suggestion.toLowerCase().includes(query.toLowerCase())
            );
            if (JSON.stringify(filtered) !== JSON.stringify(filteredSuggestions)) {
                setFilteredSuggestions(filtered);
            }
            if (!anchorEl) {
                setAnchorEl(inputRef.current);
            }
        } else {
            if (filteredSuggestions.length > 0) {
                setFilteredSuggestions([]);
            }
            if (anchorEl) {
                setAnchorEl(null);
            }
        }
    }, [query, suggestions, filteredSuggestions, anchorEl]);

    const handleSearch = (searchQuery = query) => {
        if (searchQuery.trim()) {
            onSearch(searchQuery);
            const updatedSearches = [
                searchQuery,
                ...recentSearches.filter((item) => item !== searchQuery),
            ].slice(0, 5);
            setRecentSearches(updatedSearches);
            localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
            setQuery('');
            setAnchorEl(null);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClear = () => {
        setQuery('');
        setAnchorEl(null);
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        handleSearch(suggestion);
    };

    const open = Boolean(anchorEl) && (filteredSuggestions.length > 0 || recentSearches.length > 0);

    return (
        <Box sx={{ position: 'relative', width: '100%', maxWidth: 400 }}>
            <TextField
                id="search-bar"
                inputRef={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                variant="outlined"
                size="small"
                fullWidth
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                    endAdornment: query && (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={handleClear} aria-label="clear search">
                                <ClearIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
            <Popper open={open} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 1300 }}>
                <Paper elevation={3} sx={{ width: anchorEl?.offsetWidth, maxHeight: 300, overflowY: 'auto' }}>
                    {filteredSuggestions.length > 0 && (
                        <>
                            <Typography variant="caption" sx={{ p: 1, color: 'grey.600' }}>
                                Suggestions
                            </Typography>
                            <List dense>
                                {filteredSuggestions.map((suggestion, index) => (
                                    <ListItem
                                        key={index}
                                        component="button" // Replace deprecated 'button' prop
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        sx={{ width: '100%' }}
                                    >
                                        <ListItemText primary={suggestion} />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}
                    {recentSearches.length > 0 && !query.trim() && (
                        <>
                            <Typography variant="caption" sx={{ p: 1, color: 'grey.600' }}>
                                Recent Searches
                            </Typography>
                            <List dense>
                                {recentSearches.map((search, index) => (
                                    <ListItem
                                        key={index}
                                        component="button" // Replace deprecated 'button' prop
                                        onClick={() => handleSearch(search)}
                                        sx={{ width: '100%' }}
                                    >
                                        <ListItemText primary={search} />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}
                </Paper>
            </Popper>
        </Box>
    );
};

export default SearchBar;