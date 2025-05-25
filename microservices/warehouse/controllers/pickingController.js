const PickingList = require('../models/pickingListModel');
const { publishEvent } = require('../services/eventService');

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
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error listing picking lists:', error);
    res.status(500).json({ message: 'Something went wrong!' });
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
    console.error('Error getting picking list:', error);
    res.status(500).json({ message: 'Something went wrong!' });
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
      await publishEvent('warehouse.picking.completed', {
        pickingListId: pickingList._id,
        orderId: pickingList.orderId,
        pickedItems: pickingList.items
      });
    }
    pickingList.updatedAt = new Date();
    await pickingList.save();
    res.json(pickingList);
  } catch (error) {
    console.error('Error updating picking list status:', error);
    res.status(500).json({ message: 'Something went wrong!' });
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
    pickingList.updatedAt = new Date();
    await pickingList.save();
    res.json(pickingList);
  } catch (error) {
    console.error('Error assigning picking list:', error);
    res.status(500).json({ message: 'Something went wrong!' });
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
    pickingList.updatedAt = new Date();
    await pickingList.save();
    res.json(pickingList);
  } catch (error) {
    console.error('Error updating picked quantity:', error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

module.exports = {
  listPickingLists,
  getPickingList,
  updatePickingListStatus,
  assignPickingList,
  updatePickedQuantity
};