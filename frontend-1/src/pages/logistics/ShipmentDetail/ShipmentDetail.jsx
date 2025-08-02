import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import { getShipment, updateShipmentStatus, scanDispatch } from '../../../services/logisticsService';
import jsQR from 'jsqr';

function ShipmentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [shipment, setShipment] = useState(null);
    const [error, setError] = useState(null);
    const [scanning, setScanning] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const allowedRoles = [ROLES.LOGISTICS_MANAGER, ROLES.ADMIN];

    // Restrict access to allowed roles
    if (!isAuthenticated || !allowedRoles.includes(user?.role)) {
        navigate('/login');
    }

    useEffect(() => {
        const fetchShipment = async () => {
            try {
                const response = await getShipment(id);
                setShipment(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load shipment');
            }
        };
        fetchShipment();
    }, [id]);

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
            handleScan(code.data);
        }
        requestAnimationFrame(scanQRCode);
    };

    const handleScan = async (qrCode) => {
        if (qrCode !== shipment.qrCode) {
            setError('Invalid QR code');
            return;
        }
        try {
            await scanDispatch(id);
            setShipment({ ...shipment, status: 'Dispatched' });
            stopScanner();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to confirm dispatch');
        }
    };

    const handleStatusUpdate = async (status) => {
        try {
            await updateShipmentStatus(id, { status });
            setShipment({ ...shipment, status });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status');
        }
    };

    if (!shipment && !error) return <div className="text-center p-6">Loading...</div>;
    if (error) return <div className="text-red-500 text-center p-6">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-primary mb-6">Shipment #{shipment.trackingNumber}</h1>
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Shipment Details</h2>
                    <p><strong>Order Number:</strong> {shipment.orderNumber}</p>
                    <p><strong>Carrier:</strong> {shipment.carrier}</p>
                    <p><strong>Service Level:</strong> {shipment.serviceLevel}</p>
                    <p><strong>Status:</strong> {shipment.status}</p>
                    <p><strong>Est. Delivery:</strong> {shipment.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Delivery Address</h2>
                    <p>{shipment.deliveryAddress.street}</p>
                    <p>{`${shipment.deliveryAddress.city}, ${shipment.deliveryAddress.state} ${shipment.deliveryAddress.zipCode}`}</p>
                    <p>{shipment.deliveryAddress.country}</p>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Tracking Events</h2>
                    {shipment.trackingEvents?.length > 0 ? (
                        <ul className="space-y-4">
                            {shipment.trackingEvents.map((event) => (
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
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Status Actions</h2>
                    <div className="space-x-2">
                        {shipment.status === 'Created' && (
                            <button
                                onClick={() => handleStatusUpdate('Dispatched')}
                                className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700"
                            >
                                Mark as Dispatched
                            </button>
                        )}
                        {shipment.status === 'Dispatched' && (
                            <button
                                onClick={() => handleStatusUpdate('InTransit')}
                                className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700"
                            >
                                Mark as In Transit
                            </button>
                        )}
                        {shipment.status === 'InTransit' && (
                            <button
                                onClick={() => handleStatusUpdate('OutForDelivery')}
                                className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700"
                            >
                                Mark as Out for Delivery
                            </button>
                        )}
                        {shipment.status === 'OutForDelivery' && (
                            <button
                                onClick={() => handleStatusUpdate('Delivered')}
                                className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700"
                            >
                                Mark as Delivered
                            </button>
                        )}
                        {['Created', 'Dispatched', 'InTransit', 'OutForDelivery'].includes(shipment.status) && (
                            <button
                                onClick={() => handleStatusUpdate('Failed')}
                                className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                            >
                                Mark as Failed
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShipmentDetail;