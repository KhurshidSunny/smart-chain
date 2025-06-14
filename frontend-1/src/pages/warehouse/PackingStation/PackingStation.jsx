import { use, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import { getPickingLists, createPackage } from '../../../services/warehouseService';
import { QRCodeSVG } from 'qrcode.react';

function PackingStation() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [pickingLists, setPickingLists] = useState([]);
    const [selectedList, setSelectedList] = useState(null);
    const [packageData, setPackageData] = useState({
        packagingType: 'box',
        width: 0,
        height: 0,
        depth: 0,
        weight: 0,
    });
    const [error, setError] = useState(null);
    const allowedRoles = [ROLES.WAREHOUSE_STAFF, ROLES.WAREHOUSE_MANAGER, ROLES.ADMIN];

    useEffect(() => {
        // Restrict access to allowed roles
        if (!isAuthenticated || !allowedRoles.includes(user?.role)) {
            navigate('/login');
        }
    }, [isAuthenticated, user, navigate, allowedRoles]);

    useEffect(() => {
        const fetchPickingLists = async () => {
            try {
                const response = await getPickingLists({ status: 'Completed' });
                setPickingLists(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load picking lists');
            }
        };
        fetchPickingLists();
    }, []);

    const handleCreatePackage = async () => {
        try {
            const response = await createPackage({
                orderId: selectedList.orderId,
                packagingType: packageData.packagingType,
                dimensions: {
                    width: packageData.width,
                    height: packageData.height,
                    depth: packageData.depth,
                    weight: packageData.weight,
                },
                shippingAddress: selectedList.items[0].shippingAddress,
            });
            setSelectedList({ ...selectedList, package: response.data });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create package');
        }
    };

    if (error) return <div className="text-red-500 text-center p-6">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-primary mb-6">Packing Station</h1>
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Select Order</h2>
                    <select
                        onChange={(e) => setSelectedList(pickingLists.find((list) => list._id === e.target.value))}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Select a completed picking list</option>
                        {
                            pickingLists.length > 0 ?
                                pickingLists.map((list) => (
                                    <option key={list._id} value={list._id}>
                                        Order #{list.orderNumber}
                                    </option>
                                ))
                                : ''
                        }
                    </select>
                </div>
                {selectedList && (
                    <>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">Order Details</h2>
                            <p><strong>Order Number:</strong> {selectedList.orderNumber}</p>
                            <p><strong>Items:</strong> {selectedList.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-2">Package Details</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Packaging Type</label>
                                    <select
                                        value={packageData.packagingType}
                                        onChange={(e) => setPackageData({ ...packageData, packagingType: e.target.value })}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="box">Box</option>
                                        <option value="envelope">Envelope</option>
                                        <option value="pallet">Pallet</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Width (cm)</label>
                                        <input
                                            type="number"
                                            value={packageData.width}
                                            onChange={(e) => setPackageData({ ...packageData, width: parseFloat(e.target.value) })}
                                            className="w-full p-2 border rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                                        <input
                                            type="number"
                                            value={packageData.height}
                                            onChange={(e) => setPackageData({ ...packageData, height: parseFloat(e.target.value) })}
                                            className="w-full p-2 border rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Depth (cm)</label>
                                        <input
                                            type="number"
                                            value={packageData.depth}
                                            onChange={(e) => setPackageData({ ...packageData, depth: parseFloat(e.target.value) })}
                                            className="w-full p-2 border rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                                        <input
                                            type="number"
                                            value={packageData.weight}
                                            onChange={(e) => setPackageData({ ...packageData, weight: parseFloat(e.target.value) })}
                                            className="w-full p-2 border rounded"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleCreatePackage}
                                    className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700"
                                >
                                    Create Package
                                </button>
                            </div>
                        </div>
                        {selectedList.package && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700 mb-2">Package QR Code</h2>
                                <div className="flex justify-center">
                                    <QRCodeSVG value={selectedList.package.qrCode} size={128} />
                                </div>
                                <button
                                    onClick={() => {
                                        const canvas = document.querySelector('canvas');
                                        const link = document.createElement('a');
                                        link.href = canvas.toDataURL('image/png');
                                        link.download = `package-${selectedList.orderNumber}-qrcode.png`;
                                        link.click();
                                    }}
                                    className="mt-2 bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700"
                                >
                                    Download QR Code
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default PackingStation;