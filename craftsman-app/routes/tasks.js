const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/task');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all tasks
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.findAll();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id);
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks for a specific project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const id = parseInt(projectId);
    
    const tasks = await Task.findByProjectId(id);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks assigned to a specific user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const id = parseInt(userId);
    
    // Check if requesting user is admin or requesting their own data
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await Task.findByUserId(id);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new task
router.post('/', authenticateToken, [
  body('name').trim().isLength({ min: 1 }).withMessage('Task name is required'),
  body('description').optional().trim(),
  body('due_date').optional().isISO8601().withMessage('Valid due date is required if provided'),
  body('assigned_to').optional().isInt({ min: 1 }).withMessage('Valid user ID for assignment is required if provided'),
  body('project_id').isInt({ min: 1 }).withMessage('Valid project ID is required'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Status must be pending, in-progress, or completed')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.create(req.body);
    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
router.put('/:id', authenticateToken, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('due_date').optional().isISO8601(),
  body('assigned_to').optional().isInt({ min: 1 }),
  body('project_id').optional().isInt({ min: 1 }),
  body('status').optional().isIn(['pending', 'in-progress', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const taskId = parseInt(id);
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Allow users to only update status for tasks assigned to them
    if (req.user.id === task.assigned_to && Object.keys(req.body).length === 1 && req.body.status) {
      // User can update task status
    } else if (req.user.role !== 'admin' && req.user.id !== task.assigned_to) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedTask = await Task.update(taskId, req.body);
    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id);
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Task.delete(taskId);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;