const Package = require('../models/packageModel');
const { publishEvent } = require('../services/eventService');

// Create a package record
const createPackage = async (req, res) => {
  const { orderId, packagingType, dimensions, packedBy, qrCode, shippingAddress } = req.body;
  try {
    const packageRecord = new Package({
      orderId,
      packagingType,
      dimensions,
      packedBy,
      packedAt: new Date(),
      shippingAddress,
    });
    await packageRecord.save();

    await publishEvent('warehouse.order.packed', {
      orderId,
      packageId: packageRecord._id,
      qrCode, // QR code from order
      dimensions,
      shippingAddress
    });

    res.status(201).json(packageRecord);
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

// List packages
const listPackages = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const packages = await Package.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await Package.countDocuments();
    res.json({
      packages,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error listing packages:', error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Get package details
const getPackage = async (req, res) => {
  try {
    const packageRecord = await Package.findById(req.params.id);
    if (!packageRecord) {
      return res.status(404).json({ message: 'Package not found' });
    }
    res.json(packageRecord);
  } catch (error) {
    console.error('Error getting package:', error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Update package information
const updatePackage = async (req, res) => {
  const { packagingType, dimensions } = req.body;
  try {
    const packageRecord = await Package.findById(req.params.id);
    if (!packageRecord) {
      return res.status(404).json({ message: 'Package not found' });
    }
    packageRecord.packagingType = packagingType || packageRecord.packagingType;
    packageRecord.dimensions = dimensions || packageRecord.dimensions;
    packageRecord.updatedAt = new Date();
    await packageRecord.save();
    res.json(packageRecord);
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

module.exports = {
  createPackage,
  listPackages,
  getPackage,
  updatePackage
};