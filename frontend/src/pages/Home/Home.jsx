import React from 'react';
import { Box } from '@mui/material';
import HeroSection from './Hero/Hero.jsx';

const HomePage = () => {
    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 64px)',
                width: '100%',
                maxWidth: '100vw',
                overflowX: 'hidden',
                bgcolor: 'background-light',
            }}
        >
            <HeroSection />
        </Box>
    );
};

export default HomePage;