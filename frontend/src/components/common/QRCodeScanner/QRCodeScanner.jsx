import React, { useEffect, useState, useRef } from 'react';
import Quagga from 'quagga';
import {
    Box,
    Button,
    TextField,
    Typography,
    CircularProgress,
    Alert,
} from '@mui/material';

const QRCodeScanner = ({ onScan, onError }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [error, setError] = useState(null);
    const videoRef = useRef(null);

    // Initialize Quagga scanner
    useEffect(() => {
        if (isScanning) {
            Quagga.init(
                {
                    inputStream: {
                        name: 'Live',
                        type: 'LiveStream',
                        target: videoRef.current,
                        constraints: {
                            width: 640,
                            height: 480,
                            facingMode: 'environment', // Use rear camera if available
                        },
                    },
                    decoder: {
                        readers: ['code_128_reader', 'ean_reader', 'qr_code_reader'], // Add more as needed
                    },
                    locator: {
                        patchSize: 'medium',
                        halfSample: true,
                    },
                    numOfWorkers: navigator.hardwareConcurrency || 4,
                    locate: true,
                },
                (err) => {
                    if (err) {
                        setError('Failed to initialize scanner: ' + err.message);
                        onError?.(err);
                        setIsScanning(false);
                        return;
                    }
                    Quagga.start();
                }
            );

            Quagga.onDetected((result) => {
                const code = result.codeResult.code;
                onScan(code);
                Quagga.stop();
                setIsScanning(false);
            });

            Quagga.onProcessed((result) => {
                // Optional: Add visual feedback (e.g., bounding box) if needed
            });
        }

        // Cleanup on unmount or stop
        return () => {
            if (isScanning) {
                Quagga.stop();
            }
        };
    }, [isScanning, onScan, onError]);

    const handleStartScanning = () => {
        setError(null);
        setIsScanning(true);
    };

    const handleStopScanning = () => {
        Quagga.stop();
        setIsScanning(false);
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualCode.trim()) {
            onScan(manualCode.trim());
            setManualCode('');
        } else {
            setError('Please enter a valid QR code');
        }
    };

    return (
        <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h6" gutterBottom>
                QR Code Scanner
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 640,
                    height: 480,
                    border: '2px solid grey',
                    borderRadius: 1,
                    overflow: 'hidden',
                    mb: 2,
                }}
            >
                <div ref={videoRef} style={{ width: '100%', height: '100%' }} />
                {isScanning && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            border: '2px dashed red',
                            width: '50%',
                            height: '50%',
                            pointerEvents: 'none',
                        }}
                    />
                )}
            </Box>

            {!isScanning ? (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleStartScanning}
                    sx={{ mb: 2 }}
                >
                    Start Scanning
                </Button>
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                    <CircularProgress size={24} />
                    <Button variant="outlined" color="secondary" onClick={handleStopScanning}>
                        Stop Scanning
                    </Button>
                </Box>
            )}

            <Typography variant="subtitle1" gutterBottom>
                Or enter code manually:
            </Typography>
            <form onSubmit={handleManualSubmit}>
                <TextField
                    label="QR Code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 1, width: '100%', maxWidth: 300 }}
                    disabled={isScanning}
                />
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isScanning || !manualCode.trim()}
                >
                    Submit
                </Button>
            </form>
        </Box>
    );
};

export default QRCodeScanner;