const Package = require('../models/packageModel');
const QRCode = require('../models/qrCodeModel');
const eventService = require('../services/eventService');
const qrcode = require('qrcode');

// Create a package record
const createPackage = async (req, res) => {
  const { orderId, packagingType, dimensions, packedBy } = req.body;
  try {
    const qrCodeData = `${orderId}-${Date.now()}`;
    const qrCodeUrl = await qrcode.toDataURL(qrCodeData);
    const qrCodeRecord = new QRCode({
      code: qrCodeData,
      entityType: 'Package',
      entityId: orderId,
    });
    await qrCodeRecord.save();

    const packageRecord = new Package({
      orderId,
      packagingType,
      dimensions,
      qrCode: qrCodeData,
      packedBy,
      packedAt: new Date(),
    });
    await packageRecord.save();

    await eventService.publishEvent('OrderPacked', {
      orderId,
      packageId: packageRecord._id,
      qrCode: qrCodeData,
      dimensions,
    });

    res.status(201).json(packageRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    await packageRecord.save();
    res.json(packageRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPackage,
  listPackages,
  getPackage,
  updatePackage,
};