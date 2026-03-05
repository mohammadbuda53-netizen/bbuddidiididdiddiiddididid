const express = require('express');
const { body, validationResult } = require('express-validator');
const InventoryItem = require('../models/inventoryItem');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all inventory items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const inventoryItems = await InventoryItem.findAll();
    res.json(inventoryItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory item by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id);
    
    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory items for a specific project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const id = parseInt(projectId);
    
    const items = await InventoryItem.findByProjectId(id);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new inventory item
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1 }).withMessage('Item name is required'),
  body('serial_number').optional().trim(),
  body('description').optional().trim(),
  body('status').optional().isIn(['available', 'in-use', 'damaged', 'missing']).withMessage('Status must be available, in-use, damaged or missing'),
  body('project_id').optional().isInt({ min: 0 }), // 0 means not assigned to any project
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const item = await InventoryItem.create(req.body);
    res.status(201).json({
      message: 'Inventory item created successfully',
      item
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('serial_number').optional().trim(),
  body('description').optional().trim(),
  body('status').optional().isIn(['available', 'in-use', 'damaged', 'missing']),
  body('project_id').optional().isInt({ min: 0 }),
  body('quantity').optional().isInt({ min: 1 }),
  body('location').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const itemId = parseInt(id);
    
    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const updatedItem = await InventoryItem.update(itemId, req.body);
    res.json({
      message: 'Inventory item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id);
    
    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    await InventoryItem.delete(itemId);
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;