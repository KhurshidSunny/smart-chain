const QRCode = require('../models/qrCodeModel');
const eventService = require('../services/eventService');
const qrcode = require('qrcode');

// Generate a QR code
const generateQRCode = async (req, res) => {
  const { entityType, entityId } = req.body;
  try {
    const code = `${entityType}-${entityId}-${Date.now()}`;
    const qrCodeUrl = await qrcode.toDataURL(code);
    const qrCodeRecord = new QRCode({
      code,
      entityType,
      entityId,
    });
    await qrCodeRecord.save();
    res.status(201).json({ code, qrCodeUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get QR code details
const getQRCode = async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ code: req.params.code });
    if (!qrCode) {
      return res.status(404).json({ message: 'QR Code not found' });
    }
    res.json(qrCode);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Record a QR code scan
const recordQRCodeScan = async (req, res) => {
  const { location, scannedBy } = req.body;
  try {
    const qrCode = await QRCode.findOne({ code: req.params.code });
    if (!qrCode) {
      return res.status(404).json({ message: 'QR Code not found' });
    }
    qrCode.scanHistory.push({ location, scannedBy, timestamp: new Date() });
    await qrCode.save();

    await eventService.publishEvent('QRCodeScanned', {
      code: qrCode.code,
      entityType: qrCode.entityType,
      entityId: qrCode.entityId,
      location,
      scannedBy,
    });

    res.json(qrCode);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get QR code scan history
const getQRCodeHistory = async (req, res) => {
  try {
    const qrCode = await QRCode.findOne({ code: req.params.code });
    if (!qrCode) {
      return res.status(404).json({ message: 'QR Code not found' });
    }
    res.json(qrCode.scanHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateQRCode,
  getQRCode,
  recordQRCodeScan,
  getQRCodeHistory,
};