const taskService = require('../services/task');

class TaskController {
  // PUBLIC_INTERFACE
  /**
   * Get all tasks with filtering support
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getAllTasks(req, res) {
    try {
      const { status, priority, user_id, limit, offset } = req.query;
      
      const filters = {};
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (user_id) filters.user_id = parseInt(user_id);

      const options = {};
      if (limit) options.limit = parseInt(limit);
      if (offset) options.offset = parseInt(offset);

      const result = await taskService.getAllTasks(filters, options);

      res.status(200).json({
        status: 'success',
        data: result.tasks,
        meta: {
          total: result.total,
          pagination: result.pagination
        }
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch tasks'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get task by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getTaskById(req, res) {
    try {
      const { id } = req.params;
      const taskId = parseInt(id);

      if (isNaN(taskId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid task ID'
        });
      }

      const task = await taskService.getTaskById(taskId);

      res.status(200).json({
        status: 'success',
        data: task
      });
    } catch (error) {
      console.error('Error fetching task:', error);
      
      if (error.message === 'Task not found') {
        return res.status(404).json({
          status: 'error',
          message: 'Task not found'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch task'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Create a new task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async createTask(req, res) {
    try {
      const { title, description, priority, due_date, user_id } = req.body;

      // Basic validation
      if (!title || !user_id) {
        return res.status(400).json({
          status: 'error',
          message: 'Title and user_id are required'
        });
      }

      const taskData = {
        title,
        description,
        priority,
        due_date,
        user_id: parseInt(user_id)
      };

      const task = await taskService.createTask(taskData);

      res.status(201).json({
        status: 'success',
        data: task
      });
    } catch (error) {
      console.error('Error creating task:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      if (error.message.includes('required')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to create task'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update task (full update)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async updateTask(req, res) {
    try {
      const { id } = req.params;
      const taskId = parseInt(id);

      if (isNaN(taskId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid task ID'
        });
      }

      const updateData = req.body;
      const task = await taskService.updateTask(taskId, updateData);

      res.status(200).json({
        status: 'success',
        data: task
      });
    } catch (error) {
      console.error('Error updating task:', error);
      
      if (error.message === 'Task not found') {
        return res.status(404).json({
          status: 'error',
          message: 'Task not found'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to update task'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update task status only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async updateTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const taskId = parseInt(id);

      if (isNaN(taskId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid task ID'
        });
      }

      if (!status) {
        return res.status(400).json({
          status: 'error',
          message: 'Status is required'
        });
      }

      const task = await taskService.updateTaskStatus(taskId, status);

      res.status(200).json({
        status: 'success',
        data: task
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      
      if (error.message === 'Task not found') {
        return res.status(404).json({
          status: 'error',
          message: 'Task not found'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to update task status'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async deleteTask(req, res) {
    try {
      const { id } = req.params;
      const taskId = parseInt(id);

      if (isNaN(taskId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid task ID'
        });
      }

      await taskService.deleteTask(taskId);

      res.status(200).json({
        status: 'success',
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      
      if (error.message === 'Task not found') {
        return res.status(404).json({
          status: 'error',
          message: 'Task not found'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to delete task'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get task statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getTaskStats(req, res) {
    try {
      const { user_id } = req.query;
      const userId = user_id ? parseInt(user_id) : null;

      const stats = await taskService.getTaskStats(userId);

      res.status(200).json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      console.error('Error fetching task stats:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch task statistics'
      });
    }
  }
}

module.exports = new TaskController();
