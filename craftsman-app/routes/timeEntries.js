const express = require('express');
const { body, validationResult } = require('express-validator');
const TimeEntry = require('../models/timeEntry');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all time entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const timeEntries = await TimeEntry.findAll();
    res.json(timeEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get time entry by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const timeEntryId = parseInt(id);
    
    const timeEntry = await TimeEntry.findById(timeEntryId);
    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    res.json(timeEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get time entries for a specific user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const id = parseInt(userId);
    
    // Check if requesting user is admin or requesting their own data
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const timeEntries = await TimeEntry.findByUserId(id);
    res.json(timeEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get time entries for a specific project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const id = parseInt(projectId);
    
    const timeEntries = await TimeEntry.findByProjectId(id);
    res.json(timeEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new time entry
router.post('/', authenticateToken, [
  body('project_id').isInt({ min: 1 }).withMessage('Valid project ID is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('task_description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Auto assign user_id to current user if not provided or not admin
    let timeEntryData = { ...req.body };
    if (!req.body.user_id || req.user.role !== 'admin') {
      timeEntryData.user_id = req.user.id;
    }

    // Validate that dates are properly formatted and valid range
    const startDate = new Date(req.body.start_date);
    const endDate = new Date(req.body.end_date);
    if (startDate > endDate) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const timeEntry = await TimeEntry.create(timeEntryData);
    res.status(201).json({
      message: 'Time entry created successfully',
      timeEntry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update time entry
router.put('/:id', authenticateToken, [
  body('project_id').optional().isInt({ min: 1 }),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('task_description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const timeEntryId = parseInt(id);
    
    const timeEntry = await TimeEntry.findById(timeEntryId);
    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    // Prevent unauthorized users from updating others' records
    if (req.user.role !== 'admin' && timeEntry.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate date range if provided
    if (req.body.start_date && req.body.end_date) {
      const startDate = new Date(req.body.start_date);
      const endDate = new Date(req.body.end_date);
      if (startDate > endDate) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
    }

    const updatedTimeEntry = await TimeEntry.update(timeEntryId, req.body);
    res.json({
      message: 'Time entry updated successfully',
      timeEntry: updatedTimeEntry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete time entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const timeEntryId = parseInt(id);
    
    const timeEntry = await TimeEntry.findById(timeEntryId);
    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    // Prevent unauthorized users from deleting others' records
    if (req.user.role !== 'admin' && timeEntry.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await TimeEntry.delete(timeEntryId);
    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;