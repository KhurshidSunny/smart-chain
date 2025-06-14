import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import { getPickingList, updatePickedItem } from '../../../services/warehouseService';
import jsQR from 'jsqr';

function PickingListDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [pickingList, setPickingList] = useState(null);
    const [error, setError] = useState(null);
    const [scanning, setScanning] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const allowedRoles = [ROLES.WAREHOUSE_STAFF, ROLES.WAREHOUSE_MANAGER, ROLES.ADMIN];

    useEffect(() => {
        // Restrict access to allowed roles
        if (!isAuthenticated || !allowedRoles.includes(user?.role)) {
            navigate('/login');
        }
    }, [isAuthenticated, user, navigate, allowedRoles]);

    useEffect(() => {
        const fetchPickingList = async () => {
            try {
                const response = await getPickingList(id);
                setPickingList(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load picking list');
            }
        };
        fetchPickingList();
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
        const item = pickingList.items.find((item) => item.qrCode === qrCode);
        if (!item) {
            setError('Invalid QR code');
            return;
        }
        try {
            await updatePickedItem(id, item.productId, { picked: item.picked + 1 });
            setPickingList({
                ...pickingList,
                items: pickingList.items.map((i) =>
                    i.productId === item.productId ? { ...i, picked: i.picked + 1 } : i
                ),
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update picked item');
        }
    };

    const handleManualUpdate = async (itemId, picked) => {
        try {
            await updatePickedItem(id, itemId, { picked });
            setPickingList({
                ...pickingList,
                items: pickingList.items.map((i) =>
                    i.productId === itemId ? { ...i, picked } : i
                ),
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update picked item');
        }
    };

    if (!pickingList && !error) return <div className="text-center p-6">Loading...</div>;
    if (error) return <div className="text-red-500 text-center p-6">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-primary mb-6">Picking List #{pickingList.orderNumber}</h1>
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Order Details</h2>
                    <p><strong>Status:</strong> {pickingList.status}</p>
                    <p><strong>Assigned To:</strong> {pickingList.assignedTo || 'Unassigned'}</p>
                    <p><strong>Created:</strong> {new Date(pickingList.createdAt).toLocaleString()}</p>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Items to Pick</h2>
                    <ul className="space-y-4">
                        {pickingList.items.map((item) => (
                            <li key={item.productId} className="flex justify-between items-center">
                                <div>
                                    <p>{item.name} (SKU: {item.sku})</p>
                                    <p>Location: {item.location}</p>
                                    <p>Quantity: {item.quantity} | Picked: {item.picked}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <input
                                        type="number"
                                        min="0"
                                        max={item.quantity}
                                        value={item.picked}
                                        onChange={(e) => handleManualUpdate(item.productId, parseInt(e.target.value))}
                                        className="w-16 p-1 border rounded"
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">QR Code Scanner</h2>
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
                            Start QR Code Scanner
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PickingListDetail;