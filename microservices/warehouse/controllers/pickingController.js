const PickingList = require('../models/pickingListModel');
const { publishEvent } = require('../services/eventService');

// List all picking lists - filtered by role
const listPickingLists = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  try {
    let query = status ? { status } : {};

    // If user is warehouse staff, only show picking lists assigned to them
    if (req.user.role === 'warehouse_staff') {
      query.assignedTo = req.user.sub || req.user.id;
    }

    const pickingLists = await PickingList.find(query)
      .populate('assignedTo', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    console.log(query)

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

// Get picking list details - with role-based access
const getPickingList = async (req, res) => {
  try {
    let query = { _id: req.params.id };

    // If user is warehouse staff, only allow access to their assigned picking lists
    if (req.user.role === 'warehouse_staff') {
      query.assignedTo = req.user.sub || req.user.id;
    }

    const pickingList = await PickingList.findOne(query)
      .populate('assignedTo', 'firstName lastName');

    if (!pickingList) {
      return res.status(404).json({ message: 'Picking list not found or not assigned to you' });
    }

    res.json(pickingList);
  } catch (error) {
    console.error('Error getting picking list:', error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Update picking list status - warehouse staff can update their own
const updatePickingListStatus = async (req, res) => {
  const { status } = req.body;
  try {
    let query = { _id: req.params.id };

    // If user is warehouse staff, only allow updating their assigned picking lists
    if (req.user.role === 'warehouse_staff') {
      query.assignedTo = req.user.sub || req.user.id;
    }

    const pickingList = await PickingList.findOne(query);
    if (!pickingList) {
      return res.status(404).json({ message: 'Picking list not found or not assigned to you' });
    }

    pickingList.status = status;
    if (status === 'Completed') {
      pickingList.completedAt = new Date();
      await publishEvent('warehouse.picking.completed', {
        pickingListId: pickingList._id,
        orderId: pickingList.orderId,
        pickedItems: pickingList.items,
        completedBy: req.user.sub || req.user.id
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

// Assign picking list to staff - only managers and admins
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

// Update picked quantity for an item - warehouse staff can update their assigned lists
const updatePickedQuantity = async (req, res) => {
  const { itemId } = req.params;
  const { picked } = req.body;
  try {
    let query = { _id: req.params.id };

    // If user is warehouse staff, only allow updating their assigned picking lists
    if (req.user.role === 'warehouse_staff') {
      query.assignedTo = req.user.sub || req.user.id;
    }

    const pickingList = await PickingList.findOne(query);
    if (!pickingList) {
      return res.status(404).json({ message: 'Picking list not found or not assigned to you' });
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