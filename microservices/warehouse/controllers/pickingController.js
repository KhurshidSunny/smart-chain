const PickingList = require('../models/pickingListModel');
const QRCode = require('../models/qrCodeModel');
const eventService = require('../services/eventService');

// Generate a new picking list
const generatePickingList = async (req, res) => {
  const { orderId, orderNumber, items } = req.body;
  try {
    const pickingList = new PickingList({
      orderId,
      orderNumber,
      items,
      status: 'Pending',
    });
    await pickingList.save();
    await eventService.publishEvent('PickingStarted', {
      pickingListId: pickingList._id,
      orderId,
      assignedTo: null,
    });
    res.status(201).json(pickingList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// List all picking lists
const listPickingLists = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  try {
    const query = status ? { status } : {};
    const pickingLists = await PickingList.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    const count = await PickingList.countDocuments(query);
    res.json({
      pickingLists,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get picking list details
const getPickingList = async (req, res) => {
  try {
    const pickingList = await PickingList.findById(req.params.id);
    if (!pickingList) {
      return res.status(404).json({ message: 'Picking list not found' });
    }
    res.json(pickingList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update picking list status
const updatePickingListStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const pickingList = await PickingList.findById(req.params.id);
    if (!pickingList) {
      return res.status(404).json({ message: 'Picking list not found' });
    }
    pickingList.status = status;
    if (status === 'Completed') {
      pickingList.completedAt = new Date();
      await eventService.publishEvent('PickingCompleted', {
        pickingListId: pickingList._id,
        orderId: pickingList.orderId,
        pickedItems: pickingList.items,
      });
    }
    await pickingList.save();
    res.json(pickingList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign picking list to staff
const assignPickingList = async (req, res) => {
  const { assignedTo } = req.body;
  try {
    const pickingList = await PickingList.findById(req.params.id);
    if (!pickingList) {
      return res.status(404).json({ message: 'Picking list not found' });
    }
    pickingList.assignedTo = assignedTo;
    pickingList.status = 'InProgress';
    pickingList.startedAt = new Date();
    await pickingList.save();
    await eventService.publishEvent('PickingStarted', {
      pickingListId: pickingList._id,
      orderId: pickingList.orderId,
      assignedTo,
    });
    res.json(pickingList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update picked quantity for an item
const updatePickedQuantity = async (req, res) => {
  const { itemId } = req.params;
  const { picked } = req.body;
  try {
    const pickingList = await PickingList.findById(req.params.id);
    if (!pickingList) {
      return res.status(404).json({ message: 'Picking list not found' });
    }
    const item = pickingList.items.find(item => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    item.picked = picked;
    await pickingList.save();
    res.json(pickingList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generatePickingList,
  listPickingLists,
  getPickingList,
  updatePickingListStatus,
  assignPickingList,
  updatePickedQuantity,
};