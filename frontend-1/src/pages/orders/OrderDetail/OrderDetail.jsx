import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import { getOrder } from '../../../services/orderService';
import { QRCodeSVG } from 'qrcode.react';

function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [order, setOrder] = useState(null);
    const [error, setError] = useState(null);
    const qrRef = useRef(null);
    const allowedRoles = [ROLES.CUSTOMER, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.ADMIN];

    // Restrict access to allowed roles and ensure customers only see their own orders
    useEffect(() => {
        if (!isAuthenticated || !allowedRoles.includes(user?.role) ||
            (user?.role === ROLES.CUSTOMER && order?.customerId._id !== user?._id)) {
            navigate('/login');
        }
    }, [isAuthenticated, user, order, navigate, allowedRoles]);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await getOrder(id);
                setOrder(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load order');
            }
        };
        fetchOrder();
    }, [id]);

    const downloadQRCode = () => {
        if (!qrRef.current) {
            console.error('QR Code reference not found');
            return;
        }

        const svg = qrRef.current.querySelector('svg');
        if (!svg) {
            console.error('SVG element not found');
            return;
        }

        // Clone the SVG to avoid modifying the original
        const svgClone = svg.cloneNode(true);

        // Set explicit dimensions
        svgClone.setAttribute('width', '128');
        svgClone.setAttribute('height', '128');

        // Create a canvas with extra padding
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const padding = 10; // White padding around the QR code
        canvas.width = 128 + (padding * 2);
        canvas.height = 128 + (padding * 2);

        // Set white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Convert SVG to data URL
        const svgData = new XMLSerializer().serializeToString(svgClone);
        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(svgData);

        // Create image and draw to canvas with padding
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, padding, padding, 128, 128);

            // Create download link
            const link = document.createElement('a');
            link.download = `order-${order.orderNumber}-qrcode.png`;
            link.href = canvas.toDataURL('image/png');

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        img.onerror = (e) => {
            console.error('Failed to load SVG image:', e);
        };

        img.src = svgDataUrl;
    };

    if (!order && !error) return <div className="text-center p-6">Loading...</div>;
    if (error) return <div className="text-red-500 text-center p-6">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-primary mb-6">Order #{order.orderNumber}</h1>
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Order Details</h2>
                    <p><strong>Status:</strong> {order.status}</p>
                    <p><strong>Customer:</strong> {order.customerId.firstName} {order.customerId.lastName}</p>
                    <p><strong>Total:</strong> ${order.totalAmount.toFixed(2)}</p>
                    <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Items</h2>
                    <ul className="space-y-2">
                        {order.items.map((item, index) => (
                            <li key={index} className="flex justify-between">
                                <span>{item.name} (x{item.quantity})</span>
                                <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Shipping Address</h2>
                    <p>{order.shippingAddress.street}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.zipCode}</p>
                    <p>{order.shippingAddress.country}</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">QR Code</h2>
                    <div className="flex flex-col items-center space-y-4">
                        <div ref={qrRef} className="p-8 bg-white border-2 border-gray-200 rounded-lg">
                            <QRCodeSVG
                                value={order.qrCode}
                                size={128}
                                bgColor="#ffffff"
                                fgColor="#000000"
                                level="M"
                            />
                        </div>
                        <button
                            onClick={downloadQRCode}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                        >
                            Download QR Code
                        </button>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Status Timeline</h2>
                    <ul className="space-y-2">
                        {order.history?.map((event, index) => (
                            <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="font-medium">{event.status}</span>
                                <span className="text-sm text-gray-600">{new Date(event.timestamp).toLocaleString()}</span>
                            </li>
                        )) || <p className="text-gray-500">No status updates available</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default OrderDetail;