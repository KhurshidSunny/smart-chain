import React, { useRef, useEffect } from 'react';
import { Card, CardContent, Typography, Button } from '@mui/material';
import { Print } from '@mui/icons-material';
import QRCode from 'qrcode';

function QRCodeCard({ orderId }) {
  const qrRef = useRef();

  useEffect(() => {
    QRCode.toCanvas(qrRef.current, `order:${orderId}`, { width: 150 }, (err) => {
      if (err) console.error('QR Code generation failed:', err);
    });
  }, [orderId]);

  const printQRCode = () => {
    const canvas = qrRef.current;
    const imgData = canvas.toDataURL('image/png');
    const win = window.open('');
    win.document.write(`<img src="${imgData}" onload="window.print();window.close()" />`);
  };

  return (
    <Card sx={{ bgcolor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#1976d2', mb: 2 }}>
          QR Code
        </Typography>
        <canvas ref={qrRef} style={{ width: 150, height: 150, marginBottom: 16 }} />
        <Button
          variant="outlined"
          startIcon={<Print />}
          onClick={printQRCode}
          sx={{ color: '#757575', borderColor: '#757575', '&:hover': { borderColor: '#616161', bgcolor: '#e0e0e0' } }}
        >
          Print QR Code
        </Button>
      </CardContent>
    </Card>
  );
}

export default QRCodeCard;