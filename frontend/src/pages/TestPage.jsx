import React from 'react';
import { Box, Button } from '@mui/material';
import NavigationBar from '../components/common/NavigationBar/NavigationBar';
import SearchBar from '../components/common/SearchBar/SearchBar';
import ConfirmationDialog from '../components/common/ConfirmationDialog/ConfirmationDialog';
import ErrorMessage from '../components/common/ErrorMessage/ErrorMessage';
import LoadingIndicator from '../components/common/LoadingIndicator/LoadingIndicator';

const TestPage = () => {
    const [dialogOpen, setDialogOpen] = React.useState(false);

    return (
        <Box>
            <NavigationBar />
            <SearchBar placeholder="Search..." />
            <Button onClick={() => setDialogOpen(true)}>Test Dialog</Button>
            <ConfirmationDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onConfirm={() => console.log('Confirmed')}
                title="Test"
                message="This is a test dialog."
            />
            <ErrorMessage message="Test error" onRetry={() => console.log('Retry')} />
            <LoadingIndicator />
        </Box>
    );
};

export default TestPage;