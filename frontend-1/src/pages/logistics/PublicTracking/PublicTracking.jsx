import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrackingInfo, confirmDelivery } from '../../../services/logisticsService';
import jsQR from 'jsqr';

function PublicTracking() {
    const navigate = useNavigate();
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [error, setError] = useState(null);
    const [scanning, setScanning] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const handleSearch = async () => {
        try {
            const response = await getTrackingInfo(trackingNumber);
            setTrackingInfo(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid tracking number');
            setTrackingInfo(null);
        }
    };

    const startScanner = () => {
        setScanning(true);
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((stream) => {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            scanQRCode();
        }).catch((err) => {
            setError('Failed to access camera: ' + err.message);
            setScanning(false);
        });
    };

    const stopScanner = () => {
        setScanning(false);
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        }
    };

    const scanQRCode = () => {
        if (!scanning) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
            handleDeliveryConfirmation(code.data);
        }
        requestAnimationFrame(scanQRCode);
    };

    const handleDeliveryConfirmation = async (qrCode) => {
        if (!trackingInfo || qrCode !== trackingInfo.qrCode) {
            setError('Invalid QR code');
            return;
        }
        try {
            await confirmDelivery(trackingInfo.shipmentId);
            setTrackingInfo({ ...trackingInfo, status: 'Delivered' });
            stopScanner();
            navigate('/feedback/submit'); // Redirect to feedback submission
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to confirm delivery');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-primary mb-6">Track Your Order</h1>
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Enter tracking number"
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700"
                        >
                            Search
                        </button>
                    </div>
                </div>
                {error && <div className="text-red-500">{error}</div>}
                {trackingInfo && (
                    <>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">Order Details</h2>
                            <p><strong>Order Number:</strong> {trackingInfo.orderNumber}</p>
                            <p><strong>Status:</strong> {trackingInfo.status}</p>
                            <p><strong>Carrier:</strong> {trackingInfo.carrier}</p>
                            <p><strong>Service Level:</strong> {trackingInfo.serviceLevel}</p>
                            <p><strong>Est. Delivery:</strong> {trackingInfo.estimatedDeliveryDate ? new Date(trackingInfo.estimatedDeliveryDate).toLocaleString() : 'N/A'}</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">Delivery Address</h2>
                            <p>{trackingInfo.deliveryAddress.street}</p>
                            <p>{`${trackingInfo.deliveryAddress.city}, ${trackingInfo.deliveryAddress.state} ${trackingInfo.deliveryAddress.zipCode}`}</p>
                            <p>{trackingInfo.deliveryAddress.country}</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">Tracking Events</h2>
                            {trackingInfo.trackingEvents?.length > 0 ? (
                                <ul className="space-y-4">
                                    {trackingInfo.trackingEvents.map((event) => (
                                        <li key={event._id} className="border-l-4 border-primary pl-4">
                                            <p><strong>Status:</strong> {event.status}</p>
                                            <p><strong>Location:</strong> {event.location || 'N/A'}</p>
                                            <p><strong>Time:</strong> {new Date(event.timestamp).toLocaleString()}</p>
                                            {event.notes && <p><strong>Notes:</strong> {event.notes}</p>}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No tracking events available.</p>
                            )}
                        </div>
                        {trackingInfo.status === 'OutForDelivery' && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mb-2">Confirm Delivery</h2>
                                {scanning ? (
                                    <div className="flex flex-col items-center">
                                        <video ref={videoRef} className="w-64 h-64 mb-2" />
                                        <canvas ref={canvasRef} className="hidden" width="640" height="480" />
                                        <button
                                            onClick={stopScanner}
                                            className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                                        >
                                            Stop Scanner
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={startScanner}
                                        className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700"
                                    >
                                        Scan QR Code to Confirm Delivery
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default PublicTracking;