import React from 'react';
import { Box } from '@mui/material';
import Hero from './Hero/Hero.jsx';

const Home = () => {
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
            <Hero />
        </Box>
    );
};

export default Home;