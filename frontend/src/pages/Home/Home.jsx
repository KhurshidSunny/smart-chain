import React from 'react';
import { Box } from '@mui/material';
import HeroSection from './Hero/Hero.jsx';

/**
 * HomePage Component
 * 
 * The main landing page for the Smart-Chain application. Currently displays the HeroSection,
 * showcasing the application's key features and a call-to-action. Designed as a flexible
 * container to support additional sections (e.g., features, testimonials, footer) in the future.
 * Uses Material-UI Box for layout control inspired by AdminDashboard to prevent overflow.
 */

const HomePage = () => {
    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 64px)', // Adjust for NavigationBar height (64px default)
                width: '100%',
                maxWidth: '100vw',
                overflowX: 'hidden', // Prevent horizontal overflow
                bgcolor: 'grey.50', // Consistent with AdminDashboard background
            }}
        >
            {/* Hero Section */}
            <HeroSection />

            {/* Future sections can be added here */}
            {/* Example: */}
            {/* <Box sx={{ p: 3 }}><FeaturesSection /></Box> */}
            {/* <Box sx={{ p: 3 }}><TestimonialsSection /></Box> */}
            {/* <Box sx={{ p: 3 }}><FooterSection /></Box> */}
        </Box>
    );
};

export default HomePage;